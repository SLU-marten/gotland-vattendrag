import './style.css';
import { loadAllData, getWaterway, getDisplayName } from './services/dataService.js';
import { initSidebar, setActiveWaterway } from './components/sidebar.js';
import { initMapViewer, highlightWaterway } from './components/mapViewer.js';
import { showInfoPanel } from './components/infoPanel.js';
import { initReviewForm, loadReviewForWaterway } from './components/reviewForm.js';

async function init() {
  await loadAllData();

  initMapViewer(selectWaterway);
  initReviewForm();
  initSidebar(selectWaterway);
}

function selectWaterway(id) {
  const w = getWaterway(id);
  if (!w) return;

  document.getElementById('right-panel').classList.remove('hidden');

  highlightWaterway(id);
  showInfoPanel(id);
  loadReviewForWaterway(id);
  setActiveWaterway(id);
}

init();
