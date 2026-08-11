// Form validation and submission
const form = document.getElementById("contactForm");
const submitBtn = form.querySelector(".submit-btn");
const successMessage = form.querySelector(".success-message");
const errorMessage = form.querySelector(".error-message");

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Validate individual field
function validateField(field) {
  const formGroup = field.closest(".form-group");
  const errorSpan = formGroup.querySelector(".form-error");
  let isValid = true;
  let errorMsg = "";

  // Check if field is empty
  if (!field.value.trim()) {
    isValid = false;
    errorMsg = "This field is required";
  }
  // Validate email format
  else if (field.type === "email" && !emailRegex.test(field.value)) {
    isValid = false;
    errorMsg = "Please enter a valid email address";
  }
  // Validate minimum length for message
  else if (field.name === "message" && field.value.trim().length < 10) {
    isValid = false;
    errorMsg = "Message must be at least 10 characters";
  }

  // Update UI
  if (isValid) {
    formGroup.classList.remove("error");
    errorSpan.textContent = "";
  } else {
    formGroup.classList.add("error");
    errorSpan.textContent = errorMsg;
  }

  return isValid;
}

// Add real-time validation
const formFields = form.querySelectorAll("input[required], textarea[required]");
formFields.forEach((field) => {
  // Validate on blur
  field.addEventListener("blur", () => {
    if (field.value.trim()) {
      validateField(field);
    }
  });

  // Clear error on input
  field.addEventListener("input", () => {
    const formGroup = field.closest(".form-group");
    if (formGroup.classList.contains("error")) {
      formGroup.classList.remove("error");
      formGroup.querySelector(".form-error").textContent = "";
    }
  });
});

// Handle form submission
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Hide any previous messages
  successMessage.classList.remove("show");
  errorMessage.classList.remove("show");

  // Validate all fields
  let isFormValid = true;
  formFields.forEach((field) => {
    if (!validateField(field)) {
      isFormValid = false;
    }
  });

  if (!isFormValid) {
    return;
  }

  // Get form data
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  // Show loading state
  submitBtn.classList.add("loading");

  try {
    // Simulate API call (replace with actual endpoint)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Log form data (in production, send to backend)
    console.log("Form submitted:", data);

    // Show success message
    successMessage.classList.add("show");

    // Reset form
    form.reset();

    // Reset star rating
    const starInputs = form.querySelectorAll(".star-rating input");
    starInputs.forEach((input) => (input.checked = false));

    // Hide success message after 5 seconds
    setTimeout(() => {
      successMessage.classList.remove("show");
    }, 5000);
  } catch (error) {
    console.error("Form submission error:", error);
    errorMessage.classList.add("show");

    // Hide error message after 5 seconds
    setTimeout(() => {
      errorMessage.classList.remove("show");
    }, 5000);
  } finally {
    // Remove loading state
    submitBtn.classList.remove("loading");
  }
});

// Add floating animation to contact info on scroll
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -100px 0px",
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.animation = "fadeIn 0.6s ease-out forwards";
    }
  });
}, observerOptions);

const detailItems = document.querySelectorAll(".detail-item");
detailItems.forEach((item, index) => {
  item.style.opacity = "0";
  item.style.animationDelay = `${index * 0.1}s`;
  observer.observe(item);
});
