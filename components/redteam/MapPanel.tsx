import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Polyline } from 'react-leaflet';
import { LatLngExpression, DivIcon } from 'leaflet';
import { SimulationEvent } from '../../types';
import ReactDOMServer from 'react-dom/server';

// --- ICONS ---
const DroneIcon = () => <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="#2dd4bf"><path d="M50 10 L60 20 L55 25 L65 30 L60 35 L70 40 L65 45 L80 50 L50 70 L20 50 L35 45 L30 40 L40 35 L35 30 L45 25 L40 20 Z" /><circle cx="30" cy="60" r="5" /><circle cx="70" cy="60" r="5" /><circle cx="50" cy="80" r="5" /></svg>;
const PersonIcon = () => <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="#facc15"><circle cx="50" cy="25" r="15" /><path d="M50 40 Q20 50 50 100 Q80 50 50 40 Z" /></svg>;
const PackageIcon = () => <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" fill="#f87171"><path d="M10 30 L50 10 L90 30 L50 50 Z" /><path d="M10 30 L10 70 L50 90 L50 50 Z" /><path d="M90 30 L90 70 L50 90 L50 50 Z" /></svg>;

const createIcon = (component: React.ReactElement) => new DivIcon({
    html: ReactDOMServer.renderToString(component), className: 'bg-transparent border-0', iconSize: [30, 30], iconAnchor: [15, 15],
});

// --- COMPONENT STATE & PROPS ---
interface EntityState { id: string; position: LatLngExpression; icon: React.ReactElement; visible: boolean; }
type ZoneStatus = 'normal' | 'pending' | 'critical';

export interface MapPanelRef {
  playEvents: (events: SimulationEvent[], speed: number) => void;
  reset: () => void;
}

interface MapPanelProps { onSimulationComplete: () => void; }

// --- MAP CONFIG ---
const WAGAH_CENTER: LatLngExpression = [31.6047, 74.5725];
const RESTRICTED_ZONE: LatLngExpression[] = [[31.6040, 74.5720], [31.6055, 74.5735], [31.6045, 74.5750], [31.6030, 74.5735]];

const getZoneStyle = (status: ZoneStatus) => ({
    pending: { color: '#f59e0b', weight: 3, fillOpacity: 0.3 },
    critical: { color: '#ef4444', weight: 5, fillOpacity: 0.5 },
    normal: { color: '#ef4444', weight: 2, fillOpacity: 0.1 }
}[status]);

// --- MAIN COMPONENT ---
const MapPanel = forwardRef<MapPanelRef, MapPanelProps>(({ onSimulationComplete }, ref) => {
  const [entities, setEntities] = useState<Record<string, EntityState>>({});
  const [zoneStatus, setZoneStatus] = useState<ZoneStatus>('normal');
  const [paths, setPaths] = useState<Record<string, LatLngExpression[]>>({});
  const [packageState, setPackageState] = useState<{position: LatLngExpression, visible: boolean}>({position: [0,0], visible: false});

  const reset = () => {
    setEntities({});
    setPaths({});
    setPackageState({position: [0,0], visible: false});
    setZoneStatus('normal');
  };

  useImperativeHandle(ref, () => ({
    playEvents: async (events, speed) => {
      reset();
      // Initialize entities and paths
      const initialEntities: Record<string, EntityState> = {};
      events.forEach(event => {
          if (!initialEntities[event.entity_id]) {
              initialEntities[event.entity_id] = { id: event.entity_id, position: event.coords, icon: event.entity_id.includes('DRONE') ? <DroneIcon /> : <PersonIcon />, visible: false };
          }
          if (event.path) setPaths(prev => ({...prev, [event.entity_id]: event.path!.map(p => [p[0], p[1]])}));
      });
      setEntities(initialEntities);
      
      // Animate events
      let lastTimestamp = 0;
      for (const event of events) {
        const delay = (event.timestamp_offset_seconds - lastTimestamp) * 1000 / speed;
        await new Promise(res => setTimeout(res, delay));

        setEntities(prev => ({ ...prev, [event.entity_id]: { ...prev[event.entity_id], visible: true, position: event.coords } }));
        
        if (event.action === 'drop_package') { setPackageState({ position: event.coords, visible: true }); if (event.metadata.detection_status === 'PENDING') setZoneStatus('pending'); }
        if (event.action === 'pickup_package') { setPackageState(prev => ({...prev, visible: false})); if (event.metadata.detection_status === 'DETECTED') setZoneStatus('critical'); }
        lastTimestamp = event.timestamp_offset_seconds;
      }
      setTimeout(onSimulationComplete, 1000);
    },
    reset,
  }));

  return (
    <MapContainer center={WAGAH_CENTER} zoom={17} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' />
      <Polygon pathOptions={getZoneStyle(zoneStatus)} positions={RESTRICTED_ZONE} className={zoneStatus !== 'normal' ? 'animate-pulse' : ''} />
      
      {Object.values(paths).map((path, i) => <Polyline key={i} positions={path} pathOptions={{ color: '#4b5563', dashArray: '5, 10' }} />)}
      {/* FIX: Explicitly typed the parameter 'e' in the filter function because type inference was failing on Object.values. */}
      {Object.values(entities).filter((e: EntityState) => e.visible).map((e: EntityState) => <Marker key={e.id} position={e.position} icon={createIcon(e.icon)} />)}
      {packageState.visible && <Marker position={packageState.position} icon={createIcon(<PackageIcon />)} />}
    </MapContainer>
  );
});

export default MapPanel;