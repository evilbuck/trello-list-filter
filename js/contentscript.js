const storageKey = 'trello-list-filter:queryString';

function getCurrentItems() {
  let currentItems;
  try {
    currentItems = JSON.parse(localStorage.getItem(storageKey));
    if (!(currentItems instanceof Array)) {
      throw new Error('items not an Array');
    }
  } catch(error) {
    currentItems = [];
  }

  return currentItems;
}

function saveQuery(expr) {
  // don't save a lack of value
  if (expr === '' || expr === null || expr === undefined) {
    return;
  }
  let currentItems = getCurrentItems();
  currentItems.unshift(expr);

  let updatedItems = currentItems.reduce((uniqueItems, item) => {
    if (!uniqueItems.includes(item)) {
      uniqueItems.push(item);
    }

    return uniqueItems;
  }, []).slice(0, 7);

  localStorage.setItem(storageKey, JSON.stringify(updatedItems));
  updateAutoCompleteOptions();
}

function updateAutoCompleteOptions() {
  let currentItems = getCurrentItems();
  let autocompleteList = document.getElementById('trello-list-filter-autocomplete');
  autocompleteList.innerHTML = '';
  currentItems.forEach((item) => {
    let option = document.createElement('option');
    option.innerText = item;
    autocompleteList.appendChild(option);
  });
}

const $filter = $(`
  <div id="evil-list-filter">' +
    '<input class="header-search-input" type="text" placeholder="Filter Lists" autocomplete=off
        list="trello-list-filter-autocomplete"/>
    <datalist id="trello-list-filter-autocomplete"></datalist>
  </div>`
);

let searchTimeout;
$filter.find('input').on('keyup', function() {
  let $input = $(this);
  let queryString = $input.val();
  let query = new RegExp(queryString, 'i');
  $('#board > .list-wrapper').each(function(el, i) {
    let $list = $(this);

    let listName = $list.find('.list-header').text().trim();
    if (query.test(listName)) {
      $list.show();
    } else {
      $list.hide();
    }
  });

  try {
    clearTimeout(searchTimeout);
  } catch(error) {}
  searchTimeout = setTimeout(() => saveQuery(queryString), 750);
});

const filterInput = $filter.find('input').get(0);
filterInput.addEventListener('focus', (event) => {
  filterInput.select();
});

const domObserver = new MutationObserver(function(mutations) {
  if (!$('#header').find($filter).length) {
    $filter.insertAfter('#header .header-search');
    updateAutoCompleteOptions();
  }
});

domObserver.observe(document.querySelector('#header'), { childList: true });