const CHECKS = [
  { label: 'Freshness challenge', value: 'Passed' },
  { label: 'Required evidence', value: '3 / 3' },
  { label: 'Duplicate screening', value: 'Clear' },
  { label: 'Brief match', value: 'Passed' },
]

export default function LiveNetwork() {
  return (
    <div className="w-full max-w-[430px]">
      <div className="ticket">
        <div className="ticket-head"><span>Example evidence receipt</span><span style={{ color: 'var(--good)' }}>Verified</span></div>
        <div className="ticket-body">
          <div className="flex items-start justify-between gap-5 mb-6">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--text-faint)' }}>Retail availability check</p>
              <h2 className="font-display text-xl font-extrabold leading-tight">Confirm Brand A is stocked and record its shelf price.</h2>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-xl font-bold" style={{ background: 'var(--good-weak)', color: 'var(--good)' }}>✓</div>
          </div>

          <div className="rounded-2xl p-4 mb-5" style={{ background: 'var(--bg-subtle)' }}>
            <div className="grid grid-cols-2 gap-x-5 gap-y-4">
              {CHECKS.map(check => (
                <div key={check.label}>
                  <div className="font-mono text-[9px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-faint)' }}>{check.label}</div>
                  <div className="text-sm font-bold" style={{ color: 'var(--good)' }}>{check.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 pt-1">
            <div><div className="font-mono text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>Result</div><div className="font-display font-extrabold text-lg">In stock · $4.49</div></div>
            <span className="chip text-[9px] px-2.5 py-1.5" style={{ background: 'var(--info-weak)', color: 'var(--info)' }}>Audit trail attached</span>
          </div>
        </div>
      </div>
      <p className="font-mono text-[10px] text-center mt-3" style={{ color: 'var(--text-faint)' }}>Illustrative receipt · production evidence includes the original submission</p>
    </div>
  )
}
