import React, { useState } from 'react';
import { Play, Square, Search } from 'lucide-react';

interface ControlPanelProps {
  isStreaming: boolean;
  onStartStream: (pollInterval: number) => void;
  onStopStream: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ isStreaming, onStartStream, onStopStream }) => {
  const [keywords, setKeywords] = useState('protest, smuggle, convoy, package, blockade, Wagah, घेराव');
  const [pollInterval, setPollInterval] = useState(10);

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col h-auto text-gray-300">
      <h2 className="text-lg font-bold text-blue-400 mb-4">Radar Controls</h2>
      <div className="space-y-6">
        <div>
          <label htmlFor="keywords-input" className="block text-sm font-medium mb-1">Keywords</label>
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input id="keywords-input" type="text" value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="e.g. protest, border" className="w-full bg-gray-700 border border-gray-600 rounded-md pl-10 pr-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500" disabled={isStreaming}/>
          </div>
        </div>
        <div>
          <label htmlFor="poll-interval" className="block text-sm font-medium mb-1">Poll Interval: {pollInterval}s</label>
          <input id="poll-interval" type="range" min="5" max="30" step="5" value={pollInterval} onChange={(e) => setPollInterval(parseInt(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500" disabled={isStreaming}/>
        </div>
        <div className="pt-2">
          {isStreaming ? (
            <button onClick={onStopStream} className="w-full flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
              <Square size={18} className="mr-2"/> Stop Stream
            </button>
          ) : (
            <button onClick={() => onStartStream(pollInterval)} className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
              <Play size={18} className="mr-2"/> Start Stream
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;