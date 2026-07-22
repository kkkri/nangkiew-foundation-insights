
(() => {
  const cards = [...document.querySelectorAll("[data-post-card]")];
  const search = document.querySelector("#article-search");
  const filters = [...document.querySelectorAll("[data-filter]")];
  let activeCategory = "All";

  function update() {
    const q = (search?.value || "").trim().toLowerCase();
    let visible = 0;

    cards.forEach((card) => {
      const category = card.dataset.category || "";
      const haystack = card.dataset.search || "";
      const categoryMatch = activeCategory === "All" || category === activeCategory;
      const searchMatch = !q || haystack.includes(q);
      const show = categoryMatch && searchMatch;
      card.hidden = !show;
      if (show) visible++;
    });

    const empty = document.querySelector("#empty-state");
    if (empty) empty.hidden = visible !== 0;
  }

  search?.addEventListener("input", update);

  filters.forEach((button) => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.filter;
      filters.forEach((b) => b.classList.remove("active"));
      button.classList.add("active");
      update();
    });
  });

  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
})();
