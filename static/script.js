// =========================================================
// MATE CODE STUDIO
// SHARED WEBSITE JAVASCRIPT
// =========================================================


// =========================================================
// MOBILE NAVIGATION
// Works automatically with:
// - Homepage
// - Services
// - Case Studies
// =========================================================

function initMobileNavigation() {
  const navConfigs = [
    {
      container: ".launch-nav",
      links: ".launch-links",
    },
    {
      container: ".services-nav",
      links: ".services-links",
    },
    {
      container: ".case-nav",
      links: ".case-nav-links",
    },
  ];

  let navContainer = null;
  let navLinks = null;

  for (const config of navConfigs) {
    const container = document.querySelector(config.container);
    const links = document.querySelector(config.links);

    if (container && links) {
      navContainer = container;
      navLinks = links;
      break;
    }
  }

  if (!navContainer || !navLinks) {
    return;
  }

  // -----------------------------------------
  // Inject shared mobile navigation CSS
  // -----------------------------------------

  const mobileNavStyles = document.createElement("style");

  mobileNavStyles.textContent = `
    .mcs-mobile-menu-button {
      display: none;
      width: 44px;
      height: 44px;
      padding: 0;
      border: 1px solid rgba(245, 242, 235, 0.18);
      border-radius: 9px;
      background: rgba(245, 242, 235, 0.04);
      cursor: pointer;
      align-items: center;
      justify-content: center;
      transition:
        border-color 0.2s ease,
        background 0.2s ease;
    }

    .mcs-mobile-menu-button:hover {
      border-color: rgba(176, 141, 87, 0.7);
      background: rgba(176, 141, 87, 0.08);
    }

    .mcs-mobile-menu-icon {
      width: 18px;
      height: 14px;
      position: relative;
      display: block;
    }

    .mcs-mobile-menu-icon span {
      position: absolute;
      left: 0;
      width: 100%;
      height: 1.5px;
      border-radius: 999px;
      background: #f5f2eb;
      transition:
        transform 0.25s ease,
        top 0.25s ease,
        opacity 0.2s ease;
    }

    .mcs-mobile-menu-icon span:nth-child(1) {
      top: 0;
    }

    .mcs-mobile-menu-icon span:nth-child(2) {
      top: 6px;
    }

    .mcs-mobile-menu-icon span:nth-child(3) {
      top: 12px;
    }

    .mobile-open .mcs-mobile-menu-icon span:nth-child(1) {
      top: 6px;
      transform: rotate(45deg);
    }

    .mobile-open .mcs-mobile-menu-icon span:nth-child(2) {
      opacity: 0;
    }

    .mobile-open .mcs-mobile-menu-icon span:nth-child(3) {
      top: 6px;
      transform: rotate(-45deg);
    }

    @media (max-width: 900px) {
      .mcs-mobile-menu-button {
        display: flex;
      }

      .launch-nav,
      .services-nav,
      .case-nav {
        position: relative;
      }

      .launch-nav.mobile-open .launch-links,
      .services-nav.mobile-open .services-links,
      .case-nav.mobile-open .case-nav-links {
        display: flex;

        position: absolute;
        top: calc(100% + 1px);
        left: 0;
        right: 0;

        flex-direction: column;
        align-items: stretch;

        gap: 0;

        padding: 14px;

        background: rgba(15, 17, 19, 0.98);

        border:
          1px solid rgba(245, 242, 235, 0.12);

        border-top: 0;

        border-radius:
          0 0 12px 12px;

        box-shadow:
          0 24px 50px rgba(0, 0, 0, 0.35);

        backdrop-filter: blur(18px);
      }

      .launch-nav.mobile-open .launch-links a,
      .services-nav.mobile-open .services-links a,
      .case-nav.mobile-open .case-nav-links a {
        width: 100%;

        display: flex;
        align-items: center;

        min-height: 48px;

        padding: 0 14px;

        border-bottom:
          1px solid rgba(245, 242, 235, 0.08);

        color:
          rgba(245, 242, 235, 0.76);

        font-size: 0.82rem;
        font-weight: 700;
      }

      .launch-nav.mobile-open .launch-links a:last-child,
      .services-nav.mobile-open .services-links a:last-child,
      .case-nav.mobile-open .case-nav-links a:last-child {
        border-bottom: 0;
      }

      .launch-nav.mobile-open .launch-links a:hover,
      .services-nav.mobile-open .services-links a:hover,
      .case-nav.mobile-open .case-nav-links a:hover {
        color: #b08d57;
      }
    }

    @media (min-width: 901px) {
      .mcs-mobile-menu-button {
        display: none !important;
      }
    }
  `;

  document.head.appendChild(mobileNavStyles);


  // -----------------------------------------
  // Create menu button
  // -----------------------------------------

  const menuButton = document.createElement("button");

  menuButton.type = "button";
  menuButton.className = "mcs-mobile-menu-button";

  menuButton.setAttribute(
    "aria-label",
    "Open navigation menu",
  );

  menuButton.setAttribute(
    "aria-expanded",
    "false",
  );

  menuButton.innerHTML = `
    <span
      class="mcs-mobile-menu-icon"
      aria-hidden="true"
    >
      <span></span>
      <span></span>
      <span></span>
    </span>
  `;

  navContainer.appendChild(menuButton);


  // -----------------------------------------
  // Open / close functions
  // -----------------------------------------

  function openMenu() {
    navContainer.classList.add("mobile-open");

    menuButton.setAttribute(
      "aria-expanded",
      "true",
    );

    menuButton.setAttribute(
      "aria-label",
      "Close navigation menu",
    );
  }

  function closeMenu() {
    navContainer.classList.remove("mobile-open");

    menuButton.setAttribute(
      "aria-expanded",
      "false",
    );

    menuButton.setAttribute(
      "aria-label",
      "Open navigation menu",
    );
  }

  function toggleMenu() {
    const isOpen =
      navContainer.classList.contains(
        "mobile-open",
      );

    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  }


  // -----------------------------------------
  // Button click
  // -----------------------------------------

  menuButton.addEventListener(
    "click",
    (event) => {
      event.stopPropagation();

      toggleMenu();
    },
  );


  // -----------------------------------------
  // Close when clicking a navigation link
  // -----------------------------------------

  navLinks
    .querySelectorAll("a")
    .forEach((link) => {
      link.addEventListener(
        "click",
        closeMenu,
      );
    });


  // -----------------------------------------
  // Close when clicking outside
  // -----------------------------------------

  document.addEventListener(
    "click",
    (event) => {
      if (
        !navContainer.contains(
          event.target,
        )
      ) {
        closeMenu();
      }
    },
  );


  // -----------------------------------------
  // Escape key
  // -----------------------------------------

  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    },
  );


  // -----------------------------------------
  // Desktop resize cleanup
  // -----------------------------------------

  window.addEventListener(
    "resize",
    () => {
      if (window.innerWidth > 900) {
        closeMenu();
      }
    },
  );
}


