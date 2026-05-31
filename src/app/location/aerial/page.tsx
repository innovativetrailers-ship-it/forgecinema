'use client'

import { useEffect, useRef } from 'react'

interface CesiumConfig {
  token:       string
  destination: { lat: number; lng: number; height: number }
  label:       string
}

export default function AerialViewerPage() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const raw    = sessionStorage.getItem('cesium-config') ?? '{}'
    const config = JSON.parse(raw) as Partial<CesiumConfig>
    if (!config.token || !containerRef.current) return

    const link     = document.createElement('link')
    link.rel        = 'stylesheet'
    link.href       = 'https://cesium.com/downloads/cesiumjs/releases/1.113/Build/Cesium/Widgets/widgets.css'
    document.head.appendChild(link)

    const script    = document.createElement('script')
    script.src      = 'https://cesium.com/downloads/cesiumjs/releases/1.113/Build/Cesium/Cesium.js'
    script.onload   = () => {
      const Cesium = (window as Record<string, unknown>).Cesium as {
        Ion:          { defaultAccessToken: string }
        Viewer:       new (el: HTMLDivElement | null, opts: unknown) => { camera: { flyTo: (opts: unknown) => void } }
        createWorldTerrain: () => unknown
        Cartesian3:   { fromDegrees: (lng: number, lat: number, height: number) => unknown }
      }

      Cesium.Ion.defaultAccessToken = config.token!

      const viewer = new Cesium.Viewer(containerRef.current, {
        terrainProvider: Cesium.createWorldTerrain(),
        animation:       false,
        timeline:        false,
        baseLayerPicker: false,
      })

      const dest = config.destination
      if (dest) {
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(dest.lng, dest.lat, dest.height ?? 500),
          duration:    2,
        })
      }
    }
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
      document.head.removeChild(link)
    }
  }, [])

  return (
    <div className="w-screen h-screen bg-black">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}
