// components/Settings.js
import React, { useState } from "react";
import { View, Text, Button, StyleSheet, Alert } from "react-native";
import SensorManager from "../controllers/SensorManager";

export default function Settings() {
  const [upload, setUpload] = useState(!!SensorManager.autoUpload);

  const toggleUpload = () => {
    SensorManager.autoUpload = !SensorManager.autoUpload;
    setUpload(SensorManager.autoUpload);
    Alert.alert('Upload', `Auto upload ${SensorManager.autoUpload ? 'enabled' : 'disabled'}.`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Auto Upload</Text>
        <Text style={styles.cardText}>Currently: {upload ? 'Enabled' : 'Disabled'}</Text>
        <Button title={upload ? "Disable Upload" : "Enable Upload"} onPress={toggleUpload} color="#3498db" />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>About</Text>
        <Text style={styles.cardText}>This app collects sensor & GPS data for dead reckoning.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5', padding: 12 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#34495e' },
  card: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 12, elevation: 1 },
  cardTitle: { fontWeight: 'bold', marginBottom: 6 },
  cardText: { marginBottom: 8, color: '#444' },
});
