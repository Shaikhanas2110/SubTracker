// =========================
// API CONFIGURATION
// =========================
// This is the "base address" of the backend server where all subscription data is stored.
// The app will send requests (like "add subscription", "get subscriptions", etc.) to this address.
// For local testing we use localhost, but it can also point to an online server.
// const API_BASE_URL = "http://localhost:5000/api";
const API_BASE_URL = "https://server-mtye.onrender.com/api";

// =========================
// SUBSCRIPTION MANAGEMENT SYSTEM
// =========================
// This class handles everything related to subscriptions:
// - Checking if the user is logged in
// - Loading, adding, editing, and deleting subscriptions
// - Showing subscription data on the page

// Subscription Management System with MongoDB API
class SubscriptionManager {
  constructor() {
    // Load login info and user data saved in browser storage
    this.token = localStorage.getItem("authToken");
    this.currentUser = JSON.parse(localStorage.getItem("currentUser"));

    // Storage for subscription data
    this.subscriptions = [];
    this.filteredSubscriptions = [];
    this.editingId = null;
    this.isLoading = false;

    // Run setup functions
    this.checkAuthentication(); // Ensure user is logged in
    this.loadUserData(); // Load user avatar
    this.setupEventListeners(); // Connect buttons/filters
    this.loadSubscriptions(); // Load subscriptions from server
  }

  // If not logged in, send user back to login page
  checkAuthentication() {
    if (!this.token || !this.currentUser) {
      window.location.href = "auth.html";
      return;
    }
  }

  // Show user initials in top-right avatar (example: John Doe -> JD)
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

  // Helper function to talk to backend API
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

