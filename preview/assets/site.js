/* Local enhancement only. All routes and source details work without JavaScript. */
'use strict';
document.documentElement.classList.add('js');
const revealPlaceRows = new WeakMap();
for (const scope of document.querySelectorAll('[data-place-list]')) {
  const rows = [...scope.querySelectorAll('.place'), ...(scope.dataset?.attractionList ? scope.querySelectorAll('.park-reference') : [])];
  const buttons = [...scope.querySelectorAll('[data-filter]')];
  const sort = scope.querySelector('[data-sort]');
  const more = scope.querySelector('[data-more]');
  const count = scope.querySelector('[data-result-count]');
  const categorySelect = scope.querySelector('[data-category-select]');
  const picker = scope.querySelector('[data-place-picker]');
  const initialLimit = Number(scope.dataset?.initialLimit || ((document.body?.dataset?.page || '').startsWith('eat-road-') ? 8 : 12));
  const batchSize = Number(scope.dataset?.batchSize || 8);
  let category = 'all', visibleLimit = initialLimit;
  const update = () => {
    const chosen = picker?.value && rows.find(row => row.id === picker.value);
    if (chosen) {
      rows.forEach(row => { row.hidden = row !== chosen; });
      chosen.open = true;
      if (more) more.hidden = true;
      if (count) count.textContent = '1 saved place · full notes';
      return;
    }
    const matches = rows.filter(row => category === 'all' || row.dataset.areaCategory === category || (row.dataset.category || '').split(' ').includes(category));
    rows.forEach(row => { row.hidden = !matches.includes(row) || matches.indexOf(row) >= visibleLimit; });
    buttons.forEach(button => { button.setAttribute('aria-current', String(button.dataset.filter === category)); });
    if (more) {
      more.hidden = matches.length <= visibleLimit;
      more.textContent = `Show all ${matches.length} places`;
    }
    if (count) count.textContent = `${matches.length} ${matches.length === 1 ? 'place' : 'places'}`;
    for (const head of scope.querySelectorAll('[data-group-head]')) {
      const group = rows.filter(row => row.dataset.areaCategory === head.dataset.groupHead || (row.dataset.category || '').split(' ').includes(head.dataset.groupHead));
      head.hidden = group.length > 0 && group.every(row => row.hidden);
    }
  };
  buttons.forEach(button => button.addEventListener('click', event => { event?.preventDefault?.(); category = button.dataset.filter; visibleLimit = initialLimit; if (picker) picker.value = ''; update(); }));
  if (categorySelect) categorySelect.addEventListener('change', () => {
    category = categorySelect.value; visibleLimit = initialLimit;
    if (picker) picker.value = '';
    update();
  });
  if (picker) picker.addEventListener('change', () => {
    if (!picker.value) { category = 'all'; visibleLimit = initialLimit; update(); return; }
    const chosen = rows.find(row => row.id === picker.value);
    if (!chosen) return;
    rows.forEach(row => { row.hidden = row !== chosen; });
    chosen.open = true;
    if (more) more.hidden = true;
    if (count) count.textContent = '1 saved place · full notes';
  });
  if (more) more.addEventListener('click', () => {
    const previouslyVisible = new Set(rows.filter(row => !row.hidden));
    const unseen = rows.filter(row => row.hidden);
    visibleLimit = rows.length; update();
    // Newly revealed records keep their collapsed state.
    const first = rows.find(row => !row.hidden && !previouslyVisible.has(row));
    if (first) (first.querySelector('summary, a[href]') || first).focus();
  });
  if (sort) sort.addEventListener('change', () => {
    const key = sort.value;
    rows.sort((a,b) => key === 'source' ? Number(a.dataset.order) - Number(b.dataset.order) : Number(b.dataset[key] || -1) - Number(a.dataset[key] || -1));
    const container = scope.querySelector('[data-rows]'); rows.forEach(row => container.append(row)); update();
  });
  rows.forEach(row => revealPlaceRows.set(row, () => { category = 'all'; visibleLimit = Math.max(initialLimit, rows.indexOf(row) + 1); if (picker) picker.value = ''; update(); }));
  update();
}
function revealFragment() {
  let id;
  try { id = decodeURIComponent(location.hash.slice(1)); } catch (_) { return; }
  if (!id) return;
  const target = document.getElementById(id);
  if (!target) return;
  let node = target;
  while (node) {
    const reveal = revealPlaceRows.get(node);
    if (reveal) reveal();
    if (node.tagName === 'DETAILS') node.open = true;
    node = node.parentElement;
  }
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  target.scrollIntoView({block: 'start'});
  target.focus({preventScroll: true});
}
revealFragment();
window.addEventListener('hashchange', revealFragment);
// Native ticks are usable without storage. Storage failures leave them functional.
for (const box of document.querySelectorAll('[data-tick]')) {
  const key = `japan-2026:${box.dataset.tick}`;
  try { box.checked = localStorage.getItem(key) === null ? box.defaultChecked : localStorage.getItem(key) === '1'; } catch (_) { /* device storage unavailable */ }
  box.addEventListener('change', () => { try { localStorage.setItem(key, box.checked ? '1' : '0'); } catch (_) { /* native tick remains usable */ } });
}
for (const button of document.querySelectorAll('[data-print]')) button.addEventListener('click', () => window.print());
let printState = [], printHiddenState = [], printing = false;
window.addEventListener('beforeprint', () => {
  if (printing) return;
  printing = true;
  printState = [...document.querySelectorAll('details')].map(detail => [detail, detail.open, detail.getAttribute?.('name')]);
  printState.forEach(([detail]) => { detail.removeAttribute?.('name'); });
  printHiddenState = [...document.querySelectorAll('[hidden]')];
  printHiddenState.forEach(node => { node.hidden = false; });
  printState.forEach(([detail]) => { detail.open = true; });
});
window.addEventListener('afterprint', () => {
  printState.forEach(([detail, open]) => { detail.open = open; });
  printState.forEach(([detail, , name]) => { if (name) detail.setAttribute('name', name); });
  printHiddenState.forEach(node => { node.hidden = true; });
  printState = []; printHiddenState = []; printing = false;
});

// Highlight today's or the next trip day using the reader's device date.
const tripDays = [...document.querySelectorAll('.day[data-date]')];
if (tripDays.length) {
 const now = new Date();
 const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
 const next = tripDays.find(day => day.dataset.date >= today);
 if (next) next.classList.add('next');
}
