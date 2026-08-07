import { useEffect, useRef, useCallback, useMemo } from "react"
import createGlobe from "cobe"
import { useNavigate } from "react-router-dom"

// Utility to convert hex to rgb array for Cobe
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255
  ] : [1, 1, 1];
};

export default function GlobeInteractive({
  markers = [],
  width = 800,
  height = 800,
  baseColor = "#1e293b",
  markerColor = "#f43f5e",
  glowColor = "#3b82f6",
}) {
  const canvasRef = useRef(null)
  const globeRef = useRef(null)
  const navigate = useNavigate()
  
  // Use refs instead of state to prevent re-renders and WebGL errors
  const pointerInteracting = useRef(null)
  const pointerInteractionMovement = useRef(0)
  
  // Use refs to store mutable values that don't need to trigger re-renders
  const phiRef = useRef(0)
  const widthRef = useRef(0)

  // Map markers to the format Cobe expects
  const globeMarkers = useMemo(() => markers.map(marker => ({
    location: marker.location,
    size: Math.max(0.05, Math.min(0.15, marker.users / 5000)) // Scale size based on users
  })), [markers]);

  const onResize = () => {
    if (canvasRef.current) {
      widthRef.current = canvasRef.current.offsetWidth
    }
  }

  useEffect(() => {
    window.addEventListener("resize", onResize)
    onResize()

    if (!canvasRef.current) return

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: widthRef.current * 2,
      height: widthRef.current * 2,
      phi: 0,
      theta: 0.3,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: hexToRgb(baseColor),
      markerColor: hexToRgb(markerColor),
      glowColor: hexToRgb(glowColor),
      markers: globeMarkers,
      onRender: (state) => {
        if (pointerInteracting.current === null) {
          phiRef.current += 0.005 // Auto rotation speed
        }
        state.phi = phiRef.current + pointerInteractionMovement.current
        state.width = widthRef.current * 2
        state.height = widthRef.current * 2
      },
    })

    globeRef.current = globe

    return () => {
      globe.destroy()
      window.removeEventListener("resize", onResize)
    }
  }, [baseColor, markerColor, glowColor, globeMarkers])

  // Simple click detection to navigate (Cobe doesn't have native click events per marker)
  // We navigate if click was swift without dragging
  const handlePointerDown = (e) => {
    pointerInteracting.current = e.clientX - pointerInteractionMovement.current
    if (canvasRef.current) {
      canvasRef.current.style.cursor = "grabbing"
    }
  }

  const handlePointerUp = (e) => {
    pointerInteracting.current = null
    if (canvasRef.current) {
      canvasRef.current.style.cursor = "grab"
    }
    
    // In a full implementation, we'd calculate raycasting to see which marker was clicked.
    // For this demo, we'll route to a random country or first in list just as a proof of concept
    if (markers.length > 0) {
       navigate(`/country/${markers[0].id}`);
    }
  }

  const handlePointerOut = () => {
    pointerInteracting.current = null
    if (canvasRef.current) {
       canvasRef.current.style.cursor = "grab"
    }
  }

  const handlePointerMove = (e) => {
    if (pointerInteracting.current !== null) {
      const delta = e.clientX - pointerInteracting.current
      pointerInteractionMovement.current = delta
    }
  }

  return (
    <div className="relative w-full aspect-square max-w-[800px] mx-auto flex items-center justify-center">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerOut={handlePointerOut}
        onPointerMove={handlePointerMove}
        style={{
          width: "100%",
          height: "100%",
          cursor: "grab",
          contain: "layout paint size",
          opacity: 1,
          transition: "opacity 1s ease",
        }}
      />
    </div>
  )
}
