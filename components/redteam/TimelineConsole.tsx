import React, { useEffect, useRef } from 'react';
import { Clipboard, Download } from 'lucide-react';
import { LogEntry } from '../../types';
import { motion } from 'framer-motion';

interface TimelineConsoleProps { logs: LogEntry[]; }

const statusStyles = {
  info: { color: 'text-gray-400', badge: '' },
  bypass: { color: 'text-green-400', badge: '[BYPASSED]' },
  detected: { color: 'text-red-400', badge: '[DETECTED]' },
  pending: { color: 'text-amber-400', badge: '[PENDING]' },
};

const TypewriterLine: React.FC<{ log: LogEntry; index: number }> = ({ log }) => {
    return (
        <motion.p 
            className={`${statusStyles[log.status].color} whitespace-pre-wrap`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <span className="text-cyan-400">{log.timestamp.padEnd(8)}</span>
            <span>| {log.entity.padEnd(10)} | </span>
            <span className="text-amber-300">{log.action.padEnd(15)} | </span>
            <span className="font-bold">{statusStyles[log.status].badge.padEnd(11)}</span>
            <span>{log.details}</span>
        </motion.p>
    );
};

const TimelineConsole: React.FC<TimelineConsoleProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [logs]);

  const handleCopy = () => navigator.clipboard.writeText(JSON.stringify(logs, null, 2));
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attack_log_${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col h-full font-mono">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-green-400">Timeline & Console</h2>
        <div className="flex space-x-2">
          <button onClick={handleCopy} className="text-gray-400 hover:text-white" aria-label="Copy Logs"><Clipboard size={16} /></button>
          <button onClick={handleExport} className="text-gray-400 hover:text-white" aria-label="Export Logs"><Download size={16} /></button>
        </div>
      </div>
      <div ref={scrollRef} className="flex-grow overflow-y-auto pr-2 text-sm space-y-1">
        {logs.map((log, index) => <TypewriterLine key={index} log={log} index={index} />)}
        {logs.length === 0 && <p className="text-gray-500">Awaiting simulation start...</p>}
      </div>
    </div>
  );
};

export default TimelineConsole;