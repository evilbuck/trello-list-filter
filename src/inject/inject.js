const storageKey = 'trello-list-filter:queryString';

function track(action) {
  return new Promise(function (resolve, reject) {
    chrome.runtime.sendMessage({ action: `track:${action}` }, function (response) {
      resolve(response);
    });
  });
}

function getCurrentItems() {
  return new Promise((resolve) => {
    chrome.storage.local.get([storageKey], (result) => {
      let currentItems;
      try {
        currentItems = result[storageKey];
        if (!(currentItems instanceof Array)) {
          throw new Error('items not an Array');
        }
      } catch (error) {
        currentItems = [];
      }
      resolve(currentItems);
    });
  });
}

async function saveQuery(expr) {
  // don't save a lack of value
  if (expr === '' || expr === null || expr === undefined) {
    return;
  }
  let currentItems = await getCurrentItems();
  currentItems.unshift(expr);

  let updatedItems = currentItems
    .reduce((uniqueItems, item) => {
      if (!uniqueItems.includes(item)) {
        uniqueItems.push(item);
      }

      return uniqueItems;
    }, [])
    .slice(0, 7);

  chrome.storage.local.set({ [storageKey]: updatedItems });
  updateAutoCompleteOptions();
}

async function updateAutoCompleteOptions() {
  let currentItems = await getCurrentItems();
  let autocompleteList = document.getElementById('trello-list-filter-autocomplete');
  autocompleteList.innerHTML = '';
  currentItems.forEach((item) => {
    let option = document.createElement('option');
    option.innerText = item;
    autocompleteList.appendChild(option);
  });
}

const $filter = $(`
  <div id="evil-list-filter">'
    '<input class="header-search-input" type="text" placeholder="Filter Lists" autocomplete=off
        list="trello-list-filter-autocomplete"/>
    <datalist id="trello-list-filter-autocomplete"></datalist>
  </div>`);

let searchTimeout;
$filter.find('input').on('keyup', function () {
  let $input = $(this);
  let queryString = $input.val();
  let query = new RegExp(queryString, 'i');
  $('#board > li[data-testid="list-wrapper"]').each(function (el, i) {
    let $list = $(this);

    let listName = $list.find('[data-testid="list-name"]').text().trim();
    if (query.test(listName)) {
      $list.show();
    } else {
      $list.hide();
    }
  });

  try {
    clearTimeout(searchTimeout);
  } catch (error) {}

  searchTimeout = setTimeout(() => saveQuery(queryString), 750);
  track('filter');
});

const filterInput = $filter.find('input').get(0);
filterInput.addEventListener('focus', (event) => {
  filterInput.select();
});

filterInput.addEventListener('keydown', (event) => {
  if (!event.key) {
    track('autocomplete');
  }
});

function isMacOS() {
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
}

function isFilterShortcut(event) {
  const isMac = isMacOS();
  const isCorrectKey = event.key.toLowerCase() === 'k';
  const hasCorrectModifier = isMac ? event.metaKey : event.ctrlKey;
  const noOtherModifiers =
    !event.altKey && !event.shiftKey && !(isMac && event.ctrlKey) && !(!isMac && event.metaKey);

  return isCorrectKey && hasCorrectModifier && noOtherModifiers;
}

function handleGlobalKeydown(event) {
  if (isFilterShortcut(event)) {
    event.preventDefault();
    event.stopPropagation();

    const filterInput = document.querySelector('#evil-list-filter input');
    if (filterInput) {
      filterInput.focus();
    }
  }
}

// The required DOM nodes are not initially loaded, so we must
// look for them and retry if not there yet.
setTimeout(function main() {
  let hasRun = false;
  let version = null;
  if (document.querySelector('#header .header-search')) {
    hasRun = true;
    version = 1;
  }
  if (document.querySelector('.board-header')) {
    hasRun = true;
    version = 2;
  }

  if (!hasRun) {
    setTimeout(main, 200);
    return;
  }

  const container_selector = '.board-header > div';
  if (version === 1 && !$(container_selector).find($filter).length) {
    $(container_selector).append($filter);
    // $filter.insertAfter('#header .header-search');
    updateAutoCompleteOptions();
    document.addEventListener('keydown', handleGlobalKeydown);
  }

  let $container = $('.board-header [aria-label="Board name"]').parent();
  if (version === 2 && !$container.find($filter).length) {
    $container.append($filter);
    updateAutoCompleteOptions();
    document.addEventListener('keydown', handleGlobalKeydown);
  }
}, 200);
