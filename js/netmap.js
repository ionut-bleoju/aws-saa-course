// Packet map: the VPC drawn in one fixed layout (internet on top, IGW on the VPC edge, one box per subnet, servers inside),
// with the packet stepping across it one checkpoint at a time. NACLs sit on the subnet border, security groups are a ring
// around the server, the route table is a sign inside the subnet, so where a check is drawn says what it is.
(function (SAA) {
  const tr = SAA.tracer, esc = s => SAA.esc(s);
  const W = 1000, NODE_W = 160, NODE_H = 58, RING = 12, NODE_GAP = 24;
  const kindOf = at => String(at).split("|")[0];
  const isPublic = (net, s) => (net.rts[s.rt] || { routes: [] }).routes.some(r => r.target === "igw");
  const r1 = n => Math.round(n * 10) / 10;

  // ---------- layout ----------
  function layout(net, extIds) {
    const L = { nodes: {}, subnets: {}, ext: {}, azs: [] };
    const VPC_TOP = extIds.length ? 104 : 44;   // no room needed above the VPC when the trip stays inside it
    extIds.filter(id => id !== "s3").forEach((id, i) => { L.ext[id] = { x: 20 + i * 200, y: 10, w: 180, h: 44 }; });
    if (extIds.includes("s3")) L.ext.s3 = { x: W - 200, y: 10, w: 180, h: 44 };
    if (net.s3ep.length) L.s3ep = { x: W - 210, y: VPC_TOP - 18, w: 190, h: 36 };

    const azs = [...new Set(net.subnets.map(s => s.az))].sort(), n = azs.length;
    const GAP = 70, colW = (W - 40 - GAP * (n - 1)) / n, innerW = colW - 20;
    const perRow = Math.max(1, Math.floor((innerW - 88 + NODE_GAP) / (NODE_W + 2 * RING + NODE_GAP)));
    const cols = azs.map(az => net.subnets.filter(s => s.az === az).sort((a, b) => isPublic(net, b) - isPublic(net, a)));
    const nodesIn = s => net.nodes.filter(x => x.subnet === s.id);
    const hOf = s => { const k = nodesIn(s).length; return k ? 52 + Math.ceil(k / perRow) * (NODE_H + 2 * RING + 14) : 70; };
    const rows = Math.max(...cols.map(c => c.length));
    const rowH = [...Array(rows).keys()].map(r => Math.max(...cols.map(c => c[r] ? hOf(c[r]) : 0)));
    const azTop = VPC_TOP + 34, azH = 34 + rowH.reduce((a, h) => a + h + 44, 0) - 28;
    cols.forEach((c, i) => {
      const x = 20 + i * (colW + GAP);
      L.azs.push({ az: azs[i], x, y: azTop, w: colW, h: azH });
      let y = azTop + 32;
      c.forEach((s, r) => {
        const b = L.subnets[s.id] = { x: x + 10, y, w: innerW, h: rowH[r] };
        b.sign = { x: b.x + b.w - 162, y: b.y + 10, w: 150, h: 26 };
        nodesIn(s).forEach((nd, k) => {
          const ring = { x: b.x + 44 + (k % perRow) * (NODE_W + 2 * RING + NODE_GAP), y: b.y + 46 + Math.floor(k / perRow) * (NODE_H + 2 * RING + 14), w: NODE_W + 2 * RING, h: NODE_H + 2 * RING };
          L.nodes[nd.id] = { ring, box: { x: ring.x + RING, y: ring.y + RING, w: NODE_W, h: NODE_H } };
        });
        y += rowH[r] + 44;
      });
    });
    L.vpc = { x: 10, y: VPC_TOP, w: W - 20, h: azH + 46 };
    L.igw = { x: Math.max(210, 20 + colW / 2 - 95), y: VPC_TOP - 24, w: 190, h: 48 };   // above the middle of the first AZ
    L.h = VPC_TOP + L.vpc.h + 12;
    return L;
  }
  const mid = b => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });
  const inside = (p, b) => p.x > b.x && p.x < b.x + b.w && p.y > b.y && p.y < b.y + b.h;

  // ---------- polyline helpers ----------
  const elbows = pts => {
    const out = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const a = out[out.length - 1], b = pts[i];
      if (Math.abs(a.x - b.x) > 1 && Math.abs(a.y - b.y) > 1) { const my = (a.y + b.y) / 2; out.push({ x: a.x, y: my }, { x: b.x, y: my }); }
      out.push(b);
    }
    return out;
  };
  const poly = pts => { const d = [0]; for (let i = 1; i < pts.length; i++) d.push(d[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)); return { pts, d, len: d[d.length - 1] }; };
  const at = (P, dist) => {
    dist = Math.max(0, Math.min(P.len, dist));
    for (let i = 1; i < P.pts.length; i++) if (P.d[i] >= dist) {
      const t = (dist - P.d[i - 1]) / ((P.d[i] - P.d[i - 1]) || 1), a = P.pts[i - 1], b = P.pts[i];
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
    return P.pts[P.pts.length - 1];
  };
  const sub = (P, from, to) => {   // the part of the polyline between two distances, as an SVG path
    if (to <= from) return "";
    const pts = [at(P, from)];
    for (let i = 0; i < P.pts.length; i++) if (P.d[i] > from && P.d[i] < to) pts.push(P.pts[i]);
    pts.push(at(P, to));
    return "M" + pts.map(p => `${r1(p.x)} ${r1(p.y)}`).join(" L");
  };
  const crossing = (P, box, from, enter) => {   // first point at or after `from` where the line enters (or leaves) the box
    let was = inside(at(P, from), box);
    for (let dd = from + 2; dd <= P.len; dd += 2) {
      const now = inside(at(P, dd), box);
      if (now !== was && now === enter) return dd;
      was = now;
    }
    return null;
  };

  // ---------- the packet's path for one connection ----------
  function route(net, flow, L) {
    const res = tr.run(net, flow, { all: true }), seen = new Set();
    const hops = res.hops.filter(h => h.at && !seen.has(h.at) && seen.add(h.at));
    const anchor = id => L.nodes[id] ? mid(L.nodes[id].box) : L.ext[id] ? { x: L.ext[id].x + L.ext[id].w / 2, y: L.ext[id].y + L.ext[id].h } : { x: 20, y: 20 };
    const wpOf = h => {
      const [k, a] = h.at.split("|");
      if (k === "rt" && L.subnets[a]) { const g = L.subnets[a].sign; return { key: h.at, p: { x: g.x + g.w - 13, y: g.y + g.h / 2 } }; }
      if (k === "nat" && L.nodes[a]) { const bx = L.nodes[a].box; return { key: h.at, p: { x: bx.x + bx.w - 16, y: bx.y + bx.h / 2 } }; }
      if (k === "igw") return { key: h.at, p: { x: L.igw.x + L.igw.w / 2, y: L.igw.y + L.igw.h } };
      return null;
    };
    const firstReply = hops.findIndex(h => /\|reply$/.test(h.at));
    const reqHops = firstReply < 0 ? hops : hops.slice(0, firstReply), repHops = firstReply < 0 ? [] : hops.slice(firstReply);
    const reqWps = reqHops.map(wpOf).filter(Boolean);
    if (L.s3ep && res.path.includes("s3ep")) { const i = reqWps.findIndex(w => w.key.startsWith("rt|")); reqWps.splice(i + 1, 0, { key: "s3ep", p: mid(L.s3ep) }); }
    const build = (wps, from, to, shift) => {
      const marks = {}, pts = [from, ...wps.map(w => w.p), to].map(p => ({ x: p.x + shift, y: p.y + shift }));
      const P = poly(elbows(pts));
      // where each waypoint landed on the line
      let cur = 0;
      wps.forEach(w => { const q = { x: w.p.x + shift, y: w.p.y + shift }; for (let i = 0; i < P.pts.length; i++) if (P.d[i] >= cur && Math.abs(P.pts[i].x - q.x) < 0.5 && Math.abs(P.pts[i].y - q.y) < 0.5) { marks[w.key] = P.d[i]; cur = P.d[i]; break; } });
      return { P, marks };
    };
    const req = build(reqWps, anchor(flow.from), anchor(flow.to), 0);
    let rep = null;
    if (repHops.length) {
      const back = [...repHops.map(wpOf).filter(Boolean), ...reqWps.filter(w => !w.key.startsWith("rt|")).reverse()];
      rep = build(back, anchor(flow.to), anchor(flow.from), 7);
    }
    // place every checkpoint on its pass, in order
    const steps = [], cursor = { req: 0, rep: 0 };
    hops.forEach((h, i) => {
      const pass = firstReply >= 0 && i >= firstReply ? "rep" : "req", R = pass === "rep" ? rep : req;
      const [k, a, b] = h.at.split("|");
      let d = null, pos = null;
      if (k === "sg" && L.nodes[b]) d = crossing(R.P, L.nodes[b].ring, cursor[pass], a === "in");
      else if (k === "nacl" && L.subnets[b]) d = crossing(R.P, L.subnets[b], cursor[pass], a === "in");
      else if (R.marks[h.at] !== undefined) d = R.marks[h.at];
      else if (k === "pub" && L.nodes[a]) { const bx = L.nodes[a].box; pos = { x: bx.x + bx.w - 4, y: bx.y + 4 }; }
      if (d === null) d = cursor[pass];
      cursor[pass] = d;
      steps.push({ h, pass, d, pos: pos || at(R.P, d) });
    });
    return { res, steps, req, rep };
  }

  // ---------- render ----------
  tr.maps = {};
  // goals: [{label, flow, expect, replace, avoid}] (one tab each). opts: reveal, pick:{key, sel}, answer:[at], before: net,
  // focus:[kinds], walk (start before the first step), title.
  tr.map = (id, net, goals, opts = {}) => {
    const sig = JSON.stringify([net, goals, opts.before || null]);
    const S = tr.maps[id] && tr.maps[id].sig === sig ? tr.maps[id] : (tr.maps[id] = { sig, tab: null, step: null });
    S.args = [net, goals, opts];
    return `<div class="pmap" id="${domId(id)}" data-mid="${esc(id)}">${draw(id)}</div>`;
  };
  const domId = id => "pm-" + String(id).replace(/[^\w-]/g, "_");

  function draw(id) {
    const S = tr.maps[id], [net0, goals, o] = S.args;
    const cases = goals.map(g => tr.goalCase(net0, g));
    if (S.tab === null) {   // open on the first connection that misbehaves
      const bad = goals.findIndex((g, i) => o.reveal && tr.run(cases[i].net, cases[i].flow).ok !== (g.expect !== false));
      S.tab = Math.max(0, bad);
    }
    const g = goals[S.tab], { net, flow } = cases[S.tab];
    const extIds = [...new Set(cases.flatMap(c => [c.flow.from, c.flow.to]).filter(x => tr.EXT[x]))];
    const L = layout(net, extIds), R = route(net, flow, L);
    const focus = o.focus || null, inFocus = st => !focus || focus.includes(kindOf(st.h.at));
    const steps = R.steps.filter(inFocus), quiet = R.steps.filter(st => !inFocus(st));
    const before = o.before ? tr.goalCase(o.before, g).net : null;
    const blocker = steps.findIndex(st => !st.h.ok);
    if (S.step === null || S.step >= steps.length) S.step = o.walk || o.pick ? -1 : blocker >= 0 ? blocker : steps.length - 1;
    const cur = steps[S.step];
    const sel = o.pick ? o.pick.sel : o.sel || [];
    const reveal = !!o.reveal;

    // what this connection touches; the rest is greyed out
    const used = new Set([flow.from, flow.to, ...R.res.path]);
    R.steps.forEach(st => { const [k, a, b] = st.h.at.split("|"); if (k === "nat" || k === "pub") used.add(a); if (k === "sg") used.add(b); });
    const usedSubs = new Set(net.nodes.filter(x => used.has(x.id)).map(x => x.subnet));
    R.steps.forEach(st => { const [k, a, b] = st.h.at.split("|"); if (k === "rt") usedSubs.add(a); if (k === "nacl") usedSubs.add(b); });
    const changed = at => before && tr.stopInfo(before, at) !== tr.stopInfo(net, at);

    // --- svg ---
    let s = `<svg class="mp-svg" viewBox="0 0 ${W} ${L.h}" role="img" aria-label="Map of the VPC with the packet's path">`;
    Object.entries(L.ext).forEach(([eid, b]) => {
      s += `<g class="mp-ext ${used.has(eid) ? "" : "mp-dim"}"><rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="10"/><text x="${b.x + 12}" y="${b.y + 18}" class="mp-k">${eid === "s3" ? "AWS service" : "Outside AWS"}</text><text x="${b.x + 12}" y="${b.y + 36}" class="mp-n">${esc(tr.EXT[eid].name)}</text></g>`;
    });
    const igwUsed = R.steps.some(st => st.h.at === "igw");
    s += `<rect class="mp-vpc" x="${L.vpc.x}" y="${L.vpc.y}" width="${L.vpc.w}" height="${L.vpc.h}" rx="14"/><text class="mp-n" x="${L.vpc.x + 14}" y="${L.vpc.y + 24}">VPC <tspan class="mp-mono">${esc(net.vpc)}</tspan></text>`;
    let gwSvg = `<rect class="mp-under" x="${L.igw.x}" y="${L.igw.y}" width="${L.igw.w}" height="${L.igw.h}" rx="9"/>`;
    gwSvg += `<g class="mp-igw ${net.igw ? "" : "mp-off"} ${igwUsed ? "" : "mp-dim"}"><rect x="${L.igw.x}" y="${L.igw.y}" width="${L.igw.w}" height="${L.igw.h}" rx="9"/><text x="${L.igw.x + L.igw.w / 2}" y="${L.igw.y + 21}" text-anchor="middle" class="mp-n">${net.igw ? "Internet gateway" : "No internet gateway"}</text></g>`;
    if (L.s3ep) gwSvg += `<rect class="mp-under" x="${L.s3ep.x}" y="${L.s3ep.y}" width="${L.s3ep.w}" height="${L.s3ep.h}" rx="9"/><g class="mp-igw ${R.res.path.includes("s3ep") ? "" : "mp-dim"}"><rect x="${L.s3ep.x}" y="${L.s3ep.y}" width="${L.s3ep.w}" height="${L.s3ep.h}" rx="9"/><text x="${L.s3ep.x + 12}" y="${L.s3ep.y + 23}" class="mp-n">S3 gateway endpoint</text></g>`;
    L.azs.forEach(a => {
      const down = flow.azDown === a.az;
      s += `<rect class="mp-az ${down ? "mp-down" : ""}" x="${a.x}" y="${a.y}" width="${a.w}" height="${a.h}" rx="10"/><text class="mp-k" x="${a.x + 12}" y="${a.y + 20}">AVAILABILITY ZONE ${esc(a.az.toUpperCase())}${down ? " · FAILED" : ""}</text>`;
    });
    let nodesSvg = "";
    net.subnets.forEach(sn => {
      const b = L.subnets[sn.id]; if (!b) return;
      const pub = isPublic(net, sn), acl = net.nacls[sn.nacl], rt = net.rts[sn.rt];
      s += `<g class="${usedSubs.has(sn.id) ? "" : "mp-dim"}"><rect class="mp-subnet ${pub ? "mp-pub" : ""}" x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="10"/>
        <text class="mp-n" x="${b.x + 12}" y="${b.y + 22}">${esc(sn.name)} <tspan class="mp-mono mp-k">${esc(sn.cidr)}</tspan></text>
        <text class="mp-k" x="${b.x + 12}" y="${b.y + 38}">${pub ? "PUBLIC" : "PRIVATE"}</text>
        <g class="mp-sign"><rect x="${b.sign.x}" y="${b.sign.y}" width="${b.sign.w}" height="${b.sign.h}" rx="6"/><text x="${b.sign.x + 10}" y="${b.sign.y + 18}">⇄ ${esc(rt ? "Route table" : "No route table")}</text></g>
        <g class="mp-fence"><rect x="${b.x + 14}" y="${b.y + b.h - 11}" width="${Math.min(b.w - 28, 22 + 7.2 * ((acl ? acl.name : "").length + 6))}" height="22" rx="11"/><text x="${b.x + 25}" y="${b.y + b.h + 5}">NACL · ${esc(acl ? acl.name : "missing")}</text></g></g>`;
      net.nodes.filter(x => x.subnet === sn.id).forEach(x => {
        const nb = L.nodes[x.id]; if (!nb) return;
        const dim = used.has(x.id) ? "" : "mp-dim", t = x.tier ? `t-${x.tier}` : "";
        const sgName = x.sgs.map(id => (net.sgs[id] || { name: id }).name).join(" + ");
        const sub = x.kind === "nat" ? (x.eip ? "Has an Elastic IP" : "No Elastic IP") : `${x.kind === "rds" ? "RDS database" : "EC2"}${x.pub ? " · public IP" : ""}`;
        nodesSvg += `<g class="mp-node ${t} ${dim} ${x.kind === "nat" ? "mp-nat" : ""}">
          ${x.kind === "nat" ? "" : `<rect class="mp-ring" x="${nb.ring.x}" y="${nb.ring.y}" width="${nb.ring.w}" height="${nb.ring.h}" rx="16"/><text class="mp-ringl" x="${nb.ring.x + nb.ring.w - 12}" y="${nb.ring.y + nb.ring.h + 4}" text-anchor="end">${esc(sgName || "no security group")}</text>`}
          <rect class="mp-box" x="${nb.box.x}" y="${nb.box.y}" width="${nb.box.w}" height="${nb.box.h}" rx="8"/>
          <text class="mp-n mp-name" x="${nb.box.x + 12}" y="${nb.box.y + 24}">${esc(x.name)}</text><text class="mp-k" x="${nb.box.x + 12}" y="${nb.box.y + 44}">${esc(sub)}</text></g>`;
      });
    });

    // the path: planned (faint), travelled (solid) up to the packet, never reached (dotted) after a blocker
    const passLine = (pass, Rp) => {
      if (!Rp) return "";
      const ps = steps.filter(st => st.pass === pass), blk = reveal ? ps.find(st => !st.h.ok) : null;
      const curD = !cur ? 0 : cur.pass === pass ? cur.d : pass === "req" && cur.pass === "rep" ? Rp.P.len : 0;
      const stopAt = blk ? Math.min(blk.d, Rp.P.len) : Rp.P.len;
      const prog = S.step < 0 ? 0 : Math.min(curD, stopAt);
      return `<path class="mp-plan mp-${pass}" d="${sub(Rp.P, 0, stopAt)}"/>${blk ? `<path class="mp-lost" d="${sub(Rp.P, stopAt, Rp.P.len)}"/>` : ""}<path class="mp-trav mp-${pass}" d="${sub(Rp.P, 0, prog)}"/>`;
    };
    s += passLine("req", R.req) + passLine("rep", R.rep) + nodesSvg + gwSvg;   // gateways and servers sit on top of the lines
    quiet.forEach(st => { s += `<circle class="mp-quiet" cx="${r1(st.pos.x)}" cy="${r1(st.pos.y)}" r="5"><title>${esc(st.h.label)}: passed</title></circle>`; });
    steps.forEach((st, i) => {
      const a = st.h.at, on = sel.includes(a), want = o.answer && o.answer.includes(a);
      const cls = ["mp-mark", reveal && (!o.walk || i <= S.step) ? (st.h.ok ? "mp-ok" : "mp-bad") : "", on ? "mp-sel" : "", i === S.step ? "mp-cur" : "", changed(a) ? "mp-chg" : "", o.answer && on !== want ? "mp-miss" : "", st.pass === "rep" ? "mp-repm" : ""].join(" ");
      const shown = reveal && (!o.walk || i <= S.step);
      const glyph = shown ? (st.h.ok ? "✓" : "✗") : String(i + 1);
      const act = o.pick && !reveal ? ` data-act="diag" data-key="${esc(o.pick.key)}" data-at="${esc(a)}"` : "";
      s += `<g class="${cls}" data-map="go" data-mid="${esc(id)}" data-i="${i}"${act} tabindex="0" role="button" aria-label="Checkpoint ${i + 1}: ${esc(stripTags(tr.stopTitle(net, a)))}${on ? " (selected)" : ""}">
        ${changed(a) ? `<circle class="mp-chgring" cx="${r1(st.pos.x)}" cy="${r1(st.pos.y)}" r="20"/>` : ""}<circle cx="${r1(st.pos.x)}" cy="${r1(st.pos.y)}" r="14"/><text x="${r1(st.pos.x)}" y="${r1(st.pos.y + 5)}">${glyph}</text></g>`;
    });
    if (cur) s += `<circle class="mp-dot mp-${cur.pass}" cx="${r1(cur.pos.x)}" cy="${r1(cur.pos.y)}" r="6"/>`;
    s += `</svg>`;

    // --- panel ---
    const tabs = goals.length > 1 ? `<div class="mp-tabs" role="tablist">${goals.map((gg, i) => {
      const r = tr.run(cases[i].net, cases[i].flow), good = r.ok === (gg.expect !== false);
      return `<button class="tab" role="tab" aria-selected="${i === S.tab}" aria-current="${i === S.tab}" data-map="tab" data-mid="${esc(id)}" data-i="${i}">${reveal ? `<span class="${good ? "mp-tok" : "mp-tbad"}">${good ? "✓" : "✗"}</span> ` : ""}${tr.tierize(esc(stripTags(gg.label)))}</button>`;
    }).join("")}</div>` : "";
    const verdict = !reveal ? "" : g.expect === false
      ? (R.res.ok ? `<span class="mp-tbad">✗ Gets through, but it shouldn't</span>` : `<span class="mp-tok">✓ Blocked, as it should be</span>`)
      : (R.res.ok ? `<span class="mp-tok">✓ Gets through</span>` : `<span class="mp-tbad">✗ Blocked</span>`);
    const head = `<div class="mp-head"><strong>${tr.tierize(o.title || g.label)}</strong> ${verdict}</div>`;
    let card;
    if (!cur) card = `<p class="mp-intro">${o.pick ? "Press <strong>Next</strong> to follow the packet one checkpoint at a time, or click a numbered circle on the map. Each one shows what it's set to." : "Press <strong>Next</strong> to send the packet. It stops at each checkpoint on the way."}</p>`;
    else {
      const a = cur.h.at, was = before ? tr.stopInfo(before, a) : null, now = tr.stopInfo(net, a);
      card = `<div class="mp-card ${reveal ? (cur.h.ok ? "ok" : "bad") : ""}">
        <div class="mp-ct">${reveal ? `<span class="mp-cm">${cur.h.ok ? "✓" : "✗"}</span>` : ""}${tr.stopTitle(net, a)}</div>
        <div class="mp-what">${WHAT[kindOf(a)] || ""}</div>
        ${was !== null && was !== now ? `<div class="mp-set"><span class="mp-was">Before: ${was}</span><span>Now: ${now}</span></div>` : `<div class="mp-set">Set to: ${now}</div>`}
        ${reveal ? `<div class="mp-detail">${esc(cur.h.detail)}</div>` : ""}
        ${o.pick && !reveal ? `<button class="btn ${sel.includes(a) ? "" : "ghost"} small mp-pickbtn" data-act="diag" data-key="${esc(o.pick.key)}" data-at="${esc(a)}" aria-pressed="${sel.includes(a)}">${sel.includes(a) ? "✓ Picked as a blocker (click to undo)" : "This is where it stops"}</button>` : ""}</div>`;
    }
    const nav = `<div class="mp-nav"><button class="btn ghost small" data-map="back" data-mid="${esc(id)}" ${S.step < 0 ? "disabled" : ""}>◀ Back</button>
      <span class="muted small">${S.step < 0 ? `${steps.length} checkpoints` : `Checkpoint ${S.step + 1} of ${steps.length}${cur.pass === "rep" ? " · reply" : ""}`}</span>
      <button class="btn small" data-map="next" data-mid="${esc(id)}" ${S.step >= steps.length - 1 ? "disabled" : ""}>Next ▶</button></div>`;
    const legend = `<p class="mp-legend"><span class="mp-sw mp-req"></span> request <span class="mp-sw mp-rep"></span> reply${quiet.length ? ` · small dots: ${quiet.length} other checks this lesson isn't about (all passed)` : ""}</p>`;
    const noPath = !steps.length && !R.res.ok ? `<p class="mp-detail">${esc(R.res.hops.at(-1).detail)}</p>` : "";
    return tabs + head + s + legend + nav + card + noPath;
  }
  const stripTags = s => String(s).replace(/<[^>]+>/g, "");
  const WHAT = {
    sg: "Security group: a firewall around this one server. Allow rules only, and it remembers connections, so replies are allowed automatically.",
    nacl: "Network ACL: a firewall on the subnet's border. It checks every packet both ways and remembers nothing, so replies need their own rule.",
    rt: "Route table: decides where traffic leaving the subnet goes next. Traffic inside the VPC always goes direct (local).",
    igw: "Internet gateway: the VPC's door to the internet.",
    pub: "Public IP: the address the internet gateway translates to. Without one, nothing on the internet can reach this server, and it can't use the gateway.",
    nat: "NAT gateway: lets private servers go out to the internet, never in. It must sit in a public subnet.",
  };

  // ---------- interaction (map-only state: tab and step) ----------
  if (typeof document !== "undefined") {
    const redraw = id => { const el = document.getElementById(domId(id)); if (el && tr.maps[id]) el.innerHTML = draw(id); };
    document.addEventListener("click", e => {
      const el = e.target.closest("[data-map]"); if (!el) return;
      const id = el.dataset.mid, S = tr.maps[id]; if (!S) return;
      const a = el.dataset.map;
      if (a === "next") S.step++;
      else if (a === "back") S.step = Math.max(-1, S.step - 1);
      else if (a === "go") S.step = +el.dataset.i;
      else if (a === "tab") { S.tab = +el.dataset.i; S.step = null; }
      redraw(id);
    }, true);   // capture: runs before the app re-renders the item
    document.addEventListener("keydown", e => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const el = e.target.closest && e.target.closest("g[data-map]"); if (!el) return;
      e.preventDefault(); el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
  }
})(window.SAA);
