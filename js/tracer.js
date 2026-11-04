// Packet tracer: a simplified VPC model (TCP only) that explains hop by hop why traffic gets through or is blocked.
(function (SAA) {
  const esc = s => SAA.esc(s);
  const clone = o => JSON.parse(JSON.stringify(o));

  // ---------- addressing ----------
  const ipInt = ip => {
    const p = String(ip).trim().split("."); if (p.length !== 4) return null;
    let n = 0; for (const x of p) { if (!/^\d{1,3}$/.test(x) || +x > 255) return null; n = n * 256 + +x; } return n;
  };
  const intIp = n => [24, 16, 8, 0].map(s => Math.floor(n / 2 ** s) % 256).join(".");
  const parseCidr = s => {
    const m = String(s).trim().match(/^([\d.]+)\/(\d{1,2})$/); if (!m) return null;
    const base = ipInt(m[1]), bits = +m[2]; if (base === null || bits > 32) return null;
    const size = 2 ** (32 - bits); return { lo: Math.floor(base / size) * size, size, bits };
  };
  const inCidr = (cidr, ip) => { const c = parseCidr(cidr), n = ipInt(ip); return !!c && n !== null && n >= c.lo && n < c.lo + c.size; };
  const portOk = (spec, port) => {
    spec = String(spec).trim().toLowerCase(); if (spec === "all" || spec === "*") return true;
    const m = spec.match(/^(\d+)(?:\s*-\s*(\d+))?$/); if (!m) return false;
    const a = +m[1], b = m[2] ? +m[2] : a; return port >= a && port <= b;
  };
  const EPH = 50000;   // the client's ephemeral port; replies go back to it

  const EXT = {
    internet: { id: "internet", name: "Website on the internet", ip: "93.184.216.34", ext: true },
    s3: { id: "s3", name: "Amazon S3", ip: "52.219.170.1", ext: true, s3: true },
    user: { id: "user", name: "User on the internet", ip: "198.51.100.7", ext: true },
    office: { id: "office", name: "Your office", ip: "203.0.113.25", ext: true },
  };

  // ---------- presets ----------
  const threeTier = () => ({
    vpc: "10.0.0.0/16", igw: true,
    subnets: [
      { id: "pub-a", name: "Public subnet A", az: "a", cidr: "10.0.1.0/24", rt: "rt-public", nacl: "acl-default" },
      { id: "priv-a", name: "Private subnet A", az: "a", cidr: "10.0.11.0/24", rt: "rt-private-a", nacl: "acl-default" },
      { id: "pub-b", name: "Public subnet B", az: "b", cidr: "10.0.2.0/24", rt: "rt-public", nacl: "acl-default" },
      { id: "priv-b", name: "Private subnet B", az: "b", cidr: "10.0.12.0/24", rt: "rt-private-b", nacl: "acl-default" },
    ],
    rts: {
      "rt-public": { name: "Public route table", routes: [{ dest: "0.0.0.0/0", target: "igw" }] },
      "rt-private-a": { name: "Private route table A", routes: [{ dest: "0.0.0.0/0", target: "nat-a" }] },
      "rt-private-b": { name: "Private route table B", routes: [] },
    },
    nacls: { "acl-default": { name: "Default NACL", in: [{ n: 100, port: "all", cidr: "0.0.0.0/0", allow: true }], out: [{ n: 100, port: "all", cidr: "0.0.0.0/0", allow: true }] } },
    sgs: {
      "sg-web": { name: "Web SG", tier: "web", in: [{ port: "443", src: "0.0.0.0/0" }, { port: "22", src: "203.0.113.0/24" }], out: [{ port: "all", dst: "0.0.0.0/0" }] },
      "sg-app": { name: "App SG", tier: "app", in: [{ port: "8080", src: "sg-web" }], out: [{ port: "all", dst: "0.0.0.0/0" }] },
      "sg-db": { name: "DB SG", tier: "db", in: [{ port: "5432", src: "sg-app" }], out: [{ port: "all", dst: "0.0.0.0/0" }] },
    },
    nodes: [
      { id: "nat-a", name: "NAT gateway A", kind: "nat", subnet: "pub-a", ip: "10.0.1.5", eip: true, sgs: [] },
      { id: "web", name: "Web server", tier: "web", kind: "ec2", subnet: "pub-a", ip: "10.0.1.10", pub: true, sgs: ["sg-web"] },
      { id: "app", name: "App server", tier: "app", kind: "ec2", subnet: "priv-a", ip: "10.0.11.20", pub: false, sgs: ["sg-app"] },
      { id: "db", name: "Database", tier: "db", kind: "rds", subnet: "priv-b", ip: "10.0.12.30", pub: false, sgs: ["sg-db"] },
    ],
    s3ep: [],   // route tables associated with the S3 gateway endpoint (empty = no endpoint)
  });
  const single = () => ({
    vpc: "10.0.0.0/16", igw: true,
    subnets: [{ id: "sub-a", name: "Subnet A", az: "a", cidr: "10.0.1.0/24", rt: "rt-main", nacl: "acl-default" }],
    rts: { "rt-main": { name: "Main route table", routes: [{ dest: "0.0.0.0/0", target: "igw" }] } },
    nacls: { "acl-default": { name: "Default NACL", in: [{ n: 100, port: "all", cidr: "0.0.0.0/0", allow: true }], out: [{ n: 100, port: "all", cidr: "0.0.0.0/0", allow: true }] } },
    sgs: { "sg-web": { name: "Web SG", tier: "web", in: [{ port: "443", src: "0.0.0.0/0" }], out: [{ port: "all", dst: "0.0.0.0/0" }] } },
    nodes: [{ id: "web", name: "Web server", tier: "web", kind: "ec2", subnet: "sub-a", ip: "10.0.1.10", pub: true, sgs: ["sg-web"] }],
    s3ep: [],
  });
  const PRESETS = { threeTier, single };
  SAA.nets = { make: (name, mod) => { const n = PRESETS[name](); if (mod) mod(n); return n; } };
  // Helpers content files use to tweak presets.
  SAA.nets.node = (n, id) => n.nodes.find(x => x.id === id);
  SAA.nets.subnet = (n, id) => n.subnets.find(x => x.id === id);

  // ---------- engine ----------
  const tr = SAA.tracer = { inst: {}, util: { ipInt, parseCidr, inCidr, portOk }, EXT };
  const targetLabel = (net, t) => t === "igw" ? "the internet gateway" : t === "local" ? "local" : t === "vpce-s3" ? "the S3 gateway endpoint" : (net.nodes.find(n => n.id === t) || { name: `${t} (doesn't exist)` }).name;
  const isPublic = (net, s) => (net.rts[s.rt] || { routes: [] }).routes.some(r => r.target === "igw");

  const routeFor = (net, subnet, dst) => {
    const rt = net.rts[subnet.rt]; if (!rt) return null;
    if (inCidr(net.vpc, dst.ip)) return { dest: net.vpc, target: "local" };
    if (dst.s3 && net.s3ep.includes(subnet.rt)) return { dest: "pl-s3 (S3 prefix list)", target: "vpce-s3" };
    let best = null, bits = -1;
    rt.routes.forEach(r => { const c = parseCidr(r.dest); if (c && inCidr(r.dest, dst.ip) && c.bits > bits) { best = r; bits = c.bits; } });
    return best;
  };

  const naclHop = (net, subnet, dir, port, peerIp, reply) => {
    const acl = net.nacls[subnet.nacl] || { name: "(missing)", in: [], out: [] };
    const rules = (acl[dir] || []).slice().sort((x, y) => x.n - y.n);
    const rule = rules.find(r => portOk(r.port, port) && inCidr(r.cidr, peerIp));
    const ok = !!(rule && rule.allow);
    const what = rule ? `rule ${rule.n} (${rule.allow ? "ALLOW" : "DENY"} port ${rule.port} ${dir === "in" ? "from" : "to"} ${rule.cidr}) matches first` : "no rule matches, so the final * DENY applies";
    const hint = !ok && reply ? " NACLs are stateless: they don't remember the connection, so the reply needs its own rule for ephemeral ports (1024–65535)." : "";
    return {
      ok, kind: "nacl", at: `nacl|${dir}|${subnet.id}|${reply ? "reply" : "req"}`,
      label: `${reply ? "Reply · " : ""}NACL ${acl.name} · ${dir === "in" ? "inbound" : "outbound"} at ${subnet.name}`,
      detail: `Port ${port} ${dir === "in" ? "from" : "to"} ${peerIp}${reply ? " (the client's ephemeral port)" : ""}: ${what}.${hint}`,
    };
  };

  const sgHop = (net, node, dir, port, peer) => {
    let hit = null;
    for (const id of node.sgs) {
      const g = net.sgs[id]; if (!g) continue;
      for (const r of g[dir]) {
        const ref = dir === "in" ? r.src : r.dst;
        const match = String(ref).startsWith("sg-") ? (peer.sgs || []).includes(ref) : inCidr(ref, peer.ip);
        if (match && portOk(r.port, port)) { hit = { g, r, ref }; break; }
      }
      if (hit) break;
    }
    const names = node.sgs.map(id => (net.sgs[id] || { name: id }).name).join(", ") || "(none)";
    const peerTxt = `${peer.name} (${peer.ip}${peer.sgs && peer.sgs.length ? `, in ${peer.sgs.map(id => (net.sgs[id] || { name: id }).name).join(", ")}` : ""})`;
    return {
      ok: !!hit, kind: "sg", at: `sg|${dir}|${node.id}`,
      label: `Security group ${names} · ${dir === "in" ? "inbound" : "outbound"} on ${node.name}`,
      detail: hit
        ? `Port ${port} ${dir === "in" ? "from" : "to"} ${peerTxt} is allowed by the rule "port ${hit.r.port} ${dir === "in" ? "from" : "to"} ${String(hit.ref).startsWith("sg-") ? (net.sgs[hit.ref] || { name: hit.ref }).name : hit.ref}".${dir === "in" ? " Security groups are stateful, so the reply is allowed automatically." : ""}`
        : `No rule allows port ${port} ${dir === "in" ? "from" : "to"} ${peerTxt}. Security groups deny anything they don't explicitly allow.`,
    };
  };

  // flow: {from, to, port, azDown}. opt.all keeps going past blocked checkpoints (where the path is still known),
  // so every blocker on the path is reported. Each checkpoint hop has a stable `at` key (see stopTitle).
  tr.run = (net, flow, opt = {}) => {
    const hops = [], path = new Set(), all = !!opt.all;
    let blocked = 0;
    const out = () => ({ ok: !blocked, hops, path: [...path] });
    const push = h => { hops.push(h); if (!h.ok) blocked++; return h.ok || all; };   // false = stop here
    const fail = (label, detail, at) => { push({ ok: false, kind: "fail", label, detail, at }); return out(); };
    const find = id => net.nodes.find(n => n.id === id) || EXT[id];
    const sub = n => net.subnets.find(s => s.id === n.subnet);
    const src = find(flow.from), dst = find(flow.to), port = +flow.port;
    if (!src || !dst) return fail("Nothing to trace", "Pick a source and a destination.");
    if (!(port >= 1 && port <= 65535)) return fail("Invalid port", "Use a port between 1 and 65535.");
    if (src === dst) return fail("Same endpoint", "Pick two different endpoints.");
    const down = n => flow.azDown && !n.ext && sub(n) && sub(n).az === flow.azDown;
    for (const n of [src, dst]) if (down(n)) return fail(`AZ ${flow.azDown} is down`, `${n.name} is in AZ ${flow.azDown}, which has failed.`);
    path.add(src.id);
    const rtName = s => (net.rts[s.rt] || { name: s.rt }).name;
    const igwHop = () => push({ ok: !!net.igw, kind: "igw", at: "igw", label: "Internet gateway",
      detail: net.igw ? "Attached to the VPC." : "No internet gateway is attached to the VPC, so nothing gets in or out of it from the internet." });

    if (!src.ext) {
      if (src.kind !== "ec2") return fail("Can't start here", `Only EC2 instances start connections in the tracer. ${src.name} is a ${src.kind === "nat" ? "NAT gateway" : "database"}.`);
      const ss = sub(src);
      if (!push(sgHop(net, src, "out", port, dst))) return out();

      if (!dst.ext) {   // inside the VPC
        if (dst.kind === "nat") return fail("Pick another destination", "NAT gateways don't accept connections themselves.");
        const ds = sub(dst), same = ss.id === ds.id;
        if (same) hops.push({ ok: true, kind: "info", label: "Same subnet", detail: "Traffic that stays inside one subnet never crosses a NACL." });
        else {
          push({ ok: true, kind: "route", at: `rt|${ss.id}`, label: `Route table ${rtName(ss)}`, detail: `${dst.ip} is inside the VPC (${net.vpc}), so the local route delivers it. Every route table has it.` });
          if (!push(naclHop(net, ss, "out", port, dst.ip))) return out();
          if (!push(naclHop(net, ds, "in", port, src.ip))) return out();
        }
        if (!push(sgHop(net, dst, "in", port, src))) return out();
        path.add(dst.id);
        if (!same) {
          if (!push(naclHop(net, ds, "out", EPH, src.ip, true))) return out();
          if (!push(naclHop(net, ss, "in", EPH, dst.ip, true))) return out();
        }
        push({ ok: true, kind: "done", label: `Connected to ${dst.name}`, detail: "The connection works in both directions." });
        return out();
      }

      // to something outside the VPC: the route table picks the next stop, then the NACL checks the packet on its way out
      const r = routeFor(net, ss, dst);
      if (!r) return fail(`Route table ${rtName(ss)}`, `No route matches ${dst.ip}. Only the local route exists for this traffic, so the packet is dropped. (A private subnet with no NAT gateway and no endpoint can't reach anything outside the VPC.)`, `rt|${ss.id}`);
      if (r.target === "vpce-s3") {
        push({ ok: true, kind: "route", at: `rt|${ss.id}`, label: `Route table ${rtName(ss)}`, detail: `${r.dest} → S3 gateway endpoint. The endpoint's prefix-list route is more specific than 0.0.0.0/0, so S3 traffic takes it and stays on the AWS network.` });
        if (!push(naclHop(net, ss, "out", port, dst.ip))) return out();
        path.add("s3ep");
        if (!push(naclHop(net, ss, "in", EPH, dst.ip, true))) return out();
        path.add(dst.id);
        push({ ok: true, kind: "done", label: `Reached ${dst.name} privately`, detail: "No internet gateway, NAT gateway or public IP involved." });
        return out();
      }
      if (r.target === "igw") {
        push({ ok: true, kind: "route", at: `rt|${ss.id}`, label: `Route table ${rtName(ss)}`, detail: `${r.dest} → internet gateway.` });
        if (!push(naclHop(net, ss, "out", port, dst.ip))) return out();
        if (!igwHop()) return out();
        if (!push({ ok: !!src.pub, kind: "pub", at: `pub|${src.id}`, label: `Public IP on ${src.name}`,
          detail: src.pub ? `The internet gateway translates ${src.ip} to the instance's public IP and sends it out.` : `${src.name} has no public IP or Elastic IP. The internet gateway only translates traffic for instances that have one, so the traffic can't leave. (Private instances use a NAT gateway instead.)` })) return out();
        path.add("igw");
        if (!push(naclHop(net, ss, "in", EPH, dst.ip, true))) return out();
        path.add(dst.id);
        push({ ok: true, kind: "done", label: `Reached ${dst.name}`, detail: dst.s3 ? "Over S3's public endpoint, through the internet gateway." : "The connection works in both directions." });
        return out();
      }
      const nat = net.nodes.find(n => n.id === r.target && n.kind === "nat");
      if (!nat) return fail(`Route table ${rtName(ss)}`, `${r.dest} → ${r.target}, but that target doesn't exist (a "blackhole" route), so the packet is dropped.`, `rt|${ss.id}`);
      const ns = sub(nat);
      push({ ok: true, kind: "route", at: `rt|${ss.id}`, label: `Route table ${rtName(ss)}`, detail: `${r.dest} → ${nat.name}.` });
      if (ns.id !== ss.id && !push(naclHop(net, ss, "out", port, dst.ip))) return out();
      const r2 = routeFor(net, ns, dst), natPublic = !!r2 && r2.target === "igw";
      const natProblem = down(nat) ? `${nat.name} lives in AZ ${flow.azDown}, which has failed. A NAT gateway is zonal, so every subnet routed to it loses internet access.`
        : !natPublic ? `${nat.name} sits in ${ns.name}, whose route table (${rtName(ns)}) ${r2 ? `sends ${dst.ip} to ${targetLabel(net, r2.target)}` : "has no route for it"}, not to the internet gateway. A NAT gateway must sit in a public subnet.`
        : !nat.eip ? "The NAT gateway has no Elastic IP, so it has no public address to use." : "";
      path.add(nat.id);
      if (!push({ ok: !natProblem, kind: "nat", at: `nat|${nat.id}`, label: nat.name, detail: natProblem || `In ${ns.name} (a public subnet) with an Elastic IP.` })) return out();
      if (ns.id !== ss.id && !push(naclHop(net, ns, "in", port, src.ip))) return out();
      if (natPublic) push({ ok: true, kind: "route", at: `rt|${ns.id}`, label: `Route table ${rtName(ns)} (NAT's subnet)`, detail: `${r2.dest} → internet gateway.` });
      if (!igwHop()) return out();
      if (!push(naclHop(net, ns, "out", port, dst.ip))) return out();
      path.add("igw");
      if (!push(naclHop(net, ns, "in", EPH, dst.ip, true))) return out();
      if (ns.id !== ss.id) {
        if (!push(naclHop(net, ns, "out", EPH, src.ip, true))) return out();
        if (!push(naclHop(net, ss, "in", EPH, dst.ip, true))) return out();
      }
      path.add(dst.id);
      push({ ok: true, kind: "done", label: `Reached ${dst.name}`, detail: `Outbound through NAT: it leaves with the NAT gateway's Elastic IP, not ${src.name}'s address, and the NAT gateway maps the replies back.` });
      return out();
    }

    // started outside the VPC
    if (dst.ext) return fail("Pick a destination inside the VPC", "Both ends are outside the VPC.");
    if (dst.kind === "nat") return fail("Pick another destination", "NAT gateways don't accept incoming connections.");
    const ds = sub(dst);
    if (!igwHop()) return out();
    if (!dst.pub) {
      const r = routeFor(net, ds, src);
      const viaNat = r && net.nodes.some(n => n.id === r.target && n.kind === "nat");
      if (!push({ ok: false, kind: "pub", at: `pub|${dst.id}`, label: `Public IP on ${dst.name}`, detail: `${dst.name} has no public IP, so no address on the internet leads to it.${viaNat ? " Its subnet goes out through a NAT gateway, and NAT gateways only allow connections started from inside." : ""}` })) return out();
    } else push({ ok: true, kind: "pub", at: `pub|${dst.id}`, label: `Public IP on ${dst.name}`, detail: `The internet gateway translates ${dst.name}'s public IP to ${dst.ip}.` });
    path.add("igw");
    if (!push(naclHop(net, ds, "in", port, src.ip))) return out();
    if (!push(sgHop(net, dst, "in", port, src))) return out();
    path.add(dst.id);
    if (!push(naclHop(net, ds, "out", EPH, src.ip, true))) return out();
    const r = routeFor(net, ds, src);
    if (!r || r.target !== "igw") return fail(`Route table ${rtName(ds)}`, `The reply can't get out: ${r ? `the route for ${src.ip} goes to ${targetLabel(net, r.target)}` : `there's no route for ${src.ip}`}. ${ds.name} isn't a public subnet: a public subnet needs a route to the internet gateway.`, `rt|${ds.id}`);
    push({ ok: true, kind: "route", at: `rt|${ds.id}`, label: `Route table ${rtName(ds)}`, detail: `${r.dest} → internet gateway, so the reply goes back out.` });
    push({ ok: true, kind: "done", label: `Connected to ${dst.name}`, detail: "Inbound connection works." });
    return out();
  };

  // Goals: {label, flow, expect:bool} or {label, test:"private", node} (node has no public IP and its subnet has no IGW route).
  tr.goals = (net, goals) => goals.map(g => {
    if (g.test === "private") {
      const n = net.nodes.find(x => x.id === g.node), s = n && net.subnets.find(x => x.id === n.subnet);
      return { ...g, pass: !!n && !n.pub && !isPublic(net, s) };
    }
    const c = tr.goalCase(net, g), r = tr.run(c.net, c.flow);
    if (g.avoid) return { ...g, pass: !r.path.some(id => (c.net.nodes.find(x => x.id === id) || {}).kind === g.avoid), res: r };
    return { ...g, pass: r.ok === g.expect, res: r };
  });
  // The network and flow a goal is checked on. g.replace: Auto Scaling replaces that server with a new one
  // (new IP, same subnet and security groups), and the flow starts from the new one.
  tr.goalCase = (net, g) => {
    if (!g.replace) return { net, flow: g.flow };
    const n = JSON.parse(JSON.stringify(net)), old = n.nodes.find(x => x.id === g.replace);
    if (!old) return { net, flow: g.flow };
    const ip = old.ip.split("."); ip[3] = String((+ip[3] + 37) % 250 + 2);
    n.nodes = n.nodes.filter(x => x !== old);
    n.nodes.push(Object.assign({}, old, { id: `${old.id}-new`, name: `New ${old.name.toLowerCase()}`, ip: ip.join(".") }));
    const flow = Object.assign({}, g.flow);
    if (flow.from === old.id) flow.from = `${old.id}-new`;
    if (flow.to === old.id) flow.to = `${old.id}-new`;
    return { net: n, flow };
  };

  // ---------- UI ----------
  // Focus: an exercise only shows what its flows/goals touch. Everything else stays in the model (the engine sees it)
  // but is hidden until the learner asks for the whole VPC.
  const focusOf = (net, flows) => {
    const node = id => net.nodes.find(n => n.id === id), subOf = x => net.subnets.find(s => s.id === x.subnet);
    const keep = new Set(), keepSubs = new Set(), ext = new Set(["user", "internet"]);
    let s3 = false, az = false, nat = false;
    for (const g of flows) {
      if (g.test === "private") { if (node(g.node)) keep.add(g.node); continue; }
      const f = g.flow || g;
      if (f.azDown) az = true;
      [f.from, f.to].forEach(id => { if (node(id)) keep.add(id); else if (EXT[id]) ext.add(id); if (id === "s3") s3 = true; });
      const dst = node(f.to);
      if (dst && !node(f.from) && !isPublic(net, subOf(dst)))   // from the internet to a private instance: show the NAT it routes through
        (net.rts[subOf(dst).rt] || { routes: [] }).routes.forEach(r => { if (node(r.target)) keep.add(r.target); });
      const src = node(f.from);
      if (!src || src.kind !== "ec2" || node(f.to)) continue;
      const ss = subOf(src);
      if (isPublic(net, ss)) continue;
      // A private instance going out needs a NAT gateway: show the ones it routes to, and the public subnets of its AZ (where one belongs).
      nat = true;
      (net.rts[ss.rt] || { routes: [] }).routes.forEach(r => { if (node(r.target)) keep.add(r.target); });
      net.subnets.filter(s => s.az === ss.az && isPublic(net, s)).forEach(s => {
        keepSubs.add(s.id);
        net.nodes.filter(x => x.kind === "nat" && x.subnet === s.id).forEach(x => keep.add(x.id));
      });
    }
    if (net.s3ep.length) s3 = true;
    keep.forEach(id => keepSubs.add(node(id).subnet));
    if ([...keep].some(id => node(id).kind === "nat")) nat = true;
    return { hideNodes: net.nodes.filter(x => !keep.has(x.id)).map(x => x.id), hideSubs: net.subnets.filter(s => !keepSubs.has(s.id)).map(s => s.id), ext: [...ext], s3, az, nat };
  };

  // ---------- path strip: one line per connection, every checkpoint with its rule inline ----------
  // Tier colors: each server, its security group and every mention of them in text share one color.
  const TIER_RE = /\b(web (?:servers?|tier|SG)|app (?:servers?(?: [AB])?|tier|SG)|DB SG|databases?)\b/gi;
  tr.tierize = html => String(html ?? "").split(/(<[^>]+>)/).map(part => part.startsWith("<") ? part
    : part.replace(TIER_RE, m => `<span class="tier t-${/^web/i.test(m) ? "web" : /^app/i.test(m) ? "app" : "db"}">${m}</span>`)).join("");
  const tierSpan = (name, tier) => tier ? `<span class="tier t-${tier}">${esc(name)}</span>` : esc(name);
  const endpoint = (net, id) => net.nodes.find(n => n.id === id) || EXT[id] || { name: id };

  // A CIDR in words, so nobody has to map 10.0.1.0/24 to a subnet in their head.
  const cidrLabel = (net, c) => {
    c = String(c).trim();
    if (c === "0.0.0.0/0") return "anywhere";
    if (c === net.vpc) return `the whole VPC (<code>${esc(c)}</code>)`;
    const s = net.subnets.find(x => x.cidr === c);
    if (s) return `${esc(s.name)} (<code>${esc(c)}</code>)`;
    const n = net.nodes.find(x => `${x.ip}/32` === c);
    return n ? `${tierSpan(n.name, n.tier)} only (<code>${esc(c)}</code>)` : `<code>${esc(c)}</code>`;
  };
  const peerLabel = (net, ref) => String(ref).startsWith("sg-") ? `anything in ${tierSpan((net.sgs[ref] || { name: ref }).name, (net.sgs[ref] || {}).tier)}` : cidrLabel(net, ref);
  const portTxt = p => { p = String(p).trim().toLowerCase(); return p === "all" || p === "*" ? "all ports" : p.includes("-") ? `ports ${esc(p)}` : esc(p); };

  // Title of a checkpoint, from its `at` key.
  tr.stopTitle = (net, at) => {
    const [k, a, b, c] = String(at).split("|");
    const node = id => net.nodes.find(x => x.id === id) || { name: id, sgs: [] }, sub = id => net.subnets.find(x => x.id === id) || { name: id };
    if (k === "sg") { const n = node(b), g = n.sgs.map(id => net.sgs[id] || { name: id }); return `${g.map(x => tierSpan(x.name, x.tier)).join(" + ") || "No security group"} · ${a === "in" ? "inbound" : "outbound"}`; }
    if (k === "nacl") return `${c === "reply" ? "↩ Reply · " : ""}NACL · ${esc(sub(b).name)} · ${a === "in" ? "in" : "out"}`;
    if (k === "rt") return `Route table · ${esc(sub(a).name)}`;
    if (k === "igw") return "Internet gateway";
    if (k === "pub") { const n = node(a); return `Public IP · ${tierSpan(n.name, n.tier)}`; }
    if (k === "nat") return esc(node(a).name);
    return esc(at);
  };
  // What the checkpoint is set to right now, in words. Two networks differ at a checkpoint when this differs.
  tr.stopInfo = (net, at) => {
    const [k, a, b] = String(at).split("|");
    const node = id => net.nodes.find(x => x.id === id), sub = id => net.subnets.find(x => x.id === id);
    if (k === "sg") {
      const n = node(b); if (!n) return "missing";
      const rs = n.sgs.flatMap(id => (net.sgs[id] || { in: [], out: [] })[a]);
      return rs.length ? "Allows " + rs.map(r => `${portTxt(r.port)} ${a === "in" ? "from" : "to"} ${peerLabel(net, a === "in" ? r.src : r.dst)}`).join("; ") : "Allows nothing";
    }
    if (k === "nacl") {
      const s = sub(b), acl = s && net.nacls[s.nacl]; if (!acl) return "NACL missing";
      const rs = acl[a].slice().sort((x, y) => x.n - y.n).map(r => `#${r.n} ${r.allow ? "allow" : "deny"} ${portTxt(r.port)} ${a === "in" ? "from" : "to"} ${cidrLabel(net, r.cidr)}`);
      return `${esc(acl.name)}: ${[...rs, "* deny the rest"].join("; ")}`;
    }
    if (k === "rt") {
      const s = sub(a), rt = s && net.rts[s.rt]; if (!rt) return "Route table missing";
      const name = t => t === "igw" ? "internet gateway" : esc((node(t) || { name: `${t} (missing)` }).name);
      const rs = rt.routes.map(r => `${r.dest === "0.0.0.0/0" ? "everything else" : esc(r.dest)} → ${name(r.target)}`);
      if (net.s3ep.includes(s.rt)) rs.unshift("S3 → S3 gateway endpoint");
      return `${esc(rt.name)}: ${["inside the VPC → local", ...rs].join("; ")}`;
    }
    if (k === "igw") return net.igw ? "Attached" : "Not attached";
    if (k === "pub") { const n = node(a); return n && n.pub ? "Has a public IP" : "No public IP"; }
    if (k === "nat") { const n = node(a); if (!n) return "Deleted"; const s = sub(n.subnet); return `In ${esc(s.name)} (AZ ${esc(s.az)}) · ${n.eip ? "Elastic IP" : "no Elastic IP"}`; }
    return "";
  };

  // Step 1 of a guided fix: the goal flows that should work but don't, and every checkpoint that blocks them.
  tr.diagnose = (net, goals) => {
    const flows = goals.filter(g => g.flow && g.expect && !g.avoid && !tr.run(tr.goalCase(net, g).net, tr.goalCase(net, g).flow).ok);
    const answer = [...new Set(flows.flatMap(g => { const c = tr.goalCase(net, g); return tr.run(c.net, c.flow, { all: true }).hops.filter(h => !h.ok && h.at).map(h => h.at); }))];
    return { flows, answer };
  };


  const domId = key => "tr-" + String(key).replace(/[^\w-]/g, "_");
  tr.mount = (key, net, opts = {}) => {
    let I = tr.inst[key];
    if (!I) {
      const first = net.nodes.find(n => n.kind === "ec2");
      I = tr.inst[key] = { key, orig: clone(net), net: clone(net), flow: Object.assign({ from: first ? first.id : "", to: "internet", port: 443, azDown: "" }, opts.flow || {}), res: null, open: new Set(opts.open || []),
        focus: opts.flows ? focusOf(net, opts.flows) : null, full: false };
      if (opts.run) I.res = tr.run(I.net, I.flow);
    }
    return `<div class="tracer" id="${domId(key)}" data-trk="${esc(key)}">${inner(I)}</div>`;
  };
  const refresh = key => { const el = document.getElementById(domId(key)); if (el) el.innerHTML = inner(tr.inst[key]); };

  const opt = (v, label, cur) => `<option value="${esc(v)}" ${String(v) === String(cur) ? "selected" : ""}>${esc(label)}</option>`;
  const del = (attrs) => `<button class="xbtn" data-tr="${attrs}" aria-label="Remove">×</button>`;

  // Plain-English rule text.
  const where = c => String(c).trim() === "0.0.0.0/0" ? "anywhere" : c;
  const ports = p => { p = String(p).trim().toLowerCase(); return p === "all" || p === "*" ? "all ports" : p.includes("-") ? `ports ${p}` : `port ${p}`; };
  const naclText = (r, dir) => `${r.allow ? "Allow" : "Deny"} ${ports(r.port)} ${dir === "in" ? "from" : "to"} ${where(r.cidr)}`;
  const sgText = (r, dir, n) => { const ref = dir === "in" ? r.src : r.dst; return `Allow ${ports(r.port)} ${dir === "in" ? "from" : "to"} ${String(ref).startsWith("sg-") ? `anything in ${(n.sgs[ref] || { name: ref }).name}` : where(ref)}`; };
  const KIND = { ec2: "EC2 instance", rds: "RDS database", nat: "NAT gateway" };

  function inner(I) {
    const n = I.net, on = new Set(I.res ? I.res.path : []), F = I.focus, full = !F || I.full;
    const hideN = id => !full && F.hideNodes.includes(id), hideS = id => !full && F.hideSubs.includes(id);
    const show = { s3: full || F.s3, az: full || F.az, nat: full || F.nat };
    const hidden = n.nodes.filter(x => hideN(x.id)).length + n.subnets.filter(s => hideS(s.id)).length;
    // An editor block is hidden only when everything using it is hidden (new or unused ones always show).
    const shownIf = users => !users.length || users.some(Boolean);
    const node = id => n.nodes.find(x => x.id === id);
    const targetName = t => t === "igw" ? "internet gateway" : (node(t) || { name: `${t} (missing)` }).name;

    const routeSum = s => {
      const rt = n.rts[s.rt]; if (!rt) return "route table missing";
      const out = rt.routes.map(r => `${r.dest === "0.0.0.0/0" ? "internet" : r.dest} → ${targetName(r.target)}`);
      if (n.s3ep.includes(s.rt)) out.push("S3 → gateway endpoint");
      return out.length ? out.join(" · ") : "nothing leaves the VPC";
    };
    const naclSum = s => {
      const a = n.nacls[s.nacl]; if (!a) return "NACL missing";
      const side = dir => { const rs = a[dir].slice().sort((x, y) => x.n - y.n);
        if (!rs.length) return "nothing";
        if (rs.length === 1 && rs[0].allow && /^(all|\*)$/i.test(rs[0].port) && rs[0].cidr === "0.0.0.0/0") return "everything";
        return rs.map(r => `${r.allow ? "" : "deny "}${String(r.port).toLowerCase() === "all" ? "all" : r.port}${r.cidr === "0.0.0.0/0" ? "" : ` ${dir === "in" ? "from" : "to"} ${r.cidr}`}`).join(", "); };
      return `in: ${side("in")} · out: ${side("out")}`;
    };

    const nodeHTML = x => `<div class="node ${x.kind} ${x.tier ? `t-${x.tier}` : ""} ${on.has(x.id) ? "onpath" : ""} ${I.flow.azDown && n.subnets.find(s => s.id === x.subnet).az === I.flow.azDown ? "down" : ""}">
      <div class="node-h"><span class="nk">${KIND[x.kind]}</span>${x.kind === "nat" ? del(`del-node" data-id="${esc(x.id)}`) : ""}</div>
      <div class="node-name">${esc(x.name)}</div>
      <div class="node-meta"><span>Private IP <code>${esc(x.ip)}</code></span>
      ${x.kind === "nat"
        ? `<label class="tog"><input type="checkbox" data-tr="eip" data-id="${esc(x.id)}" ${x.eip ? "checked" : ""}> Elastic IP</label></div>`
        : `<label class="tog"><input type="checkbox" data-tr="pub" data-id="${esc(x.id)}" ${x.pub ? "checked" : ""}> Public IP</label></div>
           <div class="sgchips"><span class="lbl">Security groups</span>${x.sgs.map(g => `<span class="sgchip ${(n.sgs[g] || {}).tier ? `t-${n.sgs[g].tier}` : ""}">${esc((n.sgs[g] || { name: g }).name)}${del(`sg-detach" data-id="${esc(x.id)}" data-sg="${esc(g)}`)}</span>`).join("") || `<span class="muted small">none</span>`}
           <select class="mini" data-tr="sg-attach" data-id="${esc(x.id)}" aria-label="Attach security group">${opt("", "+ add", "")}${Object.keys(n.sgs).filter(g => !x.sgs.includes(g)).map(g => opt(g, n.sgs[g].name, "")).join("")}</select></div>`}
    </div>`;
    const subnetHTML = s => { const pub = isPublic(n, s); return `<div class="subnet ${pub ? "pub" : "priv"}">
      <div class="sn-h"><span class="sn-kind">${pub ? "Public subnet" : "Private subnet"}</span><strong>${esc(s.name)}</strong><code>${esc(s.cidr)}</code>
        ${show.nat ? `<button class="linkbtn small sn-add" data-tr="add-nat" data-id="${esc(s.id)}">+ NAT gateway</button>` : ""}</div>
      <div class="sn-cfg">
        <span class="sn-l">Route table</span><select class="mini" data-tr="sub-rt" data-id="${esc(s.id)}">${Object.keys(n.rts).map(r => opt(r, n.rts[r].name, s.rt)).join("")}</select><span class="sn-sum">${esc(routeSum(s))}</span>
        <span class="sn-l">Network ACL</span><select class="mini" data-tr="sub-nacl" data-id="${esc(s.id)}">${Object.keys(n.nacls).map(a => opt(a, n.nacls[a].name, s.nacl)).join("")}</select><span class="sn-sum">${esc(naclSum(s))}</span>
      </div>
      ${n.nodes.filter(x => x.subnet === s.id && !hideN(x.id)).map(nodeHTML).join("")}
    </div>`; };
    const azs = [...new Set(n.subnets.filter(s => !hideS(s.id)).map(s => s.az))].sort();
    const diagram = `<div class="tr-top">
        <div class="ext ${on.has("internet") || on.has("user") || on.has("office") ? "onpath" : ""}"><span class="ext-k">Outside AWS</span><strong>Internet</strong></div>
        <label class="igw ${on.has("igw") ? "onpath" : ""} ${n.igw ? "" : "off"}"><input type="checkbox" data-tr="igw" ${n.igw ? "checked" : ""}><span><span class="ext-k">Door to the internet</span><strong>Internet gateway</strong> ${n.igw ? "attached" : "not attached"}</span></label>
        ${show.s3 ? `<div class="ext ${on.has("s3") ? "onpath" : ""}"><span class="ext-k">AWS service</span><strong>Amazon S3</strong></div>` : ""}</div>
      <div class="vpc"><div class="vpc-h">VPC <code>${esc(n.vpc)}</code>
        ${F ? `<button class="linkbtn small" data-tr="full">${I.full ? "Show only what this question needs" : `Show the whole VPC (${hidden} more)`}</button>` : ""}</div>
      ${!full && hidden ? `<p class="muted small vpc-note">Only the parts this question needs are shown.</p>` : ""}
      <div class="azs">${azs.map(az => `<div class="az ${I.flow.azDown === az ? "down" : ""}"><div class="az-h">Availability Zone ${az}${I.flow.azDown === az ? " · FAILED" : ""}</div>${n.subnets.filter(s => s.az === az && !hideS(s.id)).map(subnetHTML).join("")}</div>`).join("")}</div></div>`;

    const targets = [["igw", "internet gateway"], ...n.nodes.filter(x => x.kind === "nat").map(x => [x.id, x.name])];
    const users = (pred) => n.subnets.filter(pred);
    const rts = Object.entries(n.rts).filter(([id]) => shownIf(users(s => s.rt === id).map(s => !hideS(s.id)))).map(([id, rt]) => `<div class="ed-block"><div class="ed-h"><strong>${esc(rt.name)}</strong> <span class="muted small">used by ${users(s => s.rt === id).map(s => esc(s.name)).join(", ") || "no subnet"}</span></div>
      <table class="ed"><thead><tr><th>Destination</th><th>Target</th><th>Reads as</th><th></th></tr></thead><tbody>
      <tr class="fixed"><td><code>${esc(n.vpc)}</code></td><td>local</td><td>Traffic inside the VPC stays inside</td><td></td></tr>
      ${n.s3ep.includes(id) ? `<tr class="fixed"><td><code>pl-s3</code></td><td>S3 gateway endpoint</td><td>S3 goes privately through the endpoint</td><td></td></tr>` : ""}
      ${rt.routes.map((r, i) => `<tr><td><input class="mini" data-tr="rt-dest" data-rt="${esc(id)}" data-i="${i}" value="${esc(r.dest)}" aria-label="Destination"></td>
        <td><select class="mini" data-tr="rt-target" data-rt="${esc(id)}" data-i="${i}" aria-label="Target">${targets.map(([v, l]) => opt(v, l, r.target)).join("")}${targets.some(([v]) => v === r.target) ? "" : opt(r.target, `${r.target} (missing)`, r.target)}</select></td>
        <td class="reads">${r.dest === "0.0.0.0/0" ? "Everything else" : `Traffic to ${esc(r.dest)}`} goes to the ${esc(targetName(r.target))}</td>
        <td>${del(`rt-del" data-rt="${esc(id)}" data-i="${i}`)}</td></tr>`).join("")}
      </tbody></table>
      <div class="ed-foot"><button class="linkbtn" data-tr="rt-add" data-rt="${esc(id)}">+ route</button>
      ${show.s3 ? `<label class="tog"><input type="checkbox" data-tr="s3ep" data-rt="${esc(id)}" ${n.s3ep.includes(id) ? "checked" : ""}> S3 gateway endpoint associated</label>` : ""}</div></div>`).join("")
      + `<button class="linkbtn" data-tr="rt-new">+ new route table</button>`;

    const ruleRows = (aid, dir) => n.nacls[aid][dir].map((r, i) => `<tr>
      <td><input class="mini num" data-tr="acl-n" data-acl="${esc(aid)}" data-dir="${dir}" data-i="${i}" value="${r.n}" aria-label="Rule number"></td>
      <td><select class="mini" data-tr="acl-allow" data-acl="${esc(aid)}" data-dir="${dir}" data-i="${i}">${opt("allow", "ALLOW", r.allow ? "allow" : "deny")}${opt("deny", "DENY", r.allow ? "allow" : "deny")}</select></td>
      <td><input class="mini" data-tr="acl-port" data-acl="${esc(aid)}" data-dir="${dir}" data-i="${i}" value="${esc(r.port)}" aria-label="Port"></td>
      <td><input class="mini" data-tr="acl-cidr" data-acl="${esc(aid)}" data-dir="${dir}" data-i="${i}" value="${esc(r.cidr)}" aria-label="CIDR"></td>
      <td class="reads ${r.allow ? "" : "deny"}">${esc(naclText(r, dir))}</td>
      <td>${del(`acl-del" data-acl="${esc(aid)}" data-dir="${dir}" data-i="${i}`)}</td></tr>`).join("");
    const naclDir = { in: ["Inbound", "packets coming into the subnet", "Source"], out: ["Outbound", "packets leaving the subnet", "Destination"] };
    const nacls = `<p class="muted small ed-note">Rules are checked lowest number first. The first rule that matches decides; if none match, the last row (*) denies.</p>`
      + Object.entries(n.nacls).filter(([id]) => shownIf(users(s => s.nacl === id).map(s => !hideS(s.id)))).map(([id, a]) => `<div class="ed-block"><div class="ed-h"><strong>${esc(a.name)}</strong> <span class="muted small">on ${users(s => s.nacl === id).map(s => esc(s.name)).join(", ") || "no subnet"}</span></div>
      ${["in", "out"].map(dir => `<div class="ed-sub">${naclDir[dir][0]} <span class="muted">· ${naclDir[dir][1]}</span></div><div class="tablewrap"><table class="ed"><thead><tr><th>Rule #</th><th>Action</th><th>Port(s)</th><th>${naclDir[dir][2]}</th><th>Reads as</th><th></th></tr></thead><tbody>
        ${ruleRows(id, dir)}<tr class="fixed"><td>*</td><td>DENY</td><td>all</td><td>0.0.0.0/0</td><td>Deny everything else</td><td></td></tr></tbody></table></div>
        <button class="linkbtn" data-tr="acl-add" data-acl="${esc(id)}" data-dir="${dir}">+ ${dir === "in" ? "inbound" : "outbound"} rule</button>`).join("")}</div>`).join("")
      + `<button class="linkbtn" data-tr="acl-new">+ new NACL (starts with no rules: denies everything)</button>`;

    const sgRows = (gid, dir) => n.sgs[gid][dir].map((r, i) => `<tr>
      <td><input class="mini" data-tr="sg-port" data-sg="${esc(gid)}" data-dir="${dir}" data-i="${i}" value="${esc(r.port)}" aria-label="Port"></td>
      <td><input class="mini" data-tr="sg-peer" data-sg="${esc(gid)}" data-dir="${dir}" data-i="${i}" value="${esc(dir === "in" ? r.src : r.dst)}" aria-label="CIDR or security group"></td>
      <td class="reads">${esc(sgText(r, dir, n))}</td>
      <td>${del(`sgr-del" data-sg="${esc(gid)}" data-dir="${dir}" data-i="${i}`)}</td></tr>`).join("");
    const sgs = `<p class="muted small ed-note">Allow rules only. Anything not allowed is denied.</p>`
      + Object.entries(n.sgs).filter(([id]) => shownIf(n.nodes.filter(x => x.sgs.includes(id)).map(x => !hideN(x.id)))).map(([id, g]) => `<div class="ed-block"><div class="ed-h"><strong>${esc(g.name)}</strong> <span class="muted small">on ${n.nodes.filter(x => x.sgs.includes(id)).map(x => esc(x.name)).join(", ") || "nothing"}</span></div>
      ${["in", "out"].map(dir => `<div class="ed-sub">${dir === "in" ? "Inbound" : "Outbound"}</div><div class="tablewrap"><table class="ed"><thead><tr><th>Port(s)</th><th>${dir === "in" ? "Source" : "Destination"} (IP range or sg-…)</th><th>Reads as</th><th></th></tr></thead><tbody>${sgRows(id, dir)}</tbody></table></div>
        <button class="linkbtn" data-tr="sgr-add" data-sg="${esc(id)}" data-dir="${dir}">+ ${dir === "in" ? "inbound" : "outbound"} rule</button>`).join("")}</div>`).join("");

    const sec = (id, title, body) => `<details data-sec="${id}" ${I.open.has(id) ? "open" : ""}><summary>${title}</summary><div class="ed-wrap">${body}</div></details>`;

    const extOk = id => full || F.ext.includes(id);
    const srcs = [...n.nodes.filter(x => x.kind === "ec2" && !hideN(x.id)).map(x => [x.id, x.name]), ...["user", "office"].filter(extOk).map(id => [id, EXT[id].name])];
    const dsts = [...n.nodes.filter(x => x.kind !== "nat" && !hideN(x.id)).map(x => [x.id, x.name]), ...["internet", "s3"].filter(id => extOk(id) || (id === "s3" && show.s3)).map(id => [id, EXT[id].name])];
    const flow = `<div class="flowbar"><span class="fb-h">Test a connection</span>
      <label>From <select class="mini" data-tr="f-from">${srcs.map(([v, l]) => opt(v, l, I.flow.from)).join("")}</select></label>
      <label>To <select class="mini" data-tr="f-to">${dsts.map(([v, l]) => opt(v, l, I.flow.to)).join("")}</select></label>
      <label>Port <input class="mini num" data-tr="f-port" value="${esc(I.flow.port)}" inputmode="numeric"></label>
      ${show.az ? `<label>AZ failure <select class="mini" data-tr="f-az">${opt("", "none", I.flow.azDown)}${[...new Set(n.subnets.map(s => s.az))].sort().map(a => opt(a, `AZ ${a} down`, I.flow.azDown)).join("")}</select></label>` : ""}
      <button class="btn small" data-tr="run">Trace</button><button class="btn ghost small" data-tr="reset">Reset network</button></div>`;
    const res = I.res ? tr.map(`F|${I.key}`, n, [{ label: "Trace result", flow: I.flow }], { reveal: true }) : "";

    return diagram + flow + res + sec("rts", "Route tables: where traffic goes", rts) + sec("sgs", "Security groups: firewall on each instance", sgs) + sec("nacls", "Network ACLs: firewall on each subnet", nacls);
  }

  function apply(I, a, el) {
    const n = I.net, d = el.dataset, v = el.type === "checkbox" ? el.checked : el.value;
    const node = id => n.nodes.find(x => x.id === id), sub = id => n.subnets.find(x => x.id === id);
    const uniq = base => { let id = base, i = 2; while (n.rts[id] || n.nacls[id] || node(id)) id = `${base}-${i++}`; return id; };
    switch (a) {
      case "igw": n.igw = v; break;
      case "sub-rt": sub(d.id).rt = v; break;
      case "sub-nacl": sub(d.id).nacl = v; break;
      case "pub": node(d.id).pub = v; break;
      case "eip": node(d.id).eip = v; break;
      case "add-nat": {
        const s = sub(d.id), id = uniq(`nat-${s.az}`), c = parseCidr(s.cidr);
        let host = 5; while (n.nodes.some(x => x.ip === intIp(c.lo + host))) host++;
        n.nodes.push({ id, name: `NAT gateway ${id.replace("nat-", "").toUpperCase()}`, kind: "nat", subnet: s.id, ip: intIp(c.lo + host), eip: true, sgs: [] });
        break;
      }
      case "del-node": n.nodes = n.nodes.filter(x => x.id !== d.id); break;   // routes to it become blackholes
      case "sg-attach": if (v) node(d.id).sgs.push(v); break;
      case "sg-detach": node(d.id).sgs = node(d.id).sgs.filter(x => x !== d.sg); break;
      case "rt-dest": n.rts[d.rt].routes[+d.i].dest = v.trim(); break;
      case "rt-target": n.rts[d.rt].routes[+d.i].target = v; break;
      case "rt-del": n.rts[d.rt].routes.splice(+d.i, 1); break;
      case "rt-add": n.rts[d.rt].routes.push({ dest: "0.0.0.0/0", target: "igw" }); break;
      case "rt-new": { const id = uniq("rt-custom"); n.rts[id] = { name: id, routes: [] }; break; }
      case "s3ep": n.s3ep = v ? [...n.s3ep, d.rt] : n.s3ep.filter(x => x !== d.rt); break;
      case "acl-n": n.nacls[d.acl][d.dir][+d.i].n = +v || 0; break;
      case "acl-port": n.nacls[d.acl][d.dir][+d.i].port = v.trim(); break;
      case "acl-cidr": n.nacls[d.acl][d.dir][+d.i].cidr = v.trim(); break;
      case "acl-allow": n.nacls[d.acl][d.dir][+d.i].allow = v === "allow"; break;
      case "acl-del": n.nacls[d.acl][d.dir].splice(+d.i, 1); break;
      case "acl-add": { const rs = n.nacls[d.acl][d.dir]; rs.push({ n: (Math.max(0, ...rs.map(r => r.n)) + 100), port: "all", cidr: "0.0.0.0/0", allow: true }); break; }
      case "acl-new": { const id = uniq("acl-custom"); n.nacls[id] = { name: id, in: [], out: [] }; break; }
      case "sg-port": n.sgs[d.sg][d.dir][+d.i].port = v.trim(); break;
      case "sg-peer": n.sgs[d.sg][d.dir][+d.i][d.dir === "in" ? "src" : "dst"] = v.trim(); break;
      case "sgr-del": n.sgs[d.sg][d.dir].splice(+d.i, 1); break;
      case "sgr-add": n.sgs[d.sg][d.dir].push(d.dir === "in" ? { port: "443", src: "0.0.0.0/0" } : { port: "all", dst: "0.0.0.0/0" }); break;
      case "f-from": I.flow.from = v; break;
      case "f-to": I.flow.to = v; break;
      case "f-port": I.flow.port = +v || 0; break;
      case "f-az": I.flow.azDown = v; break;
      case "reset": I.net = clone(I.orig); I.res = null; return;
      case "full": I.full = !I.full; return;
      case "run": break;
      default: return;
    }
    // Once a trace is showing, keep it live so every edit shows its effect.
    if (a === "run" || I.res) I.res = tr.run(I.net, I.flow);
  }

  if (typeof document !== "undefined") {
    const handle = e => {
      const el = e.target.closest("[data-tr]"); if (!el) return;
      const isBtn = el.tagName === "BUTTON";
      if ((e.type === "click") !== isBtn) return;     // buttons on click; inputs/selects on change
      const box = el.closest("[data-trk]"); if (!box) return;
      const key = box.dataset.trk, I = tr.inst[key]; if (!I) return;
      apply(I, el.dataset.tr, el);
      refresh(key);
    };
    document.addEventListener("click", handle);
    document.addEventListener("change", handle);
    document.addEventListener("toggle", e => {   // remember which editor sections are open across re-renders
      const d = e.target; if (!d.dataset || !d.dataset.sec) return;
      const box = d.closest("[data-trk]"); const I = box && tr.inst[box.dataset.trk]; if (!I) return;
      if (d.open) I.open.add(d.dataset.sec); else I.open.delete(d.dataset.sec);
    }, true);
  }
})(window.SAA);
