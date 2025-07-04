// API Configuration
const API_BASE_URL = "https://subtracker-backend.onrender.com/api";

// Settings Manager Class
class SettingsManager {
  constructor() {
    this.token = localStorage.getItem("authToken");
    this.currentUser = JSON.parse(localStorage.getItem("currentUser"));
    this.userProfile = null;

    this.checkAuthentication();
    this.loadUserData();
    this.setupEventListeners();
    this.loadProfile();
  }

  checkAuthentication() {
    if (!this.token || !this.currentUser) {
      window.location.href = "auth.html";
      return;
    }
  }

  loadUserData() {
    if (this.currentUser) {
      const initials = this.currentUser.name
        .split(" ")
        .map((name) => name[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);
      document.getElementById("user-avatar").textContent = initials;
    }
  }

  async makeRequest(endpoint, method = "GET", data = null) {
    const url = `${API_BASE_URL}${endpoint}`;
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
      },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("authToken");
          localStorage.removeItem("currentUser");
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

  showMessage(elementId, message, type = "error") {
    const messageElement = document.getElementById(elementId);
    messageElement.textContent = message;
    messageElement.className = `message ${type}`;
    messageElement.style.display = "block";

    setTimeout(() => {
      messageElement.style.display = "none";
    }, 5000);
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

  async loadProfile() {
    try {
      const result = await this.makeRequest("/user/profile");
      this.userProfile = result.user;
      this.populateProfileForm();
      this.populatePreferences();
      this.updateAccountInfo();
    } catch (error) {
      console.error("Load profile error:", error);
      this.showMessage("profile-message", "Failed to load profile data");
    }
  }

  populateProfileForm() {
    if (this.userProfile) {
      document.getElementById("name").value = this.userProfile.name;
      document.getElementById("email").value = this.userProfile.email;
    }
  }

  populatePreferences() {
    if (this.userProfile && this.userProfile.preferences) {
      const prefs = this.userProfile.preferences;

      this.setToggle("email-reminders-toggle", prefs.emailReminders);
      this.setToggle("weekly-digest-toggle", prefs.weeklyDigest);
      this.setToggle("monthly-report-toggle", prefs.monthlyReport);

      document.getElementById("reminder-days").value = prefs.reminderDays || 3;
      this.updateReminderDaysVisibility();
    }
  }

  updateAccountInfo() {
    if (this.userProfile) {
      const memberSince = new Date(
        this.userProfile.createdAt
      ).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

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
  }

  setToggle(toggleId, active) {
    const toggle = document.getElementById(toggleId);
    if (active) {
      toggle.classList.add("active");
    } else {
      toggle.classList.remove("active");
    }
  }

  getToggleState(toggleId) {
    return document.getElementById(toggleId).classList.contains("active");
  }

  updateReminderDaysVisibility() {
    const reminderGroup = document.getElementById("reminder-days-group");
    const emailRemindersActive = this.getToggleState("email-reminders-toggle");

    if (emailRemindersActive) {
      reminderGroup.style.display = "block";
    } else {
      reminderGroup.style.display = "none";
    }
  }

  setupEventListeners() {
    // Profile form
    document.getElementById("profile-form").addEventListener("submit", (e) => {
      e.preventDefault();
      this.updateProfile();
    });

    // Password form
    document.getElementById("password-form").addEventListener("submit", (e) => {
      e.preventDefault();
      this.updatePassword();
    });

    // Password strength checker
    document.getElementById("new-password").addEventListener("input", (e) => {
      this.checkPasswordStrength(e.target.value);
    });

    // Toggle switches
    document
      .getElementById("email-reminders-toggle")
      .addEventListener("click", () => {
        this.toggleSwitch("email-reminders-toggle");
        this.updateReminderDaysVisibility();
      });

    document
      .getElementById("weekly-digest-toggle")
      .addEventListener("click", () => {
        this.toggleSwitch("weekly-digest-toggle");
      });

    document
      .getElementById("monthly-report-toggle")
      .addEventListener("click", () => {
        this.toggleSwitch("monthly-report-toggle");
      });
  }

  toggleSwitch(toggleId) {
    const toggle = document.getElementById(toggleId);
    toggle.classList.toggle("active");
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

  async updateProfile() {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();

    if (!name || !email) {
      this.showMessage("profile-message", "Please fill in all fields");
      return;
    }

    if (!/^[a-zA-Z\s]+$/.test(name)) {
      this.showMessage(
        "profile-message",
        "Name can only contain letters and spaces"
      );
      return;
    }

    try {
      this.setButtonLoading("update-profile-btn", true);

      const result = await this.makeRequest("/user/profile", "PUT", {
        name,
        email,
      });

      // Update local storage
      this.currentUser = result.user;
      localStorage.setItem("currentUser", JSON.stringify(this.currentUser));

      this.showMessage(
        "profile-message",
        "Profile updated successfully!",
        "success"
      );
      this.loadUserData(); // Update avatar
    } catch (error) {
      console.error("Update profile error:", error);
      this.showMessage(
        "profile-message",
        error.message || "Failed to update profile"
      );
    } finally {
      this.setButtonLoading("update-profile-btn", false);
    }
  }

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

  async updatePreferences() {
    try {
      this.setButtonLoading("update-preferences-btn", true);

      const preferences = {
        emailReminders: this.getToggleState("email-reminders-toggle"),
        reminderDays: parseInt(document.getElementById("reminder-days").value),
        weeklyDigest: this.getToggleState("weekly-digest-toggle"),
        monthlyReport: this.getToggleState("monthly-report-toggle"),
      };

      await this.makeRequest("/user/preferences", "PUT", preferences);

      this.showMessage(
        "preferences-message",
        "Preferences updated successfully!",
        "success"
      );
    } catch (error) {
      console.error("Update preferences error:", error);
      this.showMessage(
        "preferences-message",
        error.message || "Failed to update preferences"
      );
    } finally {
      this.setButtonLoading("update-preferences-btn", false);
    }
  }

  async logout() {
    if (confirm("Are you sure you want to log out?")) {
      try {
        await this.makeRequest("/auth/logout", "POST");
      } catch (error) {
        console.error("Logout error:", error);
      } finally {
        localStorage.removeItem("authToken");
        localStorage.removeItem("currentUser");
        localStorage.removeItem("rememberUser");
        window.location.href = "auth.html";
      }
    }
  }

  async deactivateAccount() {
    const confirmation = prompt(
      'Type "DEACTIVATE" to confirm account deactivation:'
    );

    if (confirmation === "DEACTIVATE") {
      try {
        await this.makeRequest("/user/account", "DELETE");
        alert("Account deactivated successfully. You will be logged out.");
        this.logout();
      } catch (error) {
        console.error("Deactivate account error:", error);
        alert("Failed to deactivate account: " + error.message);
      }
    }
  }
}

// Global functions
function goBack() {
  window.location.href = "dashboard.html";
}

function updatePreferences() {
  settingsManager.updatePreferences();
}

function logout() {
  settingsManager.logout();
}

function deactivateAccount() {
  settingsManager.deactivateAccount();
}

// Initialize the settings manager
let settingsManager;
document.addEventListener("DOMContentLoaded", () => {
  settingsManager = new SettingsManager();
});

// Mobile Navigation Handler for Settings Page
class SettingsMobileNav {
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
    this.initializeToggles();
    this.initializeFormValidation();
  }

  createMobileElements() {
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

  initializeToggles() {
    // Handle toggle switches
    const toggleSwitches = document.querySelectorAll(".toggle-switch");

    toggleSwitches.forEach((toggle) => {
      toggle.addEventListener("click", function () {
        this.classList.toggle("active");

        // Add haptic feedback on mobile
        if ("vibrate" in navigator) {
          navigator.vibrate(50);
        }

        // Trigger change event for form handling
        const event = new CustomEvent("toggleChange", {
          detail: { active: this.classList.contains("active") },
        });
        this.dispatchEvent(event);
      });

      // Keyboard accessibility
      toggle.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.click();
        }
      });

      // Make focusable
      toggle.setAttribute("tabindex", "0");
      toggle.setAttribute("role", "switch");
    });
  }

  initializeFormValidation() {
    // Enhanced form validation for mobile
    const formInputs = document.querySelectorAll(".form-input");

    formInputs.forEach((input) => {
      // Auto-scroll input into view on mobile focus
      input.addEventListener("focus", function () {
        if (window.innerWidth <= 768) {
          setTimeout(() => {
            this.scrollIntoView({
              behavior: "smooth",
              block: "center",
              inline: "nearest",
            });
          }, 300);
        }
      });

      // Real-time validation feedback
      input.addEventListener("blur", function () {
        this.classList.remove("error");

        // Basic validation
        if (this.hasAttribute("required") && !this.value.trim()) {
          this.classList.add("error");
        }

        // Email validation
        if (this.type === "email" && this.value) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(this.value)) {
            this.classList.add("error");
          }
        }
      });
    });

