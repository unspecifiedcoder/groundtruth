import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'GroundTruth — verified retail field evidence'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 70, background: '#FBF6EF', color: '#241F1A', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 28, fontWeight: 700 }}>
        <div style={{ width: 42, height: 42, borderRadius: 21, background: '#FF5A3C', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>✓</div>
        GroundTruth
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.05, letterSpacing: -3 }}>Know what is happening<br />in the store today.</div>
        <div style={{ marginTop: 28, fontSize: 28, color: '#6E6558' }}>Verified photos · structured observations · auditable receipts</div>
      </div>
      <div style={{ display: 'flex', gap: 14, fontSize: 20, color: '#12876A' }}>API <span>·</span> MCP <span>·</span> Human field network</div>
    </div>, size
  )
}
