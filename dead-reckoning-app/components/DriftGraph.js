import React from 'react';
import { View, Text } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const DriftGraph = ({ driftLog }) => {
  if (!driftLog.length) return null;

  const times = driftLog.map((d) => ((d.time - driftLog[0].time) / 1000).toFixed(1));
  const values = driftLog.map((d) => d.drift);

  return (
    <View>
      <Text style={{ fontWeight: 'bold', textAlign: 'center', marginVertical: 8 }}>
        Drift Over Time
      </Text>
      <LineChart
        data={{
          labels: times.slice(-10),
          datasets: [{ data: values.slice(-10) }],
        }}
        width={Dimensions.get('window').width - 30}
        height={220}
        chartConfig={{
          backgroundColor: '#fff',
          backgroundGradientFrom: '#f8f8f8',
          backgroundGradientTo: '#f8f8f8',
          decimalPlaces: 2,
          color: () => '#3498db',
          labelColor: () => '#333',
        }}
        bezier
        style={{ borderRadius: 16 }}
      />
    </View>
  );
};

export default DriftGraph;
