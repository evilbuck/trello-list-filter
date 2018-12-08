'use strict';

var $filter = $('<div id="evil-list-filter">' +
                '<input class="header-search-input" type="text" placeholder="Filter Lists"/></div>');
$filter.find('input').on('keyup', function() {
  var $input = $(this);
  var query = new RegExp($input.val(), 'i');
  $('#board > .list-wrapper').each(function(el, i) {
    var $list = $(this);

    var listName = $list.find('.list-header-name').text().trim();
    if (query.test(listName)) {
      $list.show();
    } else {
      $list.hide();
    }
  });
});

let filterInput = $filter.find('input').get(0);
filterInput.addEventListener('focus', (event) => {
  filterInput.select();
});

var domObserver = new MutationObserver(function(mutations) {
  if (!$('#header').find($filter).length) {
    $filter.insertAfter('#header .header-search');
  }
});

domObserver.observe(document.querySelector('#header'), { childList: true });
