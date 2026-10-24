import { useEffect, useRef, memo, useState, useMemo, useCallback } from "react"
import { MapContainer, useMap, useMapEvents } from "react-leaflet"
import L from "leaflet"
import axios from "axios"
import { useAuth } from "@clerk/clerk-react"
import "leaflet/dist/leaflet.css"
import solentDataUrl from "../assets/marks,water,land.geojson?url"
import { useSensorData, useRefreshPassagePlan } from "../context/SensorDataContext"
import { apiUrl } from "../config/api"

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
  route:          "rgb(204, 58, 30)",          // ECDIS-style planned-route red-orange
  routeHalo:      "rgba(255, 255, 255, 0.7)",  // casing so the line reads on water and land
  track:          "rgb(0, 0, 0)",              // past track: black, like ECDIS own-ship history
}

// Receives { course_to_steer: Waypoint[] } and replaces the plan's waypoints
const WAYPOINTS_PATH = "/passage_plan/waypoints"

const MAP_CENTER = [50.8, -1.30]  // Leaflet uses [lat, lon]
const DEFAULT_ZOOM = 12
const MIN_ZOOM = 10
const MAX_ZOOM = 17
const TRACK_POINT_LIMIT = 500          // drawn points; longer tracks are downsampled
const TRACK_FADE_SEGMENTS = 8          // older track fades towards this many steps
const TRACK_MIN_STEP_NM = 0.003        // ~5 m: ignore GPS jitter when summing distance
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

// Waypoints are stored as absolute lat/lon with hemisphere strings (N/S/E/W)
const waypointToLatLng = (wp) => [
  wp.latitude_hemisphere  === "S" ? -Math.abs(wp.latitude)  : Math.abs(wp.latitude),
  wp.longitude_hemisphere === "W" ? -Math.abs(wp.longitude) : Math.abs(wp.longitude),
]

const latLngToWaypoint = ([lat, lon], name = null) => ({
  name,
  latitude: Math.abs(lat),
  latitude_hemisphere: lat < 0 ? "S" : "N",
  longitude: Math.abs(lon),
  longitude_hemisphere: lon < 0 ? "W" : "E",
})

const formatLatLng = ([lat, lon]) =>
  `${Math.abs(lat).toFixed(4)}° ${lat < 0 ? "S" : "N"}, ${Math.abs(lon).toFixed(4)}° ${lon < 0 ? "W" : "E"}`

