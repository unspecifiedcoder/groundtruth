#!/usr/bin/env node
// Bridges OKX Task Marketplace jobs into the GroundTruth oracle pipeline.
//
// Why this exists: accepting a marketplace job and serving the x402 HTTP
// endpoint are two different channels. The endpoint was fine, but nothing ever
// called `onchainos agent deliver`, so an accepted job sat in `accepted` with an
// empty deliverable list until the buyer gave up. That is exactly what buyer
// agent #6058 reported on job 0xcae1…b683.
//
// Flow per accepted job:
//   1. create a GroundTruth task from the job title (demo header — the buyer
//      already paid through marketplace escrow, so we must not charge again)
//   2. tell the buyer we're on it, with an ETA, so they aren't staring at silence
//   3. poll that task; once the AI notary marks it `verified`, run `deliver`
//      so the deliverable lands in the list the buyer is polling
//
// Deliberately does NOT auto-apply to `created` jobs: ASPs are passive, and
// `apply` is only valid when triggered by a JobAspSelected system event.
//
// Node built-ins only — the repo's node_modules is not usable on this machine.

import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

const exec = promisify(execFile)

const ONCHAINOS = process.env.ONCHAINOS_BIN ?? '/root/.local/bin/onchainos'
const A2A = process.env.OKX_A2A_BIN ?? 'okx-a2a'
const AGENT_ID = process.env.ASP_AGENT_ID ?? '6282'
const STATE_FILE = process.env.BRIDGE_STATE ?? '/root/logs/marketplace-bridge.json'
const LOG_FILE = process.env.BRIDGE_LOG ?? '/root/logs/marketplace-bridge.log'
const INTERVAL_MS = Number(process.env.BRIDGE_INTERVAL_MS ?? '60000')
const ENV_FILE = process.env.BRIDGE_ENV_FILE ?? '/mnt/c/Users/Pramod/GitHub/okx_submission/.env.local'

// Marketplace status codes (task-core.md field mapping table).
const STATUS_ACCEPTED = 1

function loadEnv(path) {
  const out = {}
  if (!existsSync(path)) return out
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#') || !t.includes('=')) continue
    const i = t.indexOf('=')
    out[t.slice(0, i)] = t.slice(i + 1).replace(/^["']|["']$/g, '')
  }
  return out
}

const env = loadEnv(ENV_FILE)
const APP_URL = env.NEXT_PUBLIC_APP_URL ?? 'https://groundtruth-oracle.vercel.app'
const ADMIN_SECRET = env.ADMIN_SECRET ?? ''

function log(msg) {
  const line = `${new Date().toISOString()} ${msg}`
  console.log(line)
  try {
    mkdirSync(dirname(LOG_FILE), { recursive: true })
    writeFileSync(LOG_FILE, line + '\n', { flag: 'a' })
  } catch {
    /* logging must never take the loop down */
  }
}

function loadState() {
  try {
    return JSON.parse(readFileSync(STATE_FILE, 'utf8'))
  } catch {
    return { jobs: {} }
  }
}

function saveState(state) {
  mkdirSync(dirname(STATE_FILE), { recursive: true })
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))
}

async function cli(args) {
  const { stdout } = await exec(ONCHAINOS, args, { timeout: 180_000, maxBuffer: 8 << 20 })
  return stdout
}

async function cliJson(args) {
  return JSON.parse(await cli(args))
}

/** Non-terminal jobs where we are the ASP. */
async function activeJobs() {
  const res = await cliJson(['agent', 'active-tasks'])
  return (res?.data?.tasks ?? []).filter((t) => t.myRole === 'asp')
}

/** Create the GroundTruth task backing a marketplace job. */
async function createTask(job) {
  if (!ADMIN_SECRET) throw new Error('ADMIN_SECRET missing — cannot create task without double-charging')
  const res = await fetch(`${APP_URL}/api/v1/human-do`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-DEMO-KEY': ADMIN_SECRET },
    body: JSON.stringify({
      intent: job.title,
      proof_spec: {
        type: 'photo',
        instructions: `${job.title} — photograph clear evidence. Marketplace job ${job.shortJobId}.`,
        minPhotos: 1,
      },
    }),
    signal: AbortSignal.timeout(60_000),
  })
  if (!res.ok) throw new Error(`task creation failed: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`)
  return res.json()
}

async function getTask(taskId) {
  const res = await fetch(`${APP_URL}/api/v1/tasks/${taskId}`, { signal: AbortSignal.timeout(30_000) })
  if (!res.ok) throw new Error(`task poll failed: HTTP ${res.status}`)
  return res.json()
}

/**
 * Best-effort "we're on it" note to the BUYER over the job's XMTP channel.
 * Never fatal — a missed note must not block delivery.
 *
 * Note this is `okx-a2a session send`, not `onchainos agent user-notify`: the
 * latter pushes to our own operator session and never reaches the counterparty,
 * which is precisely the silence the buyer complained about.
 */
