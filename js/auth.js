// =========================
// API CONFIGURATION
// =========================
// This is the base URL where our backend server (API) is running.
// All requests like login, register, or get user info will be sent here.
// const API_BASE_URL = "http://localhost:5000/api";
const API_BASE_URL = "https://server-mtye.onrender.com/api";

// =========================
// AUTHENTICATION MANAGER
// =========================
// This class (a reusable "blueprint") handles everything related to login,
// registration, checking if a user is logged in, saving data, and logging out.
class AuthManager {
  constructor() {
    // Retrieve saved login info (if available) from the browser
    this.token = localStorage.getItem("authToken"); // a "key" that proves you're logged in
    this.user = JSON.parse(localStorage.getItem("currentUser") || "null"); // saved user info

    // If login info already exists, check if it's still valid
    this.checkExistingAuth();
  }

  // Check if the saved login details are still valid
  async checkExistingAuth() {
    if (this.token && this.user) {
      try {
        // Ask the server if the current login token is still valid
        const response = await this.makeRequest("/auth/me", "GET");

        // If valid, send the user directly to the dashboard
        if (response.user) {
          this.redirectToDashboard();
        }
      } catch (error) {
        // If not valid, log the user out
        this.logout();
      }
    }
  }

  // Function to talk to the server (backend API)
  async makeRequest(endpoint, method = "GET", data = null) {
    const url = `${API_BASE_URL}${endpoint}`;
    const options = {
      method,
      headers: {
        "Content-Type": "application/json", // we send and expect JSON data
      },
    };

    // If logged in, attach the saved "token" so the server knows who we are
    if (this.token) {
      options.headers["Authorization"] = `Bearer ${this.token}`;
    }

    // If we have data (like email/password), include it in the request
    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      // Send the request to the server
      const response = await fetch(url, options);
      const result = await response.json();

      // If something went wrong (like expired login), handle it
      if (!response.ok) {
        if (
          result.code === "TOKEN_EXPIRED" ||
          result.code === "INVALID_TOKEN"
        ) {
          this.logout();
          window.location.href = "auth.html"; // back to login page
          return;
        }
        throw new Error(result.message || "Request failed");
      }

      return result; // return what the server replied with
    } catch (error) {
      // Handle "server not running" error
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        throw new Error(
          "Unable to connect to server. Please check if the server is running."
        );
      }
      throw error;
    }
  }

  // Login with email and password
  async login(email, password, remember = false) {
    try {
      const result = await this.makeRequest("/auth/login", "POST", {
        email,
        password,
      });

      // Save login details
      this.token = result.token;
      this.user = result.user;

      localStorage.setItem("authToken", this.token);
      localStorage.setItem("currentUser", JSON.stringify(this.user));

      // If "remember me" is checked, save that choice
      if (remember) {
        localStorage.setItem("rememberUser", "true");
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  // Register (create new account)
  async register(name, email, password) {
    try {
      const result = await this.makeRequest("/auth/register", "POST", {
        name,
        email,
        password,
      });

      // Save login details (same as login)
      this.token = result.token;
      this.user = result.user;

      localStorage.setItem("authToken", this.token);
      localStorage.setItem("currentUser", JSON.stringify(this.user));

      return result;
    } catch (error) {
      throw error;
    }
  }

  // Log the user out (clear all saved info)
  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("rememberUser");
  }

  // Send user to the dashboard (main page after login)
  redirectToDashboard() {
    window.location.href = "subscriptions.html";
  }

  redirectToAdmin() {
    window.location.href = "admin.html";
  }
}

// Create a new "AuthManager" so we can use it in the page
const authManager = new AuthManager();

// =========================
// UI (USER INTERFACE) FUNCTIONS
// =========================

// Switch between login and registration forms
function switchTab(tab) {
  // Update the tab button appearance
  document.querySelectorAll(".tab-button").forEach((btn) => {
    btn.classList.remove("active");
  });
  document
    .querySelector(`[onclick="switchTab('${tab}')"]`)
    .classList.add("active");

  // Show the correct form (login or register)
  document.querySelectorAll(".form-container").forEach((container) => {
    container.classList.remove("active");
  });
  document.getElementById(`${tab}-form`).classList.add("active");

  // Clear any messages
  hideMessages();
}

// Show or hide password text
function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  const toggle = input.nextElementSibling.querySelector("i");

  if (input.type === "password") {
    input.type = "text"; // show password
    toggle.classList.remove("fa-eye");
    toggle.classList.add("fa-eye-slash");
  } else {
    input.type = "password"; // hide password
    toggle.classList.remove("fa-eye-slash");
    toggle.classList.add("fa-eye");
  }
}

