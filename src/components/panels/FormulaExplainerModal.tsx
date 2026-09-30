import React from 'react';
import { X, Calculator, HelpCircle } from 'lucide-react';

interface FormulaExplainerModalProps {
  topic: string | null;
  onClose: () => void;
  variables: {
    windSpeed: number;
    strouhal: number;
    deckThickness: number;
    density: number;
    cd: number;
    cl: number;
    area: number;
    fn: number;
    fv: number;
    ratio: number;
    zeta: number;
    voltage: number;
    current: number;
    power: number;
  };
}

export const FormulaExplainerModal: React.FC<FormulaExplainerModalProps> = ({
  topic,
  onClose,
  variables
}) => {
  if (!topic) return null;

  let title = 'Engineering Formula Breakdown';
  let formula = '';
  let description = '';
  let substituted = '';
  let interpretation = '';

  switch (topic) {
    case 'vortex_frequency':
      title = 'Strouhal Vortex Shedding Frequency (fv)';
      formula = 'f_v = (St × V) / D';
      description =
        'Von Kármán vortex streets detach periodically from the upper and lower edges of the bluff bridge deck cross-section at a characteristic frequency governed by the dimensionless Strouhal number (St).';
      substituted = `f_v = (${variables.strouhal} × ${variables.windSpeed.toFixed(1)} m/s) / ${variables.deckThickness} m = ${variables.fv.toFixed(3)} Hz`;
      interpretation =
        'When this vortex detachment frequency coincides with one of the natural vibration frequencies of the bridge, aeroelastic lock-in occurs, driving large resonant deck oscillations.';
      break;

    case 'dynamic_pressure':
      title = 'Aerodynamic Dynamic Pressure (q)';
      formula = 'q = 0.5 × ρ × V²';
      description =
        'Kinetic energy per unit volume of moving air converted into stagnation pressure upon encountering structural obstacles, according to Bernoulli principles.';
      substituted = `q = 0.5 × ${variables.density} kg/m³ × (${variables.windSpeed.toFixed(1)} m/s)² = ${(0.5 * variables.density * Math.pow(variables.windSpeed, 2)).toFixed(2)} Pa (N/m²)`;
      interpretation =
        'Dynamic pressure scales quadratically with wind speed: doubling wind velocity quadruples static aerodynamic pressure and drag forces on the bridge deck.';
      break;

    case 'frequency_ratio':
      title = 'Frequency Coupling Ratio (R) & Amplification (Q)';
      formula = 'R = f_v / f_n  |  Q = 1 / √((1 - R²)² + (2ζR)²)';
      description =
        'The ratio between wind vortex excitation frequency (fv) and structural natural mode frequency (fn). The dynamic amplification factor Q quantifies mechanical resonance.';
      substituted = `R = ${variables.fv.toFixed(3)} Hz / ${variables.fn.toFixed(3)} Hz = ${variables.ratio.toFixed(3)}`;
      interpretation =
        variables.ratio >= 0.88 && variables.ratio <= 1.15
          ? 'WARNING: Frequency ratio is in the POTENTIAL RESONANCE band (0.88 – 1.15). Structural damping absorbs only a fraction of the vortex energy, causing dynamic amplification.'
          : 'Frequency ratio is outside the resonant lock-in window. Damped dynamic amplification remains moderate.';
      break;

    case 'power':
      title = 'Piezoelectric Harvested Power (P)';
      formula = 'P = V_rect × I_load  |  E = ∫ P dt';
      description =
        'Lead Zirconate Titanate (PZT-5H) piezoelectric cantilevers convert cyclic mechanical bending strain into electrical charge via the direct piezoelectric effect (d33 coupling).';
      substituted = `P = ${variables.voltage.toFixed(2)} V × ${variables.current.toFixed(3)} mA = ${variables.power.toFixed(1)} mW`;
      interpretation =
        'Harvested electrical power is proportional to vibration amplitude squared and frequency. Energy is rectified and buffered into capacitor banks before powering autonomous wireless sensor nodes.';
      break;

    case 'fft':
      title = 'Fast Fourier Transform (FFT) Spectral Decomposition';
      formula = 'X(k) = ∑ [x(n) · w(n)] · e^(-j 2π k n / N)';
      description =
        'Decomposes sampled discrete acceleration time-series a(t) into constitutive harmonic frequency bins using the Radix-2 Cooley-Tukey algorithm with a Hanning window w(n) to mitigate spectral leakage.';
      substituted = `Sampling Rate fs = 50 Hz, Buffer N = 256 samples, Bin Resolution Δf = 50 / 256 = 0.195 Hz`;
      interpretation =
        'Identifies the dominant natural modes excited by traffic and wind, enabling real-time detection of modal frequency drift indicative of structural stiffness degradation.';
      break;

    default:
      title = 'Engineering Metric Explanation';
      formula = 'Metric = f(Bridge Parameters)';
      description = 'Physical relationship derived from suspension bridge dynamics.';
      substituted = 'Calibrated against 22.5m - 85m - 85m - 22.5m reference model.';
      interpretation = 'Refer to standard structural dynamics literature (Chopra / Steinman).';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 font-mono text-xs">
      <div className="w-full max-w-lg bg-[#080d19] border border-cyan-500/80 shadow-2xl p-5 text-slate-200 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-white text-sm">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mathematical Formula Box */}
        <div className="p-3 bg-[#0d1526] border border-cyan-500/40 text-center">
          <span className="text-[10px] text-slate-400 block mb-1 uppercase font-semibold">
            GOVERNING FORMULA
          </span>
          <div className="text-base font-bold text-cyan-300 font-mono tracking-wider">{formula}</div>
        </div>

        {/* Theoretical Description */}
        <div className="space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">PHYSICAL PRINCIPLE</span>
          <p className="text-slate-300 leading-relaxed text-[11px]">{description}</p>
        </div>

        {/* Numerical Substitution */}
        <div className="space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">
            LIVE TWIN SUBSTITUTION
          </span>
          <div className="p-2.5 bg-slate-900 border border-slate-800 text-emerald-400 text-[11px] font-bold">
            {substituted}
          </div>
        </div>

        {/* Engineering Interpretation */}
        <div className="space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">
            STRUCTURAL IMPLICATION
          </span>
          <p className="text-slate-300 leading-relaxed text-[11px] bg-slate-900/50 p-2 border-l-2 border-amber-500">
            {interpretation}
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors cursor-pointer"
        >
          CLOSE EXPLANATION
        </button>
      </div>
    </div>
  );
};
