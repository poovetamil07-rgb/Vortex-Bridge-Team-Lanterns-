import React from 'react';
import { HelpCircle, Activity, Wind, Zap, Battery, Radio, Gauge } from 'lucide-react';
import { ResonanceResult } from '../../physics/resonance';

interface DigitalTwinHUDProps {
  windSpeed: number;
  vortexFrequency: number;
  naturalFrequency: number;
  resonance: ResonanceResult;
  harvestedPower: number;
  batterySOC: number;
  sensorsOnline: number;
  totalSensors: number;
  systemMode: 'SIMULATION' | 'ESP32_LIVE' | 'DEMO_MODE';
  onExplain: (topic: string) => void;
}

export const DigitalTwinHUD: React.FC<DigitalTwinHUDProps> = ({
  windSpeed,
  vortexFrequency,
  naturalFrequency,
  resonance,
  harvestedPower,
  batterySOC,
  sensorsOnline,
  totalSensors,
  systemMode,
  onExplain
}) => {
  const isResonant = resonance.isResonant;

  return (
    <div className="absolute top-4 left-4 right-4 pointer-events-none z-20 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
      {/* HUD Cards Grid */}
      <div className="flex flex-wrap items-center gap-2">
        {/* System Status Indicator */}
        <div className="pointer-events-auto bg-[#080d19]/90 border border-slate-700/60 backdrop-blur-md px-3 py-2 flex items-center gap-2.5">
          <span className={`w-2.5 h-2.5 rounded-full ${
            systemMode === 'DEMO_MODE' 
              ? 'bg-amber-400 animate-pulse' 
              : systemMode === 'ESP32_LIVE' 
              ? 'bg-emerald-400 animate-pulse' 
              : 'bg-cyan-400'
          }`} />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">SYSTEM MODE</span>
            <span className="text-white font-bold">{systemMode.replace('_', ' ')}</span>
          </div>
        </div>

        {/* Wind Speed */}
        <div className="pointer-events-auto bg-[#080d19]/90 border border-slate-800/80 backdrop-blur-md px-3 py-2 min-w-[110px]">
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1"><Wind className="w-3 h-3 text-cyan-400" /> WIND</span>
            <span className="text-[9px] text-slate-500">SIM</span>
          </div>
          <div className="text-sm font-bold text-cyan-300 flex items-baseline gap-1 mt-0.5">
            {windSpeed.toFixed(1)} <span className="text-[10px] font-normal text-slate-400">m/s</span>
          </div>
        </div>

        {/* Vortex Frequency */}
        <div className="pointer-events-auto bg-[#080d19]/90 border border-slate-800/80 backdrop-blur-md px-3 py-2 min-w-[125px] group">
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>VORTEX FREQ</span>
            <button 
              onClick={() => onExplain('vortex_frequency')}
              className="text-slate-500 hover:text-cyan-400 transition-colors p-0.5 cursor-pointer"
              title="Explain Vortex Frequency"
            >
              <HelpCircle className="w-3 h-3" />
            </button>
          </div>
          <div className="text-sm font-bold text-cyan-300 flex items-baseline gap-1 mt-0.5">
            {vortexFrequency.toFixed(2)} <span className="text-[10px] font-normal text-slate-400">Hz</span>
          </div>
        </div>

        {/* Natural Frequency */}
        <div className="pointer-events-auto bg-[#080d19]/90 border border-slate-800/80 backdrop-blur-md px-3 py-2 min-w-[125px]">
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>NATURAL FREQ</span>
            <span className="text-[9px] text-slate-500">MODEL</span>
          </div>
          <div className="text-sm font-bold text-amber-300 flex items-baseline gap-1 mt-0.5">
            {naturalFrequency.toFixed(2)} <span className="text-[10px] font-normal text-slate-400">Hz</span>
          </div>
        </div>

        {/* Frequency Ratio & Resonance Alert */}
        <div className={`pointer-events-auto bg-[#080d19]/90 border backdrop-blur-md px-3 py-2 min-w-[140px] transition-colors ${
          isResonant ? 'border-red-500/80 bg-red-950/20' : 'border-slate-800/80'
        }`}>
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <Gauge className={`w-3 h-3 ${isResonant ? 'text-red-400 animate-bounce' : 'text-slate-400'}`} />
              FREQ RATIO
            </span>
            <button 
              onClick={() => onExplain('frequency_ratio')}
              className="text-slate-500 hover:text-cyan-400 transition-colors p-0.5 cursor-pointer"
              title="Explain Frequency Ratio"
            >
              <HelpCircle className="w-3 h-3" />
            </button>
          </div>
          <div className="flex items-baseline justify-between mt-0.5">
            <span className={`text-sm font-bold ${isResonant ? 'text-red-400' : 'text-slate-100'}`}>
              {resonance.frequencyRatio.toFixed(2)}
            </span>
            <span 
              className="text-[9px] px-1.5 py-0.5 uppercase font-semibold"
              style={{ color: resonance.regionColor }}
            >
              {resonance.region === 'POTENTIAL RESONANCE' ? 'RESONANCE' : resonance.region}
            </span>
          </div>
        </div>

        {/* RMS Acceleration */}
        <div className="pointer-events-auto bg-[#080d19]/90 border border-slate-800/80 backdrop-blur-md px-3 py-2 min-w-[125px]">
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1"><Activity className="w-3 h-3 text-cyan-400" /> RMS ACCEL</span>
            <span className="text-[9px] text-slate-500">EST</span>
          </div>
          <div className="text-sm font-bold text-slate-100 flex items-baseline gap-1 mt-0.5">
            {resonance.rmsAcceleration.toFixed(3)} <span className="text-[10px] font-normal text-slate-400">g</span>
          </div>
        </div>

        {/* Max Displacement */}
        <div className="pointer-events-auto bg-[#080d19]/90 border border-slate-800/80 backdrop-blur-md px-3 py-2 min-w-[125px]">
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>MAX DISP</span>
            <span className="text-[9px] text-slate-500">EST</span>
          </div>
          <div className="text-sm font-bold text-slate-100 flex items-baseline gap-1 mt-0.5">
            {resonance.estimatedDisplacement.toFixed(1)} <span className="text-[10px] font-normal text-slate-400">mm</span>
          </div>
        </div>

        {/* Harvested Power */}
        <div className="pointer-events-auto bg-[#080d19]/90 border border-orange-500/30 backdrop-blur-md px-3 py-2 min-w-[125px]">
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-orange-400" /> HARVESTED</span>
            <button 
              onClick={() => onExplain('power')}
              className="text-slate-500 hover:text-orange-400 transition-colors p-0.5 cursor-pointer"
              title="Explain Harvester Power"
            >
              <HelpCircle className="w-3 h-3" />
            </button>
          </div>
          <div className="text-sm font-bold text-orange-400 flex items-baseline gap-1 mt-0.5">
            {harvestedPower.toFixed(1)} <span className="text-[10px] font-normal text-slate-400">mW</span>
          </div>
        </div>

        {/* Battery SOC */}
        <div className="pointer-events-auto bg-[#080d19]/90 border border-slate-800/80 backdrop-blur-md px-3 py-2 min-w-[105px]">
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1"><Battery className="w-3 h-3 text-emerald-400" /> BATTERY</span>
            <span className="text-[9px] text-slate-500">LiFePO4</span>
          </div>
          <div className="text-sm font-bold text-emerald-400 flex items-baseline gap-1 mt-0.5">
            {batterySOC.toFixed(0)} <span className="text-[10px] font-normal text-slate-400">%</span>
          </div>
        </div>

        {/* Sensor Network Status */}
        <div className="pointer-events-auto bg-[#080d19]/90 border border-slate-800/80 backdrop-blur-md px-3 py-2 min-w-[110px]">
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1"><Radio className="w-3 h-3 text-cyan-400" /> SENSORS</span>
          </div>
          <div className="text-sm font-bold text-slate-100 flex items-baseline gap-1 mt-0.5">
            <span className="text-emerald-400">{sensorsOnline}</span>
            <span className="text-slate-400">/</span>
            <span>{totalSensors}</span>
            <span className="text-[10px] font-normal text-emerald-400 ml-1">ONLINE</span>
          </div>
        </div>
      </div>
    </div>
  );
};
