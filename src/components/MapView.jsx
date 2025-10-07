import React from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'

export default function MapView({ eventSequence }) {
  const center = eventSequence && eventSequence.length ? eventSequence[0].coords : [37.7749, -122.4194]
  return (
    <div style={{height:500}}>
      <MapContainer center={center} zoom={16} style={{height:'100%', width:'100%'}}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {eventSequence && eventSequence.map((e, i) => (
          <Marker key={i} position={e.coords}>
            <Popup>{e.entity_id} - {e.action}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
