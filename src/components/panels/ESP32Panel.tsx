import React, { useState } from 'react';
import { Cpu, Wifi, WifiOff, Terminal, RefreshCw, Send, Check } from 'lucide-react';
import { ESP32Payload } from '../../data/sensorProvider';

interface ESP32PanelProps {
  systemMode: 'SIMULATION' | 'ESP32_LIVE' | 'DEMO_MODE';
  onToggleMode: (mode: 'SIMULATION' | 'ESP32_LIVE') => void;
  latestPayload: ESP32Payload;
}

export const ESP32Panel: React.FC<ESP32PanelProps> = ({
  systemMode,
  onToggleMode,
  latestPayload
}) => {
  const [ipAddress, setIpAddress] = useState<string>('192.168.1.145');
  const [port, setPort] = useState<number>(8080);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [injectedPayload, setInjectedPayload] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const isLive = systemMode === 'ESP32_LIVE';

  const handleConnectToggle = () => {
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      onToggleMode(isLive ? 'SIMULATION' : 'ESP32_LIVE');
    }, 700);
  };

  return (
    <div className="flex flex-col h-full bg-[#080d19] text-slate-200 font-mono text-xs overflow-y-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-emerald-400" />
          <h2 className="font-bold text-sm text-white">ESP32 SENSOR INTEGRATION</h2>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 border ${
          isLive 
            ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10' 
            : 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10'
        }`}>
          {isLive ? 'ESP32 LIVE STREAM' : 'SIMULATION PROVIDER'}
        </span>
      </div>

      <p className="text-[11px] text-slate-400 leading-relaxed">
        Connects external microcontrollers (ESP32 / Raspberry Pi Pico / STM32) over WiFi / MQTT / REST API directly into the VortexBridge structural digital twin.
      </p>

      {/* Connection Config Card */}
      <div className="p-3 bg-[#0b1220] border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-300 uppercase">TELEMETRY LINK</span>
          <div className="flex items-center gap-1 text-[10px]">
            {isLive ? (
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <Wifi className="w-3 h-3 animate-pulse" /> CONNECTED
              </span>
            ) : (
              <span className="flex items-center gap-1 text-slate-500">
                <WifiOff className="w-3 h-3" /> LOCAL SIMULATOR
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <label className="text-[10px] text-slate-400 block mb-1">Target Endpoint / IP</label>
            <input
              type="text"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
              className="w-full bg-[#0d1527] border border-slate-800 px-2 py-1.5 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Port</label>
            <input
              type="number"
              value={port}
              onChange={(e) => setPort(parseInt(e.target.value) || 8080)}
              className="w-full bg-[#0d1527] border border-slate-800 px-2 py-1.5 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <button
          onClick={handleConnectToggle}
          disabled={isConnecting}
          className={`w-full py-2 font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
            isLive
              ? 'bg-amber-600 hover:bg-amber-500 text-slate-950'
              : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950'
          }`}
        >
          {isConnecting ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : isLive ? (
            <WifiOff className="w-3.5 h-3.5" />
          ) : (
            <Wifi className="w-3.5 h-3.5" />
          )}
          <span>{isLive ? 'SWITCH TO SIMULATION' : 'CONNECT ESP32 HARDWARE STREAM'}</span>
        </button>
      </div>

      {/* Live Stream Inspector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-1">
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <h3 className="text-[11px] font-semibold text-slate-300 tracking-wider uppercase">
              LIVE JSON PACKET INSPECTOR
            </h3>
          </div>
          <span className="text-[9px] text-slate-500">Rate: 50 Hz</span>
        </div>

        {/* Formatted Code Block */}
        <div className="bg-[#050810] border border-slate-800 p-3 font-mono text-[11px] text-emerald-400 overflow-x-auto rounded">
          <pre>{JSON.stringify(latestPayload, null, 2)}</pre>
        </div>
      </div>

      {/* Packet Structure Documentation */}
      <div className="p-3 bg-[#0b1220] border border-slate-800 text-[10px] text-slate-400 space-y-1.5">
        <div className="font-bold text-slate-200">EXPECTED ESP32 C++ STRUCT / JSON PAYLOAD:</div>
        <div>• <code>accelerationX, Y, Z</code>: MPU6050 / ADXL345 3-axis readings in g</div>
        <div>• <code>voltage, current</code>: INA219 / ACS712 piezo energy metrics in V and mA</div>
        <div>• <code>temperature</code>: DS18B20 / ambient sensor in °C</div>
      </div>
    </div>
  );
};