    // Password strength indicator
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    passwordInputs.forEach((input) => {
      const strengthIndicator =
        input.parentNode.querySelector(".password-strength");
      if (strengthIndicator) {
        input.addEventListener(
          "input",
          function () {
            const strength = this.calculatePasswordStrength(this.value);
            this.updateStrengthIndicator(strengthIndicator, strength);
          }.bind(this)
        );
      }
    });
  }

  calculatePasswordStrength(password) {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score < 3) return "weak";
    if (score < 5) return "medium";
    return "strong";
  }

  updateStrengthIndicator(indicator, strength) {
    const strengthBar = indicator.querySelector(".strength-bar");
    if (strengthBar) {
      strengthBar.className = `strength-bar strength-${strength}`;
    }
  }
}

// Initialize mobile navigation when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new SettingsMobileNav();
});

// Add navbar scroll effect
window.addEventListener("scroll", () => {
  const header = document.querySelector(".header");
  if (window.scrollY > 10) {
    header.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.1)";
  } else {
    header.style.boxShadow = "0 1px 2px 0 rgb(0 0 0 / 0.05)";
  }
});

// Enhanced mobile interactions for settings
document.addEventListener("DOMContentLoaded", () => {
  // Add touch feedback for buttons
  const buttons = document.querySelectorAll(".btn");

  buttons.forEach((button) => {
    button.addEventListener("touchstart", function () {
      this.style.transform = "scale(0.98)";
    });

    button.addEventListener("touchend", function () {
      this.style.transform = "";
    });
  });

  // Smooth scrolling between settings sections
  const settingsSections = document.querySelectorAll(".settings-section");
  settingsSections.forEach((section, index) => {
    section.addEventListener("click", (e) => {
      // Only scroll if clicking on section header
      if (e.target.closest(".section-header")) {
        const nextSection = settingsSections[index + 1];
        if (nextSection && window.innerWidth <= 768) {
          setTimeout(() => {
            nextSection.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }, 100);
        }
      }
    });
  });

  // Enhanced form submission handling
  const forms = document.querySelectorAll("form");
  forms.forEach((form) => {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // Show loading state
      const submitBtn = this.querySelector('button[type="submit"]');
      if (submitBtn) {
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="loading-spinner"></span> Saving...';
        submitBtn.disabled = true;

        // Simulate form submission
        setTimeout(() => {
          submitBtn.innerHTML = originalText;
          submitBtn.disabled = false;

          // Show success message
          const successMessage = document.createElement("div");
          successMessage.className = "message success";
          successMessage.textContent = "Settings saved successfully!";
          successMessage.style.display = "block";

          this.insertBefore(successMessage, this.firstChild);

          // Remove message after 3 seconds
          setTimeout(() => {
            successMessage.remove();
          }, 3000);
        }, 1500);
      }
    });
  });

  // Mobile-friendly file input handling
  const fileInputs = document.querySelectorAll('input[type="file"]');
  fileInputs.forEach((input) => {
    input.addEventListener("change", function () {
      const fileName = this.files[0]?.name;
      if (fileName) {
        // Create or update file name display
        let fileDisplay = this.parentNode.querySelector(".file-display");
        if (!fileDisplay) {
          fileDisplay = document.createElement("div");
          fileDisplay.className = "file-display";
          this.parentNode.appendChild(fileDisplay);
        }
        fileDisplay.textContent = `Selected: ${fileName}`;
      }
    });
  });
});
