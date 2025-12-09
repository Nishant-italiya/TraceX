import React, { useState, useRef, useEffect } from 'react';
import { View, Button, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

const TrackingMap = ({ path }) => {
  const mapRef = useRef();
  const [fullscreen, setFullscreen] = useState(false);
  const [region, setRegion] = useState(null);

  // Auto-fit map when path changes
  useEffect(() => {
    if (path.length > 1 && mapRef.current) {
      mapRef.current.fitToCoordinates(path, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  }, [path]);

  return (
    <View style={[styles.container, fullscreen && styles.fullscreen]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: path[0]?.latitude || 0,
          longitude: path[0]?.longitude || 0,
          latitudeDelta: 0.002,
          longitudeDelta: 0.002,
        }}
      >
        <Polyline coordinates={path} strokeWidth={3} strokeColor="blue" />
        {path.length > 0 && (
          <Marker coordinate={path[path.length - 1]} title="Current" />
        )}
      </MapView>

      <Button
        title={fullscreen ? "Exit Fullscreen" : "Fullscreen Map"}
        onPress={() => setFullscreen(!fullscreen)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  map: { width: '100%', height: 300 },
  fullscreen: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 99,
  },
});

export default TrackingMap;
