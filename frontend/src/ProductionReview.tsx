import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, ArrowUpRight, FileJson, Film, Loader2, RefreshCw } from 'lucide-react'
import './ProductionReview.css'

type Gate = { status?: string; warnings?: string[]; error?: string; total?: { passed: number; failed: number }; resolved?: { id: string; displayText: string; globalStartSec: number; globalEndSec: number }[]; similarity?: { day: number; score: number; templateSequenceSimilarity: number; sceneCountSimilarity: number; layoutSimilarity: number; statPlacementSimilarity: number; iconCompositionSimilarity: number }[] }
type Review = {
  day: number; title: string; videoAvailable: boolean; videoVersion: string | null; errors: string[];
  validation: { generatedAt: string; gates: Record<string, Gate>; approvedVoiceText: string; duration?: { status: string; audioSec: number }; productionDecision?: { allowed: boolean; blockedBy: string[] } } | null;
  visualPlan: { primaryArchetype: string; secondaryArchetype?: string; rationale: string } | null;
  visualVariety: Gate | null; hSource: 'production' | 'preflight' | 'none';
  scenes: { index: number; id: string; template: string; voiceText: string; start: number | null; end: number | null }[];
  artifacts: { key: string; image: boolean; url: string }[];
  media: { duration: string | null; width: number | null; height: number | null; fps: string | null; videoCodec: string | null; audioCodec: string | null };
}
type Catalog = { days: { day: number; title: string; videoAvailable: boolean; hStatus: string; hSource: string }[]; latestDay: number }
const gateNames = ['A_SCRIPT_INTEGRITY', 'B_NO_UNAPPROVED_COPY', 'C_THEME', 'D_TRANSCRIPT', 'E_NUMBER_HIGHLIGHTS', 'F_TEMPLATE_SCENE', 'G_TESTS', 'H_VISUAL_VARIETY']
const labels = ['Script integrity', 'Approved copy', 'Theme', 'WordBoundary', 'Number highlights', 'Scene timing', 'Tests', 'Visual variety']
const artifactLabels: Record<string, string> = { overall: 'Overall', hook: 'Hook 0–0.60s', 'boundaries-1': 'Transitions 1–3', 'boundaries-2': 'Transitions 4–6', 'boundaries-3': 'Transitions 7–9', 'outro-1': 'Outro · last word', 'outro-2': 'Outro · follow', 'metric-7': '$7 reveal', 'metric-12': '$12 reveal' }
function Badge({ status }: { status?: string }) {
  const value = status || 'NOT_RUN'
  const tone = value === 'PASS' ? 'pass' : value === 'WARNING' ? 'warning' : value === 'FAIL' ? 'fail' : 'unknown'
  return <span className={`review-badge ${tone}`}>{value === 'NOT_RUN' ? 'NOT RUN' : value}</span>
}

