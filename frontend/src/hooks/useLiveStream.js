import { useEffect, useRef, useState } from 'react'
import { WS_BASE } from '../api'

const MAX_POINTS = 60

/** Opens the /live/stream WebSocket and keeps a rolling window of ticks. */
export function useLiveStream(region) {
  const [carbonIntensity, setCarbonIntensity] = useState(null)
  const [gpuNodes, setGpuNodes] = useState([])
  const [powerHistory, setPowerHistory] = useState([]) // [{t, power_w}]
  const [connected, setConnected] = useState(false)
  const wsRef = useRef(null)

  useEffect(() => {
    const ws = new WebSocket(`${WS_BASE}/live/stream?region=${region}`)
    wsRef.current = ws

    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)
    ws.onerror = () => setConnected(false)

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type !== 'tick') return

      setCarbonIntensity(data.carbon_intensity)
      setGpuNodes(data.gpu_nodes)

      const totalPower = data.gpu_nodes.reduce((sum, n) => sum + (n.power_w || 0), 0)
      setPowerHistory((prev) => {
        const next = [...prev, { t: Date.now(), power_w: totalPower }]
        return next.slice(-MAX_POINTS)
      })
    }

    return () => ws.close()
  }, [region])

  return { carbonIntensity, gpuNodes, powerHistory, connected }
}
