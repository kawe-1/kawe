/* Kawe brand book — interactions */
(function () {
  "use strict";

  /* ---- nav scroll state ---- */
  const nav = document.querySelector(".nav");
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 20);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---- light / dark (cream / espresso) toggle ---- */
  const toggle = document.querySelector(".mode-toggle");
  const saved = localStorage.getItem("kawe-mode");
  if (saved === "dark") document.body.classList.add("dark");
  const syncToggleLabel = () => {
    const dark = document.body.classList.contains("dark");
    toggle.querySelector("span").textContent = dark ? "Cream" : "Espresso";
  };
  syncToggleLabel();
  toggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const dark = document.body.classList.contains("dark");
    localStorage.setItem("kawe-mode", dark ? "dark" : "light");
    syncToggleLabel();
  });

  /* ---- reveal on scroll ---- */
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  /* ---- toast ---- */
  const toast = document.querySelector(".toast");
  let toastT;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(() => toast.classList.remove("show"), 1600);
  }

  /* ---- copy color on click ---- */
  document.querySelectorAll("[data-copy]").forEach((el) => {
    el.addEventListener("click", () => {
      const val = el.getAttribute("data-copy");
      navigator.clipboard?.writeText(val).then(
        () => showToast(`Copied ${val}`),
        () => showToast(val)
      );
    });
  });

  /* ---- logo concept selector ---- */
  const concepts = document.querySelectorAll(".concept");
  const featureArt = document.querySelector("#featureArt");
  const featureTitle = document.querySelector("#featureTitle");
  const featureDesc = document.querySelector("#featureDesc");
  const featureMetaConcept = document.querySelector("#featureMetaConcept");
  concepts.forEach((c) => {
    c.addEventListener("click", () => {
      concepts.forEach((x) => x.classList.remove("active"));
      c.classList.add("active");
      const svg = c.querySelector(".concept-canvas svg").cloneNode(true);
      svg.removeAttribute("width");
      svg.removeAttribute("height");
      featureArt.innerHTML = "";
      featureArt.appendChild(svg);
      featureTitle.textContent = c.dataset.title;
      featureDesc.textContent = c.dataset.desc;
      featureMetaConcept.textContent = c.dataset.concept;
    });
  });

  /* ---- flashcard flip ---- */
  document.querySelectorAll(".flashcard").forEach((fc) => {
    fc.addEventListener("click", () => fc.classList.toggle("flipped"));
  });
})();
