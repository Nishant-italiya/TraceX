import React, { useState } from "react";
import SLAMModule from "./components/SLAMModule";

export default function App() {
  const [view, setView] = useState("home");

  /* ---------------------------- HOME SCREEN ---------------------------- */
  if (view === "home") {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
        <header className="px-8 py-6 border-b border-white/10 bg-zinc-950">
          <h1 className="text-3xl font-semibold tracking-tight">
            Trace<span className="text-sky-300">X</span>
          </h1>

          <p className="text-sm text-zinc-400 mt-1">
            Visual SLAM Research Interface
          </p>
        </header>

        <main className="flex-1 flex items-center justify-center px-6">
          <div
            onClick={() => setView("slam-preview")}
            className="cursor-pointer max-w-xl w-full rounded-2xl p-10
                       bg-zinc-900 border border-white/10
                       hover:border-white/30 hover:bg-zinc-900/80
                       transition"
          >
            <h2 className="text-4xl font-semibold mb-4">Visual SLAM</h2>

            <p className="text-zinc-400 text-sm leading-relaxed max-w-md">
              Camera-based motion estimation and spatial mapping using real-time
              feature tracking and visual odometry.
            </p>

            <p className="mt-8 text-sm text-zinc-200 font-medium">
              View module details →
            </p>
          </div>
        </main>

        <footer className="text-center text-xs text-zinc-500 border-t border-white/10 py-4">
          TraceX © 2025
        </footer>
      </div>
    );
  }

  /* -------------------------- SLAM PREVIEW -------------------------- */
  if (view === "slam-preview") {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 px-8 py-10">
        <button
          onClick={() => setView("home")}
          className="text-sm text-zinc-400 hover:text-zinc-200 mb-10"
        >
          ← Back
        </button>

        <div className="max-w-5xl mx-auto">
          <p className="text-[11px] uppercase tracking-widest text-zinc-400 mb-2">
            Visual SLAM
          </p>

          <h2 className="text-4xl font-semibold mb-4">
            Spatial Localization & Mapping
          </h2>

          <p className="text-zinc-400 max-w-3xl leading-relaxed">
            This Visual SLAM implementation estimates camera motion while
            incrementally building a spatial understanding of the environment
            using live video frames — fully in-browser and sensor-light.
          </p>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mt-14">
            <Feature title="Live Video Processing">
              Environment-facing camera frames are processed continuously for
              motion estimation.
            </Feature>

            <Feature title="Obstacle Awareness">
              Feature density variation and trajectory deviation provide
              obstacle cues.
            </Feature>

            <Feature title="Trajectory Mapping">
              A 2D path is generated from frame-to-frame displacement.
            </Feature>
          </div>

          {/* Tech */}
          <div className="mt-14 p-6 rounded-xl bg-zinc-900 border border-white/10">
            <p className="text-sm text-zinc-400">
              <span className="font-medium text-zinc-200">Core Concepts:</span>{" "}
              Feature detection · Optical flow · Pose estimation · Web camera
              APIs
            </p>
          </div>

          {/* Launch */}
          <button
            onClick={() => setView("slam-live")}
            className="mt-16 px-12 py-4 rounded-lg
                       bg-zinc-100 text-black
                       font-semibold text-lg
                       hover:brightness-50 transition cursor-pointer"
          >
            Launch SLAM Module
          </button>
        </div>
      </div>
    );
  }

  /* --------------------------- SLAM LIVE --------------------------- */
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-zinc-950">
        <button
          onClick={() => setView("slam-preview")}
          className="text-sm text-zinc-400 hover:text-zinc-200"
        >
          ← Exit SLAM
        </button>
        <p className="text-sm text-zinc-400">Visual SLAM · Live Session</p>
      </header>

      <SLAMModule />
    </div>
  );
}

/* ----------------------- Helper Component ----------------------- */
function Feature({ title, children }) {
  return (
    <div className="p-6 rounded-xl bg-zinc-900 border border-white/10">
      <h3 className="font-medium mb-2 text-zinc-200">{title}</h3>
      <p className="text-sm text-zinc-400">{children}</p>
    </div>
  );
}
