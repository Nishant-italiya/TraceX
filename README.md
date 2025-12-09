# 🚀 TraceX — Real-Time Dead Reckoning & SLAM Navigation Platform
Mobile Sensors • React Native (Dead Reckoning) • React + Vite (SLAM)

TraceX is a hybrid navigation system combining **Dead Reckoning (DR)** and **Visual SLAM** to estimate device movement, orientation, and trajectory using mobile sensors and camera frames.  
It enables real-time visualization, path tracking, and modular experimentation with robotics/navigation algorithms.

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
TraceX provides two core localization techniques:

### **1️⃣ Dead Reckoning (DR)**
Uses:
- Accelerometer  
- Gyroscope  
- Magnetometer  
- Optional GPS  

Provides:
- Real-time velocity and position  
- Orientation + drift-controlled heading  
- Trajectory visualization  

---

### **2️⃣ Visual SLAM Module**
Uses:
- Live camera feed  
- FAST feature detection  
- Depth-based obstacle clustering  
- Frame-to-frame motion estimation  

Provides:
- Real-real feature overlays  
- Visual trajectory reconstruction  
- Obstacle detection  

---

## ✨ Features

### 📡 Dead Reckoning
- IMU sensor fusion  
- Heading correction using magnetometer  
- Continuous velocity & displacement estimation  
- Live path plotter  
- GPS-assisted tracking  

---

### 📷 Visual SLAM Module
- Live camera stream  
- FAST feature detection (up to 1500 features)  
- Obstacle detection using configurable thresholds  
- Real-time pose estimation  
- Frame-based trajectory building  

---

### 🎨 Visualization
- Grid view + Map view  
- Pan/zoom support  
- Smooth animated updates  
- Interactive component structure  

---

## 🛠 Technology Stack

### **Dead Reckoning App (Expo)**
- React Native  
- JavaScript  
- DeviceMotion / Orientation APIs  
- GPS Geolocation API  

### **SLAM Module (Web)**
- React  
- Vite  
- HTML Canvas  
- MediaDevices API  

### **Mapping (optional)**
- Leaflet  
- OpenStreetMap  

---

## 📦 Installation

### 🔧 Dead Reckoning (Expo)
```bash
cd dead-reckoning-app
npm install
expo start
