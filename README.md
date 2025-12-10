# 🚀 TraceX — Real-Time Dead Reckoning & SLAM Navigation Platform
Mobile Sensors • React Native (Dead Reckoning) • React + Vite (SLAM)

TraceX is a hybrid navigation and mapping system developed as a group project to compare and analyze two major localization techniques: **Dead Reckoning (DR)** and **Visual SLAM**. The platform uses mobile IMU sensors and camera frames to estimate movement, detect obstacles, and visualize real-time trajectories across indoor and outdoor environments. Our goal was to understand drift, accuracy, and sensor limitations by testing both methods inside the DA-IICT campus.

---

## 📋 Table of Contents
- Overview  
- Features  
- Technology Stack  
- Installation  
- Usage  
- Modules  
- Components  
- Architecture  
- API Reference  
- Configuration  
- Contributing  
- License  

---

## 🎯 Overview
TraceX provides two complementary localization techniques, allowing us to compare their strengths in controlled real-world conditions:

### **1️⃣ Dead Reckoning (DR)**
Dead Reckoning estimates the device position by integrating acceleration, rotation, and heading over time.  
It uses:
- **Accelerometer**  
- **Gyroscope**  
- **Magnetometer**  
- **Optional GPS** for reference  

This module provides:
- Real-time displacement tracking  
- Orientation estimation  
- Drift visualization  
- A comparison between *actual path (GPS)* vs *estimated IMU path*  

---

### **2️⃣ Visual SLAM Module**
The Visual SLAM system relies on the device camera and computer vision algorithms.

It uses:
- **Live camera frames**
- **FAST feature detection**
- **Feature tracking + motion estimation**
- **Depth-based obstacle detection**

This produces:
- Real-time feature overlays  
- Pose estimation  
- Visual trajectory reconstruction  
- Obstacle clustering and visualization  

---

## ✨ Features

### 📡 Dead Reckoning (React Native)
- High-frequency IMU sensor fusion  
- Magnetometer stabilization for heading  
- Real-time drift graph  
- Live map-based trajectory drawing  
- Start/Stop controls for controlled data collection  
- Comparison of:
  - **Red path:** GPS reference  
  - **Blue path:** Dead Reckoning estimated movement  

We tested the DR module by walking around the **DA-IICT campus**, especially the hallways near Wings B/C and the main junction.  
The blue path (IMU) drifts over time due to accelerometer noise and integration errors, while the red path (GPS) stays more stable. This helped us visualize DR drift in a real scenario.

---

### 📷 Visual SLAM (React + Vite)
- Live camera feed rendered with an overlay canvas  
- FAST feature detection (up to **1500 points**)  
- Obstacle detection based on depth heuristics  
- Continuous pose estimation (x, y)  
- Path estimation plotted on a 2D map  
- Live statistics such as FPS, landmark count, pose, and GPS reference  

This module is ideal for indoor environments where GPS is weak.  
The system updates at ~40–50 FPS depending on device performance.

---

### 🎨 Visualization
- Grid View and Map View  
- Real-time trajectory animations  
- Pan/zoom controls  
- Smooth transitions and UI responsiveness  

---

## 🛠 Technology Stack

### **Dead Reckoning App (React Native + Expo)**
- React Native  
- Expo SDK 54  
- JavaScript  
- DeviceMotion, DeviceOrientation APIs  
- Google Maps integration  
- GPS Geolocation  

### **SLAM Module (Web App)**
- React  
- Vite  
- HTML Canvas  
- MediaDevices API (camera)  
- Custom SLAM pipeline (FAST + motion estimation)  

### **Mapping**
- Leaflet  
- OpenStreetMap  

---

## 📦 Installation

### 🔧 Dead Reckoning (Expo)


```bash
cd dead-reckoning-app
npm install
expo start
```
### 🔧 SLAM Module (Web)
```
cd SLAM-Module
npm install
npm run dev
```

## 🚀 Usage

### 1️⃣ Start Dead Reckoning

Open the mobile DR app and allow motion + location permissions.

Press **Start** to begin recording live movement.

Walk around and observe:

- **Blue path → Dead Reckoning estimated trajectory**
- **Red path → GPS reference path**
- **Drift graph → real-time error between DR vs GPS**

This demonstration was recorded around the **DA-IICT campus**, clearly showing how DR begins accurate but slowly drifts due to accumulated sensor noise.

---

### 2️⃣ Start SLAM Module

- Allow **camera permission**
- The module begins detecting **FAST feature points** in real time
- Obstacle count updates dynamically based on **feature density + depth logic**
- Pose (x, y) and trajectory are plotted live on the map panel

This method is ideal for **indoor navigation**, robotics experiments, and real-time vision-based tracking.

---

### 3️⃣ Visualization Options

- Toggle between **Grid View ↔ Map View**
- Track **live movement markers**
- Monitor:
  - Heading  
  - Speed  
  - Pose estimation  
  - Drift  
  - Landmark count  

Smooth UI makes it easy to compare **Dead Reckoning vs SLAM outputs**.

---

## 🧩 Modules

### 📡 Dead Reckoning Calculation

```
velocity = prevVelocity + acceleration * dt;
position = prevPosition + velocity * dt;
heading = Math.atan2(magY, magX);
```

### 📷 SLAM Pipeline

A concise overview of the SLAM processing pipeline used in TraceX:

