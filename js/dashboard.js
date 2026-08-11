class Dashboard {
  constructor() {
    this.currentUser = JSON.parse(localStorage.getItem("currentUser"));
    this.checkAuthentication();
    this.loadUserData();
  }

  checkAuthentication() {
    if (!this.currentUser) {
      // User not logged in, redirect to auth page
      window.location.href = "auth.html";
      return;
    }
  }

  loadUserData() {
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
}

// Auto-hide success message after 5 seconds
const successMessage = document.querySelector(".success-message");
if (successMessage) {
  // Add fade-out animation after 5 seconds
  setTimeout(() => {
    successMessage.style.transition = "opacity 0.5s ease, transform 0.5s ease";
    successMessage.style.opacity = "0";
    successMessage.style.transform = "translateY(-20px)";

    // Remove from DOM after animation completes
    setTimeout(() => {
      successMessage.remove();
    }, 500);
  }, 5000); // 5 seconds delay
}

function navigateToSubscriptions() {
  // In a real app, this would navigate to the subscriptions page
  window.location.href = "../pages/subscriptions.html";
}

function navigateToSettings() {
  // In a real app, this would navigate to the settings page
  window.location.href = "../pages/settings.html";
}

function navigateToUpcomingPayments() {
  // In a real app, this would navigate to the settings page
  window.location.href = "../pages/up.html";
}

// Initialize dashboard
document.addEventListener("DOMContentLoaded", () => {
  new Dashboard();
});

// Mobile Navigation Handler
class MobileNavigation {
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
  new MobileNavigation();
});

// Add smooth scroll behavior for navigation links
document.addEventListener("DOMContentLoaded", () => {
  // Handle smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  });
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