import React, { useState, useEffect, useRef } from 'react';
import Globe from 'react-globe.gl';
import { useNavigate } from 'react-router-dom';

export default function GlobeView({ markers = [] }) {
  const globeRef = useRef();
  const navigate = useNavigate();
  const [countries, setCountries] = useState({ features: [] });
  const [hoverD, setHoverD] = useState(null);

  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? (window.innerWidth < 768 ? window.innerWidth - 48 : window.innerWidth / 2 - 48) : 800,
    height: typeof window !== 'undefined' ? (window.innerWidth < 768 ? 400 : window.innerHeight - 200) : 600
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth < 768 ? window.innerWidth - 48 : window.innerWidth / 2 - 48,
        height: window.innerWidth < 768 ? 400 : window.innerHeight - 200
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Load lightweight GeoJSON data for country polygons (110m scale)
    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(data => setCountries(data));
  }, []);

  useEffect(() => {
    // Auto-rotate
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = true;
      globeRef.current.controls().autoRotateSpeed = 0.5;
    }
  }, []);

  // Mock function to determine SDG status
  const getStatus = (countryName) => {
    // Simple hash to consistently mock status
    const hash = countryName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    if (hash % 3 === 0) return { label: 'On Track', color: '#10b981' }; // Green
    if (hash % 3 === 1) return { label: 'At Risk', color: '#f59e0b' };  // Yellow
    return { label: 'Off Track', color: '#ef4444' };                    // Red
  };

  const handlePointClick = (point) => {
    navigate(`/country/${point.id}`);
  };

  return (
    <div className="relative w-full h-full min-h-[400px] flex items-center justify-center rounded-xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950 cursor-crosshair">
      <Globe
        ref={globeRef}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        
        // Polygons
        polygonsData={countries.features}
        polygonAltitude={d => d === hoverD ? 0.06 : 0.01}
        polygonCapColor={d => d === hoverD ? '#3b82f6' : '#1e293b'}
        polygonSideColor={() => '#0f172a'}
        polygonStrokeColor={() => '#334155'}
        polygonLabel={() => ''}
        onPolygonHover={setHoverD}
        
        // Markers
        pointsData={markers}
        pointLat={d => d.location[0]}
        pointLng={d => d.location[1]}
        pointColor={() => '#f43f5e'} // markerColor from previous new globe
        pointAltitude={0.05}
        pointRadius={d => Math.max(0.1, Math.min(0.5, d.users / 1000))} // Scale size based on users
        onPointClick={handlePointClick}
        pointLabel={d => d.name}

        width={dimensions.width}
        height={dimensions.height}
      />

      {/* Floating Tooltip */}
      {hoverD && (
        <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-xl border border-slate-200 pointer-events-none animate-in fade-in zoom-in duration-200">
          <h3 className="text-lg font-bold text-slate-800 mb-1">{hoverD.properties.ADMIN}</h3>
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full shadow-sm" 
              style={{ backgroundColor: getStatus(hoverD.properties.ADMIN).color }}
            />
            <span className="text-sm font-medium text-slate-600">
              {getStatus(hoverD.properties.ADMIN).label}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

