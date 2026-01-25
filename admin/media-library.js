(function () {
  if (!window.CMS || !window.CMS.registerMediaLibrary) {
    return;
  }

  var LIB_NAME = 'taggedMedia';
  var DATA_URL = '/content/media-tags.json';
  var STORAGE_KEY = 'media-tags-cache-v1';

  function safeJsonParse(value, fallback) {
    try {
      return JSON.parse(value);
    } catch (err) {
      return fallback;
    }
  }

  function loadTags() {
    return fetch(DATA_URL + '?ts=' + Date.now(), { cache: 'no-store' })
      .then(function (response) {
        if (!response.ok) {
          throw new Error('Failed to load tags');
        }
        return response.json();
      })
      .catch(function () {
        var cached = localStorage.getItem(STORAGE_KEY);
        return cached ? safeJsonParse(cached, { tags: [], items: [] }) : { tags: [], items: [] };
      });
  }

  function persistTags(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    var backend = window.CMS.getBackend && window.CMS.getBackend();
    var collection = window.CMS.getCollection && window.CMS.getCollection('media_tags');

    if (!backend || !backend.persistEntry || !collection) {
      return Promise.reject(new Error('Backend persistence unavailable'));
    }

    var entry = {
      path: 'content/media-tags.json',
      data: data,
    };

    return backend.persistEntry(entry, {
      collection: collection.toJS ? collection.toJS() : collection,
      commitMessage: 'Update media tags',
    });
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

  function buildUI(state) {
    var overlay = document.createElement('div');
    overlay.className = 'tagged-media-overlay';

    var panel = document.createElement('div');
    panel.className = 'tagged-media-panel';

    var header = document.createElement('div');
    header.className = 'tagged-media-header';
    header.innerHTML = '<h2>Media Tags</h2>';

    var actions = document.createElement('div');
    actions.className = 'tagged-media-actions';

    var addTagBtn = document.createElement('button');
    addTagBtn.type = 'button';
    addTagBtn.textContent = 'Add Tag';

    var renameTagBtn = document.createElement('button');
    renameTagBtn.type = 'button';
    renameTagBtn.textContent = 'Rename Tag';

    var deleteTagBtn = document.createElement('button');
    deleteTagBtn.type = 'button';
    deleteTagBtn.textContent = 'Delete Tag';

    var saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.textContent = 'Save Tags';

    actions.append(addTagBtn, renameTagBtn, deleteTagBtn, saveBtn);

    var body = document.createElement('div');
    body.className = 'tagged-media-body';

    var sidebar = document.createElement('div');
    sidebar.className = 'tagged-media-sidebar';

    var tagList = document.createElement('div');
    tagList.className = 'tagged-media-tags';

    var content = document.createElement('div');
    content.className = 'tagged-media-grid';

    var footer = document.createElement('div');
    footer.className = 'tagged-media-footer';

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.textContent = 'Close';
    footer.append(closeBtn);

    sidebar.append(tagList);
    body.append(sidebar, content);
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
.tagged-media-body {\
  display: grid;\
  grid-template-columns: 200px 1fr;\
  gap: 16px;\
  padding: 16px 24px;\
  flex: 1;\
  overflow: hidden;\
}\
.tagged-media-sidebar {\
  border-right: 1px solid #ece8de;\
  padding-right: 16px;\
  overflow-y: auto;\
}\
.tagged-media-tags {\
  display: flex;\
  flex-direction: column;\
  gap: 8px;\
}\
.tagged-media-tag {\
  border: 1px solid #d8d3c7;\
  padding: 8px 10px;\
  border-radius: 6px;\
  cursor: pointer;\
  background: #fff;\
}\
.tagged-media-tag.is-active {\
  background: #f2efe7;\
  border-color: #c9c3b3;\
  font-weight: 600;\
}\
.tagged-media-grid {\
  display: grid;\
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));\
  gap: 16px;\
  overflow-y: auto;\
  padding-right: 12px;\
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
  flex-direction: column;\
  gap: 8px;\
}\
.tagged-media-card-tags {\
  display: flex;\
  flex-wrap: wrap;\
  gap: 6px;\
  font-size: 12px;\
}\
.tagged-media-chip {\
  border: 1px solid #cfc9bc;\
  border-radius: 999px;\
  padding: 2px 8px;\
  background: #f9f7f1;\
}\
.tagged-media-card-actions {\
  display: flex;\
  gap: 8px;\
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
.tagged-media-modal {\
  position: fixed;\
  inset: 0;\
  background: rgba(0, 0, 0, 0.4);\
  display: flex;\
  align-items: center;\
  justify-content: center;\
  z-index: 10000;\
}\
.tagged-media-modal-content {\
  background: #fff;\
  border-radius: 10px;\
  padding: 16px 20px;\
  min-width: 280px;\
}\
.tagged-media-modal-content h3 {\
  margin: 0 0 12px;\
}\
.tagged-media-checkboxes {\
  display: flex;\
  flex-direction: column;\
  gap: 8px;\
}\
.tagged-media-modal-actions {\
  display: flex;\
  gap: 8px;\
  margin-top: 12px;\
}\
.tagged-media-modal-actions button {\
  border: 1px solid #cfc9bc;\
  background: #f9f7f1;\
  padding: 6px 10px;\
  border-radius: 6px;\
  cursor: pointer;\
}\
';

    overlay.append(style);

    state.overlay = overlay;
    state.tagList = tagList;
    state.grid = content;
    state.closeBtn = closeBtn;
    state.addTagBtn = addTagBtn;
    state.renameTagBtn = renameTagBtn;
    state.deleteTagBtn = deleteTagBtn;
    state.saveBtn = saveBtn;

    document.body.append(overlay);
  }

  function renderTags(state) {
    var tags = ['All'].concat(state.data.tags || []);
    state.tagList.innerHTML = '';

    tags.forEach(function (tag) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tagged-media-tag' + (state.activeTag === tag ? ' is-active' : '');
      btn.textContent = tag;
      btn.addEventListener('click', function () {
        state.activeTag = tag;
        renderTags(state);
        renderGrid(state);
      });
      state.tagList.append(btn);
    });
  }

  function getItemTags(state, path) {
    var items = state.data.items || [];
    var entry = items.find(function (item) {
      return item.path === path;
    });
    return entry ? entry.tags || [] : [];
  }

  function setItemTags(state, path, tags) {
    var items = state.data.items || [];
    var entry = items.find(function (item) {
      return item.path === path;
    });
    if (!entry) {
      items.push({ path: path, tags: tags });
    } else {
      entry.tags = tags;
    }
    state.data.items = items;
    state.dirty = true;
  }

  function renderGrid(state) {
    state.grid.innerHTML = '';
    var mediaItems = state.media || [];
    var activeTag = state.activeTag || 'All';

    mediaItems.forEach(function (item) {
      var tags = getItemTags(state, item.path);
      if (activeTag !== 'All' && tags.indexOf(activeTag) === -1) {
        return;
      }

      var card = document.createElement('div');
      card.className = 'tagged-media-card';

      var img = document.createElement('img');
      img.src = item.url;
      img.alt = item.path;

      var body = document.createElement('div');
      body.className = 'tagged-media-card-body';

      var chips = document.createElement('div');
      chips.className = 'tagged-media-card-tags';
      if (tags.length === 0) {
        var emptyChip = document.createElement('span');
        emptyChip.className = 'tagged-media-chip';
        emptyChip.textContent = 'No tags';
        chips.append(emptyChip);
      } else {
        tags.forEach(function (tag) {
          var chip = document.createElement('span');
          chip.className = 'tagged-media-chip';
          chip.textContent = tag;
          chips.append(chip);
        });
      }

      var actions = document.createElement('div');
      actions.className = 'tagged-media-card-actions';

      var tagBtn = document.createElement('button');
      tagBtn.type = 'button';
      tagBtn.textContent = 'Tags';

      var insertBtn = document.createElement('button');
      insertBtn.type = 'button';
      insertBtn.textContent = 'Insert';

      tagBtn.addEventListener('click', function () {
        openTagEditor(state, item);
      });

      insertBtn.addEventListener('click', function () {
        state.handleInsert({ url: item.url, path: item.path });
      });

      actions.append(tagBtn, insertBtn);
      body.append(chips, actions);
      card.append(img, body);
      state.grid.append(card);
    });
  }

  function openTagEditor(state, item) {
    var modal = document.createElement('div');
    modal.className = 'tagged-media-modal';

    var content = document.createElement('div');
    content.className = 'tagged-media-modal-content';

    var title = document.createElement('h3');
    title.textContent = 'Assign tags';

    var checkboxWrap = document.createElement('div');
    checkboxWrap.className = 'tagged-media-checkboxes';

    var currentTags = getItemTags(state, item.path);
    var tags = state.data.tags || [];

    tags.forEach(function (tag) {
      var label = document.createElement('label');
      var input = document.createElement('input');
      input.type = 'checkbox';
      input.value = tag;
      input.checked = currentTags.indexOf(tag) !== -1;
      label.append(input, document.createTextNode(' ' + tag));
      checkboxWrap.append(label);
    });

    var actions = document.createElement('div');
    actions.className = 'tagged-media-modal-actions';

    var cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.textContent = 'Cancel';

    var saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.textContent = 'Save';

    actions.append(cancelBtn, saveBtn);

    content.append(title, checkboxWrap, actions);
    modal.append(content);
    document.body.append(modal);

    cancelBtn.addEventListener('click', function () {
      modal.remove();
    });

    saveBtn.addEventListener('click', function () {
      var newTags = [];
      checkboxWrap.querySelectorAll('input[type="checkbox"]:checked').forEach(function (input) {
        newTags.push(input.value);
      });
      setItemTags(state, item.path, newTags);
      renderGrid(state);
      modal.remove();
    });
  }

  function registerHandlers(state) {
    state.closeBtn.addEventListener('click', function () {
      if (state.onClose) {
        state.onClose();
      }
    });

    state.addTagBtn.addEventListener('click', function () {
      var name = window.prompt('New tag name');
      if (!name) return;
      if (state.data.tags.indexOf(name) !== -1) return;
      state.data.tags.push(name);
      state.dirty = true;
      renderTags(state);
      renderGrid(state);
    });

    state.renameTagBtn.addEventListener('click', function () {
      var oldName = state.activeTag;
      if (!oldName || oldName === 'All') {
        return;
      }
      var newName = window.prompt('Rename tag', oldName);
      if (!newName || newName === oldName) return;
      state.data.tags = state.data.tags.map(function (tag) {
        return tag === oldName ? newName : tag;
      });
      (state.data.items || []).forEach(function (item) {
        item.tags = (item.tags || []).map(function (tag) {
          return tag === oldName ? newName : tag;
        });
      });
      state.activeTag = newName;
      state.dirty = true;
      renderTags(state);
      renderGrid(state);
    });

    state.deleteTagBtn.addEventListener('click', function () {
      var name = state.activeTag;
      if (!name || name === 'All') {
        return;
      }
      if (!window.confirm('Delete tag "' + name + '"?')) {
        return;
      }
      state.data.tags = state.data.tags.filter(function (tag) {
        return tag !== name;
      });
      (state.data.items || []).forEach(function (item) {
        item.tags = (item.tags || []).filter(function (tag) {
          return tag !== name;
        });
      });
      state.activeTag = 'All';
      state.dirty = true;
      renderTags(state);
      renderGrid(state);
    });

    state.saveBtn.addEventListener('click', function () {
      persistTags(state.data)
        .then(function () {
          state.dirty = false;
          window.alert('Tags saved.');
        })
        .catch(function () {
          window.alert('Tags saved locally, but could not persist to the repo.');
        });
    });
  }

  var TaggedMediaLibrary = {
    name: LIB_NAME,
    init: function () {},
    show: function (options) {
      var state = {
        data: { tags: [], items: [] },
        media: [],
        activeTag: 'All',
        handleInsert: options.handleInsert,
        onClose: options.onClose,
        dirty: false,
      };

      loadTags().then(function (data) {
        state.data = data || { tags: [], items: [] };

        listMedia()
          .then(function (items) {
            var normalized = (items || []).map(normalizeMedia).filter(Boolean);
            state.media = filterImages(normalized);
            buildUI(state);
            renderTags(state);
            renderGrid(state);
            registerHandlers(state);
          })
          .catch(function () {
            buildUI(state);
            renderTags(state);
            registerHandlers(state);
          });
      });
    },
    hide: function () {
      var overlay = document.querySelector('.tagged-media-overlay');
      if (overlay) {
        overlay.remove();
      }
    },
  };

  window.CMS.registerMediaLibrary(TaggedMediaLibrary);
})();
