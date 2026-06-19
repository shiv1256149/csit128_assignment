// contact form: validates client-side, posts to /api/contact (admin sees it under Contact requests)
(function () {
  "use strict";

  const form = document.getElementById("contactForm");
  if (!form) return;

  const alertBox = document.getElementById("contactAlert");

  // prefill subject from ?subject= query param (service/product CTA links)
  const presetSubject = new URLSearchParams(window.location.search).get("subject");
  if (presetSubject) form.elements["subject"].value = presetSubject.slice(0, 120);

  const rules = {
    name: {
      test: (v) => /^[A-Za-zЀ-ӿ\s'.-]{2,60}$/.test(v.trim()),
      message: "Please enter your name using letters only (2-60 characters).",
    },
    email: {
      test: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
      message: "Please enter a valid email address, e.g. name@example.com.",
    },
    subject: {
      test: (v) => v.trim().length >= 3 && v.trim().length <= 120,
      message: "Subject must be between 3 and 120 characters.",
    },
    message: {
      test: (v) => v.trim().length >= 10 && v.trim().length <= 800,
      message: "Your message must be between 10 and 800 characters.",
    },
  };

  function setError(field, msg) {
    const input = form.elements[field];
    const errEl = document.querySelector('[data-error="' + field + '"]');
    if (msg) {
      input.classList.add("invalid");
      input.setAttribute("aria-invalid", "true");
      if (errEl) errEl.textContent = msg;
    } else {
      input.classList.remove("invalid");
      input.removeAttribute("aria-invalid");
      if (errEl) errEl.textContent = "";
    }
  }

  function validateField(field) {
    const value = form.elements[field].value;
    const rule = rules[field];
    if (!value.trim()) {
      setError(field, "This field is required.");
      return false;
    }
    if (!rule.test(value)) {
      setError(field, rule.message);
      return false;
    }
    setError(field, "");
    return true;
  }

  Object.keys(rules).forEach(function (field) {
    const el = form.elements[field];
    if (!el) return;
    el.addEventListener("blur", function () {
      validateField(field);
    });
    el.addEventListener("input", function () {
      if (el.classList.contains("invalid")) validateField(field);
    });
  });

  function showAlert(type, text) {
    if (!alertBox) return;
    alertBox.className = "form-alert " + type;
    alertBox.textContent = text;
    alertBox.style.display = "block";
  }

  form.addEventListener("submit", async function (ev) {
    ev.preventDefault();
    if (alertBox) alertBox.style.display = "none";

    if (form.elements["website"] && form.elements["website"].value) return; // honeypot

    let ok = true;
    Object.keys(rules).forEach(function (field) {
      if (!validateField(field)) ok = false;
    });
    if (!ok) {
      showAlert("fail", "Please fix the highlighted fields and try again.");
      const firstInvalid = form.querySelector(".invalid");
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    const name = form.elements["name"].value.trim();
    const email = form.elements["email"].value.trim();
    const subject = form.elements["subject"].value.trim();
    const message = form.elements["message"].value.trim();

    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        showAlert("success", "Message sent. We'll get back to you soon.");
        form.reset();
      } else {
        showAlert("fail", (data.errors && data.errors[0]) || "Unable to send your message.");
      }
    } catch {
      showAlert("fail", "Unable to send your message. Please try again later.");
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
})();
