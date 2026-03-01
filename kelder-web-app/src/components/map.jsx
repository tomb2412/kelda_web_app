import { useEffect, useRef, memo } from "react"
import { MapContainer, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import solentDataUrl from "../assets/marks,water,land.geojson?url"
import { useSensorData } from "../context/SensorDataContext"

// ─── Constants ───────────────────────────────────────────────────────────────

const MAP_COLORS = {
  mapBackground: "rgb(244, 236, 178)",
  landStroke: "rgb(171, 128, 34)",
  solentFill: "rgb(141,163,192)",
  solentStroke: "rgb(141,163,192)",
  coastline: "rgb(26, 112, 0)",
  depthContour: "rgba(136, 183, 208, 1)",
  defaultMarkerFill: "rgba(255, 204, 0, 1)",
  portMarkerFill: "rgba(168, 42, 30, 1)",
  starboardMarkerFill: "rgba(13, 110, 50, 1)",
  cardinalMarkerFill: "rgba(214, 164, 0, 1)",
  specialPurposeFill: "rgba(255, 208, 0, 1)",
  lightFill: "rgba(255, 255, 255, 1)",
  lightStroke: "rgba(241, 250, 140, 1)",
  harbourFill: "rgba(77, 166, 255, 1)",
  harbourStroke: "rgba(0, 63, 136, 1)",
  anchorageStroke: "rgba(240, 233, 194, 1)",
  landmarkFill: "rgba(181, 101, 29, 1)",
}

const MAP_CENTER = [50.8, -1.30]  // Leaflet uses [lat, lon]
const DEFAULT_ZOOM = 12
const MIN_ZOOM = 10
const MAX_ZOOM = 17
const TRACK_POINT_LIMIT = 500
const MARKER_ANIMATION_MS = 800
const MARKER_ANIMATION_MAX_MS = 1500
const MARKER_ANIMATION_MIN_MS = 250

const POINT_SEAMARK_TYPES = new Set([
  "buoy", "beacon", "buoy_lateral", "beacon_lateral",
  "buoy_cardinal", "beacon_cardinal", "buoy_special_purpose",
  "beacon_special_purpose", "harbour", "berth", "light_minor",
  "light_major", "anchorage", "gate", "landmark",
])

// ─── Helpers ──────────────────────────────────────────────────────────────────

const normalizeBearing = (value) => {
  const num = Number(value)
  if (!Number.isFinite(num)) return null
  return ((num % 360) + 360) % 360
}

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)

const computeAnimationDuration = (start, target) => {
  if (!start || !target) return MARKER_ANIMATION_MS
  const dlat = target[0] - start[0]
  const dlon = target[1] - start[1]
  const dist = Math.sqrt(dlat * dlat + dlon * dlon)
  return Math.min(MARKER_ANIMATION_MAX_MS, Math.max(MARKER_ANIMATION_MIN_MS, dist * 40000))
}

// Canvas circle options per seamark type – all share one canvas renderer
const getSeamarkOptions = (properties) => {
  const type = properties["seamark:type"]
  const catLateral = properties["seamark:buoy_lateral:category"]
  const catCardinal = properties["seamark:buoy_cardinal:category"]

  let fillColor = MAP_COLORS.defaultMarkerFill
  let color = "#000000"
  let radius = 4

  if (catLateral === "port")      { fillColor = MAP_COLORS.portMarkerFill;     color = "#ffffff" }
  else if (catLateral === "starboard") { fillColor = MAP_COLORS.starboardMarkerFill; color = "#ffffff" }
  else if (catCardinal)           { fillColor = MAP_COLORS.cardinalMarkerFill }
  else if (type === "buoy_special_purpose" || type === "beacon_special_purpose")
                                  { fillColor = MAP_COLORS.specialPurposeFill }
  else if (type === "light_minor") { fillColor = MAP_COLORS.lightFill; color = MAP_COLORS.lightStroke; radius = 3 }
  else if (type === "light_major") { fillColor = MAP_COLORS.lightFill; color = MAP_COLORS.lightStroke; radius = 5 }
  else if (type === "harbour" || type === "berth")
                                  { fillColor = MAP_COLORS.harbourFill; color = MAP_COLORS.harbourStroke }
  else if (type === "anchorage")  { fillColor = "transparent";          color = MAP_COLORS.anchorageStroke }
  else if (type === "landmark")   { fillColor = MAP_COLORS.landmarkFill }

  return { fillColor, color, radius, fillOpacity: 1, weight: 0.8 }
}

