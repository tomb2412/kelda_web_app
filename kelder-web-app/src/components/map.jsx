import { useEffect, useRef, memo, useState } from "react"
import { MapContainer, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import solentDataUrl from "../assets/marks,water,land.geojson?url"
import { useSensorData } from "../context/SensorDataContext"

// ─── Mark asset imports ───────────────────────────────────────────────────────
import cardinalNorthUrl   from "../assets/Cardinal_Pillar_North.svg?url"
import cardinalSouthUrl   from "../assets/Cardinal_Pillar_South.svg?url"
import cardinalEastUrl    from "../assets/Cardinal_Pillar_East.svg?url"
import cardinalWestUrl    from "../assets/Cardinal_Pillar_West.svg?url"
import cardinalSingleUrl  from "../assets/Cardinal_Pillar_Single.svg?url"
import lateralPortUrl     from "../assets/Lateral_Conical_Red.png?url"
import lateralStbdUrl     from "../assets/Lateral_Conical_Green.png?url"
import lateralPrefPortUrl from "../assets/Lateral_Pillar_PreferredChannel_Port.svg?url"
import lateralPrefStbdUrl from "../assets/Lateral_Pillar_PreferredChannel_Starboard.svg?url"
import specialPurposeUrl  from "../assets/SpecialPP_Conical.svg?url"
import lightHouseUrl      from "../assets/Light_House.svg?url"
import harbourUrl         from "../assets/Harbour.svg?url"
import visitorBerthUrl    from "../assets/Visitor_Berth.svg?url"
import anchorUrl          from "../assets/anchor.svg?url"
import rockUrl            from "../assets/Rock.svg?url"
import safeWaterUrl       from "../assets/Safe_Water_Pillar.svg?url"


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

// ─── Seamark image icons ──────────────────────────────────────────────────────
// Icons are drawn on a single <canvas> via drawImage() at ICON_SIZE px.
// drawImage() ignores the SVG's intrinsic dimensions — only ICON_SIZE matters.
// Only ~16 HTMLImageElement objects are ever created (one per distinct icon),
// regardless of how many marks are on the chart.

const ICON_SIZE = 60 // px on screen

const ICON_URLS = {
  cardinal_north:    cardinalNorthUrl,
  cardinal_south:    cardinalSouthUrl,
  cardinal_east:     cardinalEastUrl,
  cardinal_west:     cardinalWestUrl,
  cardinal_single:   cardinalSingleUrl,
  lateral_port:      lateralPortUrl,
  lateral_stbd:      lateralStbdUrl,
  lateral_pref_port: lateralPrefPortUrl,
  lateral_pref_stbd: lateralPrefStbdUrl,
  special_purpose:   specialPurposeUrl,
  light:             lightHouseUrl,
  harbour:           harbourUrl,
  berth:             visitorBerthUrl,
  anchorage:         anchorUrl,
  landmark:          rockUrl,
  gate:              safeWaterUrl,
}

const getIconKey = (p) => {
  const type      = p["seamark:type"]
  const catLateral = p["seamark:buoy_lateral:category"]  || p["seamark:beacon_lateral:category"]
  const catCard    = p["seamark:buoy_cardinal:category"] || p["seamark:beacon_cardinal:category"]
  if (type === "buoy_cardinal"       || type === "beacon_cardinal")
    return `cardinal_${catCard ?? "single"}`
  if (type === "buoy_lateral"        || type === "beacon_lateral") {
    if (catLateral === "preferred_channel_port")      return "lateral_pref_port"
    if (catLateral === "preferred_channel_starboard") return "lateral_pref_stbd"
    return catLateral === "starboard" ? "lateral_stbd" : "lateral_port"
  }
  if (type === "buoy_special_purpose" || type === "beacon_special_purpose") return "special_purpose"
  if (type === "light_major" || type === "light_minor") return "light"
  if (type === "harbour")   return "harbour"
  if (type === "berth")     return "berth"
  if (type === "anchorage") return "anchorage"
  if (type === "landmark")  return "landmark"
  if (type === "gate")      return "gate"
  return null
}

// Module-level promise — images load once and are reused across mounts
let iconImagesPromise = null
const loadIconImages = () => {
  if (iconImagesPromise) return iconImagesPromise
  iconImagesPromise = Promise.all(
    Object.entries(ICON_URLS).map(([key, url]) =>
      new Promise(resolve => {
        const img = new Image()
        img.onload  = () => resolve([key, img])
        img.onerror = () => resolve([key, null])
        img.src = url
      })
    )
  ).then(Object.fromEntries)
  return iconImagesPromise
}

// Custom Leaflet layer: one <canvas>, all marks drawn via drawImage()
const SeamarkCanvasLayer = L.Layer.extend({
  initialize: function(features, images, onClickRef) {
    this._features  = features
    this._images    = images
    this._clickRef  = onClickRef
    this._positions = []  // container-coord positions for hit testing
    this._rafId     = null
  },

  onAdd: function(map) {
    this._map = map
    const canvas = document.createElement("canvas")
    canvas.style.cssText = "position:absolute;left:0;top:0;pointer-events:none"
    this._canvas = canvas
    map.getPanes().overlayPane.appendChild(canvas)

    this._drawBound  = this._draw.bind(this)
    this._moveBound  = this._scheduleDraw.bind(this)
    this._clickBound = this._onClick.bind(this)

    map.on("viewreset zoomend moveend", this._drawBound)
    map.on("move", this._moveBound)
    map.on("click", this._clickBound)
    this._draw()
  },

  onRemove: function(map) {
    map.off("viewreset zoomend moveend", this._drawBound)
    map.off("move", this._moveBound)
    map.off("click", this._clickBound)
    if (this._rafId) cancelAnimationFrame(this._rafId)
    this._canvas.remove()
  },

  _scheduleDraw: function() {
    if (this._rafId) return
    this._rafId = requestAnimationFrame(() => { this._rafId = null; this._draw() })
  },

  _draw: function() {
    const map    = this._map
    const size   = map.getSize()
    const topLeft = map.containerPointToLayerPoint([0, 0])

    L.DomUtil.setPosition(this._canvas, topLeft)
    this._canvas.width  = size.x
    this._canvas.height = size.y

    const ctx = this._canvas.getContext("2d")
    const S   = ICON_SIZE
    this._positions = []

    for (const f of this._features) {
      const [lon, lat] = f.geometry.coordinates
      const cPt = map.latLngToContainerPoint([lat, lon])        // for hit-test
      const lPt = map.latLngToLayerPoint([lat, lon])             // for canvas draw
      const x   = lPt.x - topLeft.x
      const y   = lPt.y - topLeft.y

      const img = this._images[getIconKey(f.properties)]
      if (img) ctx.drawImage(img, x - S / 2, y - S, S, S)

      this._positions.push({ cx: cPt.x, cy: cPt.y, feature: f })
    }
  },

  _onClick: function(e) {
    const { x, y } = e.containerPoint
    const S = ICON_SIZE
    for (const { cx, cy, feature } of this._positions) {
      if (Math.abs(x - cx) <= S && Math.abs(y - cy) <= S) {
        this._clickRef.current?.({
          properties: feature.properties,
          latlng: [feature.geometry.coordinates[1], feature.geometry.coordinates[0]],
        })
        return
      }
    }
  },
})

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

    const run = async () => {
      // Load geojson + all icon images in parallel; images are cached after first load
      const [data, images] = await Promise.all([
        geojsonCache
          ? Promise.resolve(geojsonCache)
          : fetch(solentDataUrl).then(r => r.json()).then(d => { geojsonCache = d; return d }),
        loadIconImages(),
      ])

      if (cancelled) return

      const renderer = L.canvas({ padding: 0.2 })
      const features = data.features

      // --- Land polygons ---
      addedLayers.push(L.geoJSON(
        features.filter(f =>
          f.properties.natural === "coastline" ||
          (f.properties.natural === "water" && f.geometry.type === "Polygon" && f.geometry.coordinates.length > 1)
        ),
        { renderer, interactive: false, style: () => ({ fillColor: MAP_COLORS.mapBackground, fillOpacity: 1, color: MAP_COLORS.landStroke, weight: 0.4 }) }
      ).addTo(map))

      // --- Water / Solent (straits always included regardless of ring count) ---
      addedLayers.push(L.geoJSON(
        features.filter(f => {
          const p = f.properties
          if (p.natural === "strait") return true
          return (p.natural === "water" || p.natural === "bay" || p.place === "sea") &&
            !(f.geometry.type === "Polygon" && f.geometry.coordinates.length > 1)
        }),
        { renderer, interactive: false, style: () => ({ fillColor: MAP_COLORS.solentFill, fillOpacity: 1, color: MAP_COLORS.solentStroke, weight: 0.4 }) }
      ).addTo(map))

      // --- Coastlines + depth contours ---
      addedLayers.push(L.geoJSON(
        features.filter(f => f.properties.natural === "coastline" || f.properties["seamark:type"] === "depth_contour"),
        { renderer, interactive: false, style: f => {
          const isDepth = f.properties["seamark:type"] === "depth_contour"
          return { fill: false, color: isDepth ? MAP_COLORS.depthContour : MAP_COLORS.coastline, weight: isDepth ? 1 : 2 }
        }}
      ).addTo(map))

      // --- Seamarks: single canvas layer, images drawn via drawImage() ---
      const seamarkFeatures = features.filter(f =>
        f.geometry?.type === "Point" && POINT_SEAMARK_TYPES.has(f.properties["seamark:type"])
      )
      addedLayers.push(new SeamarkCanvasLayer(seamarkFeatures, images, onMarkClickRef).addTo(map))
    }

    run()

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
