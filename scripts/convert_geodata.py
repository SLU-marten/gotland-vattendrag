"""Convert geodata from output/ (shp/gpkg) to web-ready GeoJSON in public/data/."""

import json
from pathlib import Path
import geopandas as gpd
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
INPUT = ROOT / "output"
OUTPUT = ROOT / "public" / "data"
OUTPUT.mkdir(parents=True, exist_ok=True)

TARGET_CRS = "EPSG:4326"


def clean_value(v):
    """Convert numpy/pandas types to JSON-serializable Python types."""
    if v is None or (isinstance(v, float) and np.isnan(v)):
        return None
    if isinstance(v, (np.integer,)):
        return int(v)
    if isinstance(v, (np.floating,)):
        return float(v)
    if isinstance(v, (np.bool_,)):
        return bool(v)
    return v


# --- 1. Rivers ---
print("Reading rivers...")
rivers = gpd.read_file(INPUT / "rivers_named_from_SVAR.gpkg")
rivers = rivers.to_crs(TARGET_CRS)

keep_cols_rivers = ["seadsgm", "vattendrag", "svar_vname_final", "svar_rname_final",
                     "ttl_r_2", "ttl_ln_", "n_sgmnt", "arter", "riv_row", "geometry"]
rivers = rivers[[c for c in keep_cols_rivers if c in rivers.columns]]
rivers.to_file(OUTPUT / "rivers.geojson", driver="GeoJSON")
print(f"  -> {len(rivers)} river features written")


# --- 2. Lakes ---
print("Reading lakes...")
lakes = gpd.read_file(INPUT / "lakes_rivers_accessible_definitivt_joined.gpkg")
lakes = lakes.to_crs(TARGET_CRS)

keep_cols_lakes = ["seadsgm", "lake_id", "lake_area_m2", "localisedc", "origin",
                    "surfaceare", "geometry"]
lakes = lakes[[c for c in keep_cols_lakes if c in lakes.columns]]
lakes.to_file(OUTPUT / "lakes.geojson", driver="GeoJSON")
print(f"  -> {len(lakes)} lake features written")


# --- 3. Wetlands ---
print("Reading wetlands...")
wetlands = gpd.read_file(INPUT / "wetlands_rivers_accessible_definitivt_joined.gpkg")
wetlands = wetlands.to_crs(TARGET_CRS)

keep_cols_wetlands = ["seadsgm", "wet_id", "wet_area_m2", "localisedc", "aream2", "geometry"]
wetlands = wetlands[[c for c in keep_cols_wetlands if c in wetlands.columns]]
wetlands.to_file(OUTPUT / "wetlands.geojson", driver="GeoJSON")
print(f"  -> {len(wetlands)} wetland features written")


# --- 4. Barriers (Vandringshinder) ---
print("Reading barriers...")
barriers = gpd.read_file(INPUT / "Vandringshinder_points.shp", encoding="utf-8")
barriers = barriers.to_crs(TARGET_CRS)

keep_cols_barriers = ["NR", "VTNDRAG", "DNAMN", "STATUS", "AGARE",
                       "trout", "perch", "pike", "ide", "lamprey",
                       "Kommentar", "Kommenta_1", "Huvudarter", "geometry"]
barriers = barriers[[c for c in keep_cols_barriers if c in barriers.columns]]

# Spatial join: find nearest river segment for each barrier
print("  Linking barriers to nearest river segment...")
barriers_proj = barriers.to_crs("EPSG:3006")
rivers_proj = gpd.read_file(INPUT / "rivers_named_from_SVAR.gpkg")  # already in EPSG:3006

joined = gpd.sjoin_nearest(
    barriers_proj[["geometry"]],
    rivers_proj[["seadsgm", "geometry"]],
    how="left",
    max_distance=5000,  # 5 km max
    distance_col="dist_to_river"
)
barriers["seadsgm"] = joined["seadsgm"].values
barriers["dist_to_river"] = joined["dist_to_river"].values
print(f"  Linked {barriers['seadsgm'].notna().sum()}/{len(barriers)} barriers to rivers")

barriers.to_file(OUTPUT / "barriers.geojson", driver="GeoJSON")
print(f"  -> {len(barriers)} barrier features written")


# --- 5. Generate waterways.json index ---
print("Generating waterways.json index...")

# Build sets of seadsgm per layer for counting
lake_seadsgm = set()
for _, row in lakes.iterrows():
    if row.get("seadsgm"):
        lake_seadsgm.add(row["seadsgm"])

wetland_seadsgm = set()
for _, row in wetlands.iterrows():
    if row.get("seadsgm"):
        wetland_seadsgm.add(row["seadsgm"])

# Count lakes/wetlands/barriers per seadsgm
from collections import Counter
lake_counts = Counter(lakes["seadsgm"].dropna())
wetland_counts = Counter(wetlands["seadsgm"].dropna())
barrier_counts = Counter(barriers["seadsgm"].dropna())

waterways = []
for _, row in rivers.iterrows():
    sgm = row.get("seadsgm")
    name = row.get("vattendrag")
    if name and isinstance(name, str):
        name = name.strip()
        if name == "":
            name = None

    species_raw = row.get("arter")
    if species_raw and isinstance(species_raw, str) and species_raw.strip():
        species = [s.strip() for s in species_raw.split(",") if s.strip()]
    else:
        species = []

    entry = {
        "id": clean_value(sgm),
        "name": clean_value(name),
        "svarName": clean_value(row.get("svar_vname_final")),
        "svarRiverName": clean_value(row.get("svar_rname_final")),
        "totalLength": clean_value(row.get("ttl_r_2")),
        "lineLength": clean_value(row.get("ttl_ln_")),
        "segments": clean_value(row.get("n_sgmnt")),
        "species": species,
        "lakeCount": lake_counts.get(sgm, 0),
        "wetlandCount": wetland_counts.get(sgm, 0),
        "barrierCount": barrier_counts.get(sgm, 0),
    }
    waterways.append(entry)

# Sort: named first (alphabetically), then unnamed (by seadsgm ID)
waterways.sort(key=lambda w: (0 if w["name"] else 1, (w["name"] or "").lower(), w["id"] or ""))

with open(OUTPUT / "waterways.json", "w", encoding="utf-8") as f:
    json.dump(waterways, f, ensure_ascii=False, indent=2)

print(f"  -> {len(waterways)} waterway entries written")
named = sum(1 for w in waterways if w["name"])
print(f"     ({named} named, {len(waterways) - named} unnamed)")

print("\nDone! Files written to public/data/")
