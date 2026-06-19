// feedback form: live validation + honeypot, posts to /api/comments (server re-validates, this is UX only)

(function () {
  "use strict";

  const form = document.getElementById("commentForm");
  if (!form) return; // not on this page

  const alertBox = document.getElementById("formAlert");
  const countEl = document.getElementById("charCount");
  const messageEl = form.elements["message"];

  // Validation rules: field name -> { test, message }.
  const rules = {
    name: {
      test: (v) => /^[A-Za-z\u0400-\u04FF\s'.-]{2,60}$/.test(v.trim()),
      message: "Please enter your name using letters only (2-60 characters).",
    },
    email: {
      test: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
      message: "Please enter a valid email address, e.g. name@example.com.",
    },
    rating: {
      test: (v) => /^[1-5]$/.test(v),
      message: "Please choose a rating from 1 to 5.",
    },
    message: {
      test: (v) => v.trim().length >= 10 && v.trim().length <= 500,
      message: "Your comment must be between 10 and 500 characters.",
    },
  };

  // Show / clear the error message for a single field.
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

  // Validate one field; return true if valid.
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

  // Live validation on blur for each ruled field.
  Object.keys(rules).forEach(function (field) {
    const el = form.elements[field];
    if (el)
      el.addEventListener("blur", function () {
        validateField(field);
      });
    if (el)
      el.addEventListener("input", function () {
        if (el.classList.contains("invalid")) validateField(field);
      });
  });

  // Live character counter for the message box.
  if (messageEl && countEl) {
    const update = () => {
      countEl.textContent = messageEl.value.length + " / 500";
    };
    messageEl.addEventListener("input", update);
    update();
  }

  function showAlert(type, text) {
    if (!alertBox) return;
    alertBox.className = "form-alert " + type;
    alertBox.textContent = text;
    alertBox.style.display = "block";
  }

  // Handle submit.
  form.addEventListener("submit", async function (ev) {
    ev.preventDefault();
    if (alertBox) alertBox.style.display = "none";

    // Honeypot: if the hidden field is filled, silently reject (a bot).
    if (form.elements["website"] && form.elements["website"].value) return;

    // Validate every field; collect overall result.
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

    // Build the payload and POST it to the API.
    const payload = {
      name: form.elements["name"].value,
      email: form.elements["email"].value,
      rating: form.elements["rating"].value,
      message: form.elements["message"].value,
    };

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        showAlert("success", "Thank you! Your comment has been posted below.");
        form.reset();
        if (countEl) countEl.textContent = "0 / 500";
        if (window.refreshComments) window.refreshComments(); // refresh the list
      } else {
        const msg =
          (data.errors && data.errors.join(" ")) || "Something went wrong. Please try again.";
        showAlert("fail", msg);
      }
    } catch {
      showAlert("fail", "Could not reach the server. Please check your connection and try again.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Post comment";
    }
  });
})();
