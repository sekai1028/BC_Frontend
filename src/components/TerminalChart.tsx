import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../store/gameStore'

/** Linear interpolation */
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * Math.max(0, Math.min(1, t))
}

/** Multiplier intensity state: 1–6 positive bands, 7–8 negative. t = 0..1 within band; tToNext = lerp toward next state. */
function getMultiplierIntensityState(mult: number): {
  state: number
  t: number
  tToNext: number
  nextState: number
} {
  if (mult < 0) {
    const state = mult > -0.5 ? 7 : 8
    const t = state === 7 ? (0.5 + mult) : Math.min(1, (-mult - 0.5) / 1.5)
    return { state, t, tToNext: t, nextState: state }
  }
  let state = 1
  let t = 0
  let nextState = 1
  if (mult >= 100) {
    state = 6
    t = Math.min(1, (mult - 100) / 50)
    nextState = 6
  } else if (mult >= 45) {
    state = 5
    t = (mult - 45) / (99 - 45)
    nextState = 6
  } else if (mult >= 15) {
    state = 4
    t = (mult - 15) / (45 - 15)
    nextState = 5
  } else if (mult >= 5) {
    state = 3
    t = (mult - 5) / (15 - 5)
    nextState = 4
  } else if (mult >= 2) {
    state = 2
    t = (mult - 2) / (5 - 2)
    nextState = 3
  } else {
    state = 1
    t = (mult - 1) / (2 - 1)
    nextState = 2
  }
  return { state, t, tToNext: t, nextState }
}

/** Draw ghost trail segment behind the dot (last trailLen points with fade). */
function drawGhostTrail(
  ctx: CanvasRenderingContext2D,
  pts: Array<{ x: number; y: number }>,
  trailLen: number,
  opacity: number,
  flameGradient: boolean,
  gradientColor: string,
  _baselineY: number,
  flicker?: number,
  whiteToPurple?: boolean
) {
  if (pts.length < 2 || trailLen < 2) return
  const n = pts.length
  const start = Math.max(0, n - trailLen)
  const segment = pts.slice(start, n)
  if (segment.length < 2) return
  const opacityMult = typeof flicker === 'number' ? 0.6 + 0.4 * flicker : 1
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(segment[0].x, segment[0].y)
  for (let i = 1; i < segment.length; i++) {
    const p0 = segment[Math.max(0, i - 2)]
    const p1 = segment[i - 1]
    const p2 = segment[i]
    const p3 = segment[Math.min(segment.length - 1, i + 1)]
    const cp1x = p1.x + (p2.x - p0.x) / 3
    const cp1y = p1.y + (p2.y - p0.y) / 3
    const cp2x = p2.x - (p3.x - p1.x) / 3
    const cp2y = p2.y - (p3.y - p1.y) / 3
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y)
  }
  if (flameGradient) {
    const last = segment[segment.length - 1]
    const grad = ctx.createLinearGradient(segment[0].x, segment[0].y, last.x, last.y)
    if (whiteToPurple) {
      grad.addColorStop(0, `rgba(255,255,255,${0.15 * opacity * opacityMult})`)
      grad.addColorStop(0.4, `rgba(220,180,255,${0.5 * opacity * opacityMult})`)
      grad.addColorStop(1, `rgba(191,0,255,${0.7 * opacity * opacityMult})`)
    } else {
      grad.addColorStop(0, 'rgba(255,255,255,0)')
      grad.addColorStop(0.5, gradientColor + (0.4 * opacity * opacityMult) + ')')
      grad.addColorStop(1, `rgba(255,255,255,${0.6 * opacity * opacityMult})`)
    }
    ctx.strokeStyle = grad
  } else {
    ctx.strokeStyle = `rgba(255,255,255,${0.15 * opacity * opacityMult})`
  }
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.stroke()
  ctx.restore()
}

