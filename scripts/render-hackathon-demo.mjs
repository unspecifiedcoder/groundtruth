import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const ffmpeg = path.join(root, 'tmp', 'hf-tools', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe')
const outputDir = path.join(root, 'output', 'hackathon-demo-video')
const capturesDir = path.join(outputDir, 'captures')
const silentVideo = path.join(outputDir, 'GroundTruth-Open-House-Demo-silent.mp4')
const finalVideo = path.join(outputDir, 'GroundTruth-Open-House-Demo.mp4')
const narration = path.join(outputDir, 'narration.mp3')
const captionsVtt = path.join(outputDir, 'narration.vtt')
const captionsSrt = path.join(outputDir, 'narration.srt')
const music = path.join(root, 'output', 'hackathon-video', 'GroundTruth-Arbitrum-Hackathon.mp4')

const scenes = [
  ['01-home.png', 18],
  ['02-choose.png', 19],
  ['03-authorize.png', 20],
  ['04-evidence.png', 20],
  ['05-pipeline.png', 20],
  ['06-receipt.png', 19],
  ['07-judge.png', 18],
  ['08-robinhood.png', 20],
  ['09-pilot.png', 16.5],
]

for (const [file] of scenes) {
  const full = path.join(capturesDir, file)
  if (!fs.existsSync(full)) throw new Error(`Missing capture: ${full}`)
}
if (!fs.existsSync(ffmpeg)) throw new Error(`Missing ffmpeg: ${ffmpeg}`)
if (!fs.existsSync(narration) || !fs.existsSync(captionsVtt)) throw new Error('Narration and captions must be generated first')

function run(args, label) {
  const result = spawnSync(ffmpeg, args, { cwd: root, stdio: 'inherit' })
  if (result.status !== 0) throw new Error(`${label} failed with exit code ${result.status}`)
}

run(['-y', '-i', captionsVtt, captionsSrt], 'caption conversion')

const transition = 0.5
const totalDuration = scenes.reduce((sum, [, duration]) => sum + duration, 0) - transition * (scenes.length - 1)
const inputArgs = []
const filters = []
scenes.forEach(([file, duration], index) => {
  inputArgs.push('-loop', '1', '-t', String(duration), '-i', path.join(capturesDir, file))
  const frames = Math.round(duration * 24)
  const drift = index % 2 === 0
    ? `zoompan=z='min(zoom+0.00016,1.026)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=1920x1080:fps=24`
    : `zoompan=z='min(zoom+0.00014,1.024)':x='iw/2-(iw/zoom/2)+(on/${frames}-0.5)*18':y='ih/2-(ih/zoom/2)':d=${frames}:s=1920x1080:fps=24`
  filters.push(`[${index}:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x05070b,${drift},trim=duration=${duration},format=yuv420p,setpts=PTS-STARTPTS[v${index}]`)
})

let previous = 'v0'
let elapsed = scenes[0][1]
for (let index = 1; index < scenes.length; index += 1) {
  const output = index === scenes.length - 1 ? 'sequence' : `x${index}`
  const offset = elapsed - transition * index
  filters.push(`[${previous}][v${index}]xfade=transition=fade:duration=${transition}:offset=${offset.toFixed(3)}[${output}]`)
  previous = output
  elapsed += scenes[index][1]
}
filters.push(`[sequence]subtitles='${captionsSrt.replaceAll('\\', '/').replace(':', '\\:')}':force_style='FontName=Arial,FontSize=14,PrimaryColour=&H00FFFFFF,BackColour=&H78000000,OutlineColour=&H00101010,BorderStyle=3,Outline=1,Shadow=0,MarginV=28,MarginL=20,MarginR=20,Alignment=2',fade=t=in:st=0:d=0.8,fade=t=out:st=${(totalDuration - 1).toFixed(3)}:d=1,format=yuv420p,setsar=1[video]`)

run([
  '-y', ...inputArgs,
  '-filter_complex', filters.join(';'),
  '-map', '[video]', '-an', '-t', String(totalDuration), '-r', '24', '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', silentVideo,
], 'silent video render')

run([
  '-y', '-i', silentVideo, '-i', narration, '-stream_loop', '-1', '-i', music,
  '-filter_complex', '[1:a]volume=1.0[voice];[2:a]volume=0.07,highpass=f=80,lowpass=f=9000[bed];[voice][bed]amix=inputs=2:duration=first:dropout_transition=2[audio]',
  '-map', '0:v:0', '-map', '[audio]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', finalVideo,
], 'final audio mix')

console.log(finalVideo)
