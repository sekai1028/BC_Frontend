import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

// Set VITE_API_URL in deployment env to your backend URL (e.g. https://your-backend.railway.app)
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export function useSocket(): Socket | null {
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    const s = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000
    })
    s.on('connect', () => setSocket(s))
    s.on('disconnect', () => setSocket(null))
    return () => {
      s.disconnect()
      setSocket(null)
    }
  }, [])

  return socket
}