/** Draw pixel sparks around (cx, cy). Count and colors from state. */
function drawSparks(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  count: number,
  colors: string[],
  _radius: number,
  spread: number
) {
  const time = Date.now() / 200
  for (let i = 0; i < count; i++) {
    const angle = (i * 0.7 + time * 0.3) % (Math.PI * 2)
    const r = spread * (0.3 + 0.7 * ((i * 0.13 + time * 0.1) % 1))
    const x = cx + Math.cos(angle) * r
    const y = cy + Math.sin(angle) * r
    const color = colors[Math.floor((i + time * 2) % colors.length)]
    const size = 1.5 + ((i * 0.2 + time) % 1) * 1
    ctx.fillStyle = color
    ctx.fillRect(x - size / 2, y - size / 2, size, size)
  }
}

/** Per-state params for trail/glow/sparks; lerp between state and nextState with tToNext for smooth transitions. */
function getStateParams(state: number, nextState: number, _t: number, tToNext: number, _now: number) {
  const trailLens: Record<number, number> = { 1: 25, 2: 40, 3: 55, 4: 80, 5: 90, 6: 95, 7: 30, 8: 28 }
  const trailOpacs: Record<number, number> = { 1: 0.4, 2: 0.55, 3: 0.7, 4: 1, 5: 1, 6: 1, 7: 0.35, 8: 0.3 }
  const glowSizes: Record<number, number> = { 1: 8, 2: 11, 3: 16, 4: 22, 5: 26, 6: 24, 7: 6, 8: 12 }
  const sparkBases: Record<number, number> = { 1: 3, 2: 8, 3: 24, 4: 22, 5: 30, 6: 42, 7: 10, 8: 8 }
  const sparkSpreads: Record<number, number> = { 1: 20, 2: 26, 3: 34, 4: 38, 5: 42, 6: 52, 7: 28, 8: 24 }
  const shakePxs: Record<number, number> = { 1: 0, 2: 0, 3: 1, 4: 2, 5: 2, 6: 2, 7: 0, 8: 0 }
  const ns = nextState <= 8 ? nextState : state
  return {
    trailLen: Math.round(lerp(trailLens[state] ?? 25, trailLens[ns] ?? 25, tToNext)),
    trailOpacity: lerp(trailOpacs[state] ?? 0.4, trailOpacs[ns] ?? 0.4, tToNext),
    glowSize: lerp(glowSizes[state] ?? 8, glowSizes[ns] ?? 8, tToNext),
    sparkCount: Math.max(2, Math.round(lerp(sparkBases[state] ?? 3, sparkBases[ns] ?? 3, tToNext))),
    sparkSpread: lerp(sparkSpreads[state] ?? 24, sparkSpreads[ns] ?? 24, tToNext),
    shakePx: shakePxs[state] ?? 0,
  }
}

