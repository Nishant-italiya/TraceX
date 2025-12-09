// // controllers/DeadReckoningManager.js
// // DeadReckoningManager: step-based dead reckoning + heading fusion + event emitter
// // Keep this controller independent of UI. Use SensorManager to subscribe to raw sensors.

// import { EventEmitter } from 'eventemitter3';
// import SensorManager from './SensorManager'; // your existing manager
// // If SensorManager isn't at this path adjust accordingly.

// const DR = {
//   // configuration/tuning
//   step: {
//     minPeakIntervalMs: 300,     // minimum time between steps
//     minPeakAmp: 0.6,            // min amplitude for a peak (tune per device)
//     K: 0.68,                    // Weinberg-like constant for length estimation
//     windowSize: 21,             // smoothing window for accel signal
//   },
//   heading: {
//     alpha: 0.98,                // complementary filter weight (gyro short-term)
//   },
// };

// class DeadReckoningManager extends EventEmitter {
//   constructor() {
//     super();
//     this.reset();
//     this._onSensor = this._onSensor.bind(this);
//   }

//   reset() {
//     // state
//     this.path = [{ x: 0, y: 0, t: Date.now() }]; // DR path (start at origin)
//     this.x = 0;
//     this.y = 0;
//     this.vYaw = 0;                 // integrated yaw velocity (radians)
//     this.yaw = 0;                  // fused yaw (radians), 0 = North
//     this.lastStepTime = 0;
//     this.accelBuffer = [];         // for smoothing/detrending vertical accel
//     this.sampleCount = 0;
//     this.running = false;
//     this.stepLog = [];
//     this.lastGps = null;           // {latitude, longitude, ...}
//   }

//   start() {
//     if (this.running) return;
//     this.running = true;
//     this.reset(); // start fresh
//     // subscribe to SensorManager
//     this._unsub = SensorManager.onData(this._onSensor);
//     this.emit('started');
//   }

//   stop() {
//     if (!this.running) return;
//     this.running = false;
//     if (this._unsub) this._unsub();
//     this.emit('stopped');
//   }

//   setGps(coords) {
//     // set latest gps coords for drift diagnostics. coords: {latitude, longitude, altitude, speed}
//     this.lastGps = coords;
//     this.emit('gps', coords);
//   }

//   _onSensor(packet) {
//     // expected packet: { sensor, timestamp, raw: [x,y,z] }
//     if (!packet || !packet.sensor) return;

//     const s = packet.sensor.toLowerCase();
//     if (s === 'gyro' || s === 'gyroscope') {
//       this._handleGyro(packet);
//     } else if (s === 'magnetometer' || s === 'mag') {
//       this._handleMag(packet);
//     } else if (s === 'accelerometer' || s === 'accel') {
//       this._handleAccel(packet);
//     } else if (s === 'location' || s === 'gps') {
//       // optional: if SensorManager emits GPS packets
//       if (packet.coords) this.setGps(packet.coords);
//     }
//     // publish status occasionally
//     this.sampleCount++;
//     if ((this.sampleCount % 50) === 0) {
//       this.emit('status', this.getStatus());
//     }
//   }

//   _handleGyro(packet) {
//     // packet.raw = [gx, gy, gz] in rad/s or deg/s — detect units: assume rad/s; if deg/s, convert
//     const gz = packet.raw[2] ?? 0; // rotation around z axis -> yaw rate
//     // if values seem large (>50), likely deg/s -> convert
//     const gzRad = Math.abs(gz) > 50 ? gz * (Math.PI / 180) : gz;
//     const dt = 0.02; // assume ~50Hz if timestamps are not reliable — this is approximate
//     this.vYaw = gzRad;
//     this.yaw += gzRad * dt; // integrate
//     // pair with magnetometer correction in _handleMag via complementary filter
//   }