// SVG vessel marker – rotated divIcon, so it stays outside the canvas layer
const createVesselIcon = (rotation) =>
  L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="-10 -10 20 20">
      <polygon points="0,-8 7,6 0,1 -7,6"
        fill="rgba(168,42,30,1)" stroke="rgba(0,0,0,1)" stroke-width="1"
        transform="rotate(${rotation})"/>
    </svg>`,
    className: "",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })

// ─── Module-level GeoJSON cache ───────────────────────────────────────────────
// Parsed once; survives hot-reloads and multiple component mounts.
let geojsonCache = null

// ─── Static base layer ────────────────────────────────────────────────────────
// Rendered once on mount, never re-renders.
// All features share a single L.canvas() instance → one <canvas> element.
const SolentBaseLayer = memo(function SolentBaseLayer() {
  const map = useMap()

  useEffect(() => {
    let cancelled = false
    const addedLayers = []

    const buildLayers = (data) => {
      if (cancelled) return

      // Single canvas renderer for ALL static features
      const renderer = L.canvas({ padding: 0.2 })
      const features = data.features

      // --- Land polygons (and island rings inside water) ---
      const landLayer = L.geoJSON(
        features.filter(
          (f) =>
            f.properties.natural === "land" ||
            (f.properties.natural === "water" &&
              f.geometry.type === "Polygon" &&
              f.geometry.coordinates.length > 1)
        ),
        {
          renderer,
          interactive: false,
          style: () => ({
            fillColor: MAP_COLORS.mapBackground,
            fillOpacity: 1,
            color: MAP_COLORS.landStroke,
            weight: 0.4,
          }),
        }
      ).addTo(map)
      addedLayers.push(landLayer)

      // --- Water polygons (sea, bays) ---
      const waterLayer = L.geoJSON(
        features.filter((f) => {
          const p = f.properties
          return (
            (p.natural === "water" || p.natural === "bay" || p.place === "sea") &&
            !(f.geometry.type === "Polygon" && f.geometry.coordinates.length > 1)
          )
        }),
        {
          renderer,
          interactive: false,
          style: () => ({
            fillColor: MAP_COLORS.solentFill,
            fillOpacity: 1,
            color: MAP_COLORS.solentStroke,
            weight: 0.4,
          }),
        }
      ).addTo(map)
      addedLayers.push(waterLayer)

      // --- Coastlines + depth contours ---
      const coastLayer = L.geoJSON(
        features.filter(
          (f) =>
            f.properties.natural === "coastline" ||
            f.properties["seamark:type"] === "depth_contour"
        ),
        {
          renderer,
          interactive: false,
          style: (f) => {
            const isDepth = f.properties["seamark:type"] === "depth_contour"
            return {
              fill: false,
              color: isDepth ? MAP_COLORS.depthContour : MAP_COLORS.coastline,
              weight: isDepth ? 1 : 2,
            }
          },
        }
      ).addTo(map)
      addedLayers.push(coastLayer)

      // --- Seamarks (1 200+ point features on the shared canvas) ---
      const seamarkLayer = L.geoJSON(
        features.filter(
          (f) =>
            f.geometry?.type === "Point" &&
            POINT_SEAMARK_TYPES.has(f.properties["seamark:type"])
        ),
        {
          interactive: false,
          pointToLayer: (f, latlng) =>
            L.circleMarker(latlng, {
              renderer,
              ...getSeamarkOptions(f.properties),
            }),
        }
      ).addTo(map)
      addedLayers.push(seamarkLayer)
    }

    if (geojsonCache) {
      buildLayers(geojsonCache)
    } else {
      fetch(solentDataUrl)
        .then((r) => r.json())
        .then((data) => {
          geojsonCache = data
          buildLayers(data)
        })
    }

    return () => {
      cancelled = true
      addedLayers.forEach((l) => map.removeLayer(l))
    }
  }, [map])  // runs once – map ref is stable

  return null
})

// ─── Dynamic vessel layer ─────────────────────────────────────────────────────
// Track and GPS marker are updated imperatively via Leaflet API.
// No React state changes during animation → zero extra React renders.
const VesselLayer = memo(function VesselLayer({ gpsData }) {
  const map = useMap()
  const trackRef      = useRef(null)
  const markerRef     = useRef(null)
  const animFrameRef  = useRef(null)
  const currentLLRef  = useRef(null)   // [lat, lon] of marker as it animates
  const isFirstRef    = useRef(true)

  // Initialise track polyline + vessel marker once
  useEffect(() => {
    const renderer = L.canvas()

    trackRef.current = L.polyline([], {
      renderer,
      color: "rgba(168, 42, 30, 1)",
      weight: 2.5,
      lineCap: "round",
      lineJoin: "round",
      interactive: false,
    }).addTo(map)

    markerRef.current = L.marker(MAP_CENTER, {
      icon: createVesselIcon(0),
      zIndexOffset: 1000,
      opacity: 0,           // hidden until first valid GPS fix
      interactive: false,
    }).addTo(map)

    return () => {
      if (trackRef.current)  map.removeLayer(trackRef.current)
      if (markerRef.current) map.removeLayer(markerRef.current)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [map])

  // Update track polyline when track data changes
  useEffect(() => {
    if (!trackRef.current) return
    const raw = Array.isArray(gpsData?.track) ? gpsData.track : []
    const latLngs = raw
      .map(({ longitude, latitude }) => [Number(latitude), Number(longitude)])
      .filter(([lat, lon]) => Number.isFinite(lat) && Number.isFinite(lon))
      .slice(-TRACK_POINT_LIMIT)
    trackRef.current.setLatLngs(latLngs)
  }, [gpsData?.track])

  // Animate GPS marker to new position (no React state – pure Leaflet API)
  useEffect(() => {
    const hasCoords =
      Number.isFinite(Number(gpsData?.longitude)) &&
      Number.isFinite(Number(gpsData?.latitude))
    if (!hasCoords || !markerRef.current) return

    const targetLat = Number(gpsData.latitude)
    const targetLon = Number(gpsData.longitude)
    const cog = normalizeBearing(gpsData?.cog) ?? 0

    markerRef.current.setIcon(createVesselIcon(cog))
    markerRef.current.setOpacity(1)

    // First fix: snap directly, no animation
    if (isFirstRef.current) {
      isFirstRef.current = false
      markerRef.current.setLatLng([targetLat, targetLon])
      currentLLRef.current = [targetLat, targetLon]
      return
    }

    const start = currentLLRef.current
    if (!start || (start[0] === targetLat && start[1] === targetLon)) return

    const duration  = computeAnimationDuration(start, [targetLat, targetLon])
    const startTime = performance.now()

    const animate = (now) => {
      const rawProgress = Math.min((now - startTime) / duration, 1)
      const progress    = easeOutCubic(rawProgress)
      const lat = start[0] + (targetLat - start[0]) * progress
      const lon = start[1] + (targetLon - start[1]) * progress
      markerRef.current.setLatLng([lat, lon])
      currentLLRef.current = [lat, lon]
      if (rawProgress < 1) {
        animFrameRef.current = requestAnimationFrame(animate)
      } else {
        animFrameRef.current = null
      }
    }

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    animFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = null
      }
    }
  }, [gpsData?.longitude, gpsData?.latitude, gpsData?.cog])

  return null
})

// ─── Zoom controls (rendered inside MapContainer so useMap() is available) ────
const ZoomControls = () => {
  const map = useMap()
  return (
    <div
      className="absolute right-4 top-4 flex flex-col overflow-hidden rounded-lg shadow"
      style={{ zIndex: 1001 }}
    >
      <button
        type="button"
        className="bg-white/90 px-3 py-2 text-lg font-semibold text-slate-800 transition hover:bg-white"
        onClick={() => map.zoomIn()}
        aria-label="Zoom in"
      >
        +
      </button>
      <button
        type="button"
        className="bg-white/90 px-3 py-2 text-lg font-semibold text-slate-800 transition hover:bg-white"
        onClick={() => map.zoomOut()}
        aria-label="Zoom out"
      >
        −
      </button>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export const SolentChart = () => {
  const gpsData = useSensorData("gpsPosition")

  return (
    <div className="rounded-xl p-3 text-slate-800 dark:bg-slate-800/90 bg-[#024887]/10 dark:text-white mb-3">
      <MapContainer
        center={MAP_CENTER}
        zoom={DEFAULT_ZOOM}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        style={{
          background: MAP_COLORS.mapBackground,
          borderRadius: "0.75rem",
          width: "100%",
          height: "50vh",
        }}
        zoomControl={false}
        attributionControl={false}
      >
        <SolentBaseLayer />
        <VesselLayer gpsData={gpsData} />
        <ZoomControls />
      </MapContainer>
    </div>
  )
}

export default SolentChart
