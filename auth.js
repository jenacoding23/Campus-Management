/* Smart Campus 360 - local demo sign-up/login gate.
   The existing dashboard data key (smartCampus360.v1) is deliberately untouched/shared. */
(() => {
  "use strict";

  const USERS_KEY = "smartCampus360.users.v1";
  const SESSION_KEY = "smartCampus360.session.v1";
  const $ = (selector) => document.querySelector(selector);

  function readUsers() {
    try {
      const value = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
      return Array.isArray(value) ? value : [];
    } catch (_) {
      return [];
    }
  }

  function writeUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function makeSalt() {
    const bytes = new Uint8Array(16);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(bytes);
    else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
  }

  async function passwordHash(password, salt) {
    if (window.crypto && crypto.subtle && window.TextEncoder) {
      const bytes = new TextEncoder().encode(`${salt}:${password}`);
      const digest = await crypto.subtle.digest("SHA-256", bytes);
      return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
    }
    // Compatibility fallback for local demo use only; never use this for real credentials.
    return btoa(unescape(encodeURIComponent(`${salt}:${password}`)));
  }

  function initials(name) {
    return String(name || "Student").trim().split(/\s+/).slice(0, 2).map(part => part[0] || "").join("").toUpperCase() || "S";
  }

  function applyUser(user) {
    window.campusCurrentUser = user || null;
    if (!user) return;
    const name = user.name || "Student";
    const course = user.course || "Student";
    const greetingName = $("#loggedInName");
    const profileName = $("#profileDisplayName");
    const profileCourse = $("#profileCourse");
    const profileInitials = $("#profileInitials");
    if (greetingName) greetingName.textContent = name;
    if (profileName) profileName.textContent = name;
    if (profileCourse) profileCourse.textContent = course;
    if (profileInitials) profileInitials.textContent = initials(name);
  }

  function showLogin() {
    document.body.classList.remove("campus-authenticated");
    $("#authPage").hidden = false;
    $(".app-shell").hidden = true;
    setMode("login");
    const message = $("#loginMessage");
    if (message) { message.textContent = ""; message.classList.remove("success"); }
  }

  function showPortal(user) {
    applyUser(user);
    $("#authPage").hidden = true;
    $(".app-shell").hidden = false;
    document.body.classList.add("campus-authenticated");
    window.dispatchEvent(new CustomEvent("campus360:authenticated", { detail: user }));
  }

  function setMode(mode) {
    const login = mode === "login";
    $("#loginForm").hidden = !login;
    $("#signupForm").hidden = login;
    $("#loginTab").classList.toggle("active", login);
    $("#signupTab").classList.toggle("active", !login);
    $("#loginTab").setAttribute("aria-selected", String(login));
    $("#signupTab").setAttribute("aria-selected", String(!login));
    $("#authHeading").textContent = login ? "Welcome back" : "Create your account";
    $("#authSubheading").textContent = login
      ? "Log in to continue to your campus dashboard."
      : "Enter your details to get started with Campus360.";
    $("#loginMessage").textContent = "";
    $("#signupMessage").textContent = "";
  }

  function setMessage(id, message, success = false) {
    const element = $(id);
    if (!element) return;
    element.textContent = message;
    element.classList.toggle("success", success);
  }

  function saveSession(user) {
    const sessionUser = { name: user.name, email: user.email, course: user.course };
    // Store only for the active tab; a fresh page launch requires login.
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    showPortal(sessionUser);
  }

  function logout() {
    if (!confirm("Do you want to log out of Smart Campus 360?")) return;
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    window.campusCurrentUser = null;
    document.body.classList.remove("campus-authenticated");
    showLogin();
    $("#loginPassword").value = "";
  }

  function bindAuth() {
    $("#loginTab").addEventListener("click", () => setMode("login"));
    $("#signupTab").addEventListener("click", () => setMode("signup"));
    document.querySelectorAll("[data-open-signup]").forEach(button => button.addEventListener("click", () => setMode("signup")));
    document.querySelectorAll("[data-open-login]").forEach(button => button.addEventListener("click", () => setMode("login")));

    document.querySelectorAll("[data-toggle-password]").forEach(button => {
      button.addEventListener("click", () => {
        const input = $("#" + button.dataset.togglePassword);
        const show = input.type === "password";
        input.type = show ? "text" : "password";
        button.innerHTML = `<i class="bi ${show ? "bi-eye-slash" : "bi-eye"}"></i>`;
        button.setAttribute("aria-label", show ? "Hide password" : "Show password");
      });
    });

    $("#signupForm").addEventListener("submit", async event => {
      event.preventDefault();
      setMessage("#signupMessage", "");
      const name = $("#signupName").value.trim().replace(/\s+/g, " ");
      const email = $("#signupEmail").value.trim().toLowerCase();
      const course = $("#signupCourse").value.trim();
      const password = $("#signupPassword").value;
      const confirmPassword = $("#signupConfirm").value;

      if (!name || !email || !course || !password || !confirmPassword) {
        setMessage("#signupMessage", "Please fill in all the details."); return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setMessage("#signupMessage", "Please enter a valid email address."); return; }
      if (name.length < 2) { setMessage("#signupMessage", "Please enter your full name."); return; }
      if (password.length < 6) { setMessage("#signupMessage", "Password must be at least 6 characters."); return; }
      if (password !== confirmPassword) { setMessage("#signupMessage", "Passwords do not match."); return; }

      const users = readUsers();
      if (users.some(user => user.email === email)) {
        setMessage("#signupMessage", "An account with this email already exists. Please log in."); return;
      }

      try {
        const salt = makeSalt();
        const hash = await passwordHash(password, salt);
        users.push({ name, email, course, salt, passwordHash: hash, createdAt: new Date().toISOString() });
        writeUsers(users);
        $("#loginEmail").value = email;
        $("#loginPassword").value = "";
        $("#signupForm").reset();
        setMode("login");
        setMessage("#loginMessage", "Account created successfully. Please log in.", true);
      } catch (error) {
        console.error("Account creation failed:", error);
        setMessage("#signupMessage", "Could not create the account in this browser. Please try again.");
      }
    });

    $("#loginForm").addEventListener("submit", async event => {
      event.preventDefault();
      setMessage("#loginMessage", "");
      const email = $("#loginEmail").value.trim().toLowerCase();
      const password = $("#loginPassword").value;
      if (!email || !password) { setMessage("#loginMessage", "Enter your email and password."); return; }

      const user = readUsers().find(item => item.email === email);
      if (!user) { setMessage("#loginMessage", "Account not found. Please sign up first."); return; }
      try {
        const hash = await passwordHash(password, user.salt);
        if (hash !== user.passwordHash) { setMessage("#loginMessage", "Incorrect password. Please try again."); return; }
        saveSession(user);
      } catch (error) {
        console.error("Login failed:", error);
        setMessage("#loginMessage", "Could not log in. Please try again.");
      }
    });

    $("#logoutButton")?.addEventListener("click", logout);
    $("#topbarLogoutButton")?.addEventListener("click", logout);

    // The profile row also remains a logout shortcut.
    $("#profileButton")?.addEventListener("click", event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      logout();
    }, true);
  }

  function restoreSession() {
    // Never restore an old persistent login on a fresh page launch.
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    window.campusCurrentUser = null;
    document.body.classList.remove("campus-authenticated");
    showLogin();
  }

  bindAuth();
  restoreSession();
})();