//   _handleMag(packet) {
//     // compute yaw from magnetometer vector (simple)
//     const mx = packet.raw[0] ?? 0;
//     const my = packet.raw[1] ?? 0;
//     // compute heading angle relative to magnetic north: atan2(my, mx)
//     const magYaw = Math.atan2(my, mx);
//     // complementary filter with integrated yaw
//     const a = DR.heading.alpha;
//     this.yaw = a * this.yaw + (1 - a) * magYaw;
//     // normalize -pi..pi
//     if (this.yaw > Math.PI) this.yaw -= 2 * Math.PI;
//     if (this.yaw < -Math.PI) this.yaw += 2 * Math.PI;
//   }

//   _handleAccel(packet) {
//     // packet.raw = [ax, ay, az] in m/s^2 in device coords.
//     // We assume phone in pocket: vertical axis approx. magnitude = |accel| while walking.
//     const ax = packet.raw[0] ?? 0;
//     const ay = packet.raw[1] ?? 0;
//     const az = packet.raw[2] ?? 0;

//     // get magnitude of linear acceleration (approx)
//     const mag = Math.sqrt(ax * ax + ay * ay + az * az);

//     // push to buffer & smooth
//     this._pushAccel(mag);

//     // attempt step detection
//     const step = this._detectStep();
//     if (step) {
//       this._onStep(step);
//     }
//   }

//   _pushAccel(value) {
//     const buf = this.accelBuffer;
//     buf.push(value);
//     const maxLen = DR.step.windowSize;
//     if (buf.length > maxLen) buf.shift();
//   }

//   _smoothBuffer() {
//     // simple moving average smoothing
//     const buf = this.accelBuffer;
//     if (!buf.length) return null;
//     const n = buf.length;
//     const s = buf.reduce((a, b) => a + b, 0);
//     const mean = s / n;
//     // compute simple local variance / amplitude measure by last peak - min in window
//     const mx = Math.max(...buf);
//     const mn = Math.min(...buf);
//     return { mean, max: mx, min: mn, amp: mx - mn };
//   }

//   _detectStep() {
//     const now = Date.now();
//     const sm = this._smoothBuffer();
//     if (!sm) return null;

//     const amp = sm.amp;
//     const mp = sm.max;
//     // naive threshold + refractory period
//     if (amp < DR.step.minPeakAmp) return null;
//     // check if newest sample is near the max (peak)
//     const last = this.accelBuffer[this.accelBuffer.length - 1];
//     const isPeak = last > (sm.mean + amp * 0.6); // heuristic
//     if (!isPeak) return null;
//     if (now - this.lastStepTime < DR.step.minPeakIntervalMs) return null;

//     // compute estimated length using Weinberg formula variant: L = K * (A^0.25)
//     const L = DR.step.K * Math.pow(amp, 0.25);
//     this.lastStepTime = now;
//     return { t: now, amp, length: L, peak: mp, min: sm.min, mean: sm.mean };
//   }

//   _onStep(step) {
//     // heading = current yaw (fused). 0 rad -> north; convert to x,y: x -> east, y -> north
//     const heading = this.yaw; // radians
//     // DR update: x += L * sin(heading) ??? depends on convention.
//     // We'll use x = east, y = north: dx = L * sin(yaw), dy = L * cos(yaw)
//     const dx = step.length * Math.sin(heading);
//     const dy = step.length * Math.cos(heading);
//     this.x += dx;
//     this.y += dy;

//     const p = { x: this.x, y: this.y, t: step.t };
//     this.path.push(p);
//     this.stepLog.push({ ...step, heading });
//     this.emit('step', { step, pos: p });
//     this.emit('path', this.path);
//     this.emit('position', { x: this.x, y: this.y });

//     // emit drift metric if gps known
//     if (this.lastGps) {
//       const d = this._distanceBetweenGpsAndPoint(this.lastGps, { x: this.x, y: this.y });
//       this.emit('drift', { meters: d });
//     }
//   }

//   _distanceBetweenGpsAndPoint(gps, point) {
//     // convert gps (lat, lon) to local meters using equirectangular approximation
//     // We need an anchor: use first GPS as origin (if any). For now, if lastGps exists, compute distance between GPS and estimated point assuming GPS and DR share origin.
//     // Since we do not have earlier GPS reference, return placeholder: distance between origin and current point (norm)
//     const meters = Math.sqrt(point.x * point.x + point.y * point.y);
//     return meters;
//   }

