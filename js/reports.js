// ==================== CONFIGURATION ==================== //
// API URL where your subscription data comes from
// const API_URL = "http://localhost:5000/api/subscriptions";
const API_URL = "https://server-mtye.onrender.com/api/subscriptions";

// Variables to hold data and chart instances
let subscriptionsData = []; // All data from API
let filteredData = []; // Data after applying filters
let charts = {}; // Stores chart.js chart objects
// ==================== INITIALIZATION ==================== //
// Run this code once the page is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  loadUserData();
  initializeEventListeners(); // Attach button & filter events
  fetchSubscriptionData(); // Load data from API
  setupPdfDownload(); // Enable PDF download
});

this.currentUser = JSON.parse(localStorage.getItem("currentUser"));
function loadUserData() {
  if (this.currentUser) {
    // Set user avatar initials
    const initials = this.currentUser.name
      .split(" ")
      .map((name) => name[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
    document.getElementById("user-avatar").textContent = initials;
  }
}

// ==================== EVENT LISTENERS ==================== //
// Attach event handlers for buttons, filters, and search
function initializeEventListeners() {
  document
    .getElementById("refreshBtn")
    .addEventListener("click", fetchSubscriptionData);
  document
    .getElementById("environmentFilter")
    .addEventListener("change", applyFilters);
  document
    .getElementById("timeRangeFilter")
    .addEventListener("change", applyFilters);
  document
    .getElementById("categoryFilter")
    .addEventListener("change", applyFilters);
  document
    .getElementById("searchInput")
    .addEventListener("input", applyFilters);
}

// ==================== FETCH DATA ==================== //
// Load subscription data from API
async function fetchSubscriptionData() {
  try {
    showLoadingState();

    const token = localStorage.getItem("authToken");
    if (!token) throw new Error("No token found, please login first.");

    const response = await fetch(API_URL, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    let data = await response.json();
    console.log("Fetched data:", data);

    // Handle different API response formats
    if (Array.isArray(data)) {
      subscriptionsData = data;
    } else if (Array.isArray(data.subscriptions)) {
      subscriptionsData = data.subscriptions;
    } else {
      throw new Error("Invalid API response format");
    }

    filteredData = [...subscriptionsData];
    updateDashboard();
    hideLoadingState();
  } catch (error) {
    console.error("Error fetching subscription data:", error);
    handleFetchError(error);
  }
}

// ==================== UPDATE DASHBOARD ==================== //
// Update all parts of the dashboard (stats, charts, table, filters)
function updateDashboard() {
  updateStats();
  updateCharts();
  updateTable();
  populateCategoryFilter();
}

// ==================== STATS CARDS ==================== //
// Update statistics at the top of the dashboard
function updateStats() {
  const stats = calculateStats(filteredData);

  safeSetText("totalSubs", stats.total);
  safeSetText("totalBadge", stats.total);

  safeSetText("monthlySpend", `$${stats.monthlySpend.toFixed(2)}`);
  safeSetText("monthlyBadge", `$${stats.monthlySpend.toFixed(0)}`);

  safeSetText("annualCost", `$${stats.annualCost.toFixed(2)}`);
  safeSetText("annualBadge", `$${stats.annualCost.toFixed(0)}`);

  safeSetText("activeServices", stats.active);
  safeSetText("activeBadge", stats.active);

  // Show mock trend values (you can connect with real trend data later)
  safeUpdateTrend("totalTrend", 12.5, true);
  safeUpdateTrend("spendTrend", -3.2, false);
  safeUpdateTrend("annualTrend", 8.7, true);
  safeUpdateTrend("activeTrend", 100, true);
}

// Calculate total, active services, monthly & annual spend
function calculateStats(data) {
  const total = data.length;
  const active = data.filter(
    (sub) => sub.status === "active" || sub.status === "Active"
  ).length;

  let monthlySpend = 0;
  data.forEach((sub) => {
    const cost = parseFloat(sub.cost || sub.price || 0);
    const cycle = (
      sub.billingCycle ||
      sub.billing_cycle ||
      "monthly"
    ).toLowerCase();

    if (cycle.includes("month")) {
      monthlySpend += cost;
    } else if (cycle.includes("year") || cycle.includes("annual")) {
      monthlySpend += cost / 12;
    } else if (cycle.includes("week")) {
      monthlySpend += cost * 4;
    }
  });

  const annualCost = monthlySpend * 12;
  return { total, active, monthlySpend, annualCost };
}

// ==================== SAFE DOM HELPERS ==================== //
// Prevents crashes if an element is missing in HTML
function safeSetText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
function safeUpdateTrend(elementId, value, isPositive) {
  const element = document.getElementById(elementId);
  if (!element) return;
  const arrow = element.querySelector(".trend-arrow");
  const span = element.querySelector("span:last-child");
  element.className = "stat-trend";
  if (isPositive) {
    element.classList.add("positive");
    if (arrow) arrow.textContent = "↑";
  } else {
    element.classList.add("negative");
    if (arrow) arrow.textContent = "↓";
  }
  if (span) span.textContent = `${Math.abs(value).toFixed(1)}%`;
}

// ==================== CHARTS ==================== //
function updateCharts() {
  updateBarChart();
  updatePieChart();
  updateStatusChart();
  updateTopSubsChart();
}

// ---- Bar Chart: Monthly Spending (Fixed for Real Data) ---- //
// ---- Bar Chart: Spending by Category ---- //
function updateBarChart() {
  const canvas = document.getElementById("barChart");
  if (!canvas) {
    console.error("❌ barChart canvas not found in DOM");
    return;
  }
  const ctx = canvas.getContext("2d");

  // Group data by category instead of month
  const categoryData = groupByCategory(filteredData);
  console.log("📊 Bar Chart Data (by category):", categoryData);

  if (charts.barChart) charts.barChart.destroy();

  charts.barChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: categoryData.labels,
      datasets: [
        {
          label: "Spending by Category",
          data: categoryData.values,
          backgroundColor: [
            "#3b82f6",
            "#8b5cf6",
            "#10b981",
            "#f59e0b",
            "#ef4444",
            "#06b6d4",
            "#ec4899",
          ],
          borderRadius: 6,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => `$${(context.parsed.y || 0).toFixed(2)}`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { callback: (val) => `$${val}` },
        },
      },
    },
  });
}

// ---- Pie Chart: Spending by Category ---- //
function updatePieChart() {
  const ctx = document.getElementById("pieChart").getContext("2d");
  const categoryData = groupByCategory(filteredData);
  if (charts.pieChart) charts.pieChart.destroy();
  const colors = [
    "#3b82f6",
    "#8b5cf6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#06b6d4",
    "#ec4899",
  ];
  charts.pieChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: categoryData.labels,
      datasets: [
        {
          data: categoryData.values,
          backgroundColor: colors.slice(0, categoryData.labels.length),
          borderWidth: 2,
          // borderColor: "#1a1a1a",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: "#a0a0a0", padding: 15, font: { size: 12 } },
        },
        tooltip: {
          backgroundColor: "#1a1a1a",
          titleColor: "#ffffff",
          bodyColor: "#a0a0a0",
          borderColor: "#2a2a2a",
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: (context) =>
              `${context.label}: $${context.parsed.toFixed(2)}`,
          },
        },
      },
    },
  });
}

// ---- Status Chart: Active/Cancelled/Expired ---- //
function updateStatusChart() {
  const ctx = document.getElementById("statusChart")?.getContext("2d");
  if (!ctx) return;
  const statusData = groupByStatus(filteredData);
  if (charts.statusChart) charts.statusChart.destroy();
  charts.statusChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: statusData.labels,
      datasets: [
        {
          data: statusData.values,
          backgroundColor: ["#10b981", "#ef4444", "#f59e0b"],
          borderWidth: 2,
          borderColor: "#1a1a1a",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: "#a0a0a0", padding: 15, font: { size: 12 } },
        },
      },
    },
  });
}

// ---- Top 5 Subscriptions ---- //
function updateTopSubsChart() {
  const ctx = document.getElementById("topSubsChart")?.getContext("2d");
  if (!ctx) return;
  const topSubs = getTopSubscriptions(filteredData, 5);
  if (charts.topSubsChart) charts.topSubsChart.destroy();
  charts.topSubsChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: topSubs.labels,
      datasets: [
        {
          label: "Monthly Cost",
          data: topSubs.values,
          backgroundColor: "#8b5cf6",
          borderRadius: 6,
          borderSkipped: false,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#1a1a1a",
          titleColor: "#ffffff",
          bodyColor: "#a0a0a0",
        },
      },
    },
  });
}

