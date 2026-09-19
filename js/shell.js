/* ELMUBARAK — shell: runs last on every page. Language, contact links, mobile menu, then page modules. */
(function () {
  "use strict";
  var ELM = window.ELM;

  function initMenu() {
    var header = document.querySelector("header");
    var btn = document.getElementById("menuBtn");
    if (!header || !btn) return;
    function set(open) {
      header.classList.toggle("nav-open", open);
      btn.setAttribute("aria-expanded", String(open));
    }
    btn.addEventListener("click", function () { set(!header.classList.contains("nav-open")); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") set(false); });
    Array.prototype.forEach.call(header.querySelectorAll(".nav a"), function (a) {
      a.addEventListener("click", function () { set(false); });
    });
  }

  ELM.i18n.onChange(function () { ELM.contact.hydrate(); });
  ELM.i18n.init();
  initMenu();
  if (ELM.clarity && ELM.clarity.ui) ELM.clarity.ui.init();
})();
