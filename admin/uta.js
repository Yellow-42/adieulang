(function () {
  if (!window.CMS || !window.CMS.registerEventListener) {
    return;
  }

  function formatNow() {
    var now = new Date();
    var year = now.getFullYear();
    var month = String(now.getMonth() + 1).padStart(2, '0');
    var day = String(now.getDate()).padStart(2, '0');
    var hours = String(now.getHours()).padStart(2, '0');
    var minutes = String(now.getMinutes()).padStart(2, '0');
    return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes;
  }

  window.CMS.registerEventListener('preSave', function ({ entry, collection }) {
    if (!collection || collection.get('name') !== 'site') {
      return entry;
    }

    var items = entry.getIn(['data', 'items']);
    if (!items || !items.map) {
      return entry;
    }

    var now = formatNow();
    var updatedItems = items.map(function (item) {
      var updatedAt = item && item.get ? item.get('updated_at') : null;
      if (updatedAt) {
        return item;
      }
      return item.set('updated_at', now);
    });

    return entry.setIn(['data', 'items'], updatedItems);
  });
})();
