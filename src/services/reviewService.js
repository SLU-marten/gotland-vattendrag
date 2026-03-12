const STORAGE_KEY = 'gotland_waterway_reviews';
const REVIEWER_KEY = 'gotland_reviewerName';

// Replace with your deployed Google Apps Script web app URL
const SHEETS_URL = 'https://script.google.com/macros/s/AKfycbwfAnxO3gUU85RsKHl29bsgA2g1JC3lGt_pRwZ-z6GcOzexfM7AYsl4h4BzFx2yb87jtw/exec';

function getReviews() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getReview(waterwayId) {
  return getReviews()[waterwayId] || null;
}

export function getAllReviews() {
  return getReviews();
}

export function getReviewerName() {
  return localStorage.getItem(REVIEWER_KEY) || '';
}

export function setReviewerName(name) {
  localStorage.setItem(REVIEWER_KEY, name);
}

export function saveReview(waterwayId, waterwayName, review) {
  const reviews = getReviews();
  reviews[waterwayId] = {
    ...review,
    waterwayId,
    waterwayName,
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));

  if (SHEETS_URL) {
    submitToSheets(waterwayId, waterwayName, reviews[waterwayId]);
  }

  return reviews[waterwayId];
}

async function submitToSheets(waterwayId, waterwayName, review) {
  try {
    await fetch(SHEETS_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        waterway_id: waterwayId,
        waterway_name: waterwayName,
        reviewer: review.reviewer,
        species: review.species,
        comment: review.comment,
        timestamp: review.timestamp,
      }),
    });
  } catch (err) {
    console.warn('Failed to submit to Google Sheets:', err);
  }
}
