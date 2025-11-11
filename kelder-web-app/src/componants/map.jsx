import { ComposableMap, Geographies, Geography, Graticule, Marker } from "react-simple-maps"
import solentDataUrl from "../assets/marks,water,land.geojson?url"

const MAP_COLORS = {
  cardBackgroundTint: "rgba(2, 48, 89, 0.1)",
  mapBackground: "#f0e9c2",
  landStroke: "#c2b28f",
  solentFill: "#1e6fa8",
  solentStroke: "#0c4b75",
  graticule: "#000000",
  coastline: "#f0f4ff",
  depthContour: "#88b7d0",
  defaultMarkerFill: "#ffcc00",
  defaultMarkerStroke: "#000000",
  markerHighlightStroke: "#ffffff",
  portMarkerFill: "#a82a1e",
  starboardMarkerFill: "#0d6e32",
  cardinalMarkerFill: "#d6a400",
  specialPurposeFill: "#ffd000",
  lightFill: "#ffffff",
  lightStroke: "#f1fa8c",
  harbourFill: "#4da6ff",
  harbourStroke: "#003f88",
  anchorageStroke: "#f0e9c2",
  landmarkFill: "#b5651d",
  landmarkStroke: "#4a2e05",
}

export const SolentChart = () => {
  return (
    <div
      className="rounded-xl p-3 text-slate-800 dark:bg-slate-800/90 dark:text-white mb-3"
      style={{ backgroundColor: MAP_COLORS.cardBackgroundTint }}
    >
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          center: [-1.30, 50.8], // Solent / Southampton Water region
          scale: 90000,
        }}
        style={{
          background: MAP_COLORS.mapBackground, // deep ocean tone
          borderRadius: "0.75rem",
          width: "100%",
          height: "50vh",
        }}
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
      </ComposableMap>
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
