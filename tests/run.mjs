// Content and engine checks. Run: node tests/run.mjs
// Loads the same scripts as index.html (minus app.js) into a sandbox, validates every exercise,
// runs trace/policy exercises through the engines, and checks every fix exercise starts broken and is solvable.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve(import.meta.dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]).filter(s => !s.endsWith("app.js"));
const ctx = { console };
ctx.window = ctx;
vm.createContext(ctx);
for (const s of scripts) vm.runInContext(fs.readFileSync(path.join(root, s), "utf8"), ctx, { filename: s });
const { SAA } = ctx;
SAA.index();

const errs = [];
let checked = 0;
const err = (where, msg) => errs.push(`${where}: ${msg}`);
const clone = o => JSON.parse(JSON.stringify(o));
const oks = opts => opts.filter(o => o.ok).length;

function validItem(it, where) {
  checked++;
  const t = it.type;
  if (!SAA.items.types[t]) return err(where, `unknown type ${t}`);
  if (!it.q) err(where, "missing q");
  if (["mcq", "trace", "policy"].includes(t)) {
    if (!it.options || it.options.length < 3) err(where, "needs 3+ options");
    else if (oks(it.options) !== 1) err(where, `needs exactly 1 correct option, has ${oks(it.options)}`);
    (it.options || []).forEach((o, i) => { if (!o.why) err(where, `option ${i} has no why`); });
  }
  if (t === "multi") {
    if (oks(it.options) < 2 || oks(it.options) === it.options.length) err(where, "multi needs 2+ correct and 1+ wrong");
    it.options.forEach((o, i) => { if (!o.why) err(where, `option ${i} has no why`); });
  }
  if (t === "elim") {
    if (oks(it.options) !== 1) err(where, "elim needs exactly 1 correct option");
    it.options.forEach((o, i) => {
      if (o.ok && o.kills) err(where, `correct option ${i} has kills`);
      if (!o.ok && (!o.kills || !o.kills.length || o.kills.some(k => k < 0 || k >= it.reqs.length))) err(where, `option ${i} has invalid kills`);
    });
  }
  if (t === "spot") {
    if (it.rows.filter(r => r.bad).length !== 1) err(where, "spot needs exactly 1 bad row");
    if (it.cols) it.rows.forEach((r, i) => { if (r.cells.length !== it.cols.length) err(where, `row ${i} has ${r.cells.length} cells for ${it.cols.length} cols`); });
  }
  if (t === "order" && (!it.steps || it.steps.length < 3)) err(where, "order needs 3+ steps");
  if (t === "fill" && (!it.accept || !it.accept.length || !it.why)) err(where, "fill needs accept and why");
  if (t === "trace") {
    const r = SAA.tracer.run(it.net, it.flow);
    if ((r.ok ? "ok" : "blocked") !== it.expect) err(where, `trace expected ${it.expect}, engine says ${r.ok ? "ok" : "blocked"} (${r.hops.at(-1)?.label})`);
  }
  if (t === "policy") {
    const r = SAA.policy.evaluate(it.sc);
    if (r.decision !== it.expect) err(where, `policy expected ${it.expect}, engine says ${r.decision} (${r.reason})`);
  }
  if (t === "tracefix" || t === "where") {   // guided: step 1 from the engine, step 2 picks one of 4 real changes
    const d = SAA.tracer.diagnose(it.net, it.goals || []);
    if (t === "where" && !it.why) err(where, "where needs a why");
    if (!d.answer.length) err(where, "step 1 has no blocking checkpoint to find");
    if (it.focus) d.answer.forEach(at => { if (!it.focus.includes(at.split("|")[0])) err(where, `blocker ${at} is outside the map's focus`); });
    if (t === "where") { if (it.fixes) err(where, "where has no fixes (use tracefix)"); }
    else if (!it.fixes || it.fixes.length !== 4) err(where, "needs exactly 4 fixes");
    else {
      if (oks(it.fixes) !== 1) err(where, `needs exactly 1 correct fix, has ${oks(it.fixes)}`);
      it.fixes.forEach((f, i) => {
        if (!f.why) err(where, `fix ${i} has no why`);
        if (!f.ok && typeof f.apply !== "function") err(where, `wrong fix ${i} needs an apply()`);
        const fn = f.apply || it.solve; if (typeof fn !== "function") return;
        const n = clone(it.net); fn(n);
        const res = SAA.tracer.goals(n, it.goals);
        if (f.ok && res.some(g => !g.pass)) err(where, `correct fix ${i} doesn't pass every goal`);
        if (!f.ok && res.every(g => g.pass)) err(where, `wrong fix ${i} passes every goal; add the requirement it breaks as a goal`);
      });
    }
  }
  if (t === "gate" || t === "nexthop") {
    const hops = SAA.tracer.run(it.net, it.flow, { all: true }).hops.filter(h => h.at).map(h => h.at);
    if (!it.why) err(where, `${t} needs a why`);
    const key = t === "gate" ? it.at : it.after;
    if (!hops.includes(key)) err(where, `checkpoint ${key} isn't on the packet's trip (${hops.join(", ")})`);
    if (t === "nexthop" && new Set(hops).size < 4) err(where, "nexthop needs a trip with 4+ checkpoints for the options");
    if (t === "nexthop" && hops.indexOf(key) === hops.length - 1) err(where, "nexthop: nothing comes after that checkpoint");
  }
  if (t === "tracefix" || t === "policyfix") {
    const mod = t === "tracefix" ? SAA.tracer : SAA.policy, start = t === "tracefix" ? it.net : it.sc;
    if (!it.goals?.length || !it.why) err(where, "fix needs goals and why");
    if (mod.goals(start, it.goals).every(g => g.pass)) err(where, "fix exercise already passes before any change");
    if (typeof it.solve !== "function") err(where, "fix exercise needs a solve() for tests");
    else {
      const fixed = clone(start); it.solve(fixed);
      const res = mod.goals(fixed, it.goals);
      res.filter(g => !g.pass).forEach(g => err(where, `intended fix doesn't pass goal "${g.label}"`));
    }
  }
}

