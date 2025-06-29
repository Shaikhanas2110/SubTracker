// Mobile menu toggle
function toggleMobileMenu() {
  const mobileMenu = document.getElementById("mobile-menu");
  const menuBtn = document.querySelector(".mobile-menu-btn i");

  if (mobileMenu.style.display === "flex") {
    mobileMenu.style.display = "none";
    menuBtn.classList.remove("fa-times");
    menuBtn.classList.add("fa-bars");
  } else {
    mobileMenu.style.display = "flex";
    menuBtn.classList.remove("fa-bars");
    menuBtn.classList.add("fa-times");
  }
}

// Close mobile menu when clicking outside
document.addEventListener("click", (e) => {
  const mobileMenu = document.getElementById("mobile-menu");
  const menuBtn = document.querySelector(".mobile-menu-btn");

  if (!menuBtn.contains(e.target) && !mobileMenu.contains(e.target)) {
    mobileMenu.style.display = "none";
    document.querySelector(".mobile-menu-btn i").classList.remove("fa-times");
    document.querySelector(".mobile-menu-btn i").classList.add("fa-bars");
  }
});

// Smooth scrolling for anchor links
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

// Add scroll effect to navbar
window.addEventListener("scroll", () => {
  const navbar = document.querySelector(".navbar");
  if (window.scrollY > 50) {
    navbar.style.boxShadow = "0 2px 20px rgba(0, 0, 0, 0.1)";
  } else {
    navbar.style.boxShadow = "none";
  }
});

// Animate stats on scroll
const observerOptions = {
  threshold: 0.5,
  rootMargin: "0px 0px -100px 0px",
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      animateStats();
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

const statsSection = document.querySelector(".hero-stats");
if (statsSection) {
  observer.observe(statsSection);
}

function animateStats() {
  const statNumbers = document.querySelectorAll(".stat-number");

  statNumbers.forEach((stat, index) => {
    const finalValue = stat.textContent;
    const isMonetary = finalValue.includes("$");
    const isSuffixed = finalValue.includes("+");

    const numericValue = Number.parseInt(finalValue.replace(/[^0-9]/g, ""));
    let currentValue = 0;
    const increment = numericValue / 50;

    const timer = setInterval(() => {
      currentValue += increment;

      if (currentValue >= numericValue) {
        currentValue = numericValue;
        clearInterval(timer);
      }

      let displayValue = Math.floor(currentValue);

      if (isMonetary) {
        if (displayValue >= 1000000) {
          displayValue = "$" + (displayValue / 1000000).toFixed(1) + "M";
        } else if (displayValue >= 1000) {
          displayValue = "$" + (displayValue / 1000).toFixed(0) + "K";
        } else {
          displayValue = "$" + displayValue;
        }
      } else if (displayValue >= 1000) {
        displayValue = (displayValue / 1000).toFixed(0) + "K";
      }

      if (isSuffixed && currentValue >= numericValue) {
        displayValue += "+";
      }

      stat.textContent = displayValue;
    }, 20);
  });
}

// Add hover effects to buttons
document.querySelectorAll(".btn-primary, .btn-secondary").forEach((button) => {
  button.addEventListener("mouseenter", function () {
    this.style.transform = "translateY(-2px)";
  });

  button.addEventListener("mouseleave", function () {
    this.style.transform = "translateY(0)";
  });
});

// Add loading state for demo button
document
  .querySelector(".btn-secondary")
  .addEventListener("click", function (e) {
    const originalText = this.innerHTML;
    this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading Demo...';
    this.style.pointerEvents = "none";

    setTimeout(() => {
      this.innerHTML = originalText;
      this.style.pointerEvents = "auto";
    }, 1500);
  });

// Parallax effect for floating cards
window.addEventListener("scroll", () => {
  const scrolled = window.pageYOffset;
  const parallaxElements = document.querySelectorAll(".floating-card");

  parallaxElements.forEach((element, index) => {
    const speed = 0.5 + index * 0.1;
    const yPos = -(scrolled * speed);
    element.style.transform = `translateY(${yPos}px)`;
  });
});

// Add intersection observer for animations
const animateOnScroll = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
      }
    });
  },
  {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  }
);

// Observe elements for animation
document.querySelectorAll(".hero-content, .hero-visual").forEach((el) => {
  el.style.opacity = "0";
  el.style.transform = "translateY(30px)";
  el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
  animateOnScroll.observe(el);
});

// Add keyboard navigation
document.addEventListener("keydown", (e) => {
  // Alt + H for home
  if (e.altKey && e.key === "h") {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Alt + S for sign in
  if (e.altKey && e.key === "s") {
    e.preventDefault();
    window.location.href = "auth.html";
  }

  // Alt + D for demo
  if (e.altKey && e.key === "d") {
    e.preventDefault();
    window.location.href = "dashboard.html";
  }
});

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  // Add smooth entrance animation
  document.body.style.opacity = "0";
  setTimeout(() => {
    document.body.style.transition = "opacity 0.5s ease";
    document.body.style.opacity = "1";
  }, 100);
});
