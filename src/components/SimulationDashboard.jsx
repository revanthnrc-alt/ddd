import React, { useState } from 'react'
import { runSimulation, generatePatch, applyPatch } from '../api/backendClient'
import MapView from './MapView'

export default function SimulationDashboard() {
  const [runResult, setRunResult] = useState(null)
  const [patchResult, setPatchResult] = useState(null)

  async function onRunAttack() {
    const res = await runSimulation({})
    setRunResult(res)
  }

  async function onGeneratePatch() {
    if (!runResult) return
    const res = await generatePatch(runResult, runResult.current_rule || {})
    setPatchResult(res)
  }

  async function onApplyPatch() {
    if (!patchResult) return
    await applyPatch({ patch_json: patchResult.patch_json, description: patchResult.justification })
    // Re-run to see effect
    await onRunAttack()
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Relay Attack Simulation Dashboard</h2>
      <div className="mb-4">
        <button onClick={onRunAttack} className="px-3 py-1 bg-blue-500 text-white rounded mr-2">Run Attack</button>
        <button onClick={onGeneratePatch} className="px-3 py-1 bg-yellow-500 text-white rounded mr-2">Generate Patch</button>
        <button onClick={onApplyPatch} className="px-3 py-1 bg-green-500 text-white rounded">Apply Patch</button>
      </div>
      <div style={{display:'flex', gap:20}}>
        <div style={{flex:1}}>
          <MapView eventSequence={runResult?.scenario?.event_sequence || []} />
        </div>
        <div style={{width:420}}>
          <h3>Run Result</h3>
          <pre style={{height:300, overflow:'auto'}}>{JSON.stringify(runResult, null, 2)}</pre>
          <h3>Patch Result</h3>
          <pre style={{height:200, overflow:'auto'}}>{JSON.stringify(patchResult, null, 2)}</pre>
        </div>
      </div>
    </div>
  )
}
