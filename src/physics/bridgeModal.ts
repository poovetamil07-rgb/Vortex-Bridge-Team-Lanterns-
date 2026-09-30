import { BridgeGeometry, BridgeStructural, BridgeMaterial, ModeShapeData } from '../types/bridge';

/**
 * Calculates modal parameters based on bridge geometry, materials, and structural properties.
 * Formulas are calibrated to engineering suspension bridge dynamics (Steinman / Bleich theory).
 */
export function calculateModalParameters(
  geometry: BridgeGeometry,
  structural: BridgeStructural,
  material: BridgeMaterial
): ModeShapeData[] {
  const totalLength = geometry.span1 + geometry.mainSpan1 + geometry.mainSpan2 + geometry.span4;
  const effectiveMainSpan = (geometry.mainSpan1 + geometry.mainSpan2) / 2;

  // Base stiffness ratio compared to nominal reference
  // f proportional to sqrt(EI / (m * L^4)) and sqrt(g / sag)
  const nominalEI = 1.8e9;
  const nominalMass = 8500;
  const nominalSpan = 85;
  const nominalSag = 14;

  const stiffnessRatio = (structural.deckStiffness * (material.youngsModulus / 2.05e11)) / nominalEI;
  const massRatio = (structural.deckMass * (material.density / 7850)) / nominalMass;
  const spanRatio = effectiveMainSpan / nominalSpan;
  const sagRatio = geometry.cableSag / nominalSag;

  // Beam bending factor & cable suspension pendulum factor
  const bendingFactor = Math.sqrt(Math.max(0.1, stiffnessRatio) / Math.max(0.1, massRatio)) / Math.pow(spanRatio, 2);
  const cableFactor = Math.sqrt(nominalSag / Math.max(2, geometry.cableSag));

  // Combined natural frequency scaling factor
  const scale = 0.55 * bendingFactor + 0.45 * cableFactor;

  // Nominal reference modes for VortexBridge:
  // Mode 1: 0.42 Hz (1st Symmetric Vertical Bending)
  // Mode 2: 0.87 Hz (1st Torsional)
  // Mode 3: 1.31 Hz (1st Asymmetric Vertical Bending)
  // Mode 4: 2.08 Hz (1st Lateral Bending)
  // Mode 5: 3.14 Hz (2nd Symmetric Vertical Bending)
  const baseFreqs = [0.42, 0.87, 1.31, 2.08, 3.14];
  const modeTypes: ModeShapeData['type'][] = [
    'Vertical Bending',
    'Torsional',
    'Asymmetric Bending',
    'Lateral',
    'Higher Vertical'
  ];

  const modes: ModeShapeData[] = baseFreqs.map((baseF, idx) => {
    // Mode frequency with physical scaling
    const freq = Number((baseF * scale).toFixed(3));
    const period = Number((1 / Math.max(0.01, freq)).toFixed(3));

    let shapeFunction: (x: number) => number;
    let maxDisp = 12.0;

    switch (idx) {
      case 0:
        // Mode 1: Symmetric half-wave across main spans
        shapeFunction = (x: number) => Math.sin(Math.PI * x);
        maxDisp = 14.5;
        break;
      case 1:
        // Mode 2: Torsional (rotation along deck)
        shapeFunction = (x: number) => Math.sin(Math.PI * x) * 0.9;
        maxDisp = 10.2;
        break;
      case 2:
        // Mode 3: Asymmetric full wave
        shapeFunction = (x: number) => Math.sin(2 * Math.PI * x);
        maxDisp = 8.6;
        break;
      case 3:
        // Mode 4: Lateral mode
        shapeFunction = (x: number) => Math.sin(Math.PI * x) * 0.7;
        maxDisp = 6.4;
        break;
      case 4:
      default:
        // Mode 5: 3 half-waves
        shapeFunction = (x: number) => Math.sin(3 * Math.PI * x);
        maxDisp = 4.8;
        break;
    }

    return {
      modeIndex: idx + 1,
      name: `Mode ${idx + 1}: ${modeTypes[idx]}`,
      frequency: freq,
      period,
      type: modeTypes[idx],
      maxRelativeDisplacement: maxDisp,
      shapeFunction
    };
  });

  return modes;
}
