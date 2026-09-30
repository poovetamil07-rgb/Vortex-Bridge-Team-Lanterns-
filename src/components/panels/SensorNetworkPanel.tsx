import React, { useState } from 'react';
import { Radio, Plus, Trash2, Power, Battery, Activity } from 'lucide-react';
import { SensorData } from '../../types/bridge';

interface SensorNetworkPanelProps {
  sensors: SensorData[];
  selectedSensorId: string | null;
  onSelectSensor: (sensorId: string) => void;
  onAddSensor: (newSensor: SensorData) => void;
  onDeleteSensor: (sensorId: string) => void;
  onToggleStatus: (sensorId: string) => void;
}

export const SensorNetworkPanel: React.FC<SensorNetworkPanelProps> = ({
  sensors,
  selectedSensorId,
  onSelectSensor,
  onAddSensor,
  onDeleteSensor,
  onToggleStatus
}) => {
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newType, setNewType] = useState<SensorData['type']>('accelerometer');
  const [newName, setNewName] = useState<string>('Custom Accelerometer Node');
  const [newX, setNewX] = useState<number>(0.65);

  const selectedSensor = sensors.find((s) => s.id === selectedSensorId);

  const handleCreate = () => {
    const nextId = `SEN-0${sensors.length + 1}`;
    let unit = 'g';
    if (newType === 'strain_gauge') unit = 'µε';
    if (newType === 'displacement') unit = 'mm';
    if (newType === 'piezoelectric') unit = 'mW';
    if (newType === 'temperature') unit = '°C';
    if (newType === 'wind_sensor') unit = 'm/s';

    const s: SensorData = {
      id: nextId,
      name: newName,
      type: newType,
      location: `Span Coordinate x = ${newX.toFixed(2)}`,
      xPos: newX,
      yPos: 0,
      zPos: 0,
      status: 'online',
      currentValue: newType === 'accelerometer' ? 0.02 : 10.0,
      unit,
      batteryLevel: 100,
      lastUpdate: 'Just now',
      history: [0.015, 0.018, 0.02, 0.019, 0.02]
    };
    onAddSensor(s);
    setShowAddModal(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#080d19] text-slate-200 font-mono text-xs overflow-y-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-cyan-400" />
          <h2 className="font-bold text-sm text-white">SENSOR NETWORK DIGITAL TWIN</h2>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Plus className="w-3 h-3" /> ADD SENSOR
        </button>
      </div>

      {/* Sensor List Table */}
      <div className="space-y-2">
        {sensors.map((sensor) => {
          const isSelected = sensor.id === selectedSensorId;

          return (
            <div
              key={sensor.id}
              onClick={() => onSelectSensor(sensor.id)}
              className={`p-2.5 border transition-all cursor-pointer ${
                isSelected
                  ? 'border-cyan-500 bg-cyan-950/20'
                  : 'border-slate-800 bg-[#0b1220] hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    sensor.status === 'online'
                      ? 'bg-emerald-400'
                      : sensor.status === 'degraded'
                      ? 'bg-amber-400'
                      : 'bg-red-400'
                  }`} />
                  <span className="font-bold text-white text-xs">{sensor.id}</span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wide">
                    {sensor.type.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="text-xs font-bold text-cyan-300">
                      {typeof sensor.currentValue === 'number' ? sensor.currentValue.toFixed(2) : sensor.currentValue}{' '}
                      <span className="text-[10px] font-normal text-slate-400">{sensor.unit}</span>
                    </span>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleStatus(sensor.id);
                    }}
                    className={`p-1 transition-colors cursor-pointer ${
                      sensor.status === 'online' ? 'text-emerald-400 hover:text-amber-400' : 'text-slate-500 hover:text-emerald-400'
                    }`}
                    title="Toggle Online / Offline"
                  >
                    <Power className="w-3 h-3" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSensor(sensor.id);
                    }}
                    className="p-1 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                    title="Remove Sensor"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 pt-1.5 border-t border-slate-800/60">
                <span>{sensor.location}</span>
                <span className="flex items-center gap-1">
                  <Battery className="w-3 h-3 text-emerald-400" />
                  {sensor.batteryLevel}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Sensor Detailed Inspector */}
      {selectedSensor && (
        <div className="p-3 bg-[#0d1526] border border-cyan-500/50 space-y-2 mt-2">
          <div className="flex items-center justify-between border-b border-cyan-500/30 pb-1.5">
            <span className="font-bold text-cyan-300">{selectedSensor.name}</span>
            <span className="text-[10px] text-slate-400">{selectedSensor.id}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div>
              <span className="text-slate-400">Position along bridge:</span>
              <div className="font-bold text-white mt-0.5">{(selectedSensor.xPos * 215).toFixed(1)} m (x = {selectedSensor.xPos})</div>
            </div>
            <div>
              <span className="text-slate-400">Status:</span>
              <div className="font-bold text-emerald-400 uppercase mt-0.5">{selectedSensor.status}</div>
            </div>
          </div>

          {/* Sparkline */}
          <div className="pt-1">
            <span className="text-[10px] text-slate-400">Recent Telemetry Sparkline:</span>
            <div className="h-10 bg-slate-900 border border-slate-800 mt-1 flex items-end gap-1 p-1">
              {selectedSensor.history.map((val, i) => (
                <div
                  key={i}
                  style={{ height: `${Math.min(100, Math.max(15, (val / (selectedSensor.currentValue || 1)) * 50))}%` }}
                  className="flex-1 bg-cyan-400/80 hover:bg-cyan-300 transition-all"
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Sensor Modal */}
      {showAddModal && (
        <div className="p-3 bg-[#0d1628] border border-cyan-500 space-y-3">
          <h3 className="font-bold text-white text-xs">DEPLOY VIRTUAL SENSOR</h3>
          
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Sensor Type</label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as any)}
              className="w-full bg-[#080d19] border border-slate-700 px-2 py-1 text-white"
            >
              <option value="accelerometer">Accelerometer (g)</option>
              <option value="strain_gauge">Strain Gauge (µε)</option>
              <option value="displacement">Laser Displacement (mm)</option>
              <option value="piezoelectric">Piezoelectric Harvester (mW)</option>
              <option value="wind_sensor">Ultrasonic Anemometer (m/s)</option>
              <option value="temperature">Thermocouple (°C)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Normalized Position (0.0 to 1.0)</label>
            <input
              type="number"
              step="0.05"
              min="0"
              max="1"
              value={newX}
              onChange={(e) => setNewX(parseFloat(e.target.value) || 0.5)}
              className="w-full bg-[#080d19] border border-slate-700 px-2 py-1 text-white"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              className="flex-1 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold transition-colors cursor-pointer"
            >
              DEPLOY TO TWIN
            </button>
            <button
              onClick={() => setShowAddModal(false)}
              className="px-3 py-1.5 bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              CANCEL
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
