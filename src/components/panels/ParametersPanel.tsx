import React, { useState } from 'react';
import { Sliders, RotateCcw, Check, Save } from 'lucide-react';
import { BridgeGeometry, BridgeStructural, BridgeMaterial, MaterialType } from '../../types/bridge';

interface ParametersPanelProps {
  geometry: BridgeGeometry;
  structural: BridgeStructural;
  material: BridgeMaterial;
  onUpdateGeometry: (geom: BridgeGeometry) => void;
  onUpdateStructural: (struct: BridgeStructural) => void;
  onUpdateMaterial: (mat: BridgeMaterial) => void;
  onReset: () => void;
}

const MATERIAL_PRESETS: Record<MaterialType, BridgeMaterial> = {
  steel: {
    type: 'steel',
    name: 'Structural Steel (S355)',
    youngsModulus: 2.05e11,
    density: 7850,
    poissonRatio: 0.30,
    dampingRatio: 0.012
  },
  concrete: {
    type: 'concrete',
    name: 'High-Strength Concrete (C50/60)',
    youngsModulus: 3.7e10,
    density: 2500,
    poissonRatio: 0.20,
    dampingRatio: 0.025
  },
  composite: {
    type: 'composite',
    name: 'Carbon-Epoxy / Steel Hybrid',
    youngsModulus: 1.45e11,
    density: 4200,
    poissonRatio: 0.26,
    dampingRatio: 0.018
  },
  custom: {
    type: 'custom',
    name: 'User Defined Material',
    youngsModulus: 1.8e11,
    density: 6500,
    poissonRatio: 0.28,
    dampingRatio: 0.015
  }
};

