import { useCallback, useEffect, useRef, useState } from 'react'
import axios from 'axios'
import {
  Check, CheckCircle2, ChevronDown, Copy, Download, FolderOpen, Gauge, Image,
  AudioLines, Captions, Loader2, Play, RefreshCw, Save, SlidersHorizontal, Upload, Video, Wand2, X
} from 'lucide-react'
import './App.css'

const API = 'http://127.0.0.1:8000/api'
const DAY_TITLES: Record<number, string> = {
  1: 'Quiet spending habits', 2: 'Lifestyle creep', 3: 'Girl math',
  4: 'Emotional spending', 5: 'Subscription creep',
  6: 'Scarcity mindset', 7: 'Week recap'
}

type DayStatus = { day: number; prepared: boolean; clips: string; footage_seconds: number; voice_seconds: number; ready: boolean; rendered: boolean }
type ScenePrompt = { scene: number; prompt: string; voice_text?: string; start_seconds?: number; end_seconds?: number; title_card?: { kicker: string; lines: string[] } | null; attached: boolean; size_bytes: number; target_seconds: number; actual_seconds: number }
type RenderSettings = { voice_volume: number; music_volume: number; subtitle_font_size: number; subtitle_margin_bottom: number; subtitle_color: 'white' | 'yellow'; subtitle_style: 'outline' | 'box' }
type TimelineCue = { start: number; end: number; text: string }
type TimelineScene = { scene: number; start: number; end: number; duration: number; attached: boolean }
type MediaType = 'image' | 'video'
type ImageProvider = 'gemini' | 'openai'
type ProviderStatus = Record<ImageProvider, { configured: boolean; model: string }>
type DayContent = { day: number; script: string; caption: string; engagement_prompt: string }

