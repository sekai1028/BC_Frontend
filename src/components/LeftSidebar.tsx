import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import alertIcon from '../public/asset/alert.svg'
import settingIcon from '../public/asset/setting.svg'
import chartIcon from '../public/asset/chart.svg'
import medalIcon from '../public/asset/medal.svg'
import roundIcon from '../public/asset/rounds.svg'
import streakIcon from '../public/asset/streak.svg'
import rateIcon from '../public/asset/percent.svg'
import miniChartIcon from '../public/asset/mini_chart.svg'
import mercyPotImage from '../public/asset/mercy_pot.png'

export default function LeftSidebar() {
  const { mercyPot, totalRounds, bestStreak, winRate, avgMultiplier } = useGameStore()

  const panelStyle = {
    background: '#151515',
    border: '1px solid #FFFFFF0D',
    borderRadius: '24px',
    boxShadow:
      '5px 5px 15px 0px #00000066, -2px -2px 5px 1px #00000080 inset, 2px 2px 5px 1px #FFFFFF0D inset',
  }

  const holophonePanelStyle = {
    width: 273,
    height: 431,
    background: '#151515',
    border: '1px solid #FFFFFF0D',
    borderRadius: 24,
    boxShadow:
      '5px 5px 15px 0px #00000066, -2px -2px 5px 1px #00000080 inset, 2px 2px 5px 1px #FFFFFF0D inset',
  }

  return (
    <aside
      className="flex-shrink-0 space-y-4 overflow-y-auto scrollbar-hide"
      style={{ width: 273, background: 'transparent' }}
    >
      {/* Holophone Section - Figma: 273×431px, top:160px, left:30px */}
      <div style={holophonePanelStyle} className="p-4">
        <h3 className="text-white text-sm font-bold mb-4 font-mono tracking-wide">HOLOPHONE</h3>
        <div className="grid grid-cols-4 gap-2">
          <button className="h-12 w-12 rounded-md border border-white/10 bg-[#1A1A1A] shadow-inner flex items-center justify-center hover:border-bunker-orange/50 transition">
            <img 
              src={alertIcon} 
              alt="Alert" 
              className="w-5 h-5"
            />
          </button>
          <button className="h-12 w-12 rounded-md border border-white/10 bg-[#1A1A1A] shadow-inner flex items-center justify-center hover:border-blue-400/50 transition">
            <img 
              src={settingIcon} 
              alt="Settings" 
              className="w-5 h-5"
            />
          </button>
          <button className="h-12 w-12 rounded-md border border-bunker-green/60 bg-[#0A1A0A] shadow-inner flex items-center justify-center ring-1 ring-bunker-green/40">
            <img 
              src={chartIcon} 
              alt="Chart" 
              className="w-5 h-5"
            />
          </button>
          <button className="h-12 w-12 rounded-md border border-white/10 bg-[#1A1A1A] shadow-inner flex items-center justify-center hover:border-purple-400/50 transition">
            <img 
              src={medalIcon} 
              alt="Medal" 
              className="w-5 h-5"
            />
          </button>
        </div>
        <div className="mt-4">
          <h4 className="text-[#8E7FFF] text-xs font-bold mb-3 font-mono tracking-wide">STATISTICS</h4>
          <div className="space-y-3 text-sm font-mono">
            <div className="flex items-center gap-2 text-gray-300">
              <img src={roundIcon} alt="Round" className="w-4 h-4" />
              <div className="flex flex-col leading-tight">
                <span className="text-xs text-gray-400">TOTAL ROUNDS</span>
                <span className="text-lg font-bold text-white">{totalRounds.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <img src={streakIcon} alt="Streak" className="w-4 h-4" />
              <div className="flex flex-col leading-tight">
                <span className="text-xs text-gray-400">BEST STREAK</span>
                <span className="text-lg font-bold text-bunker-amber">{bestStreak}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <img src={rateIcon} alt="Rate" className="w-4 h-4" />
              <div className="flex flex-col leading-tight">
                <span className="text-xs text-gray-400">WIN RATE</span>
                <span className="text-lg font-bold text-bunker-green">{winRate.toFixed(1)}%</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <img src={miniChartIcon} alt="Chart" className="w-4 h-4" />
              <div className="flex flex-col leading-tight">
                <span className="text-xs text-gray-400">AVG MULTIPLIER</span>
                <span className="text-lg font-bold text-bunker-green">{avgMultiplier.toFixed(2)}x</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advertisement Slot */}
      <div
        style={{
          ...panelStyle,
          width: '100%',
          height: '327px',
        }}
        className="overflow-hidden flex flex-col"
      >
        <div className="flex flex-col items-center justify-center px-4 py-10 gap-3">
          <div className="px-3 py-1 text-[10px] font-bold font-mono uppercase tracking-wide bg-bunker-green text-black rounded-sm">
            ADVERTISEMENT
          </div>
          <div className="text-white text-sm font-mono">250x300 Space</div>
        </div>
        <button
          className="w-full text-[10px] uppercase tracking-wide text-white font-mono py-3 bg-black/70 hover:bg-black/80 transition"
        >
          Ads Now
        </button>
      </div>

      {/* Mercy Pot Display */}
      <div style={{ ...panelStyle, width: '100%', height: '295px' }} className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-white text-sm font-bold font-mono tracking-wide">MERCY POT</h3>
          <span className="text-[10px] font-mono text-bunker-green px-3 py-1 rounded-full border border-bunker-green/60 bg-black/30">
            COLLECTING
          </span>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-[200px] h-[200px] relative overflow-hidden">
            <img
              src={mercyPotImage}
              alt="Mercy Pot"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        <div className="flex justify-center">
          <div className="px-4 py-1 rounded-md border border-bunker-green/60 bg-black/40">
            <span className="text-bunker-green text-sm font-mono">${mercyPot.toFixed(6)}</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
