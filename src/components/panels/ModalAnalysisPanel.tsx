import React from 'react';
import { Activity, Play, CheckCircle } from 'lucide-react';
import { ModeShapeData } from '../../types/bridge';

interface ModalAnalysisPanelProps {
  modes: ModeShapeData[];
  activeModeIndex: number;
  onSelectMode: (modeIndex: number) => void;
}

export const ModalAnalysisPanel: React.FC<ModalAnalysisPanelProps> = ({
  modes,
  activeModeIndex,
  onSelectMode
}) => {
  return (
    <div className="flex flex-col h-full bg-[#080d19] text-slate-200 font-mono text-xs overflow-y-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h2 className="font-bold text-sm text-white">STRUCTURAL MODAL ANALYSIS</h2>
        </div>
        <span className="text-[10px] text-amber-400 font-semibold px-2 py-0.5 bg-amber-500/10 border border-amber-500/30">
          MODEL ESTIMATE
        </span>
      </div>

      <p className="text-[11px] text-slate-400 leading-relaxed">
        Estimated natural eigensolutions for the three-span suspension configuration. Select a mode to drive real-time structural visualization.
      </p>

      {/* Modes List */}
      <div className="space-y-2">
        {modes.map((mode) => {
          const isActive = mode.modeIndex === activeModeIndex;

          return (
            <div
              key={mode.modeIndex}
              onClick={() => onSelectMode(mode.modeIndex)}
              className={`p-3 border transition-all cursor-pointer ${
                isActive
                  ? 'border-cyan-500/80 bg-cyan-950/20 shadow-[0_0_12px_rgba(0,229,255,0.15)]'
                  : 'border-slate-800 bg-[#0b1220]/60 hover:border-slate-700 hover:bg-[#0d1526]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 flex items-center justify-center text-[10px] font-bold ${
                    isActive ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {mode.modeIndex}
                  </span>
                  <div>
                    <div className="font-bold text-white text-xs">{mode.name}</div>
                    <div className="text-[10px] text-slate-400">{mode.type}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold text-cyan-400">
                    {mode.frequency.toFixed(3)} <span className="text-[10px] text-slate-400 font-normal">Hz</span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    T = {mode.period.toFixed(3)} s
                  </div>
                </div>
              </div>

              {/* Mini Mode Shape Waveform Preview */}
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <svg className="w-24 h-5 text-cyan-400/80 overflow-visible" viewBox="0 0 100 20">
                    <line x1="0" y1="10" x2="100" y2="10" stroke="#334155" strokeWidth="1" strokeDasharray="2,2" />
                    <path
                      d={`M 0 10 ${Array.from({ length: 40 }).map((_, i) => {
                        const x = (i / 40);
                        const y = 10 - mode.shapeFunction(x) * 8;
                        return `L ${x * 100} ${y}`;
                      }).join(' ')}`}
                      fill="none"
                      stroke={isActive ? '#00e5ff' : '#64748b'}
                      strokeWidth="1.5"
                    />
                  </svg>
                  <span className="text-[9px] text-slate-500">Shape</span>
                </div>

                <div className="flex items-center gap-2">
                  <span>Rel Disp: <strong className="text-slate-200">{mode.maxRelativeDisplacement} mm</strong></span>
                  {isActive ? (
                    <span className="flex items-center gap-1 text-cyan-400 text-[9px] font-bold">
                      <CheckCircle className="w-3 h-3" /> ACTIVE
                    </span>
                  ) : (
                    <button className="flex items-center gap-1 text-slate-400 hover:text-white text-[9px]">
                      <Play className="w-2.5 h-2.5" /> PREVIEW
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Frequency Spectrum Bar Chart */}
      <div className="pt-2">
        <h3 className="text-[11px] font-semibold text-slate-300 tracking-wider uppercase mb-2">
          MODAL FREQUENCY SPECTRUM (0 – 4 Hz)
        </h3>
        <div className="h-28 bg-[#0b1220] border border-slate-800 p-2.5 flex flex-col justify-end">
          <div className="flex items-end justify-between h-20 w-full gap-2 px-2 border-b border-slate-700 pb-1">
            {modes.map((m) => {
              const heightPercent = Math.min(100, (m.frequency / 3.5) * 100);
              const isActive = m.modeIndex === activeModeIndex;

              return (
                <div key={m.modeIndex} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                  <span className="text-[8px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {m.frequency}Hz
                  </span>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full max-w-[20px] transition-all cursor-pointer ${
                      isActive ? 'bg-cyan-400 shadow-[0_0_8px_#00e5ff]' : 'bg-slate-700 hover:bg-slate-500'
                    }`}
                    onClick={() => onSelectMode(m.modeIndex)}
                  />
                  <span className="text-[9px] font-bold text-slate-400">M{m.modeIndex}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[8px] text-slate-500 pt-1">
            <span>0.0 Hz</span>
            <span>1.0 Hz</span>
            <span>2.0 Hz</span>
            <span>3.0 Hz</span>
            <span>4.0 Hz</span>
          </div>
        </div>
      </div>
    </div>
  );
};