/** Draw a single intensity-state dot with lerp, trail, sparks, glitch. */
function drawIntensityDot(
  ctx: CanvasRenderingContext2D,
  lastX: number,
  lastY: number,
  multiplier: number,
  pts: Array<{ x: number; y: number }>,
  baselineY: number,
  isFoldedGhost: boolean,
  inRound: boolean,
  w: number,
  h: number,
  dotRadius: number
) {
  if (isFoldedGhost || !inRound) {
    ctx.fillStyle = isFoldedGhost ? 'rgba(220,220,220,0.98)' : 'rgba(255,255,255,0.98)'
    ctx.beginPath()
    ctx.arc(lastX, lastY, dotRadius, 0, Math.PI * 2)
    ctx.fill()
    return
  }

  const { state, t, tToNext, nextState } = getMultiplierIntensityState(multiplier)
  const now = Date.now() * 0.001
  const params = getStateParams(state, nextState, t, tToNext, now)

  const dx = params.shakePx * (Math.random() - 0.5) * 2
  const dy = params.shakePx * (Math.random() - 0.5) * 2
  const cx = lastX + dx
  const cy = lastY + dy

  const pulseAmp = state === 5 ? 0.15 : state === 6 ? 0.1 : 0
  const pulseFreq = state === 5 ? 12 : state === 6 ? 18 : 1
  const pulse = pulseAmp ? 1 + pulseAmp * Math.sin(now * pulseFreq) : 1
  const r = dotRadius * pulse

  const flameTrail = state >= 4
  const flicker = Math.sin(now * 8) * 0.5 + 0.5
  const whiteToPurple = state === 6

  const dotColors: Record<number, [string, string]> = {
    1: ['rgb(255,255,255)', 'rgb(255,255,255)'],
    2: ['rgb(220,255,200)', 'rgb(173,255,47)'],
    3: ['rgb(255,191,0)', 'rgb(255,140,0)'],
    4: ['rgb(255,140,0)', 'rgb(255,69,0)'],
    5: ['rgb(255,69,0)', 'rgb(255,50,50)'],
    6: ['rgb(191,0,255)', 'rgb(191,0,255)'],
    7: ['rgb(255,255,255)', 'rgb(255,255,255)'],
    8: ['rgb(100,0,0)', 'rgb(60,0,0)'],
  }
  const [c1, c2] = dotColors[state] ?? dotColors[1]
  const parseRgb = (s: string) => {
    const m = s.match(/rgb\((\d+),(\d+),(\d+)\)/)
    return m ? [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)] : [255, 255, 255]
  }
  const [r1, g1, b1] = parseRgb(c1)
  const [r2, g2, b2] = parseRgb(c2)
  const R = Math.round(lerp(r1, r2, t))
  const G = Math.round(lerp(g1, g2, t))
  const B = Math.round(lerp(b1, b2, t))
  const dotColor = `rgb(${R},${G},${B})`

  const glowOpacity =
    state <= 1 ? 0.35 :
    state === 2 ? lerp(0.28, 0.48, t) :
    state === 3 ? lerp(0.35, 0.55, t) :
    state === 4 ? 0.5 + 0.2 * t :
    state === 5 ? 0.65 :
    state === 6 ? 0.75 :
    state === 8 ? 0.35 + 0.35 * (Math.sin(now * 1.2) * 0.5 + 0.5) :
    0.25
  const glowColors: Record<number, string> = {
    1: 'rgba(255,255,255,0.35)',
    2: `rgba(173,255,47,${glowOpacity})`,
    3: `rgba(255,191,0,${glowOpacity})`,
    4: `rgba(255,140,0,${glowOpacity})`,
    5: `rgba(255,80,50,${glowOpacity})`,
    6: `rgba(191,0,255,${glowOpacity})`,
    7: 'rgba(255,255,255,0.2)',
    8: `rgba(80,0,0,${glowOpacity})`,
  }
  const glowSize = params.glowSize
  const glowColor = glowColors[state] ?? glowColors[1]

  const gradientColor =
    state === 4 ? 'rgba(255,140,0,' :
    state === 5 ? 'rgba(255,80,50,' :
    state === 6 ? 'rgba(191,0,255,' : 'rgba(255,255,255,'

  drawGhostTrail(
    ctx, pts, params.trailLen, params.trailOpacity,
    flameTrail, gradientColor, baselineY,
    state >= 4 ? flicker : undefined,
    whiteToPurple
  )

  const sparkColors: Record<number, string[]> = {
    1: ['rgba(255,255,255,0.5)'],
    2: ['rgba(255,255,255,0.85)'],
    3: ['rgba(255,255,255,0.9)'],
    4: ['rgba(255,255,255,0.9)', 'rgba(255,180,100,0.9)'],
    5: ['rgba(255,255,200,0.9)', 'rgba(255,80,50,0.9)'],
    6: ['rgba(255,0,255,0.95)', 'rgba(255,255,0,0.95)', 'rgba(0,255,255,0.9)', 'rgba(255,255,255,0.95)', 'rgba(0,255,128,0.9)'],
    7: ['rgba(255,60,60,0.85)'],
    8: ['rgba(60,0,0,0.95)'],
  }
  const sparkColorList = sparkColors[state] ?? sparkColors[1]
  drawSparks(ctx, cx, cy, params.sparkCount, sparkColorList, 1, params.sparkSpread)

  ctx.shadowBlur = glowSize
  ctx.shadowColor = glowColor
  ctx.fillStyle = dotColor
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0

  const glitchActive = (state === 4 || state === 5 || state === 6) && Math.random() < 0.045
  if (glitchActive && ctx.canvas) {
    const gx = (Math.random() - 0.5) * 10
    const stripH = Math.max(2, Math.floor(h * 0.025))
    for (let i = 0; i < 5; i++) {
      const y = Math.floor(Math.random() * (h - stripH))
      try {
        const img = ctx.getImageData(0, y, w, stripH)
        ctx.putImageData(img, Math.round(gx), y)
      } catch (_) {}
    }
  }
}

