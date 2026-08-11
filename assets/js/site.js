/* ============================================================
   Young Master Challenge — LATAM landing pages
   Two-step lead form, validation, Meta Pixel events, UI polish.
   Copy for messages comes from window.YM_I18N, set per page.
   ============================================================ */

(function () {
  "use strict";

  var t = window.YM_I18N || {};
  var track = function (event, params) {
    if (typeof window.fbq === "function") window.fbq("track", event, params || {});
  };

  /* ---------- reveal on scroll ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: .08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- sticky mobile CTA (appears once hero form scrolls away) ---------- */
  var mcta = document.querySelector(".mobile-cta");
  var hero = document.getElementById("form-card");
  if (mcta && hero) {
    document.body.classList.add("has-mobile-cta");
    var hio = new IntersectionObserver(function (entries) {
      mcta.classList.toggle("show", !entries[0].isIntersecting);
    }, { threshold: 0 });
    hio.observe(hero);
  }

  /* ---------- scroll depth -> Meta (helps optimise the ad set) ---------- */
  var depthHit = {};
  window.addEventListener("scroll", function () {
    var d = document.documentElement;
    var pct = (d.scrollTop + window.innerHeight) / d.scrollHeight * 100;
    [50, 90].forEach(function (mark) {
      if (pct >= mark && !depthHit[mark]) {
        depthHit[mark] = true;
        if (typeof window.fbq === "function") window.fbq("trackCustom", "ScrollDepth", { percent: mark });
      }
    });
  }, { passive: true });

  /* ---------- the form ---------- */
  var form = document.getElementById("lead-form");
  if (!form) return;

  var steps = form.querySelectorAll(".form-step");
  // .progress sits in the card above the <form>, so scope this to the card, not the form.
  var bars = document.querySelectorAll("#form-card .progress span");
  var current = 0;
  var startedTracked = false;

  function showStep(i) {
    steps.forEach(function (s, idx) { s.hidden = idx !== i; });
    bars.forEach(function (b, idx) { b.classList.toggle("on", idx <= i); });
    current = i;
  }

  function setError(field, message) {
    field.classList.add("err");
    var msg = field.querySelector(".msg");
    if (msg) msg.textContent = message;
  }

  function clearError(field) { field.classList.remove("err"); }

  function validate(input) {
    var field = input.closest(".field");
    if (!field) return true;
    var value = (input.value || "").trim();

    if (input.hasAttribute("required") && !value) {
      setError(field, t.required || "This field is required");
      return false;
    }
    if (input.type === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      setError(field, t.email || "Please enter a valid email");
      return false;
    }
    if (input.dataset.phone && value) {
      var digits = value.replace(/\D/g, "");
      if (digits.length < 8) {
        setError(field, t.phone || "Please enter a valid phone number");
        return false;
      }
    }
    clearError(field);
    return true;
  }

  // live-clear errors as the user types
  form.querySelectorAll("input, select").forEach(function (input) {
    input.addEventListener("input", function () {
      var field = input.closest(".field");
      if (field && field.classList.contains("err")) validate(input);
      if (!startedTracked) {
        startedTracked = true;
        if (typeof window.fbq === "function") window.fbq("trackCustom", "FormStarted");
      }
    });
    input.addEventListener("blur", function () { if (input.value.trim()) validate(input); });
  });

  function validateStep(i) {
    var ok = true;
    var firstBad = null;
    steps[i].querySelectorAll("input, select").forEach(function (input) {
      if (input.type === "checkbox") {
        var field = input.closest(".consent");
        if (input.hasAttribute("required") && !input.checked) {
          ok = false;
          if (field) field.style.color = "var(--red)";
          if (!firstBad) firstBad = input;
        } else if (field) {
          field.style.color = "";
        }
        return;
      }
      if (!validate(input)) {
        ok = false;
        if (!firstBad) firstBad = input;
      }
    });
    if (firstBad) firstBad.focus();
    return ok;
  }

  form.querySelectorAll("[data-next]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (!validateStep(current)) return;
      showStep(current + 1);
      form.scrollIntoView({ behavior: "smooth", block: "center" });
      if (typeof window.fbq === "function") window.fbq("trackCustom", "FormStep2");
    });
  });

  form.querySelectorAll("[data-back]").forEach(function (btn) {
    btn.addEventListener("click", function () { showStep(current - 1); });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!validateStep(current)) return;

    var btn = form.querySelector("[data-submit]");
    var original = btn.textContent;
    btn.disabled = true;
    btn.textContent = t.sending || "Sending…";

    var data = {};
    new FormData(form).forEach(function (v, k) { data[k] = v; });
    data.locale = document.documentElement.lang;
    data.market = form.dataset.market || "";
    data.page = location.pathname;
    data.referrer = document.referrer || "";

    // carry Meta / UTM click attribution through to the lead record
    var qs = new URLSearchParams(location.search);
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"].forEach(function (k) {
      if (qs.get(k)) data[k] = qs.get(k);
    });

    fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
      .catch(function () { /* demo mode: never block the confirmation on a network error */ })
      .then(function () {
        track("Lead", { content_name: "school_registration", content_category: data.market });
        track("CompleteRegistration", { content_name: "school_registration" });
        document.getElementById("form-steps").hidden = true;
        document.querySelector(".progress").hidden = true;
        document.getElementById("form-done").hidden = false;
        document.getElementById("form-card").scrollIntoView({ behavior: "smooth", block: "center" });
        btn.disabled = false;
        btn.textContent = original;
      });
  });

  /* ---------- CTA buttons scroll to the form and focus the first field ---------- */
  document.querySelectorAll('a[href="#form-card"]').forEach(function (a) {
    a.addEventListener("click", function () {
      if (typeof window.fbq === "function") window.fbq("trackCustom", "CTAClick", { label: a.dataset.cta || "" });
      setTimeout(function () {
        var first = form.querySelector('input:not([type="hidden"])');
        if (first && window.innerWidth > 980) first.focus({ preventScroll: true });
      }, 620);
    });
  });

  showStep(0);
})();
