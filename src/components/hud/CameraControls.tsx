import React from 'react';
import { Camera, Eye, RotateCcw, Compass, Layers, Maximize2 } from 'lucide-react';
import { CameraPreset } from '../../types/bridge';

interface CameraControlsProps {
  currentPreset: CameraPreset;
  onSelectPreset: (preset: CameraPreset) => void;
  magnification: number;
  onSelectMagnification: (mag: number) => void;
  engineeringView: boolean;
  onToggleEngineeringView: () => void;
  showVortices: boolean;
  onToggleVortices: () => void;
  onResetCamera: () => void;
}

const PRESETS: { id: CameraPreset; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'main_span', label: 'Main Span' },
  { id: 'tower', label: 'Tower Saddle' },
  { id: 'deck', label: 'Deck POV' },
  { id: 'sensors', label: 'Sensors' },
  { id: 'harvester', label: 'Harvester' },
  { id: 'resonance', label: 'Resonance Cross' }
];

const MAGNIFICATIONS = [1, 2, 5, 10, 20];

export const CameraControls: React.FC<CameraControlsProps> = ({
  currentPreset,
  onSelectPreset,
  magnification,
  onSelectMagnification,
  engineeringView,
  onToggleEngineeringView,
  showVortices,
  onToggleVortices,
  onResetCamera
}) => {
  return (
    <div className="absolute bottom-4 left-4 z-20 flex flex-wrap items-center gap-2 font-mono text-xs select-none">
      {/* View Presets Bar */}
      <div className="flex items-center gap-1 bg-[#080d19]/90 border border-slate-800 backdrop-blur-md p-1">
        <div className="px-2 py-1 text-slate-400 flex items-center gap-1 text-[11px]">
          <Camera className="w-3.5 h-3.5 text-cyan-400" />
          <span>VIEW:</span>
        </div>
        {PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelectPreset(p.id)}
            className={`px-2.5 py-1 text-[11px] transition-colors cursor-pointer ${
              currentPreset === p.id
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={onResetCamera}
          className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800/60 transition-colors ml-1 cursor-pointer"
          title="Reset Camera Position"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Motion Magnification Selector */}
      <div className="flex items-center gap-1 bg-[#080d19]/90 border border-slate-800 backdrop-blur-md p-1">
        <div className="px-2 py-1 text-slate-400 flex items-center gap-1 text-[11px]" title="Motion Magnification Factor">
          <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
          <span>MAG:</span>
        </div>
        {MAGNIFICATIONS.map((mag) => (
          <button
            key={mag}
            onClick={() => onSelectMagnification(mag)}
            className={`px-2 py-1 text-[11px] transition-colors cursor-pointer ${
              magnification === mag
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            {mag}x
          </button>
        ))}
      </div>

      {/* Engineering View & Vortices Toggles */}
      <div className="flex items-center gap-1 bg-[#080d19]/90 border border-slate-800 backdrop-blur-md p-1">
        <button
          onClick={onToggleEngineeringView}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] transition-colors cursor-pointer ${
            engineeringView
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Toggle Structural Grid, Dimensions, Axes"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>GRID &amp; AXES</span>
        </button>

        <button
          onClick={onToggleVortices}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] transition-colors cursor-pointer ${
            showVortices
              ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Toggle Vortex Shedding Particle Cores"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>VORTICES</span>
        </button>
      </div>
    </div>
  );
};
