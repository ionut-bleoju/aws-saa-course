SAA.addModule({
  id: "m01", num: 1, title: "Foundations", sub: "How AWS is organized",
  lessons: [
    {
      id: "what-aws-is", title: "What AWS actually is", min: 3,
      tryFirst: {
        type: "mcq",
        q: `A team runs PostgreSQL on an EC2 server and loses hours every month to patching and backups. Their manager wants PostgreSQL with the <strong>least operational overhead</strong>. What's your guess?`,
        options: [
          { t: `Amazon RDS for PostgreSQL`, ok: true, why: `RDS is a managed database: AWS installs, patches and backs it up. Same PostgreSQL, far less work. That's exactly what "least operational overhead" points to.` },
          { t: `A bigger EC2 instance`, ok: false, why: `A bigger server is faster, but the team still patches and backs it up by hand.` },
          { t: `Write better backup scripts with cron`, ok: false, why: `That automates one chore, but the team still owns and maintains the scripts, the server and the patching.` },
          { t: `Run PostgreSQL inside AWS Lambda`, ok: false, why: `Lambda runs short functions in response to events. It can't host a long-running database server.` },
        ],
      },
      body: `<p>AWS rents you IT building blocks over the internet: servers, storage, databases, networks and hundreds of ready-made services. You pay for what you use (per second, per GB, per request) with no hardware to buy upfront.</p>
<p>Services sit on a spectrum of how much AWS manages for you:</p>
<ul><li><strong>Unmanaged:</strong> EC2 gives you a virtual server. You install, patch and scale the software yourself.</li>
<li><strong>Managed:</strong> RDS gives you a ready database. AWS installs, patches and backs it up; you choose the size and use it.</li>
<li><strong>Serverless:</strong> Lambda, DynamoDB, S3. No servers to see or size at all; you pay per request or per GB and they scale automatically.</li></ul>
<p>The exam constantly rewards moving toward the managed and serverless end. When a question says <em>least operational overhead</em>, the answer is usually the most managed option that still meets every requirement.</p>
<p>The flip side: the more AWS manages, the less you control. If a requirement needs something only full control gives you (root access to the operating system, software the managed service doesn't support), EC2 is still the right call.</p>`,
      example: `<p>You need PostgreSQL. Option A: launch EC2, install PostgreSQL, set up backups, patch it every month. Option B: create an RDS PostgreSQL database, and AWS does all of that. Both work, but B has less operational overhead, so it wins unless the question needs something only A allows, like a custom plugin that needs OS access.</p>`,
      concepts: [
        {
          id: "managed-spectrum", title: "Unmanaged vs managed vs serverless", domain: "cost",
          variants: [
            {
              type: "mcq",
              q: `A team wants to run MySQL but doesn't want to install, patch or back up the database software themselves. Which option fits?`,
              options: [
                { t: `Install MySQL on an EC2 instance`, ok: false, why: `EC2 is just a virtual server. You'd install MySQL, patch the OS and database, and set up backups yourself: exactly the work the team wants to avoid.` },
                { t: `Amazon RDS for MySQL`, ok: true, why: `RDS is the managed relational database service. AWS handles installation, patching, backups and (optionally) failover; you connect and use it.` },
                { t: `Amazon S3`, ok: false, why: `S3 is object storage for files. It's not a database engine and can't run SQL queries for an app the way MySQL does.` },
                { t: `AWS Lambda`, ok: false, why: `Lambda runs your code when an event happens. It's compute, not a database.` },
              ],
            },
            {
              type: "spot", unit: "row",
              q: `A colleague wrote this "who manages what" table. One row is wrong. Which?`,
              cols: ["Service", "You manage", "AWS manages"],
              rows: [
                { cells: ["EC2", "OS patches, installed software, data", "Hardware, network, virtualization"], why: `Correct: everything inside the instance is yours.` },
                { cells: ["RDS", "OS patching and database engine patching", "Only the hardware"], bad: true, why: `RDS is managed: AWS patches the OS and the database engine (in a maintenance window you pick). You manage database users, network access and your data.` },
                { cells: ["Lambda", "Your code and its permissions", "Servers, OS, scaling"], why: `Correct: with serverless, all you bring is code and configuration.` },
                { cells: ["S3", "Your data and who can access it", "Storage hardware, durability, scaling"], why: `Correct: S3 is serverless storage; access policies are always yours.` },
              ],
            },
            {
              type: "multi",
              q: `Which of these are <strong>serverless</strong>: no servers to choose or size, scaling automatically, paying per request or per GB?`,
              options: [
                { t: `AWS Lambda`, ok: true, why: `You upload code; AWS runs it per event and scales it automatically.` },
                { t: `Amazon DynamoDB`, ok: true, why: `A serverless NoSQL database: no instances to size, especially in on-demand mode.` },
                { t: `Amazon S3`, ok: true, why: `Unlimited storage, priced per GB and per request, with nothing to size.` },
                { t: `Amazon RDS`, ok: false, why: `RDS is managed, not serverless: you still choose an instance size and pay for it per hour, busy or idle.` },
                { t: `Amazon EC2`, ok: false, why: `EC2 is unmanaged: you pick instance types and run everything on them.` },
              ],
            },
            {
              type: "elim",
              q: `A startup needs a key-value database for a mobile backend. Traffic is zero at night and spikes hard after every marketing email. Nobody on the team is a database admin.`,
              reqs: [`No database administration work`, `Absorbs sudden spikes automatically`, `Qualifier: LEAST operational overhead`],
              options: [
                { t: `Amazon DynamoDB in on-demand mode`, ok: true, why: `Serverless: no servers, no patching, and on-demand capacity follows the traffic automatically.` },
                { t: `Redis installed on EC2 instances in an Auto Scaling group`, ok: false, kills: [0], why: `Someone has to install, patch, configure and back up Redis on those servers.` },
                { t: `A fixed-size Amazon RDS instance`, ok: false, kills: [1], why: `RDS is managed, but a fixed instance size doesn't grow on its own when a spike hits.` },
                { t: `MongoDB on a single large EC2 instance`, ok: false, kills: [0, 1], why: `Self-managed database work, and one fixed server doesn't absorb spikes.` },
              ],
            },
          ],
        },
        {
          id: "managed-limits", title: "When unmanaged (EC2) is still right", domain: "cost",
          variants: [
            {
              type: "mcq",
              q: `A vendor's monitoring agent must install a custom kernel module and needs root access to the operating system. Which option meets this with the least operational overhead?`,
              options: [
                { t: `Amazon EC2`, ok: true, why: `Only EC2 gives you the operating system itself, with root access and custom kernel modules. "Least overhead" only chooses among options that meet the requirements, and the managed ones don't.` },
                { t: `AWS Lambda`, ok: false, why: `Lambda gives you no access to the underlying OS or kernel.` },
                { t: `Amazon RDS`, ok: false, why: `RDS is a managed database; you don't get root on its servers.` },
                { t: `Amazon S3`, ok: false, why: `S3 is storage; nothing runs on it.` },
              ],
            },
            {
              type: "multi",
              q: `Which requirements push you toward EC2 instead of a managed or serverless service?`,
              options: [
                { t: `The software needs root access to the operating system`, ok: true, why: `Managed services hide the OS, so they can't meet this.` },
                { t: `The software isn't offered by any managed service`, ok: true, why: `If no managed service runs it, you host it yourself.` },
                { t: `The data must be backed up automatically`, ok: false, why: `Managed services do this for you. It's a reason to pick managed, not EC2.` },
                { t: `The app must scale with traffic`, ok: false, why: `Managed and serverless services scale too, usually with less effort.` },
              ],
            },
            {
              type: "mcq",
              q: `An app needs PostgreSQL with automated backups and standard extensions only. A developer proposes running it on EC2 "for flexibility". The question asks for the LEAST operational overhead. Best response?`,
              options: [
                { t: `Use Amazon RDS for PostgreSQL; flexibility isn't a requirement here`, ok: true, why: `Nothing in the requirements needs OS access, so the extra control of EC2 buys nothing but work.` },
                { t: `Use EC2, because flexibility is always worth having`, ok: false, why: `On the exam, flexibility nobody asked for is just operational overhead.` },
                { t: `Use EC2 with a script that copies backups to S3`, ok: false, why: `You'd be rebuilding by hand a feature RDS gives you for free.` },
                { t: `Use Amazon DynamoDB`, ok: false, why: `DynamoDB isn't PostgreSQL. The app needs a relational database with PostgreSQL extensions.` },
              ],
            },
          ],
        },
      ],
      explain: {
        prompt: `Why does the exam usually prefer a managed service over EC2, and when is EC2 still the right answer?`,
        points: [
          `Managed and serverless services take work off you: patching, backups, scaling, failover`,
          `"Least operational overhead" means the most managed option that still meets every requirement`,
          `EC2 wins only when a requirement needs control a managed service can't give (OS/root access, unsupported software)`,
        ],
      },
    },

    {
      id: "regions", title: "Regions", min: 3,
      tryFirst: {
        type: "mcq",
        q: `A Swiss bank's regulator requires customer data to stay in Switzerland. Most customers are actually in Germany, and Frankfurt (<code>eu-central-1</code>) is a bit cheaper than Zurich (<code>eu-central-2</code>). Where should the data live?`,
        options: [
          { t: `Zurich (eu-central-2)`, ok: true, why: `The legal requirement is a hard rule. Price and latency only get a say among the Regions that satisfy it, and only Zurich does.` },
          { t: `Frankfurt, because it's closer to most customers`, ok: false, why: `Latency matters, but never more than the law.` },
          { t: `Frankfurt, because it's cheaper`, ok: false, why: `Price is the weakest factor; it never overrides a legal rule.` },
          { t: `Both, to get the best of each`, ok: false, why: `Putting customer data in Frankfurt breaks the regulation.` },
        ],
      },
      body: `<p>A <strong>Region</strong> is a separate geographic area where AWS runs data centers, like Frankfurt or Ireland. Each has a code: <code>eu-central-1</code> = Frankfurt, <code>eu-west-1</code> = Ireland, <code>us-east-1</code> = N. Virginia.</p>
<p>Regions are independent: data you store in one Region stays there unless you copy it elsewhere. Most services are <em>regional</em> (you pick a Region when creating them). A few are <em>global</em>: IAM, Route 53 and CloudFront.</p>
<p>How to choose a Region, in the order the exam cares about:</p>
<ol><li><strong>Compliance / data residency:</strong> laws may require data to stay in a country or in the EU. This is a hard rule.</li>
<li><strong>Latency:</strong> closer to your users is faster.</li>
<li><strong>Service availability:</strong> some services launch in certain Regions first. If you need one that's missing, that's effectively a hard rule too.</li>
<li><strong>Price:</strong> prices differ a little between Regions. It's the tie-breaker.</li></ol>`,
      example: `<p>A German healthcare company must keep patient data in Germany. That rules out every Region except Frankfurt (<code>eu-central-1</code>), no matter which one is cheaper or faster.</p>`,
      concepts: [
        {
          id: "region-choice", title: "Choosing a Region", domain: "secure",
          variants: [
            {
              type: "mcq",
              q: `A company's legal team requires that customer data never leave the European Union. Most users are in the United States. What should decide the Region?`,
              options: [
                { t: `The Region closest to the US users`, ok: false, why: `Latency matters, but only after legal requirements are met. A US Region would break the EU-only rule.` },
                { t: `An EU Region, because compliance comes before latency and price`, ok: true, why: `Data residency is a hard requirement. You pick an EU Region first, then optimize speed within that limit.` },
                { t: `The cheapest Region`, ok: false, why: `Price is the lowest priority of the four factors. It never overrides a legal requirement.` },
                { t: `us-east-1, because new services often launch there first`, ok: false, why: `Service availability only matters if you need a service that's missing elsewhere. It never overrides the law.` },
              ],
            },
            {
              type: "order",
              q: `Put the Region selection factors in the order you apply them.`,
              steps: [`Compliance and data residency`, `Latency to users`, `Service availability`, `Price`],
              why: `Legal rules first (they're non-negotiable), then user experience, then whether the services you need exist there, and price as the tie-breaker.`,
            },
            {
              type: "mcq",
              q: `A startup is launching in Brazil and wants the lowest latency for users there. There are no regulatory constraints. What should it do?`,
              options: [
                { t: `Deploy in the São Paulo Region (sa-east-1)`, ok: true, why: `With no legal constraints, latency decides, and the Region closest to Brazilian users is São Paulo.` },
                { t: `Deploy in us-east-1 because it has the most services`, ok: false, why: `Service availability only matters if a needed service is missing. Nothing in the scenario says that, and the US is far from Brazil.` },
                { t: `Deploy in any Region and use larger instances`, ok: false, why: `Bigger servers don't fix network distance.` },
                { t: `Use AWS Outposts`, ok: false, why: `Outposts runs in your own data center. The startup doesn't have one, and doesn't need on-premises hardware.` },
              ],
            },
            {
              type: "multi",
              q: `Which of these can <strong>force</strong> a Region choice, no matter what it costs?`,
              options: [
                { t: `A law requiring data to stay in a country`, ok: true, why: `Data residency is non-negotiable.` },
                { t: `A required service that only exists in some Regions`, ok: true, why: `If the service isn't there, you can't use it there. That's a hard constraint too.` },
                { t: `One Region being 8% cheaper`, ok: false, why: `Price is a preference and the final tie-breaker, never a constraint.` },
                { t: `The team already knows the console in another Region`, ok: false, why: `The console works the same in every Region; it's not a factor.` },
              ],
            },
          ],
        },
        {
          id: "regional-global", title: "Regional vs global services", domain: "resilient",
          variants: [
            {
              type: "mcq",
              q: `Which group contains only GLOBAL services rather than regional ones?`,
              options: [
                { t: `IAM, Route 53, CloudFront`, ok: true, why: `IAM identities, Route 53 DNS and CloudFront distributions aren't tied to one Region.` },
                { t: `EC2, RDS, Lambda`, ok: false, why: `All regional: you choose a Region when you create them.` },
                { t: `VPC, subnets, security groups`, ok: false, why: `A VPC belongs to one Region, and its subnets each sit in one AZ.` },
                { t: `DynamoDB, SQS, S3`, ok: false, why: `All regional. S3 is a common trap: bucket names must be unique globally, but each bucket lives in one Region.` },
              ],
            },
            {
              type: "mcq",
              q: `You create an S3 bucket called <code>acme-reports</code> in <code>eu-west-1</code>. Where is the data stored?`,
              options: [
                { t: `Only in eu-west-1, unless you set up replication`, ok: true, why: `Buckets are regional. Only the bucket <em>name</em> is global (unique across all accounts).` },
                { t: `In every Region, because S3 is global`, ok: false, why: `S3's namespace is global; the data isn't. Nothing is copied across Regions unless you ask for it.` },
                { t: `In us-east-1, where S3 is managed`, ok: false, why: `Data lives in the Region you chose.` },
                { t: `At CloudFront edge locations`, ok: false, why: `Edge locations only hold cached copies if you put CloudFront in front of the bucket.` },
              ],
            },
            {
              type: "mcq",
              q: `For a disaster recovery test, a team copies an app from <code>eu-central-1</code> to <code>us-east-1</code>. Which of these do they NOT need to recreate in us-east-1?`,
              options: [
                { t: `IAM roles`, ok: true, why: `IAM is global: the same roles work in every Region of the account.` },
                { t: `The VPC and its subnets`, ok: false, why: `VPCs are regional; the DR Region needs its own.` },
                { t: `Security groups`, ok: false, why: `Security groups belong to a VPC, which is regional.` },
                { t: `The EC2 machine images (AMIs)`, ok: false, why: `AMIs are regional; you copy them to the other Region first.` },
              ],
            },
          ],
        },
      ],
      explain: {
        prompt: `How would you pick a Region for a new workload? And why doesn't a global service like IAM need a Region?`,
        points: [
          `Compliance / data residency first, because it's a hard rule`,
          `Then latency to users, then whether needed services exist there, then price`,
          `Data stays in its Region unless you copy it`,
          `IAM, Route 53 and CloudFront are global: not tied to any Region`,
        ],
      },
    },

    {
      id: "azs", title: "Availability Zones", min: 3,
      tryFirst: {
        type: "mcq",
        q: `Your app runs on two EC2 instances "for redundancy". Both are in <code>eu-central-1a</code>. A flood knocks out that zone's data center. What happens?`,
        options: [
          { t: `Both instances go down together`, ok: true, why: `Two instances protect against one server failing, not against the whole zone failing. They need to be in different zones.` },
          { t: `AWS moves them to another zone automatically`, ok: false, why: `EC2 doesn't migrate instances to another zone for you.` },
          { t: `One survives, because AWS spreads instances automatically`, ok: false, why: `You chose the same zone for both, so they share its fate.` },
          { t: `Nothing; data centers in a zone never fail together`, ok: false, why: `A zone is exactly the unit that can fail as a whole.` },
        ],
      },
      body: `<p>Each Region contains several <strong>Availability Zones (AZs)</strong>, usually three or more. An AZ is one or more data centers with its own power, cooling and networking, kilometers away from the other AZs but connected to them by very fast, low-latency links. AZ names look like <code>eu-central-1a</code>, <code>eu-central-1b</code>.</p>
<p>The point: one AZ can fail (fire, flood, power cut) while the others keep running. So the basic rule of reliability on AWS is <strong>spread across at least two AZs</strong>.</p>
<p>Words the exam uses for this:</p>
<ul><li><strong>Highly available:</strong> keeps working when a component fails, maybe briefly slower or with a short recovery.</li>
<li><strong>Fault tolerant:</strong> keeps working with <em>no</em> interruption and no drop in performance, because full spare capacity is already running.</li>
<li><strong>Single point of failure:</strong> one thing whose failure takes everything down, like one server, or one database in one AZ.</li></ul>
<p>A classic exam calculation: if you need N instances to handle the load and must keep full capacity after losing one AZ, the <em>remaining</em> AZs must hold N. With 3 AZs, losing one leaves 2/3 of your fleet, so you need N × 3/2.</p>`,
      example: `<p>You need 6 instances at peak and must survive an AZ failure at full performance. With 3 AZs: 3 per AZ = 9 total. Lose one AZ, 6 remain. With only 2 AZs you'd need 6 per AZ = 12 total, which is why using more AZs is often cheaper.</p>`,
      concepts: [
        {
          id: "multi-az", title: "Spread across AZs", domain: "resilient",
          variants: [
            {
              type: "mcq",
              q: `An application runs on two EC2 instances, both in eu-central-1a. What is the main risk?`,
              options: [
                { t: `If eu-central-1a fails, both instances go down together`, ok: true, why: `Two instances protect against one server failing, but not against the whole AZ failing. Put them in different AZs.` },
                { t: `Instances in the same AZ can't communicate with each other`, ok: false, why: `They can, and with very low latency. Same-AZ is great for speed; it's just bad for resilience.` },
                { t: `AWS allows only one instance per AZ`, ok: false, why: `There's no such limit; you can run many instances in one AZ.` },
                { t: `Their data is automatically copied to other Regions, which costs extra`, ok: false, why: `Nothing is copied across Regions automatically. Data stays where you put it.` },
              ],
            },
            {
              type: "mcq",
              q: `Which statement about Availability Zones is correct?`,
              options: [
                { t: `Each AZ has independent power and networking and is linked to other AZs in its Region with low-latency connections`, ok: true, why: `That's the definition: isolated enough to fail independently, close enough for fast replication between them.` },
                { t: `An AZ is a single server rack`, ok: false, why: `An AZ is one or more entire data centers.` },
                { t: `The AZs of one Region are in different countries`, ok: false, why: `All AZs of a Region are in the same geographic area, typically kilometers apart.` },
                { t: `Every service automatically copies data across all AZs`, ok: false, why: `It depends on the service. S3 stores data across multiple AZs automatically; an EBS volume lives in a single AZ.` },
              ],
            },
            {
              type: "spot", unit: "component",
              q: `Here's an architecture review. Which component is the single point of failure?`,
              cols: ["Component", "Placement"],
              rows: [
                { cells: ["Load balancer", "Subnets in AZ a and AZ b"], why: `Spans two AZs, so it survives one failing.` },
                { cells: ["Web servers (Auto Scaling group)", "AZ a and AZ b"], why: `Spread across two AZs.` },
                { cells: ["Database", "One instance in AZ a"], bad: true, why: `If AZ a fails, the only database is gone and the whole app stops. It needs a standby in another AZ (RDS Multi-AZ, module 6).` },
                { cells: ["S3 bucket for images", "Regional"], why: `S3 automatically stores data across multiple AZs.` },
              ],
            },
            {
              type: "mcq",
              q: `An app runs 4 instances in AZ a and none in AZ b, behind a load balancer that's enabled in both AZs. What's the problem?`,
              options: [
                { t: `An AZ a failure takes down every instance; the load balancer has nowhere to send traffic`, ok: true, why: `The load balancer spans two AZs, but the capacity doesn't. Resilience comes from where the instances are.` },
                { t: `Load balancers can't send traffic to instances in only one AZ`, ok: false, why: `They can. That's not the issue.` },
                { t: `Nothing, the load balancer makes it highly available`, ok: false, why: `A load balancer can't route to instances that don't exist.` },
                { t: `The instances in AZ a can't reach the internet`, ok: false, why: `Nothing in the scenario suggests a networking problem.` },
              ],
            },
          ],
        },
        {
          id: "ha-vs-ft", title: "High availability vs fault tolerance", domain: "resilient",
          variants: [
            {
              type: "mcq",
              q: `A system must keep running with zero interruption and no drop in performance if an entire AZ fails. Which design meets this?`,
              options: [
                { t: `One large instance with automatic recovery`, ok: false, why: `Recovery means restarting after failure, so there's downtime. And one instance in one AZ is a single point of failure.` },
                { t: `Instances in two AZs, each AZ able to handle the full load on its own`, ok: true, why: `That's fault tolerance: if one AZ fails, the other already has enough capacity running, so users notice nothing. It costs more, because you pay for double capacity.` },
                { t: `Instances in two AZs, each AZ carrying half the load`, ok: false, why: `Highly available but not fault tolerant: after an AZ fails, the remaining half is overloaded until more capacity starts. Performance drops.` },
                { t: `Two instances in the same AZ`, ok: false, why: `An AZ failure takes both down.` },
              ],
            },
            {
              type: "mcq",
              q: `An app needs 6 instances to handle peak load and must keep full performance if one AZ fails. The Region has 3 AZs. What's the minimum number of instances, spread evenly?`,
              options: [
                { t: `9 (3 per AZ)`, ok: true, why: `Lose one AZ and 6 remain, exactly the peak load. The rule: needed × AZs ÷ (AZs − 1) = 6 × 3 ÷ 2.` },
                { t: `6 (2 per AZ)`, ok: false, why: `Losing an AZ leaves 4, which is below the 6 needed.` },
                { t: `12 (6 per AZ in 2 AZs)`, ok: false, why: `It works, but with 3 AZs available, 9 is enough.` },
                { t: `18 (6 per AZ)`, ok: false, why: `Far more than needed: losing one AZ would still leave 12.` },
              ],
            },
            {
              type: "fill",
              q: `An app needs 4 instances at peak. It runs in 2 AZs, spread evenly, and must keep full capacity if either AZ fails. What's the minimum total number of instances?`,
              accept: ["8"], placeholder: "a number",
              why: `With 2 AZs, each one must carry the full 4 on its own: 4 × 2 = 8. (With 3 AZs, 6 would be enough: 2 per AZ.)`,
            },
            {
              type: "multi",
              q: `Which of these describe <strong>fault tolerance</strong>, not just high availability?`,
              options: [
                { t: `Users notice no interruption when a component fails`, ok: true, why: `That's the defining property of fault tolerance.` },
                { t: `Enough spare capacity is already running to absorb a failure`, ok: true, why: `That's how fault tolerance is achieved.` },
                { t: `The service recovers within a few minutes after a failure`, ok: false, why: `Recovering after an outage is high availability, not fault tolerance.` },
                { t: `Instances in two AZs, each sized for half the load`, ok: false, why: `After an AZ fails, the survivors are overloaded until more start: highly available, not fault tolerant.` },
              ],
            },
          ],
        },
      ],
      explain: {
        prompt: `What's the difference between "highly available" and "fault tolerant"? Use an example with two AZs.`,
        points: [
          `An AZ is an isolated set of data centers that can fail on its own`,
          `Highly available: survives a failure, but may briefly degrade or recover`,
          `Fault tolerant: no interruption at all, because full spare capacity is already running`,
          `Example: two AZs each sized for 100% of the load = fault tolerant; each sized for 50% = only highly available`,
        ],
      },
    },

    {
      id: "edge", title: "Edge locations, Local Zones, Outposts", min: 2,
      tryFirst: {
        type: "mcq",
        q: `A factory must process machine data on-site: it needs very low latency to its equipment, and a rule says the data can't leave the building. The team still wants the same AWS APIs and tools they use in the cloud. What's your guess?`,
        options: [
          { t: `AWS Outposts`, ok: true, why: `Outposts puts AWS hardware, managed by AWS, inside your own data center. Data stays in the building, and you use the same AWS APIs.` },
          { t: `An AWS Local Zone`, ok: false, why: `Local Zones are AWS sites in big cities: close, but not inside your building.` },
          { t: `An edge location`, ok: false, why: `Edge locations serve CloudFront, Route 53 and Global Accelerator. You can't run your own workloads there.` },
          { t: `The nearest Region, connected with a VPN`, ok: false, why: `The processing would happen in the Region, so data leaves the building.` },
        ],
      },
      body: `<p><strong>Edge locations</strong> (also called points of presence) are hundreds of small AWS sites in cities worldwide, far more than there are Regions. You don't run your own servers there; some AWS services use them to get close to users: CloudFront caches content there, Route 53 answers DNS lookups from there, and Global Accelerator brings user traffic onto AWS's private network there.</p>
<p>Two related options that show up occasionally:</p>
<ul><li><strong>Local Zones:</strong> small extensions of a Region placed in a big city, for apps that need single-digit-millisecond latency to users there (gaming, live video, media editing). You run EC2 and a few other services in them.</li>
<li><strong>Outposts:</strong> racks of AWS hardware installed in <em>your own</em> data center, running AWS services on-premises and managed by AWS. Used when data must stay on-site or must sit right next to local equipment.</li></ul>`,
      example: `<p>Quick test: Whose building? AWS's small city site → Local Zone. Yours → Outposts. Only caching, DNS or traffic entry, no workloads of yours → edge location.</p>`,
      concepts: [
        {
          id: "edge-local-outposts", title: "Edge locations vs Local Zones vs Outposts", domain: "performance",
          variants: [
            {
              type: "mcq",
              q: `A company must run workloads in its own data center because of data residency rules, but wants to use the same AWS services, APIs and tools it uses in the cloud. Which option fits?`,
              options: [
                { t: `AWS Local Zones`, ok: false, why: `Local Zones are AWS-operated sites in large cities. They're closer to users, but they're not inside your building.` },
                { t: `AWS Outposts`, ok: true, why: `Outposts puts AWS hardware in your own data center, running AWS services with the same APIs and tools, while the data stays on-site.` },
                { t: `Edge locations`, ok: false, why: `Edge locations serve CloudFront, Route 53 and Global Accelerator traffic. You can't run your own workloads there.` },
                { t: `A VPN to the nearest Region`, ok: false, why: `The workload would still run in the Region, so data leaves the building, which breaks the rule.` },
              ],
            },
            {
              type: "mcq",
              q: `A game studio needs latency of a few milliseconds for players in a large city that has no AWS Region. It has no data center there. What should it use?`,
              options: [
                { t: `An AWS Local Zone in that city`, ok: true, why: `Local Zones put AWS compute in big cities without a full Region, for single-digit-millisecond latency to local users.` },
                { t: `An edge location`, ok: false, why: `Edge locations serve CloudFront, Route 53 and Global Accelerator. You can't run game servers there.` },
                { t: `AWS Outposts`, ok: false, why: `Outposts needs your own data center to install the racks, which the studio doesn't have there.` },
                { t: `Bigger instances in the nearest Region`, ok: false, why: `Instance size doesn't reduce network distance.` },
              ],
            },
            {
              type: "multi",
              q: `What happens at AWS <strong>edge locations</strong>?`,
              options: [
                { t: `CloudFront caches content close to users`, ok: true, why: `That's the main use of edge locations.` },
                { t: `Route 53 answers DNS queries`, ok: true, why: `Route 53 serves DNS from the edge network.` },
                { t: `Global Accelerator brings user traffic onto AWS's network`, ok: true, why: `Traffic enters AWS's private backbone at the nearest edge location.` },
                { t: `You run your own EC2 instances`, ok: false, why: `Not at edge locations. For compute close to a city, that's a Local Zone.` },
                { t: `RDS databases are hosted`, ok: false, why: `Databases run in Regions (or Outposts), not at the edge.` },
              ],
            },
            {
              type: "elim",
              q: `A hospital must process imaging data from its scanners.`,
              reqs: [`By law, the data must stay inside the hospital building`, `Very low latency to the scanners`, `Same AWS APIs and tools the team uses in the cloud`],
              options: [
                { t: `AWS Outposts in the hospital's server room`, ok: true, why: `AWS hardware in the building, right next to the scanners, with the same AWS APIs.` },
                { t: `An AWS Local Zone in the same city`, ok: false, kills: [0], why: `It's an AWS site, not the hospital's building, so data would leave it.` },
                { t: `The nearest Region over Direct Connect`, ok: false, kills: [0, 1], why: `Data leaves the building, and the Region is far from the scanners.` },
                { t: `The hospital's own servers running VMware`, ok: false, kills: [2], why: `It keeps data on-site, but it isn't AWS, so no AWS APIs or tools.` },
              ],
            },
          ],
        },
      ],
      explain: {
        prompt: `When would you use an edge location, a Local Zone, and Outposts? One sentence each, and how to tell them apart.`,
        points: [
          `Edge locations: CloudFront caching, Route 53 DNS, Global Accelerator entry; you don't run your own workloads there`,
          `Local Zone: an AWS site in a big city for single-digit-ms latency, when there's no Region nearby`,
          `Outposts: AWS hardware in your own data center, for data that must stay on-site or sit next to local equipment`,
        ],
      },
    },

    {
      id: "shared-responsibility", title: "Shared responsibility", min: 2,
      tryFirst: {
        type: "mcq",
        q: `A database running on EC2 gets hacked through an operating system bug that had a patch available for a year. Whose responsibility was that patch?`,
        options: [
          { t: `The customer's`, ok: true, why: `On EC2, everything inside the instance (OS, software, data) is yours to patch and secure.` },
          { t: `AWS's, because it runs the data center`, ok: false, why: `AWS secures the hardware and virtualization under the instance, not the OS inside it.` },
          { t: `Shared 50/50`, ok: false, why: `Responsibility is split by layer, not by percentage. The OS layer on EC2 is fully the customer's.` },
          { t: `Nobody's; EC2 patches itself`, ok: false, why: `It doesn't.` },
        ],
      },
      body: `<p>Security is split between AWS and you. AWS secures the cloud <strong>itself</strong>: buildings, hardware, network and the virtualization layer. You secure what you put <strong>in</strong> the cloud: your data, who has access (IAM), network rules, encryption settings and anything you install.</p>
<p>The line moves depending on how managed the service is:</p>
<div class="tablewrap"><table><thead><tr><th>Service</th><th>AWS handles</th><th>You handle</th></tr></thead><tbody>
<tr><td>EC2</td><td>Hardware, network, virtualization</td><td>OS patches, installed software, firewall rules, data</td></tr>
<tr><td>RDS</td><td>Hardware, OS, database patching, automated backups</td><td>Database users, network access, choosing encryption, data</td></tr>
<tr><td>S3, Lambda</td><td>Everything underneath</td><td>Your data or code, access policies, encryption settings</td></tr>
</tbody></table></div>
<p>One thing never moves: <strong>your data and who can access it are always yours</strong>, however managed the service.</p>`,
      example: `<p>If the hacked database from the question had run on RDS, AWS would have patched the OS and database engine. But if the RDS database had been opened to the whole internet with a weak password, that would still be on the customer.</p>`,
      concepts: [
        {
          id: "shared-line", title: "Where the responsibility line sits", domain: "secure",
          variants: [
            {
              type: "mcq",
              q: `For Amazon RDS, which of these is AWS's responsibility?`,
              options: [
                { t: `Patching the database engine and the underlying OS`, ok: true, why: `RDS is managed, so AWS applies OS and engine patches (in a maintenance window you can choose).` },
                { t: `Creating database users with least privilege`, ok: false, why: `Who can log into the database and what they can do is your configuration.` },
                { t: `Deciding whether the database is encrypted`, ok: false, why: `AWS provides encryption, but turning it on is your choice.` },
                { t: `Choosing which networks can reach the database`, ok: false, why: `Network access (security groups, subnets) is your configuration.` },
              ],
            },
            {
              type: "mcq",
              q: `A company stores files in an S3 bucket. A misconfigured bucket policy accidentally makes them public. Under the shared responsibility model, who is responsible?`,
              options: [
                { t: `AWS, because S3 is a managed service`, ok: false, why: `AWS secures the infrastructure that runs S3. Access settings on your bucket are your configuration.` },
                { t: `The customer`, ok: true, why: `Access policies and data protection are always the customer's job, however managed the service is.` },
                { t: `Both equally`, ok: false, why: `The bucket policy is entirely the customer's configuration.` },
                { t: `Nobody, because S3 blocks public access permanently`, ok: false, why: `S3 blocks public access by default, but a customer can turn that off and write a public policy.` },
              ],
            },
            {
              type: "multi",
              q: `For AWS Lambda, which are the <strong>customer's</strong> responsibility?`,
              options: [
                { t: `The function's code and the libraries it bundles`, ok: true, why: `Your code, your vulnerabilities.` },
                { t: `The permissions in the function's IAM role`, ok: true, why: `Access configuration is always yours.` },
                { t: `Patching the operating system the functions run on`, ok: false, why: `Lambda is serverless: AWS patches everything underneath.` },
                { t: `Adding servers when traffic grows`, ok: false, why: `Lambda scales automatically.` },
              ],
            },
            {
              type: "spot", unit: "row",
              q: `Which row of this responsibility table is wrong?`,
              cols: ["Service", "Task", "Owner"],
              rows: [
                { cells: ["EC2", "Patch the guest operating system", "Customer"], why: `Right: the OS inside the instance is yours.` },
                { cells: ["RDS", "Apply database engine patches", "AWS"], why: `Right: AWS applies them in your maintenance window.` },
                { cells: ["S3", "Decide who can read the bucket", "AWS"], bad: true, why: `Access control is always the customer's: bucket policies, IAM policies and Block Public Access settings.` },
                { cells: ["Any service", "Physical security of data centers", "AWS"], why: `Right: the buildings and hardware are AWS's.` },
              ],
            },
          ],
        },
      ],
      explain: {
        prompt: `Explain the shared responsibility model, using EC2 vs RDS as the example. What never moves to AWS?`,
        points: [
          `AWS secures the cloud itself: buildings, hardware, network, virtualization`,
          `On EC2 you own the OS, patches and installed software; on RDS, AWS patches the OS and engine`,
          `Your data and who can access it are always yours, whatever the service`,
        ],
      },
    },

    {
      id: "exam-reading", title: "How to read an exam question", min: 4,
      tryFirst: {
        type: "mcq",
        q: `A question asks for the MOST cost-effective solution. Option A meets all requirements for $300/month. Option B costs $100/month but takes 3 hours, and the requirement says it must finish within one hour. Option C meets all requirements with the least overhead, for $500/month. Your guess?`,
        options: [
          { t: `Option A`, ok: true, why: `First cross out anything that breaks a requirement (B). Among the survivors, the qualifier decides: A is the cheapest valid option.` },
          { t: `Option B`, ok: false, why: `Cheapest, but it breaks a requirement. An option that fails a requirement is never correct, however cheap.` },
          { t: `Option C`, ok: false, why: `It would win a 'least operational overhead' question, but this one asks about cost.` },
          { t: `It can't be decided`, ok: false, why: `It can: eliminate, then apply the qualifier.` },
        ],
      },
      body: `<p>Nearly every question ends with a <strong>qualifier</strong> that decides between options that all technically work:</p>
<div class="tablewrap"><table><thead><tr><th>Qualifier</th><th>Means</th><th>Typical winners</th></tr></thead><tbody>
<tr><td>MOST cost-effective</td><td>Cheapest option that still meets every requirement</td><td>Spot, S3 lifecycle rules, serverless for spiky load</td></tr>
<tr><td>LEAST operational overhead</td><td>Least for you to build, run and patch</td><td>Managed or serverless services, built-in features instead of scripts</td></tr>
<tr><td>Highly available</td><td>Survives a component or AZ failing</td><td>Multi-AZ, Auto Scaling, load balancers</td></tr>
<tr><td>Fault tolerant</td><td>No interruption at all</td><td>Full spare capacity already running</td></tr>
<tr><td>Scalable / elastic</td><td>Grows and shrinks with demand</td><td>Auto Scaling, serverless</td></tr>
<tr><td>Decoupled</td><td>Parts don't depend on each other's speed or uptime</td><td>SQS, SNS, EventBridge</td></tr>
<tr><td>MOST secure</td><td>Least privilege, private networking, encryption, temporary credentials</td><td>IAM roles, VPC endpoints, KMS</td></tr>
</tbody></table></div>
<p><strong>Method:</strong> read the last sentence first to find the qualifier. Then list each requirement in the scenario, cross out every option that breaks one, and let the qualifier choose among the survivors. The "requirement eliminator" exercises in this course train exactly that.</p>
<p>The exam's four domains are secure (30%), resilient (26%), high-performing (24%) and cost-optimized (20%) architectures. They come from the <strong>AWS Well-Architected Framework</strong>, AWS's design guide, which has six pillars: operational excellence, security, reliability, performance efficiency, cost optimization and sustainability.</p>
<p>You manage AWS through the web <strong>console</strong>, the <strong>CLI</strong> (command line), <strong>SDKs</strong> (libraries for your code), or <strong>infrastructure as code</strong> with CloudFormation templates.</p>`,
      example: `<p>Four AWS names that start with "Cloud" and get confused constantly: <strong>CloudFormation</strong> builds infrastructure from templates. <strong>CloudTrail</strong> logs who called which API. <strong>CloudWatch</strong> collects metrics, logs and alarms. <strong>CloudFront</strong> is the CDN that caches content near users.</p>`,
      concepts: [
        {
          id: "qualifiers", title: "Qualifiers decide between working options", domain: "cost",
          variants: [
            {
              type: "mcq",
              q: `Two options both meet every requirement. One uses a custom script running on EC2; the other uses a built-in feature of a managed service. The question asks for the LEAST operational overhead. Which do you pick?`,
              options: [
                { t: `The custom script on EC2`, ok: false, why: `You'd write, host, monitor, patch and fix that script forever. That's operational overhead.` },
                { t: `The built-in feature of the managed service`, ok: true, why: `AWS runs and maintains it for you. On the exam, a built-in managed feature almost always beats a homemade script.` },
                { t: `Whichever is cheaper`, ok: false, why: `The qualifier is overhead, not cost. Answer the question that was asked.` },
                { t: `Whichever is faster`, ok: false, why: `Speed isn't the qualifier here.` },
              ],
            },
            {
              type: "elim",
              q: `A nightly export of customer data to a partner needs automating.`,
              reqs: [`The exported data must be encrypted`, `Qualifier: LEAST operational overhead`],
              options: [
                { t: `A built-in export feature of a managed service, with encryption on, $120/month`, ok: true, why: `Meets the encryption requirement, and AWS runs it.` },
                { t: `Custom scripts on an EC2 instance that encrypt and upload the file, $80/month`, ok: false, kills: [1], why: `It works and is cheaper, but you own the server and the scripts. The qualifier is overhead, not cost.` },
                { t: `A managed export feature without encryption support, $60/month`, ok: false, kills: [0], why: `Cheapest and managed, but it can't encrypt, so it fails a requirement.` },
                { t: `Keep doing the export by hand every night`, ok: false, kills: [1], why: `Manual work every night is the definition of operational overhead.` },
              ],
            },
            {
              type: "multi",
              q: `A question asks for the MOST secure option. Which properties usually point to the winner?`,
              options: [
                { t: `Temporary credentials (IAM roles) instead of stored access keys`, ok: true, why: `Nothing long-lived to leak.` },
                { t: `Least-privilege permissions`, ok: true, why: `Only what's needed, nothing more.` },
                { t: `Private connectivity instead of going over the internet`, ok: true, why: `For example VPC endpoints or private subnets.` },
                { t: `The lowest monthly cost`, ok: false, why: `That's the cost qualifier, not security.` },
                { t: `The fewest AWS services involved`, ok: false, why: `Simplicity is nice, but it isn't what "most secure" means.` },
              ],
            },
            {
              type: "order",
              q: `Put the exam-question method in order.`,
              steps: [`Read the last sentence to find the qualifier`, `List the requirements in the scenario`, `Cross out options that break any requirement`, `Let the qualifier choose among the survivors`],
              why: `Requirements filter, the qualifier decides. Doing it in this order stops you from picking the cheapest (or most managed) option that quietly fails a requirement.`,
            },
          ],
        },
        {
          id: "cloud-names", title: "CloudFormation, CloudTrail, CloudWatch, CloudFront", domain: "secure",
          variants: [
            {
              type: "mcq",
              q: `Which AWS service lets you define infrastructure in template files (infrastructure as code)?`,
              options: [
                { t: `AWS CloudFormation`, ok: true, why: `CloudFormation reads YAML or JSON templates and creates, updates or deletes the resources described in them.` },
                { t: `AWS CloudTrail`, ok: false, why: `CloudTrail is the audit log of API calls: who did what, and when.` },
                { t: `Amazon CloudWatch`, ok: false, why: `CloudWatch is monitoring: metrics, logs and alarms.` },
                { t: `AWS Config`, ok: false, why: `Config records how resources are configured over time and checks them against rules. It doesn't create infrastructure.` },
              ],
            },
            {
              type: "mcq",
              q: `An EC2 instance was terminated yesterday and nobody admits doing it. Which service shows who made the API call?`,
              options: [
                { t: `AWS CloudTrail`, ok: true, why: `CloudTrail records API calls with who made them, when and from where. Look for the TerminateInstances event.` },
                { t: `Amazon CloudWatch`, ok: false, why: `CloudWatch shows metrics and logs (like CPU usage), not who called which API.` },
                { t: `AWS Config`, ok: false, why: `Config shows how a resource's configuration changed over time (and links to the CloudTrail event), but CloudTrail is the record of who made the call.` },
                { t: `IAM credential report`, ok: false, why: `The credential report lists users and the status of their passwords and keys. It doesn't show actions.` },
              ],
            },
            {
              type: "mcq",
              q: `You want an email whenever an instance's CPU stays above 80% for 10 minutes. Which service?`,
              options: [
                { t: `Amazon CloudWatch (an alarm on the CPU metric)`, ok: true, why: `CloudWatch collects metrics and alarms on them; the alarm can notify through SNS email.` },
                { t: `AWS CloudTrail`, ok: false, why: `CloudTrail records API calls, not performance metrics.` },
                { t: `AWS CloudFormation`, ok: false, why: `CloudFormation builds infrastructure; it doesn't watch it.` },
                { t: `Amazon CloudFront`, ok: false, why: `CloudFront is a CDN.` },
              ],
            },
            {
              type: "mcq",
              q: `Users in Asia see slow downloads of images stored in an S3 bucket in <code>eu-west-1</code>. Which service fixes this most directly?`,
              options: [
                { t: `Amazon CloudFront`, ok: true, why: `CloudFront caches the images at edge locations near the users, so most downloads never travel to Ireland.` },
                { t: `Amazon CloudWatch`, ok: false, why: `It would show the latency, not fix it.` },
                { t: `AWS CloudTrail`, ok: false, why: `It logs API calls; it has nothing to do with download speed.` },
                { t: `AWS CloudFormation`, ok: false, why: `It builds infrastructure from templates; it doesn't speed anything up by itself.` },
              ],
            },
          ],
        },
      ],
      explain: {
        prompt: `Describe your method for an exam question where several options would technically work.`,
        points: [
          `Find the qualifier first (usually in the last sentence)`,
          `List the requirements and cross out every option that breaks one, however cheap or elegant`,
          `Let the qualifier pick among the survivors (cost, overhead, availability, security...)`,
        ],
      },
    },
  ],
});
