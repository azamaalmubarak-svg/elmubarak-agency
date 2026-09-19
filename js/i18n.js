/* ELMUBARAK — language + direction handling shared by every page. */
(function () {
  "use strict";
  var ELM = (window.ELM = window.ELM || {});
  var KEY = "elm-lang";
  var lang = "ar";
  var listeners = [];
  var ATTRS = ["aria-label", "placeholder", "title", "alt"];

  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function persist(v) {
    try { localStorage.setItem(KEY, v); } catch (e) { /* storage unavailable */ }
  }

  function each(sel, fn) {
    Array.prototype.forEach.call(document.querySelectorAll(sel), fn);
  }

  function apply(next) {
    lang = next === "en" ? "en" : "ar";
    var html = document.documentElement;
    html.lang = lang;
    html.dir = lang === "ar" ? "rtl" : "ltr";

    var title = html.getAttribute("data-title-" + lang);
    if (title) document.title = title;

    var btn = document.getElementById("langBtn");
    if (btn) {
      btn.textContent = lang === "ar" ? "English" : "العربية";
      btn.setAttribute("lang", lang === "ar" ? "en" : "ar");
    }

    each("[data-ar][data-en]", function (el) {
      var v = el.getAttribute("data-" + lang);
      if (v !== null) el.innerHTML = v;
    });

    ATTRS.forEach(function (attr) {
      each("[data-" + attr + "-ar]", function (el) {
        var v = el.getAttribute("data-" + attr + "-" + lang);
        if (v !== null) el.setAttribute(attr, v);
      });
    });

    var cta = (ELM.config && ELM.config.cta) || {};
    each("[data-cta]", function (el) {
      var c = cta[el.getAttribute("data-cta")];
      if (c) el.textContent = c[lang];
    });

    listeners.forEach(function (fn) {
      try { fn(lang); } catch (e) { if (window.console) console.error(e); }
    });
  }

  ELM.i18n = {
    lang: function () { return lang; },
    set: function (next, save) {
      apply(next);
      if (save) persist(lang);
    },
    onChange: function (fn) { listeners.push(fn); },
    text: function (obj) { return obj ? obj[lang] : ""; },
    init: function () {
      var s = stored();
      apply(s === "en" ? "en" : "ar");
      document.documentElement.classList.remove("i18n-pending");
      var btn = document.getElementById("langBtn");
      if (btn) btn.addEventListener("click", function () {
        ELM.i18n.set(lang === "ar" ? "en" : "ar", true);
      });
    }
  };
})();
