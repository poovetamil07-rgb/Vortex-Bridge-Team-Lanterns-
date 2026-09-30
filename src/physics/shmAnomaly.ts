import { SHMBaseline, AnomalyReport } from '../types/bridge';

export const DEFAULT_BASELINE: SHMBaseline = {
  naturalFrequency: 0.42, // Hz (Mode 1 reference)
  rmsAcceleration: 0.018, // g under nominal 14 m/s wind
  maxDisplacement: 9.8,   // mm under nominal wind
  dampingRatio: 0.015     // 1.5%
};

/**
 * Explainable AI-style Anomaly Detection Engine
 * Evaluates multi-modal structural parameters against calibrated baseline
 */
export function evaluateStructuralHealth(
  current: {
    naturalFrequency: number;
    rmsAcceleration: number;
    maxDisplacement: number;
    dampingRatio: number;
    frequencyRatio: number;
    windSpeed: number;
    isResonant: boolean;
    sensorCountOffline: number;
    harvestedPower: number;
  },
  baseline: SHMBaseline = DEFAULT_BASELINE
): AnomalyReport {
  const findings: AnomalyReport['findings'] = [];
  const reasons: string[] = [];
  let anomalyScore = 0;

  // 1. Natural Frequency Deviation (most critical indicator for structural stiffness/mass changes)
  const fnDev = ((current.naturalFrequency - baseline.naturalFrequency) / baseline.naturalFrequency) * 100;
  const absFnDev = Math.abs(fnDev);
  let fnStatus: 'normal' | 'warning' | 'anomaly' = 'normal';

  if (absFnDev > 10) {
    fnStatus = 'anomaly';
    anomalyScore += 45;
    reasons.push(
      `Dominant natural frequency shifted by ${fnDev > 0 ? '+' : ''}${fnDev.toFixed(1)}% (${baseline.naturalFrequency} Hz → ${current.naturalFrequency.toFixed(3)} Hz), indicating potential stiffness degradation or mass redistribution.`
    );
  } else if (absFnDev > 5) {
    fnStatus = 'warning';
    anomalyScore += 20;
    reasons.push(
      `Moderate natural frequency drift of ${fnDev > 0 ? '+' : ''}${fnDev.toFixed(1)}% observed relative to nominal baseline.`
    );
  }
  findings.push({
    metric: 'Natural Frequency (fn)',
    baseline: `${baseline.naturalFrequency.toFixed(3)} Hz`,
    current: `${current.naturalFrequency.toFixed(3)} Hz`,
    deviation: `${fnDev > 0 ? '+' : ''}${fnDev.toFixed(1)}%`,
    status: fnStatus
  });

  // 2. RMS Acceleration
  const accDev = ((current.rmsAcceleration - baseline.rmsAcceleration) / baseline.rmsAcceleration) * 100;
  const absAccDev = Math.abs(accDev);
  let accStatus: 'normal' | 'warning' | 'anomaly' = 'normal';

  if (absAccDev > 35) {
    accStatus = 'anomaly';
    anomalyScore += 30;
    reasons.push(
      `RMS vibration acceleration altered by ${accDev > 0 ? '+' : ''}${accDev.toFixed(1)}% (${current.rmsAcceleration.toFixed(3)} g vs baseline ${baseline.rmsAcceleration.toFixed(3)} g), driven by ${current.isResonant ? 'vortex-induced lock-in resonance' : 'wind dynamic excitation'}.`
    );
  } else if (absAccDev > 15) {
    accStatus = 'warning';
    anomalyScore += 15;
    reasons.push(`Vibration amplitude variance +${accDev.toFixed(1)}% above baseline operating envelope.`);
  }
  findings.push({
    metric: 'RMS Acceleration (Arms)',
    baseline: `${baseline.rmsAcceleration.toFixed(3)} g`,
    current: `${current.rmsAcceleration.toFixed(3)} g`,
    deviation: `${accDev > 0 ? '+' : ''}${accDev.toFixed(1)}%`,
    status: accStatus
  });

  // 3. Peak Displacement
  const dispDev = ((current.maxDisplacement - baseline.maxDisplacement) / baseline.maxDisplacement) * 100;
  let dispStatus: 'normal' | 'warning' | 'anomaly' = 'normal';
  if (Math.abs(dispDev) > 40) {
    dispStatus = 'anomaly';
    anomalyScore += 25;
    reasons.push(`Mid-span dynamic displacement altered by ${dispDev > 0 ? '+' : ''}${dispDev.toFixed(1)}% (now ${current.maxDisplacement.toFixed(1)} mm).`);
  } else if (Math.abs(dispDev) > 20) {
    dispStatus = 'warning';
    anomalyScore += 10;
  }
  findings.push({
    metric: 'Max Displacement (d_max)',
    baseline: `${baseline.maxDisplacement.toFixed(1)} mm`,
    current: `${current.maxDisplacement.toFixed(1)} mm`,
    deviation: `${dispDev > 0 ? '+' : ''}${dispDev.toFixed(1)}%`,
    status: dispStatus
  });

  // 4. Resonance Lock-In State
  if (current.isResonant) {
    anomalyScore += 20;
    reasons.push(
      `Aeroelastic lock-in condition active: vortex shedding frequency (${(current.frequencyRatio * current.naturalFrequency).toFixed(2)} Hz) matches structural mode with frequency ratio ${current.frequencyRatio.toFixed(2)}.`
    );
  }

  // 5. Sensor Faults
  if (current.sensorCountOffline > 0) {
    anomalyScore += 15;
    reasons.push(`${current.sensorCountOffline} sensor node(s) reported degraded telemetry or offline status.`);
  }

  // Determine overall status
  let status: AnomalyReport['status'] = 'NORMAL';
  let recommendation = 'Structural metrics within standard design tolerance. Continue routine baseline polling.';

  if (anomalyScore >= 40) {
    status = 'POTENTIAL ANOMALY';
    recommendation = 'Potential anomaly flagged. Recommend on-site visual inspection, modal reassessment, and vibration damper verification. Model estimate only.';
  } else if (anomalyScore >= 18) {
    status = 'MONITOR';
    recommendation = 'Telemetry in elevated monitor band. Increase logging frequency and track frequency drift trends.';
  }

  if (reasons.length === 0) {
    reasons.push('All modal frequencies, dynamic accelerations, and sensor telemetry remain within nominal baseline tolerances (±5%).');
  }

  return {
    status,
    score: Math.min(100, anomalyScore),
    reasons,
    findings,
    recommendation
  };
}
