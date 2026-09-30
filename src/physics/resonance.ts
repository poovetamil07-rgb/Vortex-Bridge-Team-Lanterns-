export interface ResonanceResult {
  frequencyRatio: number; // R = fv / fn
  magnificationFactor: number; // Q factor
  region: 'LOW COUPLING' | 'TRANSITION' | 'POTENTIAL RESONANCE' | 'HIGH SEPARATION';
  regionColor: string;
  isResonant: boolean;
  estimatedDisplacement: number; // mm
  rmsAcceleration: number; // g
  peakAcceleration: number; // g
  estimatedHarvestedPower: number; // mW
}

export interface SweepPoint {
  windSpeed: number;
  vortexFrequency: number;
  naturalFrequency: number;
  frequencyRatio: number;
  displacement: number;
  acceleration: number;
  harvestedPower: number;
  isResonant: boolean;
}

export function calculateResonance(
  vortexFrequency: number,
  naturalFrequency: number,
  dampingRatio: number, // e.g. 0.015 (1.5%)
  liftForceKN: number,
  deckStiffnessFactor: number
): ResonanceResult {
  const fnSafe = Math.max(0.05, naturalFrequency);
  const R = vortexFrequency / fnSafe;
  const zeta = Math.max(0.005, dampingRatio);

  // Dynamic magnification factor Q = 1 / sqrt((1 - R^2)^2 + (2 * zeta * R)^2)
  const denom = Math.sqrt(Math.pow(1 - Math.pow(R, 2), 2) + Math.pow(2 * zeta * R, 2));
  const Q = Math.min(25, 1 / Math.max(0.04, denom)); // clamped peak Q for realistic structural damping

  // Determine resonance regime
  let region: ResonanceResult['region'] = 'LOW COUPLING';
  let regionColor = '#10b981'; // green
  let isResonant = false;

  if (R >= 0.88 && R <= 1.15) {
    region = 'POTENTIAL RESONANCE';
    regionColor = '#ef4444'; // red alert
    isResonant = true;
  } else if ((R >= 0.72 && R < 0.88) || (R > 1.15 && R <= 1.32)) {
    region = 'TRANSITION';
    regionColor = '#f59e0b'; // amber
  } else if (R > 1.32) {
    region = 'HIGH SEPARATION';
    regionColor = '#00e5ff'; // cyan
  }

  // Base static displacement from lift force
  const staticDispMM = Math.max(0.5, (liftForceKN * 0.12) / Math.max(0.2, deckStiffnessFactor));
  const estimatedDisplacement = Number((staticDispMM * (0.8 + 0.45 * Q)).toFixed(1)); // mm

  // Acceleration = omega^2 * displacement
  // a = (2*pi*f)^2 * (disp in meters) / 9.81
  const omega = 2 * Math.PI * vortexFrequency;
  const dispMeters = (estimatedDisplacement / 1000);
  const peakAcc = (Math.pow(omega, 2) * dispMeters) / 9.80665;
  const rmsAcc = peakAcc / Math.SQRT2;

  // Piezo output is quadratic with vibration amplitude & frequency
  // P approx proportional to f * a^2
  const harvestedPower = Math.min(
    140,
    Math.max(2, Number((18 * Math.pow(rmsAcc / 0.02, 1.6) * (vortexFrequency / 0.42)).toFixed(1)))
  );

  return {
    frequencyRatio: Number(R.toFixed(3)),
    magnificationFactor: Number(Q.toFixed(2)),
    region,
    regionColor,
    isResonant,
    estimatedDisplacement,
    rmsAcceleration: Number(rmsAcc.toFixed(3)),
    peakAcceleration: Number(peakAcc.toFixed(3)),
    estimatedHarvestedPower: harvestedPower
  };
}

export function sweepWindSpeed(
  minSpeed: number = 6,
  maxSpeed: number = 32,
  step: number = 1.0,
  naturalFrequency: number,
  strouhalNumber: number = 0.20,
  deckThickness: number = 2.8,
  dampingRatio: number = 0.015,
  airDensity: number = 1.225,
  cl: number = 0.8,
  totalLength: number = 215,
  stiffnessFactor: number = 1.0
): SweepPoint[] {
  const points: SweepPoint[] = [];

  for (let v = minSpeed; v <= maxSpeed + 0.001; v += step) {
    const fv = (strouhalNumber * v) / Math.max(0.1, deckThickness);
    const dynP = 0.5 * airDensity * Math.pow(v, 2);
    const liftForceKN = (dynP * cl * (totalLength * deckThickness)) / 1000;
    const res = calculateResonance(fv, naturalFrequency, dampingRatio, liftForceKN, stiffnessFactor);

    points.push({
      windSpeed: Number(v.toFixed(1)),
      vortexFrequency: Number(fv.toFixed(3)),
      naturalFrequency: Number(naturalFrequency.toFixed(3)),
      frequencyRatio: res.frequencyRatio,
      displacement: res.estimatedDisplacement,
      acceleration: res.rmsAcceleration,
      harvestedPower: res.estimatedHarvestedPower,
      isResonant: res.isResonant
    });
  }

  return points;
}
