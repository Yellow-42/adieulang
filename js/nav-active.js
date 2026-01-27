(function () {
  var navLinks = document.querySelectorAll('.site-nav a');
  if (!navLinks.length) return;

  var path = window.location.pathname.replace(/\/+$/, '');
  if (path === '') {
    path = '/';
  }

  function toZhPath(currentPath) {
    if (currentPath.indexOf('/zh/') === 0) {
      return currentPath;
    }
    if (currentPath === '/') {
      return '/zh/index.html';
    }
    return '/zh' + currentPath;
  }

  function toEnPath(currentPath) {
    if (currentPath.indexOf('/zh/') === 0) {
      var enPath = currentPath.replace(/^\/zh/, '');
      return enPath === '' ? '/' : enPath;
    }
    return currentPath;
  }

  try {
    var pref = localStorage.getItem('lang-pref');
    var isZhPage = path.indexOf('/zh/') === 0;
    if (!pref) {
      localStorage.setItem('lang-pref', 'zh');
      if (!isZhPage) {
        window.location.replace(toZhPath(path));
        return;
      }
    } else if (pref === 'zh' && !isZhPage) {
      window.location.replace(toZhPath(path));
      return;
    } else if (pref === 'en' && isZhPage) {
      window.location.replace(toEnPath(path));
      return;
    }
  } catch (e) {}

  navLinks.forEach(function (link) {
    var href = link.getAttribute('href') || '';
    if (!href) return;
    var normalized = href.replace(/\/+$/, '');
    if (normalized === '') {
      normalized = '/';
    }
    if (normalized === path) {
      link.classList.add('active');
    }
  });

  var langLinks = document.querySelectorAll('.lang-switch a');
  function setLangPrefFromLink(link) {
    try {
      var target = link.getAttribute('href') || '';
      if (target.indexOf('/zh/') === 0 || target === '/zh/index.html') {
        localStorage.setItem('lang-pref', 'zh');
      } else {
        localStorage.setItem('lang-pref', 'en');
      }
    } catch (e) {}
  }

  langLinks.forEach(function (link) {
    link.addEventListener('click', function (event) {
      setLangPrefFromLink(link);
      var target = link.getAttribute('href') || '';
      if (target) {
        event.preventDefault();
        window.location.assign(target);
      }
    }, { capture: true });
  });

  var nav = document.querySelector('.site-nav');
  var toggle = document.querySelector('.nav-toggle');
  var langSwitch = document.querySelector('.lang-switch');
  var headerRight = document.querySelector('.site-header-right');

  if (!nav || !toggle || !langSwitch || !headerRight) return;

  function moveLangSwitchIntoNav() {
    if (langSwitch.parentNode !== nav) {
      nav.appendChild(langSwitch);
    }
  }

  function moveLangSwitchToHeader() {
    if (langSwitch.parentNode !== headerRight) {
      if (nav.nextSibling) {
        headerRight.insertBefore(langSwitch, nav.nextSibling);
      } else {
        headerRight.appendChild(langSwitch);
      }
    }
  }

  function syncLangSwitchPlacement() {
    var isMobile = window.matchMedia('(max-width: 720px)').matches;
    var isOpen = nav.classList.contains('is-open');
    if (isMobile && isOpen) {
      moveLangSwitchIntoNav();
    } else {
      moveLangSwitchToHeader();
    }
  }

  toggle.addEventListener('click', function () {
    setTimeout(syncLangSwitchPlacement, 0);
  });

  window.addEventListener('resize', syncLangSwitchPlacement);
  syncLangSwitchPlacement();
})();
