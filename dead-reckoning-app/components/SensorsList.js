import React, { useEffect, useState } from "react";
import { View, Text, Button, FlatList, StyleSheet, StatusBar, Alert } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import SensorManager from "../controllers/SensorManager";  // ✅ Updated path

function SensorsList() {   // ✅ Renamed from App to SensorsList
  const [running, setRunning] = useState(false);
  const [latest, setLatest] = useState([]);
  const [status, setStatus] = useState(SensorManager.getStatus());
  const [gps, setGps] = useState(null);

  useEffect(() => {
    const unsub = SensorManager.onData((packet) => {
      setLatest((prev) => [packet, ...prev].slice(0, 50));
    });

    const statusInterval = setInterval(() => {
      setStatus(SensorManager.getStatus());
    }, 500);

    return () => {
      unsub();
      clearInterval(statusInterval);
    };
  }, []);

  // Fetch GPS data every second
  useEffect(() => {
    let locationSubscription;
    const startGps = async () => {
      const granted = await requestPermissions();
      if (!granted) return;

      locationSubscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Highest, timeInterval: 1000, distanceInterval: 0 },
        (location) => {
          setGps(location.coords);
        }
      );
    };
    startGps();

    return () => {
      if (locationSubscription) locationSubscription.remove();
    };
  }, []);

  const start = async () => {
    try {
      const granted = await requestPermissions();
      if (!granted) return;

      await SensorManager.startSensors({ uploadToFirebase: false });
      setRunning(true);
    } catch (err) {
      console.log('startSensors error:', err);
      Alert.alert('Error', 'Failed to start sensors. See console for details.');
    }
  };

  const stop = async () => {
    await SensorManager.stopSensors();
    setRunning(false);
  };

  const requestPermissions = async () => {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        Alert.alert('Permission Denied', 'Foreground location permission is required.');
        return false;
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        Alert.alert('Permission Denied', 'Background location permission is required.');
        return false;
      }

      return true;
    } catch (err) {
      console.log('Permission error:', err);
      Alert.alert('Error', 'Failed to request location permissions.');
      return false;
    }
  };

  // Format GPS nicely with units
  const formatGps = (coords) => {
    if (!coords) return 'Waiting for GPS...';
    return `Lat: ${coords.latitude.toFixed(6)}° | Lon: ${coords.longitude.toFixed(6)}° | Alt: ${coords.altitude?.toFixed(2) ?? 'N/A'} m | Speed: ${coords.speed?.toFixed(2) ?? '0'} m/s`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0f2f5" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>🚀 Dead Reckoning App</Text>
      </View>

      {/* Control Buttons */}
      <View style={styles.buttonRow}>
        <Button 
          title={running ? "Stop" : "Start"} 
          onPress={running ? stop : start} 
          color={running ? "#e74c3c" : "#2ecc71"} 
        />
        <Button 
          title="Enable Upload" 
          onPress={() => (SensorManager.autoUpload = true)} 
          color="#3498db" 
        />
      </View>

      {/* Status Section */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusTitle}>Status</Text>
        <Text style={styles.statusText}>{JSON.stringify(status)}</Text>
      </View>

      {/* GPS Section */}
      <View style={styles.gpsContainer}>
        <Text style={styles.statusTitle}>GPS Data</Text>
        <Text style={styles.gpsText}>{formatGps(gps)}</Text>
      </View>

      {/* Latest Samples */}
      <View style={styles.samplesContainer}>
        <Text style={styles.samplesTitle}>Latest Samples</Text>
        <FlatList
          data={latest}
          keyExtractor={(item, idx) => String(item.timestamp) + item.sensor + idx}
          renderItem={({ item }) => (
            <View style={styles.sampleCard}>
              <Text style={styles.sensor}>{item.sensor}</Text>
              <Text style={styles.ts}>{new Date(item.timestamp).toISOString().slice(11,23)}</Text>
              <Text style={styles.values}>
                {item.raw && item.raw.length ? item.raw.map((v) => v.toFixed(3)).join(", ") : JSON.stringify(item.raw)}
              </Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f2f5",
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  header: {
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 12,
  },
  headerText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#34495e",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  statusContainer: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
  },
  gpsContainer: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: 12,
  },
  statusTitle: {
    fontWeight: "bold",
    marginBottom: 4,
    color: "#2c3e50",
  },
  statusText: {
    color: "#34495e",
    fontFamily: "monospace",
  },
  gpsText: {
    color: "#2c3e50",
    fontFamily: "monospace",
  },
  samplesContainer: {
    flex: 1,
  },
  samplesTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 6,
    color: "#2c3e50",
  },
  sampleCard: {
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  row: { padding: 6, borderBottomWidth: 1, borderColor: "#eee" },
  sensor: { fontWeight: "600", color: "#34495e" },
  ts: { fontSize: 12, color: "#7f8c8d", marginBottom: 4 },
  values: { fontFamily: "monospace", color: "#2c3e50" },
});

export default SensorsList;  // ✅ Final export
