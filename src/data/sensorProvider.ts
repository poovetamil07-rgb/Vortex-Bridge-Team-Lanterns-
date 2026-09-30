import { SensorData } from '../types/bridge';

export interface ESP32Payload {
  timestamp: number;
  accelerationX: number;
  accelerationY: number;
  accelerationZ: number;
  voltage: number;
  current: number;
  temperature: number;
  rssi?: number;
}

export interface SensorDataProvider {
  getLatestReading: () => ESP32Payload;
  isConnected: () => boolean;
  getMode: () => 'SIMULATION' | 'ESP32_LIVE';
}

export const INITIAL_SENSORS: SensorData[] = [
  {
    id: 'ACC-01',
    name: 'Main Span Midpoint Accelerometer',
    type: 'accelerometer',
    location: 'Main Span 1 (x = 0.50)',
    xPos: 0.50,
    yPos: 0,
    zPos: 0,
    status: 'online',
    currentValue: 0.021,
    unit: 'g',
    batteryLevel: 98,
    lastUpdate: 'Just now',
    history: [0.018, 0.019, 0.022, 0.020, 0.021, 0.025, 0.021]
  },
  {
    id: 'ACC-02',
    name: 'Quarter Span Modal Accelerometer',
    type: 'accelerometer',
    location: 'Main Span 1 (x = 0.25)',
    xPos: 0.25,
    yPos: 0,
    zPos: 2.5,
    status: 'online',
    currentValue: 0.015,
    unit: 'g',
    batteryLevel: 94,
    lastUpdate: 'Just now',
    history: [0.012, 0.014, 0.015, 0.016, 0.015, 0.014, 0.015]
  },
  {
    id: 'STR-01',
    name: 'South Tower Base Optical Strain Gauge',
    type: 'strain_gauge',
    location: 'Tower 1 Pier Base (x = 0.105)',
    xPos: 0.105,
    yPos: -12,
    zPos: -7,
    status: 'online',
    currentValue: 142.4,
    unit: 'µε',
    batteryLevel: 96,
    lastUpdate: 'Just now',
    history: [138, 140, 141, 143, 142.4]
  },
  {
    id: 'STR-02',
    name: 'North Tower Main Cable Anchor Strain',
    type: 'strain_gauge',
    location: 'Tower 2 Saddle (x = 0.895)',
    xPos: 0.895,
    yPos: 44,
    zPos: 7,
    status: 'online',
    currentValue: 310.8,
    unit: 'µε',
    batteryLevel: 92,
    lastUpdate: 'Just now',
    history: [305, 308, 309, 312, 310.8]
  },
  {
    id: 'DSP-01',
    name: 'Laser Optical Deck Displacement Meter',
    type: 'displacement',
    location: 'Main Span 2 Midpoint (x = 0.70)',
    xPos: 0.70,
    yPos: 0,
    zPos: 0,
    status: 'online',
    currentValue: 12.4,
    unit: 'mm',
    batteryLevel: 100,
    lastUpdate: 'Just now',
    history: [10.2, 11.0, 11.8, 12.4, 12.1]
  },
  {
    id: 'PZT-01',
    name: 'Piezoelectric Cantilever Harvester Unit 1',
    type: 'piezoelectric',
    location: 'Main Span Underdeck (x = 0.48)',
    xPos: 0.48,
    yPos: -2.8,
    zPos: -3.5,
    status: 'online',
    currentValue: 42.0,
    unit: 'mW',
    batteryLevel: 64,
    lastUpdate: 'Just now',
    history: [28, 32, 36, 40, 42]
  },
  {
    id: 'WND-01',
    name: 'Tower 1 Ultrasonic 3D Anemometer',
    type: 'wind_sensor',
    location: 'Tower 1 Pinnacle (x = 0.105)',
    xPos: 0.105,
    yPos: 48,
    zPos: 0,
    status: 'online',
    currentValue: 18.0,
    unit: 'm/s',
    batteryLevel: 100,
    lastUpdate: 'Just now',
    history: [17.5, 17.8, 18.0, 18.2, 18.0]
  },
  {
    id: 'TMP-01',
    name: 'Thermocouple Ambient & Steel Core',
    type: 'temperature',
    location: 'Truss Chord 4 (x = 0.35)',
    xPos: 0.35,
    yPos: -1.5,
    zPos: 0,
    status: 'online',
    currentValue: 21.4,
    unit: '°C',
    batteryLevel: 95,
    lastUpdate: 'Just now',
    history: [21.1, 21.2, 21.3, 21.4]
  }
];

export class SimulationDataProvider implements SensorDataProvider {
  getLatestReading(): ESP32Payload {
    const t = Date.now() / 1000;
    return {
      timestamp: Date.now(),
      accelerationX: Number((Math.sin(t * 2.6) * 0.005).toFixed(4)),
      accelerationY: Number((Math.sin(t * 2.64) * 0.021 + Math.cos(t * 5.2) * 0.004).toFixed(4)),
      accelerationZ: Number((Math.cos(t * 2.64) * 0.008).toFixed(4)),
      voltage: Number((3.65 + Math.sin(t * 0.1) * 0.05).toFixed(2)),
      current: Number((11.4 + Math.sin(t * 2.64) * 4.2).toFixed(2)),
      temperature: 21.4,
      rssi: -58
    };
  }

  isConnected(): boolean {
    return true;
  }

  getMode(): 'SIMULATION' | 'ESP32_LIVE' {
    return 'SIMULATION';
  }
}