initMobileNavigation();


// =========================================================
// PARALLAX HERO BACKGROUND
// Legacy pages only
// =========================================================

const heroBg =
  document.querySelector(".hero-bg");

if (heroBg) {
  window.addEventListener(
    "scroll",
    () => {
      heroBg.style.transform =
        `translateY(${window.scrollY * 0.22}px)`;
    },
    {
      passive: true,
    },
  );
}


// =========================================================
// SCROLL PROGRESS
// Legacy pages only
// =========================================================

const progressBar =
  document.getElementById(
    "scrollProgressBar",
  );

function updateScrollProgress() {
  if (!progressBar) {
    return;
  }

  const scrollTop =
    window.scrollY;

  const documentHeight =
    document.documentElement
      .scrollHeight -
    window.innerHeight;

  const percentage =
    documentHeight > 0
      ? (
          scrollTop /
          documentHeight
        ) * 100
      : 0;

  progressBar.style.width =
    `${percentage}%`;
}

if (progressBar) {
  window.addEventListener(
    "scroll",
    updateScrollProgress,
    {
      passive: true,
    },
  );

  updateScrollProgress();
}


// =========================================================
// CURSOR GLOW
// Legacy pages only
// =========================================================

const glow =
  document.querySelector(
    ".cursor-glow",
  );

if (glow) {
  document.addEventListener(
    "mousemove",
    (event) => {
      glow.style.left =
        `${event.clientX}px`;

      glow.style.top =
        `${event.clientY}px`;
    },
  );
}


// =========================================================
// THEME TOGGLE
// Legacy pages only
// =========================================================

const toggle =
  document.getElementById(
    "themeToggle",
  );

const savedTheme =
  localStorage.getItem("theme");

function applyTheme(theme) {
  if (theme === "light") {
    document.body.classList.add(
      "light-mode",
    );

    if (toggle) {
      toggle.textContent = "☀️";
    }
  } else {
    document.body.classList.remove(
      "light-mode",
    );

    if (toggle) {
      toggle.textContent = "🌙";
    }
  }
}

