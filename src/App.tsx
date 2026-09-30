/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Activity,
  Sliders,
  Wind,
  Zap,
  Radio,
  Cpu,
  ShieldAlert,
  FlaskConical,
  FileText,
  Film,
  Maximize2,
  Minimize2,
  Layers,
  HelpCircle,
  RotateCcw
} from 'lucide-react';

import {
  BridgeGeometry,
  BridgeMaterial,
  BridgeStructural,
  WindParameters,
  ModeShapeData,
  SensorData,
  EnergyHarvesterState,
  SHMBaseline,
  CameraPreset,
  ScenarioDefinition
} from './types/bridge';

import { calculateModalParameters } from './physics/bridgeModal';
import { calculateAerodynamics, AerodynamicResults } from './physics/windAero';
import { calculateResonance, ResonanceResult } from './physics/resonance';
import { generateVibrationSample, VibrationMetrics } from './physics/vibrationSignal';
import { calculatePiezoOutput, updateEnergyBalance, DEFAULT_PIEZO_CONFIG } from './physics/energyHarvesting';
import { evaluateStructuralHealth, DEFAULT_BASELINE } from './physics/shmAnomaly';
import { INITIAL_SENSORS, SimulationDataProvider, ESP32Payload } from './data/sensorProvider';

import { BridgeCanvas } from './components/3d/BridgeCanvas';
import { DigitalTwinHUD } from './components/hud/DigitalTwinHUD';
import { CameraControls } from './components/hud/CameraControls';

import { ParametersPanel } from './components/panels/ParametersPanel';
import { ModalAnalysisPanel } from './components/panels/ModalAnalysisPanel';
import { WindResonancePanel } from './components/panels/WindResonancePanel';
import { VibrationFFTPanel } from './components/panels/VibrationFFTPanel';
import { EnergyHarvesterPanel } from './components/panels/EnergyHarvesterPanel';
import { SensorNetworkPanel } from './components/panels/SensorNetworkPanel';
import { ESP32Panel } from './components/panels/ESP32Panel';
import { SHMAnomalyPanel } from './components/panels/SHMAnomalyPanel';
import { ScenarioLabPanel, PRESET_SCENARIOS } from './components/panels/ScenarioLabPanel';
import { CinematicDemoBar, DEMO_STEPS } from './components/panels/CinematicDemoBar';
import { ReportModal } from './components/panels/ReportModal';
import { FormulaExplainerModal } from './components/panels/FormulaExplainerModal';

type ActiveTab = 
  | 'parameters'
  | 'modal'
  | 'wind'
  | 'vibration'
  | 'energy'
  | 'sensors'
  | 'esp32'
  | 'shm'
  | 'scenarios';

