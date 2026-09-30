import React, { useState } from 'react';
import { FlaskConical, Play, CheckCircle, SplitSquareVertical, ArrowRight } from 'lucide-react';
import { ScenarioDefinition } from '../../types/bridge';

interface ScenarioLabPanelProps {
  activeScenarioId: string;
  onApplyScenario: (scenario: ScenarioDefinition) => void;
  baselineMetrics: {
    fn: number;
    fv: number;
    ratio: number;
    disp: number;
    accel: number;
    power: number;
  };
  currentMetrics: {
    fn: number;
    fv: number;
    ratio: number;
    disp: number;
    accel: number;
    power: number;
  };
}

export const PRESET_SCENARIOS: ScenarioDefinition[] = [
  {
    id: 'normal',
    name: 'Normal Operation',
    description: 'Calm ambient breeze at 12 m/s. Standard 100% stiffness and 1.5% structural damping.',
    windSpeed: 12.0,
    deckStiffnessFactor: 1.0,
    cableStiffnessFactor: 1.0,
    dampingFactor: 1.0,
    sensorFault: false,
    harvesterFault: false
  },
  {
    id: 'high_wind',
    name: 'High Wind / Gale Condition',
    description: 'Gale wind at 28.0 m/s with elevated drag and fluctuating lift forces.',
    windSpeed: 28.0,
    deckStiffnessFactor: 1.0,
    cableStiffnessFactor: 1.0,
    dampingFactor: 1.0,
    sensorFault: false,
    harvesterFault: false
  },
  {
    id: 'heavy_resonance',
    name: 'Aeroelastic Resonance Lock-in',
    description: 'Vortex shedding frequency exactly aligns with Mode 1 natural frequency (17.8 m/s).',
    windSpeed: 17.8,
    deckStiffnessFactor: 1.0,
    cableStiffnessFactor: 1.0,
    dampingFactor: 0.8,
    sensorFault: false,
    harvesterFault: false
  },
  {
    id: 'cable_degradation',
    name: 'Cable Stiffness Reduction (-20%)',
    description: 'Simulates corrosion or strand fatigue in main suspension cable (EA reduced to 80%).',
    windSpeed: 16.0,
    deckStiffnessFactor: 1.0,
    cableStiffnessFactor: 0.80,
    dampingFactor: 1.0,
    sensorFault: false,
    harvesterFault: false
  },
  {
    id: 'deck_degradation',
    name: 'Deck Stiffness Degradation (-25%)',
    description: 'Simulates structural crack or joint relaxation in main truss chord (EI reduced to 75%).',
    windSpeed: 16.0,
    deckStiffnessFactor: 0.75,
    cableStiffnessFactor: 1.0,
    dampingFactor: 0.9,
    sensorFault: false,
    harvesterFault: false
  },
  {
    id: 'high_damping_tmd',
    name: 'Tuned Mass Damper Active (+150% ζ)',
    description: 'Auxiliary viscous dampers deployed, raising structural damping ratio from 1.5% to 3.8%.',
    windSpeed: 17.8,
    deckStiffnessFactor: 1.0,
    cableStiffnessFactor: 1.0,
    dampingFactor: 2.5,
    sensorFault: false,
    harvesterFault: false
  },
  {
    id: 'low_damping_ice',
    name: 'Low Damping / Winter Ice (-60% ζ)',
    description: 'Slick icing reduces aerodynamic damping, exacerbating dynamic oscillation amplitudes.',
    windSpeed: 18.0,
    deckStiffnessFactor: 1.0,
    cableStiffnessFactor: 1.0,
    dampingFactor: 0.4,
    sensorFault: false,
    harvesterFault: false
  },
  {
    id: 'sensor_fault',
    name: 'Sensor Network Telemetry Dropout',
    description: 'Simulates network degradation and packet loss across span accelerometers.',
    windSpeed: 16.0,
    deckStiffnessFactor: 1.0,
    cableStiffnessFactor: 1.0,
    dampingFactor: 1.0,
    sensorFault: true,
    harvesterFault: false
  }
];

