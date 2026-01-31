import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

export function useSocket() {
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    socketRef.current = io('http://localhost:5000', {
      transports: ['websocket'],
    })

    return () => {
      socketRef.current?.disconnect()
    }
  }, [])

  return socketRef.current
}
