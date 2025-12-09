// SensorManager.js
import { Accelerometer, Gyroscope, Magnetometer } from "expo-sensors";
import * as Location from "expo-location";
import { db, collection, addDoc } from "../firebaseConfig"; // optional upload

const DEFAULT_MOTION_FREQ = 50; // Hz (50 samples/sec)
const DEFAULT_GPS_INTERVAL_MS = 1000; // 1 Hz
const RING_BUFFER_SECONDS = 10;
const FLUSH_INTERVAL_MS = 1000; // flush to firebase every second (or when buffer grows)

class RingBuffer {
  constructor(maxItems = 10000) {
    this.maxItems = maxItems;
    this.buf = [];
  }
  push(item) {
    this.buf.push(item);
    if (this.buf.length > this.maxItems) this.buf.shift();
  }
  drain() {
    const out = this.buf.slice();
    this.buf = [];
    return out;
  }
  length() {
    return this.buf.length;
  }
}

class SensorManager {
  constructor() {
    this.motionFreq = DEFAULT_MOTION_FREQ;
    this.gpsInterval = DEFAULT_GPS_INTERVAL_MS;
    this.subs = { acc: null, gyro: null, mag: null, loc: null };
    this.rawPrev = { accel: null, gyro: null, mag: null };
    this.filteredPrev = { accel: null, gyro: null, mag: null };
    this.alpha = 0.2; // low-pass smoothing factor, tune 0.1-0.4
    this.ringBuffer = new RingBuffer(this.motionFreq * RING_BUFFER_SECONDS * 5);
    this.onDataCallbacks = new Set();
    this.status = { accel: "UNAVAILABLE", gyro: "UNAVAILABLE", mag: "UNAVAILABLE", gps: "UNAVAILABLE" };
    this.flushTimer = null;
    this.autoUpload = false; // if true, upload to firestore
  }

  setMotionFreq(hz) {
    this.motionFreq = hz;
    const intervalMs = Math.round(1000 / hz);
    Accelerometer.setUpdateInterval(intervalMs);
    Gyroscope.setUpdateInterval(intervalMs);
    Magnetometer.setUpdateInterval(intervalMs);
  }

  // exponential smoothing
  lowPass(sensorName, sample) {
    const prev = this.filteredPrev[sensorName];
    if (!prev) {
      this.filteredPrev[sensorName] = sample;
      return sample;
    }
    const alpha = this.alpha;
    const out = sample.map((v, i) => alpha * v + (1 - alpha) * prev[i]);
    this.filteredPrev[sensorName] = out;
    return out;
  }

  _timestamp() {
    return Date.now(); // ms since epoch UTC
  }

  async startSensors({ uploadToFirebase = false } = {}) {
    try {
      this.autoUpload = uploadToFirebase;

      // set frequencies
      this.setMotionFreq(this.motionFreq);

      // Accelerometer
      this.subs.acc = Accelerometer.addListener((data) => {
        const timestamp = this._timestamp();
        const raw = [data.x, data.y, data.z];
        const filtered = this.lowPass("accel", raw);
        const packet = { sensor: "accelerometer", timestamp, raw, filtered };
        this._handleSample(packet);
      });
      this.status.accel = "OK";

      // Gyroscope
      this.subs.gyro = Gyroscope.addListener((data) => {
        const timestamp = this._timestamp();
        const raw = [data.x, data.y, data.z];
        const filtered = this.lowPass("gyro", raw);
        const packet = { sensor: "gyroscope", timestamp, raw, filtered };
        this._handleSample(packet);
      });
      this.status.gyro = "OK";

      // Magnetometer
      this.subs.mag = Magnetometer.addListener((data) => {
        const timestamp = this._timestamp();
        const raw = [data.x, data.y, data.z];
        const filtered = this.lowPass("mag", raw);
        const packet = { sensor: "magnetometer", timestamp, raw, filtered };
        this._handleSample(packet);
      });
      this.status.mag = "OK";

      // Location: request permission and subscribe
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        this.status.gps = "UNAVAILABLE";
        console.warn("Location permission not granted");
      } else {
        this.status.gps = "OK";
        await Location.startLocationUpdatesAsync("SENSOR_LOCATION_TASK", {
          accuracy: Location.Accuracy.Highest,
          timeInterval: this.gpsInterval,
          distanceInterval: 0, // every timeInterval (onChange would be alternative)
          // may require additional Android manifest for background, but for foreground it's OK
        });

        // For foreground polling (simpler): instead of background task, poll:
        this.locPoller = setInterval(async () => {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
          const timestamp = this._timestamp();
          const packet = {
            sensor: "location",
            timestamp,
            raw: {
              coords: {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                altitude: pos.coords.altitude,
                accuracy: pos.coords.accuracy,
                speed: pos.coords.speed,
                heading: pos.coords.heading,
              },
            },
          };
          this._handleSample(packet);
        }, this.gpsInterval);
      }

      // start flush timer
      if (!this.flushTimer) {
        this.flushTimer = setInterval(() => this._maybeFlush(), FLUSH_INTERVAL_MS);
      }
    } catch (err) {
      console.error("startSensors error", err);
    }
  }

  async stopSensors() {
    try {
      if (this.subs.acc) this.subs.acc.remove();
      if (this.subs.gyro) this.subs.gyro.remove();
      if (this.subs.mag) this.subs.mag.remove();

      if (this.locPoller) {
        clearInterval(this.locPoller);
        this.locPoller = null;
      }

      // stop location updates if task used
      try {
        await Location.stopLocationUpdatesAsync("SENSOR_LOCATION_TASK");
      } catch (e) {
        // ignore if not started
      }

      Object.keys(this.subs).forEach((k) => (this.subs[k] = null));
      if (this.flushTimer) {
        clearInterval(this.flushTimer);
        this.flushTimer = null;
      }
    } catch (err) {
      console.error("stopSensors error", err);
    }
  }

  _handleSample(packet) {
    // push to ring buffer
    this.ringBuffer.push(packet);
    // call callbacks immediately with the packet so UI can render quickly
    for (const cb of this.onDataCallbacks) {
      try {
        cb(packet);
      } catch (e) {
        console.warn("onData callback error", e);
      }
    }
  }

  // register a callback: cb(packet) -> called for every sample
  onData(cb) {
    this.onDataCallbacks.add(cb);
    return () => this.onDataCallbacks.delete(cb);
  }

  getStatus() {
    return { ...this.status, bufferLength: this.ringBuffer.length() };
  }

  // flush buffer to firebase or return drained buffer
  async _maybeFlush() {
    const minBatchSize = Math.max(1, Math.floor(this.motionFreq / 4));
    if (this.ringBuffer.length() === 0) return;
    // For demo: flush every FLUSH_INTERVAL_MS
    const drained = this.ringBuffer.drain();
    if (this.autoUpload) {
      // upload as one batch doc in Firestore
      try {
        // structure: { createdAt: timestamp, samples: [...] }
        await addDoc(collection(db, "sensor_batches"), {
          createdAt: Date.now(),
          samples: drained,
          device: {
            // optionally include device id / platform
          },
        });
        // optionally emit an event about success
      } catch (err) {
        console.warn("upload failed", err);
        // if upload fails, you might push back to buffer (not implemented here)
      }
    } else {
      // keep drained samples for debug / file writes; for now we just drop (or you can store to file)
      // expose lastDrain for debugging
      this.lastDrain = drained;
    }
  }
}

const singleton = new SensorManager();
export default singleton;
