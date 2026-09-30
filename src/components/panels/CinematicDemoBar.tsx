import React, { useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Film } from 'lucide-react';
import { CameraPreset } from '../../types/bridge';

export interface DemoStep {
  stepIndex: number;
  title: string;
  description: string;
  durationSeconds: number;
  cameraPreset: CameraPreset;
  windSpeed: number;
  magnification: number;
}

export const DEMO_STEPS: DemoStep[] = [
  {
    stepIndex: 1,
    title: '1. Engineering Workstation Overview',
    description: 'Autonomous three-span suspension digital twin initialized under calm 8 m/s breeze.',
    durationSeconds: 5,
    cameraPreset: 'overview',
    windSpeed: 8.0,
    magnification: 1
  },
  {
    stepIndex: 2,
    title: '2. Laminar Wind Acceleration',
    description: 'Cross-wind accelerates to 14 m/s across the deck. Drag and dynamic pressure begin rising.',
    durationSeconds: 5,
    cameraPreset: 'deck',
    windSpeed: 14.0,
    magnification: 2
  },
  {
    stepIndex: 3,
    title: '3. Von Kármán Vortex Shedding',
    description: 'Alternating vortices detach downwind of the bluff deck geometry at 0.35 Hz.',
    durationSeconds: 5,
    cameraPreset: 'resonance',
    windSpeed: 16.0,
    magnification: 5
  },
  {
    stepIndex: 4,
    title: '4. Aeroelastic Resonance Lock-In',
    description: 'Wind hits 18.0 m/s; vortex shedding frequency reaches 0.42 Hz matching Mode 1 natural frequency (R = 1.0).',
    durationSeconds: 6,
    cameraPreset: 'main_span',
    windSpeed: 18.0,
    magnification: 5
  },
  {
    stepIndex: 5,
    title: '5. Dynamic Modal Amplification',
    description: 'Magnified modal deformation reveals first symmetric vertical bending oscillation.',
    durationSeconds: 5,
    cameraPreset: 'main_span',
    windSpeed: 18.0,
    magnification: 10
  },
  {
    stepIndex: 6,
    title: '6. Sensor Telemetry Surge',
    description: 'Accelerometers ACC-01 & ACC-02 record elevated RMS vibration acceleration up to 0.025 g.',
    durationSeconds: 5,
    cameraPreset: 'sensors',
    windSpeed: 18.0,
    magnification: 5
  },
  {
    stepIndex: 7,
    title: '7. FFT Frequency Spectrum Lock',
    description: 'Cooley-Tukey FFT calculates narrow dominant spectral peak focused directly at 0.42 Hz.',
    durationSeconds: 5,
    cameraPreset: 'resonance',
    windSpeed: 18.0,
    magnification: 5
  },
  {
    stepIndex: 8,
    title: '8. Piezoelectric Energy Scavenging',
    description: 'Underdeck PZT-5H patches convert structural deformation strain into 42 mW electrical power.',
    durationSeconds: 5,
    cameraPreset: 'harvester',
    windSpeed: 18.0,
    magnification: 5
  },
  {
    stepIndex: 9,
    title: '9. Autonomous Rectification & Storage',
    description: 'Schottky bridge rectifier & DC-DC boost converter channel charging pulses into the LiFePO4 battery.',
    durationSeconds: 5,
    cameraPreset: 'harvester',
    windSpeed: 18.0,
    magnification: 2
  },
  {
    stepIndex: 10,
    title: '10. Energy Surplus Achieved',
    description: 'Harvested power (42 mW) surpasses continuous sensor telemetry draw (22 mW); battery begins charging.',
    durationSeconds: 5,
    cameraPreset: 'overview',
    windSpeed: 18.0,
    magnification: 2
  },
  {
    stepIndex: 11,
    title: '11. Explainable AI Anomaly Detection',
    description: 'SHM AI flags potential lock-in resonance based on frequency ratio and RMS drift.',
    durationSeconds: 6,
    cameraPreset: 'overview',
    windSpeed: 18.0,
    magnification: 2
  },
  {
    stepIndex: 12,
    title: '12. Continuous Twin Monitoring',
    description: 'Digital twin synchronizes live models, FFT, and self-powered sensor telemetry in steady state.',
    durationSeconds: 5,
    cameraPreset: 'overview',
    windSpeed: 16.0,
    magnification: 2
  }
];

interface CinematicDemoBarProps {
  isActive: boolean;
  currentStepIndex: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNextStep: () => void;
  onReset: () => void;
  onClose: () => void;
}

export const CinematicDemoBar: React.FC<CinematicDemoBarProps> = ({
  isActive,
  currentStepIndex,
  isPlaying,
  onTogglePlay,
  onNextStep,
  onReset,
  onClose
}) => {
  if (!isActive) return null;

  const currentStep = DEMO_STEPS[currentStepIndex - 1] || DEMO_STEPS[0];
  const progressPercent = (currentStepIndex / DEMO_STEPS.length) * 100;

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 w-[92%] max-w-3xl bg-[#080d19]/95 border border-amber-500/60 backdrop-blur-md p-3.5 shadow-2xl font-mono text-xs text-slate-200">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="font-bold text-amber-300 text-sm">CINEMATIC RESEARCH DEMO</span>
          <span className="text-[10px] text-slate-400">
            [Step {currentStepIndex} of {DEMO_STEPS.length}]
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePlay}
            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1 cursor-pointer transition-colors"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'PAUSE' : 'PLAY DEMO'}</span>
          </button>

          <button
            onClick={onNextStep}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition-colors"
            title="Next Step"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onReset}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition-colors"
            title="Reset Tour"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClose}
            className="px-2 py-1 text-slate-400 hover:text-white cursor-pointer ml-1"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 h-1 mt-2 overflow-hidden">
        <div
          style={{ width: `${progressPercent}%` }}
          className="bg-amber-400 h-full transition-all duration-300 shadow-[0_0_8px_#f59e0b]"
        />
      </div>

      {/* Current Step Description */}
      <div className="mt-2.5">
        <div className="font-bold text-white text-xs">{currentStep.title}</div>
        <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">{currentStep.description}</p>
      </div>
    </div>
  );
};
