'use client'

import Link from 'next/link'
import { ChangeEvent, type CSSProperties, useEffect, useMemo, useRef, useState } from 'react'
import styles from './demo.module.css'

type ScenarioId = 'retail' | 'rwa' | 'depin'
type Mode = 'sponsored' | 'paid'
type Screen = 'choose' | 'authorize' | 'evidence' | 'processing' | 'receipt'

type DemoResult = {
  session_id?: string
  task_id?: string
  transaction_hash?: string
  receipt_url?: string
  network?: string
  evidence_root?: string
  verdict_hash?: string
}

type InjectedProvider = {
  request: (request: { method: string; params?: unknown[] }) => Promise<unknown>
}

const sponsoredScenario = {
  retail: 'retail_shelf_check',
  rwa: 'equipment_condition_check',
  depin: 'equipment_condition_check',
} as const

const scenarios = {
  retail: {
    eyebrow: 'RETAIL EXECUTION',
    title: 'Is the product really on the shelf?',
    detail: 'Verify availability and the displayed price before an agent recommends a purchase.',
    location: 'Jubilee Hills · Hyderabad',
    object: 'Grapefruit sparkling water · 355 ml',
    question: 'Visible, in stock, displayed at $1.29?',
    accent: '#ff6b3d',
  },
  rwa: {
    eyebrow: 'REAL-WORLD ASSET',
    title: 'Does the financed asset exist right now?',
    detail: 'Request fresh evidence before a protocol releases capital against a physical asset.',
    location: 'Banjara Hills · Hyderabad',
    object: 'Commercial equipment',
    question: 'Present, undamaged, serial visible?',
    accent: '#8b7cff',
  },
  depin: {
    eyebrow: 'DEPIN OPERATIONS',
    title: 'Is the deployed hardware actually online?',
    detail: 'Confirm installation state before a network accepts a physical deployment claim.',
    location: 'HITEC City · Hyderabad',
    object: 'Edge sensor node',
    question: 'Installed, powered, challenge visible?',
    accent: '#35dfad',
  },
} satisfies Record<ScenarioId, { eyebrow: string; title: string; detail: string; location: string; object: string; question: string; accent: string }>

const stageCopy = [
  ['REQUEST', 'Mission contract created'],
  ['AUTH', 'Demo authorization bound'],
  ['EVIDENCE', 'File integrity checked'],
  ['VERDICT', 'Observation structured'],
  ['ARBITRUM', 'Receipt payload prepared'],
] as const

function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

