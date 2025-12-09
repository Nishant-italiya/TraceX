// // components/DeadReckoning.js
// import React, { useEffect, useState } from 'react';
// import { View, Text, Button, FlatList, StyleSheet, Alert } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import DeadReckoningManager from '../controllers/DeadReckoningManager';
// import SensorManager from '../controllers/SensorManager';
// import * as Location from 'expo-location';

// // optional small svg preview
// let Svg, Polyline;
// try {
//   // dynamic import; will be available if react-native-svg is installed
//   Svg = require('react-native-svg').Svg;
//   Polyline = require('react-native-svg').Polyline;
// } catch (e) {
//   Svg = null;
//   Polyline = null;
// }

// export default function DeadReckoning() {
//   const [status, setStatus] = useState(DeadReckoningManager.getStatus());
//   const [path, setPath] = useState(DeadReckoningManager.getPath());
//   const [stepLog, setStepLog] = useState(DeadReckoningManager.getStepLog());
//   const [drift, setDrift] = useState(null);
//   const [gps, setGps] = useState(null);
//   const [running, setRunning] = useState(false);

//   useEffect(() => {
//     const onStep = (d) => {
//       setStepLog(DeadReckoningManager.getStepLog());
//       setPath(DeadReckoningManager.getPath());
//       setStatus(DeadReckoningManager.getStatus());
//     };
//     const onPos = () => {
//       setStatus(DeadReckoningManager.getStatus());
//     };
//     const onPath = (p) => setPath(p);
//     const onDrift = (d) => setDrift(d);

//     DeadReckoningManager.on('step', onStep);
//     DeadReckoningManager.on('position', onPos);
//     DeadReckoningManager.on('path', onPath);
//     DeadReckoningManager.on('drift', onDrift);

//     return () => {
//       DeadReckoningManager.off('step', onStep);
//       DeadReckoningManager.off('position', onPos);
//       DeadReckoningManager.off('path', onPath);
//       DeadReckoningManager.off('drift', onDrift);
//     };
//   }, []);

//   useEffect(() => {
//     // subscribe to SensorManager GPS if it exists:
//     const unsub = SensorManager.onData((packet) => {
//       if (packet.sensor && packet.sensor.toLowerCase() === 'location' && packet.coords) {
//         DeadReckoningManager.setGps(packet.coords);
//         setGps(packet.coords);
//       }
//     });
//     return () => {
//       unsub && unsub();
//     };
//   }, []);

//   // convenience: fetch device GPS and give to DR manager
//   const fetchGpsNow = async () => {
//     try {
//       const { status } = await Location.requestForegroundPermissionsAsync();
//       if (status !== 'granted') {
//         Alert.alert('Permission denied', 'Allow location to get GPS anchor.');
//         return;
//       }
//       const loc = await Location.getCurrentPositionAsync({});
//       const c = loc.coords;
//       DeadReckoningManager.setGps(c);
//       setGps(c);
//       Alert.alert('GPS anchor set', `lat:${c.latitude.toFixed(6)} lon:${c.longitude.toFixed(6)}`);
//     } catch (e) {
//       console.warn(e);
//       Alert.alert('Error', 'Failed to get GPS.');
//     }
//   };

//   const start = () => {
//     DeadReckoningManager.start();
//     setRunning(true);
//   };

//   const stop = () => {
//     DeadReckoningManager.stop();
//     setRunning(false);
//   };

//   const reset = () => {
//     DeadReckoningManager.reset();
//     setPath(DeadReckoningManager.getPath());
//     setStepLog([]);
//     setStatus(DeadReckoningManager.getStatus());
//     setDrift(null);
//     Alert.alert('Reset', 'Dead Reckoning state reset to origin.');
//   };

//   // prepare points for SVG polyline if available (scale for preview)
//   const svgPoints = (path && path.length > 0) ? path.map(p => `${(p.x*10).toFixed(1)},${(p.y*-10).toFixed(1)}`).join(' ') : '';

//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.header}>
//         <Text style={styles.title}>Dead Reckoning (Phase 2)</Text>
//         <Text style={styles.subtitle}>Step-based DR, heading fusion & drift diagnostics</Text>
//       </View>

//       <View style={styles.controls}>
//         <Button title={running ? 'Stop DR' : 'Start DR'} onPress={running ? stop : start} color={running ? '#e74c3c' : '#2ecc71'} />
//         <Button title="Reset DR" onPress={reset} color="#d35400" />
//         <Button title="Set GPS Anchor" onPress={fetchGpsNow} color="#3498db" />
//       </View>

//       <View style={styles.infoRow}>
//         <Text style={styles.info}>Position: x={status.pos?.x?.toFixed(3) ?? 0} m, y={status.pos?.y?.toFixed(3) ?? 0} m</Text>
//         <Text style={styles.info}>Steps: {status.steps ?? 0}</Text>
//         <Text style={styles.info}>Yaw: {(status.yaw * 180 / Math.PI).toFixed(1)}°</Text>
//       </View>

//       {/* small path preview */}
//       <View style={styles.preview}>
//         {Svg && Polyline ? (
//           <Svg height="160" width="100%" viewBox="0 0 300 160">
//             <Polyline
//               points={svgPoints || '150,80'}
//               fill="none"
//               stroke="#2ecc71"
//               strokeWidth="2"
//             />
//           </Svg>
//         ) : (
//           <Text style={{ color: '#888' }}>Install react-native-svg to see path preview</Text>
//         )}
//       </View>

//       <View style={styles.diagnostics}>
//         <Text style={styles.dTitle}>Diagnostics</Text>
//         <Text>Drift (est): {drift ? drift.meters.toFixed(2) + ' m' : 'N/A'}</Text>
//         <Text>GPS: {gps ? `${gps.latitude.toFixed(6)}, ${gps.longitude.toFixed(6)}` : 'No anchor'}</Text>
//       </View>

//       <View style={styles.stepList}>
//         <Text style={styles.listTitle}>Step Log (latest)</Text>
//         <FlatList
//           data={[...stepLog].reverse().slice(0, 50)}
//           keyExtractor={(item, idx) => String(item.t) + idx}
//           renderItem={({ item }) => (
//             <View style={styles.stepRow}>
//               <Text style={styles.stepText}>{new Date(item.t).toLocaleTimeString()} • L={item.length.toFixed(2)} m • amp={item.amp.toFixed(2)} • hdg={(item.heading*180/Math.PI).toFixed(0)}°</Text>
//             </View>
//           )}
//         />
//       </View>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, padding: 12, backgroundColor: '#f6f8fa' },
//   header: { marginBottom: 8, alignItems: 'center' },
//   title: { fontSize: 20, fontWeight: '700', color: '#34495e' },
//   subtitle: { color: '#7f8c8d', fontSize: 12 },
//   controls: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 },
//   infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
//   info: { fontFamily: 'monospace' },
//   preview: { height: 160, backgroundColor: '#fff', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 8, padding: 8 },
//   diagnostics: { backgroundColor: '#fff', padding: 8, borderRadius: 8, marginBottom: 8 },
//   dTitle: { fontWeight: 'bold', marginBottom: 4 },
//   stepList: { flex: 1 },
//   listTitle: { fontWeight: 'bold', marginBottom: 6 },
//   stepRow: { paddingVertical: 6, borderBottomWidth: 1, borderColor: '#eee' },
//   stepText: { color: '#34495e' },
// });



// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



// import React, { useEffect, useState } from 'react';
// import { View, Text, Button, StyleSheet, Dimensions } from 'react-native';
// import MapView, { Marker, Polyline } from 'react-native-maps';
// import DeadReckoningManager from '../controllers/DeadReckoningManager';
// import { LineChart } from 'react-native-chart-kit';

