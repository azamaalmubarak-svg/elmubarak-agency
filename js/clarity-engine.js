/* ELMUBARAK Clarity Scan — diagnostic engine. Pure rule-based logic: no DOM, no randomness, no network.
   evaluate(answers) → result. All numbers come from clarity-data.js. */
(function () {
  "use strict";
  var ELM = (window.ELM = window.ELM || {});
  ELM.clarity = ELM.clarity || {};

  var D = function () { return ELM.clarity.data; };

  function findOption(q, id) {
    for (var i = 0; i < q.options.length; i++) if (q.options[i].id === id) return q.options[i];
    return null;
  }

  function has(list, value) { return list.indexOf(value) !== -1; }

  /* Which questions still lack a valid answer. */
  function missing(answers) {
    var out = [];
    D().questions.forEach(function (q, i) {
      if (!answers || !answers[q.id] || !findOption(q, answers[q.id])) out.push(i);
    });
    return out;
  }

  function levelOf(net, touched, T) {
    if (!touched) return "unknown";
    if (net >= T.priority) return "priority";
    if (net >= T.attention) return "attention";
    if (net <= T.strong) return "strong";
    return "stable";
  }

  function matchesRule(when, ctx) {
    if (when.statedIn && !(ctx.stated && has(when.statedIn, ctx.stated))) return false;
    if (when.primaryIn && !(ctx.primary && has(when.primaryIn, ctx.primary))) return false;
    if (when.noPrimary && ctx.primary) return false;
    if (when.flag && !ctx.flags[when.flag]) return false;
    return true;
  }

  function evaluate(answers) {
    var data = D();
    var T = data.thresholds;
    var order = data.dimensions.map(function (d) { return d.id; });
    var dims = {};
    order.forEach(function (id) { dims[id] = { id: id, pressure: 0, strength: 0, net: 0, touched: false, level: "unknown" }; });

    var flags = {};
    var stated = null;
    var context = null;

    data.questions.forEach(function (q) {
      var opt = answers && answers[q.id] ? findOption(q, answers[q.id]) : null;
      if (!opt) return;
      if (q.role === "context") context = opt.id;
      if (q.role === "stated") stated = opt.stated || null;
      var k;
      if (opt.p) for (k in opt.p) if (dims[k]) { dims[k].pressure += opt.p[k]; dims[k].touched = true; }
      if (opt.s) for (k in opt.s) if (dims[k]) { dims[k].strength += opt.s[k]; dims[k].touched = true; }
      (opt.f || []).forEach(function (f) { flags[f] = true; });
    });

    order.forEach(function (id) {
      var d = dims[id];
      d.net = d.pressure - d.strength;
      d.level = levelOf(d.net, d.touched, T);
    });

    /* Rank by net desc; ties resolved upstream-first via the dimension order. */
    var ranked = order.slice().sort(function (a, b) {
      return (dims[b].net - dims[a].net) || (order.indexOf(a) - order.indexOf(b));
    });

    var named = ranked.filter(function (id) { return dims[id].touched && dims[id].net >= T.attention; });
    var primary = named[0] || null;
    var secondary = named[1] || null;

    var strongPool = order.filter(function (id) { return dims[id].touched && dims[id].net <= T.strongestMax; });
    strongPool.sort(function (a, b) {
      return (dims[a].net - dims[b].net) || (order.indexOf(a) - order.indexOf(b));
    });
    var strongest = strongPool[0] || null;

    var ctx = { stated: stated, primary: primary, flags: flags };
    var insight = null;
    for (var i = 0; i < data.insights.length; i++) {
      if (matchesRule(data.insights[i].when, ctx)) { insight = data.insights[i]; break; }
    }

    return {
      version: data.version,
      dims: dims,
      order: order,
      ranked: ranked,
      primary: primary,
      secondary: secondary,
      strongest: strongest,
      stated: stated,
      context: context,
      flags: flags,
      insight: insight,
      tier: context && data.tierHints[context] ? data.tierHints[context] : null
    };
  }

  ELM.clarity.engine = { evaluate: evaluate, missing: missing, findOption: findOption };
})();
