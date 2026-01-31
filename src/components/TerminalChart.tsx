import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '../store/gameStore'

export default function TerminalChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { currentMultiplier, isRunning } = useGameStore()
  const [path, setPath] = useState<Array<{ x: number; y: number; multiplier: number }>>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Clear canvas
    ctx.fillStyle = '#0b1712'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw grid - horizontal and vertical (classic terminal grid)
    ctx.strokeStyle = '#00FF4125'
    ctx.lineWidth = 1
    for (let i = 0; i <= 10; i++) {
      const y = (canvas.height / 10) * i
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }
    for (let i = 0; i <= 12; i++) {
      const x = (canvas.width / 12) * i
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }

    // Draw baseline (1.0x) - center of chart
    ctx.strokeStyle = '#00FF4160'
    ctx.lineWidth = 2
    const baselineY = canvas.height / 2
    ctx.beginPath()
    ctx.moveTo(0, baselineY)
    ctx.lineTo(canvas.width, baselineY)
    ctx.stroke()

    // Draw path
    if (path.length > 1) {
      ctx.strokeStyle = currentMultiplier > 1.0 ? '#00FF41' : 
                       currentMultiplier > 0 ? '#FF8C00' : '#FF0000'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(path[0].x, path[0].y)
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y)
      }
      ctx.stroke()

      // Draw dot with trail and glow effect
      if (path.length > 0) {
        const last = path[path.length - 1]
        const multiplier = last.multiplier || currentMultiplier
        
        // Glow effect for high multipliers
        if (multiplier > 5.0) {
          const glowIntensity = Math.min((multiplier - 5.0) / 15.0, 1.0)
          ctx.shadowBlur = 20 * glowIntensity
          ctx.shadowColor = multiplier > 10 ? '#FFD700' : '#00FF41'
        }
        
        // Trail effect
        for (let i = 0; i < 8; i++) {
          const alpha = 0.3 - (i * 0.04)
          const size = 12 - i
          ctx.fillStyle = `rgba(0, 255, 65, ${alpha})`
          ctx.beginPath()
          ctx.arc(last.x, last.y, size, 0, Math.PI * 2)
          ctx.fill()
        }
        
        // Main dot
        ctx.shadowBlur = 0
        ctx.fillStyle = multiplier > 10 ? '#FFD700' : 
                       multiplier > 5 ? '#FFFF00' : '#00FF41'
        ctx.beginPath()
        ctx.arc(last.x, last.y, 10, 0, Math.PI * 2)
        ctx.fill()
        
        // White center
        ctx.fillStyle = '#FFFFFF'
        ctx.beginPath()
        ctx.arc(last.x, last.y, 4, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }, [path, currentMultiplier])

  useEffect(() => {
    if (!isRunning) {
      setPath([])
      return
    }

    const interval = setInterval(() => {
      setPath((prev) => {
        const canvas = canvasRef.current
        if (!canvas) return prev

        const x = ((prev.length * 3) % canvas.width) || 0
        const baselineY = canvas.height / 2
        // Scale: 1.0x = center, each 0.1x = 20px offset
        const multiplierOffset = (currentMultiplier - 1.0) * 200
        const y = baselineY - multiplierOffset

        return [...prev, { x, y, multiplier: currentMultiplier }].slice(-300) // Keep last 300 points
      })
    }, 50)

    return () => clearInterval(interval)
  }, [isRunning, currentMultiplier])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ background: '#000000' }}
    />
  )
}
