import React, { useState } from 'react';
import { Wind, Gauge, HelpCircle, BarChart3, ArrowRight } from 'lucide-react';
import { WindParameters, BridgeGeometry } from '../../types/bridge';
import { AerodynamicResults } from '../../physics/windAero';
import { ResonanceResult, SweepPoint, sweepWindSpeed } from '../../physics/resonance';

interface WindResonancePanelProps {
  wind: WindParameters;
  geometry: BridgeGeometry;
  aerodynamics: AerodynamicResults;
  resonance: ResonanceResult;
  naturalFrequency: number;
  dampingRatio: number;
  onUpdateWind: (wind: WindParameters) => void;
  onExplain: (topic: string) => void;
}

export const WindResonancePanel: React.FC<WindResonancePanelProps> = ({
  wind,
  geometry,
  aerodynamics,
  resonance,
  naturalFrequency,
  dampingRatio,
  onUpdateWind,
  onExplain
}) => {
  const [sweepMin, setSweepMin] = useState<number>(5);
  const [sweepMax, setSweepMax] = useState<number>(32);
  const [activeSweepMetric, setActiveSweepMetric] = useState<
    'vortexFrequency' | 'frequencyRatio' | 'displacement' | 'acceleration' | 'harvestedPower'
  >('frequencyRatio');

  // Compute live sweep curve
  const totalLen = geometry.span1 + geometry.mainSpan1 + geometry.mainSpan2 + geometry.span4;
  const sweepData: SweepPoint[] = sweepWindSpeed(
    sweepMin,
    sweepMax,
    1.0,
    naturalFrequency,
    wind.strouhalNumber,
    geometry.deckThickness,
    dampingRatio,
    wind.airDensity,
    wind.liftCoefficient,
    totalLen
  );

  const isResonant = resonance.isResonant;

  return (
    <div className="flex flex-col h-full bg-[#080d19] text-slate-200 font-mono text-xs overflow-y-auto p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Wind className="w-4 h-4 text-cyan-400" />
          <h2 className="font-bold text-sm text-white">AERODYNAMICS &amp; RESONANCE</h2>
        </div>
        <span className="text-[10px] text-cyan-400 font-semibold px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/30">
          VON KÁRMÁN
        </span>
      </div>

      {/* Wind Inputs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-semibold text-cyan-400 tracking-wider uppercase">
            1. WIND EXCITATION PARAMETERS
          </h3>
          <span className="text-cyan-300 font-bold">{wind.speed.toFixed(1)} m/s ({(wind.speed * 3.6).toFixed(1)} km/h)</span>
        </div>

        {/* Speed Slider */}
        <div>
          <input
            type="range"
            min="0"
            max="45"
            step="0.5"
            value={wind.speed}
            onChange={(e) => onUpdateWind({ ...wind, speed: parseFloat(e.target.value) })}
            className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />
          <div className="flex justify-between text-[9px] text-slate-500 mt-1">
            <span>Calm (0 m/s)</span>
            <span>Breeze (10 m/s)</span>
            <span className="text-amber-400 font-bold">Lock-in (~18 m/s)</span>
            <span>Storm (30 m/s)</span>
            <span>Hurricane (45 m/s)</span>
          </div>
        </div>

        {/* Parameters Grid */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Strouhal Number (St)</label>
            <div className="flex items-center bg-[#0d1527] border border-slate-800 px-2 py-1.5 focus-within:border-cyan-500">
              <input
                type="number"
                step="0.01"
                min="0.10"
                max="0.35"
                value={wind.strouhalNumber}
                onChange={(e) => onUpdateWind({ ...wind, strouhalNumber: parseFloat(e.target.value) || 0.20 })}
                className="w-full bg-transparent text-white focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 ml-1">St</span>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Air Density (ρ)</label>
            <div className="flex items-center bg-[#0d1527] border border-slate-800 px-2 py-1.5 focus-within:border-cyan-500">
              <input
                type="number"
                step="0.005"
                min="1.0"
                max="1.5"
                value={wind.airDensity}
                onChange={(e) => onUpdateWind({ ...wind, airDensity: parseFloat(e.target.value) || 1.225 })}
                className="w-full bg-transparent text-white focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 ml-1">kg/m³</span>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Drag Coeff (Cd)</label>
            <div className="flex items-center bg-[#0d1527] border border-slate-800 px-2 py-1.5 focus-within:border-cyan-500">
              <input
                type="number"
                step="0.05"
                min="0.2"
                max="2.5"
                value={wind.dragCoefficient}
                onChange={(e) => onUpdateWind({ ...wind, dragCoefficient: parseFloat(e.target.value) || 1.2 })}
                className="w-full bg-transparent text-white focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 ml-1">Cd</span>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Lift Coeff (Cl)</label>
            <div className="flex items-center bg-[#0d1527] border border-slate-800 px-2 py-1.5 focus-within:border-cyan-500">
              <input
                type="number"
                step="0.05"
                min="0.1"
                max="2.0"
                value={wind.liftCoefficient}
                onChange={(e) => onUpdateWind({ ...wind, liftCoefficient: parseFloat(e.target.value) || 0.8 })}
                className="w-full bg-transparent text-white focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 ml-1">Cl</span>
            </div>
          </div>
        </div>
      </div>

      {/* Aerodynamic Calculations Display */}
      <div className="space-y-2">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-1">
          <h3 className="text-[11px] font-semibold text-slate-300 tracking-wider uppercase">
            2. AERODYNAMIC FORCES &amp; FREQUENCIES
          </h3>
          <button
            onClick={() => onExplain('dynamic_pressure')}
            className="text-slate-400 hover:text-cyan-400 text-[10px] flex items-center gap-1 cursor-pointer"
          >
            <HelpCircle className="w-3 h-3" /> FORMULAS
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="bg-[#0b1220] border border-slate-800 p-2.5">
            <div className="text-[10px] text-slate-400 flex items-center justify-between">
              <span>Dynamic Pressure (q)</span>
              <span className="text-cyan-400">½ ρ V²</span>
            </div>
            <div className="text-sm font-bold text-white mt-1">
              {aerodynamics.dynamicPressure} <span className="text-[10px] text-slate-400 font-normal">Pa</span>
            </div>
          </div>

          <div className="bg-[#0b1220] border border-slate-800 p-2.5">
            <div className="text-[10px] text-slate-400 flex items-center justify-between">
              <span>Vortex Frequency (fv)</span>
              <span className="text-cyan-400">St·V / D</span>
            </div>
            <div className="text-sm font-bold text-cyan-300 mt-1">
              {aerodynamics.vortexFrequency} <span className="text-[10px] text-slate-400 font-normal">Hz</span>
            </div>
          </div>

          <div className="bg-[#0b1220] border border-slate-800 p-2.5">
            <div className="text-[10px] text-slate-400">Drag Force (Fd)</div>
            <div className="text-sm font-bold text-slate-200 mt-1">
              {aerodynamics.dragForce} <span className="text-[10px] text-slate-400 font-normal">kN</span>
            </div>
          </div>

          <div className="bg-[#0b1220] border border-slate-800 p-2.5">
            <div className="text-[10px] text-slate-400">Fluctuating Lift (Fl)</div>
            <div className="text-sm font-bold text-slate-200 mt-1">
              {aerodynamics.liftForce} <span className="text-[10px] text-slate-400 font-normal">kN</span>
            </div>
          </div>
        </div>
      </div>

      {/* Resonance Engine & Gauge */}
      <div className={`p-3.5 border transition-all ${
        isResonant 
          ? 'border-red-500/80 bg-red-950/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
          : 'border-slate-800 bg-[#0b1220]'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Gauge className={`w-4 h-4 ${isResonant ? 'text-red-400 animate-spin' : 'text-slate-400'}`} />
            <h3 className="text-xs font-bold text-white">RESONANCE COUPLING GAUGE</h3>
          </div>
          <span 
            className="text-[10px] font-bold px-2 py-0.5 border"
            style={{ 
              color: resonance.regionColor, 
              borderColor: resonance.regionColor + '55',
              backgroundColor: resonance.regionColor + '15'
            }}
          >
            {resonance.region}
          </span>
        </div>

        {/* Visual Gauge Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="relative h-4 bg-slate-900 border border-slate-700 overflow-hidden flex">
            {/* Zones: <0.72 (Low), 0.72-0.88 (Trans), 0.88-1.15 (Resonance), >1.15 (High) */}
            <div className="h-full bg-emerald-500/30 flex-1 border-r border-slate-700 flex items-center justify-center text-[8px] text-emerald-300">
              LOW
            </div>
            <div className="h-full bg-amber-500/30 w-1/5 border-r border-slate-700 flex items-center justify-center text-[8px] text-amber-300">
              TRANS
            </div>
            <div className="h-full bg-red-500/40 w-1/4 border-r border-slate-700 flex items-center justify-center text-[8px] text-red-200 font-bold">
              LOCK-IN
            </div>
            <div className="h-full bg-cyan-500/30 flex-1 flex items-center justify-center text-[8px] text-cyan-300">
              HIGH
            </div>

            {/* Indicator Needle */}
            <div
              style={{
                left: `${Math.max(0, Math.min(100, ((resonance.frequencyRatio - 0.4) / (1.6 - 0.4)) * 100))}%`
              }}
              className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_8px_#ffffff] transition-all duration-150"
            />
          </div>

          <div className="flex justify-between text-[9px] text-slate-400">
            <span>R = 0.4</span>
            <span className="text-red-400 font-bold">R = 1.0 (Peak)</span>
            <span>R = 1.6</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-slate-800 text-[11px]">
          <div>
            <span className="text-slate-400 text-[10px]">Freq Ratio (fv / fn):</span>
            <div className={`text-base font-bold ${isResonant ? 'text-red-400' : 'text-white'}`}>
              {resonance.frequencyRatio.toFixed(3)}
            </div>
          </div>
          <div>
            <span className="text-slate-400 text-[10px]">Magnification Q:</span>
            <div className="text-base font-bold text-amber-300">
              {resonance.magnificationFactor.toFixed(2)}x
            </div>
          </div>
        </div>
      </div>

      {/* Resonance Scanner (Wind Speed Sweep) */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-1">
          <div className="flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
            <h3 className="text-[11px] font-semibold text-slate-300 tracking-wider uppercase">
              RESONANCE SCANNER (WIND SWEEP)
            </h3>
          </div>
          <span className="text-[9px] text-slate-400">Click point to apply</span>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {[
            { id: 'frequencyRatio', label: 'Ratio (R)' },
            { id: 'vortexFrequency', label: 'Vortex (fv)' },
            { id: 'displacement', label: 'Disp (mm)' },
            { id: 'acceleration', label: 'Accel (g)' },
            { id: 'harvestedPower', label: 'Power (mW)' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSweepMetric(tab.id as any)}
              className={`px-2 py-1 text-[9px] uppercase font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                activeSweepMetric === tab.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Interactive SVG Chart */}
        <div className="h-32 bg-[#0b1220] border border-slate-800 p-2 relative">
          {(() => {
            const values = sweepData.map((d) => d[activeSweepMetric]);
            const maxVal = Math.max(...values, 0.1);
            const minVal = Math.min(...values, 0);
            const range = Math.max(0.01, maxVal - minVal);

            const pointsStr = sweepData
              .map((d, idx) => {
                const x = (idx / (sweepData.length - 1)) * 260 + 20;
                const normY = (d[activeSweepMetric] - minVal) / range;
                const y = 90 - normY * 70;
                return `${x},${y}`;
              })
              .join(' ');

            return (
              <svg className="w-full h-full overflow-visible" viewBox="0 0 300 110">
                {/* Grid horizontal lines */}
                <line x1="20" y1="20" x2="280" y2="20" stroke="#1e293b" strokeDasharray="2,2" />
                <line x1="20" y1="55" x2="280" y2="55" stroke="#1e293b" strokeDasharray="2,2" />
                <line x1="20" y1="90" x2="280" y2="90" stroke="#334155" />

                {/* Sweep curve */}
                <polyline
                  fill="none"
                  stroke="#00e5ff"
                  strokeWidth="2"
                  points={pointsStr}
                />

                {/* Interactive Points */}
                {sweepData.map((d, idx) => {
                  const x = (idx / (sweepData.length - 1)) * 260 + 20;
                  const normY = (d[activeSweepMetric] - minVal) / range;
                  const y = 90 - normY * 70;
                  const isCurrent = Math.abs(d.windSpeed - wind.speed) < 0.6;

                  return (
                    <g
                      key={idx}
                      className="cursor-pointer group"
                      onClick={() => onUpdateWind({ ...wind, speed: d.windSpeed })}
                    >
                      <circle
                        cx={x}
                        cy={y}
                        r={isCurrent ? 4.5 : d.isResonant ? 3.5 : 2.5}
                        fill={isCurrent ? '#ffffff' : d.isResonant ? '#ef4444' : '#00e5ff'}
                        stroke={isCurrent ? '#00e5ff' : '#080d19'}
                        strokeWidth="1.5"
                      />
                    </g>
                  );
                })}
              </svg>
            );
          })()}

          {/* Chart footer labels */}
          <div className="flex justify-between text-[8px] text-slate-500 mt-0.5">
            <span>{sweepMin} m/s</span>
            <span>Speed (V) →</span>
            <span>{sweepMax} m/s</span>
          </div>
        </div>
      </div>
    </div>
  );
};
