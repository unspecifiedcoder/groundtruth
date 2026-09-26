param(
  [string]$CsvPath = 'docs/AGENT-PROSPECTS-100.csv',
  [string]$MarkdownPath = 'docs/AGENT-PROSPECTS-100.md'
)

$ErrorActionPreference = 'Stop'

function Get-ResponseText($response) {
  if ($response.Content -is [byte[]]) { return [Text.Encoding]::UTF8.GetString($response.Content) }
  return [string]$response.Content
}

function Get-Segment([string]$text) {
  if ($text -match '(?i)^Mycelia Signal\b') { return 'risk/RWA' }
  if ($text -match '(?i)^(CoinGecko|CoinMarketCap|Nansen|Allium|Minifetch|Messari|Zerion|Alchemy)\b') { return 'research/intelligence' }
  if ($text -match '(?i)^(Agent Camo|Otto AI)\b') { return 'agent infrastructure' }
  if ($text -match '(?i)property|real estate|building|facility|hvac|construction|inspection|occupancy') { return 'property/facilities' }
  if ($text -match '(?i)travel|flight|hotel|restaurant|venue|map|geo|location|route|tourism') { return 'travel/location' }
  if ($text -match '(?i)shop|commerce|retail|e-?commerce|storefront|merch|inventory|delivery|postal|supply chain|logistics|gift card') { return 'commerce/logistics' }
  if ($text -match '(?i)rwa|insurance|claim|audit|compliance|risk|fraud|security') { return 'risk/RWA' }
  if ($text -match '(?i)research|intelligence|market|trend|news|analysis|data|search|insight') { return 'research/intelligence' }
  if ($text -match '(?i)agent|orchestrat|workflow|browser|mcp|a2a|x402') { return 'agent infrastructure' }
  return 'adjacent ecosystem'
}

function Get-PhysicalAssumption([string]$segment) {
  switch ($segment) {
    'property/facilities' { 'The premises, equipment, damage, access, or occupancy matches the digital record right now' }
    'travel/location' { 'The venue, route, queue, signage, accessibility, or local availability matches published data right now' }
    'commerce/logistics' { 'The item, shelf price, stock, package, display, or delivery state exists as represented right now' }
    'risk/RWA' { 'A claimed real-world asset, event, condition, or compliance fact is physically true and current' }
    'research/intelligence' { 'A consequential digital claim about a place, product, or event still matches present physical reality' }
    'agent infrastructure' { 'A downstream agent can safely act on a present physical fact that its APIs cannot directly observe' }
    default { 'The workflow has a present physical fact worth checking before a consequential action' }
  }
}

function Get-Problem([string]$segment) {
  switch ($segment) {
    'property/facilities' { 'Prevent a remote decision from relying on stale listing, sensor, or maintenance data' }
    'travel/location' { 'Prevent failed trips, bookings, or recommendations caused by stale local information' }
    'commerce/logistics' { 'Verify stock, price, condition, merchandising, pickup, or delivery before money or state changes' }
    'risk/RWA' { 'Attach fresh independent evidence to a claim before settlement, underwriting, or escalation' }
    'research/intelligence' { 'Add primary evidence when web/RAG sources are stale, correlated, or unable to observe the scene' }
    'agent infrastructure' { 'Offer a paid physical-world verification primitive to agents already buying digital tools' }
    default { 'Discover whether a current physical blind spot has an error cost above the verification price' }
  }
}

function Get-CostBand([string]$segment) {
  switch ($segment) {
    'property/facilities' { return @('$100+', '<=2%') }
    'risk/RWA' { return @('$100+', '<=2%') }
    'travel/location' { return @('$20+', '<=10%') }
    'commerce/logistics' { return @('$10+', '<=20%') }
    'research/intelligence' { return @('$5+', '<=40%') }
    default { return @('Requires discovery', 'Not yet calculable') }
  }
}

function Get-Score([string]$text, [string]$segment, [int64]$payers, [int64]$calls, [bool]$hasDirectContact, [bool]$baseCompatible) {
  $score = 0
  switch ($segment) {
    'property/facilities' { $score += 34 }
    'commerce/logistics' { $score += 32 }
    'travel/location' { $score += 30 }
    'risk/RWA' { $score += 28 }
    'research/intelligence' { $score += 18 }
    'agent infrastructure' { $score += 14 }
    default { $score += 4 }
  }
  if ($baseCompatible) { $score += 18 }
  if ($payers -ge 100) { $score += 10 } elseif ($payers -ge 20) { $score += 7 } elseif ($payers -gt 0) { $score += 4 }
  if ($calls -ge 100) { $score += 4 }
  if ($hasDirectContact) { $score += 6 }
  if ($text -match '(?i)buy|buyer|procure|purchase|checkout|wallet|autonomous|agentic') { $score += 8 }
  return $score
}

