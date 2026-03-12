import { getAllWaterways, getDisplayName } from '../services/dataService.js';
import { getAllReviews } from '../services/reviewService.js';

let onSelectCallback = null;
let activeId = null;

export function initSidebar(onSelect) {
  onSelectCallback = onSelect;
  renderWaterwayList();
  setupSearch();

  window.addEventListener('reviewUpdated', (e) => {
    updateReviewDot(e.detail.waterwayId);
  });
}

export function setActiveWaterway(id) {
  activeId = id;
  document.querySelectorAll('.waterway-item').forEach(el => {
    el.classList.toggle('active', el.dataset.id === id);
  });

  const activeEl = document.querySelector('.waterway-item.active');
  if (activeEl) {
    activeEl.scrollIntoView({ block: 'nearest' });
  }
}

function renderWaterwayList() {
  const list = document.getElementById('waterway-list');
  const waterways = getAllWaterways();
  const reviews = getAllReviews();

  list.innerHTML = '';
  waterways.forEach(w => {
    const li = document.createElement('li');
    li.className = 'waterway-item';
    li.dataset.id = w.id;
    li.dataset.search = (getDisplayName(w)).toLowerCase();

    // Review status dot
    const dot = document.createElement('span');
    const isReviewed = !!reviews[w.id];
    dot.className = `review-dot ${isReviewed ? 'reviewed' : 'not-reviewed'}`;
    dot.title = isReviewed ? 'Granskad' : 'Ej granskad';

    // Name
    const nameSpan = document.createElement('span');
    nameSpan.className = `waterway-name${w.name ? '' : ' unnamed'}`;
    nameSpan.textContent = getDisplayName(w);

    li.append(dot, nameSpan);
    li.addEventListener('click', () => {
      onSelectCallback(w.id);
    });
    list.appendChild(li);
  });
}

function setupSearch() {
  const input = document.getElementById('search-input');
  input.addEventListener('input', () => {
    const query = input.value.toLowerCase().trim();
    document.querySelectorAll('.waterway-item').forEach(li => {
      const match = !query || li.dataset.search.includes(query);
      li.style.display = match ? '' : 'none';
    });
  });
}

function updateReviewDot(waterwayId) {
  const li = document.querySelector(`.waterway-item[data-id="${waterwayId}"]`);
  if (!li) return;

  const dot = li.querySelector('.review-dot');
  if (dot) {
    dot.className = 'review-dot reviewed';
    dot.title = 'Granskad';
  }
}