export const ScenarioLabPanel: React.FC<ScenarioLabPanelProps> = ({
  activeScenarioId,
  onApplyScenario,
  baselineMetrics,
  currentMetrics
}) => {
  return (
    <div className="flex flex-col h-full bg-[#080d19] text-slate-200 font-mono text-xs overflow-y-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-cyan-400" />
          <h2 className="font-bold text-sm text-white">WHAT-IF SCENARIO LAB</h2>
        </div>
        <span className="text-[10px] text-cyan-400 font-semibold px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/30">
          SIMULATION ENGINE
        </span>
      </div>

      <p className="text-[11px] text-slate-400 leading-relaxed">
        Test aeroelastic scenarios, structural degradation faults, and damping mitigation systems against nominal bridge baseline.
      </p>

      {/* Preset Scenarios List */}
      <div className="space-y-2">
        {PRESET_SCENARIOS.map((sc) => {
          const isActive = sc.id === activeScenarioId;

          return (
            <div
              key={sc.id}
              onClick={() => onApplyScenario(sc)}
              className={`p-3 border transition-all cursor-pointer ${
                isActive
                  ? 'border-cyan-500 bg-cyan-950/25 shadow-[0_0_12px_rgba(0,229,255,0.15)]'
                  : 'border-slate-800 bg-[#0b1220] hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">{sc.name}</span>
                {isActive ? (
                  <span className="flex items-center gap-1 text-[10px] text-cyan-400 font-bold">
                    <CheckCircle className="w-3 h-3" /> ACTIVE SCENARIO
                  </span>
                ) : (
                  <button className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white">
                    <Play className="w-2.5 h-2.5" /> RUN
                  </button>
                )}
              </div>

              <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">{sc.description}</p>

              <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-slate-800/80 text-[9px] text-slate-400">
                <span>Wind: <strong className="text-cyan-300">{sc.windSpeed} m/s</strong></span>
                <span>Deck EI: <strong className="text-slate-200">{(sc.deckStiffnessFactor * 100).toFixed(0)}%</strong></span>
                <span>Cable EA: <strong className="text-slate-200">{(sc.cableStiffnessFactor * 100).toFixed(0)}%</strong></span>
                <span>Damping ζ: <strong className="text-slate-200">{(sc.dampingFactor * 1.5).toFixed(2)}%</strong></span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Split-Screen Baseline vs Scenario Comparison */}
      <div className="p-3 bg-[#0b1220] border border-slate-800 space-y-2 mt-2">
        <div className="flex items-center gap-1.5 border-b border-slate-700/80 pb-1.5">
          <SplitSquareVertical className="w-3.5 h-3.5 text-cyan-400" />
          <h3 className="text-[11px] font-semibold text-slate-200 uppercase">
            SPLIT-METRIC COMPARISON: BASELINE vs SCENARIO
          </h3>
        </div>

        <div className="space-y-1.5 pt-1 text-[11px]">
          {[
            { label: 'Natural Freq (fn)', base: `${baselineMetrics.fn.toFixed(3)} Hz`, scen: `${currentMetrics.fn.toFixed(3)} Hz` },
            { label: 'Vortex Freq (fv)', base: `${baselineMetrics.fv.toFixed(3)} Hz`, scen: `${currentMetrics.fv.toFixed(3)} Hz` },
            { label: 'Frequency Ratio (R)', base: baselineMetrics.ratio.toFixed(2), scen: currentMetrics.ratio.toFixed(2) },
            { label: 'Max Displacement', base: `${baselineMetrics.disp.toFixed(1)} mm`, scen: `${currentMetrics.disp.toFixed(1)} mm` },
            { label: 'RMS Acceleration', base: `${baselineMetrics.accel.toFixed(3)} g`, scen: `${currentMetrics.accel.toFixed(3)} g` },
            { label: 'Harvested Power', base: `${baselineMetrics.power.toFixed(1)} mW`, scen: `${currentMetrics.power.toFixed(1)} mW` }
          ].map((m, i) => (
            <div key={i} className="flex items-center justify-between py-1 border-b border-slate-800/40">
              <span className="text-slate-400 text-[10px]">{m.label}</span>
              <div className="flex items-center gap-3">
                <span className="text-slate-400">{m.base}</span>
                <ArrowRight className="w-3 h-3 text-cyan-400" />
                <span className="text-cyan-300 font-bold">{m.scen}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
