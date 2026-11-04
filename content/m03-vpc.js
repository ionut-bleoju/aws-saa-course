(function (N) {
  const net = (mod) => N.make("threeTier", mod);
  const withAppB = n => {
    n.nodes.push({ id: "app-b", name: "App server B", tier: "app", kind: "ec2", subnet: "priv-b", ip: "10.0.12.20", pub: false, sgs: ["sg-app"] });
    n.rts["rt-private-b"].routes = [{ dest: "0.0.0.0/0", target: "nat-a" }];
  };
  const webNacl = n => {
    n.nacls["acl-web"] = { name: "Web NACL", in: [{ n: 100, port: "443", cidr: "0.0.0.0/0", allow: true }], out: [{ n: 100, port: "443", cidr: "0.0.0.0/0", allow: true }] };
    N.subnet(n, "pub-a").nacl = "acl-web";
  };

  SAA.addModule({
    id: "m03", num: 3, title: "Networking: VPC & gateways", sub: "Private networks and how traffic gets in and out",
    lessons: [
      {
        id: "vpc-subnets", title: "VPC, IP ranges and subnets", min: 3,
        tryFirst: {
          type: "mcq",
          q: `A team wants a single subnet that spans all three Availability Zones, so instances can be placed anywhere. Is this possible?`,
          options: [
            { t: `No, each subnet lives in exactly one AZ; you create one per AZ`, ok: true, why: `To spread across AZs, you create a subnet in each AZ and place instances (or let Auto Scaling place them) across those subnets.` },
            { t: `Yes, if the subnet is large enough`, ok: false, why: `Size doesn't matter. Subnets are always tied to one AZ.` },
            { t: `Yes, but only in the default VPC`, ok: false, why: `The default VPC also has one subnet per AZ.` },
            { t: `No, a VPC can only use one AZ`, ok: false, why: `A VPC spans all AZs in its Region. It's subnets that are limited to one AZ.` },
          ],
        },
        body: `<p>A <strong>VPC</strong> (Virtual Private Cloud) is your own private network inside one Region. Nothing can get in or out until you add the pieces that allow it, which is what this whole module is about.</p>
<p>When you create a VPC, you give it a range of private IP addresses written in <strong>CIDR</strong> notation, like <code>10.0.0.0/16</code>. The number after the slash says how many bits are fixed; the rest are free for addresses. Each step down doubles the size: a /24 has 256 addresses, a /23 has 512, a /25 has 128.</p>
<div class="tablewrap"><table><thead><tr><th>CIDR</th><th>Addresses</th><th>Typical use</th></tr></thead><tbody>
<tr><td><code>/16</code></td><td>65,536</td><td>A whole VPC (the largest allowed)</td></tr>
<tr><td><code>/24</code></td><td>256</td><td>One subnet</td></tr>
<tr><td><code>/28</code></td><td>16</td><td>The smallest subnet allowed</td></tr>
</tbody></table></div>
<p>You then split the VPC into <strong>subnets</strong>. Each subnet gets a slice of the VPC's range (it must fit inside it, without overlapping other subnets) and lives in exactly <strong>one AZ</strong>; a subnet can never span AZs. AWS reserves <strong>5 addresses in every subnet</strong> (the first four and the last one) for routing, DNS and future use, so a <code>/24</code> subnet gives you 251 usable addresses, not 256.</p>
<p>Every Region also comes with a <strong>default VPC</strong> that has a public subnet in each AZ, so you can launch things immediately. Real workloads normally use custom VPCs.</p>`,
        example: `<p>A typical production layout: VPC <code>10.0.0.0/16</code> across 3 AZs, with 6 subnets: one public and one private in each AZ, e.g. <code>10.0.1.0/24</code> (public, AZ a), <code>10.0.11.0/24</code> (private, AZ a), and so on. Load balancers go in the public subnets; app servers and databases in the private ones.</p>`,
        concepts: [
          {
            id: "subnets-az", title: "Subnets live in one AZ, inside the VPC range", domain: "resilient",
            variants: [
              {
                type: "mcq", level: 1,
                q: `An Auto Scaling group must spread instances across 3 AZs in a custom VPC. What's the minimum number of subnets it needs?`,
                options: [
                  { t: `3, one in each AZ`, ok: true, why: `A subnet is tied to one AZ, so covering 3 AZs takes 3 subnets.` },
                  { t: `1 large subnet`, ok: false, why: `One subnet can only be in one AZ.` },
                  { t: `6, a public and a private one per AZ`, ok: false, why: `That's a common layout, but the question is the minimum for spreading instances.` },
                  { t: `None; Auto Scaling creates subnets itself`, ok: false, why: `You choose existing subnets for the group.` },
                ],
              },
              {
                type: "multi", level: 3,
                q: `Which statements about subnets are true?`,
                options: [
                  { t: `Each subnet sits in exactly one AZ`, ok: true, why: `Always.` },
                  { t: `A subnet's range must fit inside the VPC's range`, ok: true, why: `Subnets are slices of the VPC's CIDR.` },
                  { t: `A large enough subnet can span two AZs`, ok: false, why: `Never, whatever its size.` },
                  { t: `Subnets in one VPC can't talk to each other by default`, ok: false, why: `Every route table has a local route, so all subnets in a VPC can reach each other (if firewalls allow).` },
                ],
              },
              {
                type: "spot", level: 2, unit: "subnet",
                q: `Planned subnets for VPC <code>10.0.0.0/16</code>. Which one won't work?`,
                cols: ["Name", "CIDR", "AZ"],
                rows: [
                  { cells: ["public-a", "10.0.1.0/24", "a"], why: `Inside 10.0.0.0/16.` },
                  { cells: ["public-b", "10.0.2.0/24", "b"], why: `Inside the VPC, no overlap.` },
                  { cells: ["private-a", "10.0.11.0/24", "a"], why: `Fine.` },
                  { cells: ["private-b", "10.1.12.0/24", "b"], bad: true, why: `10.1.x.x is outside 10.0.0.0/16 (which covers 10.0.0.0 to 10.0.255.255). A subnet must fit inside the VPC's range.` },
                ],
              },
            ],
          },
          {
            id: "cidr-math", title: "CIDR sizes and reserved addresses", domain: "performance",
            variants: [
              {
                type: "mcq", level: 1,
                q: `An architect needs a subnet with at least 250 usable IP addresses for instances. Which is the smallest subnet size that works?`,
                options: [
                  { t: `/24`, ok: true, why: `A /24 has 256 addresses. AWS reserves 5, leaving 251 usable, which is enough.` },
                  { t: `/25`, ok: false, why: `A /25 has 128 addresses (123 usable). Too small.` },
                  { t: `/28`, ok: false, why: `A /28 has only 16 addresses (11 usable). It's the smallest subnet AWS allows.` },
                  { t: `/16`, ok: false, why: `A /16 works, with over 65,000 addresses, but it's far from the smallest that fits, and it would use up the entire VPC range.` },
                ],
              },
              {
                type: "fill", level: 2,
                q: `How many <strong>usable</strong> IP addresses does a <code>/26</code> subnet have in AWS?`,
                accept: ["59"], placeholder: "a number",
                why: `A /26 has 2^(32−26) = 64 addresses. AWS reserves 5 in every subnet: 64 − 5 = 59.`,
              },
              {
                type: "mcq", level: 3,
                q: `An Auto Scaling group may grow to 300 instances in one subnet. What's the smallest subnet that fits?`,
                options: [
                  { t: `/23`, ok: true, why: `512 addresses − 5 reserved = 507 usable. A /24 only gives 251.` },
                  { t: `/24`, ok: false, why: `251 usable, not enough for 300.` },
                  { t: `/25`, ok: false, why: `123 usable.` },
                  { t: `/22`, ok: false, why: `1,019 usable works, but it's twice the size needed.` },
                ],
              },
              {
                type: "fill", level: 2,
                q: `How many usable addresses does the smallest subnet AWS allows (<code>/28</code>) have?`,
                accept: ["11"], placeholder: "a number",
                why: `A /28 has 16 addresses; minus the 5 reserved = 11.`,
              },
            ],
          },
        ],
        explain: {
          prompt: `How do a VPC, its CIDR range and its subnets relate to a Region and its AZs? Include what "5 reserved addresses" means for sizing.`,
          points: [
            `A VPC is a private network in one Region, spanning all its AZs, with one CIDR range`,
            `Subnets are non-overlapping slices of that range, each in exactly one AZ`,
            `To spread across AZs you need a subnet per AZ`,
            `AWS reserves 5 addresses per subnet, so usable = size − 5 (a /24 gives 251)`,
          ],
        },
      },

      {
        id: "follow-packet", title: "Follow a packet: the checkpoints in order", min: 3,
        tryFirst: {
          type: "mcq",
          q: `A user on the internet connects to a web server in a public subnet. Which checks the packet first: the subnet's network ACL or the server's security group?`,
          options: [
            { t: `The network ACL, at the subnet's border`, ok: true, why: `The packet crosses into the subnet before it reaches the server. The NACL guards the subnet's border; the security group guards the server itself.` },
            { t: `The security group, at the server`, ok: false, why: `The security group is the last check, right at the server. The packet has to get into the subnet first.` },
            { t: `Both at the same moment`, ok: false, why: `They sit in different places: the NACL on the subnet's border, the security group around the server. The packet meets them one after the other.` },
            { t: `Only one of them, depending on the port`, ok: false, why: `Every packet meets both. Either one can block it.` },
          ],
        },
        body: `<p>Every connection in a VPC passes the same checkpoints, in the same order. Once you can walk a packet through them, "why can't X reach Y?" questions become a matter of finding the first checkpoint that says no.</p>
<p>Think of the VPC as an office building: the <strong>internet gateway</strong> is the front door, each <strong>subnet</strong> is a floor with a guard at its door (the <strong>network ACL</strong>), and each server sits in an office with its own lock (its <strong>security group</strong>). The <strong>route table</strong> is the floor's signpost: it says where traffic leaving the floor goes next.</p>
<div class="tablewrap"><table><thead><tr><th>Leaving a server</th><th>Arriving at a server</th></tr></thead><tbody>
<tr><td>1. Its <strong>security group</strong> (outbound)</td><td>4. The destination subnet's <strong>NACL</strong> (inbound)</td></tr>
<tr><td>2. Its subnet's <strong>route table</strong>: where next?</td><td>5. The destination server's <strong>security group</strong> (inbound)</td></tr>
<tr><td>3. Its subnet's <strong>NACL</strong> (outbound), at the border</td><td></td></tr>
</tbody></table></div>
<p>Then the <strong>reply</strong> travels back the same way. Security groups remember the connection and let the reply through automatically. NACLs remember nothing, so the reply has to be allowed by its own NACL rule. Traffic to the internet also passes the internet gateway (or a NAT gateway first, for private servers).</p>
<p>Below, press <strong>Next</strong> to send a packet across the map, one checkpoint at a time. Try all three trips.</p>`,
        walk: [
          { label: `App server → database (inside the VPC)`, net: net(), flow: { from: "app", to: "db", port: 5432 } },
          { label: `App server → internet (through NAT)`, net: net(), flow: { from: "app", to: "internet", port: 443 } },
          { label: `User on the internet → web server`, net: net(), flow: { from: "user", to: "web", port: 443 } },
        ],
        example: `<p>App server → database: App SG lets it out, the route table says "inside the VPC, deliver directly", Private subnet A's NACL lets it out, Private subnet B's NACL lets it in, DB SG lets it in. The reply crosses both NACLs again on the way back. Five checks there, two on the way back, and any one can say no.</p>`,
        concepts: [
          {
            id: "checkpoint-order", title: "The checkpoints a packet passes, in order", domain: "secure",
            variants: [
              {
                type: "gate", level: 1,
                q: `One checkpoint at a time. Look at the rule and decide.`,
                net: net(), flow: { from: "app", to: "db", port: 5432 }, at: "sg|in|db", focus: ["sg", "nacl", "rt"],
                why: `DB SG allows 5432 from anything in App SG, and the app server wears App SG. Its IP doesn't matter.`,
              },
              {
                type: "nexthop", level: 1,
                q: `The app server in a private subnet downloads an update from the internet.`,
                net: net(), flow: { from: "app", to: "internet", port: 443 }, after: "rt|priv-a", focus: ["sg", "nacl", "rt", "nat", "igw"],
                why: `The route table has chosen NAT gateway A as the next stop, but the packet still has to leave its own subnet first, so the subnet's NACL checks it on the way out. Then it reaches the NAT gateway in Public subnet A.`,
              },
              {
                type: "gate", level: 1,
                q: `One checkpoint at a time. Look at the rule and decide.`,
                net: net(), flow: { from: "user", to: "web", port: 22 }, at: "sg|in|web",
                why: `Web SG only allows port 22 (SSH) from <code>203.0.113.0/24</code>, the office range. A user at <code>198.51.100.7</code> doesn't match, and a security group blocks anything it doesn't explicitly allow.`,
              },
              {
                type: "where", level: 2, focus: ["sg", "nacl", "rt"],
                q: `Someone added a custom NACL to Private subnet B, where the database lives. Now the app server can't reach the database.`,
                net: net(n => { n.nacls["acl-db"] = { name: "DB NACL", in: [{ n: 100, port: "5432", cidr: "10.0.1.0/24", allow: true }], out: [{ n: 100, port: "all", cidr: "0.0.0.0/0", allow: true }] }; N.subnet(n, "priv-b").nacl = "acl-db"; }),
                flow: { from: "app", to: "db", port: 5432 },
                goals: [{ label: `The app server connects to the database on 5432`, flow: { from: "app", to: "db", port: 5432 }, expect: true }],
                why: `DB NACL only allows 5432 from <code>10.0.1.0/24</code> (Public subnet A). The app server is in Private subnet A (<code>10.0.11.0/24</code>), so no rule matches and the final * DENY applies, at the border of the database's subnet, before DB SG is even reached.`,
              },
              {
                type: "order", level: 2,
                q: `A user on the internet opens a website on a web server in a public subnet. Put the checkpoints the request passes in order.`,
                steps: [`The internet gateway`, `The public subnet's network ACL (inbound)`, `The web server's security group (inbound)`, `The web server receives the request`],
                why: `Front door (internet gateway), then the guard at the subnet's border (NACL), then the server's own lock (security group). The reply goes back through the NACL (outbound) and the internet gateway.`,
              },
              {
                type: "mcq", level: 3,
                q: `A company runs its website on an EC2 instance in a public subnet. The instance has a public IP, the internet gateway is attached, and the route table sends 0.0.0.0/0 to it. The instance's security group allows inbound 443 from anywhere. The subnet's network ACL allows inbound 443 and outbound 443 only. Users' browsers time out. Which change fixes it with the LEAST operational overhead?`,
                options: [
                  { t: `Add an outbound network ACL rule allowing ports 1024–65535 to 0.0.0.0/0`, ok: true, why: `The request gets in, but the reply goes back to the browser's ephemeral port, and the stateless NACL has no outbound rule for it.` },
                  { t: `Add an outbound security group rule allowing ports 1024–65535 to 0.0.0.0/0`, ok: false, why: `Security groups are stateful: replies to allowed requests already go out. The NACL drops them.` },
                  { t: `Move the instance behind a NAT gateway in a private subnet`, ok: false, why: `A NAT gateway only allows connections started from inside, so users couldn't reach the site at all.` },
                  { t: `Attach an Elastic IP to the instance and update DNS`, ok: false, why: `The instance already has a working public IP. The address isn't the problem; the reply is blocked at the subnet's border.` },
                ],
              },
            ],
          },
        ],
        explain: {
          prompt: `Walk a packet from a user on the internet to a web server in a public subnet and back again. Name each checkpoint in order and say what it checks.`,
          points: [
            `In: internet gateway → the subnet's NACL (inbound) → the server's security group (inbound)`,
            `NACL = the subnet's border; security group = around the one server`,
            `Reply: the security group lets it out automatically (stateful); the NACL needs an outbound rule for the client's ephemeral port (stateless)`,
            `The route table must send the reply to the internet gateway (that's what makes the subnet public)`,
          ],
        },
      },

      {
        id: "routes-igw", title: "Route tables, internet gateway, public vs private", min: 3,
        tryFirst: {
          type: "trace",
          q: `Users can't reach the web server on port 443. Its subnet's route table sends <code>0.0.0.0/0</code> to an internet gateway, and its security group allows 443 from anywhere. What's your guess?`,
          net: net(n => { N.node(n, "web").pub = false; }), flow: { from: "user", to: "web", port: 443 }, expect: "blocked",
          options: [
            { t: `The instance has no public IP or Elastic IP`, ok: true, why: `The route makes the subnet public, but the instance itself needs a public address for internet traffic to reach it.` },
            { t: `The VPC needs a second internet gateway`, ok: false, why: `A VPC can only have one, and it's already highly available.` },
            { t: `Internet gateways only allow outbound traffic`, ok: false, why: `They allow both directions. Outbound-only is what a NAT gateway does.` },
            { t: `The subnet must be in the default VPC`, ok: false, why: `Custom VPCs work the same once routes and public IPs are in place.` },
          ],
        },
        body: `<p>Every subnet is associated with a <strong>route table</strong>: a list of rules saying "traffic for this IP range goes to that target." The most specific matching route wins. Every route table automatically has a <strong>local</strong> route, so all subnets in a VPC can reach each other.</p>
<p>An <strong>internet gateway (IGW)</strong> connects a VPC to the internet, in both directions. You attach one per VPC. It's managed by AWS, highly available across all AZs and free.</p>
<p>What makes a subnet <strong>public</strong> is one route: <code>0.0.0.0/0 → igw-...</code> ("everything that isn't local goes to the internet gateway"). A subnet without that route is <strong>private</strong>. There's no checkbox; it's purely the route table.</p>
<p>An instance in a public subnet also needs a <strong>public IP address</strong> to be reachable. It can get a random one automatically at launch (which changes if you stop and start it), or you attach an <strong>Elastic IP</strong>: a static public IPv4 address you keep until you release it, which you can move between instances. AWS charges for public IPv4 addresses, so use them only where needed.</p>
<p><strong>The packet tracer</strong> starts here. It models a VPC with route tables, gateways and firewalls, and traces a connection hop by hop, telling you exactly which piece let it through or blocked it. Exercises use it to check your predictions and to let you fix broken networks. You can also play with it any time under Practice.</p>`,
        example: `<div class="tablewrap"><table><thead><tr><th>Destination</th><th>Target</th><th>Meaning</th></tr></thead><tbody>
<tr><td><code>10.0.0.0/16</code></td><td>local</td><td>Traffic inside the VPC stays inside</td></tr>
<tr><td><code>0.0.0.0/0</code></td><td><code>igw-0abc</code></td><td>Everything else goes to the internet</td></tr>
</tbody></table></div><p>This is a public subnet's route table. A private subnet's table would have the local route, and either nothing else or a route to a NAT gateway (next lesson).</p>`,
        concepts: [
          {
            id: "public-subnet", title: "What makes a subnet public", domain: "secure",
            variants: [
              {
                type: "mcq", level: 1,
                q: `What makes a subnet "public"?`,
                options: [
                  { t: `A checkbox in the subnet settings`, ok: false, why: `There's no such setting. (There's an option to auto-assign public IPs, but that alone doesn't make the subnet public.)` },
                  { t: `Its route table has a route to an internet gateway`, ok: true, why: `That single route (usually 0.0.0.0/0 → IGW) is the definition of a public subnet.` },
                  { t: `It contains a NAT gateway`, ok: false, why: `NAT gateways are placed in public subnets, but they don't make a subnet public; the route to the IGW does.` },
                  { t: `It uses a /24 CIDR block`, ok: false, why: `Size has nothing to do with it.` },
                ],
              },
              {
                type: "tracefix", level: 3, focus: ["rt", "igw", "pub"],
                q: `The web server has a public IP and its security group allows 443, but nobody on the internet can reach it. Fix the network.`,
                net: N.make("single", n => { n.rts["rt-main"].routes = []; }), flow: { from: "user", to: "web", port: 443 }, open: ["rts"],
                goals: [{ label: `A user on the internet reaches the web server on 443`, flow: { from: "user", to: "web", port: 443 }, expect: true }],
                why: `The subnet's route table had only the local route, so the subnet was private. Adding <code>0.0.0.0/0 → internet gateway</code> makes it public, and the reply can get back out.`,
                solve: n => { n.rts["rt-main"].routes.push({ dest: "0.0.0.0/0", target: "igw" }); },
                fixes: [
                  { t: `Add a route 0.0.0.0/0 → internet gateway to the subnet's route table`, ok: true, why: `With only the local route, the subnet is private: requests arrive but the reply has nowhere to go. A route to the internet gateway is what makes a subnet public.` },
                  { t: `Add an outbound rule to Web SG allowing ports 1024–65535 to anywhere, for the replies`, apply: n => { n.sgs["sg-web"].out.push({ port: "1024-65535", dst: "0.0.0.0/0" }); }, why: `Security groups are stateful: replies to allowed requests are always allowed. The reply is lost at the route table, not the security group.` },
                  { t: `Add NACL rules allowing ports 1024–65535 in and out of the subnet`, apply: n => { const a = n.nacls["acl-default"]; a.in.push({ n: 200, port: "1024-65535", cidr: "0.0.0.0/0", allow: true }); a.out.push({ n: 200, port: "1024-65535", cidr: "0.0.0.0/0", allow: true }); }, why: `The default NACL already allows all traffic both ways. Nothing changes: the reply still has no route out.` },
                  { t: `Swap the web server's public IP for an Elastic IP so its address stays fixed`, apply: () => {}, why: `Any public IP works with an internet gateway; a fixed one only keeps the address across restarts. The missing piece is the route.` },
                ],
              },
              {
                type: "tracefix", level: 3, focus: ["rt", "igw", "pub"],
                q: `A brand-new VPC. The web server must be reachable from the internet on 443. Two things are missing. Find and fix both.`,
                net: N.make("single", n => { n.igw = false; N.node(n, "web").pub = false; }), flow: { from: "user", to: "web", port: 443 },
                goals: [{ label: `A user on the internet reaches the web server on 443`, flow: { from: "user", to: "web", port: 443 }, expect: true }],
                why: `Attach an internet gateway to the VPC (the route already points to it) and give the instance a public IP. Route, gateway and public address all have to be there.`,
                solve: n => { n.igw = true; N.node(n, "web").pub = true; },
                fixes: [
                  { t: `Attach an internet gateway to the VPC`, apply: n => { n.igw = true; }, why: `Needed, but not enough: the web server still has no public IP, so no internet address leads to it.` },
                  { t: `Give the web server a public IP`, apply: n => { N.node(n, "web").pub = true; }, why: `Needed, but not enough: without an internet gateway attached, nothing from the internet enters the VPC.` },
                  { t: `Attach an internet gateway and give the web server a public IP`, ok: true, why: `Both were missing. The route to the internet gateway was already there; now the gateway exists and the instance has an address it can translate.` },
                  { t: `Attach an internet gateway and add a 0.0.0.0/0 route to it`, apply: n => { n.igw = true; n.rts["rt-main"].routes.push({ dest: "0.0.0.0/0", target: "igw" }); }, why: `The route was already there, so the second half changes nothing. The web server still has no public IP.` },
                ],
              },
              {
                type: "spot", level: 2, unit: "route",
                q: `This route table belongs to a subnet that's supposed to be <strong>private</strong> (no direct internet access). Which route breaks that?`,
                cols: ["Destination", "Target"],
                rows: [
                  { cells: ["10.0.0.0/16", "local"], why: `Every route table has it; it keeps VPC traffic inside the VPC.` },
                  { cells: ["0.0.0.0/0", "igw-0abc"], bad: true, why: `A route to the internet gateway is exactly what makes a subnet public. A private subnet uses a NAT gateway (or nothing) instead.` },
                  { cells: ["172.16.0.0/12", "vgw-0def (VPN to the office)"], why: `Private traffic to the office over a VPN; it doesn't touch the internet directly.` },
                ],
              },
            ],
          },
          {
            id: "public-ip", title: "Public IPs and Elastic IPs", domain: "secure",
            variants: [
              {
                type: "mcq", level: 1,
                q: `An EC2 instance is in a subnet whose route table sends 0.0.0.0/0 to an internet gateway, and its security group allows HTTPS from anywhere. Users still can't reach it from the internet. What is the most likely cause?`,
                options: [
                  { t: `The instance has no public IP address or Elastic IP`, ok: true, why: `The route makes the subnet public, but the instance itself needs a public address for internet traffic to reach it. Assign a public IP or attach an Elastic IP.` },
                  { t: `The VPC needs a second internet gateway`, ok: false, why: `A VPC can only have one internet gateway, and it's already highly available.` },
                  { t: `The subnet must be in the default VPC`, ok: false, why: `Custom VPCs work exactly the same way once routes and public IPs are in place.` },
                  { t: `Internet gateways only allow outbound traffic`, ok: false, why: `Internet gateways allow both directions. Outbound-only is what a NAT gateway does.` },
                ],
              },
              {
                type: "mcq", level: 3,
                q: `An instance's public IP changes every time it's stopped and started, which breaks a partner's firewall allow-list. What fixes it?`,
                options: [
                  { t: `Attach an Elastic IP`, ok: true, why: `An Elastic IP is static: it stays with you until you release it.` },
                  { t: `Use a larger instance type`, ok: false, why: `Instance size doesn't affect addressing.` },
                  { t: `Move the instance to a private subnet`, ok: false, why: `Then it has no public address at all.` },
                  { t: `Add a second internet gateway`, ok: false, why: `A VPC has only one, and it doesn't assign addresses.` },
                ],
              },
              {
                type: "trace", level: 2,
                q: `Someone gave the app server in <strong>Private subnet A</strong> a public IP, and its security group allows port 22 from anywhere. Private subnet A's route table sends 0.0.0.0/0 to a NAT gateway. Can a user on the internet SSH into it?`,
                net: net(n => { N.node(n, "app").pub = true; n.sgs["sg-app"].in.push({ port: "22", src: "0.0.0.0/0" }); }),
                flow: { from: "user", to: "app", port: 22 }, expect: "blocked",
                options: [
                  { t: `No: the subnet has no route to the internet gateway, so replies can't get back out`, ok: true, why: `The request arrives through the IGW, but the reply follows Private subnet A's route table, which sends it to the NAT gateway instead. A public IP alone doesn't make an instance reachable: the subnet must be public too.` },
                  { t: `Yes: it has a public IP and the security group allows 22`, ok: false, why: `Those are necessary, not sufficient. The subnet must route to the internet gateway.` },
                  { t: `No: the NAT gateway blocks the incoming request`, ok: false, why: `Incoming traffic arrives through the internet gateway, not the NAT gateway. What breaks is the reply path.` },
                  { t: `Yes, because SSH ignores route tables`, ok: false, why: `Every packet follows route tables.` },
                ],
              },
            ],
          },
        ],
        explain: {
          prompt: `What makes a subnet public, and what else must be true for an instance in it to be reachable from the internet?`,
          points: [
            `A subnet is public only because its route table sends 0.0.0.0/0 to an internet gateway`,
            `The VPC needs an internet gateway attached`,
            `The instance needs a public IP or Elastic IP (Elastic IPs stay the same)`,
            `Firewalls (security group, NACL) must also allow the traffic`,
          ],
        },
      },

      {
        id: "nat", title: "NAT gateway: outbound-only internet", min: 3,
        tryFirst: {
          type: "mcq",
          q: `An app server in a private subnet must download OS updates from the internet, but must <strong>not</strong> be reachable from the internet. What's your guess?`,
          options: [
            { t: `A NAT gateway in a public subnet, with the private subnet routing 0.0.0.0/0 to it`, ok: true, why: `NAT lets private instances start connections outward and get replies, while nothing on the internet can start a connection in.` },
            { t: `Move the server to a public subnet`, ok: false, why: `Then it could be reached from the internet.` },
            { t: `Add a route to the internet gateway in the private subnet`, ok: false, why: `That makes the subnet public.` },
            { t: `An egress-only internet gateway`, ok: false, why: `That's the IPv6 version. For IPv4, it's a NAT gateway.` },
          ],
        },
        body: `<p>Servers in private subnets often need to reach the internet <em>outward</em> (download patches, call a partner API) without anyone on the internet being able to reach <em>in</em>. That's what a <strong>NAT gateway</strong> does. NAT (Network Address Translation) swaps the server's private IP for the NAT gateway's public IP on the way out, and maps replies back. A connection started from the internet has nothing to map to, so it can't get in.</p>
<p>How it's set up:</p>
<ol><li>The NAT gateway sits in a <strong>public</strong> subnet (it needs the route to the internet gateway itself) and has an Elastic IP.</li>
<li>The <strong>private</strong> subnets' route tables send <code>0.0.0.0/0 → nat-...</code>.</li></ol>
<p>Key facts for the exam:</p>
<ul><li>A NAT gateway is <strong>zonal</strong>: it lives in one AZ. For resilience, create <strong>one per AZ</strong> and route each private subnet to the NAT gateway in its own AZ.</li>
<li>It's managed and scales automatically (up to 100 Gbps). You pay per hour plus per GB processed, so heavy traffic through NAT gets expensive.</li>
<li>A <strong>NAT instance</strong> is the old way: an EC2 instance you configure yourself. On the exam it's almost always the wrong answer.</li>
<li>For <strong>IPv6</strong>, addresses are public anyway, so outbound-only access uses an <strong>egress-only internet gateway</strong> instead.</li>
<li>All outbound traffic leaves with the NAT gateway's Elastic IP, which is handy when a partner needs to allow-list your IP.</li></ul>
<p>In the packet tracer, the AZ failure option shows what happens to every subnet routed through a NAT gateway in a failed AZ.</p>`,
        example: `<p>App servers in private subnets in 3 AZs need OS updates. Create a NAT gateway in the public subnet of each AZ; each private subnet routes 0.0.0.0/0 to its own AZ's NAT gateway. If one AZ fails, the other two keep their internet access.</p>`,
        concepts: [
          {
            id: "nat-setup", title: "NAT gateway placement and routing", domain: "secure",
            variants: [
              {
                type: "mcq", level: 1,
                q: `Where must a NAT gateway be placed so that private instances can reach the internet?`,
                options: [
                  { t: `In a private subnet, next to the instances`, ok: false, why: `The NAT gateway itself needs internet access through the internet gateway, which only a public subnet has.` },
                  { t: `In a public subnet, with private subnets routing 0.0.0.0/0 to it`, ok: true, why: `The NAT gateway uses the public subnet's route to the IGW; private subnets send their internet-bound traffic to the NAT gateway.` },
                  { t: `Outside the VPC, at the Region level`, ok: false, why: `NAT gateways are created inside a subnet of your VPC.` },
                  { t: `Attached directly to the internet gateway`, ok: false, why: `They're separate resources; the NAT gateway reaches the IGW through its subnet's route table.` },
                ],
              },
              {
                type: "tracefix", level: 3, focus: ["rt", "nat", "igw", "pub"],
                q: `The app server in Private subnet A can't download updates. Give it outbound internet access on 443, without making it reachable from the internet.`,
                net: net(n => { n.rts["rt-private-a"].routes = []; }), flow: { from: "app", to: "internet", port: 443 }, open: ["rts"],
                goals: [
                  { label: `App server reaches the internet on 443`, flow: { from: "app", to: "internet", port: 443 }, expect: true },
                  { label: `App server stays private (no public IP, its subnet has no route to the IGW)`, test: "private", node: "app" },
                ],
                why: `Add <code>0.0.0.0/0 → NAT gateway A</code> to Private route table A. The NAT gateway already sits in Public subnet A, whose route table reaches the internet gateway.`,
                solve: n => { n.rts["rt-private-a"].routes.push({ dest: "0.0.0.0/0", target: "nat-a" }); },
                fixes: [
                  { t: `Add a route 0.0.0.0/0 → internet gateway to Private route table A, and give the app server a public IP`, apply: n => { n.rts["rt-private-a"].routes.push({ dest: "0.0.0.0/0", target: "igw" }); N.node(n, "app").pub = true; }, why: `The app server gets internet access, but its subnet becomes public and it gets a public address, so it's no longer private.` },
                  { t: `Add a route 0.0.0.0/0 → NAT gateway A to Private route table A`, ok: true, why: `NAT gateway A already sits in Public subnet A with an Elastic IP. Pointing the private route table at it gives outbound-only access.` },
                  { t: `Give the app server a public IP`, apply: n => { N.node(n, "app").pub = true; }, why: `A public IP does nothing without a route out of the subnet, and it would break the "stays private" goal anyway.` },
                  { t: `Associate Private subnet A with the public route table`, apply: n => { N.subnet(n, "priv-a").rt = "rt-public"; }, why: `That makes the subnet public, and the app server still can't get out: an internet gateway only works for instances with a public IP.` },
                ],
              },
              {
                type: "tracefix", level: 3, focus: ["rt", "nat", "igw", "pub"],
                q: `Someone created the NAT gateway inside <strong>Private subnet A</strong>. The app server's internet access doesn't work. Fix it, keeping the app server private.`,
                net: net(n => { const g = N.node(n, "nat-a"); g.subnet = "priv-a"; g.ip = "10.0.11.5"; }), flow: { from: "app", to: "internet", port: 443, },
                goals: [
                  { label: `App server reaches the internet on 443`, flow: { from: "app", to: "internet", port: 443 }, expect: true },
                  { label: `App server stays private`, test: "private", node: "app" },
                ],
                why: `A NAT gateway must sit in a public subnet. Remove it from Private subnet A, add one in Public subnet A, and point Private route table A's 0.0.0.0/0 route at the new one. Making Private subnet A public instead would fail the second goal.`,
                solve: n => { const g = N.node(n, "nat-a"); g.subnet = "pub-a"; g.ip = "10.0.1.5"; },
                fixes: [
                  { t: `Add a route 0.0.0.0/0 → internet gateway to Private route table A`, apply: n => { n.rts["rt-private-a"].routes = [{ dest: "0.0.0.0/0", target: "igw" }]; }, why: `That turns Private subnet A into a public subnet, and the app server has no public IP, so it still can't get out.` },
                  { t: `Give NAT gateway A an Elastic IP`, apply: n => { N.node(n, "nat-a").eip = true; }, why: `It already has one. The problem is where it sits: its subnet's route table doesn't lead to the internet gateway.` },
                  { t: `Recreate NAT gateway A in Public subnet A, keeping the route pointed at it`, ok: true, why: `A NAT gateway must sit in a public subnet so its own traffic can reach the internet gateway. Private route table A keeps pointing at it.` },
                  { t: `Add a second NAT gateway in Public subnet A and leave the route as it is`, apply: n => { n.nodes.push({ id: "nat-b", name: "NAT gateway B", kind: "nat", subnet: "pub-a", ip: "10.0.1.6", eip: true, sgs: [] }); }, why: `The route table decides which NAT gateway is used. It still points at the one in the private subnet, so nothing changes.` },
                ],
              },
              {
                type: "trace", level: 2,
                q: `A user on the internet tries to connect to the app server in Private subnet A (port 8080). Private subnet A routes 0.0.0.0/0 through NAT gateway A. What happens?`,
                net: net(n => { n.sgs["sg-app"].in.push({ port: "8080", src: "0.0.0.0/0" }); }), flow: { from: "user", to: "app", port: 8080 }, expect: "blocked",
                options: [
                  { t: `Blocked: the app server has no public address, and NAT only allows connections started from inside`, ok: true, why: `NAT maps replies to connections that went out. A connection started from the internet has nothing to map to.` },
                  { t: `It works: the NAT gateway forwards it to the app server`, ok: false, why: `NAT gateways never forward unsolicited inbound connections.` },
                  { t: `It works, because the security group allows 8080 from anywhere`, ok: false, why: `The packet never gets that far; there's no address leading to the instance.` },
                  { t: `Blocked by the internet gateway's firewall`, ok: false, why: `Internet gateways don't filter traffic. There's simply no public address to reach.` },
                ],
              },
              {
                type: "mcq", level: 2,
                q: `Applications in private subnets call a partner's API. The partner only accepts requests from a fixed list of IP addresses. What should a solutions architect do?`,
                options: [
                  { t: `Route outbound traffic through a NAT gateway and give the partner the NAT gateway's Elastic IP`, ok: true, why: `All outbound traffic through the NAT gateway leaves with its Elastic IP, which never changes, so the partner allow-lists one address (one per NAT gateway if you have several).` },
                  { t: `Give the partner the private IPs of the instances`, ok: false, why: `Private IPs aren't visible on the internet, and they change as instances are replaced.` },
                  { t: `Attach an Elastic IP to every instance and move them to public subnets`, ok: false, why: `It works, but it exposes the instances to the internet and breaks every time Auto Scaling adds a new instance.` },
                  { t: `Use an interface VPC endpoint for the partner's API`, ok: false, why: `Interface endpoints reach AWS services or PrivateLink endpoint services, not an arbitrary partner API on the internet.` },
                ],
              },
            ],
          },
          {
            id: "nat-ha", title: "One NAT gateway per AZ (or not)", domain: "resilient",
            variants: [
              {
                type: "tracefix", level: 3, focus: ["rt", "nat", "igw", "pub"],
                q: `Both private subnets use NAT gateway A, which lives in AZ a. When AZ a fails, App server B in AZ b loses internet access too. Change the setup so each AZ keeps internet access if the other fails.`,
                net: net(withAppB), flow: { from: "app-b", to: "internet", port: 443, azDown: "a" }, open: ["rts"],
                goals: [
                  { label: `With AZ a down, App server B still reaches the internet`, flow: { from: "app-b", to: "internet", port: 443, azDown: "a" }, expect: true },
                  { label: `With AZ b down, App server A still reaches the internet`, flow: { from: "app", to: "internet", port: 443, azDown: "b" }, expect: true },
                  { label: `App server B stays private`, test: "private", node: "app-b" },
                ],
                why: `Add a NAT gateway in Public subnet B and change Private route table B's 0.0.0.0/0 route to it. Each private subnet then uses the NAT gateway in its own AZ, so one AZ failing never cuts off the other.`,
                solve: n => { n.nodes.push({ id: "nat-b", name: "NAT gateway B", kind: "nat", subnet: "pub-b", ip: "10.0.2.5", eip: true, sgs: [] }); n.rts["rt-private-b"].routes = [{ dest: "0.0.0.0/0", target: "nat-b" }]; },
                fixes: [
                  { t: `Add a NAT gateway in Public subnet B`, apply: n => { n.nodes.push({ id: "nat-b", name: "NAT gateway B", kind: "nat", subnet: "pub-b", ip: "10.0.2.5", eip: true, sgs: [] }); }, why: `Creating it isn't enough: Private route table B still sends everything to NAT gateway A, which dies with AZ a.` },
                  { t: `Add a NAT gateway in Public subnet B and point Private route table B at it`, ok: true, why: `Each private subnet now uses the NAT gateway in its own AZ, so one AZ failing never cuts off the other.` },
                  { t: `Add a second NAT gateway in Public subnet A and point Private route table B at it`, apply: n => { n.nodes.push({ id: "nat-b", name: "NAT gateway B", kind: "nat", subnet: "pub-a", ip: "10.0.1.6", eip: true, sgs: [] }); n.rts["rt-private-b"].routes = [{ dest: "0.0.0.0/0", target: "nat-b" }]; }, why: `Two NAT gateways in the same AZ fail together. Redundancy has to be across AZs.` },
                  { t: `Point Private route table B at the internet gateway instead`, apply: n => { n.rts["rt-private-b"].routes = [{ dest: "0.0.0.0/0", target: "igw" }]; }, why: `That makes Private subnet B public, and App server B has no public IP, so it can't get out at all.` },
                ],
              },
              {
                type: "mcq", level: 2,
                q: `A development VPC uses private subnets in three AZs. The instances occasionally download packages from the internet. Losing internet access during a rare AZ outage is acceptable. What is the MOST cost-effective setup?`,
                options: [
                  { t: `One NAT gateway in a single AZ, used by all private subnets`, ok: true, why: `One NAT gateway per AZ is the resilient design, but here resilience isn't required and cost is the qualifier. One NAT gateway costs a third of three. (Cross-AZ traffic adds small data charges, but occasional downloads keep that minor.)` },
                  { t: `One NAT gateway per AZ`, ok: false, why: `Most resilient, but you pay hourly for three NAT gateways when the scenario explicitly accepts the AZ risk.` },
                  { t: `An internet gateway route in every private subnet`, ok: false, why: `That makes the subnets public and exposes the instances, a security change, not a cost optimization.` },
                  { t: `A Direct Connect connection`, ok: false, why: `DX connects your data center to AWS; it doesn't provide internet access, and it's expensive.` },
                ],
              },
              {
                type: "elim", level: 3,
                q: `A production app runs in private subnets in 3 AZs and calls payment APIs on the internet.`,
                reqs: [`An AZ failure must not stop payments in the other AZs`, `App servers must not be reachable from the internet`, `Qualifier: LEAST operational overhead`],
                options: [
                  { t: `One NAT gateway per AZ; each private subnet routes to its own AZ's NAT gateway`, ok: true, why: `Resilient, private, and fully managed.` },
                  { t: `One NAT gateway in AZ a for all subnets`, ok: false, kills: [0], why: `If AZ a fails, every subnet loses internet access.` },
                  { t: `Public subnets and public IPs for the app servers`, ok: false, kills: [1], why: `Exposes the servers to the internet.` },
                  { t: `A self-managed NAT instance on EC2 in each AZ`, ok: false, kills: [2], why: `It can meet the first two, but you'd patch, size and fail over those instances yourself.` },
                ],
              },
              {
                type: "mcq", level: 2,
                q: `Instances with IPv6 addresses must start connections to the internet, but must not accept connections started from the internet. What should be used?`,
                options: [
                  { t: `A NAT gateway`, ok: false, why: `NAT gateways translate IPv4 addresses. IPv6 has its own dedicated solution.` },
                  { t: `An egress-only internet gateway`, ok: true, why: `It's the IPv6 equivalent of NAT behavior: outbound connections and their replies are allowed, while connections started from the internet are blocked.` },
                  { t: `A regular internet gateway`, ok: false, why: `An internet gateway allows traffic in both directions, so instances could be reached from the internet.` },
                  { t: `A gateway VPC endpoint`, ok: false, why: `Gateway endpoints give private access to S3 and DynamoDB only, not to the internet.` },
                ],
              },
            ],
          },
        ],
        explain: {
          prompt: `How does a NAT gateway let private instances reach the internet but not the reverse? How would you make it survive an AZ failure?`,
          points: [
            `It sits in a public subnet with an Elastic IP; private subnets route 0.0.0.0/0 to it`,
            `It translates outbound connections and maps replies back; connections started from outside have nothing to map to`,
            `It's zonal: use one per AZ, each private subnet routed to its own AZ's NAT gateway`,
            `(IPv6 uses an egress-only internet gateway instead)`,
          ],
        },
      },

      {
        id: "sg-nacl", title: "Security groups vs network ACLs", min: 4,
        tryFirst: {
          type: "mcq",
          q: `A subnet's custom network ACL allows inbound TCP 443 from anywhere and outbound TCP 443 to anywhere. Users connecting to a web server in that subnet get timeouts, though the instance's security group is correct. What's your guess?`,
          options: [
            { t: `The NACL doesn't allow the replies, which go back to the users' random high ports`, ok: true, why: `Network ACLs are stateless. The reply to a user goes to their ephemeral port (1024–65535), not 443, so the outbound rule must allow that range.` },
            { t: `Security groups override NACLs`, ok: false, why: `Neither overrides the other. Traffic must pass both.` },
            { t: `NACLs can't allow port 443`, ok: false, why: `They can allow any port.` },
            { t: `The NACL needs a deny rule for everything else`, ok: false, why: `Everything not allowed is already denied by the final catch-all rule.` },
          ],
        },
        body: `<p>AWS gives you two firewalls that work at different levels:</p>
<div class="tablewrap"><table><thead><tr><th></th><th>Security group (SG)</th><th>Network ACL (NACL)</th></tr></thead><tbody>
<tr><td>Attached to</td><td>An instance's network interface</td><td>A whole subnet</td></tr>
<tr><td>Rules</td><td>Allow only</td><td>Allow AND deny</td></tr>
<tr><td>State</td><td><strong>Stateful</strong>: replies are allowed automatically</td><td><strong>Stateless</strong>: replies need their own rule</td></tr>
<tr><td>Evaluation</td><td>All rules together</td><td>In number order; first match wins</td></tr>
<tr><td>Default</td><td>Deny all inbound, allow all outbound</td><td>Default NACL allows everything; a new custom NACL denies everything</td></tr>
</tbody></table></div>
<p><strong>Stateful vs stateless</strong> is tested a lot. When a client connects to your server on port 443, the reply goes back to a random high port on the client, called an <strong>ephemeral port</strong> (1024–65535). A security group remembers the connection and lets the reply out. A NACL doesn't remember, so its <em>outbound</em> rules must allow ephemeral ports or the reply is dropped. The same applies the other way round: if your server starts a connection out, the NACL's <em>inbound</em> rules must allow the replies on ephemeral ports.</p>
<p>A powerful security group feature: a rule can allow traffic from <strong>another security group</strong> instead of an IP range. That means "anything carrying security group X may connect," which keeps working as instances come and go.</p>
<p>Traffic between two instances in the <em>same</em> subnet never crosses a NACL; only security groups apply. To troubleshoot traffic, <strong>VPC Flow Logs</strong> record which connections were accepted or rejected, sent to CloudWatch Logs or S3.</p>`,
        example: `<p>Three-tier app. ALB security group: allow 443 from <code>0.0.0.0/0</code>. App security group: allow 8080 only from the ALB's security group. Database security group: allow 5432 only from the app security group. Nothing in the database tier can be reached from anywhere else, no matter how many app servers Auto Scaling adds.</p>`,
        concepts: [
          {
            id: "stateful-stateless", title: "Stateful SGs, stateless NACLs", domain: "secure",
            variants: [
              {
                type: "mcq", level: 1,
                q: `An administrator can't SSH into an instance. The security group allows inbound port 22 from the office IP. The subnet's custom NACL allows inbound port 22 from the office IP and outbound ports 80 and 443 only. What should be changed?`,
                options: [
                  { t: `Allow outbound ephemeral ports (1024–65535) to the office IP in the NACL`, ok: true, why: `The NACL is stateless: the SSH reply goes back to the administrator's random high port, which the outbound rules (80 and 443 only) block.` },
                  { t: `Allow outbound port 22 in the security group`, ok: false, why: `Security groups are stateful: if inbound 22 is allowed, the reply is allowed automatically.` },
                  { t: `Add a deny rule for all other traffic in the NACL`, ok: false, why: `Everything not allowed is already denied; more denies won't let the reply out.` },
                  { t: `Attach an Elastic IP`, ok: false, why: `Nothing suggests an addressing problem: the traffic reaches the instance and the reply is what gets blocked.` },
                ],
              },
              {
                type: "tracefix", level: 3, focus: ["nacl", "sg"],
                q: `Public subnet A uses a custom NACL that only allows port 443 in and out. Users time out, and the web server can't download updates either. Fix the NACL (keep it, don't switch subnets to the default one).`,
                net: net(webNacl), flow: { from: "user", to: "web", port: 443 }, open: ["nacls"],
                goals: [
                  { label: `Users reach the web server on 443`, flow: { from: "user", to: "web", port: 443 }, expect: true },
                  { label: `The web server downloads updates from the internet on 443`, flow: { from: "web", to: "internet", port: 443 }, expect: true },
                ],
                why: `Add an <strong>outbound</strong> rule allowing ports 1024-65535 (replies to users) and an <strong>inbound</strong> rule allowing 1024-65535 (replies to the web server's own downloads). NACLs don't track connections, so each direction's replies need a rule.`,
                solve: n => { n.nacls["acl-web"].out.push({ n: 200, port: "1024-65535", cidr: "0.0.0.0/0", allow: true }); n.nacls["acl-web"].in.push({ n: 200, port: "1024-65535", cidr: "0.0.0.0/0", allow: true }); },
                fixes: [
                  { t: `Add an outbound NACL rule allowing ports 1024–65535`, apply: n => { n.nacls["acl-web"].out.push({ n: 200, port: "1024-65535", cidr: "0.0.0.0/0", allow: true }); }, why: `This fixes the replies to users. The web server's own downloads still fail: their replies come back in on an ephemeral port, and nothing inbound allows that.` },
                  { t: `Add an inbound NACL rule allowing ports 1024–65535`, apply: n => { n.nacls["acl-web"].in.push({ n: 200, port: "1024-65535", cidr: "0.0.0.0/0", allow: true }); }, why: `This fixes the web server's downloads, but replies to users still can't leave: they go out to the user's ephemeral port.` },
                  { t: `Add NACL rules allowing ports 1024–65535, one inbound and one outbound`, ok: true, why: `NACLs don't track connections, so the replies in each direction need their own rule.` },
                  { t: `Add Web SG rules allowing ports 1024–65535, one inbound and one outbound`, apply: n => { n.sgs["sg-web"].in.push({ port: "1024-65535", src: "0.0.0.0/0" }); n.sgs["sg-web"].out.push({ port: "1024-65535", dst: "0.0.0.0/0" }); }, why: `The security group isn't the problem (it's stateful). The NACL still drops the replies, and this opens high ports to the whole internet.` },
                ],
              },
              {
                type: "trace", level: 2,
                q: `Same custom NACL on Public subnet A (443 in, 443 out, nothing else). The web server starts a download from a website on port 443. What happens?`,
                net: net(webNacl), flow: { from: "web", to: "internet", port: 443 }, expect: "blocked",
                options: [
                  { t: `Blocked: the reply comes back to an ephemeral port, which the inbound rules don't allow`, ok: true, why: `The request leaves on 443, but the website's reply arrives at the web server's ephemeral port. Stateless NACLs need an inbound rule for that.` },
                  { t: `It works: outbound 443 is allowed`, ok: false, why: `The request gets out; the reply can't get back in.` },
                  { t: `Blocked by the security group's outbound rules`, ok: false, why: `The security group allows all outbound traffic, and it would allow the reply anyway (stateful).` },
                  { t: `Blocked: instances in public subnets can't start outbound connections`, ok: false, why: `They can, through the internet gateway.` },
                ],
              },
              {
                type: "multi", level: 3,
                q: `Which statements are true?`,
                options: [
                  { t: `Security groups allow return traffic automatically`, ok: true, why: `They're stateful.` },
                  { t: `NACL rules are evaluated in number order, and the first match wins`, ok: true, why: `So a low-numbered allow beats a higher-numbered deny.` },
                  { t: `Security groups can have deny rules`, ok: false, why: `Allow rules only. To block a specific IP, use a NACL.` },
                  { t: `A newly created custom NACL allows all traffic`, ok: false, why: `A new custom NACL denies everything until you add rules. (The default NACL allows all.)` },
                ],
              },
              {
                type: "spot", level: 2, unit: "rule",
                q: `The team wanted to block a misbehaving IP, <code>198.51.100.7</code>, but its HTTPS requests still get through. Here are the inbound NACL rules. Which one is the problem?`,
                cols: ["Rule #", "Action", "Port", "Source"],
                rows: [
                  { cells: ["100", "ALLOW", "443", "0.0.0.0/0"], why: `Allowing HTTPS from everyone is intended. The problem is the order.` },
                  { cells: ["200", "DENY", "all", "198.51.100.7/32"], bad: true, why: `NACLs stop at the first match. Rule 100 already allows the request, so rule 200 is never reached. Renumber the deny below 100 (e.g. 50).` },
                  { cells: ["*", "DENY", "all", "0.0.0.0/0"], why: `The final catch-all; it's always there.` },
                ],
              },
            ],
          },
          {
            id: "sg-references", title: "Reference security groups, not IPs", domain: "secure",
            variants: [
              {
                type: "mcq", level: 1,
                q: `A database must accept connections only from the application servers. The application servers are in an Auto Scaling group, so their IP addresses change constantly. What is the BEST way to allow this?`,
                options: [
                  { t: `In the database security group, allow the app servers' current IP addresses and update them on every scaling event`, ok: false, why: `It works briefly, but every scale-out breaks it, and you'd need automation to keep updating the rules.` },
                  { t: `In the database security group, allow the database port from the application servers' security group`, ok: true, why: `Referencing the security group means any instance that carries it is allowed, whatever its IP. New instances launched by Auto Scaling get the same security group, so they work automatically.` },
                  { t: `Use a NACL rule that allows the whole VPC CIDR`, ok: false, why: `That lets every resource in the VPC reach the database, not just the app servers. Too broad.` },
                  { t: `Put the database in a public subnet`, ok: false, why: `That makes it more exposed, not less, and doesn't restrict access to the app servers.` },
                ],
              },
              {
                type: "tracefix", level: 3, focus: ["sg", "nacl"],
                q: `The database's security group allows 5432 from the web tier's subnet (<code>10.0.1.0/24</code>) by mistake. The app server can't connect, and the web server can. Fix it so only the app tier gets in, even as app servers come and go.`,
                net: net(n => { n.sgs["sg-db"].in = [{ port: "5432", src: "10.0.1.0/24" }]; }), flow: { from: "app", to: "db", port: 5432 }, open: ["sgs"],
                goals: [
                  { label: `The app server connects to the database on 5432`, flow: { from: "app", to: "db", port: 5432 }, expect: true },
                  { label: `The web server can't connect to the database`, flow: { from: "web", to: "db", port: 5432 }, expect: false },
                  { label: `After Auto Scaling replaces the app server (new IP), the new one still connects`, flow: { from: "app", to: "db", port: 5432 }, expect: true, replace: "app" },
                ],
                why: `Change the source of DB SG's rule to App SG. Any instance carrying App SG is allowed, whatever its IP, and nothing else is. Allowing 0.0.0.0/0 or the whole VPC would let the web server in too.`,
                solve: n => { n.sgs["sg-db"].in = [{ port: "5432", src: "sg-app" }]; },
                fixes: [
                  { t: `Change the rule's source to the app server's IP, 10.0.11.20/32`, apply: n => { n.sgs["sg-db"].in = [{ port: "5432", src: "10.0.11.20/32" }]; }, why: `It works today, but Auto Scaling replaces app servers, and the new one gets a new IP. The rule still names the old IP, so the new server is locked out. Check the "after Auto Scaling" tab on the map.` },
                  { t: `Change the rule's source to App SG`, ok: true, why: `Any instance that carries App SG is allowed, whatever its IP, and nothing else is.` },
                  { t: `Change the rule's source to the whole VPC, 10.0.0.0/16`, apply: n => { n.sgs["sg-db"].in = [{ port: "5432", src: "10.0.0.0/16" }]; }, why: `The app server gets in, but so does the web server and anything else in the VPC.` },
                  { t: `Add a second rule allowing 5432 from App SG and keep the subnet rule`, apply: n => { n.sgs["sg-db"].in.push({ port: "5432", src: "sg-app" }); }, why: `Security group rules combine with OR. The old subnet rule still lets the web server in.` },
                ],
              },
              {
                type: "spot", level: 2, unit: "rule",
                q: `The database security group of a three-tier app. Which rule is too broad?`,
                cols: ["Direction", "Port", "Source / destination"],
                rows: [
                  { cells: ["Inbound", "5432", "sg-app"], why: `Exactly right: only the app tier.` },
                  { cells: ["Inbound", "5432", "0.0.0.0/0"], bad: true, why: `Anyone who can route to the database can try to connect. Security groups combine rules with OR, so this one makes the sg-app rule pointless.` },
                  { cells: ["Outbound", "all", "0.0.0.0/0"], why: `The default; it doesn't let anything in.` },
                ],
              },
              {
                type: "mcq", level: 2,
                q: `A company has a Site-to-Site VPN to AWS and wants to know why some connections to an instance are being rejected. Which feature shows accepted and rejected traffic at the network level?`,
                options: [
                  { t: `VPC Flow Logs`, ok: true, why: `Flow Logs record IP traffic to and from network interfaces, including whether security groups or NACLs accepted or rejected it.` },
                  { t: `AWS CloudTrail`, ok: false, why: `CloudTrail logs API calls (who changed a security group), not network packets.` },
                  { t: `AWS Config`, ok: false, why: `Config shows how the security group or NACL is configured, but not the traffic it accepted or rejected.` },
                  { t: `IAM Access Analyzer`, ok: false, why: `Access Analyzer checks policy-based access to resources, not network traffic.` },
                ],
              },
            ],
          },
        ],
        explain: {
          prompt: `Why does a network ACL need rules for ephemeral ports, while a security group doesn't? When would you use each?`,
          points: [
            `Replies go to the client's ephemeral port (1024–65535), not the service port`,
            `Security groups are stateful: they remember connections and allow replies automatically`,
            `NACLs are stateless, so each direction's replies need their own rule`,
            `SGs: allow-only, per instance, can reference other SGs; NACLs: subnet-wide, allow and deny (e.g. block an IP), numbered, first match wins`,
          ],
        },
      },

      {
        id: "endpoints", title: "VPC endpoints: reaching AWS services privately", min: 3,
        tryFirst: {
          type: "mcq",
          q: `Instances in a private subnet with no NAT gateway must read from S3. Nothing may go over the internet, and it should cost as little as possible. What's your guess?`,
          options: [
            { t: `A gateway VPC endpoint for S3`, ok: true, why: `It's a free route-table entry that sends S3 traffic over AWS's private network.` },
            { t: `Add a NAT gateway`, ok: false, why: `Traffic would go to S3's public endpoint over the internet path, and you'd pay per hour and per GB.` },
            { t: `An interface VPC endpoint for S3`, ok: false, why: `It would work privately, but it costs per hour per AZ plus per GB. The gateway endpoint is free.` },
            { t: `Give the instances public IPs`, ok: false, why: `That means the internet, and a public subnet.` },
          ],
        },
        body: `<p>Services like S3, DynamoDB, SQS or Secrets Manager live <em>outside</em> your VPC, on public AWS addresses. Without anything else, private instances need a NAT gateway (and the internet path) to reach them. <strong>VPC endpoints</strong> give a private path instead. There are two kinds, and the exam loves the difference:</p>
<div class="tablewrap"><table><thead><tr><th></th><th>Gateway endpoint</th><th>Interface endpoint (PrivateLink)</th></tr></thead><tbody>
<tr><td>Services</td><td>Only S3 and DynamoDB</td><td>Almost every AWS service (S3 included) and partner services</td></tr>
<tr><td>How it works</td><td>An entry in your route tables (a prefix-list route, more specific than 0.0.0.0/0)</td><td>A network interface (ENI) with a private IP in your subnet</td></tr>
<tr><td>Cost</td><td>Free</td><td>Per hour per AZ, plus per GB</td></tr>
<tr><td>Reachable from on-premises, peered VPCs or a transit gateway</td><td>No</td><td>Yes, it's just a private IP</td></tr>
</tbody></table></div>
<p>You can attach an <strong>endpoint policy</strong> to restrict what goes through it, e.g. "only these buckets."</p>
<p>PrivateLink also works in the other direction: you can publish <em>your own</em> service (behind a Network Load Balancer) as an <strong>endpoint service</strong>. Other VPCs, even in other accounts with overlapping IP ranges, create interface endpoints to consume it privately. Only that one service is exposed, not the whole network. That's how SaaS companies offer private connectivity to customers.</p>`,
        example: `<p>Decision path: Is the caller inside the VPC and the target S3 or DynamoDB? Gateway endpoint (free). Is the caller on-premises or in another network, or is the target any other service? Interface endpoint.</p>`,
        concepts: [
          {
            id: "gateway-vs-interface", title: "Gateway vs interface endpoints", domain: "cost",
            variants: [
              {
                type: "mcq", level: 1,
                q: `On-premises servers connected through Direct Connect must reach Amazon S3 over private IP addresses only. Which endpoint type works?`,
                options: [
                  { t: `A gateway endpoint for S3`, ok: false, why: `Gateway endpoints are route-table entries inside the VPC. Traffic coming from on-premises can't use them; there's no IP address to send it to.` },
                  { t: `An interface endpoint for S3`, ok: true, why: `The interface endpoint is a private IP in your subnet, reachable over Direct Connect like any other VPC address.` },
                  { t: `A NAT gateway`, ok: false, why: `NAT sends traffic out to S3's public endpoints via the internet.` },
                  { t: `An egress-only internet gateway`, ok: false, why: `That's outbound internet access for IPv6, not a private path to S3.` },
                ],
              },
              {
                type: "mcq", level: 2,
                q: `A Lambda function runs in a VPC's private subnets with no NAT gateway. It must read from S3 and write to DynamoDB without any traffic going over the internet, at the lowest cost. What should be done?`,
                options: [
                  { t: `Create gateway endpoints for S3 and DynamoDB`, ok: true, why: `Gateway endpoints exist for exactly these two services. They're free, private, and work for anything inside the VPC, including Lambda functions.` },
                  { t: `Add a NAT gateway`, ok: false, why: `It would work, but traffic goes to public endpoints over the internet and you pay per hour and per GB.` },
                  { t: `Create interface endpoints for S3 and DynamoDB`, ok: false, why: `They'd work and stay private, but they're charged per hour per AZ plus per GB. Gateway endpoints do the same here for free.` },
                  { t: `Attach an internet gateway to the VPC`, ok: false, why: `An internet gateway alone doesn't help private subnets, and it would send traffic over the internet anyway.` },
                ],
              },
              {
                type: "tracefix", level: 3, focus: ["rt", "nat", "igw", "pub"],
                q: `Private subnet A has no NAT gateway route. The app server must read from S3 without any internet access and without paying for a NAT gateway.`,
                net: net(n => { n.rts["rt-private-a"].routes = []; }), flow: { from: "app", to: "s3", port: 443 }, open: ["rts"],
                goals: [
                  { label: `App server reaches S3`, flow: { from: "app", to: "s3", port: 443 }, expect: true },
                  { label: `No NAT gateway on the way to S3 (no NAT charges)`, flow: { from: "app", to: "s3", port: 443 }, avoid: "nat" },
                  { label: `App server has no general internet access`, flow: { from: "app", to: "internet", port: 443 }, expect: false },
                  { label: `App server stays private`, test: "private", node: "app" },
                ],
                why: `Associate the S3 gateway endpoint with Private route table A. It adds a prefix-list route for S3 only, so S3 works privately and nothing else gets out.`,
                solve: n => { n.s3ep.push("rt-private-a"); },
                fixes: [
                  { t: `Add a route 0.0.0.0/0 → NAT gateway A to Private route table A`, apply: n => { n.rts["rt-private-a"].routes.push({ dest: "0.0.0.0/0", target: "nat-a" }); }, why: `S3 works, but so does everything else on the internet, and you pay for NAT gateway hours and data.` },
                  { t: `Associate the S3 gateway endpoint with the public route table`, apply: n => { n.s3ep.push("rt-public"); }, why: `An endpoint only helps subnets whose route table it's associated with. Private route table A still has no route to S3.` },
                  { t: `Give the app server a public IP and route 0.0.0.0/0 to the internet gateway`, apply: n => { N.node(n, "app").pub = true; n.rts["rt-private-a"].routes.push({ dest: "0.0.0.0/0", target: "igw" }); }, why: `S3 is reached over the internet, the app server gets general internet access, and it's no longer private.` },
                  { t: `Associate the S3 gateway endpoint with Private route table A`, ok: true, why: `It adds a prefix-list route for S3 only. S3 works privately and for free, and nothing else gets out.` },
                ],
              },
              {
                type: "trace", level: 2,
                q: `Private subnet A routes 0.0.0.0/0 to NAT gateway A, <strong>and</strong> Private route table A is associated with an S3 gateway endpoint. The app server uploads a file to S3. Which path does it take?`,
                net: net(n => { n.s3ep = ["rt-private-a"]; }), flow: { from: "app", to: "s3", port: 443 }, expect: "ok",
                options: [
                  { t: `The gateway endpoint: its prefix-list route is more specific than 0.0.0.0/0`, ok: true, why: `Routing always picks the most specific match. S3's prefix list beats the catch-all route, so S3 traffic skips the NAT gateway (and its per-GB charge).` },
                  { t: `The NAT gateway, because 0.0.0.0/0 covers S3's addresses`, ok: false, why: `It does cover them, but a more specific route exists.` },
                  { t: `Both, load-balanced`, ok: false, why: `Routes aren't load-balanced; one route wins.` },
                  { t: `Neither: S3 requires a public IP`, ok: false, why: `Gateway endpoints exist precisely so private instances can reach S3.` },
                ],
              },
              {
                type: "multi", level: 3,
                q: `Which services can use a <strong>gateway</strong> endpoint?`,
                options: [
                  { t: `Amazon S3`, ok: true, why: `One of the two.` },
                  { t: `Amazon DynamoDB`, ok: true, why: `The other one.` },
                  { t: `Amazon SQS`, ok: false, why: `Interface endpoint only.` },
                  { t: `AWS Secrets Manager`, ok: false, why: `Interface endpoint only.` },
                  { t: `AWS KMS`, ok: false, why: `Interface endpoint only.` },
                ],
              },
            ],
          },
          {
            id: "privatelink-service", title: "Publishing a service with PrivateLink", domain: "secure",
            variants: [
              {
                type: "mcq", level: 1,
                q: `A SaaS company wants hundreds of customers to reach its API privately from their own VPCs. Many customers use the same IP range (10.0.0.0/16) as the company. What should the company use?`,
                options: [
                  { t: `VPC peering with each customer`, ok: false, why: `Peering doesn't work between VPCs with overlapping IP ranges, and hundreds of peerings would be unmanageable.` },
                  { t: `A PrivateLink endpoint service behind a Network Load Balancer`, ok: true, why: `Customers create interface endpoints in their own VPCs that connect to the service. Only that one service is exposed, and overlapping IP ranges don't matter, because each side only sees a local private IP.` },
                  { t: `A transit gateway shared with all customers`, ok: false, why: `A transit gateway would connect whole networks together (far more access than needed) and also can't route between overlapping IP ranges.` },
                  { t: `A public endpoint protected by a security group`, ok: false, why: `That's over the internet, not private.` },
                ],
              },
              {
                type: "mcq", level: 2,
                q: `An application in VPC A must call one internal service in VPC B, owned by another team in another account. Both VPCs use 10.0.0.0/16. Only that one service should be reachable. What is the BEST solution?`,
                options: [
                  { t: `Expose the service through a PrivateLink endpoint service and create an interface endpoint in VPC A`, ok: true, why: `PrivateLink works with overlapping IP ranges and exposes only that one service, not the whole network.` },
                  { t: `VPC peering between A and B`, ok: false, why: `Peering doesn't work with overlapping CIDRs, and it would expose the whole VPC, not just one service.` },
                  { t: `Attach both VPCs to a transit gateway`, ok: false, why: `A transit gateway can't route between overlapping ranges, and it connects entire networks, which is more access than required.` },
                  { t: `Make the service public and restrict it with a security group`, ok: false, why: `Traffic would cross the internet, which isn't private.` },
                ],
              },
              {
                type: "elim", level: 3,
                q: `Your team runs an internal API that 40 other teams' VPCs (in various accounts) must call.`,
                reqs: [`Only the API is reachable, not the rest of your VPC`, `Works even where VPC ranges overlap`, `No traffic over the internet`],
                options: [
                  { t: `A PrivateLink endpoint service (NLB in front of the API); each team creates an interface endpoint`, ok: true, why: `Exposes one service, ignores overlapping ranges, stays on AWS's network.` },
                  { t: `VPC peering with each team`, ok: false, kills: [0, 1], why: `Opens whole networks to each other, and overlapping ranges can't peer.` },
                  { t: `A transit gateway connecting all the VPCs`, ok: false, kills: [0, 1], why: `Network-wide connectivity, and it can't route overlapping ranges.` },
                  { t: `A public API endpoint with API keys`, ok: false, kills: [2], why: `Callers would cross the internet.` },
                ],
              },
            ],
          },
        ],
        explain: {
          prompt: `When would you choose a gateway endpoint and when an interface endpoint? Give a case for each, and say what PrivateLink endpoint services are for.`,
          points: [
            `Gateway endpoints: only S3 and DynamoDB, a free route-table entry, usable only from inside the VPC`,
            `Interface endpoints: a paid ENI with a private IP, for almost any service, reachable from on-premises or peered networks`,
            `Endpoint services: publish your own service behind an NLB; consumers connect privately, even with overlapping CIDRs, and see only that service`,
          ],
        },
      },

      {
        id: "peering-tgw", title: "Connecting VPCs: peering vs Transit Gateway", min: 3,
        tryFirst: {
          type: "mcq",
          q: `VPC A is peered with VPC B, and VPC B is peered with VPC C. Instances in A can't reach instances in C. What's your guess?`,
          options: [
            { t: `Peering isn't transitive: A and C need their own connection`, ok: true, why: `A peering connection only links the two VPCs involved. Traffic can't pass through B.` },
            { t: `Peering only works within one account`, ok: false, why: `It works across accounts and Regions.` },
            { t: `B's security group blocks it`, ok: false, why: `It's not a firewall issue; routing through B isn't possible at all.` },
            { t: `A needs an internet gateway`, ok: false, why: `Peering traffic is private.` },
          ],
        },
        body: `<p>VPCs are isolated from each other by default. Two ways to connect them:</p>
<p><strong>VPC peering</strong> is a private connection between exactly two VPCs (same or different accounts, same or different Regions). You add routes on both sides, and security groups must allow the traffic. There's no hourly charge. Its limits are what the exam tests:</p>
<ul><li><strong>Not transitive:</strong> if A peers with B and B peers with C, A can't reach C through B. Every pair needs its own peering. Same for B's VPN or Direct Connect: A can't use them through the peering.</li>
<li><strong>No overlapping IP ranges:</strong> two VPCs that both use 10.0.0.0/16 can't peer.</li></ul>
<p><strong>AWS Transit Gateway (TGW)</strong> is a regional hub, like a central router. Each VPC, VPN connection or Direct Connect gateway attaches once, and everything attached can reach everything else (routing is transitive). Its own route tables let you segment traffic, e.g. dev VPCs can't reach prod. Transit gateways in different Regions can peer with each other. You pay per attachment per hour plus per GB. Share it across accounts with AWS RAM.</p>
<p>Rule of thumb: <strong>a few VPCs → peering; many VPCs and/or on-premises → Transit Gateway.</strong></p>`,
        example: `<p>Full mesh of 10 VPCs with peering: 10×9/2 = 45 peering connections, each with routes on both sides. With a transit gateway: 10 attachments, one place to manage routing.</p>`,
        concepts: [
          {
            id: "peering-limits", title: "Peering: not transitive, no overlaps", domain: "performance",
            variants: [
              {
                type: "mcq", level: 1,
                q: `Two VPCs both use the CIDR 10.0.0.0/16, and they need to communicate. Can they use VPC peering?`,
                options: [
                  { t: `Yes, peering handles overlapping ranges automatically`, ok: false, why: `It doesn't: with identical ranges, routes can't tell which VPC an address belongs to.` },
                  { t: `No, peering requires non-overlapping CIDR ranges`, ok: true, why: `Peered VPCs must have distinct IP ranges. You'd re-address one VPC, or expose specific services through PrivateLink instead.` },
                  { t: `Yes, if they're in different Regions`, ok: false, why: `The overlap rule applies regardless of Region.` },
                  { t: `Yes, if both VPCs are in the same account`, ok: false, why: `The overlap rule applies regardless of account.` },
                ],
              },
              {
                type: "fill", level: 2,
                q: `How many peering connections does a full mesh of 6 VPCs need?`,
                accept: ["15"], placeholder: "a number",
                why: `Every pair needs its own: 6 × 5 ÷ 2 = 15. That growth is why many VPCs call for a transit gateway.`,
              },
              {
                type: "multi", level: 3,
                q: `VPC A (10.0.0.0/16) is peered with VPC B (10.1.0.0/16). What else is needed for instances to talk?`,
                options: [
                  { t: `Routes in both VPCs' route tables to the other's range, via the peering connection`, ok: true, why: `Peering creates the link; routes on both sides send traffic over it.` },
                  { t: `Security groups that allow the traffic`, ok: true, why: `Firewalls still apply as usual.` },
                  { t: `An internet gateway in each VPC`, ok: false, why: `Peering is private and doesn't touch the internet.` },
                  { t: `A NAT gateway in VPC A`, ok: false, why: `NAT is for internet access, not peering.` },
                ],
              },
              {
                type: "mcq", level: 2,
                q: `VPC A is peered with VPC B. VPC B has a Site-to-Site VPN to the office. Can servers in A reach the office through B?`,
                options: [
                  { t: `No: peering doesn't carry traffic onward to B's VPN or Direct Connect`, ok: true, why: `Peering isn't transitive for anything, including VPN and DX connections. Use a transit gateway to share on-premises connectivity.` },
                  { t: `Yes, once routes point to B`, ok: false, why: `AWS drops traffic that tries to transit a peering connection.` },
                  { t: `Yes, if the VPN uses BGP`, ok: false, why: `Routing protocol doesn't change it.` },
                  { t: `Only for traffic started from the office`, ok: false, why: `Neither direction works.` },
                ],
              },
            ],
          },
          {
            id: "tgw", title: "Transit Gateway as a hub", domain: "performance",
            variants: [
              {
                type: "elim", level: 3,
                q: `A company has 40 VPCs across 5 accounts, plus 2 data centers connected by VPN.`,
                reqs: [`Every network must reach the shared services, including from on-premises`, `Dev VPCs must not reach prod VPCs`, `Must stay manageable as more VPCs are added`],
                options: [
                  { t: `A transit gateway shared through RAM, with separate route tables for dev and prod`, ok: true, why: `Transitive hub for VPCs and VPNs, segmentation through TGW route tables, one attachment per new VPC.` },
                  { t: `Full-mesh VPC peering`, ok: false, kills: [0, 2], why: `Peering can't carry on-premises traffic onward, and 40 VPCs means 780 peerings.` },
                  { t: `One big shared VPC for everyone`, ok: false, kills: [1], why: `Dev and prod in one network breaks the isolation requirement.` },
                  { t: `A separate VPN from each data center to each VPC`, ok: false, kills: [2], why: `80 VPN connections to run, growing with every new VPC.` },
                ],
              },
              {
                type: "mcq", level: 2,
                q: `Which statement about AWS Transit Gateway is true?`,
                options: [
                  { t: `Routing between attachments is transitive, and its route tables can segment traffic`, ok: true, why: `That's what makes it a hub.` },
                  { t: `It's a global service spanning all Regions`, ok: false, why: `It's regional; transit gateways in different Regions can peer.` },
                  { t: `It handles overlapping VPC ranges automatically`, ok: false, why: `It can't route between overlapping ranges either.` },
                  { t: `It's free; you only pay for data`, ok: false, why: `You pay per attachment per hour plus per GB.` },
                ],
              },
              {
                type: "mcq", level: 2,
                q: `The network team owns a transit gateway in a central account. VPCs in other accounts of the organization must attach to it. How?`,
                options: [
                  { t: `Share it with AWS RAM`, ok: true, why: `RAM shares transit gateways (and subnets, and more) with other accounts.` },
                  { t: `Peer each VPC with the network account's VPC`, ok: false, why: `That's peering, not a transit gateway, and isn't transitive.` },
                  { t: `Copy the transit gateway into each account`, ok: false, why: `Resources can't be copied; that would create separate hubs.` },
                  { t: `An SCP allowing the attachment`, ok: false, why: `SCPs never grant anything.` },
                ],
              },
              {
                type: "mcq", level: 2,
                q: `Two VPCs in the same Region exchange a lot of data. Nothing else needs connecting. What's the MOST cost-effective option?`,
                options: [
                  { t: `VPC peering`, ok: true, why: `No hourly charge, and simple for two VPCs. A transit gateway adds per-attachment hours and per-GB processing.` },
                  { t: `A transit gateway`, ok: false, why: `Works, but costs more and its strengths (many networks, transitivity) aren't needed.` },
                  { t: `Site-to-Site VPN between them`, ok: false, why: `Hourly charges and lower throughput, for no benefit.` },
                  { t: `Route the traffic over the internet`, ok: false, why: `Not private, and you'd pay for public IPs and NAT.` },
                ],
              },
            ],
          },
        ],
        explain: {
          prompt: `When would you use VPC peering and when a Transit Gateway? Mention the two peering limits.`,
          points: [
            `Peering: private link between exactly two VPCs, no hourly cost, routes needed on both sides`,
            `Peering is not transitive (not through other VPCs, VPNs or DX) and can't connect overlapping ranges`,
            `Transit Gateway: regional hub, transitive, route tables for segmentation, connects VPCs and on-premises; paid per attachment and GB`,
            `Few VPCs → peering; many VPCs or on-premises → Transit Gateway`,
          ],
        },
      },

      {
        id: "hybrid", title: "Hybrid: Site-to-Site VPN and Direct Connect", min: 3,
        tryFirst: {
          type: "mcq",
          q: `A company needs an encrypted connection between its office and a VPC within two days, at low cost. What's your guess?`,
          options: [
            { t: `AWS Site-to-Site VPN`, ok: true, why: `It can be set up in hours, is always encrypted (IPsec), and costs little.` },
            { t: `AWS Direct Connect`, ok: false, why: `It takes weeks or months to provision a physical line, costs more, and isn't encrypted by default.` },
            { t: `VPC peering`, ok: false, why: `Peering connects two VPCs, not an office.` },
            { t: `An internet gateway`, ok: false, why: `That's the public internet, with no private link to the office.` },
          ],
        },
        body: `<p>Two ways to connect your own data center or office to AWS:</p>
<div class="tablewrap"><table><thead><tr><th></th><th>Site-to-Site VPN</th><th>Direct Connect (DX)</th></tr></thead><tbody>
<tr><td>Path</td><td>Encrypted IPsec tunnels over the public internet</td><td>Dedicated private physical line</td></tr>
<tr><td>Setup time</td><td>Minutes to hours</td><td>Weeks to months (a physical circuit)</td></tr>
<tr><td>Performance</td><td>Up to about 1.25 Gbps per tunnel, varies with the internet</td><td>Consistent latency; from 50 Mbps up to 100+ Gbps</td></tr>
<tr><td>Encryption</td><td>Always encrypted</td><td>Not encrypted by default</td></tr>
<tr><td>Cost</td><td>Low</td><td>Higher (port hours, partner circuits)</td></tr>
</tbody></table></div>
<p>A VPN has two ends. On AWS's side: a <strong>virtual private gateway (VGW)</strong> attached to one VPC, or a transit gateway. On your side: a <strong>customer gateway (CGW)</strong>, which is the AWS resource describing your physical router (its public IP and routing settings). Each VPN connection comes with two tunnels for redundancy.</p>
<p>Common exam combinations:</p>
<ul><li><strong>Cheap backup for Direct Connect:</strong> a Site-to-Site VPN. With BGP routing, traffic prefers DX and fails over to the VPN automatically.</li>
<li><strong>Encryption over Direct Connect:</strong> run a VPN over the DX connection (or use MACsec where supported).</li>
<li><strong>One DX to VPCs in several Regions:</strong> a <strong>Direct Connect gateway</strong>.</li>
<li><strong>Maximum resilience for DX:</strong> two DX connections at two different DX locations.</li>
<li><strong>Individual remote employees</strong> (laptops, not offices): <strong>AWS Client VPN</strong>.</li></ul>`,
        example: `<p>A company needs connectivity to AWS next week, with encryption: Site-to-Site VPN. Later, it moves 50 TB a month and needs predictable performance: it orders Direct Connect and keeps the VPN as the backup.</p>`,
        concepts: [
          {
            id: "vpn-vs-dx", title: "Site-to-Site VPN vs Direct Connect", domain: "performance",
            variants: [
              {
                type: "mcq", level: 1,
                q: `A company moves 50 TB a month between its data center and AWS and needs consistent, predictable latency. Speed of setup doesn't matter. What fits?`,
                options: [
                  { t: `AWS Direct Connect`, ok: true, why: `A dedicated line gives consistent latency and high bandwidth, which the internet can't guarantee.` },
                  { t: `Site-to-Site VPN`, ok: false, why: `It rides the public internet, so performance varies, and each tunnel tops out around 1.25 Gbps.` },
                  { t: `AWS Client VPN`, ok: false, why: `That's for individual users' devices.` },
                  { t: `Ship the data monthly on Snowball devices`, ok: false, why: `Offline transfer is for one-off bulk moves, not an ongoing connection.` },
                ],
              },
              {
                type: "multi", level: 3,
                q: `Which describe a <strong>Site-to-Site VPN</strong>?`,
                options: [
                  { t: `Encrypted IPsec tunnels over the internet`, ok: true, why: `Always encrypted.` },
                  { t: `Can be set up in hours`, ok: true, why: `No physical circuit needed.` },
                  { t: `Consistent, dedicated bandwidth`, ok: false, why: `That's Direct Connect.` },
                  { t: `Requires ordering a physical circuit`, ok: false, why: `That's Direct Connect.` },
                ],
              },
              {
                type: "mcq", level: 2,
                q: `"Direct Connect is a private line, so the traffic is encrypted." Is that right?`,
                options: [
                  { t: `No: DX is private but not encrypted by default`, ok: true, why: `Private and encrypted are different things. For encryption, run a VPN over DX or use MACsec.` },
                  { t: `Yes: DX always uses IPsec`, ok: false, why: `That's the VPN.` },
                  { t: `Yes, but only above 10 Gbps`, ok: false, why: `Speed doesn't change it.` },
                  { t: `Only if you also use a transit gateway`, ok: false, why: `A transit gateway doesn't encrypt anything.` },
                ],
              },
              {
                type: "mcq", level: 2,
                q: `200 employees work from home and need secure access to applications in a VPC from their laptops. What should be used?`,
                options: [
                  { t: `AWS Client VPN`, ok: true, why: `It's the managed VPN for individual users' devices.` },
                  { t: `A Site-to-Site VPN per employee`, ok: false, why: `Site-to-Site connects networks (offices, data centers), not individual laptops.` },
                  { t: `Direct Connect to each home`, ok: false, why: `Physical lines to homes: absurd cost and lead time.` },
                  { t: `Public IPs on the application servers`, ok: false, why: `That exposes them to the whole internet.` },
                ],
              },
            ],
          },
          {
            id: "hybrid-patterns", title: "Direct Connect patterns", domain: "resilient",
            variants: [
              {
                type: "mcq", level: 1,
                q: `A company uses Direct Connect, and a new compliance rule requires all traffic over it to be encrypted. What should it do?`,
                options: [
                  { t: `Nothing; Direct Connect is encrypted by default`, ok: false, why: `DX is private, but it isn't encrypted by default. Private and encrypted are different things.` },
                  { t: `Run an IPsec Site-to-Site VPN over the Direct Connect connection`, ok: true, why: `The VPN encrypts the traffic while it still travels over the dedicated DX line, keeping DX's consistent performance. (MACsec is another option on supported connections.)` },
                  { t: `Enable SSE-KMS on all S3 buckets`, ok: false, why: `That encrypts data at rest in S3, not data in transit over the network link.` },
                  { t: `Replace Direct Connect with an internet gateway`, ok: false, why: `That removes the private connection entirely.` },
                ],
              },
              {
                type: "mcq", level: 2,
                q: `A company has a single Direct Connect connection in eu-west-1. It now has VPCs in both eu-west-1 and us-east-1, and both must be reachable from the data center over the existing connection. What should it use?`,
                options: [
                  { t: `A Direct Connect gateway associated with the VPCs in both Regions`, ok: true, why: `A Direct Connect gateway lets one DX connection reach VPCs in multiple Regions.` },
                  { t: `A second Direct Connect connection in us-east-1`, ok: false, why: `It would work, but it adds a new physical circuit when the requirement is to use the existing one.` },
                  { t: `VPC peering between the two VPCs`, ok: false, why: `Peering connects the VPCs to each other, but on-premises traffic can't transit through a peering connection to reach the second VPC.` },
                  { t: `AWS Global Accelerator`, ok: false, why: `Global Accelerator speeds up internet users' traffic to your applications. It isn't for private data center connectivity.` },
                ],
              },
              {
                type: "elim", level: 3,
                q: `A trading firm connects its data center to AWS.`,
                reqs: [`Consistent latency and bandwidth on the main path`, `Keeps working if the main connection fails`, `Lowest extra cost for the backup`],
                options: [
                  { t: `Direct Connect as primary, Site-to-Site VPN as backup`, ok: true, why: `DX gives consistent performance; the VPN is a cheap automatic failover path.` },
                  { t: `Site-to-Site VPN only`, ok: false, kills: [0], why: `Internet performance varies.` },
                  { t: `A single Direct Connect connection`, ok: false, kills: [1], why: `One line is a single point of failure.` },
                  { t: `Two Direct Connect connections at two different locations`, ok: false, kills: [2], why: `The most resilient option, but a second circuit costs far more than a VPN.` },
                ],
              },
              {
                type: "mcq", level: 2,
                q: `A bank's critical workloads need the MOST resilient Direct Connect setup, protecting even against the loss of a whole DX location. What's recommended?`,
                options: [
                  { t: `Direct Connect connections at two different DX locations`, ok: true, why: `Separate locations survive a location-wide failure (fiber cut, power, the facility itself).` },
                  { t: `Two connections at the same DX location`, ok: false, why: `Protects against a device failure, not the loss of the location.` },
                  { t: `One connection with a larger port speed`, ok: false, why: `Bandwidth isn't redundancy.` },
                  { t: `One connection plus a VPN backup`, ok: false, why: `Good and cheap, but the question asks for maximum resilience for critical workloads.` },
                ],
              },
            ],
          },
        ],
        explain: {
          prompt: `Compare Site-to-Site VPN and Direct Connect. What's a cheap way to make Direct Connect resilient, and how would you encrypt traffic over it?`,
          points: [
            `VPN: encrypted IPsec over the internet, quick to set up, cheap, variable performance`,
            `Direct Connect: dedicated private line, consistent performance, weeks to set up, not encrypted by default`,
            `Cheap resilience: a VPN as backup to DX (BGP fails over); maximum resilience: two DX locations`,
            `Encrypt over DX by running a VPN over it (or MACsec)`,
          ],
        },
      },
    ],
  });
})(SAA.nets);
