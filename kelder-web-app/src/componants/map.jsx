import { useState } from "react"
import { ComposableMap, Geographies, Geography, Graticule, Marker, ZoomableGroup } from "react-simple-maps"
import solentDataUrl from "../assets/marks,water,land.geojson?url"

const MAP_COLORS = {
  cardBackgroundTint: "rgba(2, 48, 89, 0.1)",
  mapBackground: "rgb(244, 236, 178)",
  landStroke: "rgb(171, 128, 34)",
  solentFill: "rgb(84, 167, 255)",
  solentStroke: "rgba(12, 75, 117, 1)",
  graticule: "rgba(0, 0, 0, 1)",
  coastline: "rgb(26, 112, 0)",
  depthContour: "rgba(136, 183, 208, 1)",
  defaultMarkerFill: "rgba(255, 204, 0, 1)",
  defaultMarkerStroke: "rgba(0, 0, 0, 1)",
  markerHighlightStroke: "rgba(255, 255, 255, 1)",
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
  landmarkStroke: "rgba(74, 46, 5, 1)",
}

const MAP_CENTER = [-1.30, 50.8]
const MIN_ZOOM = 0.8
const MAX_ZOOM = 8
const ZOOM_STEP = 0.4

export const SolentChart = () => {
  const [viewport, setViewport] = useState({
    center: MAP_CENTER,
    zoom: 1,
  })

  const clampZoom = (value) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value))

  const handleZoomChange = (delta) => {
    setViewport((prev) => ({
      ...prev,
      zoom: clampZoom(prev.zoom + delta),
    }))
  }

  const handleMoveEnd = ({ coordinates, zoom }) => {
    setViewport({
      center: coordinates,
      zoom: clampZoom(zoom),
    })
  }
  const handleWheelCapture = (event) => {
    event.preventDefault()
  }
  return (
    <div
      className="rounded-xl p-3 text-slate-800 dark:bg-slate-800/90 dark:text-white mb-3"
      style={{ backgroundColor: MAP_COLORS.cardBackgroundTint }}
      onWheelCapture={handleWheelCapture}
    >
      <div className="relative">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            center: MAP_CENTER, // Solent / Southampton Water region
            scale: 90000,
          }}
          style={{
            background: MAP_COLORS.mapBackground, // deep ocean tone
            borderRadius: "0.75rem",
            width: "100%",
            height: "50vh",
          }}
        >
          <ZoomableGroup
            center={viewport.center}
            zoom={viewport.zoom}
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
            onMoveEnd={handleMoveEnd}
          >
          {/* Optional grid lines for chart reference */}
          <Graticule stroke={MAP_COLORS.graticule} strokeWidth={0.3} />

          {/* --- LAND polygons --- */}
          <Geographies geography={solentDataUrl}>
          {({ geographies }) =>
              geographies
              // OSM land or water polygons that are "holes" in the sea
              .filter(
                  (geo) =>
                  geo.properties.natural === "land" ||
                  (geo.properties.natural === "water" &&
                      geo.geometry.type === "Polygon" &&
                      geo.geometry.coordinates.length > 1) // rings inside = islands
              )
              .map((geo) => (
                  <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={MAP_COLORS.mapBackground}
                  stroke={MAP_COLORS.landStroke}
                  strokeWidth={0.4}
                  />
              ))
          }
          </Geographies>

          {/* --- THE SOLENT WATER AREA ONLY --- */}
          <Geographies geography={solentDataUrl}>
          {({ geographies }) =>
              geographies
              .filter((geo) => {
                  const p = geo.properties
                  return (
                  p.name === "The Solent" ||
                  p["int_name"] === "Solent" ||
                  p["natural"] === "strait" ||
                  p["wikidata"] === "Q1143832" ||
                  p["wikipedia"]?.includes("The_Solent")
                  )
              })
              .map((geo) => {
                  // --- flip winding if it looks inverted ---
                  if (
                  geo.geometry.type === "Polygon" &&
                  geo.geometry.coordinates?.length
                  ) {
                  geo.geometry.coordinates = geo.geometry.coordinates.map((ring) =>
                      ring.slice().reverse()
                  )
                  }

                  return (
                  <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={MAP_COLORS.solentFill}
                      stroke={MAP_COLORS.solentStroke}
                      strokeWidth={0.4}
                  />
                  )
              })
          }
          </Geographies>
          {/* --- MAIN WATER polygons (sea, bays) --- */}
          <Geographies geography={solentDataUrl}>
          {({ geographies }) =>
              geographies
              .filter(
                  (geo) =>
                  (geo.properties.natural === "water" ||
                      geo.properties.natural === "bay" ||
                      geo.properties.place === "sea"
                  ) &&
                  // exclude polygons that have interior rings (islands)
                  !(geo.geometry.type === "Polygon" && geo.geometry.coordinates.length > 1)
              )
              .map((geo) => {
                  // --- Fix reversed winding so fill stays inside ---
                  if (
                  geo.geometry.type === "Polygon" &&
                  Array.isArray(geo.geometry.coordinates)
                  ) {
                  geo.geometry.coordinates = geo.geometry.coordinates.map((ring) =>
                      ring.slice().reverse()
                  )
                  }
                  if (
                  geo.geometry.type === "MultiPolygon" &&
                  Array.isArray(geo.geometry.coordinates)
                  ) {
                  geo.geometry.coordinates = geo.geometry.coordinates.map((poly) =>
                      poly.map((ring) => ring.slice().reverse())
                  )
                  }

                  return (
                  <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={MAP_COLORS.solentFill}   // blue sea
                      stroke={MAP_COLORS.solentStroke}
                      strokeWidth={0.4}
                  />
                  )
              })
          }
          </Geographies>

          {/* --- COASTLINES, CONTOURS, ETC. --- */}
          <Geographies geography={solentDataUrl}>
          {({ geographies }) =>
              geographies
              .filter(
                  (geo) =>
                  geo.properties.natural === "coastline" ||
                  geo.properties["seamark:type"] === "depth_contour"
              )
              .map((geo) => {
                  const seamarkType = geo.properties["seamark:type"]
                  const stroke =
                  seamarkType === "depth_contour" ? MAP_COLORS.depthContour : MAP_COLORS.coastline
                  const strokeWidth = seamarkType === "depth_contour" ? 10 : 2
                  return (
                  <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="none"
                      stroke={stroke}
                      strokeWidth={strokeWidth}
                  />
                  )
              })
          }
          </Geographies>


          {/* Solent seamarks, etc. */}
          <Geographies geography={solentDataUrl}>
              {({ geographies }) =>
              geographies.map((geo) => {
                  const p = geo.properties
                  const type = p["seamark:type"]
                  const catLateral = p["seamark:buoy_lateral:category"]
                  const catCardinal = p["seamark:buoy_cardinal:category"]
                  const [lon, lat] = geo.geometry.coordinates

                  // render only point-like features
                  if (
                  [
                      "buoy",
                      "beacon",
                      "buoy_lateral",
                      "beacon_lateral",
                      "buoy_cardinal",
                      "beacon_cardinal",
                      "buoy_special_purpose",
                      "beacon_special_purpose",
                      "harbour",
                      "berth",
                      "light_minor",
                      "light_major",
                      "anchorage",
                      "gate",
                      "landmark",
                  ].includes(type)
                  ) {
                  let fill = MAP_COLORS.defaultMarkerFill
                  let stroke = MAP_COLORS.defaultMarkerStroke
                  let r = 3
                  let shape = "circle"

                  // --- Lateral marks ---
                  if (catLateral === "port") {
                      fill = MAP_COLORS.portMarkerFill // red
                      stroke = MAP_COLORS.markerHighlightStroke
                  }
                  if (catLateral === "starboard") {
                      fill = MAP_COLORS.starboardMarkerFill // green
                      stroke = MAP_COLORS.markerHighlightStroke
                  }

                  // --- Cardinal marks ---
                  if (catCardinal) {
                      fill = MAP_COLORS.cardinalMarkerFill
                      stroke = MAP_COLORS.defaultMarkerStroke
                      shape = "diamond"
                  }

                  // --- Special purpose (yellow) ---
                  if (type === "buoy_special_purpose" || type === "beacon_special_purpose") {
                      fill = MAP_COLORS.specialPurposeFill
                      stroke = MAP_COLORS.defaultMarkerStroke
                      shape = "triangle"
                  }

                  // --- Lights ---
                  if (type === "light_minor") {
                      fill = MAP_COLORS.lightFill
                      stroke = MAP_COLORS.lightStroke
                      r = 2
                      shape = "star"
                  }
                  if (type === "light_major") {
                      fill = MAP_COLORS.lightFill
                      stroke = MAP_COLORS.lightStroke
                      r = 3.5
                      shape = "star"
                  }

                  // --- Harbour & berth ---
                  if (type === "harbour" || type === "berth") {
                      fill = MAP_COLORS.harbourFill
                      stroke = MAP_COLORS.harbourStroke
                      r = 3
                      shape = "square"
                  }

                  // --- Anchorage areas ---
                  if (type === "anchorage") {
                      fill = "none"
                      stroke = MAP_COLORS.anchorageStroke
                      shape = "anchor"
                  }

                  // --- Gates & landmarks ---
                  if (type === "gate") {
                      fill = MAP_COLORS.lightFill
                      stroke = MAP_COLORS.defaultMarkerStroke
                      shape = "gate"
                  }
                  if (type === "landmark") {
                      fill = MAP_COLORS.landmarkFill
                      stroke = MAP_COLORS.landmarkStroke
                      shape = "triangle"
                  }

                  // --- Draw marker symbol ---
                  return (
                      <Marker key={geo.rsmKey} coordinates={[lon, lat]}>
                      {shape === "circle" && (
                          <circle r={r} fill={fill} stroke={stroke} strokeWidth={0.8} />
                      )}
                      {shape === "diamond" && (
                          <polygon
                          points="0,-3 3,0 0,3 -3,0"
                          fill={fill}
                          stroke={stroke}
                          strokeWidth={0.6}
                          />
                      )}
                      {shape === "triangle" && (
                          <polygon
                          points="0,-3 3,3 -3,3"
                          fill={fill}
                          stroke={stroke}
                          strokeWidth={0.6}
                          />
                      )}
                      {shape === "square" && (
                          <rect
                          x={-2.5}
                          y={-2.5}
                          width={5}
                          height={5}
                          fill={fill}
                          stroke={stroke}
                          strokeWidth={0.6}
                          />
                      )}
                      {shape === "star" && (
                          <path
                          d="M0,-3 L1,0 L3,0 L1.5,1.5 L2,3 L0,2 L-2,3 L-1.5,1.5 L-3,0 L-1,0 Z"
                          fill={fill}
                          stroke={stroke}
                          strokeWidth={0.5}
                          />
                      )}
                      {shape === "anchor" && (
                          <path
                          d="M0,-2 L0,2 M-2,2 A2,2 0 0,0 2,2"
                          fill="none"
                          stroke={stroke}
                          strokeWidth={0.8}
                          />
                      )}
                      {shape === "gate" && (
                          <path
                          d="M-2,-2 L2,-2 M-2,2 L2,2 M-2,-2 L-2,2 M2,-2 L2,2"
                          fill="none"
                          stroke={stroke}
                          strokeWidth={0.6}
                          />
                      )}
                      </Marker>
                  )
                  }
                  return null
              })
              }
          </Geographies>
          </ZoomableGroup>
        </ComposableMap>
        <div className="absolute right-4 top-4 z-10 flex flex-col overflow-hidden rounded-lg shadow">
          <button
            type="button"
            className="bg-white/90 px-3 py-2 text-lg font-semibold text-slate-800 transition hover:bg-white disabled:opacity-50"
            onClick={() => handleZoomChange(ZOOM_STEP)}
            disabled={viewport.zoom >= MAX_ZOOM}
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            className="bg-white/90 px-3 py-2 text-lg font-semibold text-slate-800 transition hover:bg-white disabled:opacity-50"
            onClick={() => handleZoomChange(-ZOOM_STEP)}
            disabled={viewport.zoom <= MIN_ZOOM}
            aria-label="Zoom out"
          >
            -
          </button>
        </div>
      </div>
    </div>
  )
}

