
(() => {
  const progress = document.querySelector(".article-progress");
  const copy = document.querySelector("#copy-link");

  function updateProgress() {
    if (!progress) return;
    const height = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = height > 0 ? window.scrollY / height : 0;
    progress.style.width = `${Math.min(100, Math.max(0, ratio * 100))}%`;
  }

  window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();

  copy?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      const old = copy.textContent;
      copy.textContent = "Link copied";
      setTimeout(() => { copy.textContent = old; }, 1500);
    } catch {
      window.prompt("Copy this link:", window.location.href);
    }
  });

  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
})();