// const { width, height } = Dimensions.get('window');

// export default function DeadReckoning() {
//   const [path, setPath] = useState([]);
//   const [driftLog, setDriftLog] = useState([]);
//   const [fullscreen, setFullscreen] = useState(false);

//   useEffect(() => {
//     DeadReckoningManager.on('update', ({ path, driftLog }) => {
//       setPath([...path]);
//       setDriftLog([...driftLog]);
//     });

//     return () => {
//       DeadReckoningManager.stop();
//     };
//   }, []);

//   const startTracking = () => DeadReckoningManager.start();
//   const stopTracking = () => DeadReckoningManager.stop();

//   const initialRegion = path.length
//     ? {
//         latitude: path[0].latitude,
//         longitude: path[0].longitude,
//         latitudeDelta: 0.002,
//         longitudeDelta: 0.002,
//       }
//     : {
//         latitude: 20.5937, // fallback India center
//         longitude: 78.9629,
//         latitudeDelta: 0.5,
//         longitudeDelta: 0.5,
//       };

//   return (
//     <View style={[styles.container, fullscreen && { position: 'absolute', top: 0, left: 0, width, height }]}>
//       <MapView
//         style={styles.map}
//         initialRegion={initialRegion}
//         showsUserLocation
//         followsUserLocation
//         onMapReady={() => path.length && this.map.fitToCoordinates(path, { edgePadding: { top: 50, bottom: 50, left: 50, right: 50 }, animated: true })}
//       >
//         {path.map((p, idx) => (
//           <Marker
//             key={idx}
//             coordinate={{ latitude: p.latitude, longitude: p.longitude }}
//             title={new Date(p.timestamp).toLocaleTimeString()}
//           />
//         ))}
//         <Polyline coordinates={path} strokeColor="#FF0000" strokeWidth={3} />
//       </MapView>

//       <View style={styles.buttons}>
//         <Button title="Start" onPress={startTracking} />
//         <Button title="Stop" onPress={stopTracking} />
//         <Button title={fullscreen ? "Exit Fullscreen" : "Fullscreen"} onPress={() => setFullscreen(!fullscreen)} />
//       </View>

//       {!fullscreen && driftLog.length > 0 && (
//         <LineChart
//           data={{
//             labels: driftLog.map(d => new Date(d.time).toLocaleTimeString()),
//             datasets: [{ data: driftLog.map(d => d.drift) }],
//           }}
//           width={width - 20}
//           height={220}
//           chartConfig={{
//             backgroundGradientFrom: '#fff',
//             backgroundGradientTo: '#fff',
//             decimalPlaces: 6,
//             color: (opacity = 1) => `rgba(255,0,0,${opacity})`,
//             labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
//             propsForDots: { r: '2', strokeWidth: '1', stroke: '#ff0000' },
//           }}
//           style={{ marginVertical: 10, borderRadius: 10 }}
//         />
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1 },
//   map: { flex: 1 },
//   buttons: {
//     position: 'absolute',
//     top: 10,
//     left: 10,
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     width: '95%',
//   },
// });




// //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// this one is final code 

// import React, { useEffect, useState, useRef } from 'react';
// import { View, Button, Text, Dimensions, ScrollView } from 'react-native';
// import MapView, { Polyline, Marker } from 'react-native-maps';
// import * as Location from 'expo-location';
// import { LineChart } from 'react-native-chart-kit';
// import DeadReckoningManager from '../controllers/DeadReckoningManager';
// import SensorManager from '../controllers/SensorManager';

// export default function DeadReckoning() {
//   const [gpsPath, setGpsPath] = useState([]);
//   const [drPath, setDrPath] = useState([]);
//   const [driftLog, setDriftLog] = useState([]);
//   const [running, setRunning] = useState(false);
//   const [gps, setGps] = useState(null);
//   const mapRef = useRef(null);
//   const drManager = useRef(new DeadReckoningManager()).current;

//   // GPS subscription
//   const startGps = async () => {
//     const { status } = await Location.requestForegroundPermissionsAsync();
//     if (status !== 'granted') return alert('GPS permission required');
//     const sub = await Location.watchPositionAsync(
//       { accuracy: Location.Accuracy.Highest, distanceInterval: 0, timeInterval: 1000 },
//       (loc) => {
//         setGps(loc.coords);
//         setGpsPath(prev => [...prev, { latitude: loc.coords.latitude, longitude: loc.coords.longitude, timestamp: Date.now() }]);
//       }
//     );
//     return sub;
//   };

//   useEffect(() => {
//     let gpsSub;
//     if (running) {
//       startGps().then(sub => { gpsSub = sub; });
//       drManager.start();

//       // DR events
//       drManager.on('dr', ({ drPoint }) => {
//         setDrPath([...drManager.path]);
//         if (gps) drManager.updateDrift(drPoint, gps);
//       });

//       drManager.on('drift', (log) => {
//         setDriftLog([...log]);
//       });
//     }

//     return () => {
//       if (gpsSub) gpsSub.remove();
//       drManager.stop();
//     };
//   }, [running]);

//   const handleStart = () => {
//     setGpsPath([]);
//     setDrPath([]);
//     setDriftLog([]);
//     setRunning(true);
//   };

//   const handleStop = () => {
//     drManager.stop();
//     setRunning(false);
//   };

//   return (
//     <ScrollView style={{ flex: 1 }}>
//       <View style={{ height: 400 }}>
//         <MapView
//           ref={mapRef}
//           style={{ flex: 1 }}
//           initialRegion={{
//             latitude: gps?.latitude || 20.5937,
//             longitude: gps?.longitude || 78.9629,
//             latitudeDelta: 0.01,
//             longitudeDelta: 0.01,
//           }}
//         >
//           {gpsPath.length > 0 && <Polyline coordinates={gpsPath} strokeColor="blue" strokeWidth={4} />}
//           {drPath.length > 0 && <Polyline coordinates={drPath} strokeColor="red" strokeWidth={4} />}
//           {gps && <Marker coordinate={{ latitude: gps.latitude, longitude: gps.longitude }} title="GPS" pinColor="blue" />}
//         </MapView>
//       </View>

//       <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10 }}>
//         <Button title="Start" onPress={handleStart} />
//         <Button title="Stop" onPress={handleStop} />
//       </View>

//       <View style={{ maxHeight: 150, backgroundColor: '#fff', padding: 5 }}>
//         <Text style={{ fontWeight: 'bold' }}>Logs:</Text>
//         {gpsPath.map((p, i) => (
//           <Text key={i} style={{ fontSize: 12 }}>
//             Time: {new Date(p.timestamp).toLocaleTimeString()}, Lat: {p.latitude.toFixed(6)}, Lon: {p.longitude.toFixed(6)}, Drift: {driftLog[i]?.drift?.toFixed(2) ?? '0'} m
//           </Text>
//         ))}
//       </View>

//       {driftLog.length > 0 && (
//         <LineChart
//           data={{
//             labels: driftLog.map((_, i) => i.toString()),
//             datasets: [{ data: driftLog.map(d => d.drift) }],
//           }}
//           width={Dimensions.get('window').width - 20}
//           height={220}
//           yAxisSuffix="m"
//           chartConfig={{
//             backgroundColor: '#fff',
//             backgroundGradientFrom: '#fff',
//             backgroundGradientTo: '#fff',
//             decimalPlaces: 2,
//             color: (opacity = 1) => `rgba(255, 0, 0, ${opacity})`,
//             labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
//             style: { borderRadius: 16 },
//           }}
//           style={{ marginVertical: 8, borderRadius: 16 }}
//         />
//       )}
//     </ScrollView>
//   );
// }



