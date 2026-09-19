/* ELMUBARAK — services: analytics abstraction, contact links, form submission. */
(function () {
  "use strict";
  var ELM = (window.ELM = window.ELM || {});
  var C = ELM.config;

  /* ---------- analytics ----------
     No third-party analytics is configured. Register an adapter to forward events, e.g.:
       ELM.analytics.register(function (name, props) { gtag("event", name, props); });
     Events are also dispatched as a DOM CustomEvent ("elm:analytics"). Never pass personal data. */
  var adapters = [];
  ELM.analytics = {
    register: function (fn) { if (typeof fn === "function") adapters.push(fn); },
    track: function (name, props) {
      props = props || {};
      if (C.analytics.debug && window.console) console.log("[analytics]", name, props);
      try {
        window.dispatchEvent(new CustomEvent("elm:analytics", { detail: { name: name, props: props } }));
      } catch (e) { /* older browsers */ }
      adapters.forEach(function (fn) {
        try { fn(name, props); } catch (e) { /* an adapter must never break the page */ }
      });
    }
  };

  /* ---------- contact ---------- */
  function lang() { return ELM.i18n ? ELM.i18n.lang() : "ar"; }

  ELM.contact = {
    whatsappUrl: function (messageKey) {
      var m = C.contact.messages[messageKey || "general"];
      var text = m ? m[lang()] : "";
      return "https://wa.me/" + C.contact.whatsappNumber + (text ? "?text=" + encodeURIComponent(text) : "");
    },
    mailto: function () { return "mailto:" + C.contact.email; },
    hydrate: function () {
      Array.prototype.forEach.call(document.querySelectorAll("[data-contact]"), function (el) {
        var kind = el.getAttribute("data-contact");
        if (kind === "whatsapp") el.setAttribute("href", ELM.contact.whatsappUrl(el.getAttribute("data-wa-msg") || "general"));
        else if (kind === "whatsapp-text") el.textContent = C.contact.whatsappDisplay;
        else if (kind === "email") el.setAttribute("href", ELM.contact.mailto());
        else if (kind === "email-text") el.textContent = C.contact.email;
      });
    }
  };

  /* ---------- forms ----------
     Forms are stored by Netlify Forms (static form definitions must exist in the deployed HTML).
     Resolves { ok:true } only when the server confirmed the submission — never assume success. */
  function encode(obj) {
    return Object.keys(obj).map(function (k) {
      return encodeURIComponent(k) + "=" + encodeURIComponent(obj[k] == null ? "" : obj[k]);
    }).join("&");
  }

  ELM.submitForm = function (formName, fields) {
    var body = encode(Object.assign({ "form-name": formName }, fields));
    var ctrl = typeof AbortController === "function" ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, C.forms.timeoutMs) : null;
    return fetch(C.forms.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body,
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (r) {
      return { ok: r.ok, status: r.status };
    }).catch(function (e) {
      return { ok: false, reason: e && e.name === "AbortError" ? "timeout" : "network" };
    }).then(function (res) {
      if (timer) clearTimeout(timer);
      return res;
    });
  };

  /* Clarity Scan lead. `payload` carries the visitor's contact details plus a compact,
     non-sensitive summary of the result (no raw answers). */
  ELM.submitClarityLead = function (payload) {
    return ELM.submitForm(C.forms.leadFormName, payload);
  };
})();