/** Draw a smooth cubic Bezier path through points (Catmull-Rom style) for a fluid ribbon look. */
function drawSmoothBezierPath(
  ctx: CanvasRenderingContext2D,
  pts: Array<{ x: number; y: number }>
) {
  if (pts.length === 0) return
  if (pts.length === 1) {
    ctx.moveTo(pts[0].x, pts[0].y)
    return
  }
  const tension = 0.38
  const n = pts.length
  ctx.moveTo(pts[0].x, pts[0].y)
  for (let i = 0; i < n - 1; i++) {
    const p0 = i > 0 ? pts[i - 1] : { x: pts[0].x - (pts[1].x - pts[0].x), y: pts[0].y - (pts[1].y - pts[0].y) }
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = i + 2 < n ? pts[i + 2] : { x: pts[n - 1].x + (pts[n - 1].x - pts[n - 2].x), y: pts[n - 1].y + (pts[n - 1].y - pts[n - 2].y) }
    const cp1x = p1.x + (p2.x - p0.x) / (6 * tension)
    const cp1y = p1.y + (p2.y - p0.y) / (6 * tension)
    const cp2x = p2.x - (p3.x - p1.x) / (6 * tension)
    const cp2y = p2.y - (p3.y - p1.y) / (6 * tension)
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y)
  }
}

type TerminalChartProps = {
  /** Called with the current value at the chart point (for display when idle or running) */
  onDisplayValue?: (value: number) => void
}

