import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Bot, MapPin, ShieldAlert } from 'lucide-react';
import { AnalysisResult } from '../../types';

interface AnalystPanelProps { analysis: AnalysisResult | null; }

const sentimentData = [ { name: '10:00', warning: 4, critical: 1 }, { name: '10:05', warning: 5, critical: 2 }, { name: '10:10', warning: 3, critical: 5 }, { name: '10:15', warning: 7, critical: 6 }, ];
const sourceData = [ { name: 'Twitter', count: 12 }, { name: 'Telegram', count: 8 }, { name: 'News', count: 2 }, ];

const AnalystPanel: React.FC<AnalystPanelProps> = ({ analysis }) => {
  const latestCritical = analysis?.results.filter(r => r.threat_level === 'critical').pop();

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col h-full">
      <h2 className="text-lg font-bold text-blue-400 mb-4">AI Analyst Summary</h2>
      <div className="grid grid-cols-3 gap-4 flex-grow overflow-hidden">
        <div className="col-span-1 flex flex-col space-y-4">
          <div className="bg-black/20 p-3 rounded-lg flex-grow">
            <h3 className="font-semibold text-gray-300 flex items-center mb-2"><Bot size={16} className="mr-2"/>AI Assessment</h3>
            {latestCritical ? (
              <div className="text-sm text-gray-400 space-y-3">
                <p><span className="font-bold text-red-400">CRITICAL</span> threat detected: {latestCritical.summary}</p>
                <p className="flex items-start"><MapPin size={14} className="mr-2 mt-0.5 text-cyan-400"/> Primary Location: <span className="font-semibold text-white ml-1">{latestCritical.locations.join(', ')}</span></p>
                <p className="flex items-start"><ShieldAlert size={14} className="mr-2 mt-0.5 text-amber-400"/> Recommended Action: <span className="font-semibold text-white ml-1">Dispatch field team to Wagah for verification. Escalate alert level for assets in the identified region. Monitor chatter for specific timing.</span></p>
              </div>
            ) : <p className="text-sm text-gray-500">No active critical threats detected. Monitoring...</p> }
          </div>
        </div>
        <div className="col-span-2 grid grid-rows-2 gap-4">
          <div className="bg-black/20 p-2 rounded-lg">
             <h3 className="text-sm font-semibold text-gray-300 ml-4 mb-1">Sentiment Over Time</h3>
             <ResponsiveContainer width="100%" height="90%"><LineChart data={sentimentData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke="#4a5568" /><XAxis dataKey="name" stroke="#a0aec0" fontSize={12} /><YAxis stroke="#a0aec0" fontSize={12} /><Tooltip contentStyle={{ backgroundColor: '#2d3748', border: 'none' }}/><Legend wrapperStyle={{fontSize: "12px"}}/><Line type="monotone" dataKey="warning" stroke="#f59e0b" strokeWidth={2} /><Line type="monotone" dataKey="critical" stroke="#ef4444" strokeWidth={2} /></LineChart></ResponsiveContainer>
          </div>
          <div className="bg-black/20 p-2 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-300 ml-4 mb-1">Source Distribution</h3>
              <ResponsiveContainer width="100%" height="90%"><BarChart data={sourceData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke="#4a5568" /><XAxis dataKey="name" stroke="#a0aec0" fontSize={12} /><YAxis stroke="#a0aec0" fontSize={12} /><Tooltip contentStyle={{ backgroundColor: '#2d3748', border: 'none' }} cursor={{fill: '#4a5568'}}/><Bar dataKey="count" fill="#3b82f6" /></BarChart></ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalystPanel;