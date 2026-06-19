// register.html + login.html validation/submit, each block guards its own form
(function () {
  "use strict";

  function setError(form, field, msg) {
    const input = form.elements[field];
    const errEl = form.querySelector('[data-error="' + field + '"]');
    if (msg) {
      input.classList.add("invalid");
      if (errEl) errEl.textContent = msg;
    } else {
      input.classList.remove("invalid");
      if (errEl) errEl.textContent = "";
    }
  }

  function showAlert(box, type, text) {
    if (!box) return;
    box.className = "form-alert " + type;
    box.textContent = text;
    box.style.display = "block";
  }

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  /* ---------------- Register ---------------- */
  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    const alertBox = document.getElementById("registerAlert");
    const rules = {
      name: {
        test: (v) => /^[A-Za-zЀ-ӿ\s'.-]{2,60}$/.test(v.trim()),
        message: "Please enter your name using letters only (2-60 characters).",
      },
      email: {
        test: (v) => EMAIL_RE.test(v.trim()),
        message: "Please enter a valid email address.",
      },
      password: {
        test: (v) => v.length >= 8 && v.length <= 128 && /[A-Za-z]/.test(v) && /[0-9]/.test(v),
        message: "Password must be 8-128 characters with at least one letter and one digit.",
      },
    };

    function validateField(field) {
      const value = registerForm.elements[field].value;
      if (!value.trim()) {
        setError(registerForm, field, "This field is required.");
        return false;
      }
      if (!rules[field].test(value)) {
        setError(registerForm, field, rules[field].message);
        return false;
      }
      setError(registerForm, field, "");
      return true;
    }

    Object.keys(rules).forEach((field) => {
      registerForm.elements[field].addEventListener("blur", () => validateField(field));
    });

    registerForm.addEventListener("submit", async function (ev) {
      ev.preventDefault();
      let ok = true;
      Object.keys(rules).forEach((field) => {
        if (!validateField(field)) ok = false;
      });
      if (!ok) return;

      const payload = {
        name: registerForm.elements["name"].value.trim(),
        email: registerForm.elements["email"].value.trim(),
        password: registerForm.elements["password"].value,
      };

      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (res.ok && data.ok) {
          window.location.href = "index.html";
        } else {
          showAlert(alertBox, "fail", (data.errors && data.errors.join(" ")) || "Could not create your account.");
        }
      } catch {
        showAlert(alertBox, "fail", "Could not reach the server. Please try again.");
      }
    });
  }

  /* ---------------- Login ---------------- */
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    const alertBox = document.getElementById("loginAlert");

    loginForm.addEventListener("submit", async function (ev) {
      ev.preventDefault();
      const email = loginForm.elements["email"].value.trim();
      const password = loginForm.elements["password"].value;

      if (!EMAIL_RE.test(email) || !password) {
        showAlert(alertBox, "fail", "Please enter a valid email and password.");
        return;
      }

      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (res.ok && data.ok) {
          window.location.href = "index.html";
        } else {
          showAlert(alertBox, "fail", (data.errors && data.errors.join(" ")) || "Invalid email or password.");
        }
      } catch {
        showAlert(alertBox, "fail", "Could not reach the server. Please try again.");
      }
    });
  }
})();