// Full and Final code without UI beauty

// import React, { useEffect, useState, useRef } from 'react';
// import { View, Button, Text, Dimensions, ScrollView } from 'react-native';
// import MapView, { Polyline, Marker } from 'react-native-maps';
// import * as Location from 'expo-location';
// import { LineChart } from 'react-native-chart-kit';
// import DeadReckoningManager from '../controllers/DeadReckoningManager';

// export default function DeadReckoning() {
//   const [gpsPath, setGpsPath] = useState([]);
//   const [drPath, setDrPath] = useState([]);
//   const [driftLog, setDriftLog] = useState([]);
//   const [running, setRunning] = useState(false);
//   const [gps, setGps] = useState(null);
//   const [hasGpsLock, setHasGpsLock] = useState(false);
//   const mapRef = useRef(null);
//   const drManager = useRef(new DeadReckoningManager()).current;
//   const gpsSubRef = useRef(null);

//   // ✅ Always start GPS listener on mount (before pressing Start)
//   useEffect(() => {
//     const startGps = async () => {
//       const { status } = await Location.requestForegroundPermissionsAsync();
//       if (status !== 'granted') {
//         alert('GPS permission required');
//         return;
//       }

//       gpsSubRef.current = await Location.watchPositionAsync(
//         {
//           accuracy: Location.Accuracy.Highest,
//           timeInterval: 1000,
//           distanceInterval: 0,
//         },
//         (loc) => {
//           setGps(loc.coords);
//           setGpsPath((prev) => [
//             ...prev,
//             {
//               latitude: loc.coords.latitude,
//               longitude: loc.coords.longitude,
//               timestamp: Date.now(),
//             },
//           ]);
//         }
//       );
//     };

//     startGps();

//     return () => {
//       if (gpsSubRef.current) gpsSubRef.current.remove();
//     };
//   }, []);

//   // ✅ Set initial GPS fix when available (anchors Dead Reckoning start)
//   useEffect(() => {
//     if (gps && !hasGpsLock) {
//       drManager.setInitialGpsFix(gps);
//       setHasGpsLock(true);
//       console.log('✅ GPS Lock acquired at:', gps.latitude, gps.longitude);
//     }
//   }, [gps]);

//   // ✅ Start / Stop Dead Reckoning logic
//   useEffect(() => {
//     if (running) {
//       if (!hasGpsLock) {
//         alert('Waiting for GPS lock before starting Dead Reckoning...');
//         setRunning(false);
//         return;
//       }

//       drManager.start();

//       drManager.on('dr', ({ drPoint }) => {
//         setDrPath([...drManager.path]);
//         if (gps) drManager.updateDrift(drPoint, gps);
//       });

//       drManager.on('drift', (log) => {
//         setDriftLog([...log]);
//       });
//     }

//     return () => {
//       drManager.stop();
//     };
//   }, [running, hasGpsLock]);

//   const handleStart = () => {
//     setGpsPath([]);
//     setDrPath([]);
//     setDriftLog([]);
//     setRunning(true);
//   };

//   const handleStop = () => {
//     drManager.stop();
//     setRunning(false);
//   };

//   return (
//     <ScrollView style={{ flex: 1 }}>
//       <View style={{ height: 400 }}>
//         <MapView
//           ref={mapRef}
//           style={{ flex: 1 }}
//           region={{
//             latitude: gps?.latitude || 20.5937,
//             longitude: gps?.longitude || 78.9629,
//             latitudeDelta: 0.01,
//             longitudeDelta: 0.01,
//           }}
//         >
//           {gpsPath.length > 0 && (
//             <Polyline coordinates={gpsPath} strokeColor="blue" strokeWidth={4} />
//           )}
//           {drPath.length > 0 && (
//             <Polyline coordinates={drPath} strokeColor="red" strokeWidth={4} />
//           )}
//           {gps && (
//             <Marker
//               coordinate={{ latitude: gps.latitude, longitude: gps.longitude }}
//               title="GPS"
//               pinColor="blue"
//             />
//           )}
//           {drPath.length > 0 && (
//             <Marker
//               coordinate={drPath[drPath.length - 1]}
//               title="Dead Reckoning"
//               pinColor="red"
//             />
//           )}
//         </MapView>
//       </View>

//       <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10 }}>
//         <Button title="Start" onPress={handleStart} />
//         <Button title="Stop" onPress={handleStop} />
//       </View>

//       <View style={{ backgroundColor: '#fff', padding: 5 }}>
//         <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>
//           {hasGpsLock ? '🛰️ GPS Locked' : '⏳ Waiting for GPS...'}
//         </Text>

//         {gpsPath.map((p, i) => (
//           <Text key={i} style={{ fontSize: 12 }}>
//             Time: {new Date(p.timestamp).toLocaleTimeString()}, Lat: {p.latitude.toFixed(6)}, Lon:{' '}
//             {p.longitude.toFixed(6)}, Drift: {driftLog[i]?.drift?.toFixed(2) ?? '0'} m
//           </Text>
//         ))}
//       </View>

//       {driftLog.length > 0 && (
//         <LineChart
//           data={{
//             labels: driftLog.map((_, i) => i.toString()),
//             datasets: [{ data: driftLog.map((d) => d.drift) }],
//           }}
//           width={Dimensions.get('window').width - 20}
//           height={220}
//           yAxisSuffix="m"
//           chartConfig={{
//             backgroundColor: '#fff',
//             backgroundGradientFrom: '#fff',
//             backgroundGradientTo: '#fff',
//             decimalPlaces: 2,
//             color: (opacity = 1) => `rgba(255, 0, 0, ${opacity})`,
//             labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
//             style: { borderRadius: 16 },
//           }}
//           style={{ marginVertical: 8, borderRadius: 16 }}
//         />
//       )}
//     </ScrollView>
//   );
// }



// Full and FInal code with UI beauty but center zooming 


// import React, { useEffect, useState, useRef } from 'react';
// import { View, Button, Text, Dimensions, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
// import MapView, { Polyline, Marker } from 'react-native-maps';
// import * as Location from 'expo-location';
// import { LineChart } from 'react-native-chart-kit';
// import { Ionicons } from '@expo/vector-icons';
// import DeadReckoningManager from '../controllers/DeadReckoningManager';

// export default function DeadReckoning() {
//   const [gpsPath, setGpsPath] = useState([]);
//   const [drPath, setDrPath] = useState([]);
//   const [driftLog, setDriftLog] = useState([]);
//   const [running, setRunning] = useState(false);
//   const [gps, setGps] = useState(null);
//   const [hasGpsLock, setHasGpsLock] = useState(false);
//   const [fullscreen, setFullscreen] = useState(false);
//   const mapRef = useRef(null);
//   const drManager = useRef(new DeadReckoningManager()).current;
//   const gpsSubRef = useRef(null);

//   // --- GPS Watcher ---
//   useEffect(() => {
//     const startGps = async () => {
//       const { status } = await Location.requestForegroundPermissionsAsync();
//       if (status !== 'granted') {
//         alert('GPS permission required');
//         return;
//       }

//       gpsSubRef.current = await Location.watchPositionAsync(
//         {
//           accuracy: Location.Accuracy.Highest,
//           timeInterval: 1000,
//           distanceInterval: 0,
//         },
//         (loc) => {
//           setGps(loc.coords);
//           setGpsPath((prev) => [
//             ...prev.slice(-200),
//             {
//               latitude: loc.coords.latitude,
//               longitude: loc.coords.longitude,
//               timestamp: Date.now(),
//             },
//           ]);
//         }
//       );
//     };

