import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polyline, Circle, useMap } from "react-leaflet";
import L from "leaflet";

// Fix Leaflet marker paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function AutoFitBounds({ coords }) {
  const map = useMap();

  useEffect(() => {
    if (coords.length > 1) {
      map.fitBounds(L.latLngBounds(coords), { padding: [40, 40] });
    }
  }, [coords, map]);

  return null;
}

export default function PathVisualizer({ path, gpsLocation }) {
  const [slamCoords, setSlamCoords] = useState([]);
  const [center, setCenter] = useState([0, 0]);

  useEffect(() => {
    if (!gpsLocation || path.length < 2) {
      setSlamCoords([]);
      return;
    }

    const originLat = gpsLocation.latitude;
    const originLon = gpsLocation.longitude;

    const metersPerLat = 111320;
    const metersPerLon = 111320 * Math.cos((originLat * Math.PI) / 180);

    const coords = path.map((p) => [
      originLat + p.y / metersPerLat,
      originLon + p.x / metersPerLon,
    ]);

    setSlamCoords(coords);
    setCenter(coords[coords.length - 1]);
  }, [path, gpsLocation]);

  return (
    <div className="rounded-xl bg-zinc-900 border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 bg-zinc-950">
        <p className="text-[11px] uppercase tracking-widest text-zinc-400">
          Trajectory Map
        </p>
        <h3 className="text-base font-semibold text-zinc-100">
          Estimated Path
        </h3>
      </div>

      {/* Map */}
      <div className="h-[360px]">
        {slamCoords.length > 1 ? (
          <MapContainer
            center={center}
            zoom={18}
            className="w-full h-full"
            zoomControl
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="© OpenStreetMap contributors"
            />

            <AutoFitBounds coords={slamCoords} />

            {/* SLAM Trajectory */}
            <Polyline
              positions={slamCoords}
              pathOptions={{
                color: "#7dd3fc", // sky-300
                weight: 3,
                opacity: 0.85,
              }}
            />

            {/* Start Point */}
            <Circle
              center={slamCoords[0]}
              radius={2}
              pathOptions={{
                color: "#e5e7eb", // zinc-200
                fillColor: "#e5e7eb",
                fillOpacity: 1,
              }}
            />

            {/* Current Position */}
            <Circle
              center={slamCoords[slamCoords.length - 1]}
              radius={3}
              pathOptions={{
                color: "#7dd3fc", // sky-300
                fillColor: "#7dd3fc",
                fillOpacity: 1,
              }}
            />

            {/* GPS Reference */}
            {gpsLocation && (
              <Circle
                center={[gpsLocation.latitude, gpsLocation.longitude]}
                radius={gpsLocation.accuracy}
                pathOptions={{
                  color: "#a1a1aa", // zinc-400
                  dashArray: "4 4",
                  fillOpacity: 0.08,
                }}
              />
            )}
          </MapContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-zinc-400 text-sm">
            Waiting for SLAM movement…
          </div>
        )}
      </div>
    </div>
  );
}
