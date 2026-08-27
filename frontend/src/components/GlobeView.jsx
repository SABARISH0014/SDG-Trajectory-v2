import React, { useState, useEffect, useRef, useMemo } from 'react';
import Globe from 'react-globe.gl';
import { useNavigate } from 'react-router-dom';
import { getCountryColor, getOceanColor } from '../data/sdgGlobeThemes';
import * as THREE from 'three';

/**
 * GlobeView — World Bank Atlas–style interactive globe.
 *
 * Props:
 *  - goalNumber:     SDG goal number (1–17) for theme, or null for default blue.
 *  - markers:        Array of point markers (optional).
 *  - highlightColor: Fallback hover color.
 *  - compact:        If true, hides tooltip & border.
 *  - size:           Fixed pixel size (width=height). Defaults to 500.
 *  - showRing:       If true, shows a thin white circular ring around the globe.
 *  - onCountryClick: Callback when a country polygon is clicked.
 */
export default function GlobeView({
  goalNumber = null,
  markers = [],
  highlightColor = '#3b82f6',
  compact = false,
  size = 900,
  showRing = true,
  onCountryClick,
}) {
  const globeRef = useRef();
  const containerRef = useRef();
  const navigate = useNavigate();
  const [countries, setCountries] = useState({ features: [] });
  const [hoverD, setHoverD] = useState(null);

  // Load GeoJSON data for country polygons
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(data => setCountries(data));
  }, []);

  // Ocean/sea color based on SDG goal
  const oceanColor = getOceanColor(goalNumber);

  // Create a custom globe material with the ocean color
  const globeMaterial = useMemo(() => {
    const material = new THREE.MeshPhongMaterial();
    material.color = new THREE.Color(oceanColor);
    material.shininess = 2;
    material.specular = new THREE.Color('#D8E8F0');
    return material;
  }, [oceanColor]);

  // Configure controls and camera altitude after globe mounts
  useEffect(() => {
    if (globeRef.current) {
      const controls = globeRef.current.controls();
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.5;
      controls.enableZoom = false;
      controls.minPolarAngle = Math.PI * 0.25;
      controls.maxPolarAngle = Math.PI * 0.75;
      
      // Set camera altitude so the globe sphere fills up to the container edges without empty gap
      globeRef.current.pointOfView({ altitude: 1.435 }, 0);
    }
  }, []);

  // Country polygon color — uses SDG goal theme with deterministic shading
  const getPolygonCapColor = (d) => {
    if (d === hoverD) {
      return highlightColor;
    }
    const name = d?.properties?.ADMIN || d?.properties?.NAME || 'Unknown';
    return getCountryColor(goalNumber, name);
  };

  const getPolygonSideColor = (d) => {
    const name = d?.properties?.ADMIN || d?.properties?.NAME || 'Unknown';
    const baseColor = getCountryColor(goalNumber, name);
    return baseColor + 'CC';
  };

  const getPolygonStrokeColor = () => '#FFFFFF40';

  const handlePolygonClick = (polygon) => {
    const name = polygon?.properties?.ADMIN || polygon?.properties?.NAME;
    if (onCountryClick) {
      onCountryClick(name, polygon);
    }
  };

  const getStatus = (countryName) => {
    const hash = countryName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    if (hash % 3 === 0) return { label: 'On Track', color: '#10b981' };
    if (hash % 3 === 1) return { label: 'At Risk', color: '#f59e0b' };
    return { label: 'Off Track', color: '#ef4444' };
  };

  const handlePointClick = (point) => {
    navigate(`/country/${point.id}`);
  };

  const containerClass = compact
    ? "relative flex items-center justify-center overflow-hidden cursor-crosshair"
    : "relative flex items-center justify-center rounded-xl overflow-hidden shadow-2xl border border-slate-200/30 cursor-crosshair";

  // White ring style — thin circular border around globe
  const ringStyle = showRing ? {
    borderRadius: '50%',
    boxShadow: '0 0 0 2px rgba(255,255,255,0.9), 0 0 16px rgba(255,255,255,0.2)',
  } : {};

  return (
    <div
      ref={containerRef}
      className={containerClass}
      style={{ width: size, height: size, maxWidth: '100%', ...ringStyle }}
    >
      <Globe
        ref={globeRef}
        backgroundColor="rgba(0,0,0,0)"

        globeImageUrl=""
        globeMaterial={globeMaterial}
        showGlobe={true}
        showAtmosphere={true}
        atmosphereColor={oceanColor}
        atmosphereAltitude={0.05}

        polygonsData={countries.features}
        polygonAltitude={d => d === hoverD ? 0.04 : 0.008}
        polygonCapColor={getPolygonCapColor}
        polygonSideColor={getPolygonSideColor}
        polygonStrokeColor={getPolygonStrokeColor}
        polygonLabel={d => {
          const name = d?.properties?.ADMIN || d?.properties?.NAME || '';
          const status = getStatus(name);
          return `
            <div style="padding: 8px 12px; background: rgba(255,255,255,0.95); backdrop-filter: blur(8px); border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.1); font-family: Inter, sans-serif;">
              <div style="font-weight: 600; font-size: 13px; color: #1B2A4A; margin-bottom: 4px;">${name}</div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <div style="width: 8px; height: 8px; border-radius: 50%; background: ${status.color};"></div>
                <span style="font-size: 11px; color: #64748b;">${status.label}</span>
              </div>
            </div>
          `;
        }}
        onPolygonHover={setHoverD}
        onPolygonClick={handlePolygonClick}

        pointsData={markers}
        pointLat={d => d.location[0]}
        pointLng={d => d.location[1]}
        pointColor={() => '#f43f5e'}
        pointAltitude={0.05}
        pointRadius={d => Math.max(0.1, Math.min(0.5, d.users / 1000))}
        onPointClick={handlePointClick}
        pointLabel={d => d.name}

        width={size}
        height={size}
      />
    </div>
  );
}