//     startGps();
//     return () => gpsSubRef.current?.remove();
//   }, []);

//   // --- Set Initial GPS Lock ---
//   useEffect(() => {
//     if (gps && !hasGpsLock) {
//       drManager.setInitialGpsFix(gps);
//       setHasGpsLock(true);
//       console.log('✅ GPS Lock acquired at:', gps.latitude, gps.longitude);
//     }
//   }, [gps]);

//   // --- Dead Reckoning Start/Stop ---
//   useEffect(() => {
//     if (running) {
//       if (!hasGpsLock) {
//         alert('Waiting for GPS lock before starting Dead Reckoning...');
//         setRunning(false);
//         return;
//       }

//       drManager.start();

//       drManager.on('dr', ({ drPoint }) => {
//         setDrPath([...drManager.path]);
//         if (gps) drManager.updateDrift(drPoint, gps);

//         // Auto zoom to include latest movement
//         mapRef.current?.animateCamera({
//           center: {
//             latitude: drPoint.latitude,
//             longitude: drPoint.longitude,
//           },
//           zoom: 17,
//         });
//       });

//       drManager.on('drift', (log) => {
//         setDriftLog([...log.slice(-200)]);
//       });
//     }

//     return () => {
//       drManager.stop();
//     };
//   }, [running, hasGpsLock]);

//   // --- Controls ---
//   const handleStart = () => {
//     setGpsPath([]);
//     setDrPath([]);
//     setDriftLog([]);
//     setRunning(true);
//   };

//   const handleStop = () => {
//     drManager.stop();
//     setRunning(false);
//   };

//   // --- Toggle Fullscreen Map ---
//   const toggleFullscreen = () => {
//     setFullscreen(!fullscreen);
//   };

//   return (
//     <View style={{ flex: 1, backgroundColor: '#f8f9fb' }}>
//       <View style={fullscreen ? styles.fullscreenMapContainer : styles.mapContainer}>
//         <MapView
//           ref={mapRef}
//           style={{ flex: 1 }}
//           region={{
//             latitude: gps?.latitude || 20.5937,
//             longitude: gps?.longitude || 78.9629,
//             latitudeDelta: 0.01,
//             longitudeDelta: 0.01,
//           }}
//           showsUserLocation
//           followsUserLocation
//           showsCompass
//           showsScale
//         >
//           {gpsPath.length > 0 && (
//             <Polyline coordinates={gpsPath} strokeColor="#3498db" strokeWidth={5} />
//           )}
//           {drPath.length > 0 && (
//             <Polyline coordinates={drPath} strokeColor="#e74c3c" strokeWidth={5} />
//           )}
//           {gps && (
//             <Marker coordinate={gps} title="GPS" pinColor="#3498db" />
//           )}
//           {drPath.length > 0 && (
//             <Marker coordinate={drPath[drPath.length - 1]} title="Dead Reckoning" pinColor="#e74c3c" />
//           )}
//         </MapView>

//         {/* Fullscreen Toggle Button */}
//         <TouchableOpacity onPress={toggleFullscreen} style={styles.fullscreenBtn}>
//           <Ionicons name={fullscreen ? 'contract' : 'expand'} size={26} color="#fff" />
//         </TouchableOpacity>
//       </View>

//       {!fullscreen && (
//         <ScrollView style={{ flex: 1 }}>
//           <View style={styles.controls}>
//             <Button title="Start" onPress={handleStart} color="#2ecc71" />
//             <Button title="Stop" onPress={handleStop} color="#e74c3c" />
//           </View>

//           <View style={styles.statusCard}>
//             <Text style={styles.statusTitle}>
//               {hasGpsLock ? '🛰️ GPS Locked' : '⏳ Waiting for GPS...'}
//             </Text>
//             <Text style={styles.statusSub}>
//               {running ? 'Dead Reckoning Running...' : 'Idle'}
//             </Text>
//           </View>

//           <View style={styles.logsContainer}>
//             <Text style={styles.sectionTitle}>📜 Latest Logs</Text>
//             {gpsPath
//               .slice(-30)
//               .reverse()
//               .map((p, i) => (
//                 <Text key={i} style={styles.logLine}>
//                   🕒 {new Date(p.timestamp).toLocaleTimeString()} | 📍
//                   {p.latitude.toFixed(5)}, {p.longitude.toFixed(5)} | Drift:{' '}
//                   {driftLog[i]?.drift?.toFixed(2) ?? '0'} m
//                 </Text>
//               ))}
//           </View>