1. **Capture camera frame**  
   Acquire a new video frame from `getUserMedia` (camera) at target resolution (e.g. 640×480).

2. **Detect FAST feature points**  
   Run FAST corner detector on the frame to extract up to `maxFeatures` strong keypoints.

3. **Track features over subsequent frames**  
   Use a simple tracker (KLT optical flow or descriptor matching) to associate features across frames.

4. **Estimate camera pose**  
   Compute relative motion (pose) between frames using matched features (Essential matrix / PnP if depth/GPS available).

5. **Cluster close-range obstacles**  
   Use a DBSCAN-like clustering on short-range features (feature density + depth heuristics) to identify obstacles.

6. **Construct full trajectory path**  
   Integrate relative poses to build a continuous trajectory and fuse with Dead Reckoning if available for stability.

**Configurable parameters**
```
const maxFeatures = 1500;
const depthCutoff = 1.8;         // meters (ignore features beyond this for close obstacles)
const densityThreshold = 2.5;    // cluster tightness
const edgeScoreMin = 15;         // feature confidence threshold
```

## 🧱 Components

### **Dead Reckoning App Components**

**DRModule.jsx**  
IMU sensor fusion + Dead Reckoning logic.  
Handles DeviceMotion and DeviceOrientation events to compute:  
- Linear acceleration  
- Angular rotation  
- Heading  
- Velocity  
- Position (x, y) updates  

**PathVisualizer**  
Dual-mode trajectory renderer (SVG grid + Leaflet map).  
Converts between local coordinates ↔ GPS coordinates for accurate visualization.

**SensorCard**  
Reusable UI block showing raw IMU values (accelerometer, gyroscope, magnetometer)  
and derived metrics like velocity, orientation, and heading.

**GPSCard**  
Displays:  
- GPS latitude & longitude  
- Accuracy radius  
- Ground-truth position for comparing DR vs GPS drift  


---

### **SLAM Module Components**

**SLAMModule.jsx**  
Core controller for the entire pipeline:  
- Camera capture  
- FAST feature detection  
- Feature tracking  
- Pose estimation (x, y, yaw)  
- Obstacle detection using depth heuristics  
- Outputs trajectoryPoints[] for visualization  

**CameraOverlay**  
Contains `<video>` + `<canvas>` layers.  
Draws:  
- Feature points  
- Tracked feature motion  
- Obstacle clusters  
- Debug info (FPS, landmark count)

**PathVisualizer.jsx**  
Visualizes SLAM-generated trajectories with:  
- Start & current position markers  
- Optional GPS overlay  
- Grid/Map toggle for enhanced comparison  

**PoseData**  
Compact dashboard showing:  
- Current pose (x, y, yaw)  
- FPS  
- Landmark count  
- Obstacle count  


---

## 🏗 Project Architecture (Folder Layout)

```
TraceX/
├── dead-reckoning-app/
│   ├── components/
│   │   ├── DRModule.jsx
│   │   ├── PathVisualizer.jsx
│   │   ├── SensorCard.jsx
│   │   └── GPSCard.jsx
│   ├── assets/
│   └── App.js
│
└── SLAM-Module/
    ├── public/
    ├── src/
    │   ├── components/
    │   │   ├── SLAMModule.jsx
    │   │   ├── CameraOverlay.jsx
    │   │   ├── PathVisualizer.jsx
    │   │   └── PoseData.jsx
    │   └── algorithms/
    │       ├── fastDetector.js
    │       ├── tracker.js
    │       └── poseEstimator.js
    └── vite.config.js
```


---

## 📚 API Reference (Example Snippets)

### **PathVisualizer Component**

```
<PathVisualizer 
  path={trajectoryPoints}
  gpsLocation={{
    latitude: 22.5282,
    longitude: 72.1234,
    accuracy: 4.5
  }}
/>
```

## 📚 SLAMModule High-Level Contract

### **Inputs**
- Camera frames  
- Optional IMU samples  
- Optional GPS data  

### **Outputs**
- `trajectoryPoints[]`  
- `currentPose { x, y, yaw }`  
- `landmarkCount`  
- `obstacleCount`  

### **Events / Methods**
- `onTrajectoryUpdate(points)` — Fired when new trajectory points are calculated  
- `onPoseUpdate(pose)` — Fired when SLAM estimates a new (x, y, yaw) pose  
- `onObstaclesUpdate(list)` — Fired when obstacles are detected or updated  

---

## ⚙️ Configuration & Tuning

You can tune SLAM thresholds and performance parameters inside **SLAMModule.jsx** or a shared configuration file:

```
export const SLAM_CONFIG = {
  maxFeatures: 1500,       // Maximum FAST features detected per frame
  depthCutoff: 1.8,        // Meters — close-range obstacle threshold
  densityThreshold: 2.5,   // Feature clustering density (higher = tighter clusters)
  edgeScoreMin: 15,        // Minimum confidence for feature edges
  targetFPS: 30            // Ideal SLAM frame processing rate
};
```

## 🗺️ Map Provider (PathVisualizer)

To render the map view (OpenStreetMap):
```
<TileLayer 
  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
/>
```

## 🤝 Contributing

This is a group project collaboratively developed by our team for academic evaluation.

### Steps for contributors:

- Fork the repository

- Create a feature branch

- Commit changes

- Push and create a pull request