// Module 4+ follows the exam-style rules in docs/design.md ("Writing questions").
const EXAM_FROM = 4;
const words = s => String(s ?? "").replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
const textLen = s => String(s ?? "").replace(/<[^>]+>/g, "").length;
function examRules(m) {
  const items = [];
  for (const l of m.lessons) {
    const lw = `${m.id}/${l.id}`, exam = [];
    for (const c of l.concepts) {
      const cw = `${lw}/${c.id}`, lv = c.variants.map(v => v.level);
      if (lv.some(x => ![1, 2, 3].includes(x))) err(cw, "every variant needs level 1, 2 or 3");
      [1, 2, 3].forEach(x => { if (!lv.includes(x)) err(cw, `no level-${x} variant`); });
      if (lv[0] === 3) err(cw, "variant 0 is the lesson's Apply question; make it level 1 or 2");
      const first3 = c.variants.find(v => v.level === 3);
      if (first3) exam.push(first3);
      c.variants.filter(v => v.level === 3).forEach((v, i) => {
        const w = `${cw}/level3-${i}`;
        if (!["mcq", "multi"].includes(v.type)) err(w, "level 3 must be mcq or multi");
        if (words(v.q) < 50) err(w, `stem has ${words(v.q)} words; exam-style needs 50+`);
        if (!/\b(MOST|LEAST)\b|meets? (these|the) requirements/.test(v.q)) err(w, "stem needs a MOST/LEAST qualifier or \"meets these requirements\"");
        if (v.type === "mcq" && v.options.length !== 4) err(w, "exam mcq needs exactly 4 options");
        if (v.type === "multi" && (v.options.length < 5 || ![2, 3].includes(oks(v.options)))) err(w, "exam multi needs 5+ options with 2 or 3 correct");
      });
      items.push(...c.variants);
    }
    if (!exam.some(v => v.type === "multi")) err(lw, "lesson needs a multi among its exam-style questions");
  }
  const multi = items.filter(v => v.type === "multi").length;
  if (multi / items.length < 0.12) err(m.id, `only ${multi} of ${items.length} questions are multi; need 12%+`);
  const single = items.filter(v => ["mcq", "policy", "trace", "elim"].includes(v.type));
  const longest = single.filter(v => { const L = v.options.map(o => textLen(o.t)); return L[v.options.findIndex(o => o.ok)] === Math.max(...L); }).length;
  if (single.length && longest / single.length > 0.35) err(m.id, `correct answer is the longest option in ${longest} of ${single.length} questions; keep it at 35% or less`);
}

