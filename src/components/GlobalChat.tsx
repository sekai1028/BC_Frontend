import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '../store/authStore'

export default function GlobalChat() {
  const { user, isAuthenticated } = useAuthStore()
  const [messages, setMessages] = useState<any[]>([
    { username: 'Neo_99', text: 'Price floor holding?', time: '3m', rank: 12 },
    { username: 'CorpBot', text: 'Volatility spike detected.', time: '3m', isSystem: true },
    { username: 'TraderX', text: 'Selling at 12.5k, don\'t be greedy.', time: '5m', rank: 8 },
    { username: 'Ghost', text: 'Anyone else going for 100x', time: '10m', rank: 25 },
  ])
  const [input, setInput] = useState('')
  const [canSend, setCanSend] = useState(true)
  const [onlineCount, setOnlineCount] = useState(247)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const panelStyle = {
    background: '#151515',
    border: '1px solid #FFFFFF0D',
    borderRadius: '24px',
    boxShadow:
      '5px 5px 15px 0px #00000066, -2px -2px 5px 1px #00000080 inset, 2px 2px 5px 1px #FFFFFF0D inset',
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = () => {
    if (!input.trim() || !canSend || !isAuthenticated) return
    
    // TODO: Send via socket
    setMessages([...messages, {
      username: user?.username || 'You',
      text: input,
      time: 'now',
      rank: user?.rank || 0
    }])
    setInput('')
    setCanSend(false)
    setTimeout(() => setCanSend(true), 2000) // 2s cooldown
  }

  return (
    <aside className="flex-shrink-0 flex flex-col gap-4" style={{ width: 273 }}>
      <div
        style={{ ...panelStyle, height: '745px' }}
        className="p-4 flex flex-col"
      >
        <div className="flex justify-between mb-2">
          <h2 className="text-white font-bold text-xs font-mono tracking-wide">GLOBAL CHAT</h2>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono mb-3">
          <div className="w-2 h-2 bg-bunker-green rounded-full" />
          <span className="text-bunker-green">{onlineCount} ONLINE</span>
          <div className="w-2 h-2 bg-bunker-red rounded-full" />
          <span className="text-gray-400">LIVE</span>
        </div>

        <div
          className="flex-1 overflow-y-auto scrollbar-hide space-y-4 p-3"
          style={{
            background: '#101312',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          {messages.map((msg, idx) => (
            <div key={idx} className="text-xs font-mono text-gray-300">
              <div className="flex items-center justify-between">
                <span className="text-white font-bold">{msg.username}</span>
                <span className="text-[10px] text-gray-500">
                  {msg.time === 'now' ? 'now' : msg.time ? `${msg.time} ago` : ''}
                </span>
              </div>
              <div className="text-gray-400 mt-1">{msg.text}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="mt-3">
          {!isAuthenticated ? (
            <div className="text-gray-500 text-[10px] text-center py-2 font-mono uppercase tracking-wide">
              REGISTER AND REACH RANK 1 TO BROADCAST
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="TYPE MESSAGE..."
                className="flex-1 bg-[#0e1411] border border-white/10 px-3 py-2 text-xs font-mono focus:outline-none focus:border-bunker-green"
                style={{ borderRadius: '10px' }}
                disabled={!canSend}
              />
              <button
                onClick={handleSend}
                disabled={!canSend}
                className="w-9 h-9 flex items-center justify-center bg-bunker-green text-black disabled:opacity-50 font-mono"
                style={{ borderRadius: '10px' }}
              >
                ➤
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Advertisement Slot */}
      <div style={{ ...panelStyle, height: '280px' }} className="overflow-hidden">
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
    </aside>
  )
}
