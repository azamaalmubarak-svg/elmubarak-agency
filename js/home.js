/* ELMUBARAK — homepage behaviour: clarity scorecard (11 lenses), contact form, mobile menu. */
(function () {
  "use strict";
  var ELM = window.ELM;
  var I18N = ELM.i18n, C = ELM.config;

  /* ---------- clarity scorecard (existing instrument, unchanged in content) ---------- */
  var LENSES = [
    { ar: "الأعمال", en: "Business", qAr: "نموذج العمل ومصادر الربح واضحة ومكتوبة", qEn: "The business model and profit sources are clear and written down" },
    { ar: "السوق", en: "Market", qAr: "حجم السوق وشرائحه والمنافسون مفهومون ببيانات", qEn: "Market size, segments and competitors are understood with data" },
    { ar: "العميل", en: "Customer", qAr: "دوافع الشراء والاعتراضات معروفة من مقابلات حقيقية", qEn: "Buying motives and objections come from real interviews" },
    { ar: "التموضع", en: "Positioning", qAr: "سبب اختيارنا دون غيرنا واضح ومختلف فعلًا", qEn: "Why us and not others is clear and genuinely different" },
    { ar: "العرض", en: "Offer", qAr: "العروض والأسعار مبنية على قيمة لا على تقليد المنافس", qEn: "Offers and prices are built on value, not on copying competitors" },
    { ar: "المبيعات", en: "Sales", qAr: "هناك مسار بيع مكتوب ومتابعة منتظمة للفرص", qEn: "There is a written sales path and disciplined follow-up" },
    { ar: "التسويق", en: "Marketing", qAr: "النشاط التسويقي مرتبط بهدف تجاري لا بجدول نشر", qEn: "Marketing activity is tied to a commercial goal, not a posting schedule" },
    { ar: "التجربة", en: "Experience", qAr: "تجربة العميل متسقة من أول تواصل حتى ما بعد البيع", qEn: "The customer experience is consistent from first contact to after-sales" },
    { ar: "المنظمة", en: "Organization", qAr: "الأدوار والمسؤوليات وصلاحيات القرار محددة", qEn: "Roles, responsibilities and decision rights are defined" },
    { ar: "البيانات", en: "Data", qAr: "نقيس ما يهم، ونعرف مصدر كل رقم ومالكه", qEn: "We measure what matters and know each number's source and owner" },
    { ar: "النمو", en: "Growth", qAr: "لدينا فرضية نمو مكتوبة نختبرها، لا محاولات متفرقة", qEn: "We have a written growth hypothesis we test, not scattered attempts" }
  ];

  var scores = {};
  var host = document.getElementById("lensList");

  function lang() { return I18N.lang(); }

  function buildLenses() {
    if (!host) return;
    host.innerHTML = "";
    LENSES.forEach(function (lens, i) {
      var row = document.createElement("div");
      row.className = "lens";

      var label = document.createElement("div");
      var name = document.createElement("div");
      name.className = "lens-name";
      name.textContent = lens[lang()];
      var q = document.createElement("div");
      q.className = "lens-q";
      q.textContent = lang() === "ar" ? lens.qAr : lens.qEn;
      label.appendChild(name);
      label.appendChild(q);

      var dots = document.createElement("div");
      dots.className = "dots";
      for (var v = 1; v <= 5; v++) {
        (function (val) {
          var b = document.createElement("button");
          b.type = "button";
          b.className = "dot";
          b.textContent = val;
          b.setAttribute("aria-pressed", String(scores[i] === val));
          b.setAttribute("aria-label", lens[lang()] + " — " + val);
          b.addEventListener("click", function () {
            scores[i] = val;
            Array.prototype.forEach.call(dots.children, function (c, idx) {
              c.setAttribute("aria-pressed", String(idx + 1 === val));
            });
            render();
          });
          dots.appendChild(b);
        })(v);
      }
      row.appendChild(label);
      row.appendChild(dots);
      host.appendChild(row);
    });
  }

  function render() {
    var keys = Object.keys(scores);
    var box = document.getElementById("result");
    if (!box) return;
    if (keys.length < 4) { box.hidden = true; return; }

    var worstVal = 6, worst = [];
    keys.forEach(function (k) {
      var v = scores[k];
      if (v < worstVal) { worstVal = v; worst = [k]; }
      else if (v === worstVal) { worst.push(k); }
    });
    var names = worst.slice(0, 2).map(function (k) { return lang() === "ar" ? LENSES[k].ar : LENSES[k].en; });
    var sum = keys.reduce(function (a, k) { return a + scores[k]; }, 0);
    var avg = (sum / keys.length).toFixed(1);

    var txt, note;
    if (lang() === "ar") {
      txt = "أضعف ما لديك الآن: <strong>" + names.join(" و") + "</strong> بدرجة " + worstVal + " من 5. "
        + "هذه هي نقطة الاختناق المرجّحة — وهي المكان الذي يجب أن يبدأ منه العمل، لا القناة الأعلى ضجيجًا. "
        + "متوسط ما قيّمته: " + avg + " من 5 على " + keys.length + " عدسة.";
      note = keys.length < LENSES.length
        ? "أكمل بقية العدسات لصورة أدق. ثم تذكّر: المتوسط يُخفي الاختناق، والعمل يبدأ من الأضعف."
        : "المتوسط مؤشر مضلل بطبيعته؛ المؤسسة تتحرك بسرعة أضعف عدساتها لا بمتوسطها.";
    } else {
      txt = "Your weakest point right now: <strong>" + names.join(" and ") + "</strong>, scored " + worstVal + " out of 5. "
        + "This is the probable bottleneck — and where work should begin, not the loudest channel. "
        + "Average across what you scored: " + avg + " out of 5 on " + keys.length + " lenses.";
      note = keys.length < LENSES.length
        ? "Score the remaining lenses for a sharper picture. Remember: the average hides the bottleneck; work starts at the weakest."
        : "Averages are misleading by nature; an organization moves at the speed of its weakest lens, not its mean.";
    }
    document.getElementById("resultText").innerHTML = txt;
    document.getElementById("resultNote").textContent = note;

    var hidden = document.getElementById("weakestLens");
    if (hidden) {
      hidden.value = worst.map(function (k) { return LENSES[k].ar + " (" + LENSES[k].en + ")"; }).join(", ") + " — " + worstVal + "/5";
    }
    box.hidden = false;
  }

  /* ---------- contact form ---------- */
  var MSG = {
    required: { ar: "أكمل الحقول المطلوبة: الاسم، النشاط، وسيلة التواصل، وما تريد حله.", en: "Complete the required fields: name, business, contact detail and what you want to solve." },
    sending: { ar: "جارٍ الإرسال…", en: "Sending…" },
    ok: { ar: "وصلنا طلبك. سنتواصل خلال يوم عمل واحد لتحديد موعد المكالمة.", en: "Your request has been received. We will be in touch within one business day to schedule the call." },
    fail: {
      ar: "تعذّر الإرسال من هذه النسخة. راسلنا مباشرة على <a data-contact=\"whatsapp\" href=\"#\">واتساب</a> أو <a data-contact=\"email\" href=\"#\">البريد</a>.",
      en: "Submission is unavailable on this copy. Reach us directly on <a data-contact=\"whatsapp\" href=\"#\">WhatsApp</a> or by <a data-contact=\"email\" href=\"#\">email</a>."
    }
  };

  function initContactForm() {
    var form = document.getElementById("leadForm");
    if (!form) return;
    var msg = document.getElementById("formMsg");
    var btn = form.querySelector("button[type=submit]");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = form.elements;
      function val(n) { var x = f.namedItem(n); return x ? String(x.value) : ""; }
      var fields = {
        name: val("name").trim(), business: val("business").trim(), role: val("role").trim(),
        contact_method: val("contact_method"), contact: val("contact").trim(),
        problem: val("problem").trim(), situation: val("situation").trim(),
        "weakest-lens": val("weakest-lens"), lang: lang(),
        "company-website": val("company-website")
      };
      msg.hidden = false;
      if (!fields.name || !fields.business || !fields.contact || !fields.problem) {
        msg.textContent = MSG.required[lang()];
        return;
      }
      btn.disabled = true;
      msg.textContent = MSG.sending[lang()];
      ELM.submitForm(C.forms.contactFormName, fields).then(function (r) {
        if (r.ok) {
          form.reset();
          msg.textContent = MSG.ok[lang()];
        } else {
          msg.innerHTML = MSG.fail[lang()];
          ELM.contact.hydrate();
        }
        btn.disabled = false;
      });
    });
  }

  /* ---------- boot (shell.js initialises language after this file loads) ---------- */
  I18N.onChange(function () {
    buildLenses();
    render();
  });
  buildLenses();
  initContactForm();
})();
