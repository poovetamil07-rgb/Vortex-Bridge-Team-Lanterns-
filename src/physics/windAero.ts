import { WindParameters, BridgeGeometry } from '../types/bridge';

export interface AerodynamicResults {
  dynamicPressure: number; // Pa (N/m2)
  dragForce: number;       // kN
  liftForce: number;       // kN
  vortexFrequency: number; // Hz
  projectedArea: number;   // m2
  characteristicDimension: number; // m
  reynoldsNumber: number;  // Dimensionless
}

/**
 * Aerodynamic and vortex shedding calculations according to Eurocode EN 1991-1-4 / ASCE 7
 */
export function calculateAerodynamics(
  wind: WindParameters,
  geometry: BridgeGeometry
): AerodynamicResults {
  const totalLength = geometry.span1 + geometry.mainSpan1 + geometry.mainSpan2 + geometry.span4;
  const D = geometry.deckThickness; // Characteristic cross-section depth
  const projectedArea = totalLength * D;

  // Dynamic pressure q = 0.5 * rho * V^2 (Pa)
  const dynamicPressure = 0.5 * wind.airDensity * Math.pow(wind.speed, 2);

  // Drag force Fd = q * Cd * A (kN)
  const dragForce = (dynamicPressure * wind.dragCoefficient * projectedArea) / 1000;

  // Fluctuating Lift amplitude Fl = q * Cl * A (kN)
  const liftForce = (dynamicPressure * wind.liftCoefficient * projectedArea) / 1000;

  // Strouhal vortex shedding frequency fv = St * V / D (Hz)
  const vortexFrequency = (wind.strouhalNumber * wind.speed) / Math.max(0.1, D);

  // Reynolds number Re = (rho * V * D) / mu (air dynamic viscosity ~ 1.81e-5 Pa.s)
  const kinematicViscosity = 1.5e-5;
  const reynoldsNumber = (wind.speed * D) / kinematicViscosity;

  return {
    dynamicPressure: Number(dynamicPressure.toFixed(2)),
    dragForce: Number(dragForce.toFixed(2)),
    liftForce: Number(liftForce.toFixed(2)),
    vortexFrequency: Number(vortexFrequency.toFixed(3)),
    projectedArea: Number(projectedArea.toFixed(1)),
    characteristicDimension: Number(D.toFixed(2)),
    reynoldsNumber: Math.round(reynoldsNumber)
  };
}
