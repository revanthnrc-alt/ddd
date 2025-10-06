import React from 'react';
import { ShieldCheck, Radar, BarChart3, Bot } from 'lucide-react';

export type Tab = 'red-team' | 'social-radar' | 'metrics';

const TABS: { id: Tab; name: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'red-team', name: 'Red Team', icon: ShieldCheck },
  { id: 'social-radar', name: 'Social Radar', icon: Radar },
  { id: 'metrics', name: 'Global Metrics', icon: BarChart3 },
];

interface LeftRailProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const LeftRail: React.FC<LeftRailProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="flex flex-col items-center bg-black/30 p-2 space-y-4 border-r border-gray-700/50">
      <div className="p-2 text-green-400">
        <Bot size={32} />
      </div>
      <div className="flex flex-col space-y-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            aria-label={tab.name}
            className={`p-3 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-400 ${
              activeTab === tab.id ? 'bg-green-500/20 text-green-400' : 'text-gray-500 hover:bg-gray-700/50 hover:text-gray-300'
            }`}
          >
            <tab.icon className="h-6 w-6" />
          </button>
        ))}
      </div>
    </nav>
  );
};

export default LeftRail;