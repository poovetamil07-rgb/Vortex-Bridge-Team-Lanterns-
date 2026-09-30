import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Trash2, HelpCircle, Activity, Waves } from 'lucide-react';
import { VibrationMetrics } from '../../physics/vibrationSignal';
import { FFTResult, computeFFT } from '../../physics/fft';

interface VibrationFFTPanelProps {
  currentMetrics: VibrationMetrics;
  recentBuffer: number[]; // real-time buffer of vertical acceleration samples
  samplingRate?: number;
  onExplainFFT: () => void;
}

export const VibrationFFTPanel: React.FC<VibrationFFTPanelProps> = ({
  currentMetrics,
  recentBuffer,
  samplingRate = 50,
  onExplainFFT
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fftCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [timeWindowSec, setTimeWindowSec] = useState<number>(5); // 1, 5, 10, 30, 60
  const [fftResult, setFftResult] = useState<FFTResult | null>(null);

  // Buffer state maintained locally for plotting
  const localHistoryRef = useRef<number[]>([]);

  useEffect(() => {
    if (isPaused) return;
    localHistoryRef.current.push(currentMetrics.accelY);
    // Keep max 3000 samples (60s @ 50Hz)
    if (localHistoryRef.current.length > 3000) {
      localHistoryRef.current.shift();
    }
  }, [currentMetrics.accelY, isPaused]);

  // Compute FFT every 250ms from local buffer
  useEffect(() => {
    const interval = setInterval(() => {
      if (localHistoryRef.current.length >= 64) {
        const res = computeFFT(localHistoryRef.current, samplingRate);
        setFftResult(res);
      }
    }, 250);
    return () => clearInterval(interval);
  }, [samplingRate]);

  // Draw Time-Domain Waveform on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.fillStyle = '#090e19';
    ctx.fillRect(0, 0, width, height);

    // Draw Grid Lines
    ctx.strokeStyle = '#1a2436';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    // Horizontal grid
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2); // Zero line
    ctx.moveTo(0, height / 4);
    ctx.lineTo(width, height / 4);
    ctx.moveTo(0, (height * 3) / 4);
    ctx.lineTo(width, (height * 3) / 4);
    ctx.stroke();

    // Vertical grid
    for (let x = 0; x < width; x += width / 5) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Determine how many samples to display for selected timeWindowSec
    const samplesNeeded = Math.round(timeWindowSec * samplingRate);
    const history = localHistoryRef.current;
    const startIndex = Math.max(0, history.length - samplesNeeded);
    const slice = history.slice(startIndex);

    if (slice.length < 2) return;

    // Dynamic scale based on current max amplitude
    const maxVal = Math.max(0.04, ...slice.map(Math.abs));
    const yScale = (height / 2 - 12) / maxVal;

    // Draw Signal Path
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 1.8;
    ctx.beginPath();

    for (let i = 0; i < slice.length; i++) {
      const x = (i / (samplesNeeded - 1)) * width;
      const y = height / 2 - slice[i] * yScale;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Overlay zero axis indicator
    ctx.fillStyle = '#475569';
    ctx.font = '9px monospace';
    ctx.fillText('0.00 g', 6, height / 2 - 4);
    ctx.fillText(`+${maxVal.toFixed(3)}g`, 6, 12);
    ctx.fillText(`-${maxVal.toFixed(3)}g`, 6, height - 4);
  }, [currentMetrics, timeWindowSec, samplingRate]);

  // Draw FFT Magnitude Spectrum
  useEffect(() => {
    const canvas = fftCanvasRef.current;
    if (!canvas || !fftResult || fftResult.spectrum.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = '#090e19';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#1a2436';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    for (let f = 1; f <= 5; f++) {
      const x = (f / 5.0) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    const spectrum = fftResult.spectrum.filter((p) => p.frequency <= 5.0);
    if (spectrum.length < 2) return;

    const maxMag = Math.max(0.005, fftResult.peakMagnitude);

    // Draw filled spectrum area
    ctx.beginPath();
    ctx.moveTo(0, height);

    for (let i = 0; i < spectrum.length; i++) {
      const pt = spectrum[i];
      const x = (pt.frequency / 5.0) * width;
      const y = height - (pt.magnitude / maxMag) * (height - 18);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, height);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(0, 229, 255, 0.45)');
    gradient.addColorStop(1, 'rgba(0, 229, 255, 0.02)');
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw outline
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let i = 0; i < spectrum.length; i++) {
      const pt = spectrum[i];
      const x = (pt.frequency / 5.0) * width;
      const y = height - (pt.magnitude / maxMag) * (height - 18);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Mark Dominant Frequency Peak
    const domPt = spectrum.find((p) => Math.abs(p.frequency - fftResult.dominantFrequency) < 0.05);
    if (domPt) {
      const x = (domPt.frequency / 5.0) * width;
      const y = height - (domPt.magnitude / maxMag) * (height - 18);
      ctx.fillStyle = '#ff7a00';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '10px monospace';
      ctx.fillText(`${domPt.frequency.toFixed(2)} Hz`, Math.min(width - 50, x + 6), y + 3);
    }
  }, [fftResult]);

  return (
    <div className="flex flex-col h-full bg-[#080d19] text-slate-200 font-mono text-xs overflow-y-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h2 className="font-bold text-sm text-white">VIBRATION &amp; FFT ANALYSIS</h2>
        </div>
        <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30">
          REAL-TIME 50 Hz
        </span>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-[#0b1220] border border-slate-800 p-2">
          <div className="text-[10px] text-slate-400">RMS Accel</div>
          <div className="text-sm font-bold text-white mt-0.5">
            {currentMetrics.rmsAcceleration.toFixed(3)} <span className="text-[10px] text-slate-400 font-normal">g</span>
          </div>
        </div>

        <div className="bg-[#0b1220] border border-slate-800 p-2">
          <div className="text-[10px] text-slate-400">Peak Accel</div>
          <div className="text-sm font-bold text-cyan-300 mt-0.5">
            {currentMetrics.peakAcceleration.toFixed(3)} <span className="text-[10px] text-slate-400 font-normal">g</span>
          </div>
        </div>

        <div className="bg-[#0b1220] border border-slate-800 p-2">
          <div className="text-[10px] text-slate-400">Est. Velocity</div>
          <div className="text-sm font-bold text-slate-200 mt-0.5">
            {currentMetrics.estimatedVelocity.toFixed(1)} <span className="text-[10px] text-slate-400 font-normal">mm/s</span>
          </div>
        </div>
      </div>

      {/* Time-Domain Waveform Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Waves className="w-3.5 h-3.5 text-cyan-400" />
            <h3 className="text-[11px] font-semibold text-slate-300 tracking-wider uppercase">
              1. ACCELERATION vs TIME [a_y(t)]
            </h3>
          </div>

          {/* Controls: Pause / Clear / Window */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`p-1 border text-[10px] flex items-center gap-1 transition-colors cursor-pointer ${
                isPaused ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
              title={isPaused ? 'Resume Signal' : 'Pause Signal'}
            >
              {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            </button>

            <button
              onClick={() => { localHistoryRef.current = []; }}
              className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
              title="Clear Signal Buffer"
            >
              <Trash2 className="w-3 h-3" />
            </button>

            <div className="flex border border-slate-800">
              {[1, 5, 10, 30].map((sec) => (
                <button
                  key={sec}
                  onClick={() => setTimeWindowSec(sec)}
                  className={`px-1.5 py-0.5 text-[9px] cursor-pointer ${
                    timeWindowSec === sec
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Canvas */}
        <div className="relative border border-slate-800 bg-[#090e19]">
          <canvas
            ref={canvasRef}
            width={380}
            height={130}
            className="w-full h-[130px] block"
          />
        </div>
      </div>

      {/* Real FFT Analysis Section */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-1">
          <div className="flex items-center gap-2">
            <h3 className="text-[11px] font-semibold text-slate-300 tracking-wider uppercase">
              2. FFT FREQUENCY SPECTRUM (0 – 5 Hz)
            </h3>
          </div>
          <button
            onClick={onExplainFFT}
            className="text-slate-400 hover:text-cyan-400 text-[10px] flex items-center gap-1 cursor-pointer"
          >
            <HelpCircle className="w-3 h-3" /> EXPLAIN FFT
          </button>
        </div>

        {/* FFT Results Readout */}
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="bg-[#0b1220] border border-slate-800 p-2">
            <span className="text-slate-400">Dominant Peak:</span>
            <div className="text-sm font-bold text-orange-400 mt-0.5">
              {fftResult?.dominantFrequency.toFixed(3) || '0.000'} Hz
            </div>
          </div>

          <div className="bg-[#0b1220] border border-slate-800 p-2">
            <span className="text-slate-400">Secondary Peak:</span>
            <div className="text-sm font-bold text-cyan-300 mt-0.5">
              {fftResult?.secondaryFrequency.toFixed(3) || '0.000'} Hz
            </div>
          </div>
        </div>

        {/* FFT Canvas */}
        <div className="relative border border-slate-800 bg-[#090e19]">
          <canvas
            ref={fftCanvasRef}
            width={380}
            height={110}
            className="w-full h-[110px] block"
          />
          <div className="flex justify-between text-[8px] text-slate-500 px-2 py-1 bg-[#070b14] border-t border-slate-800/60">
            <span>0.0 Hz</span>
            <span>1.0 Hz</span>
            <span>2.0 Hz</span>
            <span>3.0 Hz</span>
            <span>4.0 Hz</span>
            <span>5.0 Hz</span>
          </div>
        </div>
      </div>
    </div>
  );
};
