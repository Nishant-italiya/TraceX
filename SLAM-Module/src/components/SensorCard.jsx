import React from "react";
export default function SensorCard({ title, dataString }) {
  return (
    <div className="rounded-lg bg-zinc-950 border border-white/10 p-3">
      <p className="text-[11px] uppercase text-zinc-400">{title}</p>
      <p className="text-sm font-mono mt-1 text-cyan-300">{dataString}</p>
    </div>
  );
}
