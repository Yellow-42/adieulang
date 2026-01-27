(() => {
  const LIB_NAME = 'taggedMedia';

  function listMedia() {
    var backend = window.CMS.getBackend && window.CMS.getBackend();
    if (backend && backend.listMedia) {
      return backend.listMedia();
    }
    if (backend && backend.getMedia) {
      return backend.getMedia();
    }
    return Promise.resolve([]);
  }

  function normalizeMedia(item) {
    if (!item) return null;
    var path = item.path || item.id || item.name || item.url || '';
    var url = item.url || (path && path.indexOf('/') === 0 ? path : '/' + path);
    return { path: path, url: url };
  }

  function filterImages(items) {
    return items.filter(function (item) {
      var url = (item.url || '').toLowerCase();
      return url.match(/\.(png|jpg|jpeg|gif|webp|svg)$/);
    });
  }

  function buildUI(state) {
    var overlay = document.createElement('div');
    overlay.className = 'tagged-media-overlay';

    var panel = document.createElement('div');
    panel.className = 'tagged-media-panel';

    var header = document.createElement('div');
    header.className = 'tagged-media-header';
    header.innerHTML = '<h2>Media assets</h2>';

    var actions = document.createElement('div');
    actions.className = 'tagged-media-actions';

    var body = document.createElement('div');
    body.className = 'tagged-media-body single';

    var content = document.createElement('div');
    content.className = 'tagged-media-grid';

    var footer = document.createElement('div');
    footer.className = 'tagged-media-footer';

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.textContent = 'Close';
    footer.append(closeBtn);

    body.append(content);
    header.append(actions);
    panel.append(header, body, footer);
    overlay.append(panel);

    var style = document.createElement('style');
    style.textContent = '\
.tagged-media-overlay {\
  position: fixed;\
  inset: 0;\
  background: rgba(14, 14, 14, 0.35);\
  display: flex;\
  align-items: center;\
  justify-content: center;\
  z-index: 9999;\
}\
.tagged-media-panel {\
  width: min(1200px, 95vw);\
  height: min(780px, 90vh);\
  background: #ffffff;\
  border-radius: 12px;\
  display: flex;\
  flex-direction: column;\
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.2);\
  font-family: "Noto Serif", "Times New Roman", serif;\
}\
.tagged-media-header {\
  display: flex;\
  justify-content: space-between;\
  align-items: center;\
  padding: 20px 24px;\
  border-bottom: 1px solid #e6e3dc;\
}\
.tagged-media-header h2 {\
  margin: 0;\
  font-size: 20px;\
}\
.tagged-media-actions {\
  display: flex;\
  gap: 8px;\
}\
.tagged-media-actions button {\
  border: 1px solid #b9b5ac;\
  background: #faf9f5;\
  padding: 6px 12px;\
  border-radius: 6px;\
  cursor: pointer;\
}\
.tagged-media-body.single {\
  padding: 16px 24px;\
  flex: 1;\
  overflow: hidden;\
}\
.tagged-media-grid {\
  display: grid;\
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));\
  gap: 16px;\
  overflow-y: auto;\
  padding-right: 12px;\
  height: 100%;\
}\
.tagged-media-card {\
  border: 1px solid #e3ded2;\
  border-radius: 8px;\
  overflow: hidden;\
  display: flex;\
  flex-direction: column;\
  background: #fff;\
}\
.tagged-media-card img {\
  width: 100%;\
  height: 140px;\
  object-fit: cover;\
  background: #f2efe7;\
}\
.tagged-media-card-body {\
  padding: 10px;\
  display: flex;\
  gap: 8px;\
}\
.tagged-media-card-actions {\
  display: flex;\
  gap: 8px;\
  width: 100%;\
}\
.tagged-media-card-actions button {\
  flex: 1;\
  border: 1px solid #cfc9bc;\
  background: #fff;\
  padding: 6px;\
  border-radius: 6px;\
  cursor: pointer;\
}\
.tagged-media-footer {\
  padding: 12px 24px 20px;\
  border-top: 1px solid #e6e3dc;\
  display: flex;\
  justify-content: flex-end;\
}\
.tagged-media-footer button {\
  border: 1px solid #b9b5ac;\
  background: #faf9f5;\
  padding: 6px 16px;\
  border-radius: 6px;\
  cursor: pointer;\
}\
';

    overlay.append(style);

    state.overlay = overlay;
    state.grid = content;
    state.closeBtn = closeBtn;
    state.syncBtn = null;

    document.body.append(overlay);
  }

  function renderGrid(state) {
    state.grid.innerHTML = '';
    var mediaItems = state.media || [];

    mediaItems.forEach(function (item) {
      var card = document.createElement('div');
      card.className = 'tagged-media-card';

      var img = document.createElement('img');
      img.src = item.url;
      img.alt = item.path;

      var body = document.createElement('div');
      body.className = 'tagged-media-card-body';

      var actions = document.createElement('div');
      actions.className = 'tagged-media-card-actions';

      var insertBtn = document.createElement('button');
      insertBtn.type = 'button';
      insertBtn.textContent = 'Insert';

      insertBtn.addEventListener('click', function () {
        state.handleInsert({ url: item.url, path: item.path });
      });

      actions.append(insertBtn);
      body.append(actions);
      card.append(img, body);
      state.grid.append(card);
    });
  }

  function registerHandlers(state) {
    state.closeBtn.addEventListener('click', function () {
      if (state.onClose) {
        state.onClose();
      }
    });

    // No sync buttons; media index is generated server-side.
  }

  function createLibrary() {
    return {
      name: LIB_NAME,
      init: function () {},
      show: function (options) {
        var state = {
          media: [],
          handleInsert: options.handleInsert,
          onClose: options.onClose,
        };

        listMedia()
          .then(function (items) {
            var normalized = (items || []).map(normalizeMedia).filter(Boolean);
            state.media = filterImages(normalized);
            buildUI(state);
            renderGrid(state);
            registerHandlers(state);
          })
          .catch(function () {
            buildUI(state);
            registerHandlers(state);
          });
      },
      hide: function () {
        var overlay = document.querySelector('.tagged-media-overlay');
        if (overlay) {
          overlay.remove();
        }
      },
    };
  }

  function registerWhenReady(attemptsLeft) {
    if (window.CMS && window.CMS.registerMediaLibrary) {
      window.CMS.registerMediaLibrary(createLibrary());
      return;
    }
    if (attemptsLeft <= 0) {
      return;
    }
    setTimeout(function () {
      registerWhenReady(attemptsLeft - 1);
    }, 100);
  }

  registerWhenReady(50);
})();