export default function TerminalChart({ onDisplayValue }: TerminalChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { currentMultiplier, isRunning, globalRoundActive, serverIdleActive, multiplierPath } = useGameStore()
  const roundDataActive = isRunning || globalRoundActive || serverIdleActive
  /** Rolling window: only show last 10 seconds. Server ticks every 100ms → 100 points = 10s */
  const WINDOW_POINTS_10S = 100
  const [path, setPath] = useState<Array<{ x: number; y: number; multiplier: number }>>([])
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 })
  const [gridPhase, setGridPhase] = useState(0) // 0..1, drives grid animation
  const ambientMultRef = useRef(1.0)
  /** Target for idle drift; updated at fixed interval so motion is smooth */
  const idleTargetRef = useRef(1.0)
  const pathRef = useRef(path)
  const canvasSizeRef = useRef(canvasSize)
  const gridPhaseRef = useRef(gridPhase)
  const lastPathTimeRef = useRef(0)
  /** When entering a round, prepend last idle mult so the line doesn't jump */
  const transitionStartRef = useRef<number | null>(null)
  pathRef.current = path
  canvasSizeRef.current = canvasSize
  gridPhaseRef.current = gridPhase
  const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number; multiplier: number } | null>(null)

  /** Constant speed for idle drift (multiplier units per second) */
  const IDLE_SPEED = 0.25
  /** How often to add a new point to the path (ms) */
  const IDLE_POINT_INTERVAL_MS = 80
  /** How often to nudge the idle target (ms) */
  const IDLE_TARGET_INTERVAL_MS = 280

  // Grid animation: phase cycles 0..1 so grid keeps changing within a range
  useEffect(() => {
    const interval = setInterval(() => {
      setGridPhase((p) => (p + 0.02) % 1)
    }, 50)
    return () => clearInterval(interval)
  }, [])

  // ResizeObserver: set canvas size when container has dimensions (fixes mobile 0x0)
  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      const w = Math.floor(width)
      const h = Math.floor(height)
      if (w <= 0 || h <= 0) return
      canvas.width = w
      canvas.height = h
      setCanvasSize({ w, h })
    })
    ro.observe(container)
    return () => ro.disconnect()
  }, [])

  // Redraw every frame from store so chart never freezes; reads latest multiplierPath each frame
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let rafId: number

    const draw = () => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      let w = canvasSizeRef.current.w
      let h = canvasSizeRef.current.h
      if (w <= 0 || h <= 0) {
        w = canvas.offsetWidth || 0
        h = canvas.offsetHeight || 0
        if (w <= 0 || h <= 0) return
        canvasSizeRef.current = { w, h }
      }
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }

      ctx.clearRect(0, 0, w, h)

      const phase = gridPhaseRef.current
      const rangeY = Math.min(h * 0.015, 8)
      const rangeX = Math.min(w * 0.012, 6)
      const t = phase * Math.PI * 2
      const offsetY = Math.sin(t) * rangeY
      const offsetX = Math.sin(t * 1.3 + 0.5) * rangeX

      ctx.strokeStyle = '#00FF4125'
      ctx.lineWidth = 1
      for (let i = 0; i <= 10; i++) {
        const y = (h / 10) * i + offsetY
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
        ctx.stroke()
      }
      for (let i = 0; i <= 12; i++) {
        const x = (w / 12) * i + offsetX
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, h)
        ctx.stroke()
      }

      const padX = Math.min(w * 0.05, 28)
      // Line/dot toward center: ~2in left of right edge so chart isn't cramped on the right
      const rightMargin = Math.min(w * 0.38, 320)
      const chartLeft = padX
      const chartWidth = Math.max(0, w - padX - rightMargin - padX)
      /** 1.0x baseline: fixed just below middle so above = green (profit), below = orange/red (loss). Chart zooms to fit path while keeping 1.0x visible. */
      const baselineY = h * 0.55
      const spaceAboveBaseline = baselineY
      const spaceBelowBaseline = h - baselineY

      const state = useGameStore.getState()
      const inRound = state.isRunning || state.globalRoundActive
      const serverIdle = state.serverIdleActive && !inRound
      const isFoldedGhost = state.gameState === 'folded' && state.ghostPath.length > 0
      let pathData: Array<{ multiplier: number }>
      if (isFoldedGhost) {
        pathData = [
          ...state.multiplierPath.map((m) => ({ multiplier: m })),
          ...state.ghostPath.map((m) => ({ multiplier: m })),
        ]
      } else if (inRound && state.multiplierPath.length > 0 && transitionStartRef.current != null) {
        pathData = [
          { multiplier: transitionStartRef.current },
          ...state.multiplierPath.map((m) => ({ multiplier: m })),
        ]
      } else if (inRound) {
        pathData = state.multiplierPath.map((m) => ({ multiplier: m }))
      } else if (serverIdle && state.multiplierPath.length > 0) {
        pathData = state.multiplierPath.map((m) => ({ multiplier: m }))
      } else {
        pathData = pathRef.current
      }

      pathData = pathData.slice(-WINDOW_POINTS_10S)

      const mult = isFoldedGhost ? state.ghostCurrentMult : state.currentMultiplier

      const minMult = pathData.length ? Math.min(1.0, ...pathData.map((p) => p.multiplier)) : 1.0
      const maxMult = pathData.length ? Math.max(1.0, ...pathData.map((p) => p.multiplier)) : 1.0
      const padding = Math.max(0.25, (maxMult - minMult) * 0.15)
      const viewMin = Math.min(1.0, minMult) - padding
      const viewMax = Math.max(1.0, maxMult) + padding
      const rangeAbove = Math.max(0.01, 1.0 - viewMin)
      const rangeBelow = Math.max(0.01, viewMax - 1.0)
      const scale = Math.min(spaceAboveBaseline / rangeAbove, spaceBelowBaseline / rangeBelow)
      const multToY = (m: number) => baselineY - (m - 1.0) * scale

      ctx.strokeStyle = '#00FF4160'
      ctx.lineWidth = 2
      ctx.setLineDash([6, 4])
      ctx.beginPath()
      ctx.moveTo(0, baselineY)
      ctx.lineTo(w, baselineY)
      ctx.stroke()
      ctx.setLineDash([])

      const toScreenX = (i: number, n: number) =>
        n > 1 ? chartLeft + (i / (n - 1)) * chartWidth : chartLeft + chartWidth / 2

      if (pathData.length > 1) {
        const n = pathData.length
        const smooth = (i: number) => {
          const get = (j: number) => pathData[Math.max(0, Math.min(n - 1, j))].multiplier
          const a = get(i - 2)
          const b = get(i - 1)
          const c = pathData[i].multiplier
          const d = get(i + 1)
          const e = get(i + 2)
          return (a + b * 2 + c * 3 + d * 2 + e) / 9
        }
        const pts: { x: number; y: number }[] = []
        for (let i = 0; i < n; i++) {
          pts.push({ x: toScreenX(i, n), y: multToY(smooth(i)) })
        }
        const last = pathData[pathData.length - 1]
        const lastY = pts[n - 1].y
        const lastX = pts[n - 1].x

        const lineColor = isFoldedGhost
          ? 'rgba(140,140,140,0.65)'
          : inRound
          ? (mult > 1.0 ? '#00FF41' : mult > 0 ? '#FF8C00' : '#FF0000')
          : 'rgba(140,140,140,0.9)'
        ctx.strokeStyle = lineColor
        ctx.lineWidth = isFoldedGhost ? 2.5 : 3
        ctx.lineJoin = 'round'
        ctx.lineCap = 'round'
        ctx.shadowColor = isFoldedGhost ? 'rgba(140,140,140,0.3)' : 'rgba(0,255,65,0.35)'
        ctx.shadowBlur = isFoldedGhost ? 4 : 6

        drawSmoothBezierPath(ctx, pts)

        ctx.stroke()
        ctx.shadowBlur = 0

        const gradient = ctx.createLinearGradient(0, 0, 0, h)
        if (isFoldedGhost) {
          gradient.addColorStop(0, 'rgba(140,140,140,0.12)')
          gradient.addColorStop(1, 'rgba(140,140,140,0.02)')
        } else if (inRound) {
          gradient.addColorStop(0, 'rgba(0,255,65,0.22)')
          gradient.addColorStop(1, 'rgba(0,255,65,0.02)')
        } else {
          gradient.addColorStop(0, 'rgba(140,140,140,0.15)')
          gradient.addColorStop(1, 'rgba(140,140,140,0.02)')
        }
        ctx.fillStyle = gradient
        ctx.beginPath()
        drawSmoothBezierPath(ctx, pts)
        ctx.lineTo(lastX, baselineY)
        ctx.lineTo(pts[0].x, baselineY)
        ctx.closePath()
        ctx.fill()

        const multiplier = last.multiplier ?? mult
        const dotRadius = 14
        drawIntensityDot(ctx, lastX, lastY, multiplier, pts, baselineY, isFoldedGhost, inRound, w, h, dotRadius)

        // GDD 2.7.4: Shadow Multiplier (FOMO) — flickering label at ghost tip
        if (isFoldedGhost) {
          const flicker = 0.7 + 0.3 * Math.sin(Date.now() / 200)
          ctx.font = '11px monospace'
          ctx.fillStyle = `rgba(180,180,180,${flicker})`
          ctx.textAlign = 'left'
          ctx.textBaseline = 'middle'
          const label = 'MONITORING RESIDUAL LEAK...'
          const tx = Math.min(lastX + 14, w - ctx.measureText(label).width - 4)
          ctx.fillText(label, tx, lastY)
        }
      }
    }

    const tick = () => {
      draw()
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [])

  /** Find path point at canvas x; y uses same 1.0x-fixed scale as draw */
  const getPointAtX = (
    pathData: Array<{ x: number; y: number; multiplier: number }>,
    canvasX: number,
    width: number,
    height: number
  ): { x: number; y: number; multiplier: number } | null => {
    if (pathData.length === 0 || width <= 0 || height <= 0) return null
    const padX = Math.min(width * 0.05, 28)
    const rightMargin = Math.min(width * 0.38, 320)
    const chartLeft = padX
    const chartWidth = Math.max(0, width - padX - rightMargin - padX)
    if (chartWidth <= 0) return null
    const n = pathData.length
    const t = Math.max(0, Math.min(1, (canvasX - chartLeft) / chartWidth))
    const idx = Math.round(t * (n - 1))
    const i = Math.max(0, Math.min(idx, n - 1))
    const screenX = n > 1 ? chartLeft + (i / (n - 1)) * chartWidth : chartLeft + chartWidth / 2
    const p = pathData[i]
    const baselineY = height * 0.55
    const spaceAboveBaseline = baselineY
    const spaceBelowBaseline = height - baselineY
    const mints = pathData.map((d) => d.multiplier)
    const minMult = Math.min(1.0, ...mints)
    const maxMult = Math.max(1.0, ...mints)
    const padding = Math.max(0.25, (maxMult - minMult) * 0.15)
    const viewMin = Math.min(1.0, minMult) - padding
    const viewMax = Math.max(1.0, maxMult) + padding
    const rangeAbove = Math.max(0.01, 1.0 - viewMin)
    const rangeBelow = Math.max(0.01, viewMax - 1.0)
    const scale = Math.min(spaceAboveBaseline / rangeAbove, spaceBelowBaseline / rangeBelow)
    const screenY = baselineY - (p.multiplier - 1.0) * scale
    return { x: screenX, y: screenY, multiplier: p.multiplier }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current
    if (!container || path.length === 0) return
    const rect = container.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    if (x < 0 || x > rect.width || y < 0 || y > rect.height) {
      setHoverPoint(null)
      return
    }
    const point = getPointAtX(path, x, rect.width, rect.height)
    setHoverPoint(point)
  }

  const handleMouseLeave = () => {
    setHoverPoint(null)
  }

  // When round is active, path comes from store; keep link to previous path (no new chart on Hold)
  useEffect(() => {
    if (!roundDataActive) return
    onDisplayValue?.(currentMultiplier)
    // Prepend last idle value so line stays continuous when Hold is pressed; keep for whole round
    if (pathRef.current.length > 0) {
      const last = pathRef.current[pathRef.current.length - 1]
      transitionStartRef.current = last.multiplier
    }
    if (multiplierPath.length > 0) {
      setPath(multiplierPath.map((mult) => ({ x: 0, y: 0, multiplier: mult })))
    } else {
      setPath([])
    }
  }, [roundDataActive, multiplierPath, currentMultiplier])

  // Idle path: keep chart linked — seed from last round/ghost path instead of clearing
  useEffect(() => {
    if (roundDataActive) return

    const state = useGameStore.getState()
    let lastMult = 1.0
    if (state.ghostPath.length > 0) {
      const combined = [
        ...state.multiplierPath.map((m) => ({ x: 0, y: 0, multiplier: m })),
        ...state.ghostPath.map((m) => ({ x: 0, y: 0, multiplier: m })),
      ]
      if (combined.length > 0) {
        lastMult = combined[combined.length - 1].multiplier
        setPath(combined.slice(-300))
      } else {
        setPath([])
      }
    } else if (state.multiplierPath.length > 0) {
      const pts = state.multiplierPath.map((m) => ({ x: 0, y: 0, multiplier: m }))
      lastMult = pts[pts.length - 1].multiplier
      setPath(pts.slice(-300))
    } else {
      setPath([])
    }
    ambientMultRef.current = lastMult
    idleTargetRef.current = lastMult
    lastPathTimeRef.current = 0

    const minM = 0.94
    const maxM = 1.06
    const targetStep = 0.012
    let lastTargetTime = 0
    let lastPathAddTime = 0
    let rafId: number

    const tick = (now: number) => {
      const dtSec = (now - lastPathTimeRef.current) / 1000
      lastPathTimeRef.current = now

      // Update target at fixed interval for predictable, smooth drift
      if (lastTargetTime === 0) lastTargetTime = now
      if (now - lastTargetTime >= IDLE_TARGET_INTERVAL_MS) {
        lastTargetTime = now
        idleTargetRef.current += (Math.random() - 0.5) * 2 * targetStep
        idleTargetRef.current = Math.max(minM, Math.min(maxM, idleTargetRef.current))
      }

      // Move toward target at constant speed (units per second)
      const target = idleTargetRef.current
      const cur = ambientMultRef.current
      const dist = target - cur
      const maxMove = IDLE_SPEED * Math.min(dtSec, 0.1)
      if (Math.abs(dist) <= maxMove) {
        ambientMultRef.current = target
      } else {
        ambientMultRef.current += Math.sign(dist) * maxMove
      }

      const mult = ambientMultRef.current
      onDisplayValue?.(mult)

      // Add path point at fixed interval so line extends at constant rate
      if (lastPathAddTime === 0) lastPathAddTime = now
      if (now - lastPathAddTime >= IDLE_POINT_INTERVAL_MS) {
        lastPathAddTime = now
        setPath((prev) => {
          const canvas = canvasRef.current
          if (!canvas || canvas.width <= 0 || canvas.height <= 0) return prev
          const baselineY = canvas.height / 2
          const multiplierOffset = (mult - 1.0) * 200
          const y = baselineY - multiplierOffset
          return [...prev, { x: 0, y, multiplier: mult }].slice(-300)
        })
      }

      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame((now) => {
      lastPathTimeRef.current = now
      tick(now)
    })
    return () => cancelAnimationFrame(rafId)
  }, [roundDataActive])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full cursor-crosshair"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ background: 'transparent' }}
      />
      {/* Crosshair + tooltip when hovering over stored path */}
      {hoverPoint && (
        <>
          <div
            className="absolute top-0 bottom-0 w-px pointer-events-none"
            style={{
              left: hoverPoint.x,
              background: 'rgba(0, 255, 65, 0.5)',
              boxShadow: '0 0 8px rgba(0, 255, 65, 0.4)',
            }}
          />
          <div
            className="absolute pointer-events-none font-terminal font-bold whitespace-nowrap px-2 py-1 rounded"
            style={{
              left: hoverPoint.x + 10,
              top: Math.max(hoverPoint.y - 28, 4),
              background: 'rgba(10, 20, 16, 0.95)',
              border: '1px solid rgba(0, 255, 65, 0.6)',
              color: '#b8ffc8',
              fontSize: '14px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            }}
          >
            {hoverPoint.multiplier.toFixed(3).replace('.', ',')}x
          </div>
        </>
      )}
    </div>
  )
}
