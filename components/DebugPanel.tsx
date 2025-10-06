import React, { useState, useEffect } from 'react';
import { useMockMode } from '../api/backendClient';
import { Server, Bug } from 'lucide-react';

const DebugPanel: React.FC = () => {
    const { isMockMode } = useMockMode();
    const [lastApiCall, setLastApiCall] = useState<any>(null);
    const [lastAudioPlay, setLastAudioPlay] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const handleApiCall = (event: CustomEvent) => setLastApiCall(event.detail);
        window.addEventListener('api-call', handleApiCall as EventListener);

        const handleAudioPlay = (event: CustomEvent) => setLastAudioPlay(event.detail);
        window.addEventListener('audio-play', handleAudioPlay as EventListener);

        return () => {
            window.removeEventListener('api-call', handleApiCall as EventListener);
            window.removeEventListener('audio-play', handleAudioPlay as EventListener);
        };
    }, []);

    if (!isVisible) {
        return (
            <button onClick={() => setIsVisible(true)} className="fixed bottom-2 left-2 bg-gray-700 text-white p-2 rounded-full shadow-lg z-50 hover:bg-gray-600" aria-label="Show Debug Panel">
                <Bug size={20} />
            </button>
        );
    }
    
    const apiStatusColor = lastApiCall?.status === 'MOCK' ? 'text-amber-400' : lastApiCall?.status === 'LIVE' ? 'text-cyan-400' : 'text-red-400';
    const audioStatusColor = lastAudioPlay?.status === 'SUCCESS' ? 'text-green-400' : lastAudioPlay?.status === 'FAILED' ? 'text-red-400' : 'text-gray-500';


    return (
        <div className="fixed bottom-2 left-16 bg-gray-800/80 border border-gray-600 text-white p-3 rounded-lg shadow-2xl z-50 text-xs font-mono w-96 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold flex items-center"><Server size={14} className="mr-2" /><span>DEBUG PANEL</span></h3>
                <button onClick={() => setIsVisible(false)} className="text-gray-400 hover:text-white">&times;</button>
            </div>
            <div className="space-y-1">
                <p>Mode: <span className={isMockMode ? 'text-amber-400' : 'text-cyan-400'}>{isMockMode ? 'MOCK' : 'LIVE'}</span></p>
                <div className="bg-black/30 p-1.5 rounded text-gray-300">
                    <p>Last API Call: <span className={apiStatusColor}>{lastApiCall?.status || 'N/A'}</span></p>
                    <p className="truncate">Endpoint: {lastApiCall?.endpoint || 'N/A'}</p>
                </div>
                <div className="bg-black/30 p-1.5 rounded text-gray-300">
                    <p>Last Audio: <span className={audioStatusColor}>{lastAudioPlay?.status || 'N/A'}</span></p>
                    <p className="truncate">Clip: {lastAudioPlay?.name || 'N/A'}</p>
                </div>
            </div>
        </div>
    );
};

export default DebugPanel;
