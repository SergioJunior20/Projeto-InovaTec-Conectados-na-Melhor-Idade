(function updateApp() {
  if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
  const hadController = Boolean(navigator.serviceWorker.controller);
  let reloading = false;
  let editing = false;
  document.addEventListener('input',() => { editing = true; },{once:true});
  navigator.serviceWorker.addEventListener('controllerchange',() => {
    if (!hadController || reloading || editing || !navigator.onLine) return;
    reloading = true;
    location.reload();
  });
  navigator.serviceWorker.register(new URL('sw.js',document.baseURI)).catch(() => {});
})();
