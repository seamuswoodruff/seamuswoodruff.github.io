// Inline-loaded ASAP in <head> so there's no flash of wrong theme.
// Sets data-theme on <html> before body paints.
(function () {
  try {
    var saved = localStorage.getItem("aid.theme");
    var theme = saved === "light" || saved === "dark" ? saved : "dark";
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {
    document.documentElement.setAttribute("data-theme", "dark");
  }
})();
