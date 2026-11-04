// App: views, navigation and events. All persistent state lives in S (saved to localStorage after every change).
(function (SAA) {
  const esc = SAA.esc, P = SAA.policy;
  let S;
  const UI = { items: {}, explains: {}, gq: "", playTab: "tracer", playNet: "threeTier", playPol: "basics", playChal: 0, playNetChal: 0, confirm: null, msg: "", copied: null, exShort: null };
  const save = () => SAA.save(S);
  const today = () => SAA.today(S);
  const ist = key => S.ist[key] || (S.ist[key] = {});
  const pct = x => Math.max(0, Math.min(100, Math.round(x * 100)));
  const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
  const htmlText = h => { const d = document.createElement("div"); d.innerHTML = h; return d.textContent.replace(/\s+/g, " ").trim(); };

  // Registers an item for event handling and returns its HTML.
  const useItem = (item, key, onAnswer, ctx = {}) => { UI.items[key] = { item, onAnswer, ctx }; return SAA.items.render(item, key, ist(key), ctx); };

  // ---------- session ----------
  function ensureSession() {
    const d = today();
    if (S.session && S.session.day === d) return S.session;
    Object.keys(S.ist).forEach(k => { if (k.startsWith("S|")) delete S.ist[k]; });
    if (S.settings.startDay == null) S.settings.startDay = d;
    S.session = SAA.buildSession(S, d); save();
    return S.session;
  }

  // ---------- shared cards ----------
  function examCard() {
    const def = `${new Date().getFullYear()}-12-17`;
    return `<section class="card setup"><h3>When is your exam?</h3>
      <p class="muted small">Book it now if you can: rescheduling is free up to 24 hours before. The date drives your pace and makes sure everything comes back for review before the exam.</p>
      <div class="fillrow"><input type="date" id="exam-date" value="${esc(S.settings.examDate || def)}"><button class="btn" data-go="save-exam">Save</button></div></section>`;
  }

  function paceCard() {
    const p = SAA.pace(S, today()); if (!p) return "";
    const [cls, label] = p.done >= p.total ? ["ok", "All lessons done"] : p.behind <= 0 ? ["ok", "On track"] : p.behind <= 2 ? ["warn", `${plural(p.behind, "lesson")} behind`] : ["bad", `${plural(p.behind, "lesson")} behind`];
    const cov = SAA.coverage(S);
    return `<section class="card pace"><div class="pace-row"><div><div class="kicker">Exam ${SAA.fmtDay(p.exam)} · ${plural(p.daysToExam, "day")} away</div><strong class="pace-${cls}">${label}</strong></div>
      <div class="pace-num"><strong>${p.done}/${p.total}</strong><span class="muted small">lessons</span></div></div>
      <div class="bar"><span style="width:${pct(p.done / p.total)}%"></span></div>
      <p class="muted small">${p.done >= p.total ? "Spend the remaining days on reviews and mock exams." : `To finish all lessons by ${SAA.fmtDay(p.finish)}, a week before the exam: about ${p.perStudyDay.toFixed(1)} lessons per study day at 5 days a week.`}${cov.built < cov.total ? ` ${cov.total - cov.built} of those lessons are in modules still being written.` : ""}</p></section>`;
  }

  function readinessCard(full) {
    const R = SAA.readiness(S);
    const meters = Object.entries(SAA.DOMAINS).map(([k, D]) => {
      const d = R.dom[k];
      return `<div class="meter"><div class="meter-h"><span>${D.short} <span class="muted small">${D.weight}% of exam</span></span><span class="small">${d.total ? `${d.solid}/${d.total} solid` : "no content yet"}</span></div><div class="bar"><span style="width:${pct(d.pct)}%"></span></div></div>`;
    }).join("");
    return `<section class="card"><div class="meter-top"><h3>Readiness</h3><div class="big-num">${pct(R.overall)}%<span class="muted small"> exam estimate</span></div></div>
      ${meters}
      <p class="muted small">Built only from reviews on later days, never from answers right after a lesson. A concept is solid once you've got it right in 2+ different scenarios on 2+ different days.${full ? ` The estimate is scaled by course coverage: ${R.cov.built} of ${R.cov.total} lessons exist so far.` : ""}</p></section>`;
  }

  // ---------- explain it ----------
  function explainHTML(l, key, onSave) {
    const e = l.explain, st = ist(key);
    UI.explains[key] = { l, onSave };
    let h = `<div class="prompt">${e.prompt}</div>`;
    if (!st.revealed) return h + `<textarea class="answer" data-ex="${esc(key)}" rows="5" placeholder="Explain it like you would to a colleague, in 2–5 sentences. Don't look back at the lesson.">${esc(st.text || "")}</textarea>
      ${UI.exShort === key ? `<p class="note">Write at least a sentence first. Producing the answer yourself is the whole point.</p>` : ""}
      <div class="item-actions"><button class="btn" data-go="ex-reveal" data-key="${esc(key)}">Compare with the key points</button></div>`;
    st.ticks = st.ticks || [];
    return h + `<blockquote class="youwrote">${esc(st.text || "")}</blockquote>
      <p class="hint">${st.saved ? "Your self-check:" : "Tick each point your answer actually covered. Be honest: it decides when this comes back."}</p>
      <ul class="points">${e.points.map((pt, i) => `<li><label><input type="checkbox" data-go="ex-tick" data-key="${esc(key)}" data-i="${i}" ${st.ticks.includes(i) ? "checked" : ""} ${st.saved ? "disabled" : ""}> <span>${pt}</span></label></li>`).join("")}</ul>
      <div class="item-actions"><button class="btn ghost" data-go="ex-copy" data-key="${esc(key)}">Copy for Claude</button>${st.saved ? "" : `<button class="btn" data-go="ex-save" data-key="${esc(key)}">Save self-check</button>`}</div>
      ${UI.copied === key ? `<p class="muted small">Copied. Paste it into a Claude chat for a strict grade and a follow-up question.</p>` : ""}
      ${st.saved ? `<div class="feedback ${st.score >= 1 ? "ok" : "bad"}"><strong>${st.ticks.length} of ${e.points.length} points.</strong> ${st.score >= 1 ? "Nice. It comes back in a few days." : "It comes back tomorrow. Missing points early on is normal."}</div>` : ""}`;
  }

  function claudePrompt(l, st) {
    return `I'm studying for the AWS Solutions Architect Associate (SAA-C03) exam. Grade my explanation like a strict but friendly tutor.

Question: ${htmlText(l.explain.prompt)}

My answer:
${st.text || ""}

A complete answer should cover:
${l.explain.points.map(p => "- " + htmlText(p)).join("\n")}

Please:
1. Tell me what I got right, what's missing, and anything that's wrong or imprecise.
2. Then ask me ONE follow-up question that changes the scenario slightly, to test whether I really understand it rather than memorized it. Wait for my answer before explaining.`;
  }

  function copy(text) {
    const fallback = () => { const t = document.createElement("textarea"); t.value = text; document.body.appendChild(t); t.select(); try { document.execCommand("copy"); } catch (e) { } t.remove(); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).catch(fallback); else fallback();
  }

  // ---------- views ----------
  function vToday() {
    const s = ensureSession(), d = today();
    let h = `<h2 class="page-h">Today</h2>`;
    if (!S.settings.examDate) h += examCard();
    h += paceCard();
    const rem = s.items.slice(s.pos);
    if (rem.length) {
      const rv = rem.filter(x => x.k === "review").length, ex = rem.filter(x => x.k === "explain").length, ls = rem.filter(x => x.k === "lesson");
      const mins = Math.max(5, Math.round(rv * 1.5 + ex * 4 + ls.length * 12));
      h += `<section class="card hero"><div class="kicker">${SAA.fmtDay(d)}</div><h3>${s.pos ? "Pick up where you left off" : "Today's session"}</h3>
        <ul class="plan">${rv ? `<li><span class="pi">↻</span> ${plural(rv, "review")} <span class="muted small">mixed topics</span></li>` : ""}${ex ? `<li><span class="pi">✎</span> 1 explain-it-in-your-words</li>` : ""}${ls.map(x => `<li><span class="pi">+</span> New lesson: ${esc(SAA.lessonById[x.l].title)} <span class="muted small">Module ${SAA.lessonById[x.l].module.num}</span></li>`).join("")}</ul>
        <p class="muted small">About ${mins} minutes.${s.pos ? ` ${s.pos} of ${s.items.length} done.` : ""}</p>
        ${s.held ? `<p class="note">${s.held === 2 ? "No new lessons" : "Only 1 new lesson"} today: ${s.due} reviews were due. Clearing them first stops you building on things you've started to forget. Whatever's left rolls over quietly.</p>` : ""}
        <button class="btn big" data-go="session">${s.pos ? "Continue" : "Start"}</button></section>`;
    } else {
      const res = Object.values(s.res), right = res.filter(Boolean).length;
      const more = SAA.moreReviews(S, d).length, next = SAA.nextLessons(S, 1)[0];
      h += `<section class="card hero done"><div class="kicker">${SAA.fmtDay(d)}</div><h3>${s.items.length ? "Done for today ✓" : "Nothing due right now"}</h3>
        ${res.length ? `<p>${right} of ${plural(res.length, "review")} right.</p>` : ""}
        <p class="muted">${s.items.length ? "Showing up every day is what gets you to the exam. Stopping here is completely fine." : next ? "" : "All available lessons are done. New modules appear as they're written."}</p>
        <div class="actions-row">${more ? `<button class="btn ghost" data-go="more-reviews">${plural(Math.min(more, SAA.SESSION.reviews), "more review")}</button>` : ""}${next ? `<button class="btn ${s.items.length ? "ghost" : ""}" data-go="more-lesson">Next lesson: ${esc(SAA.lessonById[next].title)}</button>` : ""}</div></section>`;
    }
    return h + readinessCard(false);
  }

  const nextBtn = () => `<div class="actions"><span></span><button class="btn" data-go="next">Next</button></div>`;

  function vSession() {
    const s = ensureSession(), d = today();
    if (s.pos >= s.items.length) { S.view = { name: "today" }; return vToday(); }
    const it = s.items[s.pos], key = `S|${s.day}|${s.pos}`;
    const bar = `<div class="sessbar"><button class="linkbtn" data-nav="today">← Today</button><div class="bar thin"><span style="width:${pct(s.pos / s.items.length)}%"></span></div><span class="muted small">${s.pos + 1} / ${s.items.length}</span></div>`;
    if (it.k === "lesson") return bar + vLesson(it.l, { session: true });
    if (it.k === "explain") {
      const l = SAA.lessonById[it.l];
      return bar + `<article class="card"><div class="kicker">Explain it again · Module ${l.module.num}</div><h3>${esc(l.title)}</h3>
        ${explainHTML(l, key, score => { SAA.recordExplain(S, l.gid, score, d); SAA.bump(S, d, "items"); })}</article>${ist(key).saved ? nextBtn() : ""}`;
    }
    const c = SAA.conceptById[it.g], st = ist(key);
    let h = bar + `<article class="card"><div class="kicker">Review${st.done ? ` · ${esc(c.title)}` : ""}</div>`
      + useItem(c.variants[it.v], key, ok => { SAA.recordConcept(S, it.g, it.v, ok, "review", d); s.res[s.pos] = ok; SAA.bump(S, d, "items"); });
    if (st.done) {
      const due = S.concepts[it.g].due - d;
      h += `<p class="muted small after">From module ${c.module.num}: ${esc(c.lesson.title)}. Comes back ${due === 1 ? "tomorrow" : `in ${due} days`}. <button class="linkbtn" data-go="open-lesson" data-l="${c.lesson.gid}">Reread the lesson</button></p>`;
    }
    return h + `</article>` + (st.done ? nextBtn() : "");
  }

  function vLesson(gid, ctx = {}) {
    const l = SAA.lessonById[gid]; if (!l) return vCourse();
    const m = l.module, d = today();
    const p = S.lessons[gid] || (S.lessons[gid] = { step: 0, done: false });
    const K = suffix => `L|${gid}|${suffix}`;
    let h = "";
    if (!ctx.session && S.view.back === "session") h += `<div class="sessbar"><button class="linkbtn" data-go="back-session">← Back to the review</button></div>`;
    h += `<article class="card"><div class="kicker">Module ${m.num}: ${esc(m.title)} · Lesson ${l.num} of ${m.lessons.length}</div><h2>${esc(l.title)}</h2>
      <div class="step-h"><span class="stepn">1</span> Try first</div><p class="muted small">You haven't learned this yet. Make your best guess: being wrong first makes the explanation stick, and this one never counts.</p>
      ${useItem(l.tryFirst, K("try"), () => { if (p.step < 1) p.step = 1; })}</article>`;
    if (p.step >= 1) h += `<article class="card"><div class="step-h"><span class="stepn">2</span> Learn <span class="muted small">~${l.min || 3} min</span></div><div class="body">${l.body}</div>${l.walk ? SAA.tracer.map(`W|${gid}`, l.walk[0].net, l.walk, { reveal: true, walk: true }) : ""}${l.example ? `<aside class="example"><strong>Example</strong>${l.example}</aside>` : ""}
      ${p.step === 1 ? `<div class="actions"><span></span><button class="btn" data-go="lstep" data-l="${gid}" data-s="2">Practice it</button></div>` : ""}</article>`;
    if (p.step >= 2) {
      // Module 4+: each concept's first level-3 variant is asked too, as exam-style questions.
      const exam = m.num < 4 ? [] : l.concepts.map(c => ({ c, v: c.variants.findIndex(it => it.level === 3) })).filter(x => x.v > 0);   // module 3 uses levels only for the review ladder
      const all = l.concepts.every(c => ist(K(c.id)).done) && exam.every(x => ist(K(c.id + "|exam")).done);
      h += `<article class="card"><div class="step-h"><span class="stepn">3</span> Apply it</div><p class="muted small">New situations, same ideas. These concepts start coming back for review tomorrow, each time in a different scenario.</p>
        ${l.concepts.map((c, i) => `<div class="q">${useItem(c.variants[0], K(c.id), ok => SAA.recordConcept(S, c.gid, 0, ok, "lesson", d), { label: l.concepts.length > 1 ? `<span class="qlabel">${i + 1}.</span> ` : "" })}</div>`).join("")}
        ${exam.length ? `<div class="step-h">Exam-style</div><p class="muted small">Written like the real exam: every option is a real AWS setup, and only one fits all the requirements.</p>
        ${exam.map(({ c, v }, i) => `<div class="q">${useItem(c.variants[v], K(c.id + "|exam"), ok => SAA.recordConcept(S, c.gid, v, ok, "lesson", d), { label: exam.length > 1 ? `<span class="qlabel">${i + 1}.</span> ` : "" })}</div>`).join("")}` : ""}
        ${all && p.step === 2 ? `<div class="actions"><span></span><button class="btn" data-go="lstep" data-l="${gid}" data-s="3">Explain it</button></div>` : ""}</article>`;
    }
    if (p.step >= 3) h += `<article class="card"><div class="step-h"><span class="stepn">4</span> Explain it in your own words</div>${explainHTML(l, K("explain"), score => {
      if (!S.explains[gid]) SAA.recordExplain(S, gid, score, d);
      if (!p.done) { p.done = true; SAA.bump(S, d, "lessons"); }
      p.step = 4;
    })}</article>`;
    if (p.step >= 4) {
      const next = SAA.lessonOrder[SAA.lessonOrder.indexOf(gid) + 1];
      h += `<section class="card done-card"><h3>Lesson done ✓</h3><p class="muted">Its concepts come back from tomorrow, in different scenarios each time.</p><div class="actions-row">
        ${ctx.session ? `<button class="btn" data-go="next">Next in today's session</button>` : `<button class="btn ghost" data-nav="course">Back to course</button>${next ? `<button class="btn" data-go="open-lesson" data-l="${next}">Next lesson</button>` : ""}`}</div></section>`;
    }
    return h;
  }

  function vCourse() {
    const cov = SAA.coverage(S);
    return `<h2 class="page-h">Course</h2><p class="sub">${cov.done} of ${cov.total} lessons done. Today picks lessons in order for you; open any lesson here to read ahead or revisit.</p>`
      + SAA.catalog.map(cm => {
        const m = SAA.modules.find(x => x.num === cm.num);
        if (!m) return `<section class="card mod soon"><div class="kicker">Module ${cm.num}</div><h3>${esc(cm.title)}</h3><p class="muted small">Being written · about ${cm.planned} lessons</p></section>`;
        const done = m.lessons.filter(l => S.lessons[l.gid] && S.lessons[l.gid].done).length;
        return `<section class="card mod"><div class="kicker">Module ${m.num} · ${done}/${m.lessons.length} lessons</div><h3>${esc(m.title)}</h3><p class="muted small">${esc(m.sub)}</p>
          <ol class="lessons">${m.lessons.map(l => { const p = S.lessons[l.gid]; return `<li class="${p && p.done ? "done" : p ? "started" : ""}"><button class="linkbtn" data-go="open-lesson" data-l="${l.gid}">${p && p.done ? "✓ " : ""}${esc(l.title)}</button> <span class="muted small">${plural(l.concepts.length, "concept")}</span></li>`; }).join("")}</ol></section>`;
      }).join("");
  }

  function activityStrip() {
    const d = today(), days = [...Array(21).keys()].map(i => d - 20 + i);
    const studied = days.filter(x => S.activity[x]).length;
    return `<section class="card"><h3>Last 3 weeks</h3><div class="strip">${days.map(x => { const a = S.activity[x]; const n = a ? a.items + a.lessons * 3 : 0; return `<span class="cell l${n === 0 ? 0 : n < 6 ? 1 : n < 15 ? 2 : 3}" title="${SAA.fmtDay(x)}: ${a ? `${plural(a.lessons, "lesson")}, ${plural(a.items, "review")}` : "nothing"}"></span>`; }).join("")}</div>
      <p class="muted small">Studied on ${studied} of the last 21 days. Missed days don't reset anything.</p></section>`;
  }

  function mocksCard() {
    const done = SAA.completedModules(S).length;
    const btn = kind => {
      const M = SAA.MOCKS[kind], ok = SAA.mockAvailable(S, kind);
      return `<div class="mockrow"><div><strong>${M.label}</strong> <span class="muted small">${M.n} questions · ${M.min} minutes</span>
        ${ok ? "" : `<div class="muted small">Unlocks after ${M.needModules === Infinity ? "all" : M.needModules} completed modules (you have ${done}).</div>`}</div>
        <button class="btn ${ok ? "" : "ghost"}" data-go="mock-start" data-kind="${kind}" ${ok ? "" : "disabled"}>Start</button></div>`;
    };
    const active = S.mocks.find(m => !m.done);
    const hist = S.mocks.filter(m => m.done).slice().reverse().map(m => `<li><button class="linkbtn" data-go="mock-open" data-id="${m.id}">${SAA.MOCKS[m.kind].label}, ${SAA.fmtDay(m.day)}</button> <strong>${pct(m.right / m.items.length)}%</strong> <span class="muted small">${m.right}/${m.items.length}</span></li>`).join("");
    return `<section class="card"><h3>Mock exams</h3><p class="muted small">Exam conditions: a timer, no feedback until you submit, questions you haven't seen recently. Every concept you miss goes back into your reviews. Before booking, also do one external practice set (Tutorials Dojo is the usual pick) to check against a different question writer.</p>
      ${active ? `<div class="note">A ${SAA.MOCKS[active.kind].label.toLowerCase()} is in progress. <button class="linkbtn" data-go="mock-open" data-id="${active.id}">Resume it</button></div>` : btn("mini") + btn("full")}
      ${hist ? `<ul class="hist">${hist}</ul>` : ""}</section>`;
  }

  function conceptsCard() {
    const d = today();
    return `<section class="card"><h3>Concepts</h3>${SAA.modules.map(m => `<details><summary>Module ${m.num}: ${esc(m.title)}</summary><table class="ctable"><tbody>${m.lessons.flatMap(l => l.concepts).map(c => {
      const cs = S.concepts[c.gid], st = SAA.conceptStatus(cs);
      return `<tr><td>${esc(c.title)}</td><td><span class="badge ${st}">${SAA.STATUS[st].label}</span></td><td class="muted small">${cs ? (cs.due <= d ? "due" : `in ${cs.due - d}d`) : ""}</td></tr>`;
    }).join("")}</tbody></table></details>`).join("")}</section>`;
  }

  function vProgress() {
    return `<h2 class="page-h">Progress</h2>` + (S.settings.examDate ? paceCard() : examCard()) + readinessCard(true) + activityStrip() + mocksCard() + conceptsCard();
  }

  // ---------- mocks ----------
  const mockKey = (m, i) => `M|${m.id}|${i}`;
  const mockItem = (m, i) => SAA.conceptById[m.items[i].g].variants[m.items[i].v];

  function submitMock(m) {
    const d = today();
    m.right = 0; m.byDom = {};
    m.items.forEach((x, i) => {
      const it = mockItem(m, i), st = ist(mockKey(m, i)), c = SAA.conceptById[x.g];
      if (!st.init) SAA.items.render(it, mockKey(m, i), st, { mock: true });   // unseen questions still need their state
      st.done = true; st.ok = SAA.items.check(it, st); st.recorded = 1;
      if (st.ok) m.right++;
      const b = m.byDom[c.domain] || (m.byDom[c.domain] = { right: 0, n: 0 }); b.n++; if (st.ok) b.right++;
      SAA.recordConcept(S, x.g, x.v, st.ok, "mock", d);
      SAA.bump(S, d, "items");
    });
    m.done = true; m.end = Date.now();
  }

  function vMock() {
    const m = S.mocks.find(x => x.id === S.view.id);
    if (!m) return vProgress();
    if (!m.done) {
      if (m.start + m.min * 6e4 <= Date.now()) { submitMock(m); save(); return vMock(); }
      const i = m.cur, n = m.items.length, key = mockKey(m, i);
      const answered = j => { const st = S.ist[mockKey(m, j)]; return st && (st.sel !== undefined || (st.sels && st.sels.length)); };
      return `<div class="mockbar"><span class="timer" id="mock-timer">${timerText(m)}</span><span class="muted small">Question ${i + 1} of ${n}</span>
          <button class="btn ghost small" data-go="mock-flag">${m.flag[i] ? "Unflag" : "Flag for review"}</button></div>
        <article class="card">${useItem(mockItem(m, i), key, null, { mock: true, label: `<span class="qlabel">${i + 1}.</span> ` })}</article>
        <div class="actions"><button class="btn ghost" data-go="mock-go" data-i="${i - 1}" ${i === 0 ? "disabled" : ""}>Previous</button><button class="btn" data-go="mock-go" data-i="${i + 1}" ${i === n - 1 ? "disabled" : ""}>Next</button></div>
        <section class="card"><div class="qgrid">${m.items.map((_, j) => `<button class="qcell ${j === i ? "cur" : ""} ${answered(j) ? "ans" : ""} ${m.flag[j] ? "flag" : ""}" data-go="mock-go" data-i="${j}" aria-label="Question ${j + 1}">${j + 1}</button>`).join("")}</div>
        <p class="muted small">${m.items.filter((_, j) => answered(j)).length} of ${n} answered. Flagged questions have an orange border.</p>
        <button class="btn ${UI.confirm === "submit" ? "danger" : "ghost"}" data-go="mock-submit">${UI.confirm === "submit" ? "Click again to submit" : "Submit exam"}</button></section>`;
    }
    const score = m.right / m.items.length;
    const verdict = score >= 0.8 ? "Strong. Keep this up across the remaining modules." : score >= 0.7 ? "Borderline. The real exam's pass mark is 720/1000 on a scaled score, so aim for 80%+ in practice." : "Not there yet. That's what mocks are for: every miss is now scheduled for review.";
    return `<button class="linkbtn" data-nav="progress">← Progress</button>
      <section class="card"><div class="kicker">${SAA.MOCKS[m.kind].label} · ${SAA.fmtDay(m.day)}</div><h2>${pct(score)}% <span class="muted small">${m.right} of ${m.items.length}</span></h2><p>${verdict}</p>
      ${Object.entries(m.byDom).map(([k, b]) => `<div class="meter"><div class="meter-h"><span>${SAA.DOMAINS[k].short}</span><span class="small">${b.right}/${b.n}</span></div><div class="bar"><span style="width:${pct(b.right / b.n)}%"></span></div></div>`).join("")}</section>
      <h3>Every question, with explanations</h3>
      ${m.items.map((x, i) => `<article class="card"><div class="kicker">${esc(SAA.conceptById[x.g].title)} · ${S.ist[mockKey(m, i)].ok ? "✓ right" : "✗ missed"}</div>${useItem(mockItem(m, i), mockKey(m, i), null, { label: `<span class="qlabel">${i + 1}.</span> ` })}</article>`).join("")}`;
  }

  function timerText(m) {
    const left = Math.max(0, Math.round((m.start + m.min * 6e4 - Date.now()) / 1000));
    return `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")} left`;
  }

  // ---------- playgrounds ----------
  const PLAY_NETS = {
    threeTier: ["Three-tier VPC (everything works)", () => SAA.nets.make("threeTier")],
    brokenNacl: ["Custom NACL that forgets replies", () => SAA.nets.make("threeTier", n => {
      n.nacls["acl-web"] = { name: "Web NACL", in: [{ n: 100, port: "443", cidr: "0.0.0.0/0", allow: true }], out: [{ n: 100, port: "443", cidr: "0.0.0.0/0", allow: true }] };
      SAA.nets.subnet(n, "pub-a").nacl = "acl-web";
    })],
    noNat: ["Private subnet without internet access", () => SAA.nets.make("threeTier", n => { n.rts["rt-private-a"].routes = []; })],
    single: ["One public subnet", () => SAA.nets.make("single")],
  };
  const PLAY_FLOWS = { threeTier: { from: "user", to: "web", port: 443 }, brokenNacl: { from: "user", to: "web", port: 443 }, noNat: { from: "app", to: "internet", port: 443 }, single: { from: "user", to: "web", port: 443 } };
  const PLAY_POL = {
    basics: ["Explicit deny beats allow", () => P.sc({
      principal: "dana", req: { action: "s3:DeleteObject", resource: "arn:aws:s3:::finance/q1.xlsx" },
      policies: [
        { kind: "identity", name: "S3FullAccess (from her group)", doc: P.doc({ Sid: "AllS3", Effect: "Allow", Action: "s3:*", Resource: "*" }) },
        { kind: "identity", name: "ProtectFinance", doc: P.doc({ Sid: "NoFinanceDeletes", Effect: "Deny", Action: "s3:DeleteObject", Resource: "arn:aws:s3:::finance/*" }) },
      ],
    })],
    mfa: ["MFA condition", () => P.sc({
      principal: "dana", req: { action: "s3:DeleteObject", resource: "arn:aws:s3:::finance/q1.xlsx" },
      policies: [{ kind: "identity", name: "DeleteWithMfa", doc: P.doc({ Sid: "DeleteOnlyWithMfa", Effect: "Allow", Action: "s3:DeleteObject", Resource: "arn:aws:s3:::finance/*", Condition: { Bool: { "aws:MultiFactorAuthPresent": "true" } } }) }],
    })],
    scp: ["SCP region guardrail", () => P.sc({
      principal: "dana", req: { action: "ec2:RunInstances", resource: "*", region: "us-east-1" },
      policies: [
        { kind: "scp", name: "Dev OU guardrail", doc: P.doc({ Sid: "FullAccess", Effect: "Allow", Action: "*", Resource: "*" }, { Sid: "OnlyFrankfurt", Effect: "Deny", Action: "*", Resource: "*", Condition: { StringNotEquals: { "aws:RequestedRegion": "eu-central-1" } } }) },
        { kind: "identity", name: "AdministratorAccess", doc: P.doc({ Sid: "Admin", Effect: "Allow", Action: "*", Resource: "*" }) },
      ],
    })],
    boundary: ["Permissions boundary", () => P.sc({
      principal: "app", req: { action: "dynamodb:PutItem", resource: "arn:aws:dynamodb:eu-central-1:111111111111:table/orders" },
      policies: [
        { kind: "boundary", name: "DevBoundary", doc: P.doc({ Sid: "S3Only", Effect: "Allow", Action: "s3:*", Resource: "*" }) },
        { kind: "identity", name: "AppPolicy", doc: P.doc({ Sid: "S3AndDynamo", Effect: "Allow", Action: ["s3:*", "dynamodb:*"], Resource: "*" }) },
      ],
    })],
    cross: ["Cross-account bucket access", () => P.sc({
      principal: "auditor", req: { action: "s3:GetObject", resource: "arn:aws:s3:::audit-logs/2026/10.json" },
      policies: [
        { kind: "identity", name: "AuditorPolicy (account 222)", doc: P.doc({ Sid: "ReadAuditLogs", Effect: "Allow", Action: "s3:GetObject", Resource: "arn:aws:s3:::audit-logs/*" }) },
        { kind: "resource", name: "Bucket policy on audit-logs (account 111)", doc: P.doc({ Sid: "AuditorRead", Effect: "Allow", Principal: { AWS: "arn:aws:iam::222222222222:role/auditor" }, Action: "s3:GetObject", Resource: "arn:aws:s3:::audit-logs/*" }) },
      ],
    })],
  };

  // The lesson's guided network fixes, as free-edit challenges.
  const netChallenges = () => SAA.modules.flatMap(m => m.lessons.flatMap(l => l.concepts.flatMap(c => c.variants
    .filter(v => v.type === "tracefix").map(v => Object.assign({}, v, { type: "tracefree", title: c.title })))));

  function vPlay() {
    const tab = (id, label) => `<button class="tab" aria-current="${UI.playTab === id}" data-go="play-tab" data-t="${id}">${label}</button>`;
    let h = `<h2 class="page-h">Practice</h2><p class="sub">Break things on purpose and see exactly why. Nothing here costs money or affects your progress.</p><nav class="tabs">${tab("tracer", "Packet tracer")}${tab("policy", "Policy evaluator")}</nav>`;
    if (UI.playTab === "tracer") {
      const [label, make] = PLAY_NETS[UI.playNet];
      const nchals = netChallenges(), ni = Math.min(UI.playNetChal, nchals.length - 1);
      const nsolved = i => { const st = S.ist[`X|net|${i}`]; return !!(st && st.goalRes && st.goalRes.every(g => g.pass)); };
      h += `<section class="card"><h3>Network challenges</h3><p class="muted small">The same broken setups as the lesson questions, but here you fix them by hand. Nothing is scored.</p>
        <div class="fillrow"><label class="muted small" for="play-netchal">Challenge</label><select id="play-netchal">${nchals.map((c, i) => `<option value="${i}" ${i === ni ? "selected" : ""}>${i + 1}. ${esc(c.title)}${nsolved(i) ? " ✓" : ""}</option>`).join("")}</select>
        <button class="btn ghost small" data-go="netchal-reset">Start over</button>${ni < nchals.length - 1 ? `<button class="btn ghost small" data-go="netchal-next">Next</button>` : ""}</div>
        ${useItem(nchals[ni], `X|net|${ni}`, null)}</section>`;
      h += `<section class="card"><h3>Sandbox</h3><div class="fillrow"><label class="muted small" for="play-net">Scenario</label><select id="play-net">${Object.entries(PLAY_NETS).map(([k, [l]]) => `<option value="${k}" ${k === UI.playNet ? "selected" : ""}>${esc(l)}</option>`).join("")}</select></div>
        <p class="muted small">Pick a flow and press Trace. Change route tables, security groups, NACLs, public IPs or the S3 endpoint; the trace re-runs on every change. Simplified: TCP only, replies return to port 50000.</p>
        ${SAA.tracer.mount(`P|net|${UI.playNet}`, make(), { flow: PLAY_FLOWS[UI.playNet], run: true })}</section>`;
    } else {
      const chals = SAA.practice.policy, ci = UI.playChal, ck = `X|pol|${ci}`;
      const solved = i => { const st = S.ist[`X|pol|${i}`]; return !!(st && st.goalRes && st.goalRes.every(g => g.pass)); };
      h += `<section class="card"><h3>Challenges</h3><p class="muted small">Each one starts broken. Edit the JSON until every goal passes.</p>
        <div class="fillrow"><label class="muted small" for="play-chal">Challenge</label><select id="play-chal">${chals.map((c, i) => `<option value="${i}" ${i === ci ? "selected" : ""}>${i + 1}. ${esc(c.title)}${solved(i) ? " ✓" : ""}</option>`).join("")}</select>
        <button class="btn ghost small" data-go="chal-reset">Start over</button>${ci < chals.length - 1 ? `<button class="btn ghost small" data-go="chal-next">Next</button>` : ""}</div>
        ${useItem(chals[ci], ck, null)}</section>`;
      h += `<section class="card"><h3>Sandbox</h3><div class="fillrow"><label class="muted small" for="play-pol">Scenario</label><select id="play-pol">${Object.entries(PLAY_POL).map(([k, [l]]) => `<option value="${k}" ${k === UI.playPol ? "selected" : ""}>${esc(l)}</option>`).join("")}</select></div>
        <p class="muted small">Edit the request or any policy JSON and evaluate. Simplified but follows AWS's order: explicit deny, SCP, permissions boundary, then identity and resource policies (both sides needed across accounts).</p>
        ${P.mount(`P|pol|${UI.playPol}`, PLAY_POL[UI.playPol][1]())}</section>`;
    }
    return h;
  }

  // ---------- glossary & settings ----------
  function vGlossary() {
    return `<h2 class="page-h">Glossary</h2><section class="card"><p class="muted small">Every abbreviation and service name in the course. The number shows the module that teaches it.</p>
      <label for="gsearch" class="muted small">Search</label><input type="search" id="gsearch" value="${esc(UI.gq)}" placeholder="e.g. NAT, KMS, gateway" autocomplete="off"><dl class="gloss" id="glist"></dl></section>`;
  }
  function drawGloss() {
    const el = document.getElementById("glist"); if (!el) return;
    const f = UI.gq.trim().toLowerCase();
    const rows = SAA.glossary.filter(g => !f || g.slice(0, 3).join(" ").toLowerCase().includes(f));
    el.innerHTML = rows.length ? rows.map(g => `<div><dt>${esc(g[0])} <span>· ${esc(g[1])}</span></dt><dd>${esc(g[2])} <span class="tag">Module ${g[3]}</span></dd></div>`).join("") : `<p class="muted">No matches.</p>`;
  }

  function vSettings() {
    const off = S.settings.dayOffset || 0;
    return `<h2 class="page-h">Settings</h2>${examCard()}
      <section class="card"><h3>Backup</h3><p class="muted small">Progress lives only in this browser. Clearing site data erases it, so export a backup now and then (and to move to another device).</p>
        <div class="actions-row"><button class="btn ghost" data-go="export">Export progress</button><button class="btn ghost" data-go="import">Import progress</button><input type="file" id="importFile" accept="application/json,.json" hidden></div>
        ${UI.msg ? `<p class="note">${esc(UI.msg)}</p>` : ""}</section>
      <section class="card"><h3>Testing: pretend it's another day</h3><p class="muted small">Moves "today" forward so you can see how reviews come back. Currently ${off ? `<strong>${plural(off, "day")} ahead</strong>` : "off"}.</p>
        <div class="actions-row"><button class="btn ghost" data-go="day-plus">+1 day</button>${off ? `<button class="btn ghost" data-go="day-reset">Back to the real date</button>` : ""}</div></section>
      <section class="card"><h3>Start over</h3><p class="muted small">Deletes all progress in this browser.</p>
        <button class="btn ${UI.confirm === "reset" ? "danger" : "ghost"}" data-go="reset">${UI.confirm === "reset" ? "Click again to delete everything" : "Reset progress"}</button></section>`;
  }

  // ---------- render & navigation ----------
  const NAV_OF = { session: "today", lesson: "course", mock: "progress" };
  function render() {
    UI.items = {}; UI.explains = {};
    const v = S.view.name, views = { today: vToday, session: vSession, lesson: () => vLesson(S.view.l), course: vCourse, play: vPlay, progress: vProgress, mock: vMock, glossary: vGlossary, settings: vSettings };
    document.querySelectorAll("[data-nav]").forEach(b => { if (b.closest(".mainnav")) b.setAttribute("aria-current", String(b.dataset.nav === (NAV_OF[v] || v))); });
    document.getElementById("app").innerHTML = (views[v] || vToday)();
    if (v === "glossary") drawGloss();
  }
  const rerender = () => { const y = window.scrollY; render(); window.scrollTo(0, y); };
  const go = (name, extra = {}) => { S.view = Object.assign({ name }, extra); UI.confirm = null; UI.msg = ""; save(); render(); window.scrollTo(0, 0); };

  function itemAct(el) {
    const key = el.dataset.key, reg = UI.items[key]; if (!reg) return;
    const st = ist(key);
    if (!SAA.items.act(reg.item, key, st, el.dataset.act, el, reg.ctx)) return;
    if (st.done && !st.recorded && reg.onAnswer) { st.recorded = 1; reg.onAnswer(st.ok); }
    save(); rerender();
  }

  function doGo(el) {
    const d = el.dataset, a = d.go, s = S.session;
    switch (a) {
      case "session": return go("session");
      case "next": s.pos++; save(); return go(s.pos >= s.items.length ? "today" : "session");
      case "more-reviews": s.items.push(...SAA.moreReviews(S, today())); return go("session");
      case "more-lesson": { const next = SAA.nextLessons(S, 1)[0]; if (next) s.items.push({ k: "lesson", l: next }); return go("session"); }
      case "open-lesson": return go("lesson", { l: d.l, back: S.view.name === "session" ? "session" : undefined });
      case "back-session": return go("session");
      case "lstep": S.lessons[d.l].step = +d.s; save(); return rerender();
      case "ex-reveal": { const st = ist(d.key); if (String(st.text || "").trim().length < 15) { UI.exShort = d.key; return rerender(); } UI.exShort = null; st.revealed = true; save(); return rerender(); }
      case "ex-tick": { const st = ist(d.key), i = +d.i; st.ticks = el.checked ? [...new Set([...(st.ticks || []), i])] : (st.ticks || []).filter(x => x !== i); save(); return; }
      case "ex-save": {
        const st = ist(d.key), reg = UI.explains[d.key]; if (!reg || st.saved) return;
        st.saved = true; st.score = st.ticks.length / reg.l.explain.points.length; reg.onSave(st.score); save(); return rerender();
      }
      case "ex-copy": { const reg = UI.explains[d.key]; if (!reg) return; copy(claudePrompt(reg.l, ist(d.key))); UI.copied = d.key; return rerender(); }
      case "save-exam": {
        const v = document.getElementById("exam-date").value; if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return;
        S.settings.examDate = v; if (S.settings.startDay == null) S.settings.startDay = today(); save(); return rerender();
      }
      case "mock-start": { if (!SAA.mockAvailable(S, d.kind)) return; const m = SAA.buildMock(S, d.kind, today()); S.mocks.push(m); return go("mock", { id: m.id }); }
      case "mock-open": return go("mock", { id: d.id });
      case "mock-go": { const m = S.mocks.find(x => x.id === S.view.id); m.cur = Math.max(0, Math.min(m.items.length - 1, +d.i)); UI.confirm = null; save(); render(); return window.scrollTo(0, 0); }
      case "mock-flag": { const m = S.mocks.find(x => x.id === S.view.id); m.flag[m.cur] = !m.flag[m.cur]; save(); return rerender(); }
      case "mock-submit": {
        if (UI.confirm !== "submit") { UI.confirm = "submit"; return rerender(); }
        submitMock(S.mocks.find(x => x.id === S.view.id)); UI.confirm = null; save(); render(); return window.scrollTo(0, 0);
      }
      case "play-tab": UI.playTab = d.t; return rerender();
      case "chal-reset": { const k = `X|pol|${UI.playChal}`; delete S.ist[k]; delete P.inst[k]; save(); return rerender(); }
      case "chal-next": UI.playChal++; return rerender();
      case "netchal-reset": { const k = `X|net|${UI.playNetChal}`; delete S.ist[k]; delete SAA.tracer.inst[k]; save(); return rerender(); }
      case "netchal-next": UI.playNetChal++; return rerender();
      case "export": {
        const blob = new Blob([JSON.stringify(S)], { type: "application/json" }), a2 = document.createElement("a");
        a2.href = URL.createObjectURL(blob); a2.download = `saa-progress-${SAA.isoFromDay(today())}.json`; a2.click(); URL.revokeObjectURL(a2.href);
        UI.msg = "Backup downloaded."; return rerender();
      }
      case "import": return document.getElementById("importFile").click();
      case "day-plus": S.settings.dayOffset = (S.settings.dayOffset || 0) + 1; save(); return rerender();
      case "day-reset": S.settings.dayOffset = 0; save(); return rerender();
      case "reset": {
        if (UI.confirm !== "reset") { UI.confirm = "reset"; return rerender(); }
        S = SAA.newState(); save(); return go("today");
      }
    }
  }

  // ---------- events ----------
  document.addEventListener("click", e => {
    const nav = e.target.closest("[data-nav]"); if (nav) return go(nav.dataset.nav);
    const act = e.target.closest("[data-act]"); if (act && act.tagName !== "SELECT") return itemAct(act);
    const g = e.target.closest("[data-go]"); if (g && !g.disabled) return doGo(g);
  });
  document.addEventListener("change", e => {
    const t = e.target;
    if (t.matches("select[data-act]")) return itemAct(t);
    if (t.id === "play-net") { UI.playNet = t.value; return rerender(); }
    if (t.id === "play-pol") { UI.playPol = t.value; return rerender(); }
    if (t.id === "play-chal") { UI.playChal = +t.value; return rerender(); }
    if (t.id === "play-netchal") { UI.playNetChal = +t.value; return rerender(); }
    if (t.id === "importFile" && t.files[0]) {
      t.files[0].text().then(txt => {
        try { const s = JSON.parse(txt); if (!s || s.v !== 2) throw new Error("not a backup from this course"); S = Object.assign(SAA.newState(), s); S.view = { name: "settings" }; save(); UI.msg = "Progress imported."; }
        catch (err) { UI.msg = `Import failed: ${err.message}.`; }
        render();
      });
    }
  });
  document.addEventListener("input", e => {
    const t = e.target;
    if (t.dataset.fill !== undefined) { ist(t.dataset.fill).val = t.value; save(); }
    else if (t.dataset.ex !== undefined) { ist(t.dataset.ex).text = t.value; save(); }
    else if (t.id === "gsearch") { UI.gq = t.value; drawGloss(); }
  });
  document.addEventListener("keydown", e => {
    if (e.key !== "Enter") return;
    const t = e.target;
    if (t.dataset && t.dataset.fill !== undefined) { e.preventDefault(); const b = t.parentElement.querySelector('[data-act="check"]'); if (b) b.click(); }
    else if (t.getAttribute && t.getAttribute("role") === "button" && t.dataset.act) { e.preventDefault(); t.click(); }
  });

  setInterval(() => {
    if (!S || S.view.name !== "mock") return;
    const m = S.mocks.find(x => x.id === S.view.id); if (!m || m.done) return;
    if (m.start + m.min * 6e4 <= Date.now()) { submitMock(m); save(); render(); return; }
    const el = document.getElementById("mock-timer"); if (el) el.textContent = timerText(m);
  }, 1000);

  // ---------- start ----------
  SAA.index();
  S = SAA.load();
  if (S.view.name === "lesson" && !SAA.lessonById[S.view.l]) S.view = { name: "course" };
  render();
})(window.SAA);
