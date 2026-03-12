let waterwayIndex = [];
let waterwayById = new Map();
let riversGeoJSON = null;
let lakesGeoJSON = null;
let wetlandsGeoJSON = null;
let barriersGeoJSON = null;

export async function loadAllData() {
  const [waterways, rivers, lakes, wetlands, barriers] = await Promise.all([
    fetch('./data/waterways.json').then(r => r.json()),
    fetch('./data/rivers.geojson').then(r => r.json()),
    fetch('./data/lakes.geojson').then(r => r.json()),
    fetch('./data/wetlands.geojson').then(r => r.json()),
    fetch('./data/barriers.geojson').then(r => r.json()),
  ]);

  waterwayIndex = waterways;
  waterwayById.clear();
  waterways.forEach(w => waterwayById.set(w.id, w));

  riversGeoJSON = rivers;
  lakesGeoJSON = lakes;
  wetlandsGeoJSON = wetlands;
  barriersGeoJSON = barriers;

  return waterwayIndex;
}

export function getAllWaterways() {
  return waterwayIndex;
}

export function getWaterway(id) {
  return waterwayById.get(id) || null;
}

export function getDisplayName(waterway) {
  return waterway.name || waterway.id;
}

export function getRiversGeoJSON() {
  return riversGeoJSON;
}

export function getLakesGeoJSON() {
  return lakesGeoJSON;
}

export function getWetlandsGeoJSON() {
  return wetlandsGeoJSON;
}

export function getBarriersGeoJSON() {
  return barriersGeoJSON;
}

export function getLakesForWaterway(id) {
  if (!lakesGeoJSON) return [];
  return lakesGeoJSON.features.filter(f => f.properties.seadsgm === id);
}

export function getWetlandsForWaterway(id) {
  if (!wetlandsGeoJSON) return [];
  return wetlandsGeoJSON.features.filter(f => f.properties.seadsgm === id);
}

export function getBarriersForWaterway(id) {
  if (!barriersGeoJSON) return [];
  return barriersGeoJSON.features.filter(f => f.properties.seadsgm === id);
}

export function getRiverFeatureForWaterway(id) {
  if (!riversGeoJSON) return null;
  return riversGeoJSON.features.find(f => f.properties.seadsgm === id) || null;
}
