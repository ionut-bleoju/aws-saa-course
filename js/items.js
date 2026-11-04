// Exercise types. Each type has: init(item, st, ctx), render(item, key, st, ctx) -> html, act(...) -> changed?, check(item, st) -> bool.
// `st` is the persisted per-item state; ctx.mock = exam mode (no feedback until the app marks st.done).
(function (SAA) {
  const LET = "ABCDEFGH";
  const esc = SAA.esc = s => String(s ?? "").replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
  const norm = s => String(s ?? "").toLowerCase().replace(/[\s,]/g, "");
  const idx = n => [...Array(n).keys()];
  const T = {};

  const finish = (it, st) => { st.done = true; st.ok = T[it.type].check(it, st); };
  const checkBtn = (key, enabled, label = "Check") => `<div class="item-actions"><button class="btn" data-act="check" data-key="${esc(key)}" ${enabled ? "" : "disabled"}>${label}</button></div>`;
  const expl = (it, st, text) => {
    const why = text ?? it.why;
    return `<div class="feedback ${st.ok ? "ok" : "bad"}"><strong>${st.ok ? "Correct." : "Not quite."}</strong> ${why || ""}</div>`;
  };
  const killsTxt = o => o.kills.map(r => `R${r + 1}`).join(" and ");

  T.mcq = {
    init: (it, st) => { st.order = SAA.shuffle(idx(it.options.length)); },
    render(it, key, st) {
      const show = st.done;
      return `<ul class="options">${st.order.map((k, i) => {
        const o = it.options[k];
        let cls = k === st.sel ? "sel" : "";
        if (show) cls = "locked " + (o.ok ? "correct" : k === st.sel ? "picked-wrong" : "other");
        const verdict = o.ok ? (k === st.sel ? "Correct — your answer" : "Correct answer") : (k === st.sel ? "Wrong — your answer" : "Wrong");
        return `<li class="opt ${cls}"><button data-act="pick" data-key="${esc(key)}" data-i="${k}" ${show ? 'tabindex="-1" aria-disabled="true"' : ""}><span class="letter">${LET[i]}</span><span class="otext">${o.t}</span></button>${show ? `<div class="why"><span class="verdict">${verdict}</span>${o.why || ""}</div>` : ""}</li>`;
      }).join("")}</ul>`;
    },
    act(it, st, a, el, ctx) { if (a !== "pick" || st.done) return false; st.sel = +el.dataset.i; if (!ctx.mock) finish(it, st); return true; },
    check: (it, st) => st.sel !== undefined && !!it.options[st.sel].ok,
  };

  T.multi = {
    init: (it, st) => { st.order = SAA.shuffle(idx(it.options.length)); st.sels = []; },
    render(it, key, st, ctx) {
      const show = st.done, need = it.options.filter(o => o.ok).length;
      return `<p class="hint">Choose ${need}.</p><ul class="options">${st.order.map(k => {
        const o = it.options[k], on = st.sels.includes(k);
        let cls = on ? "sel" : "";
        if (show) cls = "locked " + (o.ok ? (on ? "correct" : "missed") : (on ? "picked-wrong" : "other"));
        const verdict = o.ok ? (on ? "Correct — you picked it" : "Correct — you missed this one") : (on ? "Wrong — you picked it" : "Wrong");
        return `<li class="opt ${cls}"><button data-act="toggle" data-key="${esc(key)}" data-i="${k}" role="checkbox" aria-checked="${on}" ${show ? 'tabindex="-1" aria-disabled="true"' : ""}><span class="box">${on ? "✓" : ""}</span><span class="otext">${o.t}</span></button>${show ? `<div class="why"><span class="verdict">${verdict}</span>${o.why || ""}</div>` : ""}</li>`;
      }).join("")}</ul>${show || ctx.mock ? "" : checkBtn(key, st.sels.length === need)}`;
    },
    act(it, st, a, el, ctx) {
      if (st.done) return false;
      if (a === "toggle") { const k = +el.dataset.i; st.sels = st.sels.includes(k) ? st.sels.filter(x => x !== k) : [...st.sels, k]; return true; }
      if (a === "check" && !ctx.mock) { finish(it, st); return true; }
      return false;
    },
    check: (it, st) => it.options.every((o, k) => !!o.ok === (st.sels || []).includes(k)),
  };

  // Steps are authored in the correct order.
  T.order = {
    init: (it, st) => { st.order = SAA.shuffle(idx(it.steps.length)); st.seq = []; },
    render(it, key, st) {
      const n = it.steps.length;
      if (st.done) return `<ol class="seq">${st.seq.map((k, pos) => `<li class="${k === pos ? "ok" : "bad"}"><span>${it.steps[k]}</span>${k === pos ? "" : ` <span class="tag">should be #${k + 1}</span>`}</li>`).join("")}</ol>
        ${st.ok ? "" : `<p class="muted small">Correct order:</p><ol class="seq">${it.steps.map(s => `<li>${s}</li>`).join("")}</ol>`}${expl(it, st)}`;
      return `<p class="hint">Click the steps in order.</p>
        <ol class="seq">${st.seq.map(k => `<li>${it.steps[k]}</li>`).join("")}${st.seq.length < n ? `<li class="slot">…</li>` : ""}</ol>
        <div class="pool">${st.order.filter(k => !st.seq.includes(k)).map(k => `<button class="chipbtn" data-act="ord-add" data-key="${esc(key)}" data-i="${k}">${it.steps[k]}</button>`).join("")}</div>
        <div class="item-actions"><button class="btn ghost" data-act="ord-undo" data-key="${esc(key)}" ${st.seq.length ? "" : "disabled"}>Undo</button><button class="btn" data-act="check" data-key="${esc(key)}" ${st.seq.length === n ? "" : "disabled"}>Check</button></div>`;
    },
    act(it, st, a, el) {
      if (st.done) return false;
      if (a === "ord-add") st.seq.push(+el.dataset.i);
      else if (a === "ord-undo") st.seq.pop();
      else if (a === "check") finish(it, st);
      else return false;
      return true;
    },
    check: (it, st) => st.seq.length === it.steps.length && st.seq.every((k, i) => k === i),
  };

  // Click the row (table line, policy line, rule) that causes the problem. Exactly one row has bad:true.
  T.spot = {
    render(it, key, st) {
      const show = st.done;
      const head = it.cols ? `<thead><tr><th></th>${it.cols.map(c => `<th>${c}</th>`).join("")}</tr></thead>` : "";
      return `<p class="hint">Click the ${it.unit || "row"} that causes the problem.</p><div class="tablewrap"><table class="spot ${it.mono ? "mono" : ""}">${head}<tbody>${it.rows.map((r, i) => {
        const cls = show ? (r.bad ? "correct" : i === st.sel ? "picked-wrong" : "") : "";
        const why = show && (r.bad || i === st.sel)
          ? `<tr class="whyrow ${r.bad ? "ok" : "bad"}"><td></td><td colspan="${r.cells.length}"><strong>${r.bad ? (i === st.sel ? "Correct — this is the problem." : "This is the problem.") : "This one's fine."}</strong> ${r.why || ""}</td></tr>` : "";
        return `<tr class="${cls}" ${show ? "" : `data-act="spot" data-key="${esc(key)}" data-i="${i}" tabindex="0" role="button"`}><td class="mark"><span class="letter">${LET[i]}</span>${show && r.bad ? " ✗" : ""}</td>${r.cells.map(c => `<td>${c}</td>`).join("")}</tr>${why}`;
      }).join("")}</tbody></table></div>${show && it.why ? expl(it, st) : ""}`;
    },
    act(it, st, a, el) { if (a !== "spot" || st.done) return false; st.sel = +el.dataset.i; finish(it, st); return true; },
    check: (it, st) => st.sel !== undefined && !!it.rows[st.sel].bad,
  };

  T.fill = {
    render(it, key, st) {
      if (st.done) return `<p class="fillans ${st.ok ? "ok" : "bad"}">Your answer: <code>${esc(st.val || "")}</code> ${st.ok ? "✓" : `✗ Correct: <code>${esc(it.answer || it.accept[0])}</code>`}</p>${expl(it, st)}`;
      return `<div class="fillrow"><input type="text" class="fill" data-fill="${esc(key)}" value="${esc(st.val || "")}" placeholder="${esc(it.placeholder || "Your answer")}" autocomplete="off" spellcheck="false"><button class="btn" data-act="check" data-key="${esc(key)}">Check</button></div>`;
    },
    act(it, st, a) { if (a !== "check" || st.done || !String(st.val || "").trim()) return false; finish(it, st); return true; },
    check: (it, st) => it.accept.some(a => norm(a) === norm(st.val)),
  };

  // Requirement eliminator: pick the answer AND tag which requirement kills every other option.
  T.elim = {
    init: T.mcq.init,
    render(it, key, st, ctx) {
      if (st.mode === "mcq") return T.mcq.render(it, key, st, ctx);   // mock exams ask it as a plain question
      st.tags = st.tags || {};
      const show = st.done;
      const reqs = `<ol class="reqs">${it.reqs.map((r, i) => `<li><span class="rq">R${i + 1}</span> ${r}</li>`).join("")}</ol>`;
      const rows = st.order.map((k, i) => {
        const o = it.options[k], tag = st.tags[k];
        const sel = `<select data-act="elim" data-key="${esc(key)}" data-i="${k}" ${show ? "disabled" : ""} aria-label="Verdict for option ${LET[i]}"><option value="">Choose…</option><option value="pick" ${tag === "pick" ? "selected" : ""}>✓ My answer</option>${it.reqs.map((_, r) => `<option value="${r}" ${tag === String(r) ? "selected" : ""}>✗ Breaks R${r + 1}</option>`).join("")}</select>`;
        let fb = "", cls = "";
        if (show) {
          if (o.ok) { cls = tag === "pick" ? "correct" : "missed"; fb = tag === "pick" ? "Correct — this is the answer." : "This was the answer."; }
          else if (tag === "pick") { cls = "picked-wrong"; fb = `Wrong pick: it breaks ${killsTxt(o)}.`; }
          else if (o.kills.includes(+tag)) { cls = "other"; fb = "Right reason."; }
          else { cls = "picked-wrong"; fb = `Right to eliminate, wrong reason: it breaks ${killsTxt(o)}.`; }
        }
        return `<li class="opt elim ${cls}"><div class="elim-row"><span class="letter">${LET[i]}</span><span class="otext">${o.t}</span>${sel}</div>${show ? `<div class="why"><span class="verdict">${fb}</span>${o.why || ""}</div>` : ""}</li>`;
      }).join("");
      const ready = it.options.every((_, k) => st.tags[k]) && Object.values(st.tags).filter(t => t === "pick").length === 1;
      const pickedRight = it.options.some((o, k) => o.ok && st.tags[k] === "pick");
      const summary = show ? `<div class="feedback ${st.ok ? "ok" : "bad"}"><strong>${st.ok ? "Correct, with the right reasons." : pickedRight ? "Right answer, but some reasons were off." : "Not quite."}</strong> ${!st.ok && pickedRight ? "This counts as a miss: knowing why the others fail is what the exam really tests." : ""}</div>` : "";
      return `<p class="hint">Mark your answer, and for every other option say which requirement it breaks.</p>${reqs}<ul class="options">${rows}</ul>${show ? summary : checkBtn(key, ready)}`;
    },
    act(it, st, a, el, ctx) {
      if (st.mode === "mcq") return T.mcq.act(it, st, a, el, ctx);
      if (st.done) return false;
      st.tags = st.tags || {};
      if (a === "elim") { st.tags[+el.dataset.i] = el.value; return true; }
      if (a === "check") { finish(it, st); return true; }
      return false;
    },
    check: (it, st) => st.mode === "mcq" ? T.mcq.check(it, st)
      : it.options.every((o, k) => o.ok ? st.tags[k] === "pick" : st.tags[k] !== "pick" && o.kills.includes(+st.tags[k])),
  };

  // Predict questions with a playground attached afterwards.
  const predict = tool => ({
    init: T.mcq.init,
    render(it, key, st, ctx) {
      let h = (tool === "policy" && !st.showTool ? SAA.policy.view(it.sc) : "") + T.mcq.render(it, key, st, ctx);
      if (!st.done || ctx.mock) return h;
      const label = tool === "tracer" ? "Run it in the packet tracer" : "Open it in the policy evaluator";
      return h + (st.showTool
        ? `<div class="embed"><p class="hint">The scenario is loaded and evaluated. Change things and see what happens.</p>${tool === "tracer" ? SAA.tracer.mount(key, it.net, { flow: it.flow, run: true, flows: [it.flow] }) : SAA.policy.mount(key, it.sc)}</div>`
        : `<div class="item-actions"><button class="btn ghost" data-act="show-tool" data-key="${esc(key)}">${label}</button></div>`);
    },
    act(it, st, a, el, ctx) { if (a === "show-tool") { st.showTool = true; return true; } return T.mcq.act(it, st, a, el, ctx); },
    check: T.mcq.check,
  });
  T.trace = predict("tracer");
  T.policy = predict("policy");

  // Fix tasks: edit the playground until every goal passes. The first Check is what counts for scheduling.
  const fix = tool => ({
    render(it, key, st) {
      const mod = tool === "tracer" ? SAA.tracer : SAA.policy;
      const solved = !!(st.goalRes && st.goalRes.every(g => g.pass));
      const goals = `<ul class="goals">${(st.goalRes || it.goals.map(g => ({ label: g.label, pass: null }))).map(g => `<li class="${g.pass === null ? "" : g.pass ? "ok" : "bad"}"><span class="gm">${g.pass === null ? "○" : g.pass ? "✓" : "✗"}</span> ${g.label}</li>`).join("")}</ul>`;
      let fb = "";
      if (st.done && (solved || st.showSol)) fb = `<div class="feedback ${solved ? "ok" : "bad"}"><strong>${solved ? (st.ok ? "Solved on the first try." : "Solved.") : "The fix:"}</strong> ${it.why}</div>`
        + (st.showSol && tool === "tracer" ? `<p class="hint">The fix is now applied above. On the map, a yellow ring marks what changed:</p>${SAA.tracer.map(`${key}|sol`, mod.inst[key].net, it.goals.filter(g => g.flow), { reveal: true, before: it.net })}` : "");
      else if (st.done) fb = `<div class="feedback bad"><strong>Not yet.</strong> ${tool === "tracer" ? "Trace the failing flow and read the hop that blocks it." : "Evaluate the failing request and read which step decides it."}</div>`;
      return `<p class="hint">Change the setup below until every goal passes, then press Check.${it.type === "tracefree" ? "" : " Your first Check is what counts for review."}</p>
        <div class="goalbox"><strong>Goals</strong>${goals}</div>
        ${tool === "tracer" ? mod.mount(key, it.net, { flow: it.flow, open: it.open, flows: [it.flow, ...it.goals] }) : mod.mount(key, it.sc)}
        <div class="item-actions">${st.done && !solved && !st.showSol ? `<button class="btn ghost" data-act="show-sol" data-key="${esc(key)}">Show the fix</button>` : ""}<button class="btn" data-act="check" data-key="${esc(key)}">${st.attempts ? "Check again" : "Check"}</button></div>${fb}`;
    },
    act(it, st, a, el, ctx, key) {
      const mod = tool === "tracer" ? SAA.tracer : SAA.policy;
      if (a === "show-sol") {
        st.showSol = true;
        if (tool === "tracer" && it.solve) { const I = mod.inst[key]; I.net = JSON.parse(JSON.stringify(it.net)); it.solve(I.net); I.res = mod.run(I.net, I.flow); }
        return true;
      }
      if (a !== "check") return false;
      const inst = mod.inst[key];
      st.goalRes = mod.goals(tool === "tracer" ? inst.net : inst.sc, it.goals).map(g => ({ label: g.label, pass: g.pass }));
      st.attempts = (st.attempts || 0) + 1;
      if (!st.done) { st.done = true; st.ok = st.goalRes.every(g => g.pass); }
      return true;
    },
    check: (it, st) => !!st.ok,
  });
  T.tracefree = fix("tracer");   // Playground challenges: free editing, never scored
  // Guided network fix (lessons and reviews): step 1 find where the traffic stops on the map, step 2 pick the change that
  // fixes it. Counts as right only if both steps are right. Step 1's answer comes from the engine (every blocking checkpoint).
  // `where` is step 1 on its own.
  const applyFix = (it, i) => { const n = JSON.parse(JSON.stringify(it.net)); (it.fixes[i].apply || it.solve)(n); return n; };
  const goalList = (res) => `<ul class="goals">${res.map(g => `<li class="${g.pass === null ? "" : g.pass ? "ok" : "bad"}"><span class="gm">${g.pass === null ? "○" : g.pass ? "✓" : "✗"}</span> ${SAA.tracer.tierize(g.label)}</li>`).join("")}</ul>`;
  const mapGoals = it => it.goals.filter(g => g.flow);
  T.tracefix = {
    init: (it, st) => { st.v2 = 2; st.order = it.fixes ? SAA.shuffle(idx(it.fixes.length)) : []; st.diag = []; },
    render(it, key, st) {
      if (st.v2 !== 2) { const rec = st.recorded; Object.keys(st).forEach(k => delete st[k]); st.init = 1; if (rec) st.recorded = rec; T.tracefix.init(it, st); }   // state from an older format
      const TR = SAA.tracer, tz = TR.tierize, d = TR.diagnose(it.net, it.goals), need = d.answer.length;
      let h = it.fixes ? `<div class="goalbox"><strong>It has to meet all of these</strong>${goalList(it.goals.map(g => ({ label: g.label, pass: null })))}</div>` : "";

      // step 1
      h += `<div class="step-h"><span class="stepn">1</span> Where does it stop?</div>
        <p class="hint">${need > 1 ? `Click the <strong>${need}</strong> checkpoints on the map that block it.` : "Click the checkpoint on the map where the traffic gets blocked."}</p>
        ${TR.map(`${key}|d`, it.net, d.flows, st.diagDone ? { reveal: true, answer: d.answer, sel: st.diag, focus: it.focus } : { pick: { key, sel: st.diag }, focus: it.focus })}`;
      if (!st.diagDone) {
        const chosen = st.diag.map(at => TR.stopTitle(it.net, at)).join(" and ");
        return h + `<div class="item-actions"><span class="muted small">${chosen ? `Your pick: ${chosen}` : "Nothing picked yet"}</span><button class="btn" data-act="diag-check" data-key="${esc(key)}" ${st.diag.length === need ? "" : "disabled"}>Check</button></div>`;
      }
      const names = d.answer.map(at => TR.stopTitle(it.net, at)).join(" and ");
      h += `<div class="feedback ${st.diagOk ? "ok" : "bad"}"><strong>${st.diagOk ? "Right." : "Not quite."}</strong> It's blocked at ${names}. The ✗ on the map says why.</div>`;
      if (!it.fixes) return h + (it.why ? `<div class="feedback ${st.diagOk ? "ok" : "bad"}">${tz(it.why)}</div>` : "");

      // step 2
      const picked = st.sel !== undefined, f = picked && it.fixes[st.sel];
      h += `<div class="step-h"><span class="stepn">2</span> Which change fixes it?</div>
        <ul class="options">${st.order.map((k, i) => {
          const o = it.fixes[k], cls = !picked ? "" : "locked " + (o.ok ? "correct" : k === st.sel ? "picked-wrong" : "other");
          const verdict = o.ok ? (k === st.sel ? "Correct — your answer" : "Correct answer") : (k === st.sel ? "Wrong — your answer" : "Wrong");
          return `<li class="opt ${cls}"><button data-act="pick" data-key="${esc(key)}" data-i="${k}" ${picked ? 'tabindex="-1" aria-disabled="true"' : ""}><span class="letter">${LET[i]}</span><span class="otext">${tz(o.t)}</span></button>${picked && (k === st.sel || o.ok) ? `<div class="why"><span class="verdict">${verdict}</span>${tz(o.why)}</div>` : ""}</li>`;
        }).join("")}</ul>`;
      if (!picked) return h;

      const after = applyFix(it, st.sel), res = TR.goals(after, it.goals), failed = res.filter(g => !g.pass);
      const msg = st.ok ? "Correct: right diagnosis and right fix." : st.diagOk ? "Right diagnosis, wrong fix." : f.ok ? "Right fix, but the diagnosis was off. This counts as a miss: finding the blocking layer is half the skill." : "Not quite.";
      h += `<div class="feedback ${st.ok ? "ok" : "bad"}"><strong>${msg}</strong> ${failed.length ? `With your change, this goal fails: ${failed.map(g => tz(g.label)).join("; ")}.` : "With your change, every goal passes."}</div>
        <div class="goalbox"><strong>Goals with your change</strong>${goalList(res)}</div>
        <p class="hint"><strong>What your change does.</strong> A yellow ring marks what changed. Use the tabs to see each connection.</p>
        ${TR.map(`${key}|a${st.sel}`, after, mapGoals(it), { reveal: true, before: it.net })}`;
      if (!f.ok) {
        const right = it.fixes.findIndex(o => o.ok);
        h += st.showSol
          ? `<p class="hint"><strong>The right fix</strong>, for comparison:</p>${TR.map(`${key}|r`, applyFix(it, right), mapGoals(it), { reveal: true, before: it.net })}`
          : `<div class="item-actions"><button class="btn ghost" data-act="show-sol" data-key="${esc(key)}">See the right fix on the map</button></div>`;
      }
      return h + `<div class="feedback ${st.ok ? "ok" : "bad"}"><strong>Why:</strong> ${tz(it.why)}</div>`;
    },
    act(it, st, a, el) {
      if (a === "show-sol") { st.showSol = true; return true; }
      if (a === "diag" && !st.diagDone) {
        const at = el.dataset.at, need = SAA.tracer.diagnose(it.net, it.goals).answer.length;
        st.diag = st.diag.includes(at) ? st.diag.filter(x => x !== at) : need === 1 ? [at] : [...st.diag, at];
        return true;
      }
      if (a === "diag-check" && !st.diagDone) {
        const ans = SAA.tracer.diagnose(it.net, it.goals).answer;
        if (st.diag.length !== ans.length) return false;
        st.diagDone = true; st.diagOk = ans.every(x => st.diag.includes(x));
        if (!it.fixes) finish(it, st);
        return true;
      }
      if (a === "pick" && it.fixes && st.diagDone && st.sel === undefined) { st.sel = +el.dataset.i; finish(it, st); return true; }
      return false;
    },
    check: (it, st) => !!st.diagOk && (!it.fixes || (st.sel !== undefined && !!it.fixes[st.sel].ok)),
  };
  T.where = T.tracefix;

  // One checkpoint, one packet: does it get through? The answer comes from the engine.
  const gateOk = it => { const h = SAA.tracer.run(it.net, it.flow, { all: true }).hops.find(x => x.at === it.at); return !!(h && h.ok); };
  const packetLine = it => { const TR = SAA.tracer, n = id => it.net.nodes.find(x => x.id === id) || TR.EXT[id]; const f = n(it.flow.from), t = n(it.flow.to); return TR.tierize(`<p class="packet">📦 A packet from <strong>${esc(f.name)}</strong> to <strong>${esc(t.name)}</strong>, port ${it.flow.port}</p>`); };
  T.gate = {
    render(it, key, st) {
      const TR = SAA.tracer, ok = gateOk(it), show = st.done;
      const card = `<div class="mp-card"><div class="mp-ct">${TR.stopTitle(it.net, it.at)}</div><div class="mp-set">Set to: ${TR.stopInfo(it.net, it.at)}</div></div>`;
      const opt = (v, label) => { const cls = !show ? "" : "locked " + (v === ok ? "correct" : st.sel === v ? "picked-wrong" : "other"); return `<li class="opt ${cls}"><button data-act="gate" data-key="${esc(key)}" data-v="${v ? 1 : 0}" ${show ? 'tabindex="-1" aria-disabled="true"' : ""}><span class="otext">${label}</span></button></li>`; };
      let h = packetLine(it) + card + `<ul class="options gate-opts">${opt(true, "✓ It lets the packet through")}${opt(false, "✗ It blocks the packet")}</ul>`;
      if (show) h += `<div class="feedback ${st.ok ? "ok" : "bad"}"><strong>${st.ok ? "Correct." : "Not quite."}</strong> ${TR.tierize(it.why || "")}</div>
        <p class="hint">Here it is on the map, at that checkpoint:</p>${TR.map(`${key}|m`, it.net, [{ label: "The packet's trip", flow: it.flow }], { reveal: true, focus: it.focus })}`;
      return h;
    },
    act(it, st, a, el) { if (a !== "gate" || st.done) return false; st.sel = el.dataset.v === "1"; finish(it, st); return true; },
    check: (it, st) => st.sel === gateOk(it),
  };

  // What does the packet hit next? Options are other checkpoints on the same trip.
  const tripStops = it => { const seen = new Set(); return SAA.tracer.run(it.net, it.flow, { all: true }).hops.filter(h => h.at && !seen.has(h.at) && seen.add(h.at)).map(h => h.at); };
  T.nexthop = {
    init(it, st) {
      const s = tripStops(it), i = s.indexOf(it.after), right = s[i + 1];
      const others = SAA.shuffle(s.filter(x => x !== it.after && x !== right)).slice(0, 3);
      st.opts = SAA.shuffle([right, ...others]);
    },
    render(it, key, st) {
      const TR = SAA.tracer, s = tripStops(it), right = s[s.indexOf(it.after) + 1], show = st.done;
      let h = packetLine(it) + `<p>It just passed <strong>${TR.stopTitle(it.net, it.after)}</strong>. What checks it next?</p><ul class="options">${st.opts.map((at, i) => {
        const cls = !show ? "" : "locked " + (at === right ? "correct" : at === st.sel ? "picked-wrong" : "other");
        return `<li class="opt ${cls}"><button data-act="pick" data-key="${esc(key)}" data-at="${esc(at)}" ${show ? 'tabindex="-1" aria-disabled="true"' : ""}><span class="letter">${LET[i]}</span><span class="otext">${TR.stopTitle(it.net, at)}</span></button></li>`;
      }).join("")}</ul>`;
      if (show) h += `<div class="feedback ${st.ok ? "ok" : "bad"}"><strong>${st.ok ? "Correct." : "Not quite."}</strong> ${TR.tierize(it.why || "")}</div>
        <p class="hint">The whole trip, in order. Press Next to step through it.</p>${TR.map(`${key}|m`, it.net, [{ label: "The packet's trip", flow: it.flow }], { walk: true, reveal: true, focus: it.focus })}`;
      return h;
    },
    act(it, st, a, el) { if (a !== "pick" || st.done) return false; st.sel = el.dataset.at; finish(it, st); return true; },
    check: (it, st) => { const s = tripStops(it); return st.sel === s[s.indexOf(it.after) + 1]; },
  };
  T.policyfix = fix("policy");

  SAA.items = {
    types: T,
    render(it, key, st, ctx = {}) {
      const t = T[it.type];
      if (!st.init) { if (t.init) t.init(it, st, ctx); if (ctx.mock && it.type === "elim") st.mode = "mcq"; st.init = 1; }
      const q = /^(trace|where|gate|nexthop)/.test(it.type) ? SAA.tracer.tierize(it.q) : it.q;
      return `<div class="item">${it.q ? `<div class="prompt">${ctx.label || ""}${q}</div>` : ""}${t.render(it, key, st, ctx)}</div>`;
    },
    act: (it, key, st, a, el, ctx = {}) => T[it.type].act(it, st, a, el, ctx, key),
    check: (it, st) => T[it.type].check(it, st),
  };
})(window.SAA);
