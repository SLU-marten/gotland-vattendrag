import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  getRiversGeoJSON,
  getLakesGeoJSON,
  getWetlandsGeoJSON,
  getBarriersGeoJSON,
  getWaterway,
  getDisplayName,
} from '../services/dataService.js';

let map = null;
let riversLayer = null;
let lakesLayer = null;
let wetlandsLayer = null;
let barriersLayer = null;
let onSelectCallback = null;
let highlightedId = null;

const STYLES = {
  riverNamed: { color: '#3d7bbf', weight: 2.5, opacity: 0.7 },
  riverUnnamed: { color: '#3d7bbf', weight: 2.5, opacity: 0.7 },
  riverHighlight: { color: '#1a5276', weight: 5, opacity: 1 },
  lake: { fillColor: '#3d7bbf', fillOpacity: 0.2, color: '#2e6aa8', weight: 1 },
  lakeHighlight: { fillColor: '#3d7bbf', fillOpacity: 0.5, color: '#2e6aa8', weight: 2 },
  wetland: { fillColor: '#27ae60', fillOpacity: 0.2, color: '#1e8449', weight: 1 },
  wetlandHighlight: { fillColor: '#27ae60', fillOpacity: 0.5, color: '#1e8449', weight: 2 },
  barrier: { fillColor: '#c0392b', color: '#922b21', radius: 5, fillOpacity: 0.8, weight: 1 },
  barrierHighlight: { fillColor: '#c0392b', color: '#922b21', radius: 8, fillOpacity: 1, weight: 2 },
};

export function initMapViewer(onSelect) {
  onSelectCallback = onSelect;

  map = L.map('map-container', {
    center: [57.6, 18.4],
    zoom: 9,
    zoomControl: true,
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    maxZoom: 18,
  }).addTo(map);

  // Add layers in order: wetlands, lakes, rivers, barriers (on top)
  addWetlandsLayer();
  addLakesLayer();
  addRiversLayer();
  addBarriersLayer();
  addLayerControl();
}

function addRiversLayer() {
  const data = getRiversGeoJSON();
  if (!data) return;

  // Invisible wider layer for easier clicking
  L.geoJSON(data, {
    style: () => ({ weight: 20, opacity: 0, fill: false }),
    onEachFeature: (feature, layer) => {
      const props = feature.properties;
      const displayName = props.vattendrag || props.seadsgm;
      layer.bindTooltip(displayName, { sticky: true });
      layer.on('click', () => {
        if (onSelectCallback && props.seadsgm) {
          onSelectCallback(props.seadsgm);
        }
      });
    },
  }).addTo(map);

  // Visible styled layer
  riversLayer = L.geoJSON(data, {
    style: (feature) => {
      const name = feature.properties.vattendrag;
      return name ? { ...STYLES.riverNamed } : { ...STYLES.riverUnnamed };
    },
    interactive: false,
  }).addTo(map);
}

function addLakesLayer() {
  const data = getLakesGeoJSON();
  if (!data) return;

  lakesLayer = L.geoJSON(data, {
    style: () => ({ ...STYLES.lake }),
    onEachFeature: (feature, layer) => {
      const props = feature.properties;
      const area = props.lake_area_m2;
      const areaStr = area ? `${Number(area).toLocaleString('sv-SE')} m²` : 'Okänd';
      layer.bindPopup(`
        <strong>Sjö</strong><br>
        <span class="popup-meta">
          Typ: ${props.localisedc || 'Okänd'}<br>
          Area: ${areaStr}<br>
          Segment: ${props.seadsgm || ''}
        </span>
      `);
    },
  }).addTo(map);
}

function addWetlandsLayer() {
  const data = getWetlandsGeoJSON();
  if (!data) return;

  wetlandsLayer = L.geoJSON(data, {
    style: () => ({ ...STYLES.wetland }),
    onEachFeature: (feature, layer) => {
      const props = feature.properties;
      const area = props.wet_area_m2;
      const areaStr = area ? `${Number(area).toLocaleString('sv-SE')} m²` : 'Okänd';
      layer.bindPopup(`
        <strong>Våtmark</strong><br>
        <span class="popup-meta">
          Typ: ${props.localisedc || 'Okänd'}<br>
          Area: ${areaStr}<br>
          Segment: ${props.seadsgm || ''}
        </span>
      `);
    },
  }).addTo(map);
}

function addBarriersLayer() {
  const data = getBarriersGeoJSON();
  if (!data) return;

  barriersLayer = L.geoJSON(data, {
    pointToLayer: (feature, latlng) => {
      return L.circleMarker(latlng, { ...STYLES.barrier });
    },
    onEachFeature: (feature, layer) => {
      const props = feature.properties;
      const speciesList = [];
      if (props.trout) speciesList.push('Öring');
      if (props.perch) speciesList.push('Abborre');
      if (props.pike) speciesList.push('Gädda');
      if (props.ide) speciesList.push('Id');
      if (props.lamprey) speciesList.push('Nejonöga');

      layer.bindPopup(`
        <strong>${props.DNAMN || props.VTNDRAG || 'Vandringshinder'}</strong><br>
        <span class="popup-meta">
          ${props.VTNDRAG ? `Plats: ${props.VTNDRAG}<br>` : ''}
          ${props.STATUS ? `Status: ${props.STATUS}<br>` : ''}
          ${props.AGARE ? `Ägare: ${props.AGARE}<br>` : ''}
          ${props.Huvudarter ? `Huvudarter: ${props.Huvudarter}<br>` : ''}
          ${speciesList.length ? `Arter: ${speciesList.join(', ')}` : ''}
        </span>
      `);
    },
  }).addTo(map);
}

