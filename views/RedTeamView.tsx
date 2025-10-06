import React, { useState, useCallback, useRef, useEffect } from 'react';
import { RedTeamScenario, LogEntry, BluePatch, Metrics } from '../types';
import ControlPanel from '../components/redteam/ControlPanel';
import MapPanel, { MapPanelRef } from '../components/redteam/MapPanel';
import TimelineConsole from '../components/redteam/TimelineConsole';
import BluePatchPanel from '../components/redteam/BluePatchPanel';
import MetricsStrip from '../components/redteam/MetricsStrip';
import { backendClient } from '../api/backendClient';
import { ALARM_SIREN_B64 } from '../assets/audioData';
import AlertModal from '../components/shared/AlertModal';
import { playAudio } from '../utils/audioHelper';

const RedTeamView: React.FC = () => {
  const [scenarios, setScenarios] = useState<RedTeamScenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<RedTeamScenario | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [patch, setPatch] = useState<BluePatch | null>(null);
  const [metrics, setMetrics] = useState<Metrics>({ iterations: 0, bypassRate: 0, detectionRate: 0, avgTimeToDetect: null });
  const [isLoading, setIsLoading] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [systemStatus, setSystemStatus] = useState<'Secure' | 'Compromised'>('Secure');
  const [alertInfo, setAlertInfo] = useState<{title: string, message: string} | null>(null);

  const mapPanelRef = useRef<MapPanelRef>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    backendClient.getScenarios().then(scenarioList => {
      setScenarios(scenarioList);
      if (scenarioList.length > 0) setSelectedScenario(scenarioList[0]);
    }).catch(console.error);
  }, []);

  const handleRunSimulation = useCallback(async (speed: number) => {
    if (!selectedScenario) return;
    setIsLoading(true);
    setIsSimulating(true);
    setLogs([]);
    setPatch(null);
    setSystemStatus('Secure');
    
    try {
        const response = await backendClient.runSimulation(selectedScenario.id);
        const newLogs: LogEntry[] = [];
        let outcome: 'Bypassed' | 'Detected' = 'Bypassed';
        
        response.event_sequence.forEach((event: any) => {
            const log: LogEntry = {
                timestamp: `T+${event.timestamp_offset_seconds.toFixed(1)}s`,
                entity: event.entity_id, action: event.action.replace(/_/g, ' '),
                details: `at [${event.coords[0].toFixed(4)}, ${event.coords[1].toFixed(4)}]`, status: 'info',
            };
            if (event.metadata.detection_status === 'BYPASSED') {
                log.status = 'bypass'; outcome = 'Bypassed'; setSystemStatus('Compromised');
            } else if (event.metadata.detection_status === 'DETECTED') {
                log.status = 'detected'; outcome = 'Detected'; setSystemStatus('Secure');
                playAudio(audioRef.current, 'Red Team Alert');
                setAlertInfo({ title: 'CRITICAL ALERT: THREAT DETECTED', message: `Rule "Stateful Zone Handoff" triggered by ${event.entity_id} performing action: ${event.action}.`});
            } else if (event.metadata.detection_status === 'PENDING') {
                log.status = 'pending';
            }
            newLogs.push(log);
        });
        
        setLogs(newLogs);
        mapPanelRef.current?.playEvents(response.event_sequence, speed);

        setMetrics(prev => {
            const newIterations = prev.iterations + 1;
            const detections = (prev.detectionRate/100 * prev.iterations) + (outcome === 'Detected' ? 1 : 0);
            const newDetectionRate = (detections / newIterations) * 100;
            return { iterations: newIterations, detectionRate: newDetectionRate, bypassRate: 100 - newDetectionRate, avgTimeToDetect: null };
        });

        backendClient.db.attackLogs.add({ id: response.attack_log_id, scenarioId: selectedScenario.id, events: newLogs, outcome });
    } catch (error) { console.error("Simulation failed:", error); } 
    finally { setIsLoading(false); }
  }, [selectedScenario]);

  const handleGeneratePatch = useCallback(async () => {
    setIsLoading(true);
    const lastLog = backendClient.db.attackLogs.get().pop();
    if (!lastLog) { alert("Run a simulation that is bypassed first."); setIsLoading(false); return; }
    try {
        setPatch(await backendClient.generateBluePatch(lastLog));
    } catch (e) { console.error(e); } 
    finally { setIsLoading(false); }
  }, []);

  const handleApplyPatch = useCallback(async () => {
    if (!patch) return;
    setIsLoading(true);
    try {
        await backendClient.applyRule(patch.patch_json);
        alert("Patch applied! The new rule will be active on the next simulation run.");
        setPatch(null);
    } catch(e) { console.error(e); } 
    finally { setIsLoading(false); }
  }, [patch]);

  const handleReset = useCallback(() => {
    backendClient.db.rules.clear();
    backendClient.db.attackLogs.clear();
    setLogs([]);
    setPatch(null);
    setMetrics({ iterations: 0, bypassRate: 0, detectionRate: 0, avgTimeToDetect: null });
    setSystemStatus('Secure');
    setIsSimulating(false);
    mapPanelRef.current?.reset();
    alert("Simulation state and applied patches have been reset.");
  }, []);

  return (
    <div className="p-4 grid grid-cols-12 grid-rows-6 gap-4 h-full bg-gray-900">
      <audio ref={audioRef} src={ALARM_SIREN_B64} preload="auto" id="red-team-audio" />
      <AlertModal isOpen={!!alertInfo} onClose={() => setAlertInfo(null)} title={alertInfo?.title || ''} message={alertInfo?.message || ''} />
      
      <div className="col-span-3 row-span-6"><ControlPanel {...{scenarios, onScenarioChange: (id) => setSelectedScenario(scenarios.find(s => s.id === id) || null), onRun: handleRunSimulation, onGeneratePatch: handleGeneratePatch, onApplyPatch: handleApplyPatch, onReset: handleReset, isLoading, isSimulating, isPatchAvailable: !!patch}}/></div>
      <div className="col-span-6 row-span-4 rounded-lg overflow-hidden bg-gray-800 border border-gray-700"><MapPanel ref={mapPanelRef} onSimulationComplete={() => setIsSimulating(false)} /></div>
      <div className="col-span-3 row-span-6"><TimelineConsole logs={logs} /></div>
      <div className="col-span-6 row-span-2 flex flex-col gap-4"><BluePatchPanel patch={patch} /></div>
      <div className="col-span-12 row-span-1 -mx-4 -mb-4 mt-2"><MetricsStrip metrics={metrics} systemStatus={systemStatus} /></div>
    </div>
  );
};

export default RedTeamView;