//           {driftLog.length > 0 && (
//             <View style={styles.chartContainer}>
//               <Text style={styles.sectionTitle}>📈 Drift Over Time</Text>
//               <LineChart
//                 data={{
//                   labels: driftLog.map((_, i) => i.toString()),
//                   datasets: [{ data: driftLog.map((d) => d.drift) }],
//                 }}
//                 width={Dimensions.get('window').width - 20}
//                 height={240}
//                 yAxisSuffix=" m"
//                 withShadow
//                 bezier
//                 chartConfig={{
//                   backgroundColor: '#fff',
//                   backgroundGradientFrom: '#f8f9fb',
//                   backgroundGradientTo: '#f8f9fb',
//                   decimalPlaces: 2,
//                   color: (opacity = 1) => `rgba(231, 76, 60, ${opacity})`,
//                   labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
//                   propsForDots: {
//                     r: '4',
//                     strokeWidth: '2',
//                     stroke: '#e74c3c',
//                   },
//                 }}
//                 style={styles.chartStyle}
//               />
//             </View>
//           )}
//         </ScrollView>
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   mapContainer: {
//     height: 400,
//     borderRadius: 12,
//     overflow: 'hidden',
//     margin: 10,
//     elevation: 3,
//   },
//   fullscreenMapContainer: {
//     ...StyleSheet.absoluteFillObject,
//     zIndex: 10,
//   },
//   fullscreenBtn: {
//     position: 'absolute',
//     bottom: 15,
//     right: 15,
//     backgroundColor: '#34495e',
//     borderRadius: 50,
//     padding: 10,
//     elevation: 6,
//   },
//   controls: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     marginVertical: 15,
//   },
//   statusCard: {
//     backgroundColor: '#fff',
//     margin: 10,
//     borderRadius: 12,
//     padding: 15,
//     elevation: 3,
//   },
//   statusTitle: {
//     fontWeight: 'bold',
//     fontSize: 16,
//     color: '#2c3e50',
//   },
//   statusSub: {
//     color: '#7f8c8d',
//     marginTop: 5,
//   },
//   logsContainer: {
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     padding: 10,
//     margin: 10,
//     elevation: 2,
//   },
//   logLine: {
//     fontSize: 12,
//     color: '#2c3e50',
//     borderBottomWidth: 0.5,
//     borderColor: '#ecf0f1',
//     paddingVertical: 2,
//   },
//   sectionTitle: {
//     fontWeight: 'bold',
//     fontSize: 15,
//     marginBottom: 5,
//     color: '#34495e',
//   },
//   chartContainer: {
//     backgroundColor: '#fff',
//     margin: 10,
//     borderRadius: 12,
//     padding: 10,
//     elevation: 3,
//   },
//   chartStyle: {
//     marginVertical: 8,
//     borderRadius: 12,
//   },
// });



// full and final code with UI beauty, resolved center zooming but not graph 

// import React, { useEffect, useState, useRef } from 'react';
// import {
//   View,
//   Button,
//   Text,
//   Dimensions,
//   ScrollView,
//   TouchableOpacity,
//   StyleSheet,
//   Alert,
// } from 'react-native';
// import MapView, { Polyline, Marker } from 'react-native-maps';
// import * as Location from 'expo-location';
// import { LineChart } from 'react-native-chart-kit';
// import { Ionicons } from '@expo/vector-icons';
// import DeadReckoningManager from '../controllers/DeadReckoningManager';

// export default function DeadReckoning() {
//   const [gpsPath, setGpsPath] = useState([]);
//   const [drPath, setDrPath] = useState([]);
//   const [driftLog, setDriftLog] = useState([]);
//   const [running, setRunning] = useState(false);
//   const [gps, setGps] = useState(null);
//   const [hasGpsLock, setHasGpsLock] = useState(false);
//   const [fullscreen, setFullscreen] = useState(false);
//   const [userInteracted, setUserInteracted] = useState(false);

//   const mapRef = useRef(null);
//   const gpsSubRef = useRef(null);
//   const drManagerRef = useRef(new DeadReckoningManager());
//   const drManager = drManagerRef.current;

//   // Start GPS watcher once (on mount)
//   useEffect(() => {
//     let mounted = true;
//     (async () => {
//       const { status } = await Location.requestForegroundPermissionsAsync();
//       if (!mounted) return;
//       if (status !== 'granted') {
//         Alert.alert('Permission', 'GPS permission required');
//         return;
//       }
//       gpsSubRef.current = await Location.watchPositionAsync(
//         {
//           accuracy: Location.Accuracy.Highest,
//           timeInterval: 1000,
//           distanceInterval: 0,
//         },
//         (loc) => {
//           setGps(loc.coords);
//           setGpsPath((prev) => {
//             const next = [...prev.slice(-199), { latitude: loc.coords.latitude, longitude: loc.coords.longitude, timestamp: Date.now() }];
//             return next;
//           });
//         }
//       );
//     })();

//     return () => {
//       mounted = false;
//       gpsSubRef.current?.remove();
//     };
//   }, []);

//   // When first gps arrives, give initial fix to DR manager (only once)
//   useEffect(() => {
//     if (gps && !hasGpsLock) {
//       drManager.setInitialGpsFix(gps);
//       setHasGpsLock(true);
//       pushLog(`🛰️ GPS Lock at ${gps.latitude.toFixed(5)}, ${gps.longitude.toFixed(5)}`);
//     }
//   }, [gps]);

//   // Attach DR manager event listeners once (mount) to avoid duplicates
//   useEffect(() => {
//     const onDR = ({ drPoint }) => {
//       // update drPath from manager's internal path (keeps single source of truth)
//       setDrPath([...drManager.path]);
//       // compute drift using latest GPS if available
//       if (gps) drManager.updateDrift(drPoint, gps);
//     };

//     const onDrift = (log) => {
//       setDriftLog([...log.slice(-500)]); // keep reasonable buffer
//     };

//     const onStopped = ({ path }) => {
//       pushLog(`🛑 DR stopped. Steps: ${path.length}`);
//     };

//     const onError = (msg) => {
//       pushLog(`⚠️ ${msg}`);
//     };

//     drManager.on('dr', onDR);
//     drManager.on('drift', onDrift);
//     drManager.on('stopped', onStopped);
//     drManager.on('error', onError);

//     return () => {
//       drManager.off('dr', onDR);
//       drManager.off('drift', onDrift);
//       drManager.off('stopped', onStopped);
//       drManager.off('error', onError);
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []); // run once

//   // Logs state (top 30 shown)
//   const [logs, setLogs] = useState([]);
//   const pushLog = (text) => {
//     setLogs((prev) => {
//       const next = [text, ...prev].slice(0, 200); // keep more history internal
//       return next;
//     });
//   };

//   // Start/stop handlers — prevent double starts
//   const handleStart = () => {
//     if (running) return; // already running
//     if (!hasGpsLock) {
//       Alert.alert('GPS', 'Waiting for GPS lock before starting Dead Reckoning.');
//       return;
//     }

//     // Clear old session data
//     setGpsPath([]);
//     setDrPath([]);
//     setDriftLog([]);
//     setUserInteracted(false);

//     // Start manager and UI running state
//     try {
//       drManager.start();
//       setRunning(true);
//       pushLog('▶️ Dead Reckoning started');
//     } catch (e) {
//       pushLog(`⚠️ Failed to start DR: ${String(e)}`);
//     }
//   };

//   const handleStop = () => {
//     if (!running) return;
//     drManager.stop();
//     setRunning(false);
//     pushLog('⏹️ Dead Reckoning stopped');
//   };

//   const toggleFullscreen = () => setFullscreen((s) => !s);

//   // Mark user interaction — once user interacts, we will not auto-center.
//   const handleRegionChangeComplete = () => {
//     if (!userInteracted) setUserInteracted(true);
//   };

//   // Map initial region; do NOT set region dynamically (prevents auto-centering)
//   const initialRegion = {
//     latitude: gps?.latitude || 20.5937,
//     longitude: gps?.longitude || 78.9629,
//     latitudeDelta: 0.01,
//     longitudeDelta: 0.01,
//   };

//   // Display last 30 logs
//   const displayedLogs = logs.slice(0, 30);

//   return (
//     <View style={{ flex: 1, backgroundColor: '#f6f8fa' }}>
//       <View style={fullscreen ? styles.fullscreenMapContainer : styles.mapContainer}>
//         <MapView
//           ref={mapRef}
//           style={{ flex: 1 }}
//           initialRegion={initialRegion}
//           showsUserLocation={true}
//           showsCompass={true}
//           showsScale={true}
//           onRegionChangeComplete={handleRegionChangeComplete}
//         >
//           {gpsPath.length > 0 && (
//             <Polyline coordinates={gpsPath} strokeColor="#3498db" strokeWidth={4} lineJoin="round" />
//           )}
//           {drPath.length > 0 && (
//             <Polyline coordinates={drPath} strokeColor="#e74c3c" strokeWidth={4} lineJoin="round" />
//           )}
//           {gps && <Marker coordinate={gps} title="GPS" pinColor="#3498db" />}
//           {drPath.length > 0 && <Marker coordinate={drPath[drPath.length - 1]} title="Dead Reckoning" pinColor="#e74c3c" />}
//         </MapView>

//         <TouchableOpacity onPress={toggleFullscreen} style={styles.fullscreenBtn}>
//           <Ionicons name={fullscreen ? 'contract' : 'expand'} size={22} color="#fff" />
//         </TouchableOpacity>
//       </View>

//       {!fullscreen && (
//         <>
//           <View style={styles.controls}>
//             <View style={{ flex: 1, marginRight: 6 }}>
//               <Button title="Start" onPress={handleStart} color="#2ecc71" disabled={running} />
//             </View>
//             <View style={{ flex: 1, marginLeft: 6 }}>
//               <Button title="Stop" onPress={handleStop} color="#e74c3c" disabled={!running} />
//             </View>
//           </View>

//           <View style={styles.statusCard}>
//             <Text style={styles.statusTitle}>{hasGpsLock ? '🛰️ GPS Locked' : '⏳ Waiting for GPS...'}</Text>
//             <Text style={styles.statusSub}>{running ? 'Dead Reckoning Running' : 'Idle'}</Text>
//             <Text style={{ marginTop: 6, color: '#444' }}>
//               {userInteracted ? 'Map: manual mode (no auto-centering)' : 'Map: auto-follow disabled (you can pan/zoom)'}
//             </Text>
//           </View>

