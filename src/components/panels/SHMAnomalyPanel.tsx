import React from 'react';
import { ShieldAlert, CheckCircle, AlertTriangle, AlertCircle, Info, RefreshCw } from 'lucide-react';
import { AnomalyReport, SHMBaseline } from '../../types/bridge';

interface SHMAnomalyPanelProps {
  anomalyReport: AnomalyReport;
  baseline: SHMBaseline;
  onRecalibrateBaseline: () => void;
}

export const SHMAnomalyPanel: React.FC<SHMAnomalyPanelProps> = ({
  anomalyReport,
  baseline,
  onRecalibrateBaseline
}) => {
  const isAnomaly = anomalyReport.status === 'POTENTIAL ANOMALY';
  const isMonitor = anomalyReport.status === 'MONITOR';

  return (
    <div className="flex flex-col h-full bg-[#080d19] text-slate-200 font-mono text-xs overflow-y-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-cyan-400" />
          <h2 className="font-bold text-sm text-white">STRUCTURAL HEALTH &amp; AI ANOMALIES</h2>
        </div>
        <span className="text-[10px] text-slate-400 font-semibold px-2 py-0.5 bg-slate-800/80 border border-slate-700">
          EXPLAINABLE AI
        </span>
      </div>

      {/* Main Status Badge */}
      <div className={`p-4 border transition-all ${
        isAnomaly
          ? 'border-red-500/80 bg-red-950/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
          : isMonitor
          ? 'border-amber-500/80 bg-amber-950/20'
          : 'border-emerald-500/80 bg-emerald-950/20'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {isAnomaly ? (
              <AlertCircle className="w-5 h-5 text-red-400" />
            ) : isMonitor ? (
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            ) : (
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            )}
            <div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                OVERALL SHM STATUS
              </div>
              <div className={`text-base font-bold ${
                isAnomaly ? 'text-red-400' : isMonitor ? 'text-amber-300' : 'text-emerald-400'
              }`}>
                {anomalyReport.status}
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">Anomaly Index:</span>
            <span className={`text-base font-bold ${
              isAnomaly ? 'text-red-400' : isMonitor ? 'text-amber-300' : 'text-emerald-400'
            }`}>
              {anomalyReport.score}/100
            </span>
          </div>
        </div>

        {/* Action Recommendation */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-300 leading-relaxed flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
          <span>{anomalyReport.recommendation}</span>
        </div>
      </div>

      {/* Baseline vs Current Deviation Matrix */}
      <div className="space-y-2">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-1">
          <h3 className="text-[11px] font-semibold text-slate-300 tracking-wider uppercase">
            1. BASELINE vs CURRENT METRICS
          </h3>
          <button
            onClick={onRecalibrateBaseline}
            className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            title="Set current telemetry as new nominal baseline"
          >
            <RefreshCw className="w-3 h-3" /> SET AS BASELINE
          </button>
        </div>

        <div className="space-y-1.5">
          {anomalyReport.findings.map((f, idx) => (
            <div
              key={idx}
              className="p-2.5 bg-[#0b1220] border border-slate-800 flex items-center justify-between text-[11px]"
            >
              <div>
                <div className="font-bold text-white">{f.metric}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Base: <span className="text-slate-300">{f.baseline}</span> → Cur: <span className="text-white font-bold">{f.current}</span>
                </div>
              </div>

              <div className="text-right">
                <span className={`px-2 py-0.5 text-[10px] font-bold border ${
                  f.status === 'anomaly'
                    ? 'text-red-400 border-red-500/40 bg-red-500/10'
                    : f.status === 'warning'
                    ? 'text-amber-400 border-amber-500/40 bg-amber-500/10'
                    : 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10'
                }`}>
                  {f.deviation}
                </span>
                <div className="text-[9px] text-slate-500 mt-0.5 uppercase">{f.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* "WHY THIS RESULT?" Section */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center gap-1.5 border-b border-slate-800/80 pb-1">
          <h3 className="text-[11px] font-semibold text-cyan-400 tracking-wider uppercase">
            2. WHY THIS RESULT? (EXPLAINABLE REASONING)
          </h3>
        </div>

        <div className="space-y-2">
          {anomalyReport.reasons.map((reason, idx) => (
            <div
              key={idx}
              className="p-2.5 bg-[#070d18] border-l-2 border-cyan-500 border-t border-r border-b border-slate-800/80 text-[11px] text-slate-300 leading-relaxed"
            >
              <div className="flex items-center gap-1 text-[10px] text-cyan-400 font-bold mb-1">
                <span>REASON FACTOR #{idx + 1}</span>
              </div>
              <p>{reason}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimers */}
      <div className="p-2.5 bg-slate-900/60 border border-slate-800 text-[10px] text-slate-400 leading-relaxed">
        <strong>ENGINEERING VALIDITY NOTICE:</strong> Conceptual SHM assessment based on multi-parameter structural deviation algorithms. Not certified FEM or structural safety sign-off. Field inspection mandatory for identified alerts.
      </div>
    </div>
  );
};