function Get-PreviousOutreach([string]$name) {
  if ($name -match '(?i)^Fanfare$') { return 'GitHub issue #1 sent 2026-09-27' }
  if ($name -match '(?i)^Otto AI$') { return 'GitHub issue #1 sent 2026-09-27' }
  if ($name -match '(?i)^PostalForm$') { return 'GitHub issue #1 sent 2026-09-27' }
  if ($name -match '(?i)^Mycelia Signal$') { return 'GitHub issue #1 sent 2026-09-27' }
  return 'None recorded'
}

$agentic = Invoke-RestMethod 'https://api.agentic.market/v1/services?limit=500' -TimeoutSec 45
$agenticRows = foreach ($service in $agentic.services) {
  if (-not $service.name -or $service.name -eq 'GroundTruth') { continue }
  $text = (@($service.name, $service.description, $service.category, ($service.tags -join ' ')) -join ' ').Trim()
  $identityText = (@($service.name, $service.description) -join ' ').Trim()
  $segment = Get-Segment $text
  if ($segment -eq 'adjacent ecosystem') { continue }
  if ($identityText -match '(?i)joke|riddle|roast|horoscope|horror story|useless fact|coinflip|word of the day|life advice|meme generator') { continue }
  $payers = 0L
  $calls = 0L
  foreach ($endpoint in $service.endpoints) {
    if ($endpoint.quality) {
      $payers += [int64]$endpoint.quality.l30DaysUniquePayers
      $calls += [int64]$endpoint.quality.l30DaysTotalCalls
    }
  }
  $baseCompatible = [bool](@($service.networks) -match '(^Base$|8453)')
  $contact = if ($service.providerUrl) { [string]$service.providerUrl } elseif ($service.domain) { 'https://' + [string]$service.domain } else { [string]$service.endpoints[0].url }
  $cost = Get-CostBand $segment
  $score = Get-Score $text $segment $payers $calls ([bool]$service.providerUrl) $baseCompatible
  if (-not $service.description) { $score -= 14 }
  if (-not $service.providerUrl) { $score -= 8 }
  if ([string]$service.name -match '\.') { $score -= 6 }
  if ((Get-PreviousOutreach ([string]$service.name)) -ne 'None recorded') { $score += 12 }
  [pscustomobject]@{
    score = $score
    agent = [string]$service.name
    segment = $segment
    ecosystem = 'Agentic Market / x402'
    physical_assumption = Get-PhysicalAssumption $segment
    problem = Get-Problem $segment
    payment_evidence = "Public x402 listing; Base-compatible=$baseCompatible; listed 30-day signal: $payers payer(s), $calls call(s)"
    buyer_authority = 'Unverified: x402 participation proves compatibility, not that this operator buys third-party services'
    protocol_fit = if ($baseCompatible) { 'Direct: GroundTruth accepts Base USDC via HTTP 402' } else { 'Protocol-adjacent; rail or adapter discovery required' }
    plausible_error_cost = $cost[0]
    break_even_at_2_usd = $cost[1]
    contact_path = $contact
    previous_outreach = Get-PreviousOutreach ([string]$service.name)
    next_action = if ((Get-PreviousOutreach ([string]$service.name)) -ne 'None recorded') { 'Wait for reply; do not duplicate contact' } else { 'Confirm a concrete physical dependency with the operator; pitch one $2 quick_check, then $0.10 evaluation fallback' }
    source = 'https://api.agentic.market/v1/services?limit=500'
  }
}

$masumiHeaders = @{ token = 'public-test-key-masumi-registry-c23f3d21' }
$masumiAll = @()
$cursor = $null
for ($page = 1; $page -le 3; $page++) {
  $payload = @{ network = 'Preprod'; limit = 50 }
  if ($cursor) { $payload.cursorId = $cursor }
  $response = Invoke-WebRequest -UseBasicParsing -Method POST 'https://registry.masumi.network/api/v1/registry-entry/' -Headers $masumiHeaders -ContentType 'application/json' -Body ($payload | ConvertTo-Json -Compress) -TimeoutSec 30
  $entries = ((Get-ResponseText $response) | ConvertFrom-Json).data.entries
  if (-not $entries) { break }
  $masumiAll += $entries
  $cursor = $entries[-1].id
}