// ---------- content ----------
const seen = new Set();
for (const m of SAA.modules) {
  if (!SAA.catalog.find(c => c.num === m.num)) err(m.id, "not in catalog");
  for (const l of m.lessons) {
    const lw = `${m.id}/${l.id}`;
    if (seen.has(l.gid)) err(lw, "duplicate lesson id"); seen.add(l.gid);
    if (!l.body || !l.title) err(lw, "missing title/body");
    if (!l.explain || !l.explain.prompt || (l.explain.points || []).length < 2) err(lw, "explain needs a prompt and 2+ points");
    if (!l.concepts.length) err(lw, "no concepts");
    validItem(l.tryFirst, `${lw}/tryFirst`);
    (l.walk || []).forEach((w, i) => { if (!w.label || !w.flow || !SAA.tracer.run(w.net, w.flow).hops.length) err(`${lw}/walk${i}`, "walk needs label, net and flow"); });
    for (const c of l.concepts) {
      const cw = `${lw}/${c.id}`;
      if (seen.has(c.gid)) err(cw, "duplicate concept id"); seen.add(c.gid);
      if (!SAA.DOMAINS[c.domain]) err(cw, `bad domain ${c.domain}`);
      if (c.variants.length < 3) err(cw, `only ${c.variants.length} variants (need 3+)`);
      c.variants.forEach((v, i) => validItem(v, `${cw}/v${i}`));
    }
  }
}
SAA.modules.filter(m => m.num >= EXAM_FROM).forEach(examRules);
SAA.practice.policy.forEach((it, i) => validItem(it, `practice/policy/${i}`));
SAA.glossary.forEach((g, i) => { if (g.length !== 4) err("glossary", `entry ${i} malformed`); });

// ---------- engine sanity on the base network ----------
const base = SAA.nets.make("threeTier");
[["user", "web", 443, true], ["app", "internet", 443, true], ["app", "db", 5432, true], ["web", "db", 5432, false], ["user", "app", 8080, false], ["web", "app", 8080, true], ["app", "s3", 443, true], ["office", "web", 22, true], ["user", "web", 22, false]]
  .forEach(([from, to, port, want]) => { const r = SAA.tracer.run(base, { from, to, port }); if (r.ok !== want) err("tracer", `${from}->${to}:${port} expected ${want}, got ${r.ok} (${r.hops.at(-1)?.detail})`); });

