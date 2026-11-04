// Policy evaluator: a simplified IAM evaluation (explicit deny → SCP → permissions boundary → identity/resource policies),
// close enough to AWS's logic for everything the SAA exam tests.
(function (SAA) {
  const esc = s => SAA.esc(s);
  const clone = o => JSON.parse(JSON.stringify(o));
  const arr = x => x === undefined ? [] : Array.isArray(x) ? x : [x];
  const wild = (pat, s, ci) => new RegExp("^" + String(pat).replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".") + "$", ci ? "i" : "").test(s);
  const { inCidr } = SAA.tracer.util;

  const P = SAA.policy = { inst: {} };
  P.KINDS = {
    scp: "Service control policy (SCP)",
    boundary: "Permissions boundary",
    identity: "Identity policy",
    resource: "Resource policy",
  };
  P.PRINCIPALS = {
    dana: { label: "IAM user dana", arn: "arn:aws:iam::111111111111:user/dana", account: "111111111111", org: "o-acme" },
    app: { label: "Role app-role", arn: "arn:aws:iam::111111111111:role/app-role", account: "111111111111", org: "o-acme" },
    auditor: { label: "Role auditor (other account)", arn: "arn:aws:iam::222222222222:role/auditor", account: "222222222222", org: "o-acme" },
    partner: { label: "Role partner-reader (outside the organization)", arn: "arn:aws:iam::333333333333:role/partner-reader", account: "333333333333", org: "o-other" },
  };

  // Scenario builder used by content: P.sc({principal, req, policies:[{kind, name, doc, on}]})
  P.sc = o => ({
    principal: o.principal || "dana",
    req: Object.assign({ action: "s3:GetObject", resource: "arn:aws:s3:::reports/q1.csv", resAccount: "111111111111", mfa: false, ip: "203.0.113.10", region: "eu-central-1" }, o.req || {}),
    policies: (o.policies || []).map(p => Object.assign({ on: true, name: P.KINDS[p.kind] }, p)),
  });
  P.doc = (...Statement) => ({ Version: "2012-10-17", Statement });

  // ---------- engine ----------
  const ctxOf = (pr, r) => ({
    "aws:multifactorauthpresent": r.mfa ? "true" : "false",
    "aws:sourceip": r.ip,
    "aws:requestedregion": r.region,
    "aws:principalaccount": pr.account,
    "aws:principalarn": pr.arn,
    "aws:principalorgid": pr.org,
    "aws:securetransport": "true",
  });

  const condOk = (cond, ctx) => {
    if (!cond) return { ok: true };
    for (const [opRaw, block] of Object.entries(cond)) {
      const ifExists = /IfExists$/.test(opRaw), op = opRaw.replace(/IfExists$/, "");
      for (const [kRaw, vals] of Object.entries(block)) {
        const k = kRaw.toLowerCase(), have = ctx[k];
        if (have === undefined) { if (ifExists) continue; return { ok: false, note: `unsupported key ${kRaw}` }; }
        const vs = arr(vals).map(String);
        let ok;
        switch (op) {
          case "Bool": ok = vs.some(v => v.toLowerCase() === have); break;
          case "StringEquals": case "ArnEquals": ok = vs.includes(have); break;
          case "StringNotEquals": case "ArnNotEquals": ok = !vs.includes(have); break;
          case "StringLike": case "ArnLike": ok = vs.some(v => wild(v, have)); break;
          case "StringNotLike": case "ArnNotLike": ok = !vs.some(v => wild(v, have)); break;
          case "StringEqualsIgnoreCase": ok = vs.some(v => v.toLowerCase() === have.toLowerCase()); break;
          case "IpAddress": ok = vs.some(v => inCidr(v.includes("/") ? v : v + "/32", have)); break;
          case "NotIpAddress": ok = !vs.some(v => inCidr(v.includes("/") ? v : v + "/32", have)); break;
          default: return { ok: false, note: `unsupported operator ${opRaw}` };
        }
        if (!ok) return { ok: false };
      }
    }
    return { ok: true };
  };

  // Returns null if the statement doesn't apply, else {who:"direct"|"account"|null}.
  const stmtApplies = (st, kind, pr, r, ctx) => {
    const acts = st.Action !== undefined ? arr(st.Action).some(a => wild(a, r.action, true)) : st.NotAction !== undefined ? !arr(st.NotAction).some(a => wild(a, r.action, true)) : false;
    if (!acts) return null;
    const resList = st.Resource !== undefined ? st.Resource : st.NotResource !== undefined ? null : (kind === "scp" ? "*" : undefined);
    const res = resList === null ? !arr(st.NotResource).some(x => wild(x, r.resource)) : resList !== undefined && arr(resList).some(x => wild(x, r.resource));
    if (!res) return null;
    let who = null;
    if (kind === "resource") {
      const p = st.Principal;
      const list = p === "*" ? ["*"] : p && p.AWS !== undefined ? arr(p.AWS) : [];
      for (const x of list) {
        if (x === "*" || x === pr.arn || (String(x).includes("*") && wild(x, pr.arn))) { who = "direct"; break; }
        if (x === pr.account || x === `arn:aws:iam::${pr.account}:root`) who = "account";
      }
      if (!who) return null;
    }
    if (!condOk(st.Condition, ctx).ok) return null;
    return { who };
  };

  P.evaluate = sc => {
    const pr = P.PRINCIPALS[sc.principal], r = sc.req, ctx = ctxOf(pr, r);
    const hits = [];   // {pi, si, kind, effect, sid, who}
    sc.policies.forEach((p, pi) => {
      if (p.on === false || !p.doc) return;
      arr(p.doc.Statement).forEach((st, si) => {
        const m = stmtApplies(st, p.kind, pr, r, ctx);
        if (m) hits.push({ pi, si, kind: p.kind, effect: st.Effect, sid: st.Sid || `statement ${si + 1}`, who: m.who, name: p.name });
      });
    });
    const has = kind => sc.policies.some(p => p.kind === kind && p.on !== false && p.doc);
    const allow = kind => hits.filter(h => h.kind === kind && h.effect === "Allow");
    const steps = [];
    const out = (decision, reason) => ({ decision, reason, steps, hits });
    const cite = h => `${h.name} → ${h.sid}`;

    const denies = hits.filter(h => h.effect === "Deny");
    steps.push({ ok: !denies.length, label: "1. Any explicit Deny?", detail: denies.length ? `Yes: ${denies.map(cite).join("; ")}. An explicit Deny beats every Allow.` : "No statement explicitly denies this request." });
    if (denies.length) return out("deny", `Explicit deny in ${cite(denies[0])}.`);

    if (has("scp")) {
      const a = allow("scp");
      steps.push({ ok: !!a.length, label: "2. Does the SCP allow it?", detail: a.length ? `Yes: ${a.map(cite).join("; ")}. (SCPs don't grant anything, they only set the maximum.)` : "No. The SCP sets the maximum permissions for the account, and this action is outside it." });
      if (!a.length) return out("deny", "Implicit deny: the SCP doesn't allow it.");
    } else steps.push({ ok: true, label: "2. SCP", detail: "No SCP in this scenario." });

    const same = pr.account === r.resAccount;
    const idA = allow("identity"), resA = allow("resource");
    const direct = resA.some(h => h.who === "direct"), anyRes = resA.length > 0;
    let bOk = true;
    if (has("boundary")) {
      const b = allow("boundary"); bOk = !!b.length;
      steps.push({ ok: bOk, label: "3. Inside the permissions boundary?", detail: bOk ? `Yes: ${b.map(cite).join("; ")}.` : "No. The boundary caps what identity policies can grant, so identity-policy allows don't count." });
    } else steps.push({ ok: true, label: "3. Permissions boundary", detail: "None attached." });
    steps.push({ ok: !!idA.length, label: "4. Does an identity policy allow it?", detail: idA.length ? `Yes: ${idA.map(cite).join("; ")}.` : "No identity policy allows it." });
    steps.push({ ok: anyRes, label: "5. Does a resource policy allow it?", detail: !has("resource") ? "No resource policy in this scenario." : anyRes ? `Yes: ${resA.map(cite).join("; ")}${resA.every(h => h.who === "account") ? " (it names the whole account, so the principal's own identity policy must also allow it)" : ""}.` : "No statement in the resource policy matches this principal and action." });
    const idOk = idA.length > 0 && bOk;

    if (same) {
      steps.push({ ok: true, label: "6. Same account", detail: "Within one account, an Allow from either an identity policy (inside any boundary) or a resource policy that names the principal is enough." });
      if (direct) return out("allow", "Allowed: the resource policy grants it to this principal directly.");
      if (idOk) return out("allow", "Allowed by the identity policy.");
      return out("deny", idA.length && !bOk ? "Implicit deny: the identity policy allows it, but the permissions boundary doesn't." : "Implicit deny: nothing allows it, and everything is denied by default.");
    }
    steps.push({ ok: true, label: "6. Cross-account", detail: `The principal is in account ${pr.account}, the resource in ${r.resAccount}. Cross-account access needs BOTH sides: the principal's own policies must allow it, and the resource policy must allow the principal (or its account).` });
    if (idOk && anyRes) return out("allow", "Allowed: both the identity side and the resource side allow it.");
    if (!anyRes) return out("deny", "Implicit deny: the resource's account doesn't allow it (no matching resource policy).");
    return out("deny", idA.length && !bOk ? "Implicit deny: the permissions boundary doesn't allow it." : "Implicit deny: the principal's own account doesn't allow it (no identity policy).");
  };

  // Goals: {label, req:{...overrides}, expect:"allow"|"deny", principal?}
  P.goals = (sc, goals) => goals.map(g => {
    const r = P.evaluate(Object.assign({}, sc, { principal: g.principal || sc.principal, req: Object.assign({}, sc.req, g.req) }));
    return { ...g, pass: r.decision === g.expect, res: r };
  });

  // ---------- UI ----------
  const domId = key => "pe-" + String(key).replace(/[^\w-]/g, "_");
  P.mount = (key, sc) => {
    let I = P.inst[key];
    if (!I) {
      I = P.inst[key] = { orig: clone(sc), sc: clone(sc), texts: sc.policies.map(p => JSON.stringify(p.doc, null, 2)), errs: [] };
      I.res = P.evaluate(I.sc);
    }
    return `<div class="pe" id="${domId(key)}" data-pek="${esc(key)}">${inner(I)}</div>`;
  };
  // Read-only scenario (request + policies, no verdict) shown with predict questions before they're answered.
  P.view = sc => {
    const r = sc.req, pr = P.PRINCIPALS[sc.principal];
    const reqRows = [["Action", r.action], ["Resource", r.resource], ["Region", r.region], ["Source IP", r.ip], ["MFA", r.mfa ? "yes" : "no"]];
    if (r.resAccount !== pr.account) reqRows.push(["Resource's account", r.resAccount]);
    return `<div class="pe pe-view"><div class="pe-req"><div class="pe-who"><span class="muted small">Who</span> <strong>${esc(pr.label)}</strong></div>
      <div class="pe-grid">${reqRows.map(([k, v]) => `<div class="pe-f"><span>${k}</span><code>${esc(v)}</code></div>`).join("")}</div></div>
      ${sc.policies.filter(p => p.on !== false).map(p => `<div class="pe-pol ${p.kind}"><div class="pe-ph"><span class="pe-kind">${esc(P.KINDS[p.kind])}</span>${p.name !== P.KINDS[p.kind] ? ` <strong>${esc(p.name)}</strong>` : ""}</div>
        <pre class="code">${esc(JSON.stringify(p.doc, null, 2))}</pre></div>`).join("")}</div>`;
  };
  const refresh = key => { const el = document.getElementById(domId(key)); if (el) el.innerHTML = inner(P.inst[key]); };

  function inner(I) {
    const sc = I.sc, r = sc.req, pr = P.PRINCIPALS[sc.principal], hitSet = new Set(I.res.hits.map(h => `${h.pi}.${h.si}`));
    const field = (k, label, extra = "") => `<label class="pe-f"><span>${label}</span><input class="mini" data-pe="req" data-k="${k}" value="${esc(r[k])}" ${extra}></label>`;
    const req = `<div class="pe-req"><div class="pe-who"><span class="muted small">Who</span> <strong>${esc(pr.label)}</strong> <code class="small">${esc(pr.arn)}</code></div>
      <div class="pe-grid">${field("action", "Action")}${field("resource", "Resource ARN")}${field("resAccount", "Resource's account")}${field("ip", "Source IP")}${field("region", "Region")}
      <label class="tog pe-f"><input type="checkbox" data-pe="mfa" ${r.mfa ? "checked" : ""}> Signed in with MFA</label></div></div>`;
    const pols = sc.policies.map((p, i) => {
      const lines = arr(p.doc && p.doc.Statement).map((st, si) => hitSet.has(`${i}.${si}`) ? `<li class="${st.Effect === "Deny" ? "bad" : "ok"}">${esc(st.Sid || `statement ${si + 1}`)}: matches (${esc(st.Effect)})</li>` : "").join("");
      return `<div class="pe-pol ${p.kind} ${p.on === false ? "off" : ""}"><div class="pe-ph"><span class="pe-kind">${esc(P.KINDS[p.kind])}</span>${p.name !== P.KINDS[p.kind] ? ` <strong>${esc(p.name)}</strong>` : ""}
        ${p.kind === "identity" ? "" : `<label class="tog"><input type="checkbox" data-pe="on" data-i="${i}" ${p.on !== false ? "checked" : ""}> in effect</label>`}</div>
        <textarea class="code" data-pe="doc" data-i="${i}" rows="${Math.min(18, (I.texts[i].match(/\n/g) || []).length + 2)}" spellcheck="false" aria-label="Policy JSON">${esc(I.texts[i])}</textarea>
        ${I.errs[i] ? `<div class="pe-err">JSON error: ${esc(I.errs[i])}</div>` : ""}${lines ? `<ul class="pe-hits">${lines}</ul>` : ""}</div>`;
    }).join("");
    const res = I.res;
    return `${req}<div class="pe-pols">${pols}</div>
      <div class="flowbar"><button class="btn small" data-pe="run">Evaluate</button><button class="btn ghost small" data-pe="reset">Reset</button><span class="muted small">Edits apply when you click outside the box.</span></div>
      <div class="trace-res ${res.decision === "allow" ? "ok" : "bad"}"><div class="trace-verdict">${res.decision === "allow" ? "✓ Allowed" : "✗ Denied"}</div><p class="small">${esc(res.reason)}</p>
      <ol class="hops">${res.steps.map(s => `<li class="${s.ok ? "ok" : "bad"}"><span class="hm">${s.ok ? "✓" : "✗"}</span><div><strong>${esc(s.label)}</strong><div class="small">${esc(s.detail)}</div></div></li>`).join("")}</ol></div>`;
  }

  function apply(I, el) {
    const d = el.dataset, a = d.pe;
    if (a === "reset") { I.sc = clone(I.orig); I.texts = I.sc.policies.map(p => JSON.stringify(p.doc, null, 2)); I.errs = []; }
    else if (a === "req") I.sc.req[d.k] = el.value.trim();
    else if (a === "mfa") I.sc.req.mfa = el.checked;
    else if (a === "on") I.sc.policies[+d.i].on = el.checked;
    else if (a === "doc") {
      I.texts[+d.i] = el.value;
      try { I.sc.policies[+d.i].doc = JSON.parse(el.value); I.errs[+d.i] = null; } catch (e) { I.errs[+d.i] = e.message; }
    }
    I.res = P.evaluate(I.sc);
  }

  if (typeof document !== "undefined") {
    const handle = e => {
      const el = e.target.closest("[data-pe]"); if (!el) return;
      if ((e.type === "click") !== (el.tagName === "BUTTON")) return;
      const box = el.closest("[data-pek]"); const I = box && P.inst[box.dataset.pek]; if (!I) return;
      apply(I, el); refresh(box.dataset.pek);
    };
    document.addEventListener("click", handle);
    document.addEventListener("change", handle);
  }
})(window.SAA);
