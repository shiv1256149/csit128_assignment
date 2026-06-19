// swaps Login/Sign up nav links for greeting+logout if /api/auth/me confirms a session
(function () {
  "use strict";

  const authItem = document.getElementById("navAuthItem");
  const signupItem = document.getElementById("navSignupItem");
  if (!authItem || !signupItem) return;

  fetch("/api/auth/me")
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (!data || !data.user) return;

      authItem.innerHTML = `<span style="padding: 9px 8px; display: inline-block; color: var(--muted)">Hi, ${escapeHtml(data.user.name)}</span>`;
      signupItem.innerHTML = "";
      const logoutBtn = document.createElement("button");
      logoutBtn.type = "button";
      logoutBtn.className = "btn btn--ghost";
      logoutBtn.style.padding = "8px 16px";
      logoutBtn.style.fontSize = "0.9rem";
      logoutBtn.textContent = "Log out";
      logoutBtn.addEventListener("click", function () {
        fetch("/api/auth/logout", { method: "POST" }).then(() => location.reload());
      });
      signupItem.appendChild(logoutBtn);
    })
    .catch(() => {});

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
})();
