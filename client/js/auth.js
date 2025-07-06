// API Configuration
const API_BASE_URL = "https://subtracker-backend.onrender.com/api";

// Authentication Manager Class
class AuthManager {
  constructor() {
    this.token = localStorage.getItem("authToken");
    this.user = JSON.parse(localStorage.getItem("currentUser") || "null");
    this.checkExistingAuth();
  }

  async checkExistingAuth() {
    if (this.token && this.user) {
      try {
        const response = await this.makeRequest("/auth/me", "GET");
        if (response.user) {
          this.redirectToDashboard();
        }
      } catch (error) {
        this.logout();
      }
    }
  }

  async makeRequest(endpoint, method = "GET", data = null) {
    const url = `${API_BASE_URL}${endpoint}`;
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (this.token) {
      options.headers["Authorization"] = `Bearer ${this.token}`;
    }

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const result = await response.json();

      if (!response.ok) {
        // Handle specific error codes
        if (
          result.code === "TOKEN_EXPIRED" ||
          result.code === "INVALID_TOKEN"
        ) {
          this.logout();
          window.location.href = "auth.html";
          return;
        }
        throw new Error(result.message || "Request failed");
      }

      return result;
    } catch (error) {
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        throw new Error(
          "Unable to connect to server. Please check if the server is running."
        );
      }
      throw error;
    }
  }

  async login(email, password, remember = false) {
    try {
      const result = await this.makeRequest("/auth/login", "POST", {
        email,
        password,
      });

      this.token = result.token;
      this.user = result.user;

      localStorage.setItem("authToken", this.token);
      localStorage.setItem("currentUser", JSON.stringify(this.user));

      if (remember) {
        localStorage.setItem("rememberUser", "true");
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  async register(name, email, password) {
    try {
      const result = await this.makeRequest("/auth/register", "POST", {
        name,
        email,
        password,
      });

      this.token = result.token;
      this.user = result.user;

      localStorage.setItem("authToken", this.token);
      localStorage.setItem("currentUser", JSON.stringify(this.user));

      return result;
    } catch (error) {
      throw error;
    }
  }

  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("rememberUser");
  }

  redirectToDashboard() {
    window.location.href = "dashboard.html";
  }
}

// Initialize Auth Manager
const authManager = new AuthManager();

// UI Functions
function switchTab(tab) {
  // Update tab buttons
  document.querySelectorAll(".tab-button").forEach((btn) => {
    btn.classList.remove("active");
  });
  document
    .querySelector(`[onclick="switchTab('${tab}')"]`)
    .classList.add("active");

  // Update form containers
  document.querySelectorAll(".form-container").forEach((container) => {
    container.classList.remove("active");
  });
  document.getElementById(`${tab}-form`).classList.add("active");

  // Clear messages
  hideMessages();
}

function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  const toggle = input.nextElementSibling.querySelector("i");

  if (input.type === "password") {
    input.type = "text";
    toggle.classList.remove("fa-eye");
    toggle.classList.add("fa-eye-slash");
  } else {
    input.type = "password";
    toggle.classList.remove("fa-eye-slash");
    toggle.classList.add("fa-eye");
  }
}

function showMessage(message, type = "error") {
  hideMessages();
  const messageElement = document.getElementById(`${type}-message`);
  messageElement.textContent = message;
  messageElement.style.display = "block";
}

function hideMessages() {
  document.getElementById("error-message").style.display = "none";
  document.getElementById("success-message").style.display = "none";
}

function showLoading(show = true) {
  document.getElementById("loading-overlay").classList.toggle("show", show);
}

function setButtonLoading(buttonId, loading = true) {
  const button = document.getElementById(buttonId);
  button.classList.toggle("loading", loading);
  button.disabled = loading;
}

// Form Handlers
async function handleLogin(event) {
  event.preventDefault();

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
    await authManager.login(email, password, remember);
    showMessage("Login successful! Redirecting...", "success");
    setTimeout(() => {
      authManager.redirectToDashboard();
    }, 1500);
  } catch (error) {
    showMessage(error.message || "Login failed. Please try again.");
  } finally {
    setButtonLoading("login-btn", false);
  }
}

async function handleRegister(event) {
  event.preventDefault();

  const name = document.getElementById("register-name").value.trim();
  const email = document.getElementById("register-email").value.trim();
  const password = document.getElementById("register-password").value;
  const confirmPassword = document.getElementById("confirm-password").value;

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

// Auto-fill remembered user
window.addEventListener("load", () => {
  const rememberUser = localStorage.getItem("rememberUser");
  if (rememberUser) {
    document.getElementById("remember-me").checked = true;
  }
});
