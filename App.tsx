import React, { useState, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import RedTeamView from './views/RedTeamView';
import SocialRadarView from './views/SocialRadarView';
import MetricsView from './views/MetricsView';
import LeftRail, { Tab } from './components/layout/LeftRail';
import TopBar from './components/layout/TopBar';
import DebugPanel from './components/DebugPanel';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('red-team');

  const appTitle = useMemo(() => {
    switch (activeTab) {
      case 'red-team': return "Adversarial Red Team Simulator";
      case 'social-radar': return "Social Threat Radar — OSINT";
      case 'metrics': return "Global Correlation Metrics";
      default: return "Unified Command Center";
    }
  }, [activeTab]);

  const renderView = useCallback(() => {
    switch (activeTab) {
      case 'red-team':
        return <RedTeamView key="red-team" />;
      case 'social-radar':
        return <SocialRadarView key="social-radar" />;
      case 'metrics':
        return <MetricsView key="metrics" />;
      default:
        return null;
    }
  }, [activeTab]);

  return (
    <div className="flex h-screen w-screen bg-gray-900 text-gray-200 overflow-hidden">
      <LeftRail activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex flex-col flex-1 relative">
        <TopBar title={appTitle} />
        <main className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="h-full w-full"
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </main>
        
        <DebugPanel />
      </div>
    </div>
  );
};

export default App;