// Show a message to the user (error or success)
function showMessage(message, type = "error") {
  hideMessages();
  const messageElement = document.getElementById(`${type}-message`);
  messageElement.textContent = message;
  messageElement.style.display = "block";
}

// Hide all messages
function hideMessages() {
  document.getElementById("error-message").style.display = "none";
  document.getElementById("success-message").style.display = "none";
}

// Show or hide the "loading" overlay screen
function showLoading(show = true) {
  document.getElementById("loading-overlay").classList.toggle("show", show);
}

// Change a button to show loading state
function setButtonLoading(buttonId, loading = true) {
  const button = document.getElementById(buttonId);
  button.classList.toggle("loading", loading);
  button.disabled = loading;
}

// =========================
// FORM HANDLERS
// =========================

// Handle login form submit
async function handleLogin(event) {
  event.preventDefault(); // stop page refresh

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  const remember = document.getElementById("remember-me").checked;

  if (!email || !password) {
    showMessage("Please fill in all fields");
    return;
  }

  setButtonLoading("login-btn", true);
  hideMessages();

  try {
    const data = await authManager.login(email, password, remember);
    console.log(data.user.isAdmin);
    showMessage("Login successful! Redirecting...", "success");

    setTimeout(() => {
      if (data.user.isAdmin) {
        authManager.redirectToAdmin(); // redirect admin
      } else {
        authManager.redirectToDashboard(); // normal user
      }
    }, 1500); // wait 1.5 seconds before redirect
  } catch (error) {
    showMessage(error.message || "Login failed. Please try again.");
  } finally {
    setButtonLoading("login-btn", false);
  }
}

// Handle register form submit
async function handleRegister(event) {
  event.preventDefault(); // stop page refresh

  const name = document.getElementById("register-name").value.trim();
  const email = document.getElementById("register-email").value.trim();
  const password = document.getElementById("register-password").value;
  const confirmPassword = document.getElementById("confirm-password").value;

  // Validate the form
  if (!name || !email || !password || !confirmPassword) {
    showMessage("Please fill in all fields");
    return;
  }

  if (name.length < 2) {
    showMessage("Name must be at least 2 characters long");
    return;
  }

  if (!/^[a-zA-Z\s]+$/.test(name)) {
    showMessage("Name can only contain letters and spaces");
    return;
  }

  if (password !== confirmPassword) {
    showMessage("Passwords do not match");
    return;
  }

  if (password.length < 6) {
    showMessage("Password must be at least 6 characters long");
    return;
  }

  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    showMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    );
    return;
  }

  setButtonLoading("register-btn", true);
  hideMessages();

  try {
    await authManager.register(name, email, password);
    showMessage("Account created successfully! Redirecting...", "success");
    setTimeout(() => {
      authManager.redirectToDashboard();
    }, 1500);
  } catch (error) {
    console.error("Registration error:", error);
    showMessage(error.message || "Registration failed. Please try again.");
  } finally {
    setButtonLoading("register-btn", false);
  }
}

// =========================
// REMEMBER ME FEATURE
// =========================
// When the page loads, check if "Remember Me" was selected earlier.
// If yes, keep the checkbox selected.
window.addEventListener("load", () => {
  const rememberUser = localStorage.getItem("rememberUser");
  if (rememberUser) {
    document.getElementById("remember-me").checked = true;
  }
});