export default SolentChart


{/* --- LAND (everything except the Solent polygon) --- */}
<Geographies geography={solentDataUrl}>
  {({ geographies }) =>
    geographies
      .filter((geo) => {
        const p = geo.properties
        // Anything not marked as the Solent itself is "land"
        return !(
          p.name === "The Solent" ||
          p["int_name"] === "Solent" ||
          p["natural"] === "strait" ||
          p["wikidata"] === "Q1143832" ||
          p["wikipedia"]?.includes("The_Solent")
        )
      })
      .map((geo) => (
        <Geography
          key={geo.rsmKey}
          geography={geo}
          fill={MAP_COLORS.mapBackground} // sand
          stroke={MAP_COLORS.landStroke}
          strokeWidth={0.4}
        />
      ))
  }
</Geographies>

{/* --- THE SOLENT WATER AREA ONLY --- */}
<Geographies geography={solentDataUrl}>
  {({ geographies }) =>
    geographies
      .filter((geo) => {
        const p = geo.properties
        return (
          p.name === "The Solent" ||
          p["int_name"] === "Solent" ||
          p["natural"] === "strait" ||
          p["wikidata"] === "Q1143832" ||
          p["wikipedia"]?.includes("The_Solent")
        )
      })
      .map((geo) => (
        <Geography
          key={geo.rsmKey}
          geography={geo}
          fill={MAP_COLORS.solentFill} // sea blue
          stroke={MAP_COLORS.solentStroke}
          strokeWidth={0.4}
        />
      ))
  }
</Geographies>

{/* --- COASTLINES + DEPTH CONTOURS --- */}
<Geographies geography={solentDataUrl}>
  {({ geographies }) =>
    geographies
      .filter(
        (geo) =>
          geo.properties.natural === "coastline" ||
          geo.properties["seamark:type"] === "depth_contour"
      )
      .map((geo) => {
        const seamarkType = geo.properties["seamark:type"]
        const stroke =
          seamarkType === "depth_contour" ? MAP_COLORS.depthContour : MAP_COLORS.coastline
        const strokeWidth = seamarkType === "depth_contour" ? 0.6 : 0.8
        return (
          <Geography
            key={geo.rsmKey}
            geography={geo}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        )
      })
  }
</Geographies>
