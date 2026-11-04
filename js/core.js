// Core: namespace, dates, storage, scheduling, readiness, pace, mocks. No DOM access, so tests can load it in Node.
window.SAA = window.SAA || {};
(function (SAA) {
  SAA.modules = [];   // built modules, pushed by content files
  SAA.catalog = [];   // all planned modules (content/catalog.js)
  SAA.glossary = [];
  SAA.addModule = m => SAA.modules.push(m);

  SAA.DOMAINS = {
    secure: { name: "Secure architectures", short: "Secure", weight: 30 },
    resilient: { name: "Resilient architectures", short: "Resilient", weight: 26 },
    performance: { name: "High-performing architectures", short: "High-performing", weight: 24 },
    cost: { name: "Cost-optimized architectures", short: "Cost", weight: 20 },
  };
  SAA.NEXT = [1, 3, 7, 14, 21, 30];            // days until the next review, by stage
  SAA.SESSION = { reviews: 10, explains: 1, newLessons: 2 };
  SAA.MOCKS = {
    mini: { n: 20, min: 40, label: "Mini mock", needModules: 3 },
    full: { n: 65, min: 130, label: "Full mock", needModules: Infinity },  // set to catalog length after load
  };
  SAA.MOCK_TYPES = ["mcq", "multi", "elim"];
  SAA.KEY = "saa-course-v2";

  SAA.shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // ---------- content index ----------
  SAA.index = () => {
    SAA.modules.sort((a, b) => a.num - b.num);
    SAA.lessonById = {}; SAA.conceptById = {}; SAA.lessonOrder = [];
    SAA.modules.forEach(m => m.lessons.forEach((l, li) => {
      l.gid = `${m.id}.${l.id}`; l.module = m; l.num = li + 1;
      SAA.lessonById[l.gid] = l; SAA.lessonOrder.push(l.gid);
      l.concepts.forEach(c => { c.gid = `${m.id}.${c.id}`; c.lesson = l; c.module = m; SAA.conceptById[c.gid] = c; });
    }));
    SAA.MOCKS.full.needModules = SAA.catalog.length || Infinity;
  };

  // ---------- dates (whole days since epoch, local calendar) ----------
  SAA.dayFromDate = d => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5);
  SAA.dayFromISO = s => { const [y, m, d] = s.split("-").map(Number); return Math.floor(Date.UTC(y, m - 1, d) / 864e5); };
  SAA.isoFromDay = n => new Date(n * 864e5).toISOString().slice(0, 10);
  SAA.fmtDay = n => new Date(n * 864e5).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
  SAA.today = S => SAA.dayFromDate(new Date()) + (S.settings.dayOffset || 0);

  // ---------- state ----------
  SAA.newState = () => ({
    v: 2,
    settings: { examDate: null, startDay: null, dayOffset: 0 },
    concepts: {},   // gid -> {stage, due, learned, hist:[{d,v,ok,k}], seen:{variant: day}}
    explains: {},   // lesson gid -> {stage, due, hist:[{d, score}]}
    lessons: {},    // lesson gid -> {step, done}
    ist: {},        // item UI state by key (answers), so reloads keep them
    session: null,
    mocks: [],
    activity: {},   // day -> {items, lessons}
    view: { name: "today" },
  });
  SAA.load = () => {
    try { const s = JSON.parse(localStorage.getItem(SAA.KEY)); if (s && s.v === 2) return Object.assign(SAA.newState(), s); } catch (e) { }
    return SAA.newState();
  };
  SAA.save = S => { try { localStorage.setItem(SAA.KEY, JSON.stringify(S)); } catch (e) { } };

  SAA.bump = (S, day, field) => { const a = S.activity[day] || (S.activity[day] = { items: 0, lessons: 0 }); a[field]++; };

  // ---------- scheduling ----------
  const examDay = S => S.settings.examDate ? SAA.dayFromISO(S.settings.examDate) : null;
  // Everything should come back once shortly before the exam.
  const capDue = (S, day, due) => { const e = examDay(S); if (e === null) return due; const last = e - 2; return day < last && due > last ? last : due; };

  SAA.recordConcept = (S, gid, v, ok, kind, day) => {
    let c = S.concepts[gid];
    if (!c) c = S.concepts[gid] = { stage: 0, due: day + 1, learned: day, hist: [], seen: {} };
    c.seen[v] = day;
    c.hist.push({ d: day, v, ok, k: kind });
    if (kind === "lesson") return;   // first contact only seeds the schedule
    if (ok) { c.stage = Math.min(c.stage + 1, SAA.NEXT.length - 1); c.due = capDue(S, day, day + SAA.NEXT[c.stage]); }
    else { c.stage = 0; c.due = day + 1; }
  };

  SAA.recordExplain = (S, lid, score, day) => {
    const full = score >= 1;
    let e = S.explains[lid];
    if (!e) { S.explains[lid] = { stage: 0, due: day + (full ? 3 : 1), hist: [{ d: day, score }] }; return; }
    e.hist.push({ d: day, score });
    // Explanations come back less often than concepts: they're slower to do.
    if (full) { e.stage = Math.min(e.stage + 1, SAA.NEXT.length - 1); e.due = capDue(S, day, day + SAA.NEXT[e.stage] + 2); }
    else { e.stage = Math.max(0, e.stage - 1); e.due = day + 1; }
  };

  SAA.dueConcepts = (S, day, ahead = 0) => Object.entries(S.concepts)
    .filter(([g, c]) => SAA.conceptById[g] && c.learned < day && c.due <= day + ahead)
    .map(([g, c]) => ({ g, c, pri: (day - c.due) / SAA.NEXT[c.stage] }))   // most overdue relative to its interval = most likely forgotten
    .sort((a, b) => b.pri - a.pri || a.c.stage - b.c.stage);

  // Avoid two items from the same lesson (or module, when possible) in a row.
  const interleave = list => {
    const out = [], rest = list.slice();
    const C = x => SAA.conceptById[x.g];
    while (rest.length) {
      const prev = out[out.length - 1];
      let i = rest.findIndex((x, j) => j < 4 && (!prev || C(x).module !== C(prev).module));
      if (i < 0) i = rest.findIndex((x, j) => j < 4 && (!prev || C(x).lesson !== C(prev).lesson));
      if (i < 0) i = 0;
      out.push(rest.splice(i, 1)[0]);
    }
    return out;
  };

  // Leveled concepts (variants with level 1-3: module 3 and 4+) climb: first review at level 2, each correct review one level up,
  // a miss drops back to 1 and climbs again from there.
  SAA.targetLevel = c => {
    const spaced = c.hist.filter(h => h.k !== "lesson");
    let streak = 0;
    for (let i = spaced.length - 1; i >= 0 && spaced[i].ok; i--) streak++;
    return Math.min(3, (streak < spaced.length ? 1 : 2) + streak);
  };

  SAA.pickVariant = (c, concept) => {
    const n = concept.variants.length, last = c.hist.length ? c.hist[c.hist.length - 1].v : -1;
    let allowed = null;
    if (concept.variants.some(it => it.level)) {
      const want = SAA.targetLevel(c), lv = v => concept.variants[v].level || 1;
      const usable = [...Array(n).keys()].filter(v => v !== last || n === 1);
      const dist = Math.min(...usable.map(v => Math.abs(lv(v) - want) + (lv(v) > want ? 0.5 : 0)));   // nearest level, lower on ties
      allowed = new Set(usable.filter(v => Math.abs(lv(v) - want) + (lv(v) > want ? 0.5 : 0) === dist));
    }
    let best = 0, bestSeen = Infinity;
    for (let v = 0; v < n; v++) {
      if (v === last && n > 1) continue;
      if (allowed && !allowed.has(v)) continue;
      const seen = c.seen[v] === undefined ? -1e9 : c.seen[v];
      if (seen < bestSeen) { best = v; bestSeen = seen; }
    }
    return best;
  };

  const toReview = list => interleave(list).map(x => ({ k: "review", g: x.g, v: SAA.pickVariant(x.c, SAA.conceptById[x.g]) }));

  SAA.nextLessons = (S, n) => SAA.lessonOrder.filter(g => !(S.lessons[g] && S.lessons[g].done)).slice(0, n);

  SAA.buildSession = (S, day) => {
    const due = SAA.dueConcepts(S, day);
    const reviews = toReview(due.slice(0, SAA.SESSION.reviews));
    const explains = Object.entries(S.explains)
      .filter(([l, e]) => SAA.lessonById[l] && e.due <= day)
      .sort((a, b) => a[1].due - b[1].due).slice(0, SAA.SESSION.explains)
      .map(([l]) => ({ k: "explain", l }));
    const left = due.length - reviews.length;
    const nNew = left > 15 ? 0 : left > 5 ? 1 : SAA.SESSION.newLessons;
    const lessons = SAA.nextLessons(S, nNew).map(l => ({ k: "lesson", l }));
    return { day, items: [...reviews, ...explains, ...lessons], pos: 0, res: {}, due: due.length, held: SAA.SESSION.newLessons - nNew };
  };

  SAA.moreReviews = (S, day) => {
    const list = SAA.dueConcepts(S, day, 2).filter(x => x.c.hist[x.c.hist.length - 1].d !== day).slice(0, SAA.SESSION.reviews);
    return toReview(list);
  };

  // ---------- readiness ----------
  SAA.STATUS = {
    new: { label: "Not started", score: 0 },
    learning: { label: "Learned, not reviewed yet", score: 0.25 },
    shaky: { label: "Missed last review", score: 0.15 },
    progress: { label: "Getting there", score: 0.6 },
    solid: { label: "Solid", score: 1 },
  };
  SAA.conceptStatus = c => {
    if (!c) return "new";
    const spaced = c.hist.filter(h => h.k !== "lesson" && h.d > c.learned);
    if (!spaced.length) return "learning";
    const last = spaced[spaced.length - 1];
    if (!last.ok) return "shaky";
    const okV = new Set(), okD = new Set();
    spaced.forEach(h => { if (h.ok) { okV.add(h.v); okD.add(h.d); } });
    return okV.size >= 2 && okD.size >= 2 ? "solid" : "progress";
  };

  SAA.coverage = S => {
    let total = 0, built = 0;
    SAA.catalog.forEach(m => {
      const b = SAA.modules.find(x => x.num === m.num);
      const n = b ? b.lessons.length : m.planned;
      total += n; if (b) built += n;
    });
    const done = SAA.lessonOrder.filter(g => S.lessons[g] && S.lessons[g].done).length;
    return { total, built, done };
  };

  SAA.readiness = S => {
    const dom = {};
    Object.keys(SAA.DOMAINS).forEach(k => dom[k] = { total: 0, score: 0, solid: 0, pct: 0 });
    Object.values(SAA.conceptById).forEach(c => {
      const st = SAA.conceptStatus(S.concepts[c.gid]), d = dom[c.domain];
      d.total++; d.score += SAA.STATUS[st].score; if (st === "solid") d.solid++;
    });
    let mastery = 0;
    Object.entries(dom).forEach(([k, d]) => { d.pct = d.total ? d.score / d.total : 0; mastery += d.pct * SAA.DOMAINS[k].weight / 100; });
    const cov = SAA.coverage(S);
    return { dom, mastery, overall: cov.total ? mastery * cov.built / cov.total : 0, cov };
  };

  // ---------- pace ----------
  SAA.pace = (S, day) => {
    const exam = examDay(S); if (exam === null) return null;
    const finish = exam - 7, start = S.settings.startDay ?? day;
    const { total, done } = SAA.coverage(S);
    const span = Math.max(1, finish - start + 1);
    const before = Math.min(span, Math.max(0, day - start));                // full days elapsed before today
    const expectedBefore = Math.floor(total * before / span);
    const daysLeft = Math.max(0, finish - day + 1);
    const studyDaysLeft = Math.max(1, Math.round(daysLeft * 5 / 7));
    return { exam, finish, total, done, behind: expectedBefore - done, perStudyDay: (total - done) / studyDaysLeft, daysToExam: exam - day, daysLeft };
  };

  // ---------- mocks ----------
  SAA.completedModules = S => SAA.modules.filter(m => m.lessons.every(l => S.lessons[l.gid] && S.lessons[l.gid].done));
  SAA.mockAvailable = (S, kind) => SAA.completedModules(S).length >= SAA.MOCKS[kind].needModules;

  SAA.buildMock = (S, kind, day) => {
    const cfg = SAA.MOCKS[kind], pool = [];
    SAA.completedModules(S).forEach(m => m.lessons.forEach(l => l.concepts.forEach(c => {
      const st = S.concepts[c.gid] || { seen: {} };
      const leveled = c.variants.some(it => it.level);
      const exam3 = leveled && c.variants.some(it => it.level === 3 && SAA.MOCK_TYPES.includes(it.type));   // no exam-type level 3 (e.g. only a fix question): use any exam-type variant
      const vs = c.variants.map((it, v) => ({ v, it })).filter(x => SAA.MOCK_TYPES.includes(x.it.type) && (!exam3 || x.it.level === 3));
      vs.sort((a, b) => (st.seen[a.v] ?? -1e9) - (st.seen[b.v] ?? -1e9));   // least recently seen first
      if (vs.length) pool.push({ g: c.gid, vs });
    })));
    const items = [], order = SAA.shuffle(pool);
    for (let round = 0; items.length < cfg.n && order.some(p => p.vs.length > round); round++)
      order.forEach(p => { if (items.length < cfg.n && p.vs[round]) items.push({ g: p.g, v: p.vs[round].v }); });
    return { id: String(Date.now()), kind, day, start: Date.now(), min: cfg.min, items: SAA.shuffle(items), cur: 0, flag: {}, done: false };
  };
})(window.SAA);
