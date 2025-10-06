import React from 'react';
import { AlertTriangle, CheckCircle, Target, ShieldOff } from 'lucide-react';
import { Metrics } from '../../types';

interface MetricsStripProps {
  metrics: Metrics;
  systemStatus: 'Secure' | 'Compromised';
}

const MetricWidget: React.FC<{ icon: React.ReactElement; label: string; value: string | number; colorClass: string }> = ({ icon, label, value, colorClass }) => (
  <div className="flex items-center space-x-3">
    <div className={`p-2 rounded-full bg-gray-700 ${colorClass}`}>{icon}</div>
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  </div>
);

const MetricsStrip: React.FC<MetricsStripProps> = ({ metrics, systemStatus }) => {
  const isSecure = systemStatus === 'Secure';

  return (
    <div className="bg-gray-800 border-t border-gray-700 p-3 flex items-center justify-between h-full">
      <div className="flex items-center space-x-8">
        <div className={`flex items-center font-bold text-lg ${isSecure ? 'text-green-400' : 'text-red-400'}`}>
          {isSecure ? <CheckCircle className="mr-2"/> : <AlertTriangle className="mr-2"/>}
          SYSTEM STATUS: {systemStatus.toUpperCase()}
        </div>
        <div className="h-10 w-px bg-gray-600" />
        <MetricWidget icon={<Target size={20}/>} label="Iterations" value={metrics.iterations} colorClass="text-gray-300" />
        <MetricWidget icon={<ShieldOff size={20}/>} label="Bypass Rate" value={`${metrics.bypassRate.toFixed(1)}%`} colorClass="text-red-400" />
        <MetricWidget icon={<CheckCircle size={20}/>} label="Detection Rate" value={`${metrics.detectionRate.toFixed(1)}%`} colorClass="text-green-400" />
      </div>
    </div>
  );
};

export default MetricsStrip;