async function notifyBuyer(job, text) {
  const send = () =>
    exec(A2A, [
      'session', 'send',
      '--job-id', job.jobId,
      '--to-agent-id', String(job.counterpartyAgentId),
      '--agent-id', AGENT_ID,
      '--content', text,
    ], { timeout: 120_000, maxBuffer: 8 << 20 })

  try {
    await send()
    log(`[${job.shortJobId}] buyer #${job.counterpartyAgentId} messaged`)
  } catch {
    // No session yet on first contact — create it, then retry once.
    try {
      await exec(A2A, [
        'session', 'create',
        '--job-id', job.jobId,
        '--my-agent-id', AGENT_ID,
        '--to-agent-id', String(job.counterpartyAgentId),
      ], { timeout: 120_000 })
      await send()
      log(`[${job.shortJobId}] buyer #${job.counterpartyAgentId} messaged (new session)`)
    } catch (e) {
      log(`[${job.shortJobId}] buyer message failed (non-fatal): ${e.message.split('\n')[0]}`)
    }
  }
}

function deliverableText(job, task) {
  const lines = [
    `GroundTruth human-oracle result for "${job.title}"`,
    ``,
    `Status: ${task.status}`,
    `Task ID: ${task.id}`,
  ]
  if (task.result) lines.push(``, `Result: ${typeof task.result === 'string' ? task.result : JSON.stringify(task.result)}`)
  if (task.proof_payload) lines.push(``, `Proof: ${JSON.stringify(task.proof_payload)}`)
  lines.push(``, `Verify independently: ${APP_URL}/api/v1/tasks/${task.id}`)
  return lines.join('\n')
}

/**
 * Hand the finished result to the buyer.
 *
 * Two protocols, and they are NOT interchangeable:
 *  - escrow (paymentMode 1) → `agent deliver` posts the deliverable record.
 *  - x402   (paymentMode 3) → `deliver` is REJECTED by the backend. x402 skips
 *    the submit step entirely: the buyer replays our paid endpoint to obtain the
 *    result and then calls /direct/complete. There is no ASP-side push.
 *
 * For x402 we therefore send the result over the job's XMTP channel instead, so
 * the buyer has it (and the free poll URL) even if their own environment blocks
 * replaying our endpoint — which is what happened to buyer #6058, whose security
 * guardrail refused any command containing our vercel.app URL.
 */
async function deliver(job, task) {
  const text = deliverableText(job, task)
  try {
    await cli([
      'agent', 'deliver', job.jobId,
      '--agent-id', AGENT_ID,
      '--message', `Deliverable ready for "${job.title}"`,
      '--deliverable-text', text,
    ])
    log(`[${job.shortJobId}] DELIVERED via escrow submit (task ${task.id})`)
    return
  } catch (e) {
    const msg = e.stdout ?? e.message ?? ''
    if (!/paymentMode = 3|only supported for escrow/.test(msg)) throw e
  }

  // x402 path — push the result over the job channel.
  await notifyBuyer(job, text)
  log(`[${job.shortJobId}] result sent over job channel (x402 — deliver not applicable) (task ${task.id})`)
}

async function handleAccepted(job, state) {
  const rec = state.jobs[job.jobId] ?? {}

  if (rec.delivered) return

  if (!rec.taskId) {
    const task = await createTask(job)
    rec.taskId = task.task_id
    rec.createdAt = new Date().toISOString()
    state.jobs[job.jobId] = rec
    saveState(state)
    log(`[${job.shortJobId}] task created: ${task.task_id} ("${job.title}")`)
    await notifyBuyer(
      job,
      `GroundTruth (#${AGENT_ID}) accepted "${job.title}" and dispatched it to a human oracle. ` +
        `Track it live at ${APP_URL}/api/v1/tasks/${rec.taskId} — the deliverable is posted here as soon as the AI notary verifies the proof.`
    )
    return
  }

  const task = await getTask(rec.taskId)
  if (task.status === 'verified') {
    await deliver(job, task)
    rec.delivered = true
    rec.deliveredAt = new Date().toISOString()
    state.jobs[job.jobId] = rec
    saveState(state)
  } else if (task.status === 'failed' || task.status === 'expired') {
    // Don't silently sit on a dead task — surface it rather than leaving the
    // buyer in `accepted` forever, which is the bug this script exists to fix.
    log(`[${job.shortJobId}] backing task ${rec.taskId} is ${task.status} — needs attention`)
  } else {
    log(`[${job.shortJobId}] waiting on task ${rec.taskId} (${task.status})`)
  }
}

async function tick() {
  const state = loadState()
  let jobs
  try {
    jobs = await activeJobs()
  } catch (e) {
    log(`active-tasks failed (will retry): ${e.message.split('\n')[0]}`)
    return
  }

  for (const job of jobs) {
    try {
      if (job.statusCode === STATUS_ACCEPTED) {
        await handleAccepted(job, state)
      } else {
        // `created` jobs are left alone on purpose — see header note on apply.
        log(`[${job.shortJobId}] status ${job.status} — no ASP action`)
      }
    } catch (e) {
      log(`[${job.shortJobId}] ERROR: ${e.message.split('\n')[0]}`)
    }
  }
}

const once = process.argv.includes('--once')
log(once ? 'marketplace-bridge: single pass' : `marketplace-bridge: polling every ${INTERVAL_MS / 1000}s`)
await tick()
if (!once) {
  setInterval(() => {
    tick().catch((e) => log(`tick crashed: ${e.message}`))
  }, INTERVAL_MS)
}
