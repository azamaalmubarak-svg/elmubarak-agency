/* ELMUBARAK Clarity Scan — interface. Renders one screen at a time from the data + engine modules.
   Views (URL hash): #intro · #q1…#qN · #result · #report. Only answer ids are kept, in sessionStorage. */
(function () {
  "use strict";
  var ELM = window.ELM;
  var C = ELM.config, D = ELM.clarity.data, E = ELM.clarity.engine, I18N = ELM.i18n;
  var EV = C.analytics.events;
  var COPY = D.copy;
  var N = D.questions.length;
  var NS = "http://www.w3.org/2000/svg";

  var root, reportRoot, live;
  var state = { answers: {}, unlocked: false, prepared: null, started: false, draft: {}, result: null, notice: null };

  /* ---------- helpers ---------- */
  function lang() { return I18N.lang(); }
  function t(obj) { return obj ? obj[lang()] : ""; }
  function fmt(s, i) { return s.replace("{i}", i).replace("{n}", N); }

  function el(tag, attrs, kids) {
    var node = document.createElement(tag);
    attrs = attrs || {};
    Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === false || v == null) return;
      if (k === "class") node.className = v;
      else if (k === "text") node.textContent = v;
      else if (k.slice(0, 2) === "on") node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? "" : v);
    });
    (kids || []).forEach(function (kid) { if (kid) node.appendChild(typeof kid === "string" ? document.createTextNode(kid) : kid); });
    return node;
  }
  function svg(tag, attrs) {
    var node = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    return node;
  }
  function empty(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function reducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  function dimById(id) {
    for (var i = 0; i < D.dimensions.length; i++) if (D.dimensions[i].id === id) return D.dimensions[i];
    return null;
  }
  function dimName(id) { var d = dimById(id); return d ? t(d) : ""; }
  function constraintName(id) { var d = dimById(id); return d ? (lang() === "ar" ? d.constraintAr : d.constraintEn) : ""; }
  function announce(msg) { if (live) live.textContent = msg || ""; }

  /* ---------- persistence ---------- */
  function load() {
    try {
      var raw = sessionStorage.getItem(C.scan.storageKey);
      if (!raw) return;
      var o = JSON.parse(raw);
      if (!o || o.v !== C.scan.version) return;
      D.questions.forEach(function (q) {
        var a = o.answers && o.answers[q.id];
        if (a && E.findOption(q, a)) state.answers[q.id] = a;
      });
      state.unlocked = !!o.unlocked;
      state.prepared = typeof o.prepared === "string" ? o.prepared : null;
      state.started = !!o.started;
    } catch (e) { /* ignore corrupt state */ }
  }
  function save() {
    try {
      sessionStorage.setItem(C.scan.storageKey, JSON.stringify({
        v: C.scan.version, answers: state.answers, unlocked: state.unlocked, prepared: state.prepared, started: state.started
      }));
    } catch (e) { /* storage unavailable: the scan still works for this page view */ }
  }
  function reset() {
    state.answers = {}; state.unlocked = false; state.prepared = null; state.started = false;
    state.draft = {}; state.result = null; state.notice = null;
    try { sessionStorage.removeItem(C.scan.storageKey); } catch (e) { /* noop */ }
  }

  /* ---------- routing ---------- */
  function parseHash() {
    var h = (location.hash || "").replace("#", "");
    var m = /^q(\d+)$/.exec(h);
    if (m) { var i = parseInt(m[1], 10) - 1; if (i >= 0 && i < N) return { view: "q", index: i }; }
    if (h === "result") return { view: "result" };
    if (h === "report") return { view: "report" };
    return { view: "intro" };
  }
  function go(hash, replace) {
    var target = "#" + hash;
    if (replace) {
      history.replaceState(null, "", target);
      route();
    } else if (location.hash === target) {
      route();
    } else {
      location.hash = hash;
    }
  }
  function firstUnanswered() {
    var miss = E.missing(state.answers);
    return miss.length ? miss[0] : N;
  }

  function route() {
    var r = parseHash();
    var first = firstUnanswered();

    if (r.view === "q" && r.index > first) {
      return first >= N ? go("result", true) : go("q" + (first + 1), true);
    }
    if ((r.view === "result" || r.view === "report") && first < N) return go("q" + (first + 1), true);
    if (r.view === "report" && !state.unlocked) return go("result", true);

    document.body.setAttribute("data-scan-view", r.view);
    root.setAttribute("data-view", r.view);
    reportRoot.hidden = r.view !== "report";
    root.hidden = r.view === "report";

    try {
      if (r.view === "intro") renderIntro();
      else if (r.view === "q") renderQuestion(r.index);
      else if (r.view === "result") renderResult();
      else renderReport();
    } catch (e) {
      if (window.console) console.error(e);
      renderFailure();
    }
  }

  function enter(card, focusEl) {
    if (state.quiet) return;
    card.classList.add("is-entering");
    if (focusEl) {
      focusEl.setAttribute("tabindex", "-1");
      try { focusEl.focus({ preventScroll: true }); } catch (e) { focusEl.focus(); }
    }
    var box = root.getBoundingClientRect();
    if (box.top < 0 || box.top > window.innerHeight * 0.6) {
      root.scrollIntoView({ block: "start", behavior: reducedMotion() ? "auto" : "smooth" });
    }
  }

  function button(cls, label, handler, attrs) {
    return el("button", Object.assign({ type: "button", class: "btn " + cls, text: label, onclick: handler }, attrs || {}));
  }

  /* ---------- intro ---------- */
  function hasProgress() { return Object.keys(state.answers).length > 0; }

  function start() {
    if (!hasProgress()) {
      state.started = true; save();
      ELM.analytics.track(EV.started, { version: D.version });
    }
    var first = firstUnanswered();
    go(first >= N ? "result" : "q" + (first + 1));
  }

  function renderIntro() {
    empty(root);
    var resume = hasProgress();
    var card = el("div", { class: "scan-card" }, [
      el("h2", { class: "scan-h", id: "introTitle", text: t(COPY.introHeading) }),
      el("p", { class: "scan-meta", text: fmt(t(COPY.introMeta), 0) }),
      el("ul", { class: "scan-points" }, COPY.introPoints.map(function (p) { return el("li", { text: t(p) }); })),
      el("div", { class: "scan-actions" }, [
        button("btn-primary", resume ? t(COPY.resume) : t(C.cta.discoverFingerprint), start, { id: "startBtn" }),
        resume ? button("btn-ghost", t(COPY.restart), function () { reset(); go("intro", true); }) : null
      ])
    ]);
    root.appendChild(card);
    enter(card, null);
  }

  /* ---------- questions ---------- */
  function renderQuestion(i) {
    empty(root);
    var q = D.questions[i];
    var selected = state.answers[q.id] || null;
    var pct = Math.round(((i + 1) / N) * 100);
    var label = fmt(t(COPY.questionLabel), i + 1);

    var title = el("h2", { class: "q-title", id: "qTitle", text: t(q) });
    var nextBtn = button("btn-primary", i === N - 1 ? t(COPY.seeResult) : t(COPY.next), function () { next(i); }, { id: "nextBtn" });
    if (!selected) nextBtn.disabled = true;

    var group = el("div", { class: "opts", role: "radiogroup", "aria-labelledby": "qTitle" });
    q.options.forEach(function (opt, idx) {
      var input = el("input", { type: "radio", name: "q_" + q.id, value: opt.id, id: "o_" + q.id + "_" + idx });
      var row = el("label", { class: "opt" + (selected === opt.id ? " is-selected" : ""), for: input.id }, [
        input, el("span", { class: "opt-mark", "aria-hidden": "true" }), el("span", { class: "opt-text", text: t(opt) })
      ]);
      if (selected === opt.id) input.checked = true;
      input.addEventListener("change", function () {
        state.answers[q.id] = opt.id; save();
        Array.prototype.forEach.call(group.children, function (c) { c.classList.remove("is-selected"); });
        row.classList.add("is-selected");
        nextBtn.disabled = false;
        ELM.analytics.track(EV.answered, { question: q.id, index: i + 1 });
      });
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !nextBtn.disabled) { e.preventDefault(); next(i); }
      });
      group.appendChild(row);
    });

    var card = el("div", { class: "scan-card" }, [
      el("div", { class: "scan-top" }, [
        el("p", { class: "scan-count", text: label }),
        el("div", { class: "progress", role: "progressbar", "aria-label": label, "aria-valuemin": "1", "aria-valuemax": String(N), "aria-valuenow": String(i + 1) }, [
          el("span", { style: "width:" + pct + "%" })
        ])
      ]),
      title,
      q.hintAr ? el("p", { class: "q-hint", text: lang() === "ar" ? q.hintAr : q.hintEn }) : null,
      group,
      el("div", { class: "scan-nav" }, [
        button("btn-ghost", t(COPY.back), function () { go(i === 0 ? "intro" : "q" + i); }),
        nextBtn
      ])
    ]);
    root.appendChild(card);
    enter(card, title);
  }

  function next(i) {
    var q = D.questions[i];
    if (!state.answers[q.id]) return;
    if (i < N - 1) return go("q" + (i + 2));
    state.result = E.evaluate(state.answers);
    ELM.analytics.track(EV.completed, { primary: state.result.primary || "none", version: D.version });
    go("result");
  }

  /* ---------- fingerprint ---------- */
  var FRACTION = { strong: 0.88, stable: 0.68, attention: 0.5, priority: 0.3, sketch: 0.55, unknown: 1 };

  function buildFingerprint(res, mode, animate) {
    var s = svg("svg", { viewBox: "0 0 240 240", class: "fp" + (animate ? " animate" : ""), "aria-hidden": "true", focusable: "false" });
    D.dimensions.forEach(function (d, i) {
      var r = 110 - i * 11;
      var circ = 2 * Math.PI * r;
      var lvl = mode === "partial" ? (d.id === res.primary ? "priority" : "sketch") : res.dims[d.id].level;
      var len = FRACTION[lvl] * circ;
      var rot = "rotate(" + (-90 + i * 41) + " 120 120)";
      if (lvl === "priority") {
        var halo = svg("circle", { cx: 120, cy: 120, r: r, fill: "none", class: "ring-halo", transform: rot });
        halo.setAttribute("stroke-dasharray", len + " " + (circ - len));
        s.appendChild(halo);
      }
      var c = svg("circle", { cx: 120, cy: 120, r: r, fill: "none", class: "ring lv-" + lvl, transform: rot });
      if (lvl !== "unknown") c.setAttribute("stroke-dasharray", len + " " + (circ - len));
      c.style.setProperty("--circ", circ);
      c.style.setProperty("--len", len);
      c.style.setProperty("--delay", (i * 60) + "ms");
      s.appendChild(c);
    });
    return s;
  }

  function levelText(id) { return t(D.levels[id]); }

  function legend(res) {
    return el("ul", { class: "legend" }, D.dimensions.map(function (d) {
      var lvl = res.dims[d.id].level;
      return el("li", { class: "legend-row" }, [
        el("span", { class: "sw lv-" + lvl, "aria-hidden": "true" }),
        el("span", { class: "legend-name", text: t(d) }),
        el("b", { class: "legend-level", text: levelText(lvl) })
      ]);
    }));
  }

  /* ---------- result ---------- */
  function block(label, body, cls) {
    return el("div", { class: "res-block" + (cls ? " " + cls : "") }, [
      el("p", { class: "res-label", text: label }), body
    ]);
  }
  function para(text) { return el("p", { class: "res-text", text: text }); }

  function recFor(res) { return res.primary ? D.recommendations[res.primary] : D.noConstraint; }

  function renderResult() {
    empty(root);
    var res = state.result = E.evaluate(state.answers);
    var rec = recFor(res);
    var full = state.unlocked;
    var primaryName = res.primary ? constraintName(res.primary) : t(D.noConstraint.label);

    var title = el("h2", { class: "scan-h", id: "resTitle", text: t(COPY.resultTitle) });

    var main = el("div", { class: "res-main" }, [
      block(t(COPY.primary), el("p", { class: "res-primary", text: primaryName }), "is-primary"),
      block(t(COPY.meaning), para(t(rec.meaning))),
      res.insight ? block(t(COPY.reading), el("p", { class: "res-quote", text: t(res.insight) })) : null,
      block(t(COPY.nextStep), para(t(rec.next)))
    ]);

    if (full) {
      main.appendChild(block(t(COPY.secondary), para(res.secondary ? constraintName(res.secondary) : t(COPY.noSecondary))));
      main.appendChild(block(t(COPY.strongest), para(res.strongest ? constraintName(res.strongest) : t(COPY.noStrongest))));
      main.appendChild(block(t(COPY.priority), para(t(rec.priority))));
      if (res.tier && D.tiers[res.tier]) main.appendChild(block(t(COPY.tierHint), para(t(D.tiers[res.tier]))));
    }

    var side = el("div", { class: "res-side" }, [
      el("p", { class: "res-label", text: t(COPY.fingerprint) }),
      el("div", { class: "fp-wrap" }, [buildFingerprint(res, full ? "full" : "partial", !reducedMotion())]),
      full ? el("div", null, [el("p", { class: "res-label", text: t(COPY.legendTitle) }), legend(res)])
           : el("p", { class: "fp-note", text: t(COPY.fingerprintPartial) })
    ]);

    var card = el("div", { class: "scan-card scan-result" }, [
      title,
      el("p", { class: "scan-meta", text: t(COPY.resultSub) }),
      state.notice ? el("p", { class: "notice notice-" + state.notice.kind, role: "status", text: state.notice.text }) : null,
      el("div", { class: "res-grid" }, [main, side]),
      full ? actions(res) : leadCard(res),
      el("p", { class: "disclaimer", text: t(COPY.disclaimer) })
    ]);
    root.appendChild(card);
    state.notice = null;
    enter(card, title);
    announce(t(COPY.resultTitle) + ": " + primaryName);
  }

  function actions(res) {
    var wa = el("a", { class: "btn btn-ghost", href: ELM.contact.whatsappUrl("scan"), target: "_blank", rel: "noopener", text: t(C.cta.talk) });
    wa.addEventListener("click", function () { ELM.analytics.track(EV.whatsappClicked, { source: "result" }); });
    return el("div", { class: "res-actions" }, [
      el("p", { class: "res-text", text: t(COPY.ctaFull) }),
      el("div", { class: "scan-actions" }, [
        el("a", { class: "btn btn-primary", href: "/#contact", text: t(C.cta.requestDiagnostic) }),
        wa,
        button("btn-ghost", t(COPY.report), function () { go("report"); }),
        button("btn-ghost", t(COPY.share), shareResult),
        button("btn-quiet", t(COPY.restart), function () { reset(); go("intro", true); })
      ])
    ]);
  }

  /* ---------- lead capture ---------- */
  function field(id, label, opts) {
    opts = opts || {};
    var input = opts.textarea
      ? el("textarea", { id: id, name: id, rows: "3", autocomplete: "off" })
      : el("input", { id: id, name: id, type: opts.type || "text", autocomplete: opts.autocomplete || "off", inputmode: opts.inputmode, dir: opts.dir });
    input.value = state.draft[id] || "";
    input.addEventListener("input", function () { state.draft[id] = input.value; });
    return el("div", { class: "fld" }, [
      el("label", { for: id }, [el("span", { text: label })]),
      input,
      el("p", { class: "err", id: "err_" + id, role: "alert", hidden: true })
    ]);
  }

  function leadCard(res) {
    var status = el("p", { class: "formmsg", id: "leadStatus", role: "status", hidden: true });
    var submit = el("button", { type: "submit", class: "btn btn-primary", text: t(COPY.keep) });
    var honeypot = el("p", { class: "hp", "aria-hidden": "true" }, [
      el("label", null, ["Do not fill", el("input", { name: "bot-field", tabindex: "-1", autocomplete: "off" })])
    ]);
    var form = el("form", { class: "lead-form", novalidate: true, id: "leadForm" }, [
      field("name", t(COPY.fName), { autocomplete: "name" }),
      field("business", t(COPY.fBusiness), { autocomplete: "organization" }),
      field("whatsapp", t(COPY.fWhatsapp), { type: "tel", autocomplete: "tel", inputmode: "tel", dir: "ltr" }),
      field("email", t(COPY.fEmail), { type: "email", autocomplete: "email", inputmode: "email", dir: "ltr" }),
      el("p", { class: "fld-note", text: t(COPY.contactNote) }),
      field("goal", t(COPY.fGoal), { textarea: true }),
      honeypot,
      el("p", { class: "fld-note", text: t(COPY.privacy) }),
      el("div", { class: "scan-actions" }, [
        submit,
        button("btn-quiet", t(COPY.skip), function () { state.unlocked = true; save(); go("result", true); })
      ]),
      status
    ]);
    form.addEventListener("submit", function (e) { e.preventDefault(); submitLead(form, submit, status, res); });
    return el("div", { class: "lead-card" }, [
      el("h3", { text: t(COPY.leadTitle) }),
      el("p", { class: "res-text", text: t(COPY.leadText) }),
      form
    ]);
  }

  function showErr(id, msg) {
    var p = document.getElementById("err_" + id), inp = document.getElementById(id);
    if (!p) return;
    p.hidden = !msg; p.textContent = msg || "";
    if (inp) { if (msg) inp.setAttribute("aria-invalid", "true"); else inp.removeAttribute("aria-invalid"); }
  }

  function validateLead(v) {
    var errors = {};
    if (!v.name) errors.name = t(COPY.errName);
    if (!v.business) errors.business = t(COPY.errBusiness);
    if (!v.whatsapp && !v.email) { errors.whatsapp = t(COPY.errContact); }
    if (v.whatsapp && !/^\+?[0-9\s\-()]{7,20}$/.test(v.whatsapp)) errors.whatsapp = t(COPY.errPhone);
    if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email)) errors.email = t(COPY.errEmail);
    return errors;
  }

  function summary(res) {
    var ar = function (id) { var d = dimById(id); return d ? d.constraintAr + " (" + d.constraintEn + ")" : ""; };
    return {
      primary_constraint: res.primary ? ar(res.primary) : "لم يتضح قيد رئيسي (no clear constraint)",
      secondary_constraint: res.secondary ? ar(res.secondary) : "",
      strongest_area: res.strongest ? ar(res.strongest) : "",
      levels: res.order.map(function (id) { return id + ":" + res.dims[id].level; }).join("; "),
      context: res.context || "",
      tier_hint: res.tier || ""
    };
  }

  function submitLead(form, submit, status, res) {
    var f = form.elements;
    var v = {
      name: f.namedItem("name").value.trim(), business: f.namedItem("business").value.trim(),
      whatsapp: f.namedItem("whatsapp").value.trim(), email: f.namedItem("email").value.trim(), goal: f.namedItem("goal").value.trim()
    };
    var errors = validateLead(v);
    ["name", "business", "whatsapp", "email"].forEach(function (id) { showErr(id, errors[id]); });
    var firstBad = ["name", "business", "whatsapp", "email"].filter(function (id) { return errors[id]; })[0];
    if (firstBad) { document.getElementById(firstBad).focus(); return; }

    submit.disabled = true;
    status.hidden = false; status.textContent = t(COPY.sending);

    var payload = Object.assign({
      name: v.name, business: v.business, whatsapp: v.whatsapp, email: v.email, goal: v.goal,
      lang: lang(), scan_version: D.version, page: "clarity-scan",
      "bot-field": f.namedItem("bot-field") ? f.namedItem("bot-field").value : ""
    }, summary(res));

    ELM.submitClarityLead(payload).then(function (r) {
      ELM.analytics.track(EV.leadSubmitted, { ok: !!r.ok });
      if (r.ok) {
        state.unlocked = true; state.prepared = v.business; state.draft = {}; save();
        state.notice = { kind: "ok", text: t(COPY.saved) };
        go("result", true);
      } else {
        submit.disabled = false;
        status.hidden = false;
        empty(status);
        status.appendChild(document.createTextNode(t(COPY.saveFailed) + " "));
        var wa = el("a", { href: ELM.contact.whatsappUrl("scan"), target: "_blank", rel: "noopener", text: t(C.cta.talk) });
        wa.addEventListener("click", function () { ELM.analytics.track(EV.whatsappClicked, { source: "lead-fallback" }); });
        status.appendChild(wa);
      }
    });
  }

  /* ---------- share ---------- */
  function shareResult() {
    var url = C.site.url + C.scan.path;
    ELM.analytics.track(EV.shared, {});
    if (navigator.share) {
      navigator.share({ title: "ELMUBARAK Clarity Scan", text: t(COPY.shareText), url: url }).catch(function () { /* cancelled */ });
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () { announce(t(COPY.shareCopied)); }, function () { announce(t(COPY.shareFailed)); });
    } else {
      announce(t(COPY.shareFailed));
    }
  }

  /* ---------- report (print-friendly) ---------- */
  function formatDate() {
    try {
      return new Intl.DateTimeFormat(lang() === "ar" ? "ar-u-nu-latn" : "en-GB", { year: "numeric", month: "long", day: "numeric" }).format(new Date());
    } catch (e) { return new Date().toISOString().slice(0, 10); }
  }

  function renderReport() {
    empty(reportRoot);
    var res = state.result = E.evaluate(state.answers);
    var rec = recFor(res);
    var primaryName = res.primary ? constraintName(res.primary) : t(D.noConstraint.label);

    function row(label, text) {
      return el("div", { class: "rp-block" }, [el("h3", { text: label }), el("p", { text: text })]);
    }

    var sheet = el("article", { class: "report-sheet" }, [
      el("div", { class: "report-actions no-print" }, [
        button("btn-ghost", t(COPY.backToResult), function () { go("result"); }),
        button("btn-primary", t(COPY.print), function () {
          ELM.analytics.track(EV.reportDownloaded, {});
          window.print();
        })
      ]),
      el("div", { class: "rp-head" }, [
        el("img", { src: "/assets/logo-navy.png", alt: "", width: "30", height: "30" }),
        el("div", { dir: "ltr" }, [el("b", { text: "ELMUBARAK" }), el("span", { text: "Clarity Scan™" })])
      ]),
      el("h1", { class: "rp-title", id: "rpTitle", text: t(COPY.reportHeading) }),
      el("dl", { class: "rp-meta" }, [
        el("div", null, [el("dt", { text: t(COPY.date) }), el("dd", { text: formatDate() })]),
        state.prepared ? el("div", null, [el("dt", { text: t(COPY.preparedFor) }), el("dd", { text: state.prepared })]) : null
      ]),
      el("div", { class: "rp-fp" }, [buildFingerprint(res, "full", false), legend(res)]),
      row(t(COPY.primary), primaryName),
      row(t(COPY.secondary), res.secondary ? constraintName(res.secondary) : t(COPY.noSecondary)),
      row(t(COPY.strongest), res.strongest ? constraintName(res.strongest) : t(COPY.noStrongest)),
      row(t(COPY.meaning), t(rec.meaning)),
      res.insight ? row(t(COPY.reading), t(res.insight)) : null,
      row(t(COPY.priority), t(rec.priority)),
      row(t(COPY.nextStep), t(rec.next)),
      res.tier && D.tiers[res.tier] ? row(t(COPY.tierHint), t(D.tiers[res.tier])) : null,
      el("div", { class: "rp-foot" }, [
        el("p", { text: t(COPY.disclaimer) }),
        el("p", { class: "rp-contact", dir: "ltr", text: t(COPY.reportContact) + C.contact.whatsappDisplay + " · " + C.contact.email })
      ])
    ]);
    reportRoot.appendChild(sheet);
    var h = document.getElementById("rpTitle");
    if (h) { h.setAttribute("tabindex", "-1"); try { h.focus({ preventScroll: true }); } catch (e) { /* noop */ } }
    window.scrollTo(0, 0);
  }

  function renderFailure() {
    empty(root);
    root.appendChild(el("div", { class: "scan-card" }, [
      el("p", { class: "notice notice-warn", role: "alert", text: t(COPY.stateError) }),
      button("btn-primary", t(COPY.restart), function () { reset(); go("intro", true); })
    ]));
  }

  /* ---------- boot ---------- */
  function init() {
    root = document.getElementById("scanRoot");
    reportRoot = document.getElementById("reportRoot");
    live = document.getElementById("scanLive");
    if (!root || !reportRoot) return;
    load();
    window.addEventListener("hashchange", route);
    I18N.onChange(function () {
      /* Re-render in place: no focus change, no scrolling, no entrance animation. */
      state.quiet = true;
      try { route(); } finally { state.quiet = false; }
    });
    route();
  }

  ELM.clarity.ui = { init: init };
})();