export default function ProductionReview({ api, refreshKey }: { api: string; refreshKey: number }) {
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [day, setDay] = useState<number | null>(null)
  const [data, setData] = useState<Review | null>(null)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  const video = useRef<HTMLVideoElement>(null)
  const mediaUrl = (url: string) => `${api.replace(/\/api$/, '')}${url}`
  useEffect(() => {
    const controller = new AbortController()
    fetch(`${api}/production`, { signal: controller.signal, cache: 'no-store' })
      .then(async response => { if (!response.ok) throw new Error(`Production API: ${response.status}`); return response.json() })
      .then((result: Catalog) => { setCatalog(result); setDay(previous => previous ?? result.latestDay); setError('') })
      .catch(err => { if (err.name !== 'AbortError') setError('Không tải được production API. Kiểm tra backend hoặc thử làm mới.') })
    return () => controller.abort()
  }, [api, refreshKey, revision])
  useEffect(() => {
    if (day === null) return
    const controller = new AbortController()
    setData(null)
    fetch(`${api}/production/${day}`, { signal: controller.signal, cache: 'no-store' })
      .then(async response => { if (!response.ok) throw new Error(`Day API: ${response.status}`); return response.json() })
      .then((result: Review) => { setData(result); setError('') })
      .catch(err => { if (err.name !== 'AbortError') setError(`Không tải được report Day ${day}.`) })
    return () => controller.abort()
  }, [api, day, refreshKey, revision])
  const h = data?.visualVariety
  const decision = data?.validation?.productionDecision
  const numberGate = data?.validation?.gates.E_NUMBER_HIGHLIGHTS
  const testGate = data?.validation?.gates.G_TESTS
  const durationGate = data?.validation?.gates.I_PRODUCTION_DURATION as (Gate & { phase: string; seconds: number; minimumSec: number }) | undefined
  const seek = (time: number | null) => { if (video.current && time !== null) { video.current.currentTime = time; video.current.scrollIntoView({ behavior: 'smooth', block: 'center' }) } }
  return <section className="production-review" aria-label="Money Habits Production Review">
    <header className="review-heading"><div><span className="review-eyebrow">MASTER TEMPLATE v1.1</span><h2>Production Review</h2><p>Approved source → WordBoundary → A–H → HyperFrames</p></div><button className="review-button" onClick={() => setRevision(v => v + 1)}><RefreshCw size={15}/> Làm mới report</button></header>
    <nav className="review-days" aria-label="Chọn ngày review">{(catalog?.days ?? []).map(item => <button key={item.day} aria-pressed={day === item.day} onClick={() => setDay(item.day)} title={item.title}><span>Day {item.day}</span><small>{item.hStatus === 'NOT_RUN' ? 'Chưa có H' : `${item.hStatus}${item.hSource === 'preflight' ? ' · preflight' : ''}`}</small></button>)}</nav>
    {error && <div className="review-alert" role="alert">{error}</div>}
    {!data && !error && <p role="status"><Loader2 className="spinner" size={18}/> Đang tải production artifacts…</p>}
    {data && <>
      <div className="review-title"><h3>{data.title}</h3><span>Output hiện có · không đồng nghĩa đã APPROVED</span></div>
      {data.errors.map((value, i) => <div className="review-alert" role="alert" key={i}>Artifact error: {value}</div>)}
      <div className="review-columns">
        <aside className="review-player"><div className="review-video">{data.videoAvailable ? <video ref={video} key={`${day}-${data.videoVersion}`} controls playsInline preload="metadata" poster={data.artifacts.some(a => a.key === 'poster') ? `${api}/production/${day}/artifacts/poster?v=${data.videoVersion}` : undefined} src={`${api}/motion-graphic-video/${day}?v=${data.videoVersion}`}/> : <div className="review-no-video"><Film size={30}/><p>Chưa có video</p></div>}</div><div className="review-media"><strong>{data.media.duration ? `${Number(data.media.duration).toFixed(2)}s` : 'Duration: —'}</strong><span>{data.media.width ? `${data.media.width}×${data.media.height} · ${data.media.fps === '30/1' ? '30 fps' : data.media.fps}` : 'Chưa có media probe'}</span><small>{data.media.videoCodec?.toUpperCase()} {data.media.audioCodec ? `/ ${data.media.audioCodec.toUpperCase()}` : ''} · {data.scenes.length} scenes</small></div></aside>
        <div className="review-details">
          <div className="review-contract"><span>LOCKED BASELINE</span><p>AndrewMultilingualNeural · speed 0.8 · Edge WordBoundary<br/>Navy / off-white / gold · 180ms crossfade</p><small>Read-only review. Không chỉnh voice/subtitle timing hoặc tự chạy render tại đây.</small></div>
          <div className="review-archetype"><span>VISUAL ARCHETYPE</span><h4>{data.visualPlan?.primaryArchetype ?? 'Chưa có visual plan'}{data.visualPlan?.secondaryArchetype && <> <em>+</em> {data.visualPlan.secondaryArchetype}</>}</h4><p>{data.visualPlan?.rationale}</p></div>
          <div className="review-gates">{gateNames.map((key, index) => <div key={key}><span><b>{key[0]}</b> {labels[index]}</span><Badge status={key === 'H_VISUAL_VARIETY' ? h?.status : data.validation?.gates[key]?.status}/></div>)}</div>
          {data.hSource === 'preflight' && <p className="review-note">H lấy từ preflight riêng của output cũ, chưa nằm trong production validation report A–H.</p>}
          <div className={`review-decision ${decision?.allowed ? '' : 'not-allowed'}`}><strong>{decision ? decision.allowed ? 'Production gate: ALLOWED' : 'Production gate: BLOCKED' : 'Chưa có production decision A–H'}</strong><span>PASS / WARNING cho render; FAIL chặn render. Đây là kết quả report, không phải phê duyệt nội dung.</span>{decision?.blockedBy.length ? <p>{decision.blockedBy.join(', ')}</p> : null}</div>
          {h?.warnings?.map(warning => <div className="review-alert" key={warning}><AlertTriangle size={16}/><span>{warning}</span></div>)}
          {h?.error && <div className="review-alert" role="alert">{h.error}</div>}
          {data.validation?.duration?.status === 'SHORT_APPROVED_NARRATION' && <div className="review-alert"><AlertTriangle size={16}/><span>SHORT_APPROVED_NARRATION · Voice {data.validation.duration.audioSec.toFixed(2)}s, dưới 60s. Giữ approved script; không padding.</span></div>}
          {testGate?.total && <p className="review-test-total">Tests: {testGate.total.passed} PASS / {testGate.total.failed} FAIL</p>}
          {durationGate && <p className="review-test-total">Production duration <Badge status={durationGate.status}/> · {durationGate.seconds.toFixed(3)}s / minimum {durationGate.minimumSec}s · {durationGate.phase === 'measured' ? 'Measured video stream' : 'Planned only — chưa xác nhận MP4'}</p>}
          <div className="review-links">{data.artifacts.filter(a => !a.image).map(a => <a key={a.key} href={mediaUrl(a.url)} target="_blank" rel="noreferrer"><FileJson size={14}/>{a.key}<ArrowUpRight size={12}/></a>)}</div>
          <small className="review-timestamp">Report: {data.validation?.generatedAt ? new Date(data.validation.generatedAt).toLocaleString() : 'Chưa có validation report'}. Video có thể thuộc lần render trước nếu report mới đang BLOCKED.</small>
        </div>
      </div>
      {!!h?.similarity?.length && <section className="review-section"><h3>H · Similarity với các Day gần nhất</h3><div className="review-table-wrap"><table><thead><tr><th>Compare</th><th>Total</th><th>Sequence</th><th>Count</th><th>Layout</th><th>Stat</th><th>Icon</th></tr></thead><tbody>{h.similarity.map(row => <tr key={row.day}><th>Day {row.day}</th>{[row.score, row.templateSequenceSimilarity, row.sceneCountSimilarity, row.layoutSimilarity, row.statPlacementSimilarity, row.iconCompositionSimilarity].map((value,i) => <td key={i}>{typeof value === 'number' ? value.toFixed(3) : '—'}</td>)}</tr>)}</tbody></table></div><p className="review-note">Similarity là heuristic từ plan metadata, không phải độ giống pixel. WARNING không bị nâng thành hard blocker.</p></section>}
      {!!numberGate?.resolved?.length && <section className="review-section"><h3>Number highlights · transcript timing</h3><div className="review-number-row">{numberGate.resolved.map(n => <button className="review-number" key={n.id} onClick={() => seek(n.globalStartSec)}><strong>{n.displayText}</strong><span>{n.globalStartSec.toFixed(3)}–{n.globalEndSec.toFixed(3)}s</span><small>Seek tới spoken phrase</small></button>)}</div></section>}
      <section className="review-section"><h3>Frame-level QA artifacts</h3>{data.artifacts.some(a => a.image && a.key !== 'poster') ? <div className="review-qa-grid">{data.artifacts.filter(a => a.image && a.key !== 'poster').map(a => <a href={mediaUrl(a.url)} key={a.key} target="_blank" rel="noreferrer"><img loading="lazy" src={`${mediaUrl(a.url)}?v=${data.videoVersion}`} alt={artifactLabels[a.key] ?? a.key}/><span>{artifactLabels[a.key] ?? a.key} <ArrowUpRight size={13}/></span></a>)}</div> : <p>Chưa có QA v1.1 artifacts cho Day này. Không suy diễn QA PASS từ việc đã có video.</p>}</section>
      <details className="review-section"><summary>Exact approved voiceText</summary><p className="review-voice">{data.validation?.approvedVoiceText ?? 'Chưa có approved voiceText trong report.'}</p></details>
      <details className="review-section"><summary>Scene plan · {data.scenes.length} scenes</summary><div className="review-table-wrap"><table><thead><tr><th># / Time</th><th>Template</th><th>Source span</th></tr></thead><tbody>{data.scenes.map(s => <tr key={s.id}><td><button className="review-seek" disabled={s.start === null || !data.videoAvailable} onClick={() => seek(s.start)}>{s.index} · {s.start?.toFixed(2) ?? '—'}–{s.end?.toFixed(2) ?? '—'}s</button></td><td>{s.template}</td><td>{s.voiceText}</td></tr>)}</tbody></table></div></details>
    </>}
  </section>
}
