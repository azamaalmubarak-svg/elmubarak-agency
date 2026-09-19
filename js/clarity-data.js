/* ELMUBARAK Clarity Scan — configuration only: questions, options, dimension weights, rules, insights,
   recommendations and UI copy. No logic and no DOM code lives here. Edit freely; weights are plain numbers.

   Effect notation on an option:
     p: { dimension: weight }   pressure — a signal that the dimension needs attention
     s: { dimension: weight }   strength — a signal that the dimension is in good shape
     f: [ "flag" ]              context flags (e.g. "unclear" when the visitor says "I don't know")
   Net score of a dimension = pressure − strength. Thresholds are below. */
(function () {
  "use strict";
  var ELM = (window.ELM = window.ELM || {});
  ELM.clarity = ELM.clarity || {};

  function o(id, ar, en, fx) {
    var opt = { id: id, ar: ar, en: en };
    if (fx) for (var k in fx) opt[k] = fx[k];
    return opt;
  }

  ELM.clarity.data = {
    version: "1",

    /* Ordered upstream → downstream. This order also breaks ties (upstream causes win). */
    dimensions: [
      { id: "positioning", ar: "التموضع", en: "Positioning", constraintAr: "وضوح التموضع", constraintEn: "Positioning clarity" },
      { id: "customer", ar: "العميل", en: "Customer", constraintAr: "فهم العميل", constraintEn: "Customer understanding" },
      { id: "offer", ar: "العرض", en: "Offer", constraintAr: "وضوح العرض", constraintEn: "Offer clarity" },
      { id: "pricing", ar: "التسعير", en: "Pricing", constraintAr: "منطق التسعير", constraintEn: "Pricing logic" },
      { id: "marketing", ar: "التسويق", en: "Marketing", constraintAr: "قياس التسويق", constraintEn: "Marketing measurement" },
      { id: "sales", ar: "المبيعات", en: "Sales", constraintAr: "تحويل المبيعات", constraintEn: "Sales conversion" },
      { id: "experience", ar: "التجربة", en: "Experience", constraintAr: "تجربة العميل والاحتفاظ به", constraintEn: "Customer experience & retention" },
      { id: "systems", ar: "الأنظمة", en: "Systems", constraintAr: "الاعتماد على نظام لا على شخص", constraintEn: "Reliance on a system, not a person" },
      { id: "growth", ar: "النمو", en: "Growth", constraintAr: "فرضية النمو", constraintEn: "Growth hypothesis" }
    ],

    /* Qualitative levels only — never a percentage. */
    levels: {
      strong: { ar: "قوي", en: "Strong" },
      stable: { ar: "مستقر", en: "Stable" },
      attention: { ar: "يحتاج انتباهًا", en: "Needs attention" },
      priority: { ar: "أولوية للتركيز", en: "Priority focus" },
      unknown: { ar: "إشارات غير كافية", en: "Not enough signal" }
    },

    /* Level thresholds on net = pressure − strength. */
    thresholds: {
      priority: 4,      /* net ≥ 4  → priority focus */
      attention: 2,     /* net ≥ 2  → needs attention (also the minimum to be named a constraint) */
      strong: -2,       /* net ≤ -2 → strong */
      strongestMax: -1  /* a "strongest area" needs net ≤ -1 */
    },

    /* Business context → suggested Diagnostic depth (a soft hint, never a promise). */
    tierHints: {
      startup: "focus", personal: "focus", growing: "core", stable: "core", org: "institutional"
    },
    tiers: {
      focus: { ar: "Focus — مشكلة استراتيجية محددة", en: "Focus — one specific strategic problem" },
      core: { ar: "Core — نظام تسويق ونمو متكامل", en: "Core — an integrated marketing and growth system" },
      institutional: { ar: "Institutional — تحول استراتيجي طويل المدى", en: "Institutional — long-term strategic transformation" }
    },

    questions: [
      {
        id: "context", role: "context",
        ar: "ما الذي يصف نشاطك بشكل أفضل؟",
        en: "Which best describes your business?",
        options: [
          o("startup", "مشروع ناشئ", "An early-stage venture"),
          o("growing", "مشروع قائم وينمو", "An established business that is growing"),
          o("stable", "شركة مستقرة", "A stable company"),
          o("org", "مؤسسة / منظمة", "An institution or organisation"),
          o("personal", "علامة شخصية / نشاط مهني", "A personal brand or professional practice"),
          o("other", "أخرى", "Other")
        ]
      },
      {
        id: "problem", role: "stated",
        ar: "ما المشكلة التي تشعر أنها تضغط على عملك الآن؟",
        en: "Which problem feels most pressing on your business right now?",
        options: [
          o("sales", "المبيعات", "Sales", { stated: "sales", p: { sales: 2 } }),
          o("marketing", "التسويق", "Marketing", { stated: "marketing", p: { marketing: 2 } }),
          o("pricing", "التسعير", "Pricing", { stated: "pricing", p: { pricing: 2 } }),
          o("customers", "العملاء", "Customers", { stated: "customer", p: { customer: 2 } }),
          o("positioning", "التموضع", "Positioning", { stated: "positioning", p: { positioning: 2 } }),
          o("growth", "النمو", "Growth", { stated: "growth", p: { growth: 2 } }),
          o("operations", "التشغيل", "Operations", { stated: "systems", p: { systems: 2 } }),
          o("unknown", "لا أعرف تحديدًا", "I'm not sure exactly", { f: ["unclear"] })
        ]
      },
      {
        id: "symptom",
        ar: "ما الذي يحدث فعليًا؟",
        en: "What is actually happening?",
        options: [
          o("spend_unclear", "أصرف على التسويق والنتيجة غير واضحة", "I spend on marketing and the result is unclear", { p: { marketing: 2, systems: 1 } }),
          o("known_not_buying", "الناس تعرفنا لكن لا تشتري بما يكفي", "People know us but don't buy enough", { p: { offer: 3, positioning: 1, sales: 1 } }),
          o("price_compare", "العملاء يقارنوننا بالسعر", "Customers compare us on price", { p: { positioning: 2, pricing: 2, offer: 1 } }),
          o("sales_unstable", "المبيعات موجودة لكنها غير مستقرة", "Sales exist but they are unstable", { p: { sales: 3, customer: 1, systems: 1 } }),
          o("retention", "لدينا عملاء لكن الاحتفاظ بهم صعب", "We have customers but keeping them is hard", { p: { experience: 4, offer: 1 } }),
          o("growth_stalled", "النمو توقف", "Growth has stalled", { p: { growth: 3, positioning: 1, offer: 1 } }),
          o("depends_on_me", "المشروع يعتمد علي بشكل كبير", "The business depends heavily on me", { p: { systems: 3, growth: 1 } }),
          o("dont_know", "لا أعرف لماذا النتائج ضعيفة", "I don't know why the results are weak", { p: { systems: 1 }, f: ["unclear"] })
        ]
      },
      {
        id: "customer_clarity",
        ar: "إلى أي درجة تعرف عميلك المثالي؟",
        en: "How well do you know your ideal customer?",
        options: [
          o("very_clear", "أعرفه بوضوح شديد", "I know them very clearly", { s: { customer: 2 } }),
          o("general", "أعرفه بشكل عام", "I know them in general terms", { p: { customer: 1 } }),
          o("multiple_unknown", "لدي أكثر من نوع ولا أعرف أيهم أهم", "I have several types and don't know which matters most", { p: { customer: 2 } }),
          o("everyone", "أستهدف الجميع تقريبًا", "I target almost everyone", { p: { customer: 3, marketing: 1 } }),
          o("unsure", "لست متأكدًا", "I'm not sure", { p: { customer: 2 } })
        ]
      },
      {
        id: "why_you",
        ar: "لو سألك عميل: لماذا أختارك أنت؟ ماذا ستكون إجابتك؟",
        en: "If a customer asked “why should I choose you?”, what would your answer be?",
        options: [
          o("very_clear", "لدينا إجابة واضحة جدًا", "We have a very clear answer", { s: { positioning: 2, offer: 1 } }),
          o("hard_to_explain", "لدينا ميزة لكن يصعب شرحها", "We have an advantage but it is hard to explain", { p: { offer: 2 } }),
          o("talk_price", "غالبًا نتحدث عن السعر", "We mostly talk about price", { p: { positioning: 2, pricing: 1 } }),
          o("quality", "نعتمد على الجودة / الخبرة", "We rely on quality / experience", { p: { positioning: 1 } }),
          o("varies", "تختلف الإجابة من شخص لآخر", "The answer differs from person to person", { p: { positioning: 1, systems: 1 } }),
          o("none", "لا أملك إجابة واضحة", "I don't have a clear answer", { p: { positioning: 2, offer: 2 } })
        ]
      },
      {
        id: "pricing_method",
        ar: "كيف تحدد أسعارك حاليًا؟",
        en: "How do you set your prices today?",
        hintAr: "لا توجد طريقة واحدة صحيحة دائمًا؛ نسأل لنفهم أساس قرارك.",
        hintEn: "There is no single method that is always right; we ask to understand the basis of your decision.",
        options: [
          o("cost_margin", "التكلفة + هامش", "Cost plus a margin"),
          o("competitors", "المنافسون", "Competitors", { p: { pricing: 1 } }),
          o("market", "السوق", "The market"),
          o("value", "القيمة المقدمة", "The value delivered", { s: { pricing: 2 } }),
          o("varies_customer", "تختلف حسب العميل", "It varies by customer", { p: { pricing: 1 } }),
          o("unsure", "غير متأكد", "Not sure", { p: { pricing: 2 } })
        ]
      },
      {
        id: "measurement",
        ar: "عندما تقوم بالتسويق، ما الذي تقيسه فعليًا؟",
        en: "When you do marketing, what do you actually measure?",
        options: [
          o("reach", "الوصول والمشاهدات", "Reach and views", { p: { marketing: 2 } }),
          o("leads", "العملاء المحتملون", "Leads", { p: { marketing: 1, sales: 1 } }),
          o("sales", "المبيعات", "Sales", { s: { marketing: 1 } }),
          o("cac", "تكلفة اكتساب العميل", "Customer acquisition cost", { s: { marketing: 1, growth: 1 } }),
          o("roas", "العائد على الإنفاق", "Return on spend", { s: { marketing: 1, growth: 1 } }),
          o("multiple", "عدة مؤشرات", "Several indicators", { s: { marketing: 2, systems: 1 } }),
          o("none", "لا أقيس بشكل منتظم", "I don't measure regularly", { p: { marketing: 2, systems: 1, growth: 1 } })
        ]
      },
      {
        id: "priority",
        ar: "لو كان بإمكانك حل مشكلة واحدة فقط خلال الأشهر القادمة، ماذا تختار؟",
        en: "If you could solve only one problem in the coming months, which would it be?",
        options: [
          o("more_sales", "زيادة المبيعات", "Increase sales", { p: { sales: 1 } }),
          o("better_customers", "جذب عملاء أفضل", "Attract better customers", { p: { customer: 2 } }),
          o("profitability", "تحسين الربحية", "Improve profitability", { p: { pricing: 1 } }),
          o("stabilize_prices", "تثبيت الأسعار", "Stabilise prices", { p: { pricing: 2 } }),
          o("rebuild_positioning", "إعادة بناء التموضع", "Rebuild the positioning", { p: { positioning: 2 } }),
          o("marketing_system", "بناء نظام تسويق", "Build a marketing system", { p: { marketing: 1, systems: 1 } }),
          o("expand", "التوسع", "Expand", { p: { growth: 2, systems: 1 } }),
          o("understand_first", "فهم المشكلة أولًا", "Understand the problem first", { f: ["unclear"] })
        ]
      }
    ],

    /* What each dimension says when it is the primary constraint. */
    recommendations: {
      positioning: {
        meaning: {
          ar: "تشير إجاباتك إلى أن العميل قد لا يرى بوضوح لماذا يختارك أنت دون غيرك — وحين يغيب هذا الفرق يتحول الاختيار إلى مقارنة بالسعر.",
          en: "Your answers suggest customers may not see clearly why they should choose you over others — and when that difference is missing, the choice turns into a price comparison."
        },
        priority: { ar: "توضيح سبب اختيارك وتمييزه عن البدائل.", en: "Make the reason to choose you explicit and distinct from the alternatives." },
        next: {
          ar: "اكتب في جملة واحدة لمن تخدم ولماذا تختلف، ثم اختبرها مع ثلاثة من عملائك قبل أن تعدّل أي حملة.",
          en: "Write in one sentence who you serve and why you are different, then test it with three of your customers before you change any campaign."
        }
      },
      customer: {
        meaning: {
          ar: "تشير إجاباتك إلى أن صورة العميل الذي تريده قد لا تكون محددة بما يكفي — وحين يُستهدف الجميع يصعب أن يشعر أي شخص أن العرض موجّه له.",
          en: "Your answers suggest the picture of the customer you want may not be specific enough — when everyone is targeted, it is hard for anyone to feel the offer is meant for them."
        },
        priority: { ar: "تحديد العميل الأهم وفهم دوافعه واعتراضاته.", en: "Identify the most important customer and understand their motives and objections." },
        next: {
          ar: "اختر الشريحة الأكثر ربحية من عملائك الحاليين، وقابل ثلاثة منهم لتفهم لماذا اشتروا.",
          en: "Pick the most profitable segment among your current customers and speak to three of them to learn why they bought."
        }
      },
      offer: {
        meaning: {
          ar: "تشير إجاباتك إلى أن المشكلة قد لا تكون في الوصول إلى العملاء بقدر ما هي في وضوح القيمة التي يرونها.",
          en: "Your answers suggest the problem may lie less in reaching customers than in how clearly they see the value."
        },
        priority: { ar: "توضيح ما يحصل عليه العميل بالضبط ولماذا يستحق ما يدفعه.", en: "Make clear exactly what the customer gets and why it is worth what they pay." },
        next: { ar: "راجع العرض والتموضع قبل زيادة الإنفاق التسويقي.", en: "Review the offer and the positioning before increasing marketing spend." }
      },
      pricing: {
        meaning: {
          ar: "تشير إجاباتك إلى أن أساس التسعير قد يحتاج مراجعة — ليس لأن طريقة بعينها خاطئة، بل لأن الفجوة بين ما تطلبه وما يفهمه العميل من قيمة قد تكون هي المشكلة.",
          en: "Your answers suggest the basis of your pricing may deserve a review — not because any one method is wrong, but because the gap between what you ask and the value the customer understands may be the problem."
        },
        priority: { ar: "ربط السعر بالقيمة التي يفهمها العميل.", en: "Connect the price to the value the customer understands." },
        next: { ar: "قبل تغيير الأسعار، اسأل عملاءك عمّا يعتقدون أنهم يحصلون عليه مقابلها.", en: "Before changing prices, ask your customers what they believe they get in return." }
      },
      marketing: {
        meaning: {
          ar: "تشير إجاباتك إلى أن النشاط التسويقي قد لا يرتبط بمؤشر واضح للنتيجة — فيصعب معرفة ما ينجح وما يُهدر.",
          en: "Your answers suggest your marketing activity may not be tied to a clear indicator of results — making it hard to know what works and what is wasted."
        },
        priority: { ar: "ربط التسويق بهدف تجاري ومؤشر يُقاس بانتظام.", en: "Tie marketing to a commercial goal and an indicator measured regularly." },
        next: {
          ar: "اختر مؤشرًا تجاريًا واحدًا (عملاء محتملون مؤهلون أو مبيعات) وتابعه أسبوعيًا قبل أن تزيد الإنفاق.",
          en: "Choose one commercial indicator (qualified leads or sales) and track it weekly before you raise spend."
        }
      },
      sales: {
        meaning: {
          ar: "تشير إجاباتك إلى أن مسار البيع أو المتابعة قد يحتاج ضبطًا — فالمبيعات تأتي لكنها غير مستقرة.",
          en: "Your answers suggest the sales path or follow-up may need tightening — sales come, but they are not stable."
        },
        priority: { ar: "وضوح مسار البيع من أول اهتمام حتى الإغلاق.", en: "A clear sales path from first interest to close." },
        next: {
          ar: "ارسم الخطوات التي يمر بها العميل من أول تواصل حتى الشراء، وحدّد أين يتوقف معظمهم.",
          en: "Map the steps a customer takes from first contact to purchase and find where most of them stop."
        }
      },
      experience: {
        meaning: {
          ar: "تشير إجاباتك إلى أن العملاء قد يشترون لكن التجربة بعد الشراء لا تُبقيهم بما يكفي.",
          en: "Your answers suggest customers may buy, but the experience after the purchase does not keep them enough."
        },
        priority: { ar: "فهم ما يحدث بعد الشراء ولماذا يغادر العملاء.", en: "Understand what happens after the purchase and why customers leave." },
        next: {
          ar: "تواصل مع خمسة عملاء توقفوا عن الشراء واسألهم عن السبب.",
          en: "Contact five customers who stopped buying and ask them why."
        }
      },
      systems: {
        meaning: {
          ar: "تشير إجاباتك إلى أن العمل قد يعتمد على شخص أو ممارسات غير مكتوبة أكثر من اعتماده على نظام يمكن تكراره.",
          en: "Your answers suggest the business may rely on a person or unwritten practice more than on a system that can be repeated."
        },
        priority: { ar: "تحويل ما يُنجَز بالخبرة إلى نظام مكتوب قابل للتسليم.", en: "Turn what works through experience into a written system that can be handed over." },
        next: {
          ar: "اكتب العملية الأكثر تكرارًا (البيع أو التسليم) في خطوات، وحدّد من غيرك يستطيع تنفيذها.",
          en: "Write down your most repeated process (selling or delivery) in steps and identify who other than you could run it."
        }
      },
      growth: {
        meaning: {
          ar: "تشير إجاباتك إلى أن مسار النمو قد لا يستند إلى فرضية مكتوبة تُختبر، بل إلى محاولات متفرقة.",
          en: "Your answers suggest your growth path may rest on scattered attempts rather than a written hypothesis you test."
        },
        priority: { ar: "صياغة فرضية نمو واحدة واختبارها بمؤشر واضح.", en: "Form one growth hypothesis and test it against a clear indicator." },
        next: {
          ar: "اكتب ما تعتقد أنه سيزيد النمو، وكيف ستعرف أنك أصبت، قبل أن تبدأ أي توسع.",
          en: "Write down what you believe will grow the business and how you will know you were right, before you expand."
        }
      }
    },

    /* Shown when no dimension reaches the constraint threshold. */
    noConstraint: {
      label: { ar: "لم يتضح قيد رئيسي", en: "No clear constraint" },
      meaning: {
        ar: "إجاباتك لا تحمل إشارات كافية لتسمية قيد رئيسي بثقة — وهذا بحد ذاته نتيجة: قد يكون الوضع متوازنًا، وقد تكون الصورة غير واضحة بعد.",
        en: "Your answers don't carry enough signal to name a main constraint with confidence — which is a result in itself: things may be balanced, or the picture may not be clear yet."
      },
      priority: { ar: "تكوين صورة مبنية على أدلة.", en: "Build a picture based on evidence." },
      next: {
        ar: "ابدأ بمكالمة استكشاف قصيرة لتحديد ما إذا كان التشخيص مناسبًا لحالتك.",
        en: "Start with a short discovery call to decide whether the Diagnostic fits your case."
      }
    },

    /* The "aha" library: first rule that matches wins. Conditions are ANDed.
       statedIn   — the dimension the visitor named as their problem
       primaryIn  — the computed primary constraint
       noPrimary  — true when no constraint was named
       flag       — a context flag that must be present */
    insights: [
      { id: "not_marketing", when: { statedIn: ["marketing", "sales"], primaryIn: ["positioning", "offer", "customer", "pricing"] },
        ar: "قد لا تكون مشكلتك في التسويق أصلًا.", en: "Your problem may not be marketing at all." },
      { id: "offer", when: { primaryIn: ["offer"] },
        ar: "زيادة الوصول لن تحل مشكلة عرض غير واضح.", en: "More reach will not fix an unclear offer." },
      { id: "positioning", when: { primaryIn: ["positioning"] },
        ar: "حين لا يعرف العميل لماذا يختارك، يقارنك بالسعر.", en: "When customers can't tell why to choose you, they compare you on price." },
      { id: "pricing", when: { primaryIn: ["pricing"] },
        ar: "السعر قد لا يكون المشكلة؛ القيمة التي يفهمها العميل قد تكون أهم.", en: "Price may not be the problem; the value the customer understands may matter more." },
      { id: "customer", when: { primaryIn: ["customer"] },
        ar: "قبل أن تبحث عن عملاء أكثر، قد تحتاج إلى تحديد العميل الذي تريده أصلًا.", en: "Before looking for more customers, you may need to decide which customer you actually want." },
      { id: "marketing", when: { primaryIn: ["marketing"] },
        ar: "ما لا يُقاس بانتظام يصعب تحسينه.", en: "What isn't measured regularly is hard to improve." },
      { id: "sales", when: { primaryIn: ["sales"] },
        ar: "المبيعات غير المستقرة قد تكون عَرَضًا لا سببًا.", en: "Unstable sales may be a symptom, not the cause." },
      { id: "experience", when: { primaryIn: ["experience"] },
        ar: "قبل البحث عن عملاء جدد، تستحق تجربة من اشتروا فعلًا مراجعة.", en: "Before finding new customers, the experience of those who already bought deserves a review." },
      { id: "systems", when: { primaryIn: ["systems"] },
        ar: "حين يعتمد العمل على شخص واحد، يتوقف النمو عند حدود طاقته.", en: "When the business depends on one person, growth stops at the limit of their capacity." },
      { id: "growth", when: { primaryIn: ["growth"] },
        ar: "التوسع قبل النظام يضاعف الفوضى، لا الإيراد.", en: "Scaling before a system multiplies chaos, not revenue." },
      { id: "unclear", when: { noPrimary: true, flag: "unclear" },
        ar: "أن تقول «لا أعرف» ليس ضعفًا؛ هو نقطة البداية الصحيحة للتشخيص.", en: "Saying “I don't know” isn't a weakness; it is the right starting point for a diagnostic." },
      { id: "balanced", when: { noPrimary: true },
        ar: "قد يكون الوضع متوازنًا — وقد لا تكون الصورة واضحة بعد.", en: "Things may be balanced — or the picture may not be clear yet." }
    ],

    /* UI copy. {i} and {n} are replaced by the interface. */
    copy: {
      introHeading: { ar: "قبل أن تبدأ", en: "Before you begin" },
      introMeta: { ar: "{n} أسئلة · أقل من دقيقتين", en: "{n} questions · under two minutes" },
      introPoints: [
        { ar: "لا نطلب بياناتك قبل أن تحصل على نتيجتك.", en: "We don't ask for your details before you get your result." },
        { ar: "لا يُرسل شيء إلى أي جهة إلا إذا اخترتَ ذلك أنت.", en: "Nothing is sent to anyone unless you choose to send it." },
        { ar: "هذه قراءة أولية مبنية على إجاباتك، وليست تشخيصًا متكاملًا.", en: "This is a preliminary reading based on your answers, not a full diagnostic." }
      ],
      resume: { ar: "متابعة من حيث توقفت", en: "Continue where you left off" },
      restart: { ar: "ابدأ من جديد", en: "Start over" },
      back: { ar: "السابق", en: "Back" },
      next: { ar: "التالي", en: "Next" },
      seeResult: { ar: "اعرض بصمتي", en: "Show my fingerprint" },
      questionLabel: { ar: "السؤال {i} من {n}", en: "Question {i} of {n}" },
      chooseOne: { ar: "اختر إجابة واحدة", en: "Choose one answer" },

      resultTitle: { ar: "بصمتك الاستراتيجية", en: "Your strategic fingerprint" },
      resultSub: { ar: "قراءة أولية مبنية على إجاباتك.", en: "A preliminary reading based on your answers." },
      primary: { ar: "القيد الرئيسي", en: "Primary constraint" },
      secondary: { ar: "القيد الثانوي", en: "Secondary constraint" },
      strongest: { ar: "أقوى منطقة", en: "Strongest area" },
      noSecondary: { ar: "لم يظهر قيد ثانوي واضح.", en: "No clear secondary constraint appeared." },
      noStrongest: { ar: "لم تظهر منطقة قوة واضحة في هذه الإجابات.", en: "No clear area of strength appeared in these answers." },
      meaning: { ar: "ماذا يعني ذلك؟", en: "What does that mean?" },
      reading: { ar: "القراءة الأهم", en: "The key reading" },
      priority: { ar: "الأولوية الاستراتيجية", en: "Strategic priority" },
      nextStep: { ar: "الخطوة المقترحة", en: "Suggested next step" },
      tierHint: { ar: "مستوى التشخيص الأقرب لحالتك غالبًا", en: "The Diagnostic depth most likely to fit" },
      fingerprint: { ar: "بصمتك", en: "Your fingerprint" },
      fingerprintPartial: { ar: "هذه صورة أولية. تظهر التفاصيل الكاملة بعد الاحتفاظ ببصمتك.", en: "This is a first sketch. The full detail appears once you keep your fingerprint." },
      legendTitle: { ar: "مستوى كل بُعد", en: "Level of each dimension" },
      disclaimer: { ar: "هذه قراءة استراتيجية أولية ولا تغني عن التشخيص التجاري المتكامل.", en: "This is a preliminary strategic reading and does not replace a full commercial diagnostic." },

      leadTitle: { ar: "هل تريد الاحتفاظ ببصمتك؟", en: "Would you like to keep your fingerprint?" },
      leadText: {
        ar: "أرسل بياناتك لنتواصل معك حول الخطوة المقترحة. ستفتح لك القراءة الكاملة وملخصًا يمكنك حفظه.",
        en: "Send your details so we can reach out about the suggested next step. You will unlock the full reading and a summary you can save."
      },
      fName: { ar: "الاسم", en: "Name" },
      fBusiness: { ar: "النشاط أو المؤسسة", en: "Business or organisation" },
      fWhatsapp: { ar: "واتساب", en: "WhatsApp" },
      fEmail: { ar: "البريد الإلكتروني", en: "Email" },
      fGoal: { ar: "ما الذي تريد حله أولًا؟ (اختياري)", en: "What do you want to solve first? (optional)" },
      contactNote: { ar: "أدخل واتساب أو بريدًا إلكترونيًا واحدًا على الأقل.", en: "Enter at least one of WhatsApp or email." },
      privacy: { ar: "نستخدم بياناتك للتواصل معك بخصوص هذه القراءة فقط.", en: "We use your details only to contact you about this reading." },
      keep: { ar: "احتفظ ببصمتي", en: "Keep my fingerprint" },
      skip: { ar: "اعرض القراءة الكاملة بدون حفظ", en: "Show the full reading without saving" },
      sending: { ar: "جارٍ الحفظ…", en: "Saving…" },
      saved: { ar: "تم حفظ بصمتك. سنتواصل معك حول الخطوة المقترحة.", en: "Your fingerprint has been saved. We will be in touch about the suggested next step." },
      saveFailed: {
        ar: "تعذّر حفظ بياناتك الآن، ولم يُرسل شيء. يمكنك عرض قراءتك كاملة، أو التواصل معنا مباشرة عبر واتساب.",
        en: "We couldn't save your details right now, and nothing was sent. You can still view your full reading, or reach us directly on WhatsApp."
      },
      errName: { ar: "أدخل اسمك.", en: "Enter your name." },
      errBusiness: { ar: "أدخل اسم نشاطك أو مؤسستك.", en: "Enter your business or organisation." },
      errContact: { ar: "أدخل واتساب أو بريدًا إلكترونيًا واحدًا على الأقل.", en: "Enter at least one of WhatsApp or email." },
      errEmail: { ar: "البريد الإلكتروني غير صحيح.", en: "That email address doesn't look right." },
      errPhone: { ar: "رقم واتساب غير صحيح. استخدم الأرقام مع رمز الدولة.", en: "That WhatsApp number doesn't look right. Use digits with the country code." },

      ctaFull: { ar: "التشخيص المتكامل يتحقق من هذه القراءة بالأدلة والمقابلات والبيانات — وقد يقلبها.", en: "The full Diagnostic tests this reading against evidence, interviews and data — and may overturn it." },
      report: { ar: "تحميل ملخص بصمتك", en: "Download your fingerprint summary" },
      share: { ar: "شارك بصمتك", en: "Share your fingerprint" },
      shareText: { ar: "جرّبت ELMUBARAK Clarity Scan: أسئلة قصيرة لقراءة استراتيجية أولية لنشاطك.", en: "I tried the ELMUBARAK Clarity Scan: a few short questions for a preliminary strategic reading of your business." },
      shareCopied: { ar: "تم نسخ الرابط.", en: "Link copied." },
      shareFailed: { ar: "تعذّرت المشاركة. انسخ الرابط من شريط العنوان.", en: "Sharing isn't available. Copy the link from the address bar." },

      reportHeading: { ar: "ملخص البصمة الاستراتيجية", en: "Strategic fingerprint summary" },
      preparedFor: { ar: "أُعدّ لـ", en: "Prepared for" },
      date: { ar: "التاريخ", en: "Date" },
      print: { ar: "طباعة / حفظ PDF", en: "Print / Save as PDF" },
      backToResult: { ar: "العودة إلى النتيجة", en: "Back to the result" },
      reportContact: { ar: "للنقاش: ", en: "To discuss: " },

      stateError: { ar: "تعذّر عرض هذه الخطوة. أعد تحميل الصفحة أو ابدأ من جديد.", en: "We couldn't show this step. Reload the page or start over." }
    }
  };
})();
