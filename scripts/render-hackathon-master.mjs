import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const ffmpeg = path.join(root, 'tmp', 'hf-tools', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe')
const outputDir = path.join(root, 'output', 'hackathon-demo-video')
const capturesDir = path.join(outputDir, 'captures')
const trailer = path.join(root, 'output', 'hackathon-video', 'GroundTruth-Arbitrum-Hackathon.mp4')
const voice = path.join(outputDir, 'narration-fast.mp3')
const captionsVtt = path.join(outputDir, 'narration-fast.vtt')
const captionsSrt = path.join(outputDir, 'narration-fast.srt')
const logo = path.join(outputDir, 'groundtruth-lockup-fixed.png')
const demoSilent = path.join(outputDir, 'GroundTruth-Demo-Fast-silent.mp4')
const demo = path.join(outputDir, 'GroundTruth-Demo-Fast.mp4')
const trailerCut = path.join(outputDir, 'GroundTruth-Trailer-Opening.mp4')
const finalVideo = path.join(outputDir, 'GroundTruth-Open-House-Master-Under-2min.mp4')

const scenes = [
  ['01-home.png', 11],
  ['02-choose.png', 11],
  ['03-authorize.png', 11],
  ['04-evidence.png', 11],
  ['05-pipeline.png', 11],
  ['06-receipt.png', 11],
  ['07-judge.png', 11],
  ['08-robinhood.png', 11],
  ['09-pilot.png', 14],
]
const transition = 0.5
const demoDuration = scenes.reduce((sum, [, duration]) => sum + duration, 0) - transition * (scenes.length - 1)

for (const file of [ffmpeg, trailer, voice, captionsVtt, logo, ...scenes.map(([name]) => path.join(capturesDir, name))]) {
  if (!fs.existsSync(file)) throw new Error(`Missing required asset: ${file}`)
}

function run(args, label) {
  const result = spawnSync(ffmpeg, args, { cwd: root, stdio: 'inherit' })
  if (result.status !== 0) throw new Error(`${label} failed with exit code ${result.status}`)
}

run(['-y', '-i', captionsVtt, captionsSrt], 'caption conversion')

const inputs = []
const filters = []
scenes.forEach(([file, duration], index) => {
  inputs.push('-loop', '1', '-t', String(duration), '-i', path.join(capturesDir, file))
  const frames = Math.round(duration * 24)
  const drift = index % 2 === 0
    ? `zoompan=z='min(zoom+0.00024,1.028)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=1920x1080:fps=24`
    : `zoompan=z='min(zoom+0.00021,1.026)':x='iw/2-(iw/zoom/2)+(on/${frames}-0.5)*18':y='ih/2-(ih/zoom/2)':d=${frames}:s=1920x1080:fps=24`
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
filters.push(`[sequence]subtitles='${captionsSrt.replaceAll('\\', '/').replace(':', '\\:')}':force_style='FontName=Arial,FontSize=13,PrimaryColour=&H00FFFFFF,BackColour=&H78000000,OutlineColour=&H00101010,BorderStyle=3,Outline=1,Shadow=0,MarginV=25,MarginL=20,MarginR=20,Alignment=2',fade=t=in:st=0:d=0.35,fade=t=out:st=${(demoDuration - 0.5).toFixed(3)}:d=0.5,format=yuv420p,setsar=1[video]`)

run([
  '-y', ...inputs, '-filter_complex', filters.join(';'), '-map', '[video]', '-an', '-t', String(demoDuration),
  '-r', '24', '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', demoSilent,
], 'fast demo render')

run([
  '-y', '-i', demoSilent, '-i', voice, '-stream_loop', '-1', '-i', trailer,
  '-filter_complex', '[1:a]volume=1.0[voice];[2:a]volume=0.055,highpass=f=80,lowpass=f=9000[bed];[voice][bed]amix=inputs=2:duration=first:dropout_transition=2,aresample=48000[audio]',
  '-map', '0:v:0', '-map', '[audio]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', demo,
], 'fast demo audio mix')

run([
  '-y', '-t', '27', '-i', trailer,
  '-filter_complex', '[0:v]setpts=PTS/1.35,scale=1920:1080,fps=24,fade=t=out:st=19.65:d=0.35,format=yuv420p[v];[0:a]atempo=1.35,afade=t=out:st=19.65:d=0.35,aresample=48000[a]',
  '-map', '[v]', '-map', '[a]', '-t', '20', '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', trailerCut,
], 'trailer opening render')

run([
  '-y', '-i', trailerCut, '-i', demo, '-i', logo,
  '-filter_complex', '[0:v]setpts=PTS-STARTPTS[v0];[0:a]asetpts=PTS-STARTPTS,aresample=48000[a0];[1:v]setpts=PTS-STARTPTS[v1];[1:a]asetpts=PTS-STARTPTS,aresample=48000[a1];[v0][a0][v1][a1]concat=n=2:v=1:a=1[combined][audio];[2:v]scale=300:-1[brand];[combined][brand]overlay=x=42:y=28:enable=between(t\\,0\\,20):format=auto,format=yuv420p[video]',
  '-map', '[video]', '-map', '[audio]', '-r', '24', '-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', finalVideo,
], 'combined master render')

console.log(finalVideo)
