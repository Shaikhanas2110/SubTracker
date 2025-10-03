// ==========================
// Settings Manager Script
// ==========================

// API base URL (local development)
// const API_BASE_URL = "http://localhost:5000/api";
const API_BASE_URL = "https://server-mtye.onrender.com/api";

// ==========================
// SettingsManager Class
// ==========================
// This class manages all user account settings such as
// profile details, password, and preferences (like email reminders).
class SettingsManager {
  constructor() {
    // Load authentication details from local storage
    this.token = localStorage.getItem("authToken");
    this.currentUser = JSON.parse(localStorage.getItem("currentUser"));
    this.userProfile = null;

    // Run initialization steps
    this.checkAuthentication();
    this.loadUserData();
    this.setupEventListeners();
    this.loadProfile();
  }

  // --------------------------
  // Authentication Check
  // --------------------------
  checkAuthentication() {
    if (!this.token || !this.currentUser) {
      window.location.href = "auth.html";
    }
  }

  // --------------------------
  // Load user initials for avatar
  // --------------------------
  loadUserData() {
    if (this.currentUser) {
      const initials = this.currentUser.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);
      document.getElementById("user-avatar").textContent = initials;
    }
  }

  // --------------------------
  // Generic API request helper
  // --------------------------
  async makeRequest(endpoint, method = "GET", data = null) {
    const url = `${API_BASE_URL}${endpoint}`;
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
      },
    };
    if (data) options.body = JSON.stringify(data);

    const response = await fetch(url, options);
    const result = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.clear();
        window.location.href = "auth.html";
      }
      throw new Error(result.message || "Request failed");
    }
    return result;
  }

  // --------------------------
  // Show feedback message
  // --------------------------
  showMessage(elementId, message, type = "error") {
    const el = document.getElementById(elementId);
    el.textContent = message;
    el.className = `message ${type}`;
    el.style.display = "block";
    setTimeout(() => (el.style.display = "none"), 4000);
  }

  // --------------------------
  // Load full user profile
  // --------------------------
  async loadProfile() {
    try {
      const result = await this.makeRequest("/user/profile");
      this.userProfile = result.user;
      this.populateProfileForm();
      this.populatePreferences();
      this.updateAccountInfo();
    } catch (err) {
      console.error("Load profile error:", err);
      this.showMessage("profile-message", "Failed to load profile data");
    }
  }

  // --------------------------
  // Fill profile form with user info
  // --------------------------
  populateProfileForm() {
    if (!this.userProfile) return;
    document.getElementById("name").value = this.userProfile.name;
    document.getElementById("email").value = this.userProfile.email;
  }

  // --------------------------
  // Apply preferences from backend to UI
  // --------------------------
  populatePreferences() {
    if (!this.userProfile?.preferences) return;
    const prefs = this.userProfile.preferences;

    this.setToggle("email-reminders-toggle", prefs.emailReminders);
    this.setToggle("weekly-digest-toggle", prefs.weeklyDigest);
    this.setToggle("monthly-report-toggle", prefs.monthlyReport);

    document.getElementById("reminder-days").value = prefs.reminderDays || 3;
    this.updateReminderDaysVisibility();
  }

  // --------------------------
  // Show account info (member since, last login)
  // --------------------------
  updateAccountInfo() {
    if (!this.userProfile) return;

    const memberSince = new Date(this.userProfile.createdAt).toLocaleDateString(
      "en-US",
      { year: "numeric", month: "long", day: "numeric" }
    );

    const lastLogin = this.userProfile.lastLogin
      ? new Date(this.userProfile.lastLogin).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "Never logged in";

    document.getElementById("member-since").textContent = memberSince;
    document.getElementById("last-login").textContent = lastLogin;
  }

  // --------------------------
  // Toggle Helpers
  // --------------------------
  setToggle(id, active) {
    const toggle = document.getElementById(id);
    active ? toggle.classList.add("active") : toggle.classList.remove("active");
  }

  getToggleState(id) {
    return document.getElementById(id).classList.contains("active");
  }

  updateReminderDaysVisibility() {
    const group = document.getElementById("reminder-days-group");
    group.style.display = this.getToggleState("email-reminders-toggle")
      ? "block"
      : "none";
  }

  // --------------------------
  // Event Listeners
  // --------------------------
  setupEventListeners() {
    // Profile update
    document.getElementById("profile-form").addEventListener("submit", (e) => {
      e.preventDefault();
      this.updateProfile();
    });

    // Password update
    document.getElementById("password-form").addEventListener("submit", (e) => {
      e.preventDefault();
      this.updatePassword();
    });

    // Password strength checker
    document.getElementById("new-password").addEventListener("input", (e) => {
      this.checkPasswordStrength(e.target.value);
    });

    // Toggle listeners (auto-save)
    [
      "email-reminders-toggle",
      "weekly-digest-toggle",
      "monthly-report-toggle",
    ].forEach((id) => {
      document.getElementById(id).addEventListener("click", () => {
        this.toggleSwitch(id);
      });
    });
  }

  setButtonLoading(buttonId, loading = true) {
    const button = document.getElementById(buttonId);
    const btnText = button.querySelector(".btn-text");

    if (loading) {
      button.disabled = true;
      if (btnText) {
        btnText.innerHTML =
          '<span class="loading-spinner"></span> Processing...';
      }
    } else {
      button.disabled = false;
      if (btnText) {
        btnText.textContent = button.id.includes("profile")
          ? "Update Profile"
          : button.id.includes("password")
          ? "Update Password"
          : "Save Preferences";
      }
    }
  }

  // --------------------------
  // Toggle click handler with auto-save
  // --------------------------
  async toggleSwitch(id) {
    const toggle = document.getElementById(id);
    toggle.classList.toggle("active"); // update UI
    this.updateReminderDaysVisibility();

    // auto-save preferences when toggled
    // await this.updatePreferences();
  }

  checkPasswordStrength(password) {
    const strengthElement = document.getElementById("password-strength");
    const strengthText = strengthElement.querySelector(".strength-text");

    let strength = 0;
    let text = "Password strength: ";

    if (password.length >= 6) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    strengthElement.className = "password-strength";

    if (strength < 3) {
      strengthElement.classList.add("strength-weak");
      text += "Weak";
    } else if (strength < 5) {
      strengthElement.classList.add("strength-medium");
      text += "Medium";
    } else {
      strengthElement.classList.add("strength-strong");
      text += "Strong";
    }

    strengthText.textContent = text;
  }

  // --------------------------
  // Profile update API call
  // --------------------------
  async updateProfile() {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();

    if (!name || !email)
      return this.showMessage("profile-message", "Please fill in all fields");

    try {
      const result = await this.makeRequest("/user/profile", "PUT", {
        name,
        email,
      });
      this.currentUser = result.user;
      localStorage.setItem("currentUser", JSON.stringify(this.currentUser));
      this.loadUserData();
      this.showMessage("profile-message", "Profile updated!", "success");
    } catch (err) {
      this.showMessage("profile-message", err.message, "error");
    }
  }

  // --------------------------
  // Password update API call
  // --------------------------
  async updatePassword() {
    const currentPassword = document.getElementById("current-password").value;
    const newPassword = document.getElementById("new-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    if (!currentPassword || !newPassword || !confirmPassword) {
      this.showMessage("password-message", "Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      this.showMessage("password-message", "New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      this.showMessage(
        "password-message",
        "New password must be at least 6 characters"
      );
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      this.showMessage(
        "password-message",
        "Password must contain uppercase, lowercase, and number"
      );
      return;
    }

    try {
      this.setButtonLoading("update-password-btn", true);

      await this.makeRequest("/user/password", "PUT", {
        currentPassword,
        newPassword,
        confirmPassword,
      });

      this.showMessage(
        "password-message",
        "Password updated successfully!",
        "success"
      );
      document.getElementById("password-form").reset();
    } catch (error) {
      console.error("Update password error:", error);
      this.showMessage(
        "password-message",
        error.message || "Failed to update password"
      );
    } finally {
      this.setButtonLoading("update-password-btn", false);
    }
  }

  // --------------------------
  // Preferences update API call
  // --------------------------
  async updatePreferences() {
    const prefs = {
      emailReminders: this.getToggleState("email-reminders-toggle"),
      weeklyDigest: this.getToggleState("weekly-digest-toggle"),
      monthlyReport: this.getToggleState("monthly-report-toggle"),
      reminderDays: parseInt(
        document.getElementById("reminder-days").value || "3"
      ),
    };

    try {
      await this.makeRequest("/user/preferences", "PUT", prefs);
      this.showMessage(
        "preferences-message",
        "Preferences updated!",
        "success"
      );
    } catch (err) {
      this.showMessage("preferences-message", err.message, "error");
    }
  }

  // --------------------------
  // Logout & Deactivate
  // --------------------------
  async logout() {
    await this.makeRequest("/auth/logout", "POST").catch(() => {});
    localStorage.clear();
    window.location.href = "auth.html";
  }

  async deactivateAccount() {
    const confirmWord = prompt('Type "DEACTIVATE" to confirm:');
    if (confirmWord === "DEACTIVATE") {
      await this.makeRequest("/user/account", "DELETE");
      alert("Account deactivated");
      this.logout();
    }
  }
}

