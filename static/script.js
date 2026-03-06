// Parallax hero background
const heroBg = document.querySelector(".hero-bg");
if (heroBg) {
  window.addEventListener("scroll", () => {
    heroBg.style.transform = `translateY(${window.scrollY * 0.22}px)`;
  });
}

// Scroll progress
const progressBar = document.getElementById("scrollProgressBar");
function updateScrollProgress() {
  if (!progressBar) return;
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  progressBar.style.width = `${percent}%`;
}
window.addEventListener("scroll", updateScrollProgress);
updateScrollProgress();

// Cursor glow
const glow = document.querySelector(".cursor-glow");
if (glow) {
  document.addEventListener("mousemove", (e) => {
    glow.style.left = `${e.clientX}px`;
    glow.style.top = `${e.clientY}px`;
  });
}

// Theme toggle
const toggle = document.getElementById("themeToggle");
const savedTheme = localStorage.getItem("theme");

function applyTheme(theme) {
  if (theme === "light") {
    document.body.classList.add("light-mode");
    if (toggle) toggle.textContent = "☀️";
  } else {
    document.body.classList.remove("light-mode");
    if (toggle) toggle.textContent = "🌙";
  }
}

applyTheme(savedTheme || "dark");

if (toggle) {
  toggle.addEventListener("click", () => {
    const nextTheme = document.body.classList.contains("light-mode")
      ? "dark"
      : "light";
    localStorage.setItem("theme", nextTheme);
    applyTheme(nextTheme);
  });
}

// Lightbox
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxClose = document.getElementById("lightboxClose");

document.querySelectorAll(".lightbox-img").forEach((img) => {
  img.addEventListener("click", () => {
    if (!lightbox || !lightboxImg) return;
    lightbox.classList.add("active");
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt || "Expanded image";
  });
});

if (lightboxClose) {
  lightboxClose.addEventListener("click", () => {
    lightbox.classList.remove("active");
  });
}

if (lightbox) {
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) {
      lightbox.classList.remove("active");
    }
  });
}

// Reveal on scroll
const reveals = document.querySelectorAll(".reveal");
if (reveals.length > 0) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    { threshold: 0.12 },
  );

  reveals.forEach((el) => observer.observe(el));
}

// Carousels
document.querySelectorAll("[data-carousel]").forEach((carousel) => {
  const slides = carousel.querySelectorAll(".carousel-slide");
  const prevBtn = carousel.querySelector(".prev");
  const nextBtn = carousel.querySelector(".next");
  const dotsWrap = carousel.querySelector(".carousel-dots");

  if (!slides.length) return;

  let current = 0;

  function renderDots() {
    dotsWrap.innerHTML = "";
    slides.forEach((_, index) => {
      const dot = document.createElement("button");
      dot.className = `carousel-dot ${index === current ? "active" : ""}`;
      dot.type = "button";
      dot.addEventListener("click", () => {
        current = index;
        updateSlides();
      });
      dotsWrap.appendChild(dot);
    });
  }

  function updateSlides() {
    slides.forEach((slide, index) => {
      slide.classList.toggle("active", index === current);
    });
    renderDots();
  }

  prevBtn?.addEventListener("click", () => {
    current = (current - 1 + slides.length) % slides.length;
    updateSlides();
  });

  nextBtn?.addEventListener("click", () => {
    current = (current + 1) % slides.length;
    updateSlides();
  });

  updateSlides();
});
