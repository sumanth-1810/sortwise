import { useEffect, useRef, useState } from 'react'
import { BINS } from '../data/items'
import type { BinId } from '../types'
import { BinGlyph } from './BinGlyph'

interface ScanProps {
  onBack: () => void
}

type ScanStatus = 'starting' | 'ready' | 'reading' | 'done' | 'error'

interface ScanHit {
  bin: BinId
  label: string
  confidence: number
}

const CLASS_TO_BIN: Record<string, BinId> = {
  recycling: 'recycle',
  compost: 'compost',
  'e-waste': 'ewaste',
  trash: 'landfill',
}

const INPUT_SIZE = 224

type OrtModule = typeof import('onnxruntime-web/wasm')
type ScanSession = {
  ort: OrtModule
  session: Awaited<ReturnType<OrtModule['InferenceSession']['create']>>
  labels: string[]
}

let sessionPromise: Promise<ScanSession> | null = null

function loadSession(): Promise<ScanSession> {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      const ort = await import('onnxruntime-web/wasm')
      ort.env.wasm.numThreads = 1
      const base = `${import.meta.env.BASE_URL}model/`
      const [session, labels] = await Promise.all([
        ort.InferenceSession.create(`${base}scan.onnx`),
        fetch(`${base}labels.json`).then((response) => {
          if (!response.ok) throw new Error('labels')
          return response.json() as Promise<string[]>
        }),
      ])
      return { ort, session, labels }
    })().catch((error) => {
      sessionPromise = null
      throw error
    })
  }
  return sessionPromise
}

function frameToTensor(video: HTMLVideoElement, Tensor: OrtModule['Tensor']) {
  const canvas = document.createElement('canvas')
  canvas.width = INPUT_SIZE
  canvas.height = INPUT_SIZE
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Could not read the camera frame')
  ctx.drawImage(video, 0, 0, INPUT_SIZE, INPUT_SIZE)
  const pixels = ctx.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE).data
  const data = new Float32Array(INPUT_SIZE * INPUT_SIZE * 3)
  for (let i = 0, j = 0; i < pixels.length; i += 4) {
    data[j++] = pixels[i]
    data[j++] = pixels[i + 1]
    data[j++] = pixels[i + 2]
  }
  return new Tensor('float32', data, [1, INPUT_SIZE, INPUT_SIZE, 3])
}

export function Scan({ onBack }: ScanProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [status, setStatus] = useState<ScanStatus>('starting')
  const [message, setMessage] = useState('Starting camera…')
  const [hit, setHit] = useState<ScanHit | null>(null)

  useEffect(() => {
    let cancelled = false

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        setStatus('ready')
        setMessage('Point at one item, then tap Check item.')
      } catch {
        setStatus('error')
        setMessage('Camera permission is needed for Scan.')
      }
    }

    void start()

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  async function checkItem() {
    const video = videoRef.current
    if (!video || status === 'reading') return

    setStatus('reading')
    setHit(null)
    setMessage('Looking…')

    try {
      const { ort, session, labels } = await loadSession()
      const tensor = frameToTensor(video, ort.Tensor)
      const output = await session.run({ input: tensor })
      const scores = output.dense.data as Float32Array
      let bestIndex = 0
      for (let i = 1; i < scores.length; i += 1) {
        if (scores[i] > scores[bestIndex]) bestIndex = i
      }
      const className = labels[bestIndex] ?? ''
      const bin = CLASS_TO_BIN[className.toLowerCase()]
      if (!bin) {
        setStatus('ready')
        setMessage('Not sure. Try one item, closer, with more light.')
        return
      }

      setHit({
        bin,
        label: BINS[bin].kidLabel,
        confidence: scores[bestIndex],
      })
      setStatus('done')
      setMessage('')
    } catch {
      setStatus('ready')
      setMessage('Could not read that. Try again with one item, closer, and more light.')
    }
  }

  return (
    <div className="screen scan">
      <div className="play-actions">
        <button type="button" className="btn btn-tiny" onClick={onBack}>
          Back
        </button>
      </div>
      <header className="home-header">
        <p className="brand">SCAN</p>
        <h1 className="results-title">Where does this go?</h1>
        <p className="home-lede">
          One item, one answer. This is not a quiz and it does not change your
          level.
        </p>
      </header>

      <div className="scan-frame">
        <video ref={videoRef} playsInline muted className="scan-video" />
      </div>

      {hit && (
        <div className="scan-result">
          <BinGlyph bin={hit.bin} size={36} />
          <div>
            <strong>{hit.label}</strong>
            <p>{Math.round(hit.confidence * 100)}% sure</p>
          </div>
        </div>
      )}

      {message && <p className="home-note">{message}</p>}

      <div className="home-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => void checkItem()}
          disabled={status === 'starting' || status === 'reading' || status === 'error'}
        >
          {status === 'reading' ? 'Looking…' : 'Check item'}
        </button>
      </div>
    </div>
  )
}