// Great-circle initial bearing (°T) and haversine distance (nm) for one leg
const EARTH_RADIUS_NM = 3440.065
const toRad = (d) => (d * Math.PI) / 180
const legBearingDistance = ([lat1, lon1], [lat2, lon2]) => {
  const φ1 = toRad(lat1), φ2 = toRad(lat2), Δλ = toRad(lon2 - lon1)
  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
  const bearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360
  const a = Math.sin((φ2 - φ1) / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  const distance = 2 * EARTH_RADIUS_NM * Math.asin(Math.sqrt(a))
  return { bearing, distance }
}

const formatLeg = ({ bearing, distance }) =>
  `${String(Math.round(bearing) % 360).padStart(3, "0")}°T  ${distance.toFixed(1)} nm`

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
const SNAP_RADIUS_PX = 12 // while plotting, only snap to a mark when clicking almost on it

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
  initialize: function(features, images) {
    this._features  = features
    this._images    = images
    this._positions = []  // container-coord positions for hit testing
    this._rafId     = null
  },

  onAdd: function(map) {
    this._map = map
    // Own pane above the water but below routes, track and markers, so waypoints
    // and the vessel draw on top of mark icons. _draw re-anchors the canvas to the
    // container's top-left, so canvas pixel coords == container coords.
    if (!map.getPane("seamarkPane")) map.createPane("seamarkPane").style.zIndex = 430
    const canvas = document.createElement("canvas")
    canvas.style.cssText = "position:absolute;left:0;top:0;pointer-events:none"
    this._canvas = canvas
    map.getPane("seamarkPane").appendChild(canvas)

    this._drawBound = this._draw.bind(this)
    this._moveBound = this._scheduleDraw.bind(this)

    map.on("viewreset zoomend moveend", this._drawBound)
    map.on("move", this._moveBound)
    this._draw()
  },

  onRemove: function(map) {
    map.off("viewreset zoomend moveend", this._drawBound)
    map.off("move", this._moveBound)
    if (this._rafId) cancelAnimationFrame(this._rafId)
    this._canvas.remove()
  },

  _scheduleDraw: function() {
    if (this._rafId) return
    this._rafId = requestAnimationFrame(() => { this._rafId = null; this._draw() })
  },

  _draw: function() {
    const map  = this._map
    const size = map.getSize()

    // Pane moves with the map; pin the canvas back to container 0,0 before drawing
    L.DomUtil.setPosition(this._canvas, map.containerPointToLayerPoint([0, 0]))
    this._canvas.width  = size.x
    this._canvas.height = size.y

    const ctx = this._canvas.getContext("2d")
    const S   = ICON_SIZE
    this._positions = []

    for (const f of this._features) {
      const [lon, lat] = f.geometry.coordinates
      const pt = map.latLngToContainerPoint([lat, lon])

      const img = this._images[getIconKey(f.properties)]
      if (img) ctx.drawImage(img, pt.x - S / 2, pt.y - S / 2, S, S)

      this._positions.push({ cx: pt.x, cy: pt.y, feature: f })
    }
  },

  // Returns the mark within `radius` px of a container point, or null. Click handling lives in MapClickHandler.
  hitTest: function({ x, y }, radius = ICON_SIZE) {
    for (const { cx, cy, feature } of this._positions) {
      if (Math.abs(x - cx) <= radius && Math.abs(y - cy) <= radius) {
        return {
          properties: feature.properties,
          latlng: [feature.geometry.coordinates[1], feature.geometry.coordinates[0]],
        }
      }
    }
    return null
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

const getMarkName = (p) => p["seamark:name"] || p["name"] || null

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
  const name    = getMarkName(p) ?? "Unknown Mark"
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

const createVesselIcon = (rotation, scale = 2) => {
  const size = 20 * scale
  const half = size / 2
  return L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="-10 -10 20 20">
      <polygon points="0,-8 7,6 0,1 -7,6"
        fill="rgb(230, 0, 255)" stroke="rgba(0,0,0,1)" stroke-width="${1 / scale}"
        transform="rotate(${rotation})"/>
    </svg>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [half, half],
  })
}
// ─── Module-level GeoJSON cache ───────────────────────────────────────────────
// Parsed once; survives hot-reloads and multiple component mounts.
let geojsonCache = null

// ─── Static base layer ────────────────────────────────────────────────────────
// Rendered once on mount, never re-renders.
const SolentBaseLayer = memo(function SolentBaseLayer({ seamarkLayerRef }) {
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
      seamarkLayerRef.current = new SeamarkCanvasLayer(seamarkFeatures, images).addTo(map)
      addedLayers.push(seamarkLayerRef.current)
    }

    run()

    return () => {
      cancelled = true
      addedLayers.forEach((l) => map.removeLayer(l))
      seamarkLayerRef.current = null
    }
  }, [map, seamarkLayerRef])  // runs once – map and ref are stable

  return null
})

