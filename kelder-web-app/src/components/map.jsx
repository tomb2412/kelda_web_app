import { useEffect, useRef, memo, useState } from "react"
import { MapContainer, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import solentDataUrl from "../assets/marks,water,land.geojson?url"
import { useSensorData } from "../context/SensorDataContext"


// ─── Constants ───────────────────────────────────────────────────────────────

const MAP_COLORS = {
  mapBackground:  "rgb(235, 195, 109)",
  landStroke:     "rgb(235, 195, 109)",
  solentFill:     "rgb(141,163,192)",
  solentStroke:   "rgb(141,163,192)",
  coastline:      "rgb(26, 112, 0)",
  depthContour:   "rgba(136, 183, 208, 1)",
  fallbackMark:   "rgba(255, 204, 0, 1)",
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

// ─── Seamark canvas style ─────────────────────────────────────────────────────
// Returns circleMarker options for a given seamark feature.
// All marks share one L.canvas() renderer → a single <canvas> element.

const getSeamarkStyle = (properties) => {
  const type      = properties["seamark:type"]
  const catLateral = properties["seamark:buoy_lateral:category"] || properties["seamark:beacon_lateral:category"]
  const catCard    = properties["seamark:buoy_cardinal:category"] || properties["seamark:beacon_cardinal:category"]

  // Cardinals — yellow/black per IALA convention
  if (type === "buoy_cardinal" || type === "beacon_cardinal") {
    const fill = (catCard === "north" || catCard === "south") ? "#000000" : "#f5c400"
    return { fillColor: fill, color: "#000", radius: 5, fillOpacity: 1, weight: 1 }
  }
  // Laterals
  if (type === "buoy_lateral" || type === "beacon_lateral") {
    if (catLateral === "starboard")                  return { fillColor: "#0d6e32", color: "#fff", radius: 4, fillOpacity: 1, weight: 0.8 }
    if (catLateral === "preferred_channel_port")     return { fillColor: "#a82a1e", color: "#0d6e32", radius: 4, fillOpacity: 1, weight: 1.5 }
    if (catLateral === "preferred_channel_starboard") return { fillColor: "#0d6e32", color: "#a82a1e", radius: 4, fillOpacity: 1, weight: 1.5 }
    return { fillColor: "#a82a1e", color: "#fff", radius: 4, fillOpacity: 1, weight: 0.8 } // port
  }
  // Special purpose — yellow X buoys
  if (type === "buoy_special_purpose" || type === "beacon_special_purpose")
    return { fillColor: "#f5c400", color: "#8a6d00", radius: 4, fillOpacity: 1, weight: 0.8 }
  // Lights
  if (type === "light_major") return { fillColor: "#ffffff", color: "#f1fa8c", radius: 5, fillOpacity: 1, weight: 1.5 }
  if (type === "light_minor") return { fillColor: "#ffffff", color: "#f1fa8c", radius: 3, fillOpacity: 1, weight: 1 }
  // Harbours / berths
  if (type === "harbour" || type === "berth") return { fillColor: "#4da6ff", color: "#003f88", radius: 4, fillOpacity: 1, weight: 0.8 }
  // Anchorage — hollow circle
  if (type === "anchorage") return { fillColor: "transparent", color: "#c8b96e", radius: 5, fillOpacity: 0, weight: 1.5 }
  // Landmarks
  if (type === "landmark") return { fillColor: "#b5651d", color: "#000", radius: 4, fillOpacity: 1, weight: 0.8 }
  // Default
  return { fillColor: "#ffcc00", color: "#000", radius: 3, fillOpacity: 1, weight: 0.8 }
}

// ─── Info panel helpers ───────────────────────────────────────────────────────

const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ") : ""

const SEAMARK_LABELS = {
  buoy_cardinal: "Cardinal Buoy", beacon_cardinal: "Cardinal Beacon",
  buoy_lateral: "Lateral Buoy",   beacon_lateral:  "Lateral Beacon",
  buoy_special_purpose: "Special Purpose Buoy", beacon_special_purpose: "Special Purpose Beacon",
  light_minor: "Minor Light", light_major: "Lighthouse",
  harbour: "Harbour", berth: "Berth", anchorage: "Anchorage", landmark: "Landmark", gate: "Gate",
}

const formatMarkType = (p) => {
  const base = SEAMARK_LABELS[p["seamark:type"]] ?? cap(p["seamark:type"] ?? "")
  const cat  = p["seamark:buoy_cardinal:category"] || p["seamark:beacon_cardinal:category"] ||
               p["seamark:buoy_lateral:category"]  || p["seamark:beacon_lateral:category"]
  return cat ? `${base} · ${cap(cat)}` : base
}

const formatLight = (p) => {
  const char   = p["seamark:light:character"]
  const group  = p["seamark:light:group"]
  const colour = p["seamark:light:colour"]
  const period = p["seamark:light:period"]
  if (!char && !colour) return null
  const code = { white: "W", red: "R", green: "G", yellow: "Y" }[colour] ?? (colour ? colour[0].toUpperCase() : "")
  return `${char ?? ""}${group ? `(${group})` : ""}${code}${period ? ` ${period}s` : ""}`.trim()
}

const formatColour = (p) => {
  const raw = p["seamark:buoy_cardinal:colour"] || p["seamark:buoy_lateral:colour"] ||
              p["seamark:buoy_special_purpose:colour"] || p["seamark:beacon_lateral:colour"]
  return raw ? raw.split(";").map(cap).join(" / ") : null
}

// ─── Mark info panel ─────────────────────────────────────────────────────────

function InfoRow({ label, value }) {
  return (
    <div className="flex gap-1.5 text-xs">
      <span className="text-slate-400 dark:text-slate-500 w-14 flex-shrink-0">{label}</span>
      <span className="text-slate-700 dark:text-slate-200">{value}</span>
    </div>
  )
}

function MarkInfoPanel({ mark, onClose }) {
  if (!mark) return null
  const { properties: p, latlng } = mark
  const name    = p["seamark:name"] || p["name"] || "Unknown Mark"
  const type    = formatMarkType(p)
  const light   = formatLight(p)
  const colour  = formatColour(p)
  const topmark = p["seamark:topmark:shape"]
  const lat = latlng[0].toFixed(4)
  const lon = Math.abs(latlng[1]).toFixed(4)
  const lonHemi = latlng[1] < 0 ? "W" : "E"

  return (
    <div className="absolute bottom-4 left-4 z-[1000] bg-white/96 dark:bg-slate-900/96 text-slate-900 dark:text-white rounded-xl shadow-xl border border-slate-200/60 dark:border-slate-700/60 p-3 max-w-[210px]">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h3 className="font-semibold text-sm leading-tight">{name}</h3>
        <button
          onClick={onClose}
          className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 flex items-center justify-center text-xs transition leading-none"
          aria-label="Close"
        >×</button>
      </div>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">{type}</p>
      <div className="space-y-0.5">
        {colour  && <InfoRow label="Colour"   value={colour} />}
        {light   && <InfoRow label="Light"    value={light} />}
        {topmark && <InfoRow label="Topmark"  value={cap(topmark)} />}
        <InfoRow label="Lat" value={`${lat}° N`} />
        <InfoRow label="Lon" value={`${lon}° ${lonHemi}`} />
      </div>
    </div>
  )
}

// ─── SVG vessel marker ────────────────────────────────────────────────────────

const createVesselIcon = (rotation) =>
  L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="5" height="5" viewBox="-10 -10 20 20">
      <polygon points="0,-8 7,6 0,1 -7,6"
        fill="rgba(168,42,30,1)" stroke="rgba(0,0,0,1)" stroke-width="1"
        transform="rotate(${rotation})"/>
    </svg>`,
    className: "",
    iconSize: [5, 5],
    iconAnchor: [10, 10],
  })

// ─── Module-level GeoJSON cache ───────────────────────────────────────────────
// Parsed once; survives hot-reloads and multiple component mounts.
let geojsonCache = null

// ─── Static base layer ────────────────────────────────────────────────────────
// Rendered once on mount, never re-renders.
const SolentBaseLayer = memo(function SolentBaseLayer({ onMarkClickRef }) {
  const map = useMap()

  useEffect(() => {
    let cancelled = false
    const addedLayers = []

    const buildLayers = (data) => {
      if (cancelled) return

      // Canvas renderer for non-interactive base layers
      const renderer = L.canvas({ padding: 0.2 })
      const features = data.features

      // --- Land polygons (and island rings inside water bodies) ---
      const landLayer = L.geoJSON(
        features.filter(
          (f) =>
            f.properties.natural === "coastline" ||
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

      // --- Water polygons (sea, bays, straits) ---
      // Straits (e.g. The Solent) are always included regardless of ring count —
      // their inner rings (islands) will be rendered on top by the land layer.
      const waterLayer = L.geoJSON(
        features.filter((f) => {
          const p = f.properties
          if (p.natural === "strait") return true
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

      // --- Seamarks: all on the shared canvas renderer, click → info panel ---
      const seamarkLayer = L.geoJSON(
        features.filter(
          (f) =>
            f.geometry?.type === "Point" &&
            POINT_SEAMARK_TYPES.has(f.properties["seamark:type"])
        ),
        {
          pointToLayer: (feature, latlng) =>
            L.circleMarker(latlng, { renderer, ...getSeamarkStyle(feature.properties) }),
          onEachFeature: (feature, layer) => {
            layer.on("click", () => {
              onMarkClickRef.current?.({
                properties: feature.properties,
                latlng: [feature.geometry.coordinates[1], feature.geometry.coordinates[0]],
              })
            })
          },
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
  const [selectedMark, setSelectedMark] = useState(null)

  // Ref so the memo'd base layer always calls the latest setter without re-mounting
  const onMarkClickRef = useRef(null)
  onMarkClickRef.current = setSelectedMark

  return (
    <div className="rounded-xl p-3 text-slate-800 dark:bg-slate-800/90 bg-[#024887]/10 dark:text-white mb-3">
      <div className="relative">
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
          <SolentBaseLayer onMarkClickRef={onMarkClickRef} />
          <VesselLayer gpsData={gpsData} />
          <ZoomControls />
        </MapContainer>
        <MarkInfoPanel mark={selectedMark} onClose={() => setSelectedMark(null)} />
      </div>
    </div>
  )
}

export default SolentChart
