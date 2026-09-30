import React from 'react';
import { Zap, Battery, ArrowRight, Activity, Cpu, Radio, HelpCircle } from 'lucide-react';
import { EnergyHarvesterState } from '../../types/bridge';
import { estimateBatteryRuntime } from '../../physics/energyHarvesting';

interface EnergyHarvesterPanelProps {
  energy: EnergyHarvesterState;
  vibrationAmpMM: number;
  frequencyHz: number;
  onExplain: (topic: string) => void;
}

export const EnergyHarvesterPanel: React.FC<EnergyHarvesterPanelProps> = ({
  energy,
  vibrationAmpMM,
  frequencyHz,
  onExplain
}) => {
  const runtime = estimateBatteryRuntime(energy.batterySOC, energy.batteryCapacityMWh, energy.netPower);
  const isSurplus = energy.netPower > 0;

  // Particle flow speed multiplier (0.5 to 3.0)
  const flowSpeed = Math.min(3, Math.max(0.5, energy.averagePower / 25));

  return (
    <div className="flex flex-col h-full bg-[#080d19] text-slate-200 font-mono text-xs overflow-y-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-orange-400" />
          <h2 className="font-bold text-sm text-white">PIEZOELECTRIC ENERGY HARVESTING</h2>
        </div>
        <span className="text-[10px] text-orange-400 font-semibold px-2 py-0.5 bg-orange-500/10 border border-orange-500/30">
          AUTONOMOUS SHM
        </span>
      </div>

      {/* Energy Balance Overview */}
      <div className="p-3 bg-[#0b1220] border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-300 uppercase">ENERGY BALANCE</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 border ${
            isSurplus
              ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10'
              : 'text-amber-400 border-amber-500/40 bg-amber-500/10'
          }`}>
            {runtime.status === 'SURPLUS' ? 'ENERGY SURPLUS' : runtime.status === 'DEFICIT' ? 'ENERGY DEFICIT' : 'BALANCED'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-[11px]">
          <div>
            <span className="text-[10px] text-slate-400">Harvested</span>
            <div className="text-sm font-bold text-orange-400 mt-0.5">
              +{energy.averagePower.toFixed(1)} <span className="text-[9px] font-normal text-slate-400">mW</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] text-slate-400">Consumed</span>
            <div className="text-sm font-bold text-slate-300 mt-0.5">
              -{energy.consumedPower.toFixed(1)} <span className="text-[9px] font-normal text-slate-400">mW</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] text-slate-400">Net Power</span>
            <div className={`text-sm font-bold mt-0.5 ${isSurplus ? 'text-emerald-400' : 'text-amber-400'}`}>
              {energy.netPower > 0 ? '+' : ''}{energy.netPower.toFixed(1)} <span className="text-[9px] font-normal text-slate-400">mW</span>
            </div>
          </div>
        </div>

        {/* Battery SOC Gauge */}
        <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-[10px]">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Battery className="w-3.5 h-3.5 text-emerald-400" />
              <span>BATTERY STATE OF CHARGE (LiFePO4)</span>
            </span>
            <span className="font-bold text-emerald-400">{energy.batterySOC.toFixed(1)}%</span>
          </div>

          <div className="h-3 w-full bg-slate-900 border border-slate-700 overflow-hidden relative">
            <div
              style={{ width: `${energy.batterySOC}%` }}
              className={`h-full transition-all duration-300 ${
                energy.batterySOC > 20 ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : 'bg-red-500'
              }`}
            />
          </div>

          <div className="text-[10px] text-slate-400 flex items-center justify-between">
            <span>Capacity: {energy.batteryCapacityMWh} mWh</span>
            <span className="text-emerald-400 font-semibold">{runtime.timeEstimateString}</span>
          </div>
        </div>
      </div>

      {/* Animated Energy Flow Diagram */}
      <div className="space-y-2">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-1">
          <h3 className="text-[11px] font-semibold text-slate-300 tracking-wider uppercase">
            1. PIEZOELECTRIC HARVESTING CONVERSION CHAIN
          </h3>
          <button
            onClick={() => onExplain('power')}
            className="text-slate-400 hover:text-orange-400 text-[10px] flex items-center gap-1 cursor-pointer"
          >
            <HelpCircle className="w-3 h-3" /> FORMULA
          </button>
        </div>

        {/* Flow Blocks */}
        <div className="grid grid-cols-6 gap-1 bg-[#090e19] border border-slate-800 p-2 text-center text-[9px]">
          <div className="p-1.5 bg-slate-900 border border-cyan-500/40 text-cyan-300 flex flex-col items-center justify-center">
            <Activity className="w-3.5 h-3.5 mb-1 text-cyan-400 animate-pulse" />
            <span className="font-bold">BRIDGE VIBRATION</span>
            <span className="text-[8px] text-slate-400 mt-0.5">{vibrationAmpMM.toFixed(1)}mm</span>
          </div>

          <div className="p-1.5 bg-slate-900 border border-orange-500/50 text-orange-300 flex flex-col items-center justify-center">
            <Zap className="w-3.5 h-3.5 mb-1 text-orange-400" />
            <span className="font-bold">PZT-5H HARVESTER</span>
            <span className="text-[8px] text-slate-400 mt-0.5">{energy.voltage.toFixed(1)}V</span>
          </div>

          <div className="p-1.5 bg-slate-900 border border-slate-700 text-slate-300 flex flex-col items-center justify-center">
            <span className="font-bold">SCHOTTKY RECTIFIER</span>
            <span className="text-[8px] text-slate-400 mt-0.5">Full-Wave</span>
          </div>

          <div className="p-1.5 bg-slate-900 border border-slate-700 text-slate-300 flex flex-col items-center justify-center">
            <span className="font-bold">RESERVOIR CAP</span>
            <span className="text-[8px] text-slate-400 mt-0.5">470 µF</span>
          </div>

          <div className="p-1.5 bg-slate-900 border border-slate-700 text-slate-300 flex flex-col items-center justify-center">
            <span className="font-bold">DC-DC BOOST</span>
            <span className="text-[8px] text-slate-400 mt-0.5">3.3V Reg</span>
          </div>

          <div className="p-1.5 bg-slate-900 border border-emerald-500/40 text-emerald-300 flex flex-col items-center justify-center">
            <Cpu className="w-3.5 h-3.5 mb-1 text-emerald-400" />
            <span className="font-bold">ESP32 &amp; SENSORS</span>
            <span className="text-[8px] text-slate-400 mt-0.5">22 mW</span>
          </div>
        </div>

        {/* Animated Flow Pulse Line */}
        <div className="relative h-1.5 bg-slate-900 border border-slate-800 overflow-hidden">
          <div
            style={{ animationDuration: `${Math.max(0.4, 2.5 / flowSpeed)}s` }}
            className="h-full w-24 bg-gradient-to-r from-transparent via-orange-400 to-transparent animate-[pulse_1s_infinite] shadow-[0_0_10px_#ff7a00]"
          />
        </div>
      </div>

      {/* Electrical Model Parameters */}
      <div className="space-y-2 pt-1">
        <h3 className="text-[11px] font-semibold text-slate-300 tracking-wider uppercase">
          2. TRANSDUCER ELECTRICAL METRICS
        </h3>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="bg-[#0b1220] border border-slate-800 p-2.5">
            <span className="text-[10px] text-slate-400">Rectified Voltage (Vdc)</span>
            <div className="text-sm font-bold text-white mt-1">
              {energy.voltage.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">V</span>
            </div>
          </div>

          <div className="bg-[#0b1220] border border-slate-800 p-2.5">
            <span className="text-[10px] text-slate-400">Harvested Current (Idc)</span>
            <div className="text-sm font-bold text-cyan-300 mt-1">
              {energy.current.toFixed(3)} <span className="text-[10px] text-slate-400 font-normal">mA</span>
            </div>
          </div>

          <div className="bg-[#0b1220] border border-slate-800 p-2.5">
            <span className="text-[10px] text-slate-400">Instantaneous Power</span>
            <div className="text-sm font-bold text-orange-400 mt-1">
              {energy.instantaneousPower.toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">mW</span>
            </div>
          </div>

          <div className="bg-[#0b1220] border border-slate-800 p-2.5">
            <span className="text-[10px] text-slate-400">Total Harvested Energy</span>
            <div className="text-sm font-bold text-emerald-400 mt-1">
              {(energy.harvestedEnergyTotal / 1000).toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">Joules</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