export default function App() {
  // 1. Centralized Digital Twin State
  const [geometry, setGeometry] = useState<BridgeGeometry>({
    span1: 22.5,
    mainSpan1: 85.0,
    mainSpan2: 85.0,
    span4: 22.5,
    deckWidth: 14.0,
    deckThickness: 2.8,
    towerHeight: 48.0,
    cableSag: 14.0,
    cableDiameter: 0.28
  });

  const [material, setMaterial] = useState<BridgeMaterial>({
    type: 'steel',
    name: 'Structural Steel (S355)',
    youngsModulus: 2.05e11,
    density: 7850,
    poissonRatio: 0.30,
    dampingRatio: 0.012
  });

  const [structural, setStructural] = useState<BridgeStructural>({
    deckMass: 8500,
    deckStiffness: 1.8e9,
    towerStiffness: 1.0,
    cableStiffness: 2.4e9,
    structuralDamping: 0.015
  });

  const [wind, setWind] = useState<WindParameters>({
    speed: 18.0,
    direction: 90,
    airDensity: 1.225,
    dragCoefficient: 1.2,
    liftCoefficient: 0.8,
    strouhalNumber: 0.20
  });

  const [sensors, setSensors] = useState<SensorData[]>(INITIAL_SENSORS);
  const [selectedSensorId, setSelectedSensorId] = useState<string | null>('ACC-01');

  const [energy, setEnergy] = useState<EnergyHarvesterState>({
    piezoCapacitance: DEFAULT_PIEZO_CONFIG.capacitanceNF,
    piezoCoeffD33: DEFAULT_PIEZO_CONFIG.piezoCoeffD33,
    loadResistance: DEFAULT_PIEZO_CONFIG.loadResistanceKOhm,
    efficiency: DEFAULT_PIEZO_CONFIG.efficiency,
    voltage: 3.4,
    current: 12.3,
    instantaneousPower: 42.0,
    averagePower: 42.0,
    harvestedEnergyTotal: 14200,
    batteryCapacityMWh: DEFAULT_PIEZO_CONFIG.batteryCapacityMWh,
    batterySOC: 64.0,
    consumedPower: DEFAULT_PIEZO_CONFIG.baselineConsumptionMW,
    netPower: 20.0
  });

  const [baseline, setBaseline] = useState<SHMBaseline>(DEFAULT_BASELINE);

  // 2. UI Navigation & View Controls
  const [activeTab, setActiveTab] = useState<ActiveTab>('wind');
  const [isPanelCollapsed, setIsPanelCollapsed] = useState<boolean>(false);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('overview');
  const [magnification, setMagnification] = useState<number>(5);
  const [engineeringView, setEngineeringView] = useState<boolean>(false);
  const [showVortices, setShowVortices] = useState<boolean>(true);
  const [activeModeIndex, setActiveModeIndex] = useState<number>(1);
  const [activeScenarioId, setActiveScenarioId] = useState<string>('normal');

  // System Mode: SIMULATION | ESP32_LIVE | DEMO_MODE
  const [systemMode, setSystemMode] = useState<'SIMULATION' | 'ESP32_LIVE' | 'DEMO_MODE'>('SIMULATION');

  // Modals & Cinematic Tour
  const [explainTopic, setExplainTopic] = useState<string | null>(null);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [isDemoActive, setIsDemoActive] = useState<boolean>(false);
  const [demoStepIndex, setDemoStepIndex] = useState<number>(1);
  const [isDemoPlaying, setIsDemoPlaying] = useState<boolean>(false);

  // Time-domain buffer for real-time graphs and FFT
  const [currentVibration, setCurrentVibration] = useState<VibrationMetrics>({
    accelX: 0.002,
    accelY: 0.021,
    accelZ: 0.006,
    rmsAcceleration: 0.021,
    peakAcceleration: 0.029,
    peakToPeak: 0.058,
    dominantFrequency: 0.42,
    estimatedVelocity: 4.8,
    estimatedDisplacement: 12.4
  });

  const [latestESP32, setLatestESP32] = useState<ESP32Payload>({
    timestamp: Date.now(),
    accelerationX: 0.002,
    accelerationY: 0.021,
    accelerationZ: 0.005,
    voltage: 3.42,
    current: 12.3,
    temperature: 21.4
  });

  const timeRef = useRef<number>(0);
  const simProviderRef = useRef<SimulationDataProvider>(new SimulationDataProvider());

  // 3. Centralized Dependent Physics Calculations
  const modes: ModeShapeData[] = calculateModalParameters(geometry, structural, material);
  const activeMode: ModeShapeData = modes.find((m) => m.modeIndex === activeModeIndex) || modes[0];

  const aerodynamics: AerodynamicResults = calculateAerodynamics(wind, geometry);

  const resonance: ResonanceResult = calculateResonance(
    aerodynamics.vortexFrequency,
    activeMode.frequency,
    structural.structuralDamping,
    aerodynamics.liftForce,
    structural.deckStiffness / 1.8e9
  );

  const offlineSensorsCount = sensors.filter((s) => s.status !== 'online').length;

  const anomalyReport = evaluateStructuralHealth(
    {
      naturalFrequency: activeMode.frequency,
      rmsAcceleration: resonance.rmsAcceleration,
      maxDisplacement: resonance.estimatedDisplacement,
      dampingRatio: structural.structuralDamping,
      frequencyRatio: resonance.frequencyRatio,
      windSpeed: wind.speed,
      isResonant: resonance.isResonant,
      sensorCountOffline: offlineSensorsCount,
      harvestedPower: resonance.estimatedHarvestedPower
    },
    baseline
  );

  // 4. Real-time Simulation Loop
  useEffect(() => {
    let animId: number;

    const tick = () => {
      animId = requestAnimationFrame(tick);
      timeRef.current += 0.02;
      const t = timeRef.current;

      // Update vibration sample
      const vib = generateVibrationSample(
        t,
        activeMode.frequency,
        aerodynamics.vortexFrequency,
        resonance.rmsAcceleration,
        structural.structuralDamping,
        wind.speed,
        activeMode.modeIndex
      );
      setCurrentVibration(vib);

      // Update piezoelectric output based on instantaneous displacement
      const piezo = calculatePiezoOutput(
        resonance.estimatedDisplacement,
        aerodynamics.vortexFrequency,
        DEFAULT_PIEZO_CONFIG
      );

      // Periodically step energy balance and battery SOC
      setEnergy((prev) => {
        const updated = updateEnergyBalance(prev, piezo.averagePower, 0.02);
        return {
          ...updated,
          voltage: piezo.voltage,
          current: piezo.current,
          instantaneousPower: piezo.instantaneousPower
        };
      });

      // Update simulated sensor readings
      if (systemMode === 'ESP32_LIVE') {
        const payload = simProviderRef.current.getLatestReading();
        setLatestESP32(payload);
      }
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [activeMode, aerodynamics.vortexFrequency, resonance, structural.structuralDamping, wind.speed, systemMode]);

  // 5. Cinematic Demo Mode Runner
  useEffect(() => {
    if (!isDemoActive || !isDemoPlaying) return;

    const currentStep = DEMO_STEPS[demoStepIndex - 1];
    if (!currentStep) return;

    // Apply step configuration
    setCameraPreset(currentStep.cameraPreset);
    setWind((prev) => ({ ...prev, speed: currentStep.windSpeed }));
    setMagnification(currentStep.magnification);

    const timer = setTimeout(() => {
      if (demoStepIndex < DEMO_STEPS.length) {
        setDemoStepIndex((prev) => prev + 1);
      } else {
        setIsDemoPlaying(false);
      }
    }, currentStep.durationSeconds * 1000);

    return () => clearTimeout(timer);
  }, [isDemoActive, isDemoPlaying, demoStepIndex]);

  // Handlers for Scenarios
  const handleApplyScenario = (scenario: ScenarioDefinition) => {
    setActiveScenarioId(scenario.id);
    setWind((prev) => ({ ...prev, speed: scenario.windSpeed }));
    setStructural((prev) => ({
      ...prev,
      deckStiffness: 1.8e9 * scenario.deckStiffnessFactor,
      cableStiffness: 2.4e9 * scenario.cableStiffnessFactor,
      structuralDamping: 0.015 * scenario.dampingFactor
    }));

    if (scenario.sensorFault) {
      setSensors((prev) =>
        prev.map((s, idx) => (idx % 2 === 0 ? { ...s, status: 'degraded' } : s))
      );
    } else {
      setSensors(INITIAL_SENSORS);
    }
  };

  // Sensor Actions
  const handleAddSensor = (newSensor: SensorData) => {
    setSensors((prev) => [...prev, newSensor]);
  };

  const handleDeleteSensor = (sensorId: string) => {
    setSensors((prev) => prev.filter((s) => s.id !== sensorId));
  };

  const handleToggleSensorStatus = (sensorId: string) => {
    setSensors((prev) =>
      prev.map((s) =>
        s.id === sensorId
          ? { ...s, status: s.status === 'online' ? 'offline' : 'online' }
          : s
      )
    );
  };

  // Recalibrate Baseline
  const handleRecalibrateBaseline = () => {
    setBaseline({
      naturalFrequency: activeMode.frequency,
      rmsAcceleration: resonance.rmsAcceleration,
      maxDisplacement: resonance.estimatedDisplacement,
      dampingRatio: structural.structuralDamping
    });
  };

  const startCinematicDemo = () => {
    setIsDemoActive(true);
    setDemoStepIndex(1);
    setIsDemoPlaying(true);
    setSystemMode('DEMO_MODE');
  };

  const closeCinematicDemo = () => {
    setIsDemoActive(false);
    setIsDemoPlaying(false);
    setSystemMode('SIMULATION');
  };

  return (
    <div className="flex flex-col w-screen h-screen bg-[#060913] text-slate-100 font-mono overflow-hidden select-none">
      {/* Top Application Header Bar */}
      <header className="h-12 bg-[#080d19]/95 border-b border-slate-800 flex items-center justify-between px-4 z-40 shrink-0 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-cyan-400 rotate-45 border border-cyan-300 shadow-[0_0_8px_#00e5ff]" />
            <h1 className="font-bold text-sm tracking-wider text-white">
              VORTEX<span className="text-cyan-400">BRIDGE</span>
            </h1>
          </div>
          <span className="hidden sm:inline text-[10px] text-slate-400 border-l border-slate-700 pl-3">
            STRUCTURAL DIGITAL TWIN &amp; HARVESTING WORKSTATION
          </span>
        </div>

        {/* Global Action Controls */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={startCinematicDemo}
            className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/50 hover:bg-amber-500/20 text-amber-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Film className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-bold">DEMO TOUR</span>
          </button>

          <button
            onClick={() => setIsReportOpen(true)}
            className="px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/50 hover:bg-cyan-500/20 text-cyan-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-bold">REPORT</span>
          </button>

          <button
            onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            title={isPanelCollapsed ? 'Expand Analysis Panels' : 'Collapse Analysis Panels'}
          >
            {isPanelCollapsed ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* 3D Bridge Digital Twin Viewport (Central Focus) */}
        <div className="flex-1 h-full relative">
          <BridgeCanvas
            geometry={geometry}
            structural={structural}
            wind={wind}
            activeMode={activeMode}
            vibrationAmplitude={resonance.estimatedDisplacement / 1000}
            vortexFrequency={aerodynamics.vortexFrequency}
            magnification={magnification}
            engineeringView={engineeringView}
            sensors={sensors}
            selectedSensorId={selectedSensorId}
            onSelectSensor={(id) => {
              setSelectedSensorId(id);
              setActiveTab('sensors');
              setIsPanelCollapsed(false);
            }}
            cameraPreset={cameraPreset}
            showVortices={showVortices}
          />

          {/* Real-time Digital Twin HUD Overlay */}
          <DigitalTwinHUD
            windSpeed={wind.speed}
            vortexFrequency={aerodynamics.vortexFrequency}
            naturalFrequency={activeMode.frequency}
            resonance={resonance}
            harvestedPower={energy.averagePower}
            batterySOC={energy.batterySOC}
            sensorsOnline={sensors.length - offlineSensorsCount}
            totalSensors={sensors.length}
            systemMode={systemMode}
            onExplain={(topic) => setExplainTopic(topic)}
          />

          {/* Camera & Visualization Controls Overlay */}
          <CameraControls
            currentPreset={cameraPreset}
            onSelectPreset={(p) => setCameraPreset(p)}
            magnification={magnification}
            onSelectMagnification={(m) => setMagnification(m)}
            engineeringView={engineeringView}
            onToggleEngineeringView={() => setEngineeringView(!engineeringView)}
            showVortices={showVortices}
            onToggleVortices={() => setShowVortices(!showVortices)}
            onResetCamera={() => setCameraPreset('overview')}
          />

          {/* Cinematic Tour Floating Controller */}
          <CinematicDemoBar
            isActive={isDemoActive}
            currentStepIndex={demoStepIndex}
            isPlaying={isDemoPlaying}
            onTogglePlay={() => setIsDemoPlaying(!isDemoPlaying)}
            onNextStep={() => setDemoStepIndex((prev) => Math.min(DEMO_STEPS.length, prev + 1))}
            onReset={() => setDemoStepIndex(1)}
            onClose={closeCinematicDemo}
          />
        </div>

        {/* Right Collapsible Engineering Analysis Console */}
        {!isPanelCollapsed && (
          <aside className="w-80 sm:w-96 md:w-[420px] h-full bg-[#080d19] border-l border-slate-800 flex flex-col z-30 shadow-2xl shrink-0">
            {/* Tab Navigation Strip */}
            <div className="flex items-center overflow-x-auto bg-[#060a14] border-b border-slate-800 shrink-0 px-1 py-1 gap-1 text-[11px] scrollbar-none">
              {[
                { id: 'wind', label: 'Wind / Res', icon: Wind },
                { id: 'modal', label: 'Modal (1-5)', icon: Activity },
                { id: 'vibration', label: 'Vib / FFT', icon: Activity },
                { id: 'energy', label: 'Energy PZT', icon: Zap },
                { id: 'parameters', label: 'Model', icon: Sliders },
                { id: 'sensors', label: 'Sensors', icon: Radio },
                { id: 'shm', label: 'SHM AI', icon: ShieldAlert },
                { id: 'scenarios', label: 'Lab', icon: FlaskConical },
                { id: 'esp32', label: 'ESP32', icon: Cpu }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as ActiveTab)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 whitespace-nowrap font-medium transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300 border-b-2 border-cyan-400 font-bold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Panel View */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'parameters' && (
                <ParametersPanel
                  geometry={geometry}
                  structural={structural}
                  material={material}
                  onUpdateGeometry={(g) => setGeometry(g)}
                  onUpdateStructural={(s) => setStructural(s)}
                  onUpdateMaterial={(m) => setMaterial(m)}
                  onReset={() => {
                    setGeometry({
                      span1: 22.5,
                      mainSpan1: 85.0,
                      mainSpan2: 85.0,
                      span4: 22.5,
                      deckWidth: 14.0,
                      deckThickness: 2.8,
                      towerHeight: 48.0,
                      cableSag: 14.0,
                      cableDiameter: 0.28
                    });
                    setStructural({
                      deckMass: 8500,
                      deckStiffness: 1.8e9,
                      towerStiffness: 1.0,
                      cableStiffness: 2.4e9,
                      structuralDamping: 0.015
                    });
                  }}
                />
              )}

              {activeTab === 'modal' && (
                <ModalAnalysisPanel
                  modes={modes}
                  activeModeIndex={activeModeIndex}
                  onSelectMode={(idx) => setActiveModeIndex(idx)}
                />
              )}

              {activeTab === 'wind' && (
                <WindResonancePanel
                  wind={wind}
                  geometry={geometry}
                  aerodynamics={aerodynamics}
                  resonance={resonance}
                  naturalFrequency={activeMode.frequency}
                  dampingRatio={structural.structuralDamping}
                  onUpdateWind={(w) => setWind(w)}
                  onExplain={(t) => setExplainTopic(t)}
                />
              )}

              {activeTab === 'vibration' && (
                <VibrationFFTPanel
                  currentMetrics={currentVibration}
                  recentBuffer={[]}
                  samplingRate={50}
                  onExplainFFT={() => setExplainTopic('fft')}
                />
              )}

              {activeTab === 'energy' && (
                <EnergyHarvesterPanel
                  energy={energy}
                  vibrationAmpMM={resonance.estimatedDisplacement}
                  frequencyHz={aerodynamics.vortexFrequency}
                  onExplain={(t) => setExplainTopic(t)}
                />
              )}

              {activeTab === 'sensors' && (
                <SensorNetworkPanel
                  sensors={sensors}
                  selectedSensorId={selectedSensorId}
                  onSelectSensor={(id) => setSelectedSensorId(id)}
                  onAddSensor={handleAddSensor}
                  onDeleteSensor={handleDeleteSensor}
                  onToggleStatus={handleToggleSensorStatus}
                />
              )}

              {activeTab === 'esp32' && (
                <ESP32Panel
                  systemMode={systemMode}
                  onToggleMode={(mode) => setSystemMode(mode)}
                  latestPayload={latestESP32}
                />
              )}

              {activeTab === 'shm' && (
                <SHMAnomalyPanel
                  anomalyReport={anomalyReport}
                  baseline={baseline}
                  onRecalibrateBaseline={handleRecalibrateBaseline}
                />
              )}

              {activeTab === 'scenarios' && (
                <ScenarioLabPanel
                  activeScenarioId={activeScenarioId}
                  onApplyScenario={handleApplyScenario}
                  baselineMetrics={{
                    fn: DEFAULT_BASELINE.naturalFrequency,
                    fv: 0.42,
                    ratio: 1.0,
                    disp: DEFAULT_BASELINE.maxDisplacement,
                    accel: DEFAULT_BASELINE.rmsAcceleration,
                    power: 28.0
                  }}
                  currentMetrics={{
                    fn: activeMode.frequency,
                    fv: aerodynamics.vortexFrequency,
                    ratio: resonance.frequencyRatio,
                    disp: resonance.estimatedDisplacement,
                    accel: resonance.rmsAcceleration,
                    power: energy.averagePower
                  }}
                />
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Mandatory Engineering Bottom Footer */}
      <footer className="h-7 bg-[#05070e] border-t border-slate-900 px-4 flex items-center justify-between text-[10px] text-slate-500 z-40 shrink-0">
        <span>
          Conceptual engineering simulation. Results are model-dependent and are not a substitute for certified structural analysis, FEM validation, or field inspection.
        </span>
        <div className="flex items-center gap-3">
          <span>Three-span Steinman/Bleich Model</span>
          <span className="text-cyan-500">22.5m - 85m - 85m - 22.5m</span>
        </div>
      </footer>

      {/* Interactive Formula Explainer Modal */}
      <FormulaExplainerModal
        topic={explainTopic}
        onClose={() => setExplainTopic(null)}
        variables={{
          windSpeed: wind.speed,
          strouhal: wind.strouhalNumber,
          deckThickness: geometry.deckThickness,
          density: wind.airDensity,
          cd: wind.dragCoefficient,
          cl: wind.liftCoefficient,
          area: (geometry.span1 + geometry.mainSpan1 + geometry.mainSpan2 + geometry.span4) * geometry.deckThickness,
          fn: activeMode.frequency,
          fv: aerodynamics.vortexFrequency,
          ratio: resonance.frequencyRatio,
          zeta: structural.structuralDamping,
          voltage: energy.voltage,
          current: energy.current,
          power: energy.averagePower
        }}
      />

      {/* Engineering Report Generator & Download Modal */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        geometry={geometry}
        material={material}
        structural={structural}
        wind={wind}
        aerodynamics={aerodynamics}
        modes={modes}
        resonance={resonance}
        sensors={sensors}
        energy={energy}
        anomalyReport={anomalyReport}
        systemMode={systemMode}
      />
    </div>
  );
}