export default function DemoExperience() {
  const [scenarioId, setScenarioId] = useState<ScenarioId>('retail')
  const [mode, setMode] = useState<Mode>('sponsored')
  const [screen, setScreen] = useState<Screen>('choose')
  const [wallet, setWallet] = useState('')
  const [walletVerified, setWalletVerified] = useState(false)
  const [walletLoading, setWalletLoading] = useState(false)
  const [walletMessage, setWalletMessage] = useState('')
  const [challenge, setChallenge] = useState<'idle' | 'loading' | 'available' | 'unavailable'>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [useSample, setUseSample] = useState(true)
  const [activeStage, setActiveStage] = useState(-1)
  const [result, setResult] = useState<DemoResult | null>(null)
  const [isSimulation, setIsSimulation] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)
  const scenario = scenarios[scenarioId]

  const progress = useMemo(() => ({ choose: 12, authorize: 31, evidence: 52, processing: 78, receipt: 100 }[screen]), [screen])

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  async function connectWallet() {
    setWalletMessage('')
    setWalletLoading(true)
    const provider = (window as unknown as { ethereum?: InjectedProvider }).ethereum
    if (!provider) {
      setWalletMessage('No injected browser wallet was detected. Install or open MetaMask, Rabby, Coinbase Wallet, or OKX Wallet; no funds are required for sponsored mode.')
      setWalletLoading(false)
      return
    }
    try {
      const accounts = await provider.request({ method: 'eth_requestAccounts' }) as string[]
      const address = accounts[0]
      if (!address) throw new Error('No account returned by the wallet')
      setWallet(address)
      const challengeResponse = await fetch('/api/demo/wallet/challenge', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ wallet: address }),
      })
      const challengeBody = await challengeResponse.json() as { message?: string; challengeToken?: string; error?: string }
      if (!challengeResponse.ok || !challengeBody.message || !challengeBody.challengeToken) throw new Error(challengeBody.error ?? 'Could not create the demo challenge')
      const signature = await provider.request({ method: 'personal_sign', params: [challengeBody.message, address] }) as string
      const verificationResponse = await fetch('/api/demo/wallet/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: address, message: challengeBody.message, challengeToken: challengeBody.challengeToken, signature }),
      })
      const verificationBody = await verificationResponse.json() as { authenticated?: boolean; error?: string }
      if (!verificationResponse.ok || !verificationBody.authenticated) throw new Error(verificationBody.error ?? 'Wallet verification failed')
      setWalletVerified(true)
      setWalletMessage('Wallet ownership verified. The signature authorized no payment, approval, or production task.')
    } catch (error) {
      setWalletVerified(false)
      setWalletMessage(error instanceof Error ? error.message : 'Wallet connection or signature was cancelled.')
    } finally {
      setWalletLoading(false)
    }
  }

  async function inspectChallenge() {
    setChallenge('loading')
    try {
      const response = await fetch('/api/v1/human-do', { cache: 'no-store' })
      const encoded = response.headers.get('payment-required')
      setChallenge(response.status === 402 && Boolean(encoded) ? 'available' : 'unavailable')
    } catch {
      setChallenge('unavailable')
    }
  }

  function onFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0]
    if (!selected) return
    if (preview) URL.revokeObjectURL(preview)
    setFile(selected)
    setPreview(URL.createObjectURL(selected))
    setUseSample(false)
  }

  async function runDemo() {
    setScreen('processing')
    setActiveStage(0)
    setResult(null)
    setIsSimulation(true)

    for (let index = 1; index < stageCopy.length; index += 1) {
      await new Promise(resolve => window.setTimeout(resolve, index === 4 ? 900 : 650))
      setActiveStage(index)
    }

    try {
      if (mode === 'sponsored' && walletVerified) {
        const response = await fetch('/api/demo/tasks', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scenario: sponsoredScenario[scenarioId] }),
        })
        const body = await response.json() as { task?: { taskId?: string }; disclosure?: string; error?: string }
        if (!response.ok || !body.task?.taskId) throw new Error(body.error ?? 'Sponsored task creation failed')
        setResult({ task_id: body.task.taskId, network: 'Sponsored sandbox · receipt preview' })
        setIsSimulation(true)
      } else if (mode === 'sponsored') {
        setResult({ network: 'Judge preview · no task created' })
        setIsSimulation(true)
      }
    } catch (error) {
      setWalletMessage(error instanceof Error ? error.message : 'The sponsored sandbox is temporarily unavailable.')
    }
    await new Promise(resolve => window.setTimeout(resolve, 550))
    setScreen('receipt')
  }

  function reset() {
    setScreen('choose')
    setActiveStage(-1)
    setResult(null)
    setIsSimulation(true)
  }

  return (
    <main className={styles.shell} style={{ '--scene-accent': scenario.accent } as CSSProperties}>
      <div className={styles.aurora} aria-hidden="true" />
      <div className={styles.grid} aria-hidden="true" />

      <header className={styles.header}>
        <div>
          <p className={styles.kicker}><span /> GROUNDTRUTH LIVE LAB</p>
          <h1>Give an agent <em>eyes.</em></h1>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.live}><i /> SYSTEM ONLINE</div>
          <Link href="/judge">Technical proof ↗</Link>
        </div>
      </header>

      <div className={styles.progressTrack} aria-label={`Demo ${progress}% complete`}>
        <span style={{ width: `${progress}%` }} />
      </div>

      <section className={styles.stage}>
        <aside className={styles.rail} aria-label="Demo progress">
          {[
            ['01', 'Choose reality'],
            ['02', 'Authorize'],
            ['03', 'Submit evidence'],
            ['04', 'Verify'],
            ['05', 'Inspect receipt'],
          ].map(([number, label], index) => {
            const current = ['choose', 'authorize', 'evidence', 'processing', 'receipt'].indexOf(screen)
            return <div className={`${styles.railStep} ${index <= current ? styles.railActive : ''}`} key={number}>
              <b>{number}</b><span>{label}</span>
            </div>
          })}
        </aside>

        <div className={styles.canvas}>
          {screen === 'choose' && <div className={styles.enter}>
            <div className={styles.sectionTitle}>
              <p>01 — CHOOSE A PHYSICAL ASSUMPTION</p>
              <h2>What does your agent need to know <span>before it acts?</span></h2>
            </div>
            <div className={styles.scenarioGrid}>
              {(Object.keys(scenarios) as ScenarioId[]).map(id => {
                const item = scenarios[id]
                return <button className={`${styles.scenario} ${scenarioId === id ? styles.selected : ''}`} onClick={() => setScenarioId(id)} key={id}>
                  <span className={styles.scenarioGlyph}>{id === 'retail' ? '◫' : id === 'rwa' ? '◇' : '⌁'}</span>
                  <small>{item.eyebrow}</small>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                  <i>{scenarioId === id ? 'SELECTED' : 'SELECT'}</i>
                </button>
              })}
            </div>
            <button className={styles.primary} onClick={() => setScreen('authorize')}>Build this mission <span>→</span></button>
          </div>}

          {screen === 'authorize' && <div className={styles.enter}>
            <div className={styles.sectionTitle}>
              <p>02 — CHOOSE AUTHORIZATION</p>
              <h2>Zero friction—or prove the <span>live payment rail.</span></h2>
            </div>
            <div className={styles.modeGrid}>
              <button className={`${styles.mode} ${mode === 'sponsored' ? styles.selected : ''}`} onClick={() => setMode('sponsored')}>
                <div className={styles.modeTop}><span>RECOMMENDED</span><b>$0</b></div>
                <h3>Sponsored judge sandbox</h3>
                <p>One demo credit. No token transfer. No real customer mission. The wallet signature proves ownership only.</p>
                <ul><li>Verified browser wallet</li><li>Relaxed sandbox evidence</li><li>Clearly labeled demonstration</li></ul>
              </button>
              <button className={`${styles.mode} ${mode === 'paid' ? styles.selected : ''}`} onClick={() => { setMode('paid'); void inspectChallenge() }}>
                <div className={styles.modeTop}><span>LIVE RAIL</span><b>$0.01</b></div>
                <h3>Arbitrum One USDC</h3>
                <p>Inspect the real HTTP 402 offer. Payment is never simulated or marked complete without a verifiable transaction response.</p>
                <ul><li>Canonical USDC</li><li>Exact one-cent cap</li><li>Agent-native x402</li></ul>
              </button>
            </div>
            <div className={styles.walletRow}>
              <div><small>WALLET IDENTITY · REQUIRED FOR THE SPONSORED CREDIT</small><p>{walletVerified ? `${shortAddress(wallet)} · ownership verified` : wallet ? `${shortAddress(wallet)} · signature required` : 'Connect MetaMask, Rabby, Coinbase Wallet or OKX Wallet through the injected browser provider.'}</p></div>
              <button className={styles.secondary} disabled={walletLoading} onClick={connectWallet}>{walletLoading ? 'Check wallet…' : walletVerified ? 'Verified ✓' : 'Connect & sign'}</button>
            </div>
            {walletMessage && <p className={styles.notice}>{walletMessage}</p>}
            {mode === 'paid' && <div className={styles.challenge}>
              <span className={challenge === 'available' ? styles.ok : ''}>{challenge === 'loading' ? 'CHECKING LIVE ENDPOINT…' : challenge === 'available' ? '● LIVE 402 OFFER DETECTED' : challenge === 'unavailable' ? '○ LIVE OFFER NOT DETECTED' : '○ INSPECT THE PAYMENT OFFER'}</span>
              <Link href="/try">Open payment instructions ↗</Link>
            </div>}
            <div className={styles.footerActions}><button className={styles.back} onClick={() => setScreen('choose')}>← Back</button><button className={styles.primary} onClick={() => setScreen('evidence')}>{mode === 'sponsored' && !walletVerified ? 'Preview evidence flow' : 'Continue to evidence'} <span>→</span></button></div>
          </div>}

          {screen === 'evidence' && <div className={styles.enter}>
            <div className={styles.sectionTitle}>
              <p>03 — SATISFY THE EVIDENCE CONTRACT</p>
              <h2>Make the physical state <span>machine-readable.</span></h2>
            </div>
            <div className={styles.evidenceLayout}>
              <div className={styles.missionCard}>
                <div className={styles.missionHead}><span>MISSION / GT–DEMO–042</span><i>DEMO ONLY</i></div>
                <div className={styles.mapVisual}><span className={styles.radar}/><span className={styles.pin}>⌖</span><small>{scenario.location}</small></div>
                <dl><div><dt>OBJECT</dt><dd>{scenario.object}</dd></div><div><dt>QUESTION</dt><dd>{scenario.question}</dd></div><div><dt>PROOF</dt><dd>1 photo + structured observation</dd></div></dl>
              </div>
              <div className={styles.uploadCard}>
                <div className={styles.evidencePreview}>
                  {useSample ? <div className={styles.sampleImage}><img src="/demo-shelf-evidence.webp" alt="Synthetic shelf evidence made for the GroundTruth demo"/><small>SYNTHETIC DEMO EVIDENCE · NOT CUSTOMER DATA</small></div> : preview ? <img src={preview} alt="Uploaded evidence preview" /> : <div className={styles.emptyPreview}>No image selected</div>}
                  <div className={styles.scanLine}/>
                </div>
                <div className={styles.uploadOptions}>
                  <button className={useSample ? styles.optionActive : ''} onClick={() => { setUseSample(true); setFile(null) }}>Use supplied sample</button>
                  <button className={!useSample ? styles.optionActive : ''} onClick={() => inputRef.current?.click()}>Upload an image</button>
                  <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={onFile} hidden />
                </div>
                <p>Sandbox accepts a supplied or basic uploaded image. Production missions enforce their returned proof specification.</p>
              </div>
            </div>
            <div className={styles.footerActions}><button className={styles.back} onClick={() => setScreen('authorize')}>← Back</button><button className={styles.primary} onClick={runDemo}>Run verification <span>→</span></button></div>
          </div>}

          {screen === 'processing' && <div className={`${styles.enter} ${styles.processing}`}>
            <div className={styles.orbit} aria-hidden="true"><span/><span/><span/><b>GT</b></div>
            <div className={styles.sectionTitle}><p>04 — VERIFICATION PIPELINE</p><h2>Turning one observation into <span>bounded evidence.</span></h2></div>
            <div className={styles.pipeline}>
              {stageCopy.map(([label, detail], index) => <div className={`${styles.pipelineStep} ${index <= activeStage ? styles.pipelineDone : ''}`} key={label}>
                <i>{index < activeStage ? '✓' : index === activeStage ? '●' : '○'}</i><div><small>{label}</small><strong>{detail}</strong></div><span>{index < activeStage ? 'COMPLETE' : index === activeStage ? 'RUNNING' : 'QUEUED'}</span>
              </div>)}
            </div>
          </div>}

          {screen === 'receipt' && <div className={styles.enter}>
            <div className={styles.receiptHero}>
              <div className={styles.seal}><span>✓</span></div>
              <div><p>05 — VERIFICATION COMPLETE</p><h2>Reality, converted into a <span>verifiable receipt.</span></h2></div>
            </div>
            <div className={styles.receiptGrid}>
              <div className={styles.verdictCard}>
                <small>STRUCTURED VERDICT</small><h3>{scenario.object}</h3>
                <div className={styles.verdictLine}><span>Observed</span><b>YES</b></div>
                <div className={styles.verdictLine}><span>Evidence</span><b>1 IMAGE</b></div>
                <div className={styles.verdictLine}><span>Environment</span><b>SANDBOX</b></div>
                <p>This demonstrates the interface and evidence lifecycle. It is not customer traction or a production field observation.</p>
              </div>
              <div className={styles.chainCard}>
                <div className={styles.chainTop}><span>ARBITRUM RECEIPT</span><i className={result?.transaction_hash ? styles.onchain : ''}>{result?.transaction_hash ? 'ONCHAIN' : 'PREVIEW ONLY'}</i></div>
                <div className={styles.hashRows}><div><small>TASK</small><code>{result?.task_id ?? 'GT–DEMO–042'}</code></div><div><small>EVIDENCE ROOT</small><code>{result?.evidence_root ?? (result?.transaction_hash ? 'Not returned by backend' : '0x7a3f…91c2 · visual')}</code></div><div><small>VERDICT HASH</small><code>{result?.verdict_hash ?? (result?.transaction_hash ? 'Not returned by backend' : '0xc491…e0a8 · visual')}</code></div><div><small>NETWORK</small><code>{result?.network ?? 'Arbitrum Sepolia · demo'}</code></div></div>
                {!result?.transaction_hash && <div className={styles.truthLabel}>No transaction was returned by the demo backend. These hashes are visual placeholders and are not claimed as onchain.</div>}
                {result?.transaction_hash && <a className={styles.explorer} target="_blank" rel="noreferrer" href={result.receipt_url ?? `https://sepolia.arbiscan.io/tx/${result.transaction_hash}`}>Verify this transaction on Arbiscan ↗</a>}
              </div>
            </div>
            <div className={styles.finalBar}>
              <div><span>{isSimulation ? 'SPONSORED SANDBOX' : 'ONCHAIN RESULT'}</span><p>{isSimulation ? 'No real USDC charged · no customer activity claimed' : 'Backend returned verifiable proof'}</p></div>
              <div><Link href="/receipts">Open receipt verifier</Link><a target="_blank" rel="noreferrer" href="https://sepolia.arbiscan.io/tx/0xfed109f5d010f88205e9f2def4ae7bce6a779953eb4c5a73f52dc4ff6c4fd4d8">Inspect protocol demo ↗</a><button onClick={reset}>Run again</button></div>
            </div>
          </div>}
        </div>
      </section>

      <footer className={styles.disclosure}><b>DEMO BOUNDARY</b> Sponsored mode uses a sandbox credit, not fake currency. Uploads are evaluated with relaxed demo checks. A payment or Arbitrum receipt is displayed as complete only when the backend returns verifiable proof.</footer>
    </main>
  )
}
