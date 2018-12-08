const $filter = $('<div id="evil-list-filter">' +
                '<input class="header-search-input" type="text" placeholder="Filter Lists"/></div>');
$filter.find('input').on('keyup', function() {
  let $input = $(this);
  let query = new RegExp($input.val(), 'i');
  $('#board > .list-wrapper').each(function(el, i) {
    let $list = $(this);

    let listName = $list.find('.list-header-name').text().trim();
    if (query.test(listName)) {
      $list.show();
    } else {
      $list.hide();
    }
  });
});

const filterInput = $filter.find('input').get(0);
filterInput.addEventListener('focus', (event) => {
  filterInput.select();
});

const domObserver = new MutationObserver(function(mutations) {
  if (!$('#header').find($filter).length) {
    $filter.insertAfter('#header .header-search');
  }
});

domObserver.observe(document.querySelector('#header'), { childList: true });