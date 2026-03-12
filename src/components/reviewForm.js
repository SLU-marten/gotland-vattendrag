import {
  getReview,
  getReviewerName,
  setReviewerName,
  saveReview,
} from '../services/reviewService.js';
import { getWaterway, getDisplayName } from '../services/dataService.js';

let currentId = null;

const REVIEW_INSTRUCTIONS = `Granska vattendraget och bedöm om informationen om fiskarter, vandringshinder, sjöar och våtmarker är korrekt. Lämna en kommentar med dina synpunkter.`;

export function initReviewForm() {
  const section = document.getElementById('review-section');

  section.innerHTML = `
    <h3>Granskning</h3>
    <p class="review-instructions">${REVIEW_INSTRUCTIONS}</p>

    <div class="form-group">
      <label for="reviewer-name">Granskare</label>
      <input type="text" id="reviewer-name" placeholder="Ditt namn"
             value="${getReviewerName()}">
    </div>

    <div class="form-group">
      <label for="review-species">Arter i vattendraget</label>
      <textarea id="review-species" rows="3"
                placeholder="Vilka arter finns i vattendraget?"></textarea>
    </div>

    <div class="form-group">
      <label for="review-comment">Övriga kommentarer</label>
      <textarea id="review-comment" rows="4"
                placeholder="Övriga synpunkter..."></textarea>
    </div>

    <button id="submit-review" class="btn-submit">Skicka granskning</button>
    <div id="review-status"></div>
  `;

  document.getElementById('reviewer-name').addEventListener('input', (e) => {
    setReviewerName(e.target.value);
  });

  document.getElementById('submit-review').addEventListener('click', handleSubmit);
}

export function loadReviewForWaterway(id) {
  currentId = id;
  const review = getReview(id);

  document.getElementById('review-species').value = '';
  document.getElementById('review-comment').value = '';

  const status = document.getElementById('review-status');
  status.textContent = '';
  status.className = '';

  if (review) {
    document.getElementById('review-species').value = review.species || '';
    document.getElementById('review-comment').value = review.comment || '';
    status.textContent = `Granskad ${new Date(review.timestamp).toLocaleDateString('sv-SE')}`;
    status.className = 'review-status-existing';
  }
}

function handleSubmit() {
  const reviewer = document.getElementById('reviewer-name').value.trim();
  const species = document.getElementById('review-species').value.trim();
  const comment = document.getElementById('review-comment').value.trim();

  if (!reviewer) {
    showStatus('Ange ditt namn.', 'error');
    document.getElementById('reviewer-name').focus();
    return;
  }

  const waterway = getWaterway(currentId);
  const displayName = waterway ? getDisplayName(waterway) : currentId;

  saveReview(currentId, displayName, {
    reviewer,
    species,
    comment,
  });

  showStatus('Granskning sparad.', 'success');

  window.dispatchEvent(new CustomEvent('reviewUpdated', {
    detail: { waterwayId: currentId },
  }));
}

function showStatus(message, type) {
  const status = document.getElementById('review-status');
  status.textContent = message;
  status.className = `review-status-${type}`;
}