    const response = await fetch(url, options);
    const result = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, redirect to login
        localStorage.removeItem("authToken");
        localStorage.removeItem("currentUser");
        window.location.href = "auth.html";
        return;
      }
      throw new Error(result.message || "Request failed");
    }

    return result;
  }

  // Show error message on screen
  showError(message) {
    const errorElement = document.getElementById("error-message");
    errorElement.textContent = message;
    errorElement.style.display = "block";
    setTimeout(() => {
      errorElement.style.display = "none";
    }, 5000);
  }

  // Show loading spinner while waiting for server
  showLoading(show = true) {
    const loadingState = document.getElementById("loading-state");
    const subscriptionsGrid = document.getElementById("subscriptions-grid");
    const emptyState = document.getElementById("empty-state");

    if (show) {
      loadingState.classList.remove("hidden");
      subscriptionsGrid.classList.add("hidden");
      emptyState.classList.add("hidden");
    } else {
      loadingState.classList.add("hidden");
    }
  }

  // Show "Processing..." on button during saving/updating
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
        btnText.textContent = this.editingId
          ? "Update Subscription"
          : "Add Subscription";
      }
    }
  }

  // Load subscriptions from server
  async loadSubscriptions() {
    try {
      this.showLoading(true);
      const result = await this.makeRequest("/subscriptions");
      this.subscriptions = result.subscriptions || [];
      this.filteredSubscriptions = [...this.subscriptions];
      this.renderSubscriptions();
      await this.updateStats();
    } catch (error) {
      console.error("Load subscriptions error:", error);
      this.showError("Failed to load subscriptions. Please try again.");
    } finally {
      this.showLoading(false);
    }
  }

  // Update statistics like total cost, monthly, yearly cost, etc.
  async updateStats() {
    try {
      const result = await this.makeRequest("/subscriptions/stats");
      const stats = result.stats;

      document.getElementById("total-subscriptions").textContent =
        stats.totalSubscriptions;
      document.getElementById("monthly-cost").textContent = this.formatCurrency(
        stats.monthlyCost
      );
      document.getElementById("yearly-cost").textContent = this.formatCurrency(
        stats.yearlyCost
      );
      document.getElementById("next-payment").textContent =
        stats.nextPayment !== null ? `${stats.nextPayment} days` : "-";
    } catch (error) {
      console.error("Update stats error:", error);
    }
  }

  // Set up event listeners (search, filter, form submit, etc.)
  setupEventListeners() {
    // Search functionality
    document.getElementById("search-input").addEventListener("input", () => {
      this.filterSubscriptions();
    });

    // Filter functionality
    document
      .getElementById("category-filter")
      .addEventListener("change", () => {
        this.filterSubscriptions();
      });

    document
      .getElementById("recurring-filter")
      .addEventListener("change", () => {
        this.filterSubscriptions();
      });

    document.getElementById("sort-filter").addEventListener("change", () => {
      this.filterSubscriptions();
    });

    // Form submission
    document
      .getElementById("subscription-form")
      .addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleFormSubmit();
      });

    // Close modal if clicking outside
    document
      .getElementById("subscription-modal")
      .addEventListener("click", (e) => {
        if (e.target.classList.contains("modal-overlay")) {
          this.closeModal();
        }
      });
  }

  // Create a unique color for each service
  getServiceColor(serviceName) {
    const colors = [
      "#3b82f6",
      "#8b5cf6",
      "#10b981",
      "#f59e0b",
      "#ef4444",
      "#06b6d4",
      "#84cc16",
      "#f97316",
      "#ec4899",
      "#6366f1",
      "#14b8a6",
      "#eab308",
    ];

    let hash = 0;
    for (let i = 0; i < serviceName.length; i++) {
      hash = serviceName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  // Show first 2 letters of service name
  getServiceInitials(serviceName) {
    return serviceName
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  }

  // Format numbers into money (e.g., 10 -> $10.00)
  formatCurrency(amount) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }

  // Format date into readable form
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  // Calculate days until next payment
  getDaysUntilPayment(dateString) {
    const today = new Date();
    const paymentDate = new Date(dateString);
    const diffTime = paymentDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  // Convert different billing cycles into monthly equivalent (so all costs are comparable)
  calculateMonthlyEquivalent(cost, cycle) {
    switch (cycle) {
      case "weekly":
        return cost * 4.33;
      case "monthly":
        return cost;
      case "quarterly":
        return cost / 3;
      case "yearly":
        return cost / 12;
      default:
        return cost;
    }
  }

  // Show subscriptions on the page (grid view with cards)
  renderSubscriptions() {
    const grid = document.getElementById("subscriptions-grid");
    const emptyState = document.getElementById("empty-state");

    if (this.filteredSubscriptions.length === 0) {
      grid.classList.add("hidden");
      emptyState.classList.remove("hidden");
      return;
    }

    grid.classList.remove("hidden");
    emptyState.classList.add("hidden");

    grid.innerHTML = this.filteredSubscriptions
      .map((sub) => {
        const daysUntil = this.getDaysUntilPayment(sub.nextPaymentDate);
        const color = this.getServiceColor(sub.serviceName);
        const initials = this.getServiceInitials(sub.serviceName);

        let paymentText = "";
        let paymentClass = "next-payment";

        if (daysUntil < 0) {
          paymentText = `Overdue by ${Math.abs(daysUntil)} days`;
          paymentClass += " danger";
        } else if (daysUntil === 0) {
          paymentText = "Due today";
          paymentClass += " danger";
        } else if (daysUntil === 1) {
          paymentText = "Due tomorrow";
          paymentClass += " warning";
        } else if (daysUntil <= 7) {
          paymentText = `Due in ${daysUntil} days`;
          paymentClass += " warning";
        } else {
          paymentText = `Due in ${daysUntil} days`;
        }

        return `
                        <div class="subscription-card">
                            <div class="subscription-header">
                                <div class="subscription-info">
                                    <div class="subscription-logo" style="background: ${color}">
                                        ${initials}
                                    </div>
                                    <div class="subscription-details">
                                        <h3>${sub.serviceName}</h3>
                                        <div class="subscription-category">${
                                          sub.category
                                        }</div>
                                    </div>
                                </div>
                                <div class="subscription-cost">
                                    <div class="cost-amount">${this.formatCurrency(
                                      sub.cost
                                    )}</div>
                                    <div class="cost-period">/${
                                      sub.billingCycle
                                    }</div>
                                </div>
                            </div>
                            
                            <div class="subscription-body">
                                <div class="subscription-meta">
                                    <div class="meta-item">
                                        <div class="meta-label">Started</div>
                                        <div class="meta-value">${this.formatDate(
                                          sub.createdAt
                                        )}</div>
                                    </div>
                                    <div class="meta-item">
                                        <div class="meta-label">Monthly Cost</div>
                                        <div class="meta-value">${this.formatCurrency(
                                          this.calculateMonthlyEquivalent(
                                            sub.cost,
                                            sub.billingCycle
                                          )
                                        )}</div>
                                    </div>
                                </div>
                                
                                <div class="${paymentClass}">
                                    <i class="fas fa-calendar-alt"></i>
                                    ${paymentText}
                                </div>
                                
                                ${
                                  sub.description
                                    ? `<div style="font-size: 0.9rem; color: #64748b; margin-bottom: 1rem;">${sub.description}</div>`
                                    : ""
                                }
                                
                                <div class="subscription-actions">
                                    <button class="action-btn edit-btn" onclick="subscriptionManager.editSubscription('${
                                      sub._id
                                    }')" >
                                        <i class="fas fa-edit"></i> Edit
                                    </button>
                                    <button class="action-btn cancel-btn" onclick="subscriptionManager.cancelSubscription('${
                                      sub._id
                                    }')" >
                                        <i class="fas fa-trash"></i> Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
      })
      .join("");
  }

  // Filter subscriptions by search, category, recurring, etc.
  filterSubscriptions() {
    const searchTerm = document
      .getElementById("search-input")
      .value.toLowerCase();
    const categoryFilter = document.getElementById("category-filter").value;
    const sortFilter = document.getElementById("sort-filter").value;

    let filtered = [...this.subscriptions];
    const recurringFilter = document.getElementById("recurring-filter").value;

    if (recurringFilter === "true") {
      filtered = filtered.filter((sub) => sub.isRecurring);
    } else if (recurringFilter === "false") {
      filtered = filtered.filter((sub) => !sub.isRecurring);
    } else if (recurringFilter === "past") {
      const today = new Date();
      filtered = filtered.filter(
        (sub) => new Date(sub.nextPaymentDate) < today
      );
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (sub) =>
          sub.serviceName.toLowerCase().includes(searchTerm) ||
          sub.category.toLowerCase().includes(searchTerm) ||
          (sub.description &&
            sub.description.toLowerCase().includes(searchTerm))
      );
    }

    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter((sub) => sub.category === categoryFilter);
    }

    // Apply sorting
    switch (sortFilter) {
      case "name":
        filtered.sort((a, b) => a.serviceName.localeCompare(b.serviceName));
        break;
      case "cost-high":
        filtered.sort(
          (a, b) =>
            this.calculateMonthlyEquivalent(b.cost, b.billingCycle) -
            this.calculateMonthlyEquivalent(a.cost, a.billingCycle)
        );
        break;
      case "cost-low":
        filtered.sort(
          (a, b) =>
            this.calculateMonthlyEquivalent(a.cost, a.billingCycle) -
            this.calculateMonthlyEquivalent(b.cost, b.billingCycle)
        );
        break;
      case "next-payment":
        filtered.sort(
          (a, b) => new Date(a.nextPaymentDate) - new Date(b.nextPaymentDate)
        );
        break;
      case "newest":
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }

    this.filteredSubscriptions = filtered;
    this.renderSubscriptions();
  }

  // Open modal for adding new subscription
  openAddModal() {
    this.editingId = null;
    document.getElementById("modal-title").textContent = "Add Subscription";
    document
      .getElementById("submit-btn")
      .querySelector(".btn-text").textContent = "Add Subscription";
    document.getElementById("subscription-form").reset();

    // Set default next payment date to next month
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    document.getElementById("next-payment-date").value = nextMonth
      .toISOString()
      .split("T")[0];

    // Clear any error styles
    document.querySelectorAll(".form-input, .form-select").forEach((input) => {
      input.classList.remove("error");
    });

    document.getElementById("subscription-modal").classList.add("active");
  }

  // Open modal for editing subscription
  editSubscription(id) {
    const subscription = this.subscriptions.find((sub) => sub._id === id);
    if (!subscription) return;

    this.editingId = id;
    document.getElementById("modal-title").textContent = "Edit Subscription";
    document
      .getElementById("submit-btn")
      .querySelector(".btn-text").textContent = "Update Subscription";

    // Populate form
    document.getElementById("service-name").value = subscription.serviceName;
    document.getElementById("cost").value = subscription.cost;
    document.getElementById("billing-cycle").value = subscription.billingCycle;
    document.getElementById("category").value = subscription.category;
    document.getElementById("next-payment-date").value =
      subscription.nextPaymentDate.split("T")[0];
    document.getElementById("description").value =
      subscription.description || "";
    document.getElementById("is-recurring").value = subscription.isRecurring
      ? "true"
      : "false";

    // Clear any error styles
    document.querySelectorAll(".form-input, .form-select").forEach((input) => {
      input.classList.remove("error");
    });

    document.getElementById("subscription-modal").classList.add("active");
  }

  // Cancel (delete) a subscription
  async cancelSubscription(id) {
    const subscription = this.subscriptions.find((sub) => sub._id === id);
    if (!subscription) return;

    if (
      confirm(
        `Are you sure you want to cancel ${subscription.serviceName}? This action cannot be undone.`
      )
    ) {
      try {
        this.isLoading = true;
        await this.makeRequest(`/subscriptions/${id}`, "DELETE");
        await this.loadSubscriptions();
      } catch (error) {
        console.error("Cancel subscription error:", error);
        this.showError("Failed to cancel subscription. Please try again.");
      } finally {
        this.isLoading = false;
      }
    }
  }

  // Validate form before saving
  validateForm() {
    const serviceName = document.getElementById("service-name").value.trim();
    const cost = parseFloat(document.getElementById("cost").value);
    const billingCycle = document.getElementById("billing-cycle").value;
    const category = document.getElementById("category").value;
    const nextPaymentDate = document.getElementById("next-payment-date").value;
    let isValid = true;

    // Clear previous errors
    document.querySelectorAll(".form-input, .form-select").forEach((input) => {
      input.classList.remove("error");
    });

    // Validate service name
    if (!serviceName || serviceName.length < 1) {
      document.getElementById("service-name").classList.add("error");
      isValid = false;
    }

    // Validate cost
    if (isNaN(cost) || cost < 0 || cost > 10000) {
      document.getElementById("cost").classList.add("error");
      isValid = false;
    }

    // Validate billing cycle
    if (!billingCycle) {
      document.getElementById("billing-cycle").classList.add("error");
      isValid = false;
    }

    // Validate category
    if (!category) {
      document.getElementById("category").classList.add("error");
      isValid = false;
    }

    // Validate next payment date
    if (!nextPaymentDate) {
      document.getElementById("next-payment-date").classList.add("error");
      isValid = false;
    } else {
      const paymentDate = new Date(nextPaymentDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (paymentDate < today) {
        document.getElementById("next-payment-date").classList.add("error");
        isValid = false;
      }
    }

    return isValid;
  }

  // Handle form submit (add or edit subscription)
  async handleFormSubmit() {
    if (!this.validateForm()) {
      this.showError("Please fill in all required fields correctly.");
      return;
    }

    const formData = {
      serviceName: document.getElementById("service-name").value.trim(),
      cost: parseFloat(document.getElementById("cost").value),
      billingCycle: document.getElementById("billing-cycle").value,
      category: document.getElementById("category").value,
      nextPaymentDate: document.getElementById("next-payment-date").value,
      description: document.getElementById("description").value.trim(),
      isRecurring: document.getElementById("is-recurring").value,
    };

    try {
      this.setButtonLoading("submit-btn", true);

      if (this.editingId) {
        // Update existing subscription
        await this.makeRequest(
          `/subscriptions/${this.editingId}`,
          "PUT",
          formData
        );
      } else {
        // Add new subscription
        await this.makeRequest("/subscriptions", "POST", formData);
      }

      await this.loadSubscriptions();
      this.closeModal();
    } catch (error) {
      console.error("Form submit error:", error);
      this.showError(
        error.message || "Failed to save subscription. Please try again."
      );
    } finally {
      this.setButtonLoading("submit-btn", false);
    }
  }

  // Close modal and reset form
  closeModal() {
    document.getElementById("subscription-modal").classList.remove("active");
    this.editingId = null;

    // Clear form
    document.getElementById("subscription-form").reset();

    // Clear any error styles
    document.querySelectorAll(".form-input, .form-select").forEach((input) => {
      input.classList.remove("error");
    });
  }
}

// =========================
// HELPER FUNCTIONS
// =========================
function goBack() {
  window.location.href = "dashboard.html";
}

function openAddModal() {
  subscriptionManager.openAddModal();
}

function closeModal() {
  subscriptionManager.closeModal();
}

// =========================
// INITIALIZATION
// =========================
// Create subscription manager when page loads
let subscriptionManager;
document.addEventListener("DOMContentLoaded", () => {
  subscriptionManager = new SubscriptionManager();
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

// Add navbar scroll effect// =========================
// UI ENHANCEMENTS
// =========================
// Add shadow to navbar when scrolling
window.addEventListener("scroll", () => {
  const header = document.querySelector(".header");
  if (window.scrollY > 10) {
    header.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.1)";
  } else {
    header.style.boxShadow = "0 1px 2px 0 rgb(0 0 0 / 0.05)";
  }
});

// Mobile touch improvements (tap, swipe, form focus)
document.addEventListener("DOMContentLoaded", () => {
  // Add touch-friendly interactions for mobile
  const subscriptionCards = document.querySelectorAll(".subscription-card");

  subscriptionCards.forEach((card) => {
    // Add touch feedback
    card.addEventListener("touchstart", function () {
      this.style.transform = "scale(0.98)";
    });

    card.addEventListener("touchend", function () {
      this.style.transform = "";
    });
  });

  // Improve mobile form interactions
  const formInputs = document.querySelectorAll(".form-input, .form-select");
  formInputs.forEach((input) => {
    input.addEventListener("focus", function () {
      // Scroll input into view on mobile
      if (window.innerWidth <= 768) {
        setTimeout(() => {
          this.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 300);
      }
    });
  });

  // Enhanced mobile modal handling
  const modals = document.querySelectorAll(".modal-overlay");
  modals.forEach((modal) => {
    modal.addEventListener(
      "touchmove",
      (e) => {
        // Prevent background scroll when modal is open
        if (modal.classList.contains("active")) {
          e.preventDefault();
        }
      },
      { passive: false }
    );
  });
});

// Add swipe gestures for subscription cards (left/right swipe effect)
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener("touchstart", (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
});

document.addEventListener("touchend", (e) => {
  if (!touchStartX || !touchStartY) return;

  const touchEndX = e.changedTouches[0].clientX;
  const touchEndY = e.changedTouches[0].clientY;

  const diffX = touchStartX - touchEndX;
  const diffY = touchStartY - touchEndY;

  // Only trigger swipe if it's more horizontal than vertical
  if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
    const card = e.target.closest(".subscription-card");
    if (card) {
      // Add visual feedback for swipe
      card.style.transform =
        diffX > 0 ? "translateX(-10px)" : "translateX(10px)";
      setTimeout(() => {
        card.style.transform = "";
      }, 200);
    }
  }

  touchStartX = 0;
  touchStartY = 0;
});
