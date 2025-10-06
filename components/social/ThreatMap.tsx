import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { LatLngTuple, DivIcon } from 'leaflet';
import ReactDOMServer from 'react-dom/server';
import { MapPoint } from '../../types';
import { EnrichedPost } from '../../views/SocialRadarView';
import { AlertTriangle, AlertCircle, Info, Bot, MapPin, MessageSquare } from 'lucide-react';

// --- Custom Icons for Threat Markers ---

const ThreatMarkerIcon = ({ level }: { level: 'critical' | 'warning' | 'none' }) => {
    const styles = {
        critical: { bg: 'bg-red-500/20', border: 'border-red-500', icon: <AlertTriangle className="w-4 h-4 text-red-400" /> },
        warning: { bg: 'bg-amber-500/20', border: 'border-amber-500', icon: <AlertCircle className="w-4 h-4 text-amber-400" /> },
        none: { bg: 'bg-blue-500/20', border: 'border-blue-500', icon: <Info className="w-4 h-4 text-blue-400" /> }
    }[level];

    return (
        <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 shadow-lg ${styles.bg} ${styles.border} backdrop-blur-sm`}>
            {styles.icon}
        </div>
    );
};

const createThreatIcon = (level: 'critical' | 'warning' | 'none' = 'none') => {
    return new DivIcon({
        html: ReactDOMServer.renderToString(<ThreatMarkerIcon level={level} />),
        className: 'bg-transparent border-0',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
    });
};

const threatIcons = {
    critical: createThreatIcon('critical'),
    warning: createThreatIcon('warning'),
    none: createThreatIcon('none'),
};


// --- Component ---

interface ThreatMapProps {
    mapPoints: MapPoint[];
    posts: EnrichedPost[];
}

const ThreatMap: React.FC<ThreatMapProps> = ({ mapPoints, posts }) => {
  const center: LatLngTuple = [31.5, 74.5]; // Centered on the Punjab border region

  return (
    <div className="relative h-full w-full">
      <MapContainer center={center} zoom={9} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' />
        
        {/* Simulated Heatmap using circles */}
        {mapPoints.map((point, index) => (
            <Circle 
                key={`heat-${index}`} 
                center={point.coords} 
                radius={point.intensity * 2000} // Scale radius by intensity
                pathOptions={{
                    color: point.intensity > 0.7 ? '#ef4444' : '#f59e0b',
                    fillColor: point.intensity > 0.7 ? '#ef4444' : '#f59e0b',
                    fillOpacity: point.intensity * 0.4,
                    weight: 1
                }}
            >
                <Popup>{point.label}</Popup>
            </Circle>
        ))}

        {/* Individual Threat Markers from Posts */}
        {posts.filter(p => p.coords).map(post => (
             <Marker 
                key={post.post_id} 
                position={post.coords!}
                icon={threatIcons[post.threat_level || 'none']}
             >
                 <Popup>
                    <div className="w-64 space-y-3 text-gray-300">
                        <div className="flex items-center space-x-2">
                            <div className={`p-1 rounded-full ${
                                post.threat_level === 'critical' ? 'bg-red-500/20 text-red-400' :
                                post.threat_level === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                                'bg-blue-500/20 text-blue-400'
                            }`}>
                                {post.threat_level === 'critical' ? <AlertTriangle size={16}/> : post.threat_level === 'warning' ? <AlertCircle size={16}/> : <Info size={16}/>}
                            </div>
                            <h3 className={`font-bold uppercase text-sm ${
                                post.threat_level === 'critical' ? 'text-red-400' :
                                post.threat_level === 'warning' ? 'text-amber-400' :
                                'text-blue-400'
                            }`}>
                                {post.threat_level || 'none'} Threat
                            </h3>
                        </div>

                        <div className="text-xs space-y-3 pt-2 border-t border-gray-600">
                            <div className="flex items-start space-x-2">
                                <Bot size={16} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-gray-200">AI Summary</p>
                                    <p className="italic">"{post.summary || 'N/A'}"</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-2">
                                <MapPin size={16} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-gray-200">Location</p>
                                    <p>{post.raw_location} (@{post.user})</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-2">
                                <MessageSquare size={16} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-gray-200">Original Post</p>
                                    <p className="line-clamp-3">{post.text}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                 </Popup>
             </Marker>
        ))}
      </MapContainer>
      <div className="absolute bottom-4 right-4 bg-gray-800/80 p-2 rounded-md border border-gray-600 text-xs text-gray-300 backdrop-blur-sm">
        <div className="font-bold mb-1">Threat Intensity</div>
        <div className="flex items-center space-x-2">
            <span>Low</span>
            <div className="w-20 h-2 bg-gradient-to-r from-cyan-500 via-yellow-500 to-red-500 rounded-full"/>
            <span>High</span>
        </div>
    </div>
    </div>
  );
};

export default ThreatMap;