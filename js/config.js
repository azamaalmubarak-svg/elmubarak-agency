/* ELMUBARAK — central configuration. Edit values here; nothing below is duplicated elsewhere in code. */
(function () {
  "use strict";
  var ELM = (window.ELM = window.ELM || {});

  ELM.config = {
    brand: {
      name: "ELMUBARAK",
      nameAr: "المبارك",
      taglineAr: "نحوّل التعقيد إلى قرار",
      taglineEn: "Turning Complexity into Clarity."
    },

    site: { url: "https://elmubarak-agency.netlify.app" },

    contact: {
      whatsappNumber: "249999920087",
      whatsappDisplay: "+249 99 992 0087",
      email: "azamaalmubarak@gmail.com",
      messages: {
        general: {
          ar: "السلام عليكم، أرغب في مكالمة استكشاف بشأن التشخيص",
          en: "Hello, I would like a discovery call about the Diagnostic"
        },
        scan: {
          ar: "السلام عليكم، أجريت ELMUBARAK Clarity Scan وأرغب في مناقشة نتيجتي",
          en: "Hello, I completed the ELMUBARAK Clarity Scan and would like to discuss my result"
        }
      }
    },

    forms: {
      endpoint: "/",
      contactFormName: "diagnostic-request",
      leadFormName: "clarity-lead",
      timeoutMs: 12000
    },

    scan: {
      version: "1",
      storageKey: "elm.clarity.v1",
      path: "/clarity-scan/"
    },

    analytics: {
      debug: false,
      events: {
        started: "clarity_scan_started",
        answered: "clarity_question_answered",
        completed: "clarity_scan_completed",
        leadSubmitted: "clarity_lead_submitted",
        whatsappClicked: "clarity_whatsapp_clicked",
        reportDownloaded: "clarity_report_downloaded",
        shared: "clarity_result_shared"
      }
    },

    /* Call-to-action labels used by static markup (data-cta="key") and by the scan UI. */
    cta: {
      startScan: { ar: "ابدأ التشخيص", en: "Start the diagnostic" },
      discoverMethod: { ar: "اكتشف منهجنا", en: "Explore our method" },
      discoverFingerprint: { ar: "اكتشف بصمتك", en: "Discover your fingerprint" },
      talk: { ar: "تحدث مع ELMUBARAK", en: "Talk to ELMUBARAK" },
      requestDiagnostic: { ar: "اطلب تشخيصًا متكاملًا", en: "Request the full Diagnostic" },
      startFullDiagnostic: { ar: "ابدأ التشخيص المتكامل", en: "Start the full Diagnostic" }
    }
  };
})();