// ---------- scheduler simulation ----------
const S = SAA.newState();
S.settings.examDate = "2026-12-17"; S.settings.startDay = SAA.dayFromISO("2026-10-26");
let day = S.settings.startDay;
const first = SAA.buildSession(S, day);
if (first.items.length !== 2 || first.items.some(x => x.k !== "lesson")) err("scheduler", "day 1 should be exactly 2 new lessons");
first.items.forEach(x => { const l = SAA.lessonById[x.l]; l.concepts.forEach(c => SAA.recordConcept(S, c.gid, 0, true, "lesson", day)); S.lessons[x.l] = { step: 4, done: true }; SAA.recordExplain(S, x.l, 1, day); });
day++;
const second = SAA.buildSession(S, day);
const rv = second.items.filter(x => x.k === "review");
if (rv.length !== first.items.reduce((n, x) => n + SAA.lessonById[x.l].concepts.length, 0)) err("scheduler", "day 2 should review every concept learned on day 1");
if (rv.some(x => x.v === 0)) err("scheduler", "reviews should not reuse the lesson's variant");
rv.forEach(x => SAA.recordConcept(S, x.g, x.v, true, "review", day));
const c0 = S.concepts[rv[0].g];
if (c0.due !== day + SAA.NEXT[1]) err("scheduler", `correct review should schedule +${SAA.NEXT[1]} days, got +${c0.due - day}`);
// a later correct review with another variant on another day makes it solid
SAA.recordConcept(S, rv[0].g, SAA.pickVariant(c0, SAA.conceptById[rv[0].g]), true, "review", day + 3);
if (SAA.conceptStatus(S.concepts[rv[0].g]) !== "solid") err("scheduler", "2 variants right on 2 days should be solid");
// due dates get capped before the exam
const late = SAA.dayFromISO("2026-12-10");
SAA.recordConcept(S, rv[1].g, 1, true, "review", late);
if (S.concepts[rv[1].g].due > SAA.dayFromISO("2026-12-15")) err("scheduler", "due dates should be capped at exam - 2");
// a big backlog holds back new lessons
const S2 = SAA.newState();
Object.keys(SAA.conceptById).slice(0, 30).forEach(g => SAA.recordConcept(S2, g, 0, false, "lesson", 100));
const s2 = SAA.buildSession(S2, 110);
if (s2.items.some(x => x.k === "lesson")) err("scheduler", "30 due reviews should hold back new lessons");
if (s2.items.filter(x => x.k === "review").length !== SAA.SESSION.reviews) err("scheduler", "session should cap reviews");
// mock building
SAA.modules.forEach(m => m.lessons.forEach(l => { S2.lessons[l.gid] = { done: true }; }));
const mock = SAA.buildMock(S2, "mini", 120);
if (mock.items.length !== SAA.MOCKS.mini.n) err("mocks", `mini mock has ${mock.items.length} items`);
if (mock.items.some(x => !SAA.MOCK_TYPES.includes(SAA.conceptById[x.g].variants[x.v].type))) err("mocks", "mock contains a non-exam item type");

// level ladder on a made-up leveled concept (modules 1-3 have no levels)
const lc = { variants: [1, 2, 2, 3, 3].map(level => ({ type: "mcq", level })) };
const lh = hist => ({ hist: hist.map(([v, ok, k = "review"], d) => ({ d, v, ok, k })), seen: {} });
const lvOf = c => lc.variants[SAA.pickVariant(c, lc)].level;
if (lvOf(lh([[0, true, "lesson"], [3, true, "lesson"]])) !== 2) err("ladder", "first review should be level 2");
if (lvOf(lh([[0, true, "lesson"], [1, true]])) !== 3) err("ladder", "a correct review should move up to level 3");
if (lvOf(lh([[0, true, "lesson"], [3, false]])) !== 1) err("ladder", "a miss should drop back to level 1");
if (lvOf(lh([[0, true, "lesson"], [3, false], [0, true]])) !== 2) err("ladder", "a correct answer after a miss should climb to level 2");
const lc3 = lh([[1, true], [3, true]]);
if (SAA.pickVariant(lc3, lc) !== 4) err("ladder", "at level 3, should not repeat the last variant");

// ---------- report ----------
const nConcepts = Object.keys(SAA.conceptById).length;
const nLessons = SAA.lessonOrder.length;
if (errs.length) { console.error(errs.map(e => "✗ " + e).join("\n")); console.error(`\n${errs.length} problem(s).`); process.exit(1); }
console.log(`✓ ${SAA.modules.length} modules, ${nLessons} lessons, ${nConcepts} concepts, ${checked} items checked; engines and scheduler OK.`);