function addLayerControl() {
  const container = document.getElementById('map-viewer');
  const control = document.createElement('div');
  control.className = 'layer-control';
  control.innerHTML = `
    <h4>Lager</h4>
    <label class="layer-control-item">
      <input type="checkbox" data-layer="rivers" checked>
      <span class="layer-swatch" style="background: #3d7bbf"></span>
      Vattendrag
    </label>
    <label class="layer-control-item">
      <input type="checkbox" data-layer="lakes" checked>
      <span class="layer-swatch" style="background: rgba(61,123,191,0.5)"></span>
      Sjöar
    </label>
    <label class="layer-control-item">
      <input type="checkbox" data-layer="wetlands" checked>
      <span class="layer-swatch" style="background: rgba(39,174,96,0.5)"></span>
      Våtmarker
    </label>
    <label class="layer-control-item">
      <input type="checkbox" data-layer="barriers" checked>
      <span class="layer-swatch" style="background: #c0392b; border-radius: 50%"></span>
      Vandringshinder
    </label>
  `;
  container.appendChild(control);

  const layerMap = {
    rivers: riversLayer,
    lakes: lakesLayer,
    wetlands: wetlandsLayer,
    barriers: barriersLayer,
  };

  control.addEventListener('change', (e) => {
    const cb = e.target;
    if (!cb.dataset.layer) return;
    const layer = layerMap[cb.dataset.layer];
    if (!layer) return;
    if (cb.checked) {
      map.addLayer(layer);
    } else {
      map.removeLayer(layer);
    }
  });
}

export function highlightWaterway(id) {
  highlightedId = id;

  // Reset all river styles
  if (riversLayer) {
    riversLayer.eachLayer(layer => {
      const name = layer.feature.properties.vattendrag;
      layer.setStyle(name ? { ...STYLES.riverNamed } : { ...STYLES.riverUnnamed });
    });
  }

  // Reset lake styles
  if (lakesLayer) {
    lakesLayer.eachLayer(layer => {
      layer.setStyle({ ...STYLES.lake });
    });
  }

  // Reset wetland styles
  if (wetlandsLayer) {
    wetlandsLayer.eachLayer(layer => {
      layer.setStyle({ ...STYLES.wetland });
    });
  }

  // Reset barrier styles
  if (barriersLayer) {
    barriersLayer.eachLayer(layer => {
      layer.setStyle({ ...STYLES.barrier });
      layer.setRadius(STYLES.barrier.radius);
    });
  }

  // Highlight matching features
  const bounds = L.latLngBounds();
  let hasFeatures = false;

  if (riversLayer) {
    riversLayer.eachLayer(layer => {
      if (layer.feature.properties.seadsgm === id) {
        layer.setStyle(STYLES.riverHighlight);
        layer.bringToFront();
        bounds.extend(layer.getBounds());
        hasFeatures = true;
      }
    });
  }

  if (lakesLayer) {
    lakesLayer.eachLayer(layer => {
      if (layer.feature.properties.seadsgm === id) {
        layer.setStyle(STYLES.lakeHighlight);
        bounds.extend(layer.getBounds());
        hasFeatures = true;
      }
    });
  }

  if (wetlandsLayer) {
    wetlandsLayer.eachLayer(layer => {
      if (layer.feature.properties.seadsgm === id) {
        layer.setStyle(STYLES.wetlandHighlight);
        bounds.extend(layer.getBounds());
        hasFeatures = true;
      }
    });
  }

  if (barriersLayer) {
    barriersLayer.eachLayer(layer => {
      if (layer.feature.properties.seadsgm === id) {
        layer.setStyle(STYLES.barrierHighlight);
        layer.setRadius(STYLES.barrierHighlight.radius);
        bounds.extend(layer.getLatLng());
        hasFeatures = true;
      }
    });
  }

  // Bring barriers to front
  if (barriersLayer && map.hasLayer(barriersLayer)) {
    barriersLayer.bringToFront();
  }

  if (hasFeatures && bounds.isValid()) {
    const rightPanel = document.getElementById('right-panel');
    const panelWidth = rightPanel && !rightPanel.classList.contains('hidden')
      ? rightPanel.offsetWidth : 0;
    map.fitBounds(bounds, {
      paddingTopLeft: [50, 50],
      paddingBottomRight: [panelWidth + 50, 50],
      maxZoom: 12,
    });
  }
}
