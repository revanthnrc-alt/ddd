import React, { useState } from 'react';
import { Play, Wand2, ShieldCheck, RotateCcw } from 'lucide-react';
import { RedTeamScenario } from '../../types';

interface ControlPanelProps {
  scenarios: RedTeamScenario[];
  onScenarioChange: (id: string) => void;
  onRun: (speed: number) => void;
  onGeneratePatch: () => void;
  onApplyPatch: () => void;
  onReset: () => void;
  isLoading: boolean;
  isSimulating: boolean;
  isPatchAvailable: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  scenarios, onScenarioChange, onRun, onGeneratePatch, onApplyPatch, onReset,
  isLoading, isSimulating, isPatchAvailable
}) => {
  const [speed, setSpeed] = useState(1);

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col h-full text-gray-300">
      <h2 className="text-lg font-bold text-green-400 mb-4">Simulation Controls</h2>
      
      <div className="space-y-6 flex-grow">
        <div>
          <label htmlFor="scenario-select" className="block text-sm font-medium mb-1">Attack Scenario</label>
          <select id="scenario-select" onChange={(e) => onScenarioChange(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-green-500 focus:border-green-500" disabled={isSimulating}>
            {scenarios.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="speed-slider" className="block text-sm font-medium mb-1">Simulation Speed: {speed}x</label>
          <input id="speed-slider" type="range" min="0.5" max="2" step="0.5" value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500" disabled={isSimulating} />
        </div>
        <div className="space-y-3">
          <button onClick={() => onRun(speed)} disabled={isLoading || isSimulating} className="w-full flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-all duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed">
             {isSimulating ? 'Simulating...' : 'Run Simulation'}
          </button>
          <button onClick={onGeneratePatch} disabled={isLoading || isSimulating || isPatchAvailable} className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-all duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed">
            <Wand2 size={18} className="mr-2"/> Generate AI Patch
          </button>
          <button onClick={onApplyPatch} disabled={isLoading || isSimulating || !isPatchAvailable} className="w-full flex items-center justify-center bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-md transition-all duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed">
            <ShieldCheck size={18} className="mr-2"/> Apply Patch
          </button>
        </div>
      </div>
      <div className="text-xs text-gray-500 bg-black/20 p-2 rounded-md mt-4">
        <p className="font-bold">Safety Note:</p>
        <p>This simulator is for defensive testing and training only. It does not instruct or enable offensive activity.</p>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-700">
        <button onClick={onReset} disabled={isSimulating} className="w-full flex items-center justify-center bg-red-600/80 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition-all duration-200 disabled:bg-gray-600">
          <RotateCcw size={18} className="mr-2"/> Reset All
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;