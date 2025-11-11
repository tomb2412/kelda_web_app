import { ComposableMap, Geographies, Geography, Graticule } from "react-simple-maps"
import solentGeoUrl from "../assets/solent.geojson?url"

export const Chart = () => {
  return (
    <div className="rounded-xl p-3 bg-[#023059]/10 text-slate-800 dark:bg-slate-800/90 dark:text-white mb-3">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          center: [-1.3, 50.8], // roughly Southampton Water / Solent
          scale: 35000,
        }}
        style={{
          background: "#012a44", // dark ocean background
          borderRadius: "0.75rem",
          width: "100%",
          height: "60vh",
        }}
      >
        {/* Optional grid lines */}
        <Graticule stroke="#ffffff20" strokeWidth={0.4} />

        {/* Land / Coastline */}
        <Geographies geography={solentGeoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="#f0e9c2" // sand-colored land
                stroke="#c2b28f" // subtle shoreline edge
                strokeWidth={0.5}
              />
            ))
          }
        </Geographies>

        {/* Optional water tint overlay */}
        <rect
          x={-180}
          y={-90}
          width={360}
          height={180}
          fill="url(#waterGradient)"
        />
        <defs>
          <linearGradient id="waterGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#1e6fa8" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#013a63" stopOpacity={0.7} />
          </linearGradient>
        </defs>
      </ComposableMap>
    </div>
  )
}

export default Chart
