import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { backendClient, useMockMode } from '../../api/backendClient';

interface TopBarProps {
  title: string;
}

const TopBar: React.FC<TopBarProps> = ({ title }) => {
  const { isMockMode, toggleMockMode } = useMockMode();

  return (
    <header className="flex items-center justify-between p-3 bg-gray-800/50 border-b border-gray-700/50 z-10">
      <div>
        <h1 className="text-xs text-green-400 uppercase tracking-widest">Unified Command Center — Indian Border Defense</h1>
        <p className="text-xl font-bold text-gray-200 tracking-wider">{title}</p>
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <span className={`text-xs font-mono uppercase ${isMockMode ? 'text-amber-400' : 'text-cyan-400'}`}>
            {isMockMode ? 'Mock Mode' : 'Live Mode'}
          </span>
          <button
            onClick={toggleMockMode}
            className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-gray-900 bg-gray-600"
            aria-label="Toggle Mock Mode"
          >
            <span className={`${isMockMode ? 'translate-x-5 bg-amber-400' : 'translate-x-0 bg-cyan-400'} pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-lg ring-0 transition duration-200 ease-in-out`}/>
          </button>
        </div>
        <div className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-semibold ${backendClient.isOnline() ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          {backendClient.isOnline() ? <Wifi size={14} /> : <WifiOff size={14} />}
          <span>{backendClient.isOnline() ? 'SYSTEM ONLINE' : 'SYSTEM OFFLINE'}</span>
        </div>
      </div>
    </header>
  );
};

export default TopBar;