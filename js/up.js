// Global variables
let allPayments = [];
let filteredPayments = [];
let currentView = "list";
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// Initialize the page
document.addEventListener("DOMContentLoaded", () => {
  loadUserData();
  loadPayments();
  setupEventListeners();
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

// Setup event listeners
function setupEventListeners() {
  document
    .getElementById("time-range")
    .addEventListener("change", filterPayments);
  document
    .getElementById("amount-filter")
    .addEventListener("change", filterPayments);
  document
    .getElementById("status-filter")
    .addEventListener("change", filterPayments);
}

// Load payments from backend API
async function loadPayments() {
  try {
    showLoading();

    const token = localStorage.getItem("authToken");
    if (!token) {
      throw new Error("No auth token found. Please log in.");
    }

    const response = await fetch(
      "https://server-mtye.onrender.com/api/payments/upcoming",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status === 401) {
      throw new Error("Unauthorized. Please log in again.");
    }

    if (!response.ok) {
      throw new Error(`Failed to load payments (status ${response.status})`);
    }

    const payments = await response.json();

    if (!Array.isArray(payments)) {
      throw new Error("Unexpected response format from server.");
    }

    allPayments = payments;
    filteredPayments = [...allPayments];

    updateSummaryCards();
    filterPayments();
    hideLoading();
  } catch (error) {
    console.error("Error loading payments:", error.message);
    showError(error.message);
  }
}

// Show loading state
function showLoading() {
  document.getElementById("loading-container").style.display = "block";
  document.getElementById("payments-container").style.display = "none";
  document.getElementById("error-container").style.display = "none";
  document.getElementById("empty-state").style.display = "none";
}

// Hide loading state
function hideLoading() {
  document.getElementById("loading-container").style.display = "none";
  document.getElementById("payments-container").style.display = "block";
}

// Show error state
function showError(message = "Something went wrong.") {
  document.getElementById("loading-container").style.display = "none";
  document.getElementById("payments-container").style.display = "none";
  const errorContainer = document.getElementById("error-container");
  errorContainer.style.display = "block";
  errorContainer.textContent = message;
  document.getElementById("empty-state").style.display = "none";
}

// Show empty state
function showEmpty() {
  document.getElementById("loading-container").style.display = "none";
  document.getElementById("payments-container").style.display = "none";
  document.getElementById("error-container").style.display = "none";
  document.getElementById("empty-state").style.display = "block";
}

// Update summary cards
function updateSummaryCards() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const monthFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  let dueToday = 0;
  let dueThisWeek = 0;
  let dueThisMonth = 0;
  let totalAmount = 0;

  allPayments.forEach((payment) => {
    const paymentDate = new Date(payment.nextPaymentDate);
    const paymentDateOnly = new Date(
      paymentDate.getFullYear(),
      paymentDate.getMonth(),
      paymentDate.getDate()
    );

    totalAmount += payment.amount;

    if (paymentDateOnly.getTime() === today.getTime()) {
      dueToday++;
    }

    if (paymentDate <= weekFromNow) {
      dueThisWeek++;
    }

    if (paymentDate <= monthFromNow) {
      dueThisMonth++;
    }
  });

  // Animate the numbers
  animateNumber(document.getElementById("due-today"), dueToday);
  animateNumber(document.getElementById("due-week"), dueThisWeek);
  animateNumber(document.getElementById("due-month"), dueThisMonth);
  animateNumber(document.getElementById("total-amount"), totalAmount, "$");
}

// Animate number counting
function animateNumber(element, targetValue, prefix = "") {
  const startValue = 0;
  const duration = 1000;
  const startTime = performance.now();

  function updateNumber(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const currentValue = Math.floor(
      startValue + (targetValue - startValue) * progress
    );

    if (prefix === "$") {
      element.textContent = `$${currentValue.toFixed(2)}`;
    } else {
      element.textContent = prefix + currentValue;
    }

    if (progress < 1) {
      requestAnimationFrame(updateNumber);
    }
  }

  requestAnimationFrame(updateNumber);
}

// Filter payments based on selected criteria
function filterPayments() {
  const timeRange = Number.parseInt(
    document.getElementById("time-range").value
  );
  const amountFilter = document.getElementById("amount-filter").value;
  const statusFilter = document.getElementById("status-filter").value;

  const now = new Date();
  const futureDate = new Date(now.getTime() + timeRange * 24 * 60 * 60 * 1000);

  filteredPayments = allPayments.filter((payment) => {
    const paymentDate = new Date(payment.nextPaymentDate);

    // Time range filter
    if (paymentDate > futureDate) return false;

    // Amount filter
    if (amountFilter !== "all") {
      if (amountFilter === "low" && payment.amount >= 10) return false;
      if (
        amountFilter === "medium" &&
        (payment.amount < 10 || payment.amount > 50)
      )
        return false;
      if (amountFilter === "high" && payment.amount <= 50) return false;
    }

    // Status filter
    if (statusFilter !== "all") {
      const status = getPaymentStatus(payment);
      if (status !== statusFilter) return false;
    }

    return true;
  });

  if (filteredPayments.length === 0) {
    showEmpty();
  } else {
    hideLoading();
    if (currentView === "list") {
      renderPaymentsList();
    } else {
      renderCalendarView();
    }
  }
}

// Get payment status based on due date
function getPaymentStatus(payment) {
  const now = new Date();
  const paymentDate = new Date(payment.nextPaymentDate);
  const daysUntil = Math.ceil((paymentDate - now) / (1000 * 60 * 60 * 24));

  if (daysUntil < 0) return "overdue";
  if (daysUntil <= 3) return "due-soon";
  return "upcoming";
}

// Render payments list
function renderPaymentsList() {
  const container = document.getElementById("payments-list");

  if (filteredPayments.length === 0) {
    container.innerHTML =
      '<div class="no-payments">No payments found matching your criteria.</div>';
    return;
  }

  // Sort payments by date
  const sortedPayments = [...filteredPayments].sort(
    (a, b) => new Date(a.nextPaymentDate) - new Date(b.nextPaymentDate)
  );

  container.innerHTML = sortedPayments
    .map((payment) => {
      const status = getPaymentStatus(payment);
      const daysUntil = Math.ceil(
        (new Date(payment.nextPaymentDate) - new Date()) / (1000 * 60 * 60 * 24)
      );
      const daysText =
        daysUntil < 0
          ? `${Math.abs(daysUntil)} days overdue`
          : daysUntil === 0
          ? "Due today"
          : daysUntil === 1
          ? "Due tomorrow"
          : `Due in ${daysUntil} days`;

      return `
      <div class="payment-item" onclick="showPaymentDetails('${payment._id}')">
        <div class="payment-service">
          <div class="service-icon" style="background-color: ${payment.color}">
            ${payment.serviceName.charAt(0)}
          </div>
          <div class="service-info">
            <h4>${payment.serviceName}</h4>
            <p>${payment.category} • ${payment.billingCycle}</p>
          </div>
        </div>
        <div class="payment-amount">$${payment.amount.toFixed(2)}</div>
        <div class="payment-date">
          <div class="date">${formatDate(payment.nextPaymentDate)}</div>
          <div class="days-until">${daysText}</div>
        </div>
        <div class="payment-status status-${status}">${status.replace(
        "-",
        " "
      )}</div>
      </div>
    `;
    })
    .join("");
}

// Format date for display
function formatDate(date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Toggle filters panel
function toggleFilters() {
  const panel = document.getElementById("filters-panel");
  panel.classList.toggle("active");
}

// Switch between list and calendar view
function switchView(view) {
  currentView = view;

  // Update button states
  document.querySelectorAll(".view-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  document.querySelector(`[data-view="${view}"]`).classList.add("active");

  // Show/hide views
  if (view === "list") {
    document.getElementById("payments-list").style.display = "block";
    document.getElementById("calendar-view").style.display = "none";
    renderPaymentsList();
  } else {
    document.getElementById("payments-list").style.display = "none";
    document.getElementById("calendar-view").style.display = "block";
    renderCalendarView();
  }
}

// Render calendar view
function renderCalendarView() {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  document.getElementById(
    "calendar-month"
  ).textContent = `${monthNames[currentMonth]} ${currentYear}`;

  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  const calendarGrid = document.getElementById("calendar-grid");
  calendarGrid.innerHTML = "";

  // Add day headers
  const dayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  dayHeaders.forEach((day) => {
    const header = document.createElement("div");
    header.className = "calendar-day-header";
    header.textContent = day;
    header.style.cssText =
      "background: var(--bg-light); padding: 0.5rem; text-align: center; font-weight: 600; font-size: 0.875rem;";
    calendarGrid.appendChild(header);
  });

  // Generate calendar days
  const currentDate = new Date(startDate);
  for (let i = 0; i < 42; i++) {
    const dayElement = document.createElement("div");
    dayElement.className = "calendar-day";

    if (currentDate.getMonth() !== currentMonth) {
      dayElement.classList.add("other-month");
    }

    if (isToday(currentDate)) {
      dayElement.classList.add("today");
    }

    const dayPayments = filteredPayments.filter((payment) => {
      const paymentDate = new Date(payment.nextPaymentDate);
      return paymentDate.toDateString() === currentDate.toDateString();
    });

    dayElement.innerHTML = `
      <div class="day-number">${currentDate.getDate()}</div>
      ${dayPayments
        .map(
          (payment) => `
        <div class="calendar-payment" style="background-color: ${
          payment.color
        }" 
             onclick="showPaymentDetails('${payment._id}')">
          ${payment.serviceName} - $${payment.amount.toFixed(2)}
        </div>
      `
        )
        .join("")}
    `;

    calendarGrid.appendChild(dayElement);
    currentDate.setDate(currentDate.getDate() + 1);
  }
}

// Check if date is today
function isToday(date) {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

// Navigate to previous month
function previousMonth() {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  renderCalendarView();
}

// Navigate to next month
function nextMonth() {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  renderCalendarView();
}

async function setReminder(subscriptionId) {
  const token = localStorage.getItem("authToken"); // JWT you stored after login
  if (!token) {
    alert("❌ Please login first.");
    return;
  }

  try {
    const res = await fetch(
      `https://server-mtye.onrender.com/api/reminders/set-reminder/${subscriptionId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await res.json();
    if (res.ok) {
      alert(data.message || "✅ Reminder set!");
      if (data.link) {
        window.open(data.link, "_blank"); // Open Google Calendar event
      }
    } else {
      alert(`❌ Error: ${data.error}`);
    }
  } catch (err) {
    console.error(err);
    alert("❌ Failed to set reminder. Please try again.");
  }
}

// Show payment details modal
function showPaymentDetails(paymentId) {
  const payment = allPayments.find((p) => p._id === paymentId);
  if (!payment) return;

  const modal = document.getElementById("payment-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalBody = document.getElementById("modal-body");
  const actionBtn = document.getElementById("modal-action-btn");

  modalTitle.textContent = `${payment.serviceName} Payment`;

  const status = getPaymentStatus(payment);
  const daysUntil = Math.ceil(
    (new Date(payment.nextPaymentDate) - new Date()) / (1000 * 60 * 60 * 24)
  );

  modalBody.innerHTML = `
    <div style="display: grid; gap: 1rem;">
      <div style="display: flex; align-items: center; gap: 1rem;">
        <div class="service-icon" style="background-color: ${
          payment.color
        }; width: 3rem; height: 3rem; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 1.25rem;">
          ${payment.serviceName.charAt(0)}
        </div>
        <div>
          <h3 style="margin: 0; font-size: 1.25rem;">${payment.serviceName}</h3>
          <p style="margin: 0; color: var(--text-light);">${
            payment.category
          }</p>
        </div>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; padding: 1rem; background: var(--bg-light); border-radius: 0.5rem;">
        <div>
          <strong>Amount:</strong><br>
          $${payment.amount.toFixed(2)} ${payment.currency}
        </div>
        <div>
          <strong>Billing Cycle:</strong><br>
          ${payment.billingCycle}
        </div>
        <div>
          <strong>Next Payment:</strong><br>
          ${formatDate(payment.nextPaymentDate)}
        </div>
        <div>
          <strong>Status:</strong><br>
          <span class="payment-status status-${status}">${status.replace(
    "-",
    " "
  )}</span>
        </div>
      </div>
      
      <div>
        <strong>Days until payment:</strong> ${
          daysUntil < 0
            ? `${Math.abs(daysUntil)} days overdue`
            : daysUntil === 0
            ? "Due today"
            : `${daysUntil} days`
        }
      </div>
    </div>
  `;

  actionBtn.textContent =
    status === "overdue" ? "Mark as Paid" : "Set Reminder";

  if (status === "overdue") {
    // Overdue → let user mark payment as paid
    actionBtn.onclick = () => handlePaymentAction(paymentId, status);
  } else {
    // Otherwise → set reminder
    actionBtn.onclick = () => setReminder(paymentId);
  }

  modal.classList.add("active");
}

// Handle payment actions
function handlePaymentAction(paymentId, status) {
  if (status === "overdue") {
    // Mark as paid - in a real app, this would update the database
    alert(
      "Payment marked as paid! (This would update the database in a real application)"
    );
  } else {
    // Set reminder
    alert(
      "Reminder set! (This would create a notification in a real application)"
    );
  }
  closeModal();
}

// Close modal
function closeModal() {
  document.getElementById("payment-modal").classList.remove("active");
}

// Export payments
function exportPayments() {
  const csvContent = generateCSV(filteredPayments);
  downloadCSV(csvContent, "upcoming-payments.csv");
}

// Generate CSV content
function generateCSV(payments) {
  const headers = [
    "Service Name",
    "Amount",
    "Currency",
    "Next Payment Date",
    "Billing Cycle",
    "Category",
    "Status",
  ];
  const rows = payments.map((payment) => [
    payment.serviceName,
    payment.amount,
    payment.currency,
    formatDate(payment.nextPaymentDate),
    payment.billingCycle,
    payment.category,
    getPaymentStatus(payment),
  ]);

  return [headers, ...rows].map((row) => row.join(",")).join("\n");
}

// Download CSV file
function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// Add subscription (placeholder)
function addSubscription() {
  alert(
    "Add subscription feature would open a form to add new subscriptions to the database."
  );
}

// Mobile Navigation Handler for Upcoming Payments Page
class PaymentsMobileNav {
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
  new PaymentsMobileNav();
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

// Enhanced mobile interactions for payment items
document.addEventListener("DOMContentLoaded", () => {
  // Add touch-friendly interactions for mobile
  const paymentItems = document.querySelectorAll(".payment-item");

  paymentItems.forEach((item) => {
    // Add touch feedback
    item.addEventListener("touchstart", function () {
      this.style.transform = "scale(0.98)";
    });

    item.addEventListener("touchend", function () {
      this.style.transform = "";
    });
  });

  // Improve mobile calendar interactions
  const calendarPayments = document.querySelectorAll(".calendar-payment");
  calendarPayments.forEach((payment) => {
    payment.addEventListener("touchstart", function () {
      this.style.transform = "scale(1.1)";
    });

    payment.addEventListener("touchend", function () {
      this.style.transform = "scale(1.05)";
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

  // Mobile-friendly filter panel toggle
  const filterBtn = document.querySelector(".filter-btn");
  const filtersPanel = document.querySelector(".filters-panel");

  if (filterBtn && filtersPanel) {
    filterBtn.addEventListener("click", () => {
      filtersPanel.classList.toggle("active");

      // Scroll to filters panel on mobile
      if (
        window.innerWidth <= 768 &&
        filtersPanel.classList.contains("active")
      ) {
        setTimeout(() => {
          filtersPanel.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    });
  }
});