//   getStatus() {
//     return {
//       running: !!this.running,
//       steps: this.stepLog.length,
//       pos: { x: this.x, y: this.y },
//       yaw: this.yaw,
//       lastGps: this.lastGps,
//     };
//   }

//   getPath() {
//     return this.path.slice();
//   }

//   getStepLog() {
//     return this.stepLog.slice();
//   }
// }

// export default new DeadReckoningManager();


// //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



// import { EventEmitter } from 'eventemitter3';
// import * as Location from 'expo-location';
// import SensorManager from './SensorManager'; // your existing manager

// const emitter = new EventEmitter();

// let running = false;
// let position = null; // GPS-based position
// let path = [];
// let driftLog = [];

// async function start() {
//   if (running) return;
//   running = true;

//   // Request GPS permission
//   const { status } = await Location.requestForegroundPermissionsAsync();
//   if (status !== 'granted') throw new Error('Location permission not granted');

//   // Get initial GPS position
//   const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
//   position = { lat: loc.coords.latitude, lon: loc.coords.longitude };
//   path.push({ latitude: position.lat, longitude: position.lon, timestamp: Date.now() });

//   // Watch GPS updates
//   await Location.watchPositionAsync(
//     { accuracy: Location.Accuracy.High, timeInterval: 1000 },
//     (loc) => {
//       const gps = { lat: loc.coords.latitude, lon: loc.coords.longitude };
//       const drift = Math.sqrt(
//         Math.pow(position.lat - gps.lat, 2) + Math.pow(position.lon - gps.lon, 2)
//       );
//       driftLog.push({ time: Date.now(), drift });
//       emitter.emit('update', { position, drift, driftLog, path });
//     }
//   );

//   // Subscribe to SensorManager for steps (simulated small movement)
//   SensorManager.onData((packet) => {
//     if (!running || !position) return;

//     const stepDelta = 0.00001; // ~1m for testing, replace with real step-based delta
//     position.lat += stepDelta;
//     position.lon += stepDelta;

//     path.push({ latitude: position.lat, longitude: position.lon, timestamp: Date.now() });
//     emitter.emit('update', { position, drift: driftLog[driftLog.length-1]?.drift || 0, driftLog, path });
//   });
// }

// function stop() {
//   running = false;
// }

// export default {
//   start,
//   stop,
//   on: (event, fn) => emitter.on(event, fn),
//   off: (event, fn) => emitter.off(event, fn),
// };



// //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// final one but nigeria kind of thing is happening 


// import { EventEmitter } from 'eventemitter3';
// import SensorManager from './SensorManager';

// export default class DeadReckoningManager extends EventEmitter {
//   constructor() {
//     super();
//     this.path = []; // DR path
//     this.driftLog = []; // Drift vs GPS
//     this.running = false;
//   }

//   start() {
//     if (this.running) return;
//     this.running = true;
//     this.path = [];
//     this.driftLog = [];
//     this.prevPos = { x: 0, y: 0 }; // Relative start position
//     this.heading = 0;

//     this.sensorSub = SensorManager.onData((packet) => {
//       if (!this.running) return;

//       // Basic step detection example
//       if (packet.sensor === 'accelerometer') {
//         const accZ = packet.raw[2]; // vertical acceleration
//         if (accZ > 1.2) { // simple threshold step detection
//           this.prevPos.x += 0.7 * Math.cos(this.heading); // 0.7 m step
//           this.prevPos.y += 0.7 * Math.sin(this.heading);

//           const drPoint = {
//             timestamp: packet.timestamp,
//             latitude: this.prevPos.x,
//             longitude: this.prevPos.y,
//           };

//           this.path.push(drPoint);
//           this.emit('dr', { drPoint, path: this.path });
//         }
//       }

//       if (packet.sensor === 'gyroscope') {
//         // Update heading
//         this.heading += packet.raw[2] * 0.01; // simple integration
//       }
//     });
//   }