//           <View style={styles.logsContainer}>
//             <Text style={styles.sectionTitle}>📜 Latest Logs (top 30)</Text>
//             <ScrollView style={{ maxHeight: 160 }}>
//               {displayedLogs.map((l, i) => (
//                 <Text key={i} style={styles.logLine}>
//                   {l}
//                 </Text>
//               ))}
//             </ScrollView>
//           </View>

//           {driftLog.length > 0 && (
//             <View style={styles.chartContainer}>
//               <Text style={styles.sectionTitle}>📈 Drift (meters)</Text>
//               <LineChart
//                 data={{
//                   labels: driftLog.map((_, i) => i.toString()).slice(-20),
//                   datasets: [{ data: driftLog.map((d) => d.drift).slice(-20) }],
//                 }}
//                 width={Dimensions.get('window').width - 24}
//                 height={220}
//                 yAxisSuffix=" m"
//                 withShadow
//                 bezier
//                 chartConfig={{
//                   backgroundColor: '#fff',
//                   backgroundGradientFrom: '#fff',
//                   backgroundGradientTo: '#fff',
//                   decimalPlaces: 2,
//                   color: (opacity = 1) => `rgba(231, 76, 60, ${opacity})`,
//                   labelColor: (opacity = 1) => `rgba(0,0,0,${opacity})`,
//                   propsForDots: { r: '3', strokeWidth: '1', stroke: '#e74c3c' },
//                 }}
//                 style={{ borderRadius: 12 }}
//               />
//             </View>
//           )}
//         </>
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   mapContainer: {
//     height: 420,
//     borderRadius: 12,
//     overflow: 'hidden',
//     margin: 12,
//     elevation: 3,
//   },
//   fullscreenMapContainer: {
//     ...StyleSheet.absoluteFillObject,
//     zIndex: 20,
//   },
//   fullscreenBtn: {
//     position: 'absolute',
//     bottom: 14,
//     right: 14,
//     backgroundColor: '#34495e',
//     borderRadius: 28,
//     padding: 10,
//     elevation: 6,
//   },
//   controls: {
//     flexDirection: 'row',
//     paddingHorizontal: 12,
//     marginBottom: 8,
//   },
//   statusCard: {
//     backgroundColor: '#fff',
//     marginHorizontal: 12,
//     borderRadius: 10,
//     padding: 12,
//     elevation: 2,
//     marginBottom: 8,
//   },
//   statusTitle: {
//     fontWeight: '700',
//     fontSize: 16,
//     color: '#2c3e50',
//   },
//   statusSub: {
//     color: '#7f8c8d',
//     marginTop: 4,
//   },
//   logsContainer: {
//     backgroundColor: '#fff',
//     marginHorizontal: 12,
//     borderRadius: 10,
//     padding: 10,
//     elevation: 1,
//   },
//   logLine: {
//     fontSize: 13,
//     color: '#2c3e50',
//     paddingVertical: 4,
//     borderBottomWidth: 0.5,
//     borderColor: '#ecf0f1',
//   },
//   sectionTitle: {
//     fontWeight: '700',
//     marginBottom: 6,
//     color: '#34495e',
//   },
//   chartContainer: {
//     backgroundColor: '#fff',
//     margin: 12,
//     borderRadius: 12,
//     padding: 10,
//     elevation: 2,
//   },
// });


// full final code with UI beauty, resolved center zooming and graph pop up feature

// import React, { useEffect, useState, useRef } from 'react';
// import { View, Button, Text, Dimensions, ScrollView, TouchableOpacity, Modal, Image, StyleSheet, Alert } from 'react-native';
// import MapView, { Polyline, Marker } from 'react-native-maps';
// import * as Location from 'expo-location';
// import { LineChart } from 'react-native-chart-kit';
// import * as FileSystem from 'expo-file-system';
// import * as MediaLibrary from 'expo-media-library';
// import DeadReckoningManager from '../controllers/DeadReckoningManager';

// export default function DeadReckoning() {
//   const [gpsPath, setGpsPath] = useState([]);
//   const [drPath, setDrPath] = useState([]);
//   const [driftLog, setDriftLog] = useState([]);
//   const [running, setRunning] = useState(false);
//   const [gps, setGps] = useState(null);
//   const [gpsLocked, setGpsLocked] = useState(false);
//   const [showGraph, setShowGraph] = useState(false);
//   const [mapImage, setMapImage] = useState(null);
//   const mapRef = useRef(null);
//   const drManager = useRef(new DeadReckoningManager()).current;

//   const startGps = async () => {
//     const { status } = await Location.requestForegroundPermissionsAsync();
//     if (status !== 'granted') return alert('GPS permission required');
//     const sub = await Location.watchPositionAsync(
//       { accuracy: Location.Accuracy.Highest, distanceInterval: 0, timeInterval: 1000 },
//       (loc) => {
//         setGps(loc.coords);
//         setGpsPath(prev => [...prev, { latitude: loc.coords.latitude, longitude: loc.coords.longitude, timestamp: Date.now() }]);
//         if (!drManager.haveGpsLock) {
//           drManager.setInitialGpsFix(loc.coords);
//           setGpsLocked(true);
//         }
//       }
//     );
//     return sub;
//   };

//   useEffect(() => {
//     let gpsSub;
//     if (running) {
//       startGps().then(sub => { gpsSub = sub; });
//       drManager.start();

//       drManager.on('dr', ({ drPoint }) => {
//         setDrPath([...drManager.path]);
//         if (gps) drManager.updateDrift(drPoint, gps);
//       });

//       drManager.on('drift', (log) => {
//         setDriftLog([...log]);
//       });
//     }

//     return () => {
//       if (gpsSub) gpsSub.remove();
//       drManager.stop();
//     };
//   }, [running]);

//   const handleStart = () => {
//     setGpsPath([]);
//     setDrPath([]);
//     setDriftLog([]);
//     setGpsLocked(false);
//     setRunning(true);
//   };

//   const handleStop = async () => {
//     drManager.stop();
//     setRunning(false);
//     setShowGraph(true);
//   };

//   const downloadGraph = async (uri, name) => {
//     try {
//       const { status } = await MediaLibrary.requestPermissionsAsync();
//       if (status !== 'granted') return Alert.alert('Permission needed', 'Media access required to save file.');
//       const fileUri = `${FileSystem.documentDirectory}${name}.png`;
//       await FileSystem.copyAsync({ from: uri, to: fileUri });
//       await MediaLibrary.createAssetAsync(fileUri);
//       Alert.alert('✅ Saved', `${name} saved to gallery.`);
//     } catch (err) {
//       console.log(err);
//       Alert.alert('Error saving', err.message);
//     }
//   };

//   return (
//     <View style={{ flex: 1, backgroundColor: '#f3f4f6' }}>
//       <View style={{ height: 420, borderRadius: 10, overflow: 'hidden', margin: 10 }}>
//         <MapView
//           ref={mapRef}
//           style={{ flex: 1 }}
//           initialRegion={{
//             latitude: gps?.latitude || 20.5937,
//             longitude: gps?.longitude || 78.9629,
//             latitudeDelta: 0.01,
//             longitudeDelta: 0.01,
//           }}
//           showsUserLocation
//           followsUserLocation={false}
//           zoomEnabled
//           scrollEnabled
//         >
//           {gpsPath.length > 0 && <Polyline coordinates={gpsPath} strokeColor="blue" strokeWidth={4} />}
//           {drPath.length > 0 && <Polyline coordinates={drPath} strokeColor="red" strokeWidth={4} />}
//           {gps && <Marker coordinate={{ latitude: gps.latitude, longitude: gps.longitude }} title="GPS" pinColor="blue" />}
//         </MapView>
//       </View>

//       <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10 }}>
//         <TouchableOpacity
//           style={[styles.btn, { backgroundColor: running ? '#ccc' : '#4caf50' }]}
//           disabled={running}
//           onPress={handleStart}
//         >
//           <Text style={styles.btnText}>Start</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={[styles.btn, { backgroundColor: !running ? '#ccc' : '#e53935' }]}
//           disabled={!running}
//           onPress={handleStop}
//         >
//           <Text style={styles.btnText}>Stop</Text>
//         </TouchableOpacity>
//       </View>

//       {gpsLocked && (
//         <View style={styles.lockContainer}>
//           <Text style={{ color: 'green', fontWeight: '600' }}>✅ GPS Locked</Text>
//         </View>
//       )}

//       {/* Logs Section */}
//       <ScrollView style={styles.logContainer}>
//         <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Recent Logs (Top 30):</Text>
//         {gpsPath.slice(-30).map((p, i) => (
//           <Text key={i} style={{ fontSize: 12 }}>
//             ⏱ {new Date(p.timestamp).toLocaleTimeString()} | 📍 {p.latitude.toFixed(6)}, {p.longitude.toFixed(6)} | Drift: {driftLog[i]?.drift?.toFixed(2) ?? 0} m
//           </Text>
//         ))}
//       </ScrollView>

//       {/* Graph Modal */}
//       <Modal visible={showGraph} transparent animationType="slide">
//         <View style={styles.modalContainer}>
//           <View style={styles.graphBox}>
//             <Text style={styles.graphTitle}>📊 Drift Graph</Text>
//             {driftLog.length > 0 ? (
//               <LineChart
//                 data={{
//                   labels: driftLog.map((_, i) => ''),
//                   datasets: [{ data: driftLog.map(d => d.drift) }],
//                 }}
//                 width={Dimensions.get('window').width - 40}
//                 height={250}
//                 yAxisSuffix="m"
//                 chartConfig={{
//                   backgroundColor: '#fff',
//                   backgroundGradientFrom: '#f8f8f8',
//                   backgroundGradientTo: '#f8f8f8',
//                   decimalPlaces: 2,
//                   color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
//                   labelColor: () => '#000',
//                   propsForDots: { r: '4', strokeWidth: '2', stroke: '#ff6384' },
//                 }}
//                 bezier
//                 style={{ borderRadius: 12 }}
//               />
//             ) : (
//               <Text>No drift data available</Text>
//             )}
//             <TouchableOpacity onPress={() => setShowGraph(false)} style={styles.closeBtn}>
//               <Text style={{ color: 'white', fontWeight: 'bold' }}>Close</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   btn: {
//     paddingVertical: 12,
//     paddingHorizontal: 25,
//     borderRadius: 8,
//     elevation: 3,
//   },
//   btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
//   lockContainer: {
//     alignItems: 'center',
//     marginVertical: 5,
//   },
//   logContainer: {
//     maxHeight: 160,
//     backgroundColor: '#fff',
//     margin: 10,
//     padding: 8,
//     borderRadius: 10,
//   },
//   modalContainer: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.6)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   graphBox: {
//     backgroundColor: '#fff',
//     borderRadius: 15,
//     padding: 15,
//     alignItems: 'center',
//   },
//   graphTitle: {
//     fontWeight: 'bold',
//     fontSize: 18,
//     marginBottom: 10,
//   },
//   closeBtn: {
//     marginTop: 10,
//     backgroundColor: '#2196f3',
//     paddingHorizontal: 20,
//     paddingVertical: 10,
//     borderRadius: 10,
//   },
// });




// import React, { useEffect, useState, useRef } from 'react';
// import { View, Text, Dimensions, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
// import MapView, { Polyline, Marker } from 'react-native-maps';
// import * as Location from 'expo-location';
// import { LineChart } from 'react-native-chart-kit';
// import DeadReckoningManager from '../controllers/DeadReckoningManager';

// export default function DeadReckoning() {
//   const [gpsPath, setGpsPath] = useState([]);
//   const [drPath, setDrPath] = useState([]);
//   const [driftLog, setDriftLog] = useState([]);
//   const [running, setRunning] = useState(false);
//   const [gps, setGps] = useState(null);
//   const [gpsLocked, setGpsLocked] = useState(false);
//   const mapRef = useRef(null);
//   const drManager = useRef(new DeadReckoningManager()).current;

//   const startGps = async () => {
//     const { status } = await Location.requestForegroundPermissionsAsync();
//     if (status !== 'granted') return alert('GPS permission required');

//     const sub = await Location.watchPositionAsync(
//       { accuracy: Location.Accuracy.Highest, distanceInterval: 0, timeInterval: 1000 },
//       (loc) => {
//         setGps(loc.coords);
//         setGpsPath(prev => [...prev, { latitude: loc.coords.latitude, longitude: loc.coords.longitude, timestamp: Date.now() }]);

//         if (!drManager.haveGpsLock) {
//           drManager.setInitialGpsFix(loc.coords);
//           setGpsLocked(true);
//         }
//       }
//     );
//     return sub;
//   };

//   useEffect(() => {
//     let gpsSub;
//     if (running) {
//       startGps().then(sub => { gpsSub = sub; });
//       drManager.start();

//       drManager.on('dr', ({ drPoint }) => {
//         setDrPath([...drManager.path]);
//         if (gps) drManager.updateDrift(drPoint, gps);
//       });

//       drManager.on('drift', (log) => {
//         // Maintain max 30 entries, newest first
//         const newLog = [...log].slice(-30).reverse();
//         setDriftLog(newLog);
//       });
//     }

//     return () => {
//       if (gpsSub) gpsSub.remove();
//       drManager.stop();
//     };
//   }, [running]);

//   const handleStart = () => {
//     setGpsPath([]);
//     setDrPath([]);
//     setDriftLog([]);
//     setGpsLocked(false);
//     setRunning(true);
//   };

//   const handleStop = () => {
//     drManager.stop();
//     setRunning(false);
//   };

//   return (
//     <ScrollView style={{ flex: 1, backgroundColor: '#f3f4f6' }}>
//       {/* Map */}
//       <View style={{ height: 420, borderRadius: 10, overflow: 'hidden', margin: 10 }}>
//         <MapView
//           ref={mapRef}
//           style={{ flex: 1 }}
//           initialRegion={{
//             latitude: gps?.latitude || 20.5937,
//             longitude: gps?.longitude || 78.9629,
//             latitudeDelta: 0.01,
//             longitudeDelta: 0.01,
//           }}
//           showsUserLocation={false}
//           zoomEnabled
//           scrollEnabled
//         >
//           {gpsPath.length > 0 && <Polyline coordinates={gpsPath} strokeColor="blue" strokeWidth={4} />}
//           {drPath.length > 0 && <Polyline coordinates={drPath} strokeColor="red" strokeWidth={4} />}

//           {gps && (
//             <Marker
//               coordinate={{ latitude: gps.latitude, longitude: gps.longitude }}
//               title="GPS"
//             >
//               <View style={styles.blueDot} />
//             </Marker>
//           )}

//           {drPath.length > 0 && (
//             <Marker
//               coordinate={drPath[drPath.length - 1]}
//               title="DR"
//             >
//               <View style={styles.redDot} />
//             </Marker>
//           )}
//         </MapView>
//       </View>

//       {/* Start/Stop Buttons */}
//       <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10 }}>
//         <TouchableOpacity
//           style={[styles.btn, { backgroundColor: running ? '#ccc' : '#4caf50' }]}
//           disabled={running}
//           onPress={handleStart}
//         >
//           <Text style={styles.btnText}>Start</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={[styles.btn, { backgroundColor: !running ? '#ccc' : '#e53935' }]}
//           disabled={!running}
//           onPress={handleStop}
//         >
//           <Text style={styles.btnText}>Stop</Text>
//         </TouchableOpacity>
//       </View>

//       {gpsLocked && (
//         <View style={styles.lockContainer}>
//           <Text style={{ color: 'green', fontWeight: '600' }}>✅ GPS Locked</Text>
//         </View>
//       )}

//       {/* Real-Time Drift Graph */}
//       {driftLog.length > 0 && (
//         <View style={{ margin: 10 }}>
//           <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>📊 Real-Time Drift Graph:</Text>
//           <LineChart
//             data={{
//               labels: driftLog.map((_, i) => ''),
//               datasets: [{ data: driftLog.map(d => d.drift) }],
//             }}
//             width={Dimensions.get('window').width - 20}
//             height={200}
//             yAxisSuffix="m"
//             chartConfig={{
//               backgroundColor: '#fff',
//               backgroundGradientFrom: '#f8f8f8',
//               backgroundGradientTo: '#f8f8f8',
//               decimalPlaces: 2,
//               color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
//               labelColor: () => '#000',
//               propsForDots: { r: '4', strokeWidth: '2', stroke: '#ff6384' },
//             }}
//             bezier
//             style={{ borderRadius: 12 }}
//           />
//         </View>
//       )}

//       {/* Logs */}
//       <View style={styles.logContainer}>
//         <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Recent Logs (Newest First, max 30):</Text>
//         {driftLog.map((entry, i) => (
//           <Text key={i} style={{ fontSize: 12 }}>
//             ⏱ {new Date(entry.timestamp).toLocaleTimeString()} | Drift: {entry.drift.toFixed(2)} m
//           </Text>
//         ))}
//       </View>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   btn: {
//     paddingVertical: 12,
//     paddingHorizontal: 25,
//     borderRadius: 8,
//     elevation: 3,
//   },
//   btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
//   lockContainer: {
//     alignItems: 'center',
//     marginVertical: 5,
//   },
//   logContainer: {
//     maxHeight: 300,
//     backgroundColor: '#fff',
//     margin: 10,
//     padding: 8,
//     borderRadius: 10,
//   },
//   blueDot: {
//     width: 18,
//     height: 18,
//     borderRadius: 9,
//     backgroundColor: 'blue',
//     borderWidth: 2,
//     borderColor: 'white',
//   },
//   redDot: {
//     width: 18,
//     height: 18,
//     borderRadius: 9,
//     backgroundColor: 'red',
//     borderWidth: 2,
//     borderColor: 'white',
//   },
// });



import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Dimensions, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { LineChart } from 'react-native-chart-kit';
import DeadReckoningManager from '../controllers/DeadReckoningManager';

export default function DeadReckoning() {
  const [gpsPath, setGpsPath] = useState([]);
  const [drPath, setDrPath] = useState([]);
  const [driftLog, setDriftLog] = useState([]);
  const [running, setRunning] = useState(false);
  const [gps, setGps] = useState(null);
  const [gpsLocked, setGpsLocked] = useState(false);
  const mapRef = useRef(null);
  const drManager = useRef(new DeadReckoningManager()).current;

  const startGps = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return alert('GPS permission required');

    const sub = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Highest, distanceInterval: 0, timeInterval: 1000 },
      (loc) => {
        setGps(loc.coords);
        setGpsPath(prev => [...prev, { latitude: loc.coords.latitude, longitude: loc.coords.longitude, timestamp: Date.now() }]);

        if (!drManager.haveGpsLock) {
          drManager.setInitialGpsFix(loc.coords);
          setGpsLocked(true);
        }
      }
    );
    return sub;
  };

  useEffect(() => {
    let gpsSub;
    if (running) {
      startGps().then(sub => { gpsSub = sub; });
      drManager.start();

      drManager.on('dr', ({ drPoint }) => {
        setDrPath([...drManager.path]);
        if (gps) drManager.updateDrift(drPoint, gps);
      });

      drManager.on('drift', (log) => {
        // Maintain max 30 entries, newest first
        const newLog = [...log].slice(-30).reverse();
        setDriftLog(newLog);
      });
    }

    return () => {
      if (gpsSub) gpsSub.remove();
      drManager.stop();
    };
  }, [running]);

  const handleStart = () => {
    setGpsPath([]);
    setDrPath([]);
    setDriftLog([]);
    setGpsLocked(false);
    setRunning(true);
  };

  const handleStop = () => {
    drManager.stop();
    setRunning(false);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f3f4f6' }}>
      {/* Map */}
      <View style={{ height: 420, borderRadius: 10, overflow: 'hidden', margin: 10 }}>
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          initialRegion={{
            latitude: gps?.latitude || 20.5937,
            longitude: gps?.longitude || 78.9629,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation={false}
          zoomEnabled
          scrollEnabled
        >
          {gpsPath.length > 0 && <Polyline coordinates={gpsPath} strokeColor="blue" strokeWidth={4} />}
          {drPath.length > 0 && <Polyline coordinates={drPath} strokeColor="red" strokeWidth={4} />}

          {gps && (
            <Marker
              coordinate={{ latitude: gps.latitude, longitude: gps.longitude }}
              title="GPS"
              pinColor="blue" // Standard Google Maps blue dot
            />
          )}

          {drPath.length > 0 && (
            <Marker
              coordinate={drPath[drPath.length - 1]}
              title="DR"
              pinColor="red" // Standard Google Maps red dot
            />
          )}
        </MapView>
      </View>

      {/* Start/Stop Buttons */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10 }}>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: running ? '#ccc' : '#4caf50' }]}
          disabled={running}
          onPress={handleStart}
        >
          <Text style={styles.btnText}>Start</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: !running ? '#ccc' : '#e53935' }]}
          disabled={!running}
          onPress={handleStop}
        >
          <Text style={styles.btnText}>Stop</Text>
        </TouchableOpacity>
      </View>

      {gpsLocked && (
        <View style={styles.lockContainer}>
          <Text style={{ color: 'green', fontWeight: '600' }}>✅ GPS Locked</Text>
        </View>
      )}

      {/* Real-Time Drift Graph */}
      {driftLog.length > 0 && (
        <View style={{ margin: 10 }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>📊 Real-Time Drift Graph:</Text>
          <LineChart
            data={{
              labels: driftLog.map((_, i) => ''),
              datasets: [{ data: driftLog.map(d => d.drift) }],
            }}
            width={Dimensions.get('window').width - 20}
            height={200}
            yAxisSuffix="m"
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#f8f8f8',
              backgroundGradientTo: '#f8f8f8',
              decimalPlaces: 2,
              color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
              labelColor: () => '#000',
              propsForDots: { r: '4', strokeWidth: '2', stroke: '#ff6384' },
            }}
            bezier
            style={{ borderRadius: 12 }}
          />
        </View>
      )}

      {/* Logs */}
      <View style={styles.logContainer}>
        <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Recent Logs (Newest First, max 30):</Text>
        {driftLog.map((entry, i) => (
          <Text key={i} style={{ fontSize: 12 }}>
            ⏱ {new Date(entry.timestamp).toLocaleTimeString()} | Drift: {entry.drift.toFixed(2)} m
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    elevation: 3,
  },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  lockContainer: {
    alignItems: 'center',
    marginVertical: 5,
  },
  logContainer: {
    maxHeight: 300,
    backgroundColor: '#fff',
    margin: 10,
    padding: 8,
    borderRadius: 10,
  },
});
