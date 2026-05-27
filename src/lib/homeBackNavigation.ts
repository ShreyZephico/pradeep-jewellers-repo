/** Inline script for root layout — must stay in sync with homeRefetch session keys. */
export const HOME_BACK_NAV_SCRIPT = `
(function () {
  var NOT_FOUND_KEY = "pj-was-404";
  var lastPath = window.location.pathname;

  function isHome(path) {
    return path === "/" || path === "";
  }

  function hardReloadHome() {
    if (!isHome(window.location.pathname)) return;
    try {
      sessionStorage.removeItem(NOT_FOUND_KEY);
    } catch (e) {}
    window.location.reload();
  }

  function syncLastPath() {
    lastPath = window.location.pathname;
  }

  function onPopState() {
    var nextPath = window.location.pathname;
    var cameToHome = isHome(nextPath) && !isHome(lastPath);
    lastPath = nextPath;
    if (!cameToHome) return;
    setTimeout(hardReloadHome, 0);
    setTimeout(hardReloadHome, 50);
  }

  var pushState = history.pushState.bind(history);
  var replaceState = history.replaceState.bind(history);
  history.pushState = function () {
    pushState.apply(history, arguments);
    syncLastPath();
  };
  history.replaceState = function () {
    replaceState.apply(history, arguments);
    syncLastPath();
  };

  window.addEventListener("popstate", onPopState, true);

  window.addEventListener("pageshow", function (e) {
    if (e.persisted) {
      window.location.reload();
      return;
    }
    if (isHome(window.location.pathname) && sessionStorage.getItem(NOT_FOUND_KEY) === "1") {
      hardReloadHome();
    }
  });
})();
`;