// ─── Dynamic vessel layer ─────────────────────────────────────────────────────
// GPS marker is updated imperatively via Leaflet API.
// No React state changes during animation → zero extra React renders.
const VesselLayer = memo(function VesselLayer({ gpsData }) {
  const map = useMap()
  const markerRef     = useRef(null)
  const animFrameRef  = useRef(null)
  const currentLLRef  = useRef(null)   // [lat, lon] of marker as it animates
  const isFirstRef    = useRef(true)

  // Initialise vessel marker once
  useEffect(() => {
    markerRef.current = L.marker(MAP_CENTER, {
      icon: createVesselIcon(0),
      zIndexOffset: 1000,
      opacity: 0,           // hidden until first valid GPS fix
      interactive: false,
    }).addTo(map)

    return () => {
      if (markerRef.current) map.removeLayer(markerRef.current)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [map])

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

// ─── Track helpers ────────────────────────────────────────────────────────────

// Track arrives as [{ timestamp, latitude, longitude }]; returns [{ ll, time }]
const parseTrack = (raw) => (Array.isArray(raw) ? raw : [])
  .map(({ latitude, longitude, timestamp }) => ({
    ll: [Number(latitude), Number(longitude)],
    time: timestamp ? new Date(timestamp) : null,
  }))
  .filter(({ ll: [lat, lon] }) => Number.isFinite(lat) && Number.isFinite(lon))

// The track only ever grows, so length + last timestamp identifies it without a deep compare
const trackKey = (raw) => Array.isArray(raw) ? `${raw.length}:${raw[raw.length - 1]?.timestamp}` : ""
const sameTrack = (prev, next) => trackKey(prev.track) === trackKey(next.track)

const downsample = (points, limit) => {
  if (points.length <= limit) return points
  const step = Math.ceil(points.length / limit)
  const out = points.filter((_, i) => i % step === 0)
  if (out[out.length - 1] !== points[points.length - 1]) out.push(points[points.length - 1])
  return out
}

const trackStats = (points) => {
  let distance = 0
  let last = points[0]?.ll
  for (let i = 1; i < points.length; i++) {
    const d = legBearingDistance(last, points[i].ll).distance
    if (d >= TRACK_MIN_STEP_NM) { distance += d; last = points[i].ll }
  }
  const start = points[0]?.time
  const end   = points[points.length - 1]?.time
  const hours = start && end ? (end - start) / 3_600_000 : 0
  return { distance, hours, speed: hours > 0 ? distance / hours : null }
}

// Fix-mark spacing scales with journey length so a long passage isn't wall-to-wall labels
const fixIntervalMinutes = (hours) => (hours <= 1.5 ? 15 : hours <= 4 ? 30 : 60)

const formatChartTime = (date) =>
  `${String(date.getHours()).padStart(2, "0")}${String(date.getMinutes()).padStart(2, "0")}`

const formatDuration = (hours) => {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return h ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`
}

// ─── Route layer ──────────────────────────────────────────────────────────────
// Draws a route chart-style: cased line, open-circle waypoints, a direction
// arrowhead and "course°T distance" label on each leg. Used for both the saved
// passage plan (solid) and the route being plotted (dashed). Rebuilt whenever
// latLngs changes; labels hide on legs too short to fit them at the current zoom.

const LEG_LABEL_MIN_PX = 120
const LEG_ARROW_MIN_PX = 28

const createLegArrowIcon = (angle) => L.divIcon({
  html: `<svg width="12" height="12" viewBox="0 0 12 12" style="position:absolute;transform-origin:0 0;
    transform:rotate(${angle}deg) translate(-6px,-6px);overflow:visible">
    <path d="M2 1.5L9 6L2 10.5" fill="none" stroke="${MAP_COLORS.routeHalo}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M2 1.5L9 6L2 10.5" fill="none" stroke="${MAP_COLORS.route}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  className: "",
  iconSize: [0, 0],
})

const createLegLabelIcon = (text, angle) => {
  // Keep text upright: flip labels on legs heading leftwards on screen
  const textAngle = angle > 90 || angle < -90 ? angle + 180 : angle
  return L.divIcon({
    html: `<div style="position:absolute;transform-origin:0 0;white-space:nowrap;
      transform:rotate(${textAngle}deg) translate(0,-11px) translate(-50%,-50%);
      color:${MAP_COLORS.route};font:600 11px/1 ui-sans-serif,system-ui,sans-serif;letter-spacing:0.02em;
      text-shadow:0 0 2px white,0 0 2px white,0 0 3px white">${text}</div>`,
    className: "",
    iconSize: [0, 0],
  })
}

// Saved-route waypoint: white disc, route-colour ring and number (draft markers are solid)
const createRouteWaypointIcon = (n) => L.divIcon({
  html: `<div style="width:18px;height:18px;border-radius:50%;background:white;
    border:2px solid ${MAP_COLORS.route};box-shadow:0 1px 2px rgba(0,0,0,0.3);color:${MAP_COLORS.route};
    font:700 10px/14px ui-sans-serif,system-ui,sans-serif;text-align:center">${n}</div>`,
  className: "",
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

const RouteLayer = memo(function RouteLayer({ latLngs, names, dashed = false, showWaypoints = true }) {
  const map = useMap()

  useEffect(() => {
    if (!map.getPane("routePane")) map.createPane("routePane").style.zIndex = 440  // below the track
    const group = L.layerGroup().addTo(map)
    if (latLngs.length === 0) return () => map.removeLayer(group)

    const lineOpts = { pane: "routePane", interactive: false, lineCap: "round", lineJoin: "round" }
    L.polyline(latLngs, { ...lineOpts, color: MAP_COLORS.routeHalo, weight: 6 }).addTo(group)
    L.polyline(latLngs, {
      ...lineOpts,
      color: MAP_COLORS.route,
      weight: 2.5,
      dashArray: dashed ? "8 6" : null,
    }).addTo(group)

    if (showWaypoints) {
      latLngs.forEach((ll, i) => {
        const name = names?.[i]
        const marker = L.marker(ll, {
          icon: createRouteWaypointIcon(i + 1),
          interactive: Boolean(name),  // only needs pointer events to show its tooltip
          keyboard: false,
          zIndexOffset: 500,
        })
        if (name) marker.bindTooltip(name, { direction: "top", offset: [0, -9] })
        marker.addTo(group)
      })
    }

    // Web Mercator is conformal, so the on-screen leg angle is zoom-independent
    const legs = latLngs.slice(1).map((to, i) => {
      const from = latLngs[i]
      const p1 = map.latLngToLayerPoint(from)
      const p2 = map.latLngToLayerPoint(to)
      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI
      const mid = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2]
      const markerOpts = { interactive: false, keyboard: false }
      return {
        from, to,
        arrow: L.marker(mid, { ...markerOpts, icon: createLegArrowIcon(angle) }).addTo(group),
        label: L.marker(mid, { ...markerOpts, icon: createLegLabelIcon(formatLeg(legBearingDistance(from, to)), angle) }).addTo(group),
      }
    })

    const updateVisibility = () => {
      for (const { from, to, arrow, label } of legs) {
        const px = map.latLngToContainerPoint(from).distanceTo(map.latLngToContainerPoint(to))
        arrow.getElement().style.display = px >= LEG_ARROW_MIN_PX ? "" : "none"
        label.getElement().style.display = px >= LEG_LABEL_MIN_PX ? "" : "none"
      }
    }
    updateVisibility()
    map.on("zoomend", updateVisibility)

    return () => {
      map.off("zoomend", updateVisibility)
      map.removeLayer(group)
    }
  }, [map, latLngs, names, dashed, showWaypoints])

  return null
})

// ─── Track layer ──────────────────────────────────────────────────────────────
// Past track chart-style: dark cased line fading towards its start, timed fix
// marks ("1030") at regular intervals, and double arrowheads (the ground-track
// convention) between fixes. Labels/arrows hide when crowded at the current zoom.

const TRACK_LABEL_MIN_PX = 44
const TRACK_ARROW_MIN_PX = 70

const createTrackArrowIcon = (angle) => L.divIcon({
  html: `<svg width="16" height="12" viewBox="0 0 16 12" style="position:absolute;transform-origin:0 0;
    transform:rotate(${angle}deg) translate(-8px,-6px);overflow:visible">
    <path d="M2 1.5L7 6L2 10.5M8 1.5L13 6L8 10.5" fill="none" stroke="${MAP_COLORS.routeHalo}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M2 1.5L7 6L2 10.5M8 1.5L13 6L8 10.5" fill="none" stroke="${MAP_COLORS.track}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  className: "",
  iconSize: [0, 0],
})

const createFixLabelIcon = (text) => L.divIcon({
  html: `<div style="position:absolute;transform:translate(7px,-50%);white-space:nowrap;
    color:${MAP_COLORS.track};font:600 10px/1 ui-monospace,monospace;
    text-shadow:0 0 2px white,0 0 2px white,0 0 3px white">${text}</div>`,
  className: "",
  iconSize: [0, 0],
})

const TrackLayer = memo(function TrackLayer({ track }) {
  const map = useMap()

  useEffect(() => {
    if (!map.getPane("trackPane")) map.createPane("trackPane").style.zIndex = 450
    const renderer = L.canvas({ pane: "trackPane" })
    const group = L.layerGroup().addTo(map)

    const all = parseTrack(track)
    const points = downsample(all, TRACK_POINT_LIMIT)
    if (points.length < 2) return () => map.removeLayer(group)

    const lineOpts = { renderer, pane: "trackPane", interactive: false, lineCap: "round", lineJoin: "round" }
    const latLngs = points.map((p) => p.ll)
    L.polyline(latLngs, { ...lineOpts, color: MAP_COLORS.routeHalo, weight: 5, opacity: 0.6 }).addTo(group)

    // Fade: split into chunks sharing endpoints, oldest most transparent
    const chunk = Math.ceil(latLngs.length / TRACK_FADE_SEGMENTS)
    for (let i = 0; i < TRACK_FADE_SEGMENTS; i++) {
      const seg = latLngs.slice(i * chunk, (i + 1) * chunk + 1)
      if (seg.length < 2) break
      L.polyline(seg, {
        ...lineOpts,
        color: MAP_COLORS.track,
        weight: 2.5,
        opacity: 0.6 + 0.4 * (i / (TRACK_FADE_SEGMENTS - 1)),
      }).addTo(group)
    }

    // Timed fixes: departure, then the first point on or after each interval boundary
    const { hours } = trackStats([all[0], all[all.length - 1]])
    const intervalMs = fixIntervalMinutes(hours) * 60_000
    const fixIdx = []
    let nextBoundary = null
    points.forEach((p, i) => {
      if (!p.time) return
      if (nextBoundary === null) {
        fixIdx.push(i)
        nextBoundary = Math.floor(p.time / intervalMs) * intervalMs + intervalMs
      } else if (p.time >= nextBoundary) {
        fixIdx.push(i)
        nextBoundary = Math.floor(p.time / intervalMs) * intervalMs + intervalMs
      }
    })

    const fixes = fixIdx.map((i) => {
      L.circleMarker(points[i].ll, {
        renderer, pane: "trackPane", interactive: false,
        radius: 3.5, weight: 1.5, color: MAP_COLORS.track, fillColor: "white", fillOpacity: 1,
      }).addTo(group)
      return {
        ll: points[i].ll,
        label: L.marker(points[i].ll, {
          interactive: false, keyboard: false, icon: createFixLabelIcon(formatChartTime(points[i].time)),
        }).addTo(group),
      }
    })

    // Double arrowhead midway between consecutive fixes, aligned to the local track direction
    const arrows = fixIdx.slice(1).map((end, k) => {
      const start = fixIdx[k]
      const mid = Math.floor((start + end) / 2)
      const a = map.latLngToLayerPoint(points[Math.max(start, mid - 1)].ll)
      const b = map.latLngToLayerPoint(points[Math.min(end, mid + 1)].ll)
      const angle = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI
      return {
        from: points[start].ll,
        to: points[end].ll,
        marker: L.marker(points[mid].ll, { interactive: false, keyboard: false, icon: createTrackArrowIcon(angle) }).addTo(group),
      }
    })

    const updateVisibility = () => {
      let lastShown = null
      for (const { ll, label } of fixes) {
        const pt = map.latLngToContainerPoint(ll)
        const show = !lastShown || pt.distanceTo(lastShown) >= TRACK_LABEL_MIN_PX
        label.getElement().style.display = show ? "" : "none"
        if (show) lastShown = pt
      }
      for (const { from, to, marker } of arrows) {
        const px = map.latLngToContainerPoint(from).distanceTo(map.latLngToContainerPoint(to))
        marker.getElement().style.display = px >= TRACK_ARROW_MIN_PX ? "" : "none"
      }
    }
    updateVisibility()
    map.on("zoomend", updateVisibility)

    return () => {
      map.off("zoomend", updateVisibility)
      map.removeLayer(group)
    }
  }, [map, track])

  return null
}, sameTrack)

// ─── Journey stats ────────────────────────────────────────────────────────────

const JourneyStats = memo(function JourneyStats({ track }) {
  const stats = useMemo(() => trackStats(parseTrack(track)), [track])
  if (!stats.distance) return null

  return (
    <div className="absolute bottom-4 right-4 z-[1000] rounded-xl border border-slate-200/60 bg-white/96 px-3 py-2 text-slate-900 shadow-xl dark:border-slate-700/60 dark:bg-slate-900/96 dark:text-white">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Journey</p>
      <div className="mt-0.5 flex items-baseline gap-3 tabular-nums">
        <span className="text-lg font-semibold leading-none">
          {stats.distance.toFixed(1)}<span className="ml-0.5 text-xs font-medium text-slate-400 dark:text-slate-500">nm</span>
        </span>
        {stats.hours > 0 && <span className="text-xs text-slate-500 dark:text-slate-400">{formatDuration(stats.hours)}</span>}
        {stats.speed != null && <span className="text-xs text-slate-500 dark:text-slate-400">{stats.speed.toFixed(1)} kn avg</span>}
      </div>
    </div>
  )
}, sameTrack)

// ─── Map click handler ────────────────────────────────────────────────────────
// Single click listener for the map: hit-tests seamarks first, then hands the
// mark (or null) and the clicked position to the latest callback.
const MapClickHandler = ({ seamarkLayerRef, onClickRef, plotting }) => {
  const map = useMapEvents({
    click(e) {
      const radius = plotting ? SNAP_RADIUS_PX : ICON_SIZE
      const mark = seamarkLayerRef.current?.hitTest(e.containerPoint, radius) ?? null
      onClickRef.current?.(mark, [e.latlng.lat, e.latlng.lng])
    },
  })

  // While plotting: disable double-click zoom (it would add two waypoints and zoom) and swap
  // the native cursor for a drawn cross with a live lat/lon readout, moved imperatively.
  useEffect(() => {
    if (!plotting) return
    const container = map.getContainer()

    const cursor = document.createElement("div")
    cursor.style.cssText = "position:absolute;left:0;top:0;pointer-events:none;z-index:1002;display:none"
    cursor.innerHTML = `
      <svg width="28" height="28" viewBox="-14 -14 28 28" style="position:absolute;left:-14px;top:-14px;overflow:visible">
        <path d="M-12 0H-3M3 0H12M0 -12V-3M0 3V12" stroke="white" stroke-width="4" stroke-linecap="round"/>
        <path d="M-12 0H-3M3 0H12M0 -12V-3M0 3V12" stroke="rgb(15,23,42)" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      <div style="position:absolute;left:0;top:-18px;transform:translate(-50%,-100%);white-space:nowrap;
        padding:2px 6px;border-radius:4px;background:rgba(15,23,42,0.85);color:white;
        font:500 11px/1.4 ui-monospace,monospace"></div>`
    const label = cursor.lastElementChild
    container.appendChild(cursor)

    const onMove = (e) => {
      const { x, y } = e.containerPoint
      cursor.style.display = "block"
      cursor.style.transform = `translate(${x}px, ${y}px)`
      label.textContent = formatLatLng([e.latlng.lat, e.latlng.lng])
    }
    const onOut = () => { cursor.style.display = "none" }

    map.doubleClickZoom.disable()
    container.style.cursor = "none"
    map.on("mousemove", onMove)
    map.on("mouseout", onOut)
    return () => {
      map.off("mousemove", onMove)
      map.off("mouseout", onOut)
      map.doubleClickZoom.enable()
      container.style.cursor = ""
      cursor.remove()
    }
  }, [map, plotting])

  return null
}

// ─── Draft route markers ──────────────────────────────────────────────────────
// Numbered, draggable markers for the route being plotted (the line itself is a
// dashed RouteLayer). Drag to move, right-click (long-press on touch) to remove.

const createWaypointIcon = (n) => L.divIcon({
  html: `<div style="width:22px;height:22px;border-radius:50%;background:${MAP_COLORS.route};
    border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.4);color:white;font:600 11px/18px sans-serif;
    text-align:center">${n}</div>`,
  className: "",
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

const DraftRouteLayer = memo(function DraftRouteLayer({ waypoints, onMove, onRemove }) {
  const map = useMap()
  const polylineRef = useRef(null)
  const markersRef  = useRef([])
  const onMoveRef   = useRef(onMove)
  const onRemoveRef = useRef(onRemove)
  onMoveRef.current   = onMove
  onRemoveRef.current = onRemove

  useEffect(() => {
    // Rubber-band preview of the legs either side of a waypoint while it's dragged
    polylineRef.current = L.polyline([], {
      color: MAP_COLORS.route,
      weight: 1.5,
      opacity: 0.8,
      dashArray: "2 4",
      interactive: false,
    }).addTo(map)

    return () => {
      if (polylineRef.current) map.removeLayer(polylineRef.current)
      markersRef.current.forEach((m) => map.removeLayer(m))
      markersRef.current = []
    }
  }, [map])

  useEffect(() => {
    const latLngs = waypoints.map(waypointToLatLng)

    markersRef.current.forEach((m) => map.removeLayer(m))
    markersRef.current = latLngs.map((ll, i) => {
      const marker = L.marker(ll, { icon: createWaypointIcon(i + 1), draggable: true, zIndexOffset: 2000 })
      if (waypoints[i].name) marker.bindTooltip(waypoints[i].name, { direction: "top", offset: [0, -10] })
      marker.on("drag", (e) => {
        const live = [latLngs[i - 1], [e.latlng.lat, e.latlng.lng], latLngs[i + 1]].filter(Boolean)
        polylineRef.current?.setLatLngs(live)
      })
      marker.on("dragend", (e) => {
        polylineRef.current?.setLatLngs([])
        const { lat, lng } = e.target.getLatLng()
        onMoveRef.current?.(i, [lat, lng])
      })
      marker.on("contextmenu", () => onRemoveRef.current?.(i))
      return marker.addTo(map)
    })
  }, [map, waypoints])

  return null
})

// ─── Route plotting controls ──────────────────────────────────────────────────

const controlButton =
  "rounded-md px-2.5 py-1 text-xs font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"

function PlotControls({ plotting, count, latest, saving, error, onStart, onUndo, onClear, onCancel, onSave }) {
  if (!plotting) {
    return (
      <button
        type="button"
        onClick={onStart}
        className="absolute left-4 top-4 z-[1001] rounded-lg bg-white/90 px-3 py-2 text-sm font-semibold text-slate-800 shadow transition hover:bg-white"
      >
        Plot route
      </button>
    )
  }

  return (
    <div className="absolute left-4 top-4 z-[1001] max-w-[260px] rounded-xl border border-slate-200/60 bg-white/96 p-3 text-slate-900 shadow-xl dark:border-slate-700/60 dark:bg-slate-900/96 dark:text-white">
      <p className="text-sm font-semibold">
        {count} waypoint{count === 1 ? "" : "s"}
      </p>
      <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
        {latest
          ? `Last: ${latest.name ?? formatLatLng(waypointToLatLng(latest))}`
          : "Click the map to add a waypoint"}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <button type="button" onClick={onUndo} disabled={!count || saving}
          className={`${controlButton} bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600`}>
          Undo
        </button>
        <button type="button" onClick={onClear} disabled={!count || saving}
          className={`${controlButton} bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600`}>
          Clear
        </button>
        <button type="button" onClick={onCancel} disabled={saving}
          className={`${controlButton} bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600`}>
          Cancel
        </button>
        <button type="button" onClick={onSave} disabled={!count || saving}
          className={`${controlButton} bg-orange-500 text-white hover:bg-orange-600`}>
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ─── Resize sync ──────────────────────────────────────────────────────────────
// Leaflet caches its container size at mount. The card stretches with its grid
// row (which changes as neighbouring panels load), so re-measure on every resize
// or the canvases stop short of the container edges.
const MapResizeSync = () => {
  const map = useMap()
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize({ pan: false }))
    observer.observe(map.getContainer())
    return () => observer.disconnect()
  }, [map])
  return null
}

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
  const gpsData        = useSensorData("gpsPosition")
  const passagePlanData = useSensorData("passagePlan")
  const refreshPassagePlan = useRefreshPassagePlan()
  const [selectedMark, setSelectedMark] = useState(null)

  // Route plotting: draft holds Waypoint objects in the backend's shape
  // Plotting is Clerk-gated; signing out mid-plot drops back to view mode
  const { isSignedIn, getToken } = useAuth()
  const [plotRequested, setPlotting] = useState(false)
  const plotting = plotRequested && Boolean(isSignedIn)
  const [draft, setDraft]         = useState([])
  const [saving, setSaving]       = useState(false)
  const [saveError, setSaveError] = useState(null)

  const seamarkLayerRef = useRef(null)

  // Ref so the click handler always sees the latest state without re-registering
  const onMapClickRef = useRef(null)
  onMapClickRef.current = (mark, latlng) => {
    if (!plotting) {
      if (mark) setSelectedMark(mark)
      return
    }
    const waypoint = mark
      ? latLngToWaypoint(mark.latlng, getMarkName(mark.properties))
      : latLngToWaypoint(latlng)
    setDraft((d) => [...d, waypoint])
  }

  const startPlotting = () => {
    const existing = passagePlanData?.passage_plan?.course_to_steer
    setDraft(Array.isArray(existing) ? existing.map((wp) => ({ ...wp })) : [])
    setSelectedMark(null)
    setSaveError(null)
    setPlotting(true)
  }

  const moveWaypoint = useCallback((index, latlng) => {
    setDraft((d) => d.map((wp, i) => (i === index ? latLngToWaypoint(latlng, wp.name) : wp)))
  }, [])

  const removeWaypoint = useCallback((index) => {
    setDraft((d) => d.filter((_, i) => i !== index))
  }, [])

  const saveRoute = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      const token = await getToken()
      await axios.post(apiUrl(WAYPOINTS_PATH), { course_to_steer: draft }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      await refreshPassagePlan()
      setPlotting(false)
    } catch (err) {
      setSaveError(err.response?.data?.detail ?? err.message ?? "Failed to save route")
    } finally {
      setSaving(false)
    }
  }

  // Derive signed lat/lon pairs from passage plan waypoints.
  // passagePlan stores absolute lat/lon with hemisphere strings (N/S/E/W).
  // Keyed on the waypoint values so the 10s poll doesn't rebuild an unchanged route.
  const courseKey = JSON.stringify(passagePlanData?.passage_plan?.course_to_steer ?? null)
  const passageRoute = useMemo(() => {
    const parsed = JSON.parse(courseKey)
    if (!Array.isArray(parsed) || parsed.length < 2) return { latLngs: [], names: [] }
    const waypoints = parsed.filter(wp => wp.latitude != null && wp.longitude != null)
    return { latLngs: waypoints.map(waypointToLatLng), names: waypoints.map(wp => wp.name ?? null) }
  }, [courseKey])

  const draftLatLngs = useMemo(() => draft.map(waypointToLatLng), [draft])

  return (
    <div className="flex h-full flex-col rounded-xl p-3 text-slate-800 dark:bg-slate-800/90 bg-[#024887]/10 dark:text-white">
      <div className="relative min-h-[50vh] flex-1">
        <MapContainer
          center={MAP_CENTER}
          zoom={DEFAULT_ZOOM}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          style={{
            background: MAP_COLORS.mapBackground,
            borderRadius: "0.75rem",
            position: "absolute",
            inset: 0,
          }}
          zoomControl={false}
          attributionControl={false}
        >
          <SolentBaseLayer seamarkLayerRef={seamarkLayerRef} />
          <TrackLayer track={gpsData?.track} />
          <VesselLayer gpsData={gpsData} />
          {plotting
            ? <RouteLayer latLngs={draftLatLngs} dashed showWaypoints={false} />
            : <RouteLayer latLngs={passageRoute.latLngs} names={passageRoute.names} />}
          {plotting && <DraftRouteLayer waypoints={draft} onMove={moveWaypoint} onRemove={removeWaypoint} />}
          <MapClickHandler seamarkLayerRef={seamarkLayerRef} onClickRef={onMapClickRef} plotting={plotting} />
          <ZoomControls />
          <MapResizeSync />
        </MapContainer>
        {isSignedIn && <PlotControls
          plotting={plotting}
          count={draft.length}
          latest={draft[draft.length - 1]}
          saving={saving}
          error={saveError}
          onStart={startPlotting}
          onUndo={() => setDraft((d) => d.slice(0, -1))}
          onClear={() => setDraft([])}
          onCancel={() => setPlotting(false)}
          onSave={saveRoute}
        />}
        <MarkInfoPanel mark={selectedMark} onClose={() => setSelectedMark(null)} />
        <JourneyStats track={gpsData?.track} />
      </div>
    </div>
  )
}

export default SolentChart
