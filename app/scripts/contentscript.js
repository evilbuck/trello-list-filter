'use strict';

var $filter = $('<div id="evil-list-filter"><input type="search" placeholder="Filter Lists"/></div>');
$filter.find('input').on('keyup', function() {
  var $input = $(this);
  $('#board > .list').each(function(el, i) {
    var $list = $(this);

    var query = new RegExp($input.val(), 'i');
    var listName = $list.find('h2.list-header-name').text().trim();
    if (query.test(listName)) {
      $list.show();
    } else {
      $list.hide();
    }
  });
});

$('body').on('DOMNodeInserted', function() {
  if ($('.board-header a').length > 1) {
    $('body').off('DOMNodeInserted');
    $('.board-header').append($filter);
  }
});