export const ParametersPanel: React.FC<ParametersPanelProps> = ({
  geometry,
  structural,
  material,
  onUpdateGeometry,
  onUpdateStructural,
  onUpdateMaterial,
  onReset
}) => {
  const [localGeom, setLocalGeom] = useState<BridgeGeometry>(geometry);
  const [localStruct, setLocalStruct] = useState<BridgeStructural>(structural);
  const [localMat, setLocalMat] = useState<BridgeMaterial>(material);
  const [appliedNotification, setAppliedNotification] = useState<boolean>(false);

  const handleApply = () => {
    onUpdateGeometry(localGeom);
    onUpdateStructural(localStruct);
    onUpdateMaterial(localMat);
    setAppliedNotification(true);
    setTimeout(() => setAppliedNotification(false), 2000);
  };

  const handleSelectMaterialType = (type: MaterialType) => {
    const preset = MATERIAL_PRESETS[type];
    setLocalMat(preset);
  };

  return (
    <div className="flex flex-col h-full bg-[#080d19] text-slate-200 font-mono text-xs overflow-y-auto p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h2 className="font-bold text-sm text-white">BRIDGE PARAMETER ENGINE</h2>
        </div>
        <span className="text-[10px] text-slate-400 uppercase">MODEL SPECIFICATION</span>
      </div>

      {/* Geometry Section */}
      <div className="space-y-3">
        <h3 className="text-[11px] font-semibold text-cyan-400 tracking-wider uppercase border-b border-slate-800/60 pb-1">
          1. GEOMETRY
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Span 1 (Side)</label>
            <div className="flex items-center bg-[#0d1527] border border-slate-800 px-2 py-1.5 focus-within:border-cyan-500">
              <input
                type="number"
                step="0.5"
                min="10"
                max="50"
                value={localGeom.span1}
                onChange={(e) => setLocalGeom({ ...localGeom, span1: parseFloat(e.target.value) || 22.5 })}
                className="w-full bg-transparent text-white focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 ml-1">m</span>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Main Span 1</label>
            <div className="flex items-center bg-[#0d1527] border border-slate-800 px-2 py-1.5 focus-within:border-cyan-500">
              <input
                type="number"
                step="1"
                min="40"
                max="160"
                value={localGeom.mainSpan1}
                onChange={(e) => setLocalGeom({ ...localGeom, mainSpan1: parseFloat(e.target.value) || 85.0 })}
                className="w-full bg-transparent text-white focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 ml-1">m</span>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Main Span 2</label>
            <div className="flex items-center bg-[#0d1527] border border-slate-800 px-2 py-1.5 focus-within:border-cyan-500">
              <input
                type="number"
                step="1"
                min="40"
                max="160"
                value={localGeom.mainSpan2}
                onChange={(e) => setLocalGeom({ ...localGeom, mainSpan2: parseFloat(e.target.value) || 85.0 })}
                className="w-full bg-transparent text-white focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 ml-1">m</span>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Span 4 (Side)</label>
            <div className="flex items-center bg-[#0d1527] border border-slate-800 px-2 py-1.5 focus-within:border-cyan-500">
              <input
                type="number"
                step="0.5"
                min="10"
                max="50"
                value={localGeom.span4}
                onChange={(e) => setLocalGeom({ ...localGeom, span4: parseFloat(e.target.value) || 22.5 })}
                className="w-full bg-transparent text-white focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 ml-1">m</span>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Deck Width</label>
            <div className="flex items-center bg-[#0d1527] border border-slate-800 px-2 py-1.5 focus-within:border-cyan-500">
              <input
                type="number"
                step="0.5"
                min="8"
                max="26"
                value={localGeom.deckWidth}
                onChange={(e) => setLocalGeom({ ...localGeom, deckWidth: parseFloat(e.target.value) || 14.0 })}
                className="w-full bg-transparent text-white focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 ml-1">m</span>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Deck Depth (D)</label>
            <div className="flex items-center bg-[#0d1527] border border-slate-800 px-2 py-1.5 focus-within:border-cyan-500">
              <input
                type="number"
                step="0.1"
                min="1.2"
                max="6.0"
                value={localGeom.deckThickness}
                onChange={(e) => setLocalGeom({ ...localGeom, deckThickness: parseFloat(e.target.value) || 2.8 })}
                className="w-full bg-transparent text-white focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 ml-1">m</span>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Tower Height</label>
            <div className="flex items-center bg-[#0d1527] border border-slate-800 px-2 py-1.5 focus-within:border-cyan-500">
              <input
                type="number"
                step="1"
                min="25"
                max="90"
                value={localGeom.towerHeight}
                onChange={(e) => setLocalGeom({ ...localGeom, towerHeight: parseFloat(e.target.value) || 48.0 })}
                className="w-full bg-transparent text-white focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 ml-1">m</span>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Cable Sag</label>
            <div className="flex items-center bg-[#0d1527] border border-slate-800 px-2 py-1.5 focus-within:border-cyan-500">
              <input
                type="number"
                step="0.5"
                min="5"
                max="30"
                value={localGeom.cableSag}
                onChange={(e) => setLocalGeom({ ...localGeom, cableSag: parseFloat(e.target.value) || 14.0 })}
                className="w-full bg-transparent text-white focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 ml-1">m</span>
            </div>
          </div>
        </div>
      </div>

      {/* Structural Properties Section */}
      <div className="space-y-3">
        <h3 className="text-[11px] font-semibold text-orange-400 tracking-wider uppercase border-b border-slate-800/60 pb-1">
          2. STRUCTURAL PROPERTIES
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Deck Mass</label>
            <div className="flex items-center bg-[#0d1527] border border-slate-800 px-2 py-1.5 focus-within:border-orange-500">
              <input
                type="number"
                step="100"
                value={localStruct.deckMass}
                onChange={(e) => setLocalStruct({ ...localStruct, deckMass: parseFloat(e.target.value) || 8500 })}
                className="w-full bg-transparent text-white focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 ml-1">kg/m</span>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Deck Stiffness (EI)</label>
            <div className="flex items-center bg-[#0d1527] border border-slate-800 px-2 py-1.5 focus-within:border-orange-500">
              <input
                type="number"
                step="1e8"
                value={localStruct.deckStiffness}
                onChange={(e) => setLocalStruct({ ...localStruct, deckStiffness: parseFloat(e.target.value) || 1.8e9 })}
                className="w-full bg-transparent text-white focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 ml-1">N·m²</span>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Cable Stiffness (EA)</label>
            <div className="flex items-center bg-[#0d1527] border border-slate-800 px-2 py-1.5 focus-within:border-orange-500">
              <input
                type="number"
                step="1e8"
                value={localStruct.cableStiffness}
                onChange={(e) => setLocalStruct({ ...localStruct, cableStiffness: parseFloat(e.target.value) || 2.4e9 })}
                className="w-full bg-transparent text-white focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 ml-1">N</span>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Structural Damping (ζ)</label>
            <div className="flex items-center bg-[#0d1527] border border-slate-800 px-2 py-1.5 focus-within:border-orange-500">
              <input
                type="number"
                step="0.001"
                min="0.005"
                max="0.08"
                value={localStruct.structuralDamping}
                onChange={(e) => setLocalStruct({ ...localStruct, structuralDamping: parseFloat(e.target.value) || 0.015 })}
                className="w-full bg-transparent text-white focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 ml-1">ratio</span>
            </div>
          </div>
        </div>
      </div>

      {/* Material Specification */}
      <div className="space-y-3">
        <h3 className="text-[11px] font-semibold text-amber-400 tracking-wider uppercase border-b border-slate-800/60 pb-1">
          3. MATERIAL SPECIFICATION
        </h3>
        <div className="grid grid-cols-4 gap-1.5">
          {(['steel', 'concrete', 'composite', 'custom'] as MaterialType[]).map((type) => (
            <button
              key={type}
              onClick={() => handleSelectMaterialType(type)}
              className={`py-1.5 px-2 text-center uppercase text-[10px] font-semibold transition-colors cursor-pointer ${
                localMat.type === type
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Young's Modulus (E)</label>
            <div className="flex items-center bg-[#0d1527] border border-slate-800 px-2 py-1.5 focus-within:border-amber-500">
              <input
                type="number"
                step="1e9"
                value={localMat.youngsModulus}
                onChange={(e) => setLocalMat({ ...localMat, youngsModulus: parseFloat(e.target.value) || 2.05e11 })}
                className="w-full bg-transparent text-white focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 ml-1">Pa</span>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Mass Density (ρ)</label>
            <div className="flex items-center bg-[#0d1527] border border-slate-800 px-2 py-1.5 focus-within:border-amber-500">
              <input
                type="number"
                step="50"
                value={localMat.density}
                onChange={(e) => setLocalMat({ ...localMat, density: parseFloat(e.target.value) || 7850 })}
                className="w-full bg-transparent text-white focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 ml-1">kg/m³</span>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Poisson's Ratio (ν)</label>
            <div className="flex items-center bg-[#0d1527] border border-slate-800 px-2 py-1.5 focus-within:border-amber-500">
              <input
                type="number"
                step="0.01"
                min="0.1"
                max="0.45"
                value={localMat.poissonRatio}
                onChange={(e) => setLocalMat({ ...localMat, poissonRatio: parseFloat(e.target.value) || 0.30 })}
                className="w-full bg-transparent text-white focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 ml-1">ν</span>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Material Damping</label>
            <div className="flex items-center bg-[#0d1527] border border-slate-800 px-2 py-1.5 focus-within:border-amber-500">
              <input
                type="number"
                step="0.001"
                value={localMat.dampingRatio}
                onChange={(e) => setLocalMat({ ...localMat, dampingRatio: parseFloat(e.target.value) || 0.012 })}
                className="w-full bg-transparent text-white focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 ml-1">ζ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex items-center gap-2">
        <button
          onClick={handleApply}
          className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          {appliedNotification ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          <span>{appliedNotification ? 'APPLIED TO TWIN' : 'APPLY MODEL'}</span>
        </button>

        <button
          onClick={() => {
            onReset();
            setLocalGeom(geometry);
            setLocalStruct(structural);
            setLocalMat(material);
          }}
          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Reset to Reference Calibration"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>RESET</span>
        </button>
      </div>
    </div>
  );
};