// ==========================
// Global functions for HTML buttons
// ==========================
function updatePreferences() {
  settingsManager.updatePreferences();
}
function logout() {
  settingsManager.logout();
}
function deactivateAccount() {
  settingsManager.deactivateAccount();
}
function goBack() {
  window.location.href = "dashboard.html";
}

// ==========================
// Initialize
// ==========================
let settingsManager;
document.addEventListener("DOMContentLoaded", () => {
  settingsManager = new SettingsManager();
});

// =========================
// MOBILE NAVIGATION (for phones/tablets)
// =========================
// Handles hamburger menu, user info, and mobile-friendly navigation
class SubscriptionsMobileNav {
  constructor() {
    this.currentUser = JSON.parse(localStorage.getItem("currentUser"));
    this.mobileMenuBtn = null;
    this.mobileMenu = null;
    this.isMenuOpen = false;
    this.init();
  }

  init() {
    this.createMobileElements();
    this.bindEvents();
    this.handleResize();
  }

  createMobileElements() {
    // Add mobile menu button to existing nav
    const navContainer = document.querySelector(".nav-container");
    if (!navContainer) return;

    // Create mobile menu button
    this.mobileMenuBtn = document.createElement("button");
    this.mobileMenuBtn.className = "mobile-menu-btn";
    this.mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
    this.mobileMenuBtn.setAttribute("aria-label", "Toggle mobile menu");
    this.mobileMenuBtn.setAttribute("aria-expanded", "false");

    // Create mobile menu
    this.mobileMenu = document.createElement("div");
    this.mobileMenu.className = "mobile-menu";
    this.mobileMenu.setAttribute("role", "navigation");
    this.mobileMenu.setAttribute("aria-label", "Mobile navigation");

    // Clone navigation links for mobile
    const navLinks = document.querySelectorAll(".nav-link");
    navLinks.forEach((link) => {
      const mobileLink = document.createElement("a");
      mobileLink.href = link.href;
      mobileLink.className = "mobile-nav-link";
      if (link.classList.contains("active")) {
        mobileLink.classList.add("active");
      }
      mobileLink.innerHTML = link.innerHTML;
      this.mobileMenu.appendChild(mobileLink);
    });

    // Add user info to mobile menu
    const userInfo = document.querySelector(".user-info");
    if (userInfo) {
      const mobileUserInfo = document.createElement("div");
      mobileUserInfo.className = "mobile-user-info";

      const userAvatar = userInfo.querySelector(".user-avatar");
      const userName = userInfo.querySelector(".user-name");
      const userEmail = userInfo.querySelector(".user-email");

      mobileUserInfo.innerHTML = `
        <div class="mobile-user-avatar">${
          userAvatar ? userAvatar.innerHTML : "U"
        }</div>
        <div class="mobile-user-details">
          <div class="mobile-user-name">${
            userName ? userName.textContent : this.currentUser.name
          }</div>
          <div class="mobile-user-email">${
            userEmail ? userEmail.textContent : this.currentUser.email
          }</div>
        </div>
      `;

      this.mobileMenu.appendChild(mobileUserInfo);
    }

    // Insert elements into DOM
    navContainer.appendChild(this.mobileMenuBtn);
    document.querySelector(".header").appendChild(this.mobileMenu);
  }

