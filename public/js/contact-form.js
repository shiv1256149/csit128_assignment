/* Client-side validation for the contact form. No backend persistence —
   on success it opens the visitor's email client via a mailto: link
   addressed to hello@veyra.tech with the message pre-filled. */
(function () {
  "use strict";

  const form = document.getElementById("contactForm");
  if (!form) return;

  const alertBox = document.getElementById("contactAlert");

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

  form.addEventListener("submit", function (ev) {
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
    const subject = form.elements["subject"].value.trim();
    const message = form.elements["message"].value.trim();
    const body = "From: " + name + " (" + form.elements["email"].value.trim() + ")\n\n" + message;

    window.location.href =
      "mailto:hello@veyra.tech?subject=" +
      encodeURIComponent(subject) +
      "&body=" +
      encodeURIComponent(body);

    showAlert("success", "Your email client should now open with the message ready to send.");
  });
})();