//   stop() {
//     this.running = false;
//     if (this.sensorSub) this.sensorSub();
//     this.emit('stopped', { path: this.path, driftLog: this.driftLog });
//   }

//   updateDrift(drPoint, gpsPoint) {
//     const driftMeters = Math.sqrt(
//       Math.pow((drPoint.latitude - gpsPoint.latitude) * 111000, 2) +
//       Math.pow((drPoint.longitude - gpsPoint.longitude) * 111000, 2)
//     );
//     this.driftLog.push({ timestamp: drPoint.timestamp, drift: driftMeters });
//     this.emit('drift', this.driftLog);
//   }
// }


import { EventEmitter } from 'eventemitter3';
import SensorManager from './SensorManager';

export default class DeadReckoningManager extends EventEmitter {
  constructor() {
    super();
    this.reset();
  }

  reset() {
    this.running = false;
    this.startLat = null;
    this.startLon = null;
    this.prevPos = { x: 0, y: 0 };
    this.heading = 0;
    this.accBuffer = [];
    this.lastStepTime = 0;
    this.path = [];
    this.driftLog = [];
    this.haveGpsLock = false;
  }

  // Called from UI once GPS has first fix
  setInitialGpsFix(gps) {
    if (gps && !this.haveGpsLock) {
      this.startLat = gps.latitude;
      this.startLon = gps.longitude;
      this.haveGpsLock = true;
      this.path = [{
        latitude: gps.latitude,
        longitude: gps.longitude,
        timestamp: Date.now(),
      }];
    }
  }

  start() {
    if (this.running) return;
    if (!this.haveGpsLock) {
      console.warn('⚠️ Cannot start DR — GPS not yet locked!');
      this.emit('error', 'Waiting for GPS lock before starting DR.');
      return;
    }

    this.running = true;
    console.log('✅ DR started at GPS anchor:', this.startLat, this.startLon);

    this.sensorSub = SensorManager.onData((packet) => {
      if (!this.running) return;

      // Update heading from gyro
      if (packet.sensor === 'gyroscope') {
        const gyroZ = packet.raw[2];
        this.heading += gyroZ * 0.01;
        this.heading %= 2 * Math.PI;
      }

      // Step detection using acceleration magnitude
      if (packet.sensor === 'accelerometer') {
        const [ax, ay, az] = packet.raw;
        const mag = Math.sqrt(ax * ax + ay * ay + az * az);

        this.accBuffer.push(mag);
        if (this.accBuffer.length > 30) this.accBuffer.shift();

        const avg = this.accBuffer.reduce((a, b) => a + b, 0) / this.accBuffer.length;
        const threshold = avg + 0.6;

        if (mag > threshold && Date.now() - this.lastStepTime > 300) {
          this.lastStepTime = Date.now();

          const stepLen = 0.7; // meters per step
          this.prevPos.x += stepLen * Math.cos(this.heading);
          this.prevPos.y += stepLen * Math.sin(this.heading);

          const latNew = this.startLat + this.prevPos.y / 111111;
          const lonNew = this.startLon + this.prevPos.x / (111111 * Math.cos(this.startLat * Math.PI / 180));

          const drPoint = {
            timestamp: packet.timestamp,
            latitude: latNew,
            longitude: lonNew,
          };

          this.path.push(drPoint);
          this.emit('dr', { drPoint, path: this.path });
        }
      }
    });
  }

  stop() {
    this.running = false;
    if (this.sensorSub) this.sensorSub();
    this.emit('stopped', { path: this.path, driftLog: this.driftLog });
  }

  updateDrift(gpsPoint) {
    if (!this.haveGpsLock || !gpsPoint || this.path.length === 0) return;

    const drPoint = this.path[this.path.length - 1];
    const driftMeters = Math.sqrt(
      Math.pow((drPoint.latitude - gpsPoint.latitude) * 111000, 2) +
      Math.pow((drPoint.longitude - gpsPoint.longitude) * 111000, 2)
    );

    this.driftLog.push({
      timestamp: gpsPoint.timestamp,
      drift: driftMeters,
    });

    this.emit('drift', this.driftLog);
  }
}


