export interface BridgeGeometry {
  span1: number;       // Side span 1 (m) - default 22.5
  mainSpan1: number;   // Main span 1 (m) - default 85.0
  mainSpan2: number;   // Main span 2 (m) - default 85.0
  span4: number;       // Side span 2 (m) - default 22.5
  deckWidth: number;   // Deck width (m) - default 14.0
  deckThickness: number; // Aerodynamic characteristic height (m) - default 2.8
  towerHeight: number; // Height above deck (m) - default 48.0
  cableSag: number;    // Mid-span sag (m) - default 14.0
  cableDiameter: number; // Cable diameter (m) - default 0.28
}

export type MaterialType = 'steel' | 'concrete' | 'composite' | 'custom';

export interface BridgeMaterial {
  type: MaterialType;
  name: string;
  youngsModulus: number; // E in Pascals (e.g. 2.05e11 for steel)
  density: number;       // Density in kg/m3 (e.g. 7850)
  poissonRatio: number;  // Poisson's ratio (e.g. 0.30)
  dampingRatio: number;  // Structural damping zeta (e.g. 0.015)
}

export interface BridgeStructural {
  deckMass: number;      // kg/m (e.g. 8500)
  deckStiffness: number; // EI in N*m2 (e.g. 1.8e9)
  towerStiffness: number;// Relative stiffness multiplier
  cableStiffness: number;// EA in N (e.g. 2.4e9)
  structuralDamping: number; // zeta (0.015 = 1.5%)
}

export interface WindParameters {
  speed: number;          // m/s (default 18.0)
  direction: number;      // degrees (0-360)
  airDensity: number;     // kg/m3 (default 1.225)
  dragCoefficient: number;// Cd (default 1.2)
  liftCoefficient: number;// Cl (default 0.8)
  strouhalNumber: number; // St (default 0.20)
}

export interface ModeShapeData {
  modeIndex: number;
  name: string;
  frequency: number;     // Hz
  period: number;        // s
  type: 'Vertical Bending' | 'Torsional' | 'Asymmetric Bending' | 'Lateral' | 'Higher Vertical';
  maxRelativeDisplacement: number; // mm
  shapeFunction: (xNormalized: number) => number;
}

export interface SensorData {
  id: string;
  name: string;
  type: 'accelerometer' | 'strain_gauge' | 'displacement' | 'piezoelectric' | 'temperature' | 'wind_sensor';
  location: string;
  xPos: number; // normalized along bridge 0..1
  yPos: number; // height offset
  zPos: number; // lateral offset
  status: 'online' | 'degraded' | 'offline';
  currentValue: number;
  unit: string;
  batteryLevel: number; // %
  lastUpdate: string;
  history: number[];
}

export interface EnergyHarvesterState {
  piezoCapacitance: number; // nF
  piezoCoeffD33: number;   // pC/N
  loadResistance: number;   // kOhm
  efficiency: number;       // 0..1
  voltage: number;          // V
  current: number;          // mA
  instantaneousPower: number; // mW
  averagePower: number;     // mW
  harvestedEnergyTotal: number; // mJ
  batteryCapacityMWh: number; // mWh
  batterySOC: number;       // % (0..100)
  consumedPower: number;    // mW (sensors + comm + MCU)
  netPower: number;         // mW
}

export interface SHMBaseline {
  naturalFrequency: number; // Hz
  rmsAcceleration: number;  // g
  maxDisplacement: number;   // mm
  dampingRatio: number;
}

export interface AnomalyReport {
  status: 'NORMAL' | 'MONITOR' | 'POTENTIAL ANOMALY';
  score: number; // 0..100
  reasons: string[];
  findings: {
    metric: string;
    baseline: string;
    current: string;
    deviation: string;
    status: 'normal' | 'warning' | 'anomaly';
  }[];
  recommendation: string;
}

export interface ScenarioDefinition {
  id: string;
  name: string;
  description: string;
  windSpeed: number;
  deckStiffnessFactor: number;
  cableStiffnessFactor: number;
  dampingFactor: number;
  sensorFault: boolean;
  harvesterFault: boolean;
}

export type CameraPreset = 
  | 'overview' 
  | 'main_span' 
  | 'tower' 
  | 'deck' 
  | 'sensors' 
  | 'harvester' 
  | 'resonance';