  bindEvents() {
    if (!this.mobileMenuBtn) return;

    // Mobile menu toggle
    this.mobileMenuBtn.addEventListener("click", (e) => {
      e.preventDefault();
      this.toggleMenu();
    });

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
      if (
        this.isMenuOpen &&
        !this.mobileMenu.contains(e.target) &&
        !this.mobileMenuBtn.contains(e.target)
      ) {
        this.closeMenu();
      }
    });

    // Close menu on escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isMenuOpen) {
        this.closeMenu();
        this.mobileMenuBtn.focus();
      }
    });

    // Close menu when clicking mobile nav links
    this.mobileMenu.querySelectorAll(".mobile-nav-link").forEach((link) => {
      link.addEventListener("click", () => {
        this.closeMenu();
      });
    });

    // Handle window resize
    window.addEventListener("resize", () => {
      this.handleResize();
    });
  }

  toggleMenu() {
    if (this.isMenuOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  openMenu() {
    this.isMenuOpen = true;
    this.mobileMenu.classList.add("active");
    this.mobileMenuBtn.classList.add("active");
    this.mobileMenuBtn.setAttribute("aria-expanded", "true");
    this.mobileMenuBtn.querySelector("i").className = "fas fa-times";

    // Prevent body scroll
    document.body.style.overflow = "hidden";

    // Focus first menu item for accessibility
    const firstLink = this.mobileMenu.querySelector(".mobile-nav-link");
    if (firstLink) {
      setTimeout(() => firstLink.focus(), 100);
    }
  }

  closeMenu() {
    this.isMenuOpen = false;
    this.mobileMenu.classList.remove("active");
    this.mobileMenuBtn.classList.remove("active");
    this.mobileMenuBtn.setAttribute("aria-expanded", "false");
    this.mobileMenuBtn.querySelector("i").className = "fas fa-bars";

    // Restore body scroll
    document.body.style.overflow = "";
  }

  handleResize() {
    // Close mobile menu on desktop
    if (window.innerWidth > 768 && this.isMenuOpen) {
      this.closeMenu();
    }
  }
}

// Initialize mobile navigation when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new SubscriptionsMobileNav();
});
