import React, { useState, useEffect } from 'react';
import { ShieldCheck, Radar, AlertTriangle, CheckCircle } from 'lucide-react';
import { backendClient } from '../api/backendClient';

interface Correlation {
    id: string;
    location: string;
    socialThreat: { type: string; level: 'critical' | 'warning'; };
    redTeamVuln: { scenario: string; status: 'Patched' | 'Vulnerable'; };
}

const MetricsView: React.FC = () => {
    const [correlations, setCorrelations] = useState<Correlation[]>([]);

    useEffect(() => {
        // Mock correlation logic using the shared mock DB
        const attackLogs = backendClient.db.attackLogs.get();
        const socialFlags = backendClient.db.socialFlags.get();
        const rules = backendClient.db.rules.get();
        const newCorrelations: Correlation[] = [];

        const wagahFlag = socialFlags.find(f => f.location.toLowerCase().includes('wagah'));
        const relayAttackLogs = attackLogs.filter(l => l.scenarioId === 'relay_attack_wagah');
        
        if (wagahFlag && relayAttackLogs.length > 0) {
            const isPatched = rules.some((r: any) => r.rule_id === 'stateful_handoff_v2');
            newCorrelations.push({
                id: 'corr_wagah_relay_01',
                location: 'Wagah Border Region',
                socialThreat: { type: 'Organized Protest Activity', level: 'critical' },
                redTeamVuln: { scenario: 'Relay Attack Vulnerability', status: isPatched ? 'Patched' : 'Vulnerable' }
            });
        }
        setCorrelations(newCorrelations);
    }, []);

    return (
        <div className="p-8 h-full text-gray-200 overflow-y-auto">
            <h1 className="text-3xl font-bold mb-6 text-green-400">Global Correlation Metrics</h1>
            <p className="mb-8 text-gray-400 max-w-3xl">
                This dashboard synthesizes intelligence from the Red Team Simulator and Social Threat Radar to identify high-risk correlations between physical vulnerabilities and social media chatter in key border areas.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {correlations.length > 0 ? correlations.map(corr => (
                    <div key={corr.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 shadow-lg transform hover:scale-105 transition-transform duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white">{corr.location}</h2>
                            <span className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full ${corr.redTeamVuln.status === 'Patched' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                {corr.redTeamVuln.status === 'Patched' ? <CheckCircle size={14} className="mr-1" /> : <AlertTriangle size={14} className="mr-1" />}
                                {corr.redTeamVuln.status === 'Patched' ? 'MITIGATED' : 'ACTIVE THREAT'}
                            </span>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-start space-x-3"><div className="p-2 bg-blue-500/20 rounded-full text-blue-400"><Radar size={20}/></div><div><h3 className="font-semibold text-gray-300">OSINT Signal</h3><p className="text-sm text-gray-400"><span className="font-bold text-red-400">CRITICAL</span> threat: {corr.socialThreat.type}</p></div></div>
                            <div className="flex items-start space-x-3"><div className="p-2 bg-rose-500/20 rounded-full text-rose-400"><ShieldCheck size={20}/></div><div><h3 className="font-semibold text-gray-300">Physical Vulnerability</h3><p className="text-sm text-gray-400">{corr.redTeamVuln.scenario} - <span className={`font-bold ${corr.redTeamVuln.status === 'Patched' ? 'text-green-400' : 'text-red-400'}`}>{corr.redTeamVuln.status}</span></p></div></div>
                        </div>
                         <div className="mt-6 pt-4 border-t border-gray-700">
                             <h4 className="font-semibold text-sm text-gray-300 mb-2">Recommended Action:</h4>
                             <p className="text-xs text-gray-400">
                                {corr.redTeamVuln.status === 'Vulnerable' ? 'Elevate asset protection in the region. Dispatch patrol and monitor OSINT channels for real-time updates.' : 'Continue monitoring OSINT channels. Physical vulnerability is mitigated.'}
                             </p>
                         </div>
                    </div>
                )) : (
                    <div className="col-span-full text-center py-16 bg-gray-800/30 rounded-lg">
                        <h2 className="text-2xl font-semibold text-gray-400">No Significant Correlations Detected</h2>
                        <p className="text-gray-500 mt-2">The system is continuously analyzing data streams for potential threats.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MetricsView;