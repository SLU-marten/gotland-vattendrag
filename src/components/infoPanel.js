import {
  getWaterway,
  getDisplayName,
  getLakesForWaterway,
  getWetlandsForWaterway,
  getBarriersForWaterway,
} from '../services/dataService.js';

export function showInfoPanel(id) {
  const w = getWaterway(id);
  if (!w) return;

  const panel = document.getElementById('info-panel');
  const displayName = getDisplayName(w);

  // Format length
  const lengthKm = w.totalLength ? (w.totalLength / 1000).toFixed(1) : null;

  // Sub-labels
  const subParts = [];
  if (w.svarName) subParts.push(`SVAR: ${w.svarName}`);
  if (w.svarRiverName && w.svarRiverName !== w.svarName) subParts.push(w.svarRiverName);
  subParts.push(`Segment: ${w.id}`);

  // Species
  const filteredSpecies = (w.species || []).filter(s => s.toLowerCase() !== 'ingen fångst');
  const speciesStr = filteredSpecies.length > 0
    ? filteredSpecies.join(', ')
    : 'Inga arter registrerade';

  // Lakes
  const lakes = getLakesForWaterway(id);
  let lakesHtml = '';
  if (lakes.length > 0) {
    const totalArea = lakes.reduce((sum, f) => sum + (f.properties.lake_area_m2 || 0), 0);
    lakesHtml = `
      <details class="info-subsection">
        <summary><h3>Sjöar (${lakes.length} st, ${formatArea(totalArea)})</h3></summary>
        <table class="data-table">
          <thead><tr><th>ID</th><th>Area</th></tr></thead>
          <tbody>
            ${lakes.map(f => `
              <tr>
                <td>${f.properties.lake_id ?? ''}</td>
                <td>${formatArea(f.properties.lake_area_m2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </details>
    `;
  }

  // Wetlands
  const wetlands = getWetlandsForWaterway(id);
  let wetlandsHtml = '';
  if (wetlands.length > 0) {
    const totalArea = wetlands.reduce((sum, f) => sum + (f.properties.wet_area_m2 || 0), 0);
    wetlandsHtml = `
      <details class="info-subsection">
        <summary><h3>Våtmarker (${wetlands.length} st, ${formatArea(totalArea)})</h3></summary>
        <table class="data-table">
          <thead><tr><th>ID</th><th>Area</th></tr></thead>
          <tbody>
            ${wetlands.map(f => `
              <tr>
                <td>${f.properties.wet_id ?? ''}</td>
                <td>${formatArea(f.properties.wet_area_m2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </details>
    `;
  }

  // Barriers
  const barriers = getBarriersForWaterway(id);
  let barriersHtml = '';
  if (barriers.length > 0) {
    barriersHtml = `
      <details class="info-subsection">
        <summary><h3>Vandringshinder (${barriers.length} st)</h3></summary>
        ${barriers.map(f => {
          const p = f.properties;
          const speciesTags = [];
          if (p.trout) speciesTags.push('Öring');
          if (p.perch) speciesTags.push('Abborre');
          if (p.pike) speciesTags.push('Gädda');
          if (p.ide) speciesTags.push('Id');
          if (p.lamprey) speciesTags.push('Nejonöga');

          return `
            <div class="barrier-card">
              <strong>${p.DNAMN || p.VTNDRAG || 'Okänt hinder'}</strong>
              <div class="barrier-meta">
                ${p.VTNDRAG ? `Plats: ${p.VTNDRAG}<br>` : ''}
                ${p.STATUS ? `Status: ${p.STATUS}<br>` : ''}
                ${p.AGARE ? `Ägare: ${p.AGARE}<br>` : ''}
                ${p.Huvudarter ? `Huvudarter: ${p.Huvudarter}` : ''}
              </div>
              ${speciesTags.length ? `
                <div class="barrier-species">
                  ${speciesTags.map(s => `<span class="species-tag">${s}</span>`).join('')}
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </details>
    `;
  }

  panel.innerHTML = `
    <h2>${displayName}</h2>
    <p class="common-names">${subParts.join(' | ')}</p>

    <div class="info-grid">
      ${lengthKm ? `
        <div class="info-item">
          <label>Total längd</label>
          <span>${lengthKm} km</span>
        </div>
      ` : ''}
      ${w.segments ? `
        <div class="info-item">
          <label>Antal segment</label>
          <span>${w.segments}</span>
        </div>
      ` : ''}
      <div class="info-item full-width">
        <label>Arter i elfiskeregistret</label>
        <p>${speciesStr}</p>
      </div>
    </div>

    ${lakesHtml}
    ${wetlandsHtml}
    ${barriersHtml}
  `;
}

function formatArea(m2) {
  if (!m2 && m2 !== 0) return 'Okänd';
  if (m2 >= 10000) {
    return `${(m2 / 10000).toFixed(1)} ha`;
  }
  return `${Math.round(m2).toLocaleString('sv-SE')} m²`;
}
