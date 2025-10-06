import React, { useState, useCallback, useRef, useEffect } from 'react';
import { SocialFeedPost, AnalysisResult, MapPoint, AnalysisResultItem } from '../types';
import ControlPanel from '../components/social/ControlPanel';
import ThreatMap from '../components/social/ThreatMap';
import LiveFeedPanel from '../components/social/LiveFeedPanel';
import AnalystPanel from '../components/social/AnalystPanel';
import { backendClient } from '../api/backendClient';
import { NOTIFY_PING_B64 } from '../assets/audioData';
import EthicsBadge from '../components/shared/EthicsBadge';
import { playAudio } from '../utils/audioHelper';

// FIX: Correctly extend multiple types with conflicting property definitions by omitting the conflicting property from one of them.
export interface EnrichedPost extends SocialFeedPost, Omit<Partial<AnalysisResultItem>, 'post_id'> {
  coords?: [number, number];
}

const SocialRadarView: React.FC = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [feedPosts, setFeedPosts] = useState<EnrichedPost[]>([]);
  const [mapPoints, setMapPoints] = useState<MapPoint[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  
  const streamInterval = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const processNewPosts = useCallback(async (newPosts: SocialFeedPost[]) => {
    if (newPosts.length === 0) return;

    const analysisResult = await backendClient.analyzePosts(newPosts);
    if (analysisResult.results.length > 0) {
      setAnalysis(prev => ({
        results: [...(prev?.results || []), ...analysisResult.results],
        map_points: [...(prev?.map_points || []), ...analysisResult.map_points]
      }));
    }

    if (analysisResult.map_points.length > 0) {
        setMapPoints(prev => [...prev, ...analysisResult.map_points]);
        if (analysisResult.results.some(r => r.threat_level === 'critical')) {
          playAudio(audioRef.current, 'Social Radar Ping');
        }
    }
    
    // Combine posts with their analysis results first
    // FIX: Explicitly type `postsWithAnalysis` to resolve type inference issues in the subsequent `.map` call.
    const postsWithAnalysis: Omit<EnrichedPost, 'coords'>[] = newPosts.map(post => {
      const analysisData = analysisResult.results.find(r => r.post_id === post.post_id) || {};
      return { ...post, ...analysisData };
    });

    // Then, enrich them with geocode data
    const enrichedPosts: EnrichedPost[] = await Promise.all(
      postsWithAnalysis.map(async (post) => {
          const geocode = await backendClient.geocodeLocation(post.raw_location);
          return { 
              ...post,
              threat_level: post.threat_level || 'none',
              summary: post.summary || 'No summary available.',
              coords: geocode ? [geocode.lat, geocode.lon] : undefined 
          };
      })
    );
    
    setFeedPosts(prev => [...enrichedPosts.slice(0, 50), ...prev.slice(0, 50)].filter((v,i,a)=>a.findIndex(t=>(t.post_id === v.post_id))===i));
  }, []);

  const handleStartStream = useCallback((pollInterval: number) => {
    setIsStreaming(true);
    if (streamInterval.current) clearInterval(streamInterval.current);
    
    backendClient.getFeedStream().then(processNewPosts); // Initial fetch
    streamInterval.current = window.setInterval(() => backendClient.getFeedStream().then(processNewPosts), pollInterval * 1000);
  }, [processNewPosts]);

  const handleStopStream = useCallback(() => {
    setIsStreaming(false);
    if (streamInterval.current) clearInterval(streamInterval.current);
  }, []);
  
  useEffect(() => () => { if (streamInterval.current) clearInterval(streamInterval.current) }, []);

  return (
    <div className="p-4 grid grid-cols-12 grid-rows-1 gap-4 h-full bg-gray-900 relative">
      <audio ref={audioRef} src={NOTIFY_PING_B64} preload="auto" id="social-radar-audio" />

      <div className="col-span-3 flex flex-col gap-4">
        <ControlPanel isStreaming={isStreaming} onStartStream={handleStartStream} onStopStream={handleStopStream} />
        <div className="flex-grow h-0 min-h-0">
            <LiveFeedPanel posts={feedPosts} />
        </div>
      </div>
      
      <div className="col-span-9 flex flex-col gap-4">
        <div className="flex-grow h-3/5 rounded-lg overflow-hidden bg-gray-800 border border-gray-700">
          <ThreatMap mapPoints={mapPoints} posts={feedPosts} />
        </div>
        <div className="h-2/5">
          <AnalystPanel analysis={analysis} />
        </div>
      </div>
      <EthicsBadge />
    </div>
  );
};

export default SocialRadarView;