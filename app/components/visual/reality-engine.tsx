const PIPELINE = [
  { label: 'Agent request', value: 'Verify shelf state', state: 'ready' },
  { label: 'Payment rail', value: '$0.01 · Arbitrum', state: 'ready' },
  { label: 'Field evidence', value: 'Fresh capture', state: 'active' },
  { label: 'Receipt', value: 'Sepolia anchor', state: 'waiting' },
]

export function RealityEngine() {
  return (
    <div className="reality-engine" aria-label="Illustration of a GroundTruth verification moving from an agent request to an Arbitrum receipt">
      <div className="engine-chrome">
        <div className="engine-chrome-left"><i /><i /><i /></div>
        <span>GROUNDTRUTH / MISSION_004216</span>
        <span className="engine-online"><i /> PROTOCOL ONLINE</span>
      </div>
      <div className="engine-canvas">
        <svg className="engine-map" viewBox="0 0 620 420" role="presentation" aria-hidden="true">
          <defs><radialGradient id="node-gradient"><stop offset="0" stopColor="#25d7ff" stopOpacity="0.5" /><stop offset="1" stopColor="#25d7ff" stopOpacity="0" /></radialGradient></defs>
          <path className="map-shape" d="M126 78l67-24 61 24 36-11 45 36 65-8 81 33 28 52-35 42-1 70-58 26-53-21-51 34-69-22-39 22-72-42-23-73 24-47-28-48z" />
          <path className="map-street" d="M116 215c75-17 101-89 180-56s107 102 201 62M177 85c12 98 42 154 147 233M443 112c-72 84-108 97-191 112" />
          <path className="map-route" pathLength="1" d="M159 252c60-97 122-79 171-35s89 8 142-46" />
          <circle cx="159" cy="252" r="46" fill="url(#node-gradient)" /><circle cx="472" cy="171" r="46" fill="url(#node-gradient)" />
        </svg>
        <div className="map-node map-node-origin" aria-hidden="true"><i /><span>AGENT</span></div>
        <div className="map-node map-node-field" aria-hidden="true"><i /><span>FIELD</span></div>
        <div className="travel-packet" aria-hidden="true" />
        <div className="oracle-core" aria-hidden="true">
          <div className="oracle-ring oracle-ring-a" /><div className="oracle-ring oracle-ring-b" />
          <div className="oracle-aperture"><svg viewBox="0 0 80 80"><path d="M40 5l29 17v36L40 75 11 58V22z" /><circle cx="40" cy="40" r="12" /><path d="M33 40l5 5 10-11" /></svg></div>
          <span>REALITY<br />CHECK</span>
        </div>
        <div className="engine-pipeline">{PIPELINE.map((item, index) => <div className={`pipeline-item pipeline-${item.state}`} key={item.label}><span className="pipeline-index">0{index + 1}</span><div><small>{item.label}</small><strong>{item.value}</strong></div><i aria-hidden="true" /></div>)}</div>
        <div className="proof-chip proof-chip-top"><span>PROOF SPEC</span><strong>PHOTO · 1 MIN</strong></div>
        <div className="proof-chip proof-chip-bottom"><span>VERDICT</span><strong>MATCH · HASHED</strong></div>
      </div>
      <div className="engine-footer"><span><i /> SIMULATED MISSION VISUAL</span><code>eip155:42161</code><span>ASYNC / COVERAGE REQUIRED</span></div>
    </div>
  )
}
