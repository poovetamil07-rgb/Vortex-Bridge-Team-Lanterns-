export interface VibrationMetrics {
  accelX: number; // g
  accelY: number; // g (vertical - primary)
  accelZ: number; // g (lateral)
  rmsAcceleration: number; // g
  peakAcceleration: number; // g
  peakToPeak: number; // g
  dominantFrequency: number; // Hz
  estimatedVelocity: number; // mm/s
  estimatedDisplacement: number; // mm
}

/**
 * Generates continuous, physically modeled 3-axis vibration signal
 */
export function generateVibrationSample(
  timeSeconds: number,
  naturalFreq: number,
  vortexFreq: number,
  vibrationAmpG: number,
  dampingRatio: number,
  windSpeed: number,
  modeIndex: number = 1
): VibrationMetrics {
  // Harmonic vortex shedding force
  const omegaVortex = 2 * Math.PI * vortexFreq;
  // Natural frequency response
  const omegaNat = 2 * Math.PI * naturalFreq;

  // Turbulence noise with bandpass filtering around vortex frequency
  const turbulenceNoise = (Math.sin(timeSeconds * 7.1) + Math.cos(timeSeconds * 13.7) * 0.4) * 0.08 * (windSpeed / 18);
  const sensorNoise = (Math.sin(timeSeconds * 89.3) * 0.002 + Math.cos(timeSeconds * 127.1) * 0.002);

  // Vertical (Y) is primary bending axis
  const vortexComponent = Math.sin(omegaVortex * timeSeconds) * vibrationAmpG;
  const naturalComponent = Math.sin(omegaNat * timeSeconds + 0.3) * (vibrationAmpG * 0.4) * Math.exp(-dampingRatio * 0.2);
  const accelY = vortexComponent + naturalComponent + turbulenceNoise * vibrationAmpG + sensorNoise;

  // Lateral (Z) is coupled cross-wind excitation (~30% of vertical)
  const accelZ = (Math.sin(omegaVortex * 2 * timeSeconds + 0.8) * 0.35 * vibrationAmpG) + sensorNoise * 0.5;

  // Longitudinal (X) along bridge axis (~12% of vertical from cable tension changes)
  const accelX = (Math.sin(omegaVortex * 2 * timeSeconds) * 0.15 * vibrationAmpG) + sensorNoise * 0.3;

  // Peak and RMS estimations
  const peakAcc = Math.abs(accelY) * 1.25 + 0.003;
  const rmsAcc = Math.max(0.002, vibrationAmpG * 0.707 + Math.abs(turbulenceNoise) * 0.01);
  const peakToPeak = peakAcc * 2;

  // Numerical velocity and displacement estimation: v = a / omega, d = a / omega^2
  const effectiveOmega = 2 * Math.PI * Math.max(0.2, vortexFreq);
  // a in m/s2: accelY * 9.80665
  const aMS2 = rmsAcc * 9.80665;
  const velMMS = (aMS2 / effectiveOmega) * 1000;
  const dispMM = (aMS2 / Math.pow(effectiveOmega, 2)) * 1000;

  return {
    accelX: Number(accelX.toFixed(4)),
    accelY: Number(accelY.toFixed(4)),
    accelZ: Number(accelZ.toFixed(4)),
    rmsAcceleration: Number(rmsAcc.toFixed(4)),
    peakAcceleration: Number(peakAcc.toFixed(4)),
    peakToPeak: Number(peakToPeak.toFixed(4)),
    dominantFrequency: vortexFreq,
    estimatedVelocity: Number(velMMS.toFixed(2)),
    estimatedDisplacement: Number(dispMM.toFixed(2))
  };
}