if (toggle) {
  applyTheme(
    savedTheme || "dark",
  );

  toggle.addEventListener(
    "click",
    () => {
      const nextTheme =
        document.body.classList.contains(
          "light-mode",
        )
          ? "dark"
          : "light";

      localStorage.setItem(
        "theme",
        nextTheme,
      );

      applyTheme(nextTheme);
    },
  );
}


// =========================================================
// LIGHTBOX
// =========================================================

const lightbox =
  document.getElementById(
    "lightbox",
  );

const lightboxImg =
  document.getElementById(
    "lightboxImg",
  );

const lightboxClose =
  document.getElementById(
    "lightboxClose",
  );


function openLightbox(img) {
  if (
    !lightbox ||
    !lightboxImg
  ) {
    return;
  }

  lightbox.classList.add(
    "active",
  );

  lightbox.setAttribute(
    "aria-hidden",
    "false",
  );

  lightboxImg.src =
    img.src;

  lightboxImg.alt =
    img.alt ||
    "Expanded project image";

  document.body.style.overflow =
    "hidden";
}


function closeLightbox() {
  if (!lightbox) {
    return;
  }

  lightbox.classList.remove(
    "active",
  );

  lightbox.setAttribute(
    "aria-hidden",
    "true",
  );

  document.body.style.overflow =
    "";
}


document
  .querySelectorAll(
    ".lightbox-img",
  )
  .forEach((img) => {
    img.addEventListener(
      "click",
      () => {
        openLightbox(img);
      },
    );
  });


if (lightboxClose) {
  lightboxClose.addEventListener(
    "click",
    closeLightbox,
  );
}


if (lightbox) {
  lightbox.addEventListener(
    "click",
    (event) => {
      if (
        event.target === lightbox
      ) {
        closeLightbox();
      }
    },
  );
}


document.addEventListener(
  "keydown",
  (event) => {
    if (
      event.key === "Escape" &&
      lightbox?.classList.contains(
        "active",
      )
    ) {
      closeLightbox();
    }
  },
);


// =========================================================
// REVEAL ON SCROLL
// =========================================================

const reveals =
  document.querySelectorAll(
    ".reveal",
  );

const prefersReducedMotion =
  window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;


if (reveals.length > 0) {
  if (prefersReducedMotion) {
    reveals.forEach(
      (element) => {
        element.classList.add(
          "visible",
        );
      },
    );
  } else {
    const revealObserver =
      new IntersectionObserver(
        (entries, observer) => {
          entries.forEach(
            (entry) => {
              if (
                entry.isIntersecting
              ) {
                entry.target
                  .classList.add(
                    "visible",
                  );

                observer.unobserve(
                  entry.target,
                );
              }
            },
          );
        },
        {
          threshold: 0.1,
          rootMargin:
            "0px 0px -30px 0px",
        },
      );

    reveals.forEach(
      (element) => {
        revealObserver.observe(
          element,
        );
      },
    );
  }
}


// =========================================================
// CAROUSELS
// Legacy case studies / components
// =========================================================

document
  .querySelectorAll(
    "[data-carousel]",
  )
  .forEach((carousel) => {

    const slides =
      carousel.querySelectorAll(
        ".carousel-slide",
      );

    const prevButton =
      carousel.querySelector(
        ".prev",
      );

    const nextButton =
      carousel.querySelector(
        ".next",
      );

    const dotsContainer =
      carousel.querySelector(
        ".carousel-dots",
      );


    if (!slides.length) {
      return;
    }


    let currentSlide = 0;


    function renderDots() {
      if (!dotsContainer) {
        return;
      }

      dotsContainer.innerHTML = "";

      slides.forEach(
        (_, index) => {

          const dot =
            document.createElement(
              "button",
            );

          dot.className =
            `carousel-dot ${
              index === currentSlide
                ? "active"
                : ""
            }`;

          dot.type = "button";

          dot.setAttribute(
            "aria-label",
            `Go to slide ${index + 1}`,
          );

          dot.addEventListener(
            "click",
            () => {
              currentSlide =
                index;

              updateSlides();
            },
          );

          dotsContainer.appendChild(
            dot,
          );
        },
      );
    }


    function updateSlides() {
      slides.forEach(
        (slide, index) => {
          slide.classList.toggle(
            "active",
            index === currentSlide,
          );
        },
      );

      renderDots();
    }


    prevButton?.addEventListener(
      "click",
      () => {
        currentSlide =
          (
            currentSlide -
            1 +
            slides.length
          ) %
          slides.length;

        updateSlides();
      },
    );


    nextButton?.addEventListener(
      "click",
      () => {
        currentSlide =
          (
            currentSlide +
            1
          ) %
          slides.length;

        updateSlides();
      },
    );


    updateSlides();
  });