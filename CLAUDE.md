# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Web application for expert review of waterway (vattendrag) data on Gotland. Reviewers select a waterway from an interactive map, view associated information (fish species, migration barriers, lakes, wetlands), and submit review comments to a Google Spreadsheet.

The UI language is Swedish.

## Architecture

Vite + vanilla JS module application with Leaflet.js for interactive mapping. Layout modeled after the Protect Baltic review tool (`C:\Github Projects\Protect Baltic\final_reports_claude`): dark sidebar (300px) with searchable waterway list, main content split between a Leaflet map (left) and info panel + review form (right).

### Data Pipeline

Source geodata lives in `output/` as Shapefiles and GeoPackages. These must be converted to GeoJSON (into `data/`) for web display. All layers share `seadsgm` segment codes from the Swedish SVAR water database, which is the primary key for linking features across layers.

### Geodata Sources (output/)

| File | Format | Features | Key fields |
|------|--------|----------|------------|
| `rivers_named_from_SVAR.gpkg` | Lines (225) | Named waterways | `vattendrag`, `svar_vname_final`, `arter` (fish species CSV), `ttl_r_2` (length), `seadsgm` |
| `Vandringshinder_points.shp` | Points (58) | Migration barriers | `VTNDRAG` (waterway name), `DNAMN`, `STATUS`, `AGARE`, fish columns (trout/perch/pike/ide/lamprey), `Kommentar` |
| `lakes_rivers_accessible_definitivt_joined.gpkg` | Polygons (91) | Lakes | `localisedc`, `lake_area_m2`, `seadsgm` |
| `wetlands_rivers_accessible_definitivt_joined.gpkg` | Polygons (229) | Wetlands | `localisedc`, `wet_area_m2`, `seadsgm` |

### Layer Linking

- Rivers → Lakes/Wetlands: matched via `seadsgm` segment codes
- Rivers → Vandringshinder: matched via waterway name (`vattendrag` ↔ `VTNDRAG`)

## Planned File Structure

```
src/
  main.js                    # App entry point
  style.css                  # Global styles (CSS variables, same design system as Protect Baltic)
  components/
    sidebar.js               # Waterway list with search
    mapViewer.js             # Leaflet map with layer controls
    infoPanel.js             # Selected waterway details
    reviewForm.js            # Review form → Google Sheets
  services/
    dataService.js           # Load GeoJSON, link layers by seadsgm
    reviewService.js         # POST reviews to Google Apps Script webhook
data/                        # Converted GeoJSON files (generated from output/)
output/                      # Source geodata (shp, gpkg) — do not modify
```

## Coordinate System

All source files use SWEREF 99 (Swedish reference frame). Convert to WGS84 (EPSG:4326) when generating GeoJSON for Leaflet.
