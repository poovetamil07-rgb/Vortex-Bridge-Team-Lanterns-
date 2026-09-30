import { EnergyHarvesterState } from '../types/bridge';

export interface PiezoHarvesterConfig {
  capacitanceNF: number;   // default 45 nF
  piezoCoeffD33: number;   // default 380 pC/N
  loadResistanceKOhm: number; // default 80 kOhm
  efficiency: number;       // default 0.82 (82%)
  batteryCapacityMWh: number; // default 500 mWh (approx 135 mAh @ 3.7V)
  baselineConsumptionMW: number; // default 22 mW (ESP32 + 8 sensors + telemetry)
}

export const DEFAULT_PIEZO_CONFIG: PiezoHarvesterConfig = {
  capacitanceNF: 45,
  piezoCoeffD33: 380,
  loadResistanceKOhm: 80,
  efficiency: 0.82,
  batteryCapacityMWh: 500,
  baselineConsumptionMW: 22.0
};

/**
 * Calculates instantaneous electrical parameters for piezoelectric harvester
 * Based on electro-mechanical coupled cantilever model (Roundy & Wright)
 */
export function calculatePiezoOutput(
  displacementMM: number,
  frequencyHz: number,
  config: PiezoHarvesterConfig = DEFAULT_PIEZO_CONFIG
): {
  voltage: number;      // V
  current: number;      // mA
  instantaneousPower: number; // mW
  averagePower: number; // mW
} {
  const f = Math.max(0.1, frequencyHz);
  const omega = 2 * Math.PI * f;
  const dispMeters = displacementMM / 1000;

  // Mechanical base strain in cantilever harvester mounted at main span high bending zone
  // Peak open circuit voltage Voc = d33 * stress / eps
  // In practice for PZT-5H patch: Voc approx proportional to omega^2 * disp
  const peakVoc = Math.min(
    28.0,
    Math.max(0.2, (0.045 * Math.pow(omega, 2) * dispMeters * 1000 * (config.piezoCoeffD33 / 380)))
  );

  // Electrical load impedance match
  // C in Farads = capacitanceNF * 1e-9
  const C = config.capacitanceNF * 1e-9;
  const RL = config.loadResistanceKOhm * 1e3;
  const Xc = 1 / (omega * C);

  // Loaded AC voltage into full-wave Schottky bridge rectifier
  const loadedVoltage = (peakVoc * RL) / Math.sqrt(Math.pow(RL, 2) + Math.pow(Xc, 2));
  // Rectifier diode drop ~ 0.4V
  const rectifiedVoltage = Math.max(0, loadedVoltage - 0.4) * Math.sqrt(config.efficiency);

  // DC current output (mA)
  const currentMA = (rectifiedVoltage / (config.loadResistanceKOhm * 1000)) * 1000 * 2.5;

  // Power in mW = V * I
  const instPower = Math.min(150, rectifiedVoltage * currentMA);
  // Average cycle power ~ 0.5 * P_peak
  const avgPower = instPower * 0.72;

  return {
    voltage: Number(rectifiedVoltage.toFixed(2)),
    current: Number(currentMA.toFixed(3)),
    instantaneousPower: Number(instPower.toFixed(2)),
    averagePower: Number(avgPower.toFixed(2))
  };
}

/**
 * Updates battery state of charge (SOC) based on power balance
 */
export function updateEnergyBalance(
  prevState: EnergyHarvesterState,
  avgHarvestedPowerMW: number,
  deltaTimeSeconds: number,
  customConsumptionMW?: number
): EnergyHarvesterState {
  const consumedMW = customConsumptionMW !== undefined ? customConsumptionMW : prevState.consumedPower;
  const netPowerMW = avgHarvestedPowerMW - consumedMW;

  // Harvested energy in mJ = mW * s
  const addedEnergyMJ = avgHarvestedPowerMW * deltaTimeSeconds;
  const newTotalEnergyMJ = prevState.harvestedEnergyTotal + addedEnergyMJ;

  // Battery capacity in mJ = mWh * 3600
  const batCapacityMJ = prevState.batteryCapacityMWh * 3600;
  // Net energy delta into battery
  const netDeltaMJ = netPowerMW * deltaTimeSeconds;
  const deltaSOC = (netDeltaMJ / batCapacityMJ) * 100;

  // Clamp SOC between 0% and 100%
  const newSOC = Math.min(100, Math.max(0, prevState.batterySOC + deltaSOC));

  return {
    ...prevState,
    averagePower: Number(avgHarvestedPowerMW.toFixed(2)),
    consumedPower: Number(consumedMW.toFixed(2)),
    netPower: Number(netPowerMW.toFixed(2)),
    harvestedEnergyTotal: Number(newTotalEnergyMJ.toFixed(1)),
    batterySOC: Number(newSOC.toFixed(2))
  };
}

export function estimateBatteryRuntime(
  socPercent: number,
  batteryCapacityMWh: number,
  netPowerMW: number
): {
  status: 'SURPLUS' | 'BALANCED' | 'DEFICIT';
  timeEstimateString: string;
} {
  if (Math.abs(netPowerMW) < 0.8) {
    return {
      status: 'BALANCED',
      timeEstimateString: 'Indefinite (Energy Balanced)'
    };
  }

  if (netPowerMW > 0) {
    // Charging
    const remainingToFullMWh = ((100 - socPercent) / 100) * batteryCapacityMWh;
    const hoursToFull = remainingToFullMWh / netPowerMW;
    if (socPercent >= 99.8) {
      return { status: 'SURPLUS', timeEstimateString: 'Fully Charged (100%)' };
    }
    return {
      status: 'SURPLUS',
      timeEstimateString: `Recharging: ~${hoursToFull < 1 ? Math.round(hoursToFull * 60) + ' min' : hoursToFull.toFixed(1) + ' hrs'}`
    };
  } else {
    // Discharging
    const remainingMWh = (socPercent / 100) * batteryCapacityMWh;
    const dischargeHours = remainingMWh / Math.abs(netPowerMW);
    return {
      status: 'DEFICIT',
      timeEstimateString: `Battery Runtime: ~${dischargeHours < 1 ? Math.round(dischargeHours * 60) + ' min' : dischargeHours.toFixed(1) + ' hrs'}`
    };
  }
}