function App() {
  const [days, setDays] = useState<number[]>([1])
  const [status, setStatus] = useState<DayStatus[]>([])
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')
  const [prompts, setPrompts] = useState<ScenePrompt[]>([])
  const [promptDay, setPromptDay] = useState<number | null>(null)
  const [copiedScene, setCopiedScene] = useState<number | null>(null)
  const [copiedAllPrompts, setCopiedAllPrompts] = useState(false)
  const [dayContent, setDayContent] = useState<DayContent | null>(null)
  const [copiedDayContent, setCopiedDayContent] = useState(false)
  const [uploadingScene, setUploadingScene] = useState<number | null>(null)
  const [uploadingAll, setUploadingAll] = useState(false)
  const [fittingScene, setFittingScene] = useState<number | null>(null)
  const [referencePrompt, setReferencePrompt] = useState('')
  const [referenceCopied, setReferenceCopied] = useState(false)
  const [referenceAttached, setReferenceAttached] = useState(false)
  const [uploadingReference, setUploadingReference] = useState(false)
  const [referenceExpanded, setReferenceExpanded] = useState(false)
  const [expandedImageScene, setExpandedImageScene] = useState<number | null>(null)
  const [mediaVersion, setMediaVersion] = useState(Date.now())
  const [previewScene, setPreviewScene] = useState<number | null>(null)
  const [previewFinalDay, setPreviewFinalDay] = useState<number | null>(null)
  const [renderSettings, setRenderSettings] = useState<RenderSettings>({ voice_volume: 1, music_volume: .15, subtitle_font_size: 20, subtitle_margin_bottom: 55, subtitle_color: 'white', subtitle_style: 'outline' })
  const [timelineOpen, setTimelineOpen] = useState(false)
  const [timelineCues, setTimelineCues] = useState<TimelineCue[]>([])
  const [voiceDuration, setVoiceDuration] = useState(0)
  const [voiceTime, setVoiceTime] = useState(0)
  const [timelineScenes, setTimelineScenes] = useState<TimelineScene[]>([])
  const [savingTimeline, setSavingTimeline] = useState(false)
  const [uploadingVoice, setUploadingVoice] = useState(false)
  const [mediaType, setMediaType] = useState<MediaType>('video')
  const [imageProvider, setImageProvider] = useState<ImageProvider>('gemini')
  const [imageQuality, setImageQuality] = useState<'draft' | 'standard' | 'high'>('standard')
  const [providers, setProviders] = useState<ProviderStatus | null>(null)
  const [apiKeys, setApiKeys] = useState<Record<ImageProvider, string>>({ gemini: '', openai: '' })
  const [savingKey, setSavingKey] = useState(false)
  const [generatingScene, setGeneratingScene] = useState<number | null>(null)
  const [generatingAll, setGeneratingAll] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const timelineVideoRef = useRef<HTMLVideoElement>(null)
  const readyToRender = days.length > 0 && days.every(day => status.find(value => value.day === day)?.ready)
  const combinedPrompts = prompts
    .map(item => `${item.scene}.  ${item.prompt}`)
    .join('\n\n')

  const refresh = async () => {
    try {
      const response = await axios.get(`${API}/status`)
      setStatus(response.data.days)
    } catch {
      setMessage('Cannot connect to backend. Run: venv/bin/python pauseflow_server.py')
    }
  }

  useEffect(() => {
    refresh()
    axios.get(`${API}/reference-sheet-prompt`)
      .then(response => setReferencePrompt(response.data.prompt))
      .catch(() => setMessage('Could not load the Character & Props prompt.'))
    axios.get(`${API}/reference-sheet`)
      .then(response => setReferenceAttached(response.data.attached))
      .catch(() => setReferenceAttached(false))
    axios.get(`${API}/image-providers`)
      .then(response => setProviders(response.data.providers))
      .catch(() => setProviders(null))
  }, [])

  const selectDay = (day: number) => { setDays([day]); setTimelineOpen(false) }

  const call = async (action: 'prepare' | 'render') => {
    if (!days.length) return
    setBusy(action); setMessage('')
    try {
      await axios.post(`${API}/${action}`, { days, regenerate_audio: false, media_type: mediaType, ...(action === 'render' ? { render_settings: renderSettings } : {}) })
      setMessage(action === 'prepare'
        ? 'Production package is ready. Copy each prompt, generate the clip, then attach it to its scene.'
        : 'Render complete. Preview the final video below.')
      await refresh()
      if (action === 'render') {
        setMediaVersion(Date.now())
        if (days.length === 1) setPreviewFinalDay(days[0])
      }
      if (action === 'prepare' && days.length === 1) await loadPrompts(days[0])
    } catch (error: any) {
      setMessage(error.response?.data?.detail || error.message)
    } finally { setBusy('') }
  }

  const loadPrompts = useCallback(async (day: number, scrollToWorkspace = true) => {
    try {
      const [response, contentResponse] = await Promise.all([
        axios.get(`${API}/prompts/${day}`, { params: { media_type: mediaType } }),
        axios.get(`${API}/day-content/${day}`),
      ])
      setPrompts(response.data.prompts.map((item: ScenePrompt) => ({
        ...item,
        prompt: item.prompt.replace(/\s+/g, ' ').trim(),
      }))); setDayContent(contentResponse.data); setPromptDay(day); setPreviewScene(null)
      if (scrollToWorkspace) document.getElementById('workspace')?.scrollIntoView({ behavior: 'smooth' })
    } catch (error: any) { setMessage(error.response?.data?.detail || error.message) }
  }, [mediaType])

  const copyPrompt = async (item: ScenePrompt) => {
    await navigator.clipboard.writeText(item.prompt); setCopiedScene(item.scene)
    window.setTimeout(() => setCopiedScene(null), 1500)
  }

  const copyAllPrompts = async () => {
    if (!combinedPrompts) return
    await navigator.clipboard.writeText(combinedPrompts); setCopiedAllPrompts(true)
    window.setTimeout(() => setCopiedAllPrompts(false), 1500)
  }

  const copyDayContent = async () => {
    if (!dayContent?.script) return
    await navigator.clipboard.writeText(dayContent.script); setCopiedDayContent(true)
    window.setTimeout(() => setCopiedDayContent(false), 1500)
  }

  const copyReferencePrompt = async () => {
    await navigator.clipboard.writeText(referencePrompt); setReferenceCopied(true)
    window.setTimeout(() => setReferenceCopied(false), 1500)
  }

  const attachReference = async (file?: File) => {
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return setMessage('Please select a PNG, JPG, or WebP image.')
    setUploadingReference(true); setMessage('')
    try {
      await axios.put(`${API}/reference-sheet`, file, { headers: { 'Content-Type': file.type } })
      setReferenceAttached(true); setMediaVersion(Date.now())
      setMessage(`${file.name} saved as the master Character & Props reference.`)
    } catch (error: any) { setMessage(error.response?.data?.detail || error.message) }
    finally { setUploadingReference(false) }
  }

  const attachMedia = async (item: ScenePrompt, file?: File) => {
    if (!file || promptDay === null) return
    const isImage = mediaType === 'image'
    if (!isImage && file.type !== 'video/mp4' && !file.name.toLowerCase().endsWith('.mp4')) return setMessage('Please select an MP4 video.')
    if (isImage && !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return setMessage('Please select a PNG, JPG, or WebP image.')
    setUploadingScene(item.scene); setMessage('')
    try {
      await axios.put(`${API}/clips/${promptDay}/${item.scene}?replace=${item.attached}&media_type=${isImage ? 'image' : 'video'}`, file, { headers: { 'Content-Type': file.type || 'video/mp4' } })
      await loadPrompts(promptDay, false); await refresh(); setMediaVersion(Date.now()); setPreviewScene(isImage ? null : item.scene)
      setMessage(`${file.name} attached to Scene ${item.scene}.`)
    } catch (error: any) { setMessage(error.response?.data?.detail || error.message) }
    finally { setUploadingScene(null) }
  }

  const attachAllMedia = async (fileList?: FileList | null) => {
    if (!fileList?.length || promptDay === null || !prompts.length) return
    const files = Array.from(fileList)
    const sceneByNumber = new Map(prompts.map(item => [item.scene, item]))
    const usedScenes = new Set<number>()
    const skipped: string[] = []
    const matched: { file: File; item: ScenePrompt; contentType: string }[] = []
    const imageTypes: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' }

    for (const file of files) {
      const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
      const contentType = mediaType === 'image' ? imageTypes[extension] : extension === 'mp4' ? 'video/mp4' : ''
      const basename = file.name.replace(/\.[^.]+$/, '')
      const numberMatch = basename.match(/\d+/)
      const scene = numberMatch ? Number(numberMatch[0]) : NaN
      const item = sceneByNumber.get(scene)
      if (!contentType || !item || usedScenes.has(scene)) {
        skipped.push(file.name)
        continue
      }
      usedScenes.add(scene)
      matched.push({ file, item, contentType })
    }

    matched.sort((left, right) => left.item.scene - right.item.scene)
    if (!matched.length) {
      setMessage('No filenames matched the current scenes. Attach all uses only the first number in each filename as its scene number, for example 1_202608202258 means Scene 1.')
      return
    }

    setUploadingAll(true); setMessage(`Attaching 0/${matched.length} files...`)
    let attached = 0
    const failed: string[] = []
    try {
      for (let index = 0; index < matched.length; index++) {
        const { file, item, contentType } = matched[index]
        setMessage(`Attaching ${index + 1}/${matched.length}: ${file.name} → Scene ${item.scene}...`)
        try {
          await axios.put(`${API}/clips/${promptDay}/${item.scene}?replace=${item.attached}&media_type=${mediaType}`, file, { headers: { 'Content-Type': contentType } })
          attached += 1
        } catch {
          failed.push(file.name)
        }
      }
      await loadPrompts(promptDay, false); await refresh(); setMediaVersion(Date.now()); setPreviewScene(null)
      const notes = [skipped.length ? `${skipped.length} skipped (name/type/duplicate)` : '', failed.length ? `${failed.length} failed` : ''].filter(Boolean).join(' · ')
      setMessage(`Attached ${attached}/${matched.length} matched files${notes ? ` · ${notes}` : ''}.`)
    } finally { setUploadingAll(false) }
  }

  const fitSceneDuration = async (item: ScenePrompt) => {
    if (promptDay === null) return
    setFittingScene(item.scene); setMessage(`Fitting Scene ${item.scene} to ${item.target_seconds}s; the original is kept safely...`)
    try {
      const { data } = await axios.post(`${API}/fit-duration/${promptDay}/${item.scene}`)
      setMessage(data.status === 'unchanged' ? data.message : `Scene ${item.scene}: ${data.mode === 'slow_down' ? 'slowed' : 'sped up'} ${data.adjustment_percent}% · ${data.before_seconds}s → ${data.after_seconds}s`)
      await loadPrompts(promptDay, false); await refresh(); setMediaVersion(Date.now())
    } catch (error: any) { setMessage(error.response?.data?.detail || error.message) }
    finally { setFittingScene(null) }
  }

  const generateImage = async (item: ScenePrompt, quiet = false) => {
    if (promptDay === null) return false
    setGeneratingScene(item.scene); if (!quiet) setMessage(`Generating Scene ${item.scene} with ${imageProvider === 'gemini' ? 'Gemini' : 'GPT Image'}...`)
    try {
      await axios.post(`${API}/generate-image/${promptDay}/${item.scene}`, { provider: imageProvider, quality: imageQuality })
      await loadPrompts(promptDay, false); await refresh(); setMediaVersion(Date.now()); setPreviewScene(null)
      if (!quiet) setMessage(`Scene ${item.scene} generated and converted into a timed clip.`)
      return true
    } catch (error: any) {
      setMessage(error.response?.data?.detail || error.message); return false
    } finally { setGeneratingScene(null) }
  }

  const generateAllImages = async () => {
    if (!prompts.length) return
    setGeneratingAll(true); setMessage(`Generating 0/${prompts.length} scenes...`)
    for (let index = 0; index < prompts.length; index++) {
      setMessage(`Generating ${index + 1}/${prompts.length}: Scene ${prompts[index].scene}...`)
      if (!await generateImage(prompts[index], true)) break
    }
    setGeneratingAll(false)
  }

  const saveProviderKey = async () => {
    const apiKey = apiKeys[imageProvider].trim()
    if (!apiKey) return setMessage('Enter an API key first.')
    setSavingKey(true); setMessage('Saving API key locally...')
    try {
      await axios.put(`${API}/image-provider-key`, { provider: imageProvider, api_key: apiKey })
      const { data } = await axios.get(`${API}/image-providers`)
      setProviders(data.providers); setApiKeys(current => ({...current, [imageProvider]: ''}))
      setMessage(`${imageProvider === 'gemini' ? 'Gemini' : 'OpenAI'} API key saved locally and ready.`)
    } catch (error: any) { setMessage(error.response?.data?.detail || error.message) }
    finally { setSavingKey(false) }
  }

  const showFolder = async (day: number) => {
    try {
      await axios.post(`${API}/show-folder/${day}`)
    } catch (error: any) { setMessage(error.response?.data?.detail || error.message) }
  }

  const openTimeline = async () => {
    const day = days[0]
    try {
      const { data } = await axios.get(`${API}/timeline/${day}`)
      setTimelineCues(data.cues); setTimelineScenes(data.scenes ?? []); setVoiceDuration(data.duration); setVoiceTime(0); setTimelineOpen(true)
    } catch (error: any) { setMessage(error.response?.data?.detail || error.message) }
  }

  const updateCue = (index: number, patch: Partial<TimelineCue>) => setTimelineCues(current => current.map((cue, cueIndex) => cueIndex === index ? {...cue, ...patch} : cue))
  const seekCue = (cue: TimelineCue) => { if (audioRef.current) { audioRef.current.currentTime = cue.start; audioRef.current.play() } }
  const mergeNextCue = (index: number) => setTimelineCues(current => index >= current.length - 1 ? current : current.flatMap((cue, cueIndex) => cueIndex === index ? [{...cue, end: current[index + 1].end, text: `${cue.text} ${current[index + 1].text}`}] : cueIndex === index + 1 ? [] : [cue]))

  const saveTimeline = async () => {
    setSavingTimeline(true); setMessage('')
    try {
      await axios.put(`${API}/timeline/${days[0]}`, { cues: timelineCues })
      setMessage(`Day ${days[0]} timeline saved. The previous SRT was backed up automatically.`)
    } catch (error: any) { setMessage(error.response?.data?.detail || error.message) }
    finally { setSavingTimeline(false) }
  }

  const replaceVoice = async (file?: File) => {
    if (!file) return
    if (file.type !== 'audio/mpeg' && !file.name.toLowerCase().endsWith('.mp3')) return setMessage('Please select an MP3 voice file.')
    setUploadingVoice(true); setMessage('')
    try {
      await axios.put(`${API}/voice/${days[0]}`, file, { headers: { 'Content-Type': 'audio/mpeg' } })
      setMediaVersion(Date.now()); await openTimeline(); setMessage(`${file.name} is now the voice for Day ${days[0]}. The previous voice was backed up.`)
    } catch (error: any) { setMessage(error.response?.data?.detail || error.message) }
    finally { setUploadingVoice(false) }
  }

  const activeTimelineScene = timelineScenes.find(scene => voiceTime >= scene.start && voiceTime < scene.end) ?? timelineScenes[timelineScenes.length - 1]
  const activeTimelineCue = timelineCues.find(cue => voiceTime >= cue.start && voiceTime < cue.end)

  useEffect(() => {
    const video = timelineVideoRef.current
    const audio = audioRef.current
    if (!video || !audio || !activeTimelineScene?.attached) return
    const localTime = Math.max(0, voiceTime - activeTimelineScene.start)
    if (Math.abs(video.currentTime - localTime) > .18) video.currentTime = localTime
    if (!audio.paused && video.paused) video.play().catch(() => undefined)
    if (audio.paused && !video.paused) video.pause()
  }, [voiceTime, activeTimelineScene?.scene, activeTimelineScene?.attached, activeTimelineScene?.start])

  const formatSize = (bytes: number) => bytes ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : ''
  const clipCounts = (item: DayStatus) => item.clips.split('/').map(Number)

  useEffect(() => {
    if (promptDay !== null) loadPrompts(promptDay, false)
  }, [mediaType, promptDay, loadPrompts])

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark"><Play size={13} fill="currentColor"/></span><span>DNDtools</span><span className="brand-divider"/><span className="project-name">Money Habits</span></div>
        <div className="top-status"><span className="online-dot"/> Core v4 online</div>
      </header>

      <main className="studio">
        <section className="hero-row">
          <div><span className="eyebrow">PRODUCTION STUDIO</span><h1>Money Habits</h1><p>Generate consistent scenes, attach footage, and render publish-ready vertical videos.</p></div>
          <button className="icon-button" onClick={refresh} title="Refresh status"><RefreshCw size={17}/></button>
        </section>

        {message && <div className="notice"><CheckCircle2 size={17}/><span>{message}</span></div>}

        <section className="panel reference-panel">
          <div className="step-index">01</div>
          <div className="panel-copy"><div className="panel-heading"><Image size={18}/><h2>Character & Props Reference</h2><span className="chip">Create once</span></div><p>Generate one master sheet, approve the character, then attach it as the reference for every scene.</p></div>
          <button className={`reference-preview ${referenceAttached ? 'has-image' : ''}`} disabled={!referenceAttached} onClick={() => setReferenceExpanded(true)} aria-label="Open reference image preview">{referenceAttached ? <><img key={mediaVersion} src={`${API}/reference-sheet/image?v=${mediaVersion}`} alt="Money Habits character and props reference"/><span className="preview-hint">Click to enlarge</span></> : <div className="reference-empty"><Image size={21}/><strong>No image</strong></div>}</button>
          <div className="reference-actions"><button className="button compact" disabled={!referencePrompt} onClick={copyReferencePrompt}>{referenceCopied ? <Check size={16}/> : <Copy size={16}/>} {referenceCopied ? 'Copied' : 'Copy master prompt'}</button><label className="button primary compact upload-button">{uploadingReference ? <Loader2 className="spinner" size={16}/> : <Upload size={16}/>} {referenceAttached ? 'Replace image' : 'Attach image'}<input type="file" accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp" disabled={uploadingReference} onChange={event => { attachReference(event.target.files?.[0]); event.currentTarget.value='' }}/></label></div>
          <details className="prompt-details"><summary>View prompt <ChevronDown size={15}/></summary><pre>{referencePrompt}</pre></details>
        </section>

        {referenceExpanded && referenceAttached && <div className="image-lightbox" role="dialog" aria-modal="true" aria-label="Character and props reference preview" onClick={() => setReferenceExpanded(false)}><button className="lightbox-close" onClick={() => setReferenceExpanded(false)} aria-label="Close preview">×</button><img src={`${API}/reference-sheet/image?v=${mediaVersion}`} alt="Money Habits character and props reference enlarged" onClick={event => event.stopPropagation()}/></div>}

        {expandedImageScene !== null && promptDay !== null && <div className="image-lightbox" role="dialog" aria-modal="true" aria-label={`Scene ${expandedImageScene} image preview`} onClick={() => setExpandedImageScene(null)}><button className="lightbox-close" onClick={() => setExpandedImageScene(null)} aria-label="Close scene image preview"><X size={18}/></button><img src={`${API}/generated-images/${promptDay}/${expandedImageScene}?v=${mediaVersion}`} alt={`Scene ${expandedImageScene} enlarged`} onClick={event => event.stopPropagation()}/></div>}

        <div className="dashboard-grid">
          <section className="panel setup-panel">
            <div className="panel-heading"><span className="step-index inline">02</span><h2>Select production day</h2></div>
            <div className="day-selector">
              {[1,2,3,4,5,6,7].map(day => {
                const item = status.find(value => value.day === day)
                const [found,total] = item ? clipCounts(item) : [0,0]
                const pct = total ? Math.min(100, found / total * 100) : 0
                return <div key={day} className={`day-choice ${days.includes(day) ? 'selected' : ''}`}>
                  <label className="day-select-control"><input type="radio" name="production-day" checked={days[0] === day} onChange={() => selectDay(day)}/><span className="day-number">{day}</span><span className="day-title"><strong>Day {day}</strong><small>{DAY_TITLES[day]}</small></span></label>
                  <div className="day-inline-status">
                    <div className="day-status-line"><span className={`state ${item?.ready ? 'ready' : item?.prepared ? 'working' : ''}`}>{item?.ready ? 'Ready' : item?.prepared ? 'In progress' : 'Not prepared'}</span>{item?.prepared && <span className="day-metrics">{item.clips} clips · {(item.footage_seconds ?? 0).toFixed(1)}s/{(item.voice_seconds ?? 0).toFixed(1)}s</span>}</div>
                    <div className="progress-track"><span style={{width:`${pct}%`}}/></div>
                  </div>
                  <div className="day-inline-actions">{item?.prepared && <button className="text-button" onClick={() => loadPrompts(day)}>Scenes</button>}{item?.rendered && <button className="text-button" onClick={() => setPreviewFinalDay(previewFinalDay === day ? null : day)}>{previewFinalDay === day ? 'Close' : 'Final'}</button>}{item?.rendered && <button className="text-button folder-button" onClick={() => showFolder(day)} title="Show final.mp4 in Finder"><FolderOpen size={13}/> Folder</button>}</div>
                  <Check className="day-check" size={15}/>
                  {previewFinalDay === day && item?.rendered && <div className="day-final-preview"><video key={`final-${day}-${mediaVersion}`} controls playsInline preload="metadata" src={`${API}/videos/${day}/final?v=${mediaVersion}`}/></div>}
                </div>
              })}
            </div>
            <div className="action-row"><button className="button primary" disabled={!!busy || !days.length} onClick={() => call('prepare')}>{busy === 'prepare' ? <Loader2 className="spinner" size={17}/> : <Wand2 size={17}/>} Prepare Day {days[0]}</button><button className="button" disabled={!!busy || !readyToRender} onClick={() => call('render')}>{busy === 'render' ? <Loader2 className="spinner" size={17}/> : <Play size={17}/>} Render Day {days[0]}</button></div>
            <div className="media-choice" aria-label="Scene media type"><span>Generate scenes as</span><div><button className={mediaType === 'image' ? 'selected' : ''} onClick={() => setMediaType('image')}><Image size={15}/> Images</button><button className={mediaType === 'video' ? 'selected' : ''} onClick={() => setMediaType('video')}><Video size={15}/> Videos</button></div>{mediaType === 'image' && <div className="generator-settings"><label><span>Provider</span><select value={imageProvider} onChange={event => setImageProvider(event.target.value as ImageProvider)}><option value="gemini">Gemini {providers?.gemini.configured ? '· Ready' : '· No key'}</option><option value="openai">GPT Image {providers?.openai.configured ? '· Ready' : '· No key'}</option></select></label><label><span>Quality</span><select value={imageQuality} onChange={event => setImageQuality(event.target.value as typeof imageQuality)}><option value="draft">Draft</option><option value="standard">Standard</option><option value="high">High</option></select></label>{!providers?.[imageProvider].configured && <div className="api-key-entry"><label><span>{imageProvider === 'gemini' ? 'Gemini' : 'OpenAI'} API key</span><input type="password" autoComplete="off" spellCheck={false} placeholder={imageProvider === 'gemini' ? 'Paste Gemini API key' : 'Paste OpenAI API key'} value={apiKeys[imageProvider]} onChange={event => setApiKeys(current => ({...current, [imageProvider]: event.target.value}))}/></label><button className="button" disabled={savingKey || !apiKeys[imageProvider].trim()} onClick={saveProviderKey}>{savingKey ? <Loader2 className="spinner" size={15}/> : <Save size={15}/>} Save key</button><p>Stored only in the local backend’s .env file. The saved key is never displayed again.</p></div>}<button className="button primary generate-all" disabled={generatingAll || generatingScene !== null || !providers?.[imageProvider].configured || !referenceAttached || prompts.length === 0} onClick={generateAllImages}>{generatingAll ? <Loader2 className="spinner" size={15}/> : <Wand2 size={15}/>} Generate all</button></div>}<small>{mediaType === 'image' ? providers?.[imageProvider].configured ? 'Reference sheet and scene prompt will be sent securely by the backend.' : 'Enter and save a provider key to enable direct generation.' : 'Upload a generated MP4 for each scene.'}</small></div>
            {!readyToRender && <p className="helper">Render unlocks when the selected day has enough attached footage.</p>}
            <details className="render-controls" open>
              <summary><SlidersHorizontal size={14}/> Voice & Subtitle Controls <ChevronDown size={14}/></summary>
              <div className="control-grid">
                <label className="range-control"><span><b>Voice</b><em>{Math.round(renderSettings.voice_volume * 100)}%</em></span><input type="range" min="50" max="200" step="5" value={renderSettings.voice_volume * 100} onChange={event => setRenderSettings(current => ({...current, voice_volume: Number(event.target.value) / 100}))}/></label>
                <label className="range-control"><span><b>Music</b><em>{Math.round(renderSettings.music_volume * 100)}%</em></span><input type="range" min="0" max="50" step="1" value={renderSettings.music_volume * 100} onChange={event => setRenderSettings(current => ({...current, music_volume: Number(event.target.value) / 100}))}/></label>
                <label className="range-control"><span><b>Subtitle size</b><em>{renderSettings.subtitle_font_size}</em></span><input type="range" min="12" max="40" step="1" value={renderSettings.subtitle_font_size} onChange={event => setRenderSettings(current => ({...current, subtitle_font_size: Number(event.target.value)}))}/></label>
                <label className="range-control"><span><b>Raise subtitle</b><em>{renderSettings.subtitle_margin_bottom}</em></span><input type="range" min="10" max="120" step="5" value={renderSettings.subtitle_margin_bottom} onChange={event => setRenderSettings(current => ({...current, subtitle_margin_bottom: Number(event.target.value)}))}/></label>
              </div>
              <div className="select-controls">
                <label><span>Text color</span><select value={renderSettings.subtitle_color} onChange={event => setRenderSettings(current => ({...current, subtitle_color: event.target.value as RenderSettings['subtitle_color']}))}><option value="white">White</option><option value="yellow">Warm yellow</option></select></label>
                <label><span>Caption style</span><select value={renderSettings.subtitle_style} onChange={event => setRenderSettings(current => ({...current, subtitle_style: event.target.value as RenderSettings['subtitle_style']}))}><option value="outline">Bold outline</option><option value="box">Dark box</option></select></label>
              </div>
              <div className={`subtitle-sample ${renderSettings.subtitle_style} ${renderSettings.subtitle_color}`} style={{fontSize: `${Math.max(12, renderSettings.subtitle_font_size / 3)}px`}}><Captions size={15}/> You're not bad with money.</div>
              <p className="helper">Applied only when rendering. Locked voice and subtitle timing stay unchanged.</p>
              <button className="button timeline-button" onClick={openTimeline}><AudioLines size={15}/> Edit voice & SRT timeline</button>
            </details>
          </section>

          <section className="panel workspace" id="workspace">
            {prompts.length > 0 ? <>
              <div className="workspace-header"><div><span className="eyebrow">SCENE WORKSPACE · {mediaType.toUpperCase()} PROMPTS</span><h2>Day {promptDay} · {promptDay && DAY_TITLES[promptDay]}</h2><p>Each prompt is aligned to the voice shown on its scene, then attached by scene number.</p></div><div className="workspace-header-actions"><label className={`button primary upload-button bulk-upload ${uploadingAll ? 'disabled' : ''}`}>{uploadingAll ? <Loader2 className="spinner" size={14}/> : <Upload size={14}/>} {uploadingAll ? 'Attaching...' : 'Attach all'}<input type="file" multiple accept={mediaType === 'image' ? 'image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp' : 'video/mp4,.mp4'} disabled={uploadingAll || uploadingScene !== null} onChange={event => { attachAllMedia(event.target.files); event.currentTarget.value='' }}/></label>{promptDay !== null && <a className="button csv-button" href={`${API}/prompts/${promptDay}/export.csv?media_type=${mediaType}`} download={`day${promptDay}_${mediaType}_prompts.csv`}><Download size={14}/> Export CSV</a>}<span className="scene-count">{prompts.filter(x=>x.attached).length}/{prompts.length} attached</span></div></div>
              {promptDay !== null && <div className="workspace-summary-grid"><section className="day-content" aria-label={`Day ${promptDay} content`}><div className="summary-box-header"><div><span className="eyebrow">DAY {promptDay} CONTENT</span><p>Voice-over · {Math.round(status.find(item => item.day === promptDay)?.voice_seconds ?? 0)}s</p></div><button className="button" disabled={!dayContent?.script} onClick={copyDayContent}>{copiedDayContent ? <Check size={16}/> : <Copy size={16}/>} {copiedDayContent ? 'Copied' : 'Copy content'}</button></div><pre>{dayContent?.script || `Loading Day ${promptDay} content...`}</pre></section><section className="combined-prompts" aria-label={`All Day ${promptDay} prompts`}><div className="summary-box-header"><div><span className="eyebrow">ALL DAY {promptDay} · {prompts.length} PROMPTS</span><p>Numbered in scene order.</p></div><button className="button" onClick={copyAllPrompts}>{copiedAllPrompts ? <Check size={16}/> : <Copy size={16}/>} {copiedAllPrompts ? 'Copied all' : 'Copy all'}</button></div><pre>{combinedPrompts}</pre></section></div>}
              <div className="scene-grid">{prompts.map(item => {
                const delta = (item.actual_seconds ?? 0) - (item.target_seconds ?? 0)
                const short = item.attached && delta < -0.12
                const long = item.attached && delta > 0.12
                return <article className={`scene-card ${item.attached ? 'has-video' : ''}`} key={item.scene}>
                  <div className="scene-top"><div><span className="scene-label">SCENE {String(item.scene).padStart(2,'0')}</span><div className="duration-line"><span className={`clip-state ${item.attached ? short || long ? 'short' : 'attached' : ''}`}>{item.attached ? short ? 'Short' : long ? 'Long' : 'Matched' : 'Waiting for clip'}</span><span>{item.attached ? `${formatSize(item.size_bytes)} · ${(item.actual_seconds ?? 0).toFixed(1)}s / ${item.target_seconds}s target` : `Target ${item.target_seconds}s`}</span></div></div><div className="scene-top-actions">{item.attached && (short || long) && <button className="preview-toggle fit-scene" disabled={fittingScene !== null} onClick={() => fitSceneDuration(item)}>{fittingScene === item.scene ? <Loader2 className="spinner" size={14}/> : <Gauge size={14}/>} Fit scene</button>}{item.attached && mediaType === 'video' && <button className="preview-toggle" onClick={() => setPreviewScene(previewScene === item.scene ? null : item.scene)}><Video size={16}/>{previewScene === item.scene ? 'Hide' : 'Preview'}</button>}</div></div>
                  {item.voice_text && <div className="scene-voice"><span>VOICE · {(item.start_seconds ?? 0).toFixed(1)}–{(item.end_seconds ?? 0).toFixed(1)}s</span><p>{item.voice_text}</p></div>}
                  <div className={`scene-content ${mediaType === 'image' ? 'image-scene-content' : ''}`}>
                    {mediaType === 'image' && (item.attached && promptDay !== null ? <button className="image-thumbnail attached" onClick={() => setExpandedImageScene(item.scene)} aria-label={`Enlarge Scene ${item.scene} image`}><img key={`image-${promptDay}-${item.scene}-${mediaVersion}`} src={`${API}/generated-images/${promptDay}/${item.scene}?v=${mediaVersion}`} alt={`Attached Scene ${item.scene}`}/><span>View full image</span></button> : <div className="image-thumbnail empty" aria-label={`No image attached for Scene ${item.scene}`}><Image size={22}/><span>No image yet</span></div>)}
                    <div className="scene-detail">
                      {item.attached && previewScene === item.scene && promptDay !== null && mediaType === 'video' && <div className="video-frame"><video key={`scene-${promptDay}-${item.scene}-${mediaVersion}`} controls playsInline preload="metadata" src={`${API}/videos/${promptDay}/scenes/${item.scene}?v=${mediaVersion}`}/></div>}
                      <div className="prompt-box"><pre>{item.prompt}</pre></div>
                      <div className="scene-actions"><button className="button" onClick={() => copyPrompt(item)}>{copiedScene === item.scene ? <Check size={16}/> : <Copy size={16}/>} {copiedScene === item.scene ? 'Copied' : `Copy ${mediaType} prompt`}</button>{mediaType === 'image' && <button className="button generate-button" disabled={generatingScene !== null || generatingAll || uploadingAll || !providers?.[imageProvider].configured || !referenceAttached} onClick={() => generateImage(item)}>{generatingScene === item.scene ? <Loader2 className="spinner" size={16}/> : <Wand2 size={16}/>} {item.attached ? 'Regenerate' : 'Generate'}</button>}<label className={`button primary upload-button ${uploadingAll ? 'disabled' : ''}`}>{uploadingScene === item.scene ? <Loader2 className="spinner" size={16}/> : <Upload size={16}/>} {item.attached ? `Replace ${mediaType}` : `Attach ${mediaType}`}<input type="file" accept={mediaType === 'image' ? 'image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp' : 'video/mp4,.mp4'} disabled={uploadingScene !== null || uploadingAll} onChange={event => { attachMedia(item,event.target.files?.[0]); event.currentTarget.value='' }}/></label></div>
                    </div>
                  </div>
                </article>
              })}</div>
            </> : <div className="workspace-empty"><Video size={28}/><strong>Scene Workspace</strong><span>Choose a prepared day and click Scenes to begin.</span></div>}
          </section>
        </div>
      </main>

      {timelineOpen && <div className="timeline-overlay" role="dialog" aria-modal="true" aria-label="Voice and subtitle timeline editor">
        <section className="timeline-editor">
          <header className="timeline-header"><div><span className="eyebrow">DAY {days[0]} · TIMING EDITOR</span><h2>Voice & SRT Timeline</h2><p>Listen, seek, edit cue timing or text, then save when ready.</p></div><button className="icon-button" onClick={() => setTimelineOpen(false)} aria-label="Close timeline"><X size={18}/></button></header>
          <div className="timeline-body">
          <aside className="timeline-main">
            <div className="timeline-monitor"><div className="monitor-canvas">{activeTimelineScene?.attached ? <video key={`${activeTimelineScene.scene}-${mediaVersion}`} ref={timelineVideoRef} muted playsInline preload="auto" src={`${API}/videos/${days[0]}/scenes/${activeTimelineScene.scene}?v=${mediaVersion}`}/> : <div className="monitor-empty"><Video size={28}/><span>No clip for this scene</span></div>}{activeTimelineCue && <div className={`monitor-subtitle ${renderSettings.subtitle_style} ${renderSettings.subtitle_color}`} style={{fontSize:`${renderSettings.subtitle_font_size}px`,bottom:`${Math.max(18,renderSettings.subtitle_margin_bottom)}px`}}>{activeTimelineCue.text}</div>}<span className="monitor-scene">SCENE {activeTimelineScene?.scene ?? '—'}</span></div></div>
            <div className="timeline-tools"><div className="audio-toolbar"><audio ref={audioRef} controls preload="metadata" src={`${API}/voice/${days[0]}?v=${mediaVersion}`} onPlay={() => timelineVideoRef.current?.play().catch(() => undefined)} onPause={() => timelineVideoRef.current?.pause()} onTimeUpdate={event => setVoiceTime(event.currentTarget.currentTime)}/><label className="button upload-button">{uploadingVoice ? <Loader2 className="spinner" size={15}/> : <Upload size={15}/>} Replace voice<input type="file" accept="audio/mpeg,.mp3" disabled={uploadingVoice} onChange={event => { replaceVoice(event.target.files?.[0]); event.currentTarget.value='' }}/></label><span>{voiceTime.toFixed(2)}s / {voiceDuration.toFixed(2)}s</span></div>
          <div className="visual-timeline" onClick={event => { if (!audioRef.current || !voiceDuration) return; const bounds = event.currentTarget.getBoundingClientRect(); audioRef.current.currentTime = Math.max(0, Math.min(voiceDuration, (event.clientX - bounds.left) / bounds.width * voiceDuration)); audioRef.current.play() }}>
            {timelineScenes.map(scene => <span key={`scene-${scene.scene}`} className="scene-band" style={{left:`${scene.start / voiceDuration * 100}%`,width:`${scene.duration / voiceDuration * 100}%`}}><i>S{scene.scene}</i></span>)}
            {timelineCues.map((cue,index) => <button key={index} className={`cue-block ${voiceTime >= cue.start && voiceTime < cue.end ? 'active' : ''}`} style={{left:`${cue.start / voiceDuration * 100}%`,width:`${Math.max(.25,(cue.end-cue.start) / voiceDuration * 100)}%`}} title={`${cue.start.toFixed(2)}–${cue.end.toFixed(2)} ${cue.text}`} onClick={event => { event.stopPropagation(); seekCue(cue) }}/>) }
            <span className="playhead" style={{left:`${voiceDuration ? voiceTime / voiceDuration * 100 : 0}%`}}/>
          </div>
            </div>
          </aside>
          <div className="cue-panel"><div className="cue-panel-title"><div><strong>Subtitle cues</strong><span>Click the cue number to preview that moment</span></div><span>{timelineCues.length} cues</span></div><div className="cue-table"><div className="cue-table-head"><span>#</span><span>Start</span><span>End</span><span>Subtitle text</span><span>Action</span></div>{timelineCues.map((cue,index) => <div className={`cue-row ${voiceTime >= cue.start && voiceTime < cue.end ? 'active' : ''}`} key={index}><button className="cue-index" onClick={() => seekCue(cue)}>{index + 1}</button><input aria-label={`Cue ${index + 1} start`} type="number" min="0" step="0.01" value={cue.start} onChange={event => updateCue(index,{start:Number(event.target.value)})}/><input aria-label={`Cue ${index + 1} end`} type="number" min="0" step="0.01" value={cue.end} onChange={event => updateCue(index,{end:Number(event.target.value)})}/><textarea aria-label={`Cue ${index + 1} subtitle text`} rows={2} value={cue.text} onChange={event => updateCue(index,{text:event.target.value})}/><button className="text-button merge-button" disabled={index === timelineCues.length - 1} onClick={() => mergeNextCue(index)}>Merge next</button></div>)}</div></div>
          </div>
          <footer className="timeline-footer"><span>{timelineCues.length} cues · Save creates an automatic backup</span><div><button className="button" onClick={() => setTimelineOpen(false)}>Cancel</button><button className="button primary" disabled={savingTimeline} onClick={saveTimeline}>{savingTimeline ? <Loader2 className="spinner" size={15}/> : <Save size={15}/>} Save SRT</button></div></footer>
        </section>
      </div>}
    </div>
  )
}

export default App
