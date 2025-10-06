import React from 'react';
import { BluePatch } from '../../types';
import { ShieldCheck, Code } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface BluePatchPanelProps {
  patch: BluePatch | null;
}

const BluePatchPanel: React.FC<BluePatchPanelProps> = ({ patch }) => {
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col h-full">
      <h2 className="text-lg font-bold text-blue-400 mb-2">Blue AI Patch Recommendation</h2>
      <div className="flex-grow overflow-y-auto">
        <AnimatePresence mode="wait">
        {patch ? (
          <motion.div 
            key="patch-content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-1 flex items-center"><ShieldCheck size={16} className="mr-2"/> Natural Language Rule</h3>
              <p className="text-gray-400 text-sm bg-black/20 p-2 rounded-md">{patch.patch_text}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-1 flex items-center"><Code size={16} className="mr-2"/> Machine-Readable Rule (JSON)</h3>
              <pre className="text-xs text-cyan-300 bg-black/20 p-2 rounded-md overflow-x-auto font-mono">
                {JSON.stringify(patch.patch_json, null, 2)}
              </pre>
            </div>
          </motion.div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500">Generate a patch after a simulation bypass.</p>
          </div>
        )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BluePatchPanel;