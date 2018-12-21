const lists = (function() {
  const ACTIVE_CLASS = 'trello-list-filter-btn-active';
  const INACTIVE_CLASS = 'trello-list-filter-btn-inactive';

  function getAvailableLists() {
    const listHeaders = document.querySelectorAll('.list-header-name-assist');
    const listNames = Array.from(listHeaders).map((el) => {
      return el.textContent;
    });

    return listNames;
  }

  function createButton(label) {
    const el = document.createElement('a');
    el.className = 'board-header-btn board-header-btn-without-icon trello-list-filter-btn trello-list-filter-btn-inactive';
    el.text = label;
    el.dataset.id = label;
    el.dataset.active = 0;

    return el;
  }

  function removeClassName(el, classToRemove) {
    let classNames = el.className.split(' ');
    let newClassNames = classNames.filter((className) => className !== classToRemove);
    el.className = newClassNames.join(' ');

    return el;
  }

  function addClassName(el, classToAdd) {
    let classNames = el.className;
    el.className = `${classNames} ${classToAdd}`;

    return el;
  }

  function toggleList(event) {
    const button = event.target

    // reset all inactive buttons
    document.querySelectorAll('.trello-list-filter-btn').forEach((btn) => {
      if (button !== btn) {
        btn.dataset.active = '0';
        removeClassName(btn, ACTIVE_CLASS);
        addClassName(btn, INACTIVE_CLASS);
      } else {
        btn.dataset.active = '1';
        removeClassName(btn, INACTIVE_CLASS);
        addClassName(btn, ACTIVE_CLASS);
      }
    });

    const filter = $filter.get(0);
    filter.querySelector('input').value = button.textContent;
    // TODO: remove jquery reliance here
    $filter.find('input').trigger('keyup');

    return button;
  }

  function main() {
    const domHeader = document.querySelector('.board-header');
    const listFilterContainer = document.createElement('div');
    listFilterContainer.className = 'trello-list-filter-btn-container';
    listFilterContainer.addEventListener('click', toggleList);

    const listNames = getAvailableLists();
    listNames.forEach((name) => {
      listFilterContainer.appendChild(createButton(name));
    });

    domHeader.appendChild(listFilterContainer);
  }

  return main;
})();