$masumiRows = foreach ($entry in ($masumiAll | Where-Object { $_.status -eq 'Online' -and $_.paymentType -like 'Web3*' } | Group-Object agentIdentifier | ForEach-Object { $_.Group[0] })) {
  $text = (@($entry.name, $entry.description, ($entry.tags -join ' ')) -join ' ').Trim()
  if (-not $entry.name -or $text -match '(?i)\b(test|demo|example|sample)\b|tutorial|template') { continue }
  $segment = Get-Segment $text
  if ($segment -eq 'adjacent ecosystem') { continue }
  $email = [string]$entry.authorContactEmail
  $emailValid = [bool]($email -and $email -notmatch '(?i)example\.com|test@')
  $contact = if ($emailValid) { 'mailto:' + $email } elseif ($entry.apiBaseUrl) { [string]$entry.apiBaseUrl } else { 'https://registry.masumi.network' }
  $cost = Get-CostBand $segment
  [pscustomobject]@{
    score = Get-Score $text $segment 0 0 ([bool]$contact) $false
    agent = [string]$entry.name
    segment = $segment
    ecosystem = 'Masumi'
    physical_assumption = Get-PhysicalAssumption $segment
    problem = Get-Problem $segment
    payment_evidence = 'Online Masumi Web3-priced agent listing'
    buyer_authority = 'Unverified: listing proves an economic agent/operator, not delegated outbound spend'
    protocol_fit = 'Adapter required: Masumi/Cardano listing; GroundTruth currently accepts Base USDC and X Layer USDT0'
    plausible_error_cost = $cost[0]
    break_even_at_2_usd = $cost[1]
    contact_path = $contact
    previous_outreach = Get-PreviousOutreach ([string]$entry.name)
    next_action = 'Operator discovery first; offer a scoped technical review before proposing a paid cross-rail test'
    source = 'https://registry.masumi.network'
  }
}

$combined = @($agenticRows + $masumiRows) |
  Group-Object { $_.agent.Trim().ToLowerInvariant() } |
  ForEach-Object { $_.Group | Sort-Object score -Descending | Select-Object -First 1 } |
  Sort-Object -Property @{ Expression = 'score'; Descending = $true }, agent |
  Select-Object -First 100

if ($combined.Count -lt 100) { throw "Only $($combined.Count) qualified candidates remained; broaden sources instead of padding the list" }

$rank = 0
$rows = foreach ($item in $combined) {
  $rank++
  [pscustomobject]@{
    rank = $rank
    priority = if ($item.score -ge 58) { 'A' } elseif ($item.score -ge 44) { 'B' } else { 'C' }
    score = $item.score
    agent = $item.agent
    segment = $item.segment
    ecosystem = $item.ecosystem
    physical_assumption = $item.physical_assumption
    problem = $item.problem
    payment_evidence = $item.payment_evidence
    buyer_authority = $item.buyer_authority
    protocol_fit = $item.protocol_fit
    plausible_error_cost = $item.plausible_error_cost
    break_even_at_2_usd = $item.break_even_at_2_usd
    contact_path = $item.contact_path
    previous_outreach = $item.previous_outreach
    next_action = $item.next_action
    source = $item.source
    verified_on = (Get-Date).ToString('yyyy-MM-dd')
  }
}

$rows | ConvertTo-Csv -NoTypeInformation | Set-Content -Encoding utf8 $CsvPath

$a = @($rows | Where-Object priority -eq 'A').Count
$b = @($rows | Where-Object priority -eq 'B').Count
$c = @($rows | Where-Object priority -eq 'C').Count
$direct = @($rows | Where-Object protocol_fit -like 'Direct:*').Count
$md = @(
  '# GroundTruth revenue prospect pipeline',
  '',
  "Updated: $((Get-Date).ToString('yyyy-MM-dd'))",
  '',
  'This is a qualification pipeline, not a customer list. Payment compatibility is kept separate from verified authority to buy. No entry counts as revenue, a lead, or a commitment until an external operator responds substantively.',
  '',
  "- Prospects: **$($rows.Count)**",
  "- Priority A: **$a**",
  "- Priority B: **$b**",
  "- Priority C: **$c**",
  "- Direct Base-USDC protocol fit: **$direct**",
  '',
  '## Ranking model',
  '',
  'Candidates rank higher when they have a specific physical dependency, a plausible cost-of-error above $2, direct Base USDC compatibility, observable economic activity, and a public operator path. Generic directories, joke endpoints, and agents without an identifiable physical assumption are excluded.',
  '',
  '## Operating rule',
  '',
  'Validate buyer authority and the physical assumption before outreach. Send one personalized proposition, one materially different follow-up at most, and stop on explicit refusal. Lead with the $2 `quick_check`; use the $0.10 `evaluation_test` only as an integration fallback.',
  '',
  'The complete working set is in [AGENT-PROSPECTS-100.csv](./AGENT-PROSPECTS-100.csv).'
)
$md -join "`n" | Set-Content -Encoding utf8 $MarkdownPath

$rows
