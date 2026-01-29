/**
 * Enrich trails with elevation profiles and aspect data
 *
 * Uses COTREX-provided min_elevat/max_elevat for all trails.
 * For the top 500 longest trails, also generates elevation profiles
 * by sampling points along the geometry and querying USGS Elevation API.
 * For remaining trails, generates interpolated profiles from min/max.
 *
 * Usage: npx tsx scripts/etl/enrich-elevation.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as turf from '@turf/turf';

// USGS Elevation API endpoint
const USGS_ELEVATION_URL = 'https://epqs.nationalmap.gov/v1/json';

// File paths
const INPUT_FILE = path.join(__dirname, '../../data/enriched/trails_with_soil.json');
const OUTPUT_FILE = path.join(__dirname, '../../data/enriched/trails_complete.json');
const PROGRESS_FILE = path.join(__dirname, '../../data/enriched/elevation_progress.json');

// Configuration
const PROFILE_SAMPLES = 15; // Points to sample per trail
const MAX_RETRIES = 3;
const USGS_PROFILE_LIMIT = 100; // Only query USGS for top N longest trails
const USGS_CONCURRENCY = 5; // Concurrent USGS requests per trail
const CHECKPOINT_INTERVAL = 25;

type Aspect = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

interface TrailData {
  cotrex_id: string;
  name: string;
  system: string | null;
  manager: string | null;
  surface: string | null;
  open_to: string | null;
  open_to_bikes: boolean;
  length_miles: number | null;
  elevation_min_m?: number | null;
  elevation_max_m?: number | null;
  geometry: {
    type: 'MultiLineString';
    coordinates: number[][][];
  };
  centroid_lat: number;
  centroid_lon: number;
  segment_count?: number;
  soil_drainage_class?: string | null;
  base_dry_hours?: number | null;
  // Enriched fields
  elevation_min?: number | null;
  elevation_max?: number | null;
  elevation_gain?: number | null;
  dominant_aspect?: Aspect | null;
  elevation_profile?: Array<{ distance_mi: number; elevation_m: number }> | null;
}

interface EnrichedTrailsData {
  fetched_at: string;
  source: string;
  source_url: string;
  total_trails: number;
  trails: TrailData[];
  [key: string]: unknown;
}

interface Progress {
  lastProcessedIndex: number;
  processedCount: number;
  errorCount: number;
  usgsCallCount: number;
  lastRunTime: string;
}

// Query elevation for a single point from USGS
async function getElevation(lat: number, lon: number): Promise<number | null> {
  const url = `${USGS_ELEVATION_URL}?x=${lon}&y=${lat}&units=Meters&wkid=4326`;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.value !== undefined && data.value !== -1000000) {
        return Math.round(data.value);
      }

      return null;
    } catch {
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
  }

  return null;
}

// Sample evenly-spaced points along a trail's MultiLineString geometry
// Handles disconnected segments by distributing samples proportionally
function samplePoints(
  geometry: TrailData['geometry'],
  numSamples: number,
  trailLengthMi?: number | null
): Array<{ lat: number; lon: number; distanceMi: number }> {
  try {
    // Build individual line segments with their lengths
    const segments: Array<{
      line: GeoJSON.Feature<GeoJSON.LineString>;
      lengthKm: number;
    }> = [];

    for (const coords of geometry.coordinates) {
      if (coords.length < 2) continue;
      const line = turf.lineString(coords);
      const lengthKm = turf.length(line, { units: 'kilometers' });
      if (lengthKm > 0) {
        segments.push({ line, lengthKm });
      }
    }

    if (segments.length === 0) return [];

    const totalLengthKm = segments.reduce((sum, s) => sum + s.lengthKm, 0);
    const totalLengthMi = trailLengthMi || totalLengthKm * 0.621371;

    const samples: Array<{ lat: number; lon: number; distanceMi: number }> = [];

    // Distribute samples across segments proportionally to their length
    let cumulativeKm = 0;

    for (let i = 0; i < numSamples; i++) {
      const fraction = numSamples === 1 ? 0 : i / (numSamples - 1);
      const targetKm = fraction * totalLengthKm;
      const distMi = Math.round(fraction * totalLengthMi * 100) / 100;

      // Find which segment contains this distance
      let accumulated = 0;
      for (const seg of segments) {
        if (accumulated + seg.lengthKm >= targetKm || seg === segments[segments.length - 1]) {
          const withinSeg = Math.min(targetKm - accumulated, seg.lengthKm);
          const point = turf.along(seg.line, Math.max(0, withinSeg), { units: 'kilometers' });
          samples.push({
            lat: point.geometry.coordinates[1],
            lon: point.geometry.coordinates[0],
            distanceMi: distMi,
          });
          break;
        }
        accumulated += seg.lengthKm;
      }
    }

    return samples;
  } catch {
    return [];
  }
}

// Generate an interpolated elevation profile from min/max values
function interpolateProfile(
  trail: TrailData,
  numPoints: number = 10
): Array<{ distance_mi: number; elevation_m: number }> {
  const minElev = trail.elevation_min_m ?? trail.elevation_min ?? 2000;
  const maxElev = trail.elevation_max_m ?? trail.elevation_max ?? 2500;
  const lengthMi = trail.length_miles ?? 1;

  const profile: Array<{ distance_mi: number; elevation_m: number }> = [];

  for (let i = 0; i < numPoints; i++) {
    const fraction = numPoints === 1 ? 0 : i / (numPoints - 1);
    const distMi = Math.round(fraction * lengthMi * 100) / 100;
    // Simple up-then-down profile: rises to max at midpoint, returns to min
    const t = fraction <= 0.5 ? fraction * 2 : 2 - fraction * 2;
    const elevation = Math.round(minElev + t * (maxElev - minElev));
    profile.push({ distance_mi: distMi, elevation_m: elevation });
  }

  return profile;
}

// Calculate dominant aspect from bearing changes along a line
function calculateDominantAspect(geometry: TrailData['geometry']): Aspect | null {
  try {
    const coords: number[][] = [];
    for (const part of geometry.coordinates) {
      coords.push(...part);
    }

    if (coords.length < 2) return null;

    let sinSum = 0;
    let cosSum = 0;

    for (let i = 0; i < coords.length - 1; i++) {
      const bearing = turf.bearing(turf.point(coords[i]), turf.point(coords[i + 1]));
      sinSum += Math.sin((bearing * Math.PI) / 180);
      cosSum += Math.cos((bearing * Math.PI) / 180);
    }

    const avgBearing = (Math.atan2(sinSum, cosSum) * 180) / Math.PI;
    const b = ((avgBearing % 360) + 360) % 360;

    if (b >= 337.5 || b < 22.5) return 'N';
    if (b >= 22.5 && b < 67.5) return 'NE';
    if (b >= 67.5 && b < 112.5) return 'E';
    if (b >= 112.5 && b < 157.5) return 'SE';
    if (b >= 157.5 && b < 202.5) return 'S';
    if (b >= 202.5 && b < 247.5) return 'SW';
    if (b >= 247.5 && b < 292.5) return 'W';
    return 'NW';
  } catch {
    return null;
  }
}

// Load/save progress
function loadProgress(): Progress {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
    }
  } catch {
    console.log('No progress file found');
  }
  return {
    lastProcessedIndex: -1,
    processedCount: 0,
    errorCount: 0,
    usgsCallCount: 0,
    lastRunTime: new Date().toISOString(),
  };
}

function saveProgress(progress: Progress): void {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

function saveTrails(trails: TrailData[], originalData: EnrichedTrailsData): void {
  const output = {
    ...originalData,
    elevation_enriched_at: new Date().toISOString(),
    trails,
  };
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
}

// Main function
async function enrichTrailsWithElevation(): Promise<void> {
  console.log('⛰️  Elevation Enrichment (COTREX + USGS)');
  console.log('=========================================\n');

  // Find input file
  let inputPath = INPUT_FILE;
  if (!fs.existsSync(INPUT_FILE)) {
    const rawFile = path.join(__dirname, '../../data/raw/cotrex_trails.json');
    if (fs.existsSync(rawFile)) {
      console.log('Soil-enriched file not found, using raw trails...');
      inputPath = rawFile;
    } else {
      console.error('No input file found. Run fetch-cotrex.ts first.');
      process.exit(1);
    }
  }

  const rawData: EnrichedTrailsData = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
  console.log(`Loaded ${rawData.trails.length} trails`);

  // Load progress
  let progress = loadProgress();
  const startIndex = progress.lastProcessedIndex + 1;

  if (startIndex > 0) {
    console.log(`Resuming from trail ${startIndex}...`);
    if (fs.existsSync(OUTPUT_FILE)) {
      const enrichedData = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
      rawData.trails = enrichedData.trails;
    }
  }

  const trails = rawData.trails;
  const total = trails.length;

  // Sort trails by length to identify top N for USGS profiles
  const trailsByLength = trails
    .map((t, idx) => ({ idx, length: t.length_miles || 0 }))
    .sort((a, b) => b.length - a.length);

  const usgsEligible = new Set(
    trailsByLength.slice(0, USGS_PROFILE_LIMIT).map((t) => t.idx)
  );

  console.log(`USGS elevation profiles: top ${USGS_PROFILE_LIMIT} longest trails`);
  console.log(`Interpolated profiles: remaining ${total - USGS_PROFILE_LIMIT} trails`);
  console.log(`Processing trails ${startIndex} to ${total - 1}...\n`);

  for (let i = startIndex; i < total; i++) {
    const trail = trails[i];

    // Skip if already has elevation profile
    if (trail.elevation_profile && trail.elevation_profile.length > 0) {
      continue;
    }

    const shortName = trail.name.substring(0, 35).padEnd(35);

    // Use COTREX min/max elevation directly
    trail.elevation_min = trail.elevation_min_m ?? null;
    trail.elevation_max = trail.elevation_max_m ?? null;

    // Calculate aspect
    trail.dominant_aspect = calculateDominantAspect(trail.geometry);

    if (usgsEligible.has(i)) {
      // USGS profile for top trails
      process.stdout.write(`[${i + 1}/${total}] ${shortName} USGS `);

      try {
        const points = samplePoints(trail.geometry, PROFILE_SAMPLES, trail.length_miles);
        
        // Fetch elevations concurrently in batches
        const elevResults: Array<{ idx: number; distanceMi: number; elevation: number | null }> = [];
        
        for (let b = 0; b < points.length; b += USGS_CONCURRENCY) {
          const batch = points.slice(b, b + USGS_CONCURRENCY);
          const results = await Promise.all(
            batch.map(async (pt, bIdx) => {
              const elev = await getElevation(pt.lat, pt.lon);
              progress.usgsCallCount++;
              return { idx: b + bIdx, distanceMi: pt.distanceMi, elevation: elev };
            })
          );
          elevResults.push(...results);
        }
        
        // Build profile in order
        const profile: Array<{ distance_mi: number; elevation_m: number }> = [];
        let gain = 0;
        let prevElev: number | null = null;
        
        elevResults.sort((a, b) => a.idx - b.idx);
        for (const r of elevResults) {
          if (r.elevation !== null) {
            profile.push({ distance_mi: r.distanceMi, elevation_m: r.elevation });
            if (prevElev !== null && r.elevation > prevElev) {
              gain += r.elevation - prevElev;
            }
            prevElev = r.elevation;
          }
        }

        if (profile.length > 0) {
          trail.elevation_profile = profile;
          trail.elevation_gain = Math.round(gain);
          // Update min/max from profile if COTREX didn't have them
          if (trail.elevation_min === null) {
            trail.elevation_min = Math.min(...profile.map((p) => p.elevation_m));
          }
          if (trail.elevation_max === null) {
            trail.elevation_max = Math.max(...profile.map((p) => p.elevation_m));
          }
          const minFt = Math.round((trail.elevation_min || 0) * 3.28084);
          const maxFt = Math.round((trail.elevation_max || 0) * 3.28084);
          console.log(`✓ ${profile.length}pts ${minFt}-${maxFt}ft +${trail.elevation_gain}m ${trail.dominant_aspect || '?'}`);
        } else {
          // Fallback to interpolated
          trail.elevation_profile = interpolateProfile(trail);
          trail.elevation_gain = trail.elevation_max && trail.elevation_min
            ? Math.round((trail.elevation_max - trail.elevation_min) / 2)
            : null;
          console.log('⚠ USGS failed, interpolated');
        }

        progress.processedCount++;
      } catch (error) {
        console.log(`✗ Error: ${error}`);
        trail.elevation_profile = interpolateProfile(trail);
        trail.elevation_gain = null;
        progress.errorCount++;
      }
    } else {
      // Interpolated profile for remaining trails
      if (i % 200 === 0) {
        process.stdout.write(`[${i + 1}/${total}] Interpolating batch...`);
      }

      trail.elevation_profile = interpolateProfile(trail);
      trail.elevation_gain = trail.elevation_max && trail.elevation_min
        ? Math.round((trail.elevation_max - trail.elevation_min) / 2)
        : null;
      progress.processedCount++;

      if (i % 200 === 0) {
        console.log(` ✓`);
      }
    }

    // Update progress
    progress.lastProcessedIndex = i;
    progress.lastRunTime = new Date().toISOString();

    // Save checkpoint
    if ((i + 1) % CHECKPOINT_INTERVAL === 0 && usgsEligible.has(i)) {
      console.log('\n  Saving checkpoint...\n');
      saveTrails(trails, rawData);
      saveProgress(progress);
    }
  }

  // Final save
  saveTrails(trails, rawData);

  // Clean up progress
  if (fs.existsSync(PROGRESS_FILE)) {
    fs.unlinkSync(PROGRESS_FILE);
  }

  // Stats
  const withProfile = trails.filter(
    (t) => t.elevation_profile && t.elevation_profile.length > 0
  ).length;
  const usgsProfiles = trails.filter(
    (t) => t.elevation_profile && t.elevation_profile.length > 15
  ).length;
  const withAspect = trails.filter((t) => t.dominant_aspect).length;

  console.log('\n✅ Elevation enrichment complete!');
  console.log(`\nStats:`);
  console.log(`  Trails with elevation profiles: ${withProfile} / ${total}`);
  console.log(`  USGS-based profiles: ${usgsProfiles}`);
  console.log(`  Interpolated profiles: ${withProfile - usgsProfiles}`);
  console.log(`  Trails with aspect: ${withAspect}`);
  console.log(`  Total USGS API calls: ${progress.usgsCallCount}`);
  console.log(`  Errors: ${progress.errorCount}`);
  console.log(`\nOutput: ${OUTPUT_FILE}`);
}

// Run
enrichTrailsWithElevation().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