// ==================== DATA HELPERS ==================== //
function groupByCategory(data) {
  const categories = {};
  data.forEach((sub) => {
    const category = sub.category || "Other";
    const cost = parseFloat(sub.cost || sub.price || 0);
    categories[category] = (categories[category] || 0) + cost;
  });
  return { labels: Object.keys(categories), values: Object.values(categories) };
}
function groupByStatus(data) {
  const statuses = { Active: 0, Cancelled: 0, Expired: 0 };
  data.forEach((sub) => {
    const status = (sub.status || "Active").toLowerCase();
    if (status.includes("active")) statuses.Active++;
    else if (status.includes("cancel")) statuses.Cancelled++;
    else if (status.includes("expir")) statuses.Expired++;
  });
  return { labels: Object.keys(statuses), values: Object.values(statuses) };
}
function getTopSubscriptions(data, limit) {
  const sorted = [...data].sort(
    (a, b) =>
      parseFloat(b.cost || b.price || 0) - parseFloat(a.cost || a.price || 0)
  );
  const top = sorted.slice(0, limit);
  return {
    labels: top.map((sub) => sub.name || sub.serviceName || "Unknown"),
    values: top.map((sub) => parseFloat(sub.cost || sub.price || 0)),
  };
}

// ==================== TABLE ==================== //
function updateTable() {
  const tbody = document.getElementById("tableBody");
  if (!tbody) return;
  tbody.innerHTML = "";
  if (filteredData.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="loading-cell">No subscriptions found</td></tr>';
    return;
  }
  function formatDate(dateString) {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date)) return "N/A";
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }
  filteredData.forEach((sub) => {
    const row = document.createElement("tr");
    const name = sub.name || sub.serviceName || "Unknown";
    const category = sub.category || "Other";
    const status = (sub.status || "active").toLowerCase();
    const billingCycle = sub.billingCycle || sub.billing_cycle || "Monthly";
    const cost = parseFloat(sub.cost || sub.price || 0).toFixed(2);
    const nextPaymentRaw = sub.nextPayment || sub.nextPaymentDate || "N/A";
    const nextPayment = formatDate(nextPaymentRaw);
    row.innerHTML = `
      <td><strong>${name}</strong></td>
      <td>${category}</td>
      <td><span class="status-badge ${status}">${
      status.charAt(0).toUpperCase() + status.slice(1)
    }</span></td>
      <td>${billingCycle}</td>
      <td>$${cost}</td>
      <td>${nextPayment}</td>`;
    tbody.appendChild(row);
  });
}

// ==================== FILTERS ==================== //
function applyFilters() {
  const statusFilter = document.getElementById("environmentFilter").value;
  const categoryFilter = document.getElementById("categoryFilter").value;
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  filteredData = subscriptionsData.filter((sub) => {
    if (statusFilter !== "all") {
      const status = (sub.status || "active").toLowerCase();
      if (!status.includes(statusFilter)) return false;
    }
    if (categoryFilter !== "all") {
      if ((sub.category || "Other") !== categoryFilter) return false;
    }
    if (searchTerm) {
      const name = (sub.name || sub.serviceName || "").toLowerCase();
      const category = (sub.category || "").toLowerCase();
      if (!name.includes(searchTerm) && !category.includes(searchTerm))
        return false;
    }
    return true;
  });
  updateDashboard();
}
function populateCategoryFilter() {
  const categoryFilter = document.getElementById("categoryFilter");
  if (!categoryFilter) return;
  const categories = new Set(
    subscriptionsData.map((sub) => sub.category || "Other")
  );
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });
}

// ==================== LOADING & ERROR HANDLING ==================== //
function showLoadingState() {
  const tbody = document.getElementById("tableBody");
  if (tbody)
    tbody.innerHTML =
      '<tr><td colspan="6" class="loading-cell">Loading data...</td></tr>';
}
function hideLoadingState() {
  /* Data fills table automatically */
}
function handleFetchError(error) {
  const tbody = document.getElementById("tableBody");
  if (tbody) {
    tbody.innerHTML = `<tr><td colspan="6" class="loading-cell" style="color: #ef4444;">
      Error loading data: ${error.message}<br>
      <small>Make sure your API is running at ${API_URL}</small>
    </td></tr>`;
  }
  safeSetText("totalSubs", "0");
  safeSetText("monthlySpend", "$0.00");
  safeSetText("annualCost", "$0.00");
  safeSetText("activeServices", "0");
}

// ==================== PDF DOWNLOAD ==================== //
// Allow user to download the full report as PDF
function setupPdfDownload() {
  const btn = document.getElementById("downloadPdfBtn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const element = document.getElementById("reportContent");
    const opt = {
      margin: 0.5,
      filename: "subscription-report.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    };
    html2pdf().from(element).set(opt).save();
  });
}

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
