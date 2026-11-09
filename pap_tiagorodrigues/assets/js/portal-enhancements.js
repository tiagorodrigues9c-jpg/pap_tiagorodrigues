(() => {
  const showToast = (message) => {
    const previous = document.querySelector(".portal-toast");
    if (previous) previous.remove();
    const toast = document.createElement("div");
    toast.className = "portal-toast";
    toast.setAttribute("role", "status");
    toast.innerHTML = `<i class="bi bi-check-circle"></i>${message}`;
    document.body.appendChild(toast);
    window.setTimeout(() => toast.remove(), 3500);
  };

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-demo-action]");
    if (!button) return;
    event.preventDefault();
    showToast(button.dataset.demoAction);
  });

  document.querySelectorAll("a[href^='#']").forEach((link) => {
    link.addEventListener("click", () => {
      const target = document.querySelector(link.getAttribute("href"));
      if (target) target.setAttribute("tabindex", "-1");
    });
  });
})();
