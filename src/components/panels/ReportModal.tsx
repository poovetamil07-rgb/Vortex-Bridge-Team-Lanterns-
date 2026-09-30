import React from 'react';
import { X, FileText, Download, Printer, CheckCircle, AlertTriangle } from 'lucide-react';
import { BridgeGeometry, BridgeMaterial, BridgeStructural, WindParameters, ModeShapeData, SensorData, EnergyHarvesterState, AnomalyReport } from '../../types/bridge';
import { AerodynamicResults } from '../../physics/windAero';
import { ResonanceResult } from '../../physics/resonance';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  geometry: BridgeGeometry;
  material: BridgeMaterial;
  structural: BridgeStructural;
  wind: WindParameters;
  aerodynamics: AerodynamicResults;
  modes: ModeShapeData[];
  resonance: ResonanceResult;
  sensors: SensorData[];
  energy: EnergyHarvesterState;
  anomalyReport: AnomalyReport;
  systemMode: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  geometry,
  material,
  structural,
  wind,
  aerodynamics,
  modes,
  resonance,
  sensors,
  energy,
  anomalyReport,
  systemMode
}) => {
  if (!isOpen) return null;

  const timestamp = new Date().toISOString();
  const totalLength = geometry.span1 + geometry.mainSpan1 + geometry.mainSpan2 + geometry.span4;

  const handleExportJSON = () => {
    const reportData = {
      project: 'VortexBridge Digital Twin',
      reportType: 'Comprehensive Structural Dynamics & Energy Harvesting Assessment',
      generatedAt: timestamp,
      systemMode,
      geometry,
      material,
      structural,
      wind,
      aerodynamics,
      modes,
      resonance,
      sensors,
      energy,
      anomalyReport,
      disclaimer:
        'Conceptual engineering simulation. Results are model-dependent and are not a substitute for certified structural analysis, FEM validation, or field inspection.'
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VortexBridge_Report_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    let csv = 'SECTION,PARAMETER,VALUE,UNIT\n';
    csv += `METADATA,Bridge Name,VortexBridge Digital Twin,\n`;
    csv += `METADATA,Timestamp,${timestamp},\n`;
    csv += `METADATA,System Mode,${systemMode},\n`;
    csv += `GEOMETRY,Total Length,${totalLength},m\n`;
    csv += `GEOMETRY,Main Span 1,${geometry.mainSpan1},m\n`;
    csv += `GEOMETRY,Main Span 2,${geometry.mainSpan2},m\n`;
    csv += `GEOMETRY,Deck Depth,${geometry.deckThickness},m\n`;
    csv += `GEOMETRY,Tower Height,${geometry.towerHeight},m\n`;
    csv += `AERODYNAMICS,Wind Velocity,${wind.speed},m/s\n`;
    csv += `AERODYNAMICS,Dynamic Pressure,${aerodynamics.dynamicPressure},Pa\n`;
    csv += `AERODYNAMICS,Vortex Frequency,${aerodynamics.vortexFrequency},Hz\n`;
    csv += `AERODYNAMICS,Drag Force,${aerodynamics.dragForce},kN\n`;
    csv += `RESONANCE,Frequency Ratio,${resonance.frequencyRatio},\n`;
    csv += `RESONANCE,Dynamic Amplification Q,${resonance.magnificationFactor},\n`;
    csv += `RESONANCE,RMS Acceleration,${resonance.rmsAcceleration},g\n`;
    csv += `RESONANCE,Max Displacement,${resonance.estimatedDisplacement},mm\n`;
    csv += `ENERGY,Harvested Power,${energy.averagePower},mW\n`;
    csv += `ENERGY,Consumed Power,${energy.consumedPower},mW\n`;
    csv += `ENERGY,Battery SOC,${energy.batterySOC},%\n`;
    csv += `SHM,Status,${anomalyReport.status},\n`;
    csv += `SHM,Anomaly Score,${anomalyReport.score},/100\n`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VortexBridge_Telemetry_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 font-mono text-xs overflow-y-auto">
      <div className="w-full max-w-4xl max-h-[92vh] bg-[#080d19] border border-cyan-500/80 shadow-2xl flex flex-col text-slate-200">
        {/* Header Bar */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-[#060a14]">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <h2 className="font-bold text-base text-white">ENGINEERING AUDIT &amp; TELEMETRY REPORT</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>PRINT / PDF</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>

            <button
              onClick={handleExportJSON}
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON EXPORT</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Body */}
        <div className="p-6 overflow-y-auto space-y-6 print:p-0 print:text-black">
          {/* Cover & Overview Title */}
          <div className="border-b border-slate-700 pb-4">
            <div className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold">
              AUTONOMOUS DIGITAL TWIN RESEARCH PROTOTYPE
            </div>
            <h1 className="text-xl font-bold text-white mt-1">
              VORTEXBRIDGE STRUCTURAL DYNAMICS &amp; ENERGY HARVESTING REPORT
            </h1>
            <div className="flex flex-wrap gap-4 text-[11px] text-slate-400 mt-2">
              <span>Timestamp: <strong className="text-slate-200">{timestamp}</strong></span>
              <span>System State: <strong className="text-cyan-300">{systemMode}</strong></span>
              <span>Geometry: <strong className="text-slate-200">22.5m - 85m - 85m - 22.5m ({totalLength}m)</strong></span>
            </div>
          </div>

          {/* Section 1: Executive Summary */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              1. EXECUTIVE SUMMARY &amp; SHM EVALUATION
            </h3>
            <div className="p-3 bg-[#0b1220] border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Structural Health Status</span>
                <div className={`text-base font-bold ${
                  anomalyReport.status === 'POTENTIAL ANOMALY' ? 'text-red-400' : 'text-emerald-400'
                }`}>
                  {anomalyReport.status} (Score: {anomalyReport.score}/100)
                </div>
                <p className="text-[11px] text-slate-300 mt-1">{anomalyReport.recommendation}</p>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase">Resonance Coupling</span>
                <div className="text-base font-bold text-amber-300">{resonance.region}</div>
                <div className="text-[10px] text-slate-400 mt-1">Ratio: {resonance.frequencyRatio.toFixed(3)}</div>
              </div>
            </div>
          </div>

          {/* Section 2: Bridge Geometry & Materials */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              2. BRIDGE SPECIFICATION &amp; MATERIAL PROPERTIES
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
              <div className="p-2 bg-[#0b1220] border border-slate-800">
                <span className="text-[10px] text-slate-400">Total Length</span>
                <div className="font-bold text-white">{totalLength} m</div>
              </div>
              <div className="p-2 bg-[#0b1220] border border-slate-800">
                <span className="text-[10px] text-slate-400">Deck Depth (D)</span>
                <div className="font-bold text-white">{geometry.deckThickness} m</div>
              </div>
              <div className="p-2 bg-[#0b1220] border border-slate-800">
                <span className="text-[10px] text-slate-400">Tower Height</span>
                <div className="font-bold text-white">{geometry.towerHeight} m</div>
              </div>
              <div className="p-2 bg-[#0b1220] border border-slate-800">
                <span className="text-[10px] text-slate-400">Cable Sag</span>
                <div className="font-bold text-white">{geometry.cableSag} m</div>
              </div>
              <div className="p-2 bg-[#0b1220] border border-slate-800">
                <span className="text-[10px] text-slate-400">Material Type</span>
                <div className="font-bold text-white">{material.name}</div>
              </div>
              <div className="p-2 bg-[#0b1220] border border-slate-800">
                <span className="text-[10px] text-slate-400">Young's Modulus (E)</span>
                <div className="font-bold text-white">{(material.youngsModulus / 1e9).toFixed(1)} GPa</div>
              </div>
              <div className="p-2 bg-[#0b1220] border border-slate-800">
                <span className="text-[10px] text-slate-400">Deck Mass</span>
                <div className="font-bold text-white">{structural.deckMass} kg/m</div>
              </div>
              <div className="p-2 bg-[#0b1220] border border-slate-800">
                <span className="text-[10px] text-slate-400">Damping (ζ)</span>
                <div className="font-bold text-white">{(structural.structuralDamping * 100).toFixed(2)}%</div>
              </div>
            </div>
          </div>

          {/* Section 3: Aerodynamic Forces & Vortex Shedding */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              3. AERODYNAMICS &amp; VON KÁRMÁN VORTEX DETACHMENT
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
              <div className="p-2 bg-[#0b1220] border border-slate-800">
                <span className="text-[10px] text-slate-400">Wind Velocity</span>
                <div className="font-bold text-cyan-300">{wind.speed} m/s</div>
              </div>
              <div className="p-2 bg-[#0b1220] border border-slate-800">
                <span className="text-[10px] text-slate-400">Dynamic Pressure</span>
                <div className="font-bold text-white">{aerodynamics.dynamicPressure} Pa</div>
              </div>
              <div className="p-2 bg-[#0b1220] border border-slate-800">
                <span className="text-[10px] text-slate-400">Vortex Freq (fv)</span>
                <div className="font-bold text-cyan-300">{aerodynamics.vortexFrequency} Hz</div>
              </div>
              <div className="p-2 bg-[#0b1220] border border-slate-800">
                <span className="text-[10px] text-slate-400">Total Drag Force</span>
                <div className="font-bold text-white">{aerodynamics.dragForce} kN</div>
              </div>
            </div>
          </div>

          {/* Section 4: Modal Analysis */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              4. MODAL EIGENSOLUTIONS (MODES 1 TO 5)
            </h3>
            <div className="overflow-x-auto border border-slate-800">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-[#0b1220] text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-2">Mode</th>
                    <th className="p-2">Classification</th>
                    <th className="p-2">Frequency (Hz)</th>
                    <th className="p-2">Period (s)</th>
                    <th className="p-2">Rel Disp (mm)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-[#080d19]">
                  {modes.map((m) => (
                    <tr key={m.modeIndex}>
                      <td className="p-2 font-bold text-white">Mode {m.modeIndex}</td>
                      <td className="p-2 text-slate-300">{m.type}</td>
                      <td className="p-2 font-bold text-cyan-300">{m.frequency.toFixed(3)}</td>
                      <td className="p-2 text-slate-400">{m.period.toFixed(3)}</td>
                      <td className="p-2 text-slate-300">{m.maxRelativeDisplacement}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 5: Energy Harvesting & Balance */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              5. PIEZOELECTRIC HARVESTING &amp; BATTERY AUTONOMY
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
              <div className="p-2 bg-[#0b1220] border border-slate-800">
                <span className="text-[10px] text-slate-400">Harvested Power</span>
                <div className="font-bold text-orange-400">{energy.averagePower} mW</div>
              </div>
              <div className="p-2 bg-[#0b1220] border border-slate-800">
                <span className="text-[10px] text-slate-400">Total Consumption</span>
                <div className="font-bold text-slate-300">{energy.consumedPower} mW</div>
              </div>
              <div className="p-2 bg-[#0b1220] border border-slate-800">
                <span className="text-[10px] text-slate-400">Net Power</span>
                <div className={`font-bold ${energy.netPower > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {energy.netPower > 0 ? '+' : ''}{energy.netPower} mW
                </div>
              </div>
              <div className="p-2 bg-[#0b1220] border border-slate-800">
                <span className="text-[10px] text-slate-400">Battery SOC</span>
                <div className="font-bold text-emerald-400">{energy.batterySOC}%</div>
              </div>
            </div>
          </div>

          {/* Mandatory Footer Disclaimer */}
          <div className="p-4 bg-slate-900 border border-slate-800 text-[10px] text-slate-400 leading-relaxed">
            <strong>MANDATORY ENGINEERING DISCLAIMER:</strong> Conceptual engineering simulation. Results are model-dependent and are not a substitute for certified structural analysis, FEM validation, or field inspection.
          </div>
        </div>
      </div>
    </div>
  );
};
