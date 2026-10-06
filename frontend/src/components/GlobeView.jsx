import React, { useState, useEffect, useRef, useMemo } from 'react';
import Globe from 'react-globe.gl';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ChevronDown } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { getCountryColor, getOceanColor } from '../data/sdgGlobeThemes';
import { sdgColors } from '../data/sdgColors';
import { sdgGoalsContent } from '../data/sdgGoalsContent';
import { getTargetDetails } from '../data/sdgTargetsData';
import { COUNTRIES, TARGETS } from '../lib/constants';
import * as THREE from 'three';

const GOAL_STATUS_CLIENT_CACHE = new Map();

// Short friendly names for all 17 SDG Goals
const SDG_SHORT_NAMES = {
  1: "No Poverty",
  2: "Zero Hunger",
  3: "Health",
  4: "Education",
  5: "Gender Equality",
  6: "Clean Water",
  7: "Clean Energy",
  8: "Decent Work",
  9: "Industry & Innovation",
  10: "Reduced Inequalities",
  11: "Sustainable Cities",
  12: "Responsible Consumption",
  13: "Climate Action",
  14: "Life Below Water",
  15: "Life on Land",
  16: "Peace & Justice",
  17: "Partnerships"
};

// ISO-3 Alpha-3 to ISO-2 Alpha-2 mapping for unicode flag resolution
const ISO3_TO_ISO2 = {
  AFG: 'AF', ALB: 'AL', DZA: 'DZ', AND: 'AD', AGO: 'AO', ARG: 'AR', ARM: 'AM', AUS: 'AU', AUT: 'AT', AZE: 'AZ',
  BHS: 'BS', BHR: 'BH', BGD: 'BD', BRB: 'BB', BLR: 'BY', BEL: 'BE', BLZ: 'BZ', BEN: 'BJ', BTN: 'BT', BOL: 'BO',
  BIH: 'BA', BWA: 'BW', BRA: 'BR', BRN: 'BN', BGR: 'BG', BFA: 'BF', BDI: 'BI', KHM: 'KH', CMR: 'CM', CAN: 'CA',
  CPV: 'CV', CAF: 'CF', TCD: 'TD', CHL: 'CL', CHN: 'CN', COL: 'CO', COM: 'KM', COG: 'CG', COD: 'CD', CRI: 'CR',
  CIV: 'CI', HRV: 'HR', CUB: 'CU', CYP: 'CY', CZE: 'CZ', DNK: 'DK', DJI: 'DJ', DMA: 'DM', DOM: 'DO', ECU: 'EC',
  EGY: 'EG', SLV: 'SV', GNQ: 'GQ', ERI: 'ER', EST: 'EE', ETH: 'ET', FJI: 'FJ', FIN: 'FI', FRA: 'FR', GAB: 'GA',
  GMB: 'GM', GEO: 'GE', DEU: 'DE', GHA: 'GH', GRC: 'GR', GRD: 'GD', GTM: 'GT', GIN: 'GN', GNB: 'GW', GUY: 'GY',
  HTI: 'HT', HND: 'HN', HUN: 'HU', ISL: 'IS', IND: 'IN', IDN: 'ID', IRN: 'IR', IRQ: 'IQ', IRL: 'IE', ISR: 'IL',
  ITA: 'IT', JAM: 'JM', JPN: 'JP', JOR: 'JO', KAZ: 'KZ', KEN: 'KE', KIR: 'KI', PRK: 'KP', KOR: 'KR', KWT: 'KW',
  KGZ: 'KG', LAO: 'LA', LVA: 'LV', LBN: 'LB', LSO: 'LS', LBR: 'LR', LBY: 'LY', LIE: 'LI', LTU: 'LT', LUX: 'LU',
  MDG: 'MG', MWI: 'MW', MYS: 'MY', MDV: 'MV', MLI: 'ML', MLT: 'MT', MHL: 'MH', MRT: 'MR', MUS: 'MU', MEX: 'MX',
  FSM: 'FM', MDA: 'MD', MCO: 'MC', MNG: 'MN', MNE: 'ME', MAR: 'MA', MOZ: 'MZ', MMR: 'MM', NAM: 'NA', NRU: 'NR',
  NPL: 'NP', NLD: 'NL', NZL: 'NZ', NIC: 'NI', NER: 'NE', NGA: 'NG', MKD: 'MK', NOR: 'NO', OMN: 'OM', PAK: 'PK',
  PLW: 'PW', PAN: 'PA', PNG: 'PG', PRY: 'PY', PER: 'PE', PHL: 'PH', POL: 'PL', PRT: 'PT', QAT: 'QA', ROU: 'RO',
  RUS: 'RU', RWA: 'RW', KNA: 'KN', LCA: 'LC', VCT: 'VC', WSM: 'WS', SMR: 'SM', STP: 'ST', SAU: 'SA', SEN: 'SN',
  SRB: 'RS', SYC: 'SC', SLE: 'SL', SGP: 'SG', SVK: 'SK', SVN: 'SI', SLB: 'SB', SOM: 'SO', ZAF: 'ZA', SSD: 'SS',
  ESP: 'ES', LKA: 'LK', SDN: 'SD', SUR: 'SR', SWZ: 'SZ', SWE: 'SE', CHE: 'CH', SYR: 'SY', TWN: 'TW', TJK: 'TJ',
  TZA: 'TZ', THA: 'TH', TLS: 'TL', TGO: 'TG', TON: 'TO', TTO: 'TT', TUN: 'TN', TUR: 'TR', TKM: 'TM', TUV: 'TV',
  UGA: 'UG', UKR: 'UA', ARE: 'AE', GBR: 'GB', USA: 'US', URY: 'UY', UZB: 'UZ', VUT: 'VU', VEN: 'VE', VNM: 'VN',
  YEM: 'YE', ZMB: 'ZM', ZWE: 'ZW'
};

function getCountryFlag(iso3) {
  if (!iso3) return '🌐';
  const iso2 = ISO3_TO_ISO2[iso3.toUpperCase()];
  if (iso2 && iso2.length === 2) {
    const codePoints = [...iso2.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65);
    return String.fromCodePoint(...codePoints);
  }
  return '🌐';
}

/**
 * Helper to extract standardized ISO-3 code from GeoJSON feature properties
 */
function getCountryIso3(d) {
  if (!d) return null;
  const p = d.properties || {};
  let code = p.ISO_A3 || p.ADM0_A3 || p.ISO_A3_EH || p.GU_A3 || p.SU_A3;
  if (code && code !== '-99' && typeof code === 'string' && code.length === 3) {
    return code.toUpperCase();
  }
  if (p.ADM0_A3 && p.ADM0_A3 !== '-99' && typeof p.ADM0_A3 === 'string' && p.ADM0_A3.length === 3) {
    return p.ADM0_A3.toUpperCase();
  }
  if (p.ISO_A3_EH && p.ISO_A3_EH !== '-99' && typeof p.ISO_A3_EH === 'string' && p.ISO_A3_EH.length === 3) {
    return p.ISO_A3_EH.toUpperCase();
  }
  const name = (p.ADMIN || p.NAME || '').trim().toLowerCase();
  if (name) {
    const match = COUNTRIES.find(c => 
      c.name.toLowerCase() === name || 
      c.name.toLowerCase().includes(name) || 
      name.includes(c.name.toLowerCase())
    );
    if (match) return match.code;
  }
  return null;
}

/**
 * GlobeView — Real-time SDG Trajectory 3D Interactive Globe
 *
 * Props:
 *  - goalNumber:     SDG goal number (1–17), or null (defaults to 1).
 *  - sdgTarget:      Optional specific target code (e.g. '3.1').
 *  - markers:        Array of point markers (optional).
 *  - highlightColor: Custom hover highlight color.
 *  - compact:        If true, renders with compact styles.
 *  - size:           Fixed pixel size (width=height). Defaults to 900.
 *  - showRing:       If true, renders thin circular glow ring.
 *  - showTelemetry:  If true, displays floating Global Telemetry Distribution Bar HUD.
 *  - onCountryClick: Custom callback when a country is clicked.
 *  - onTargetChange: Custom callback when target is changed in the telemetry bar.
 */
export default function GlobeView({
  goalNumber = 1,
  sdgTarget = null,
  markers = [],
  highlightColor = '#38bdf8',
  compact = false,
  size = 900,
  showRing = true,
  showTelemetry = true,
  onCountryClick,
  onTargetChange,
}) {
  const globeRef = useRef();
  const containerRef = useRef();
  const navigate = useNavigate();
  const [countries, setCountries] = useState({ features: [] });
  const [hoverD, setHoverD] = useState(null);
  const [goalStatusData, setGoalStatusData] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  const activeGoal = goalNumber || 1;
  const activeGoalColor = sdgColors[activeGoal] || '#3b82f6';
  
  // Available targets for the active goal
  const availableTargets = useMemo(() => {
    const list = TARGETS.filter(t => parseInt(t.code.split('.')[0], 10) === activeGoal);
    return list.length > 0 ? list : [{ code: `${activeGoal}.1`, title: `Target ${activeGoal}.1` }];
  }, [activeGoal]);

  const [selectedTargetState, setSelectedTargetState] = useState(sdgTarget || availableTargets[0]?.code || `${activeGoal}.1`);

  useEffect(() => {
    if (sdgTarget) {
      setSelectedTargetState(sdgTarget);
    } else {
      setSelectedTargetState(availableTargets[0]?.code || `${activeGoal}.1`);
    }
  }, [sdgTarget, activeGoal, availableTargets]);

  const activeTarget = sdgTarget || selectedTargetState;

  const handleTargetSelect = (newTargetCode) => {
    setSelectedTargetState(newTargetCode);
    if (onTargetChange) {
      onTargetChange(newTargetCode);
    }
  };

  // Load GeoJSON data for country boundaries
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(data => setCountries(data))
      .catch(err => console.error('Failed to load globe GeoJSON:', err));
  }, []);

  // Fetch real SDG trajectory statuses for the active goal/target
  useEffect(() => {
    const currentTarget = activeTarget || `${activeGoal}.1`;
    const cacheKey = `goal_${activeGoal}_${currentTarget}`;

    if (GOAL_STATUS_CLIENT_CACHE.has(cacheKey)) {
      setGoalStatusData(GOAL_STATUS_CLIENT_CACHE.get(cacheKey));
      return;
    }

    let isMounted = true;
    setLoadingStatus(true);

    const queryUrl = `${API_BASE_URL}/api/globe/goal-status?goal=${activeGoal}&sdg_target=${currentTarget}`;

    axios.get(queryUrl)
      .then(res => {
        if (isMounted && res.data) {
          GOAL_STATUS_CLIENT_CACHE.set(cacheKey, res.data);
          setGoalStatusData(res.data);
        }
      })
      .catch(err => {
        console.warn('Could not fetch globe goal status data, using fallback theme:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingStatus(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeGoal, activeTarget]);

  // Ocean/sea color based on SDG goal
  const oceanColor = getOceanColor(activeGoal);

  // Custom globe material with the ocean color
  const globeMaterial = useMemo(() => {
    const material = new THREE.MeshPhongMaterial();
    material.color = new THREE.Color(oceanColor);
    material.shininess = 2;
    material.specular = new THREE.Color('#D8E8F0');
    return material;
  }, [oceanColor]);

  // Configure camera and rotation
  useEffect(() => {
    if (globeRef.current) {
      const controls = globeRef.current.controls();
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.5;
      controls.enableZoom = false;
      controls.minPolarAngle = Math.PI * 0.25;
      controls.maxPolarAngle = Math.PI * 0.75;
      globeRef.current.pointOfView({ altitude: 1.435 }, 0);
    }
  }, []);

  // Country polygon cap color — Choropleth mapping of real trajectory status
  const getPolygonCapColor = (d) => {
    if (d === hoverD) {
      return highlightColor || '#ffffff';
    }

    const isoCode = getCountryIso3(d);
    const countryData = isoCode && goalStatusData?.countries ? goalStatusData.countries[isoCode] : null;

    if (countryData && countryData.status) {
      switch (countryData.status) {
        case 'On-track':
          return '#10b981'; // 🟢 Emerald Green
        case 'At-risk':
          return '#f59e0b'; // 🟡 Amber
        case 'Off-track':
          return '#ef4444'; // 🔴 Rose / Red
        case 'Insufficient Data':
        default:
          return '#64748b'; // ⚪ Muted Slate
      }
    }

    return '#64748b';
  };

  const getPolygonSideColor = (d) => {
    const isoCode = getCountryIso3(d);
    const countryData = isoCode && goalStatusData?.countries ? goalStatusData.countries[isoCode] : null;

    if (countryData && countryData.status) {
      switch (countryData.status) {
        case 'On-track':
          return '#10b98199';
        case 'At-risk':
          return '#f59e0b99';
        case 'Off-track':
          return '#ef444499';
        case 'Insufficient Data':
        default:
          return '#64748b80';
      }
    }

    return '#64748b80';
  };

  const getPolygonStrokeColor = (d) => {
    return d === hoverD ? '#ffffff' : '#ffffff30';
  };

  const handlePolygonClick = (polygon) => {
    const name = polygon?.properties?.ADMIN || polygon?.properties?.NAME;
    const isoCode = getCountryIso3(polygon);
    if (onCountryClick) {
      onCountryClick(name, polygon, isoCode);
    } else if (isoCode) {
      navigate(`/country/${isoCode}`);
    }
  };

  const handlePointClick = (point) => {
    navigate(`/country/${point.id}`);
  };

  // Telemetry summaries calculation
  const summary = goalStatusData?.summary || { total_countries: 0, on_track: 0, at_risk: 0, off_track: 0, insufficient_data: 0 };
  const evaluatedTotal = (summary.on_track || 0) + (summary.at_risk || 0) + (summary.off_track || 0);
  const onTrackPct = evaluatedTotal > 0 ? Math.round(((summary.on_track || 0) / evaluatedTotal) * 100) : 0;
  const atRiskPct = evaluatedTotal > 0 ? Math.round(((summary.at_risk || 0) / evaluatedTotal) * 100) : 0;
  const offTrackPct = evaluatedTotal > 0 ? Math.max(0, 100 - onTrackPct - atRiskPct) : 0;

  const globeViewportClass = compact
    ? "relative flex items-center justify-center overflow-hidden"
    : "relative flex items-center justify-center rounded-xl overflow-hidden shadow-2xl border border-slate-200/30";

  const ringStyle = showRing ? {
    borderRadius: '50%',
    boxShadow: '0 0 0 2px rgba(255,255,255,0.9), 0 0 16px rgba(255,255,255,0.2)',
  } : {};

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center justify-center cursor-crosshair group"
      style={{ width: size, maxWidth: '100%' }}
    >
      {/* Spherical Globe Canvas Viewport */}
      <div
        className={globeViewportClass}
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
          polygonAltitude={d => d === hoverD ? 0.05 : 0.008}
          polygonCapColor={getPolygonCapColor}
          polygonSideColor={getPolygonSideColor}
          polygonStrokeColor={getPolygonStrokeColor}
          polygonLabel={d => {
            const p = d?.properties || {};
            const name = p.ADMIN || p.NAME || 'Country';
            const isoCode = getCountryIso3(d);
            const flagEmoji = getCountryFlag(isoCode);
            const countryStatus = isoCode && goalStatusData?.countries ? goalStatusData.countries[isoCode] : null;

            const status = countryStatus?.status || 'Insufficient Data';
            let badgeColor = '#94a3b8';
            let badgeBg = 'rgba(148, 163, 184, 0.15)';
            let badgeBorder = 'rgba(148, 163, 184, 0.3)';
            let statusText = 'No Data';
            let statusSubtext = 'Insufficient baseline';

            if (status === 'On-track') {
              badgeColor = '#10b981';
              badgeBg = 'rgba(16, 185, 129, 0.18)';
              badgeBorder = 'rgba(16, 185, 129, 0.4)';
              statusText = 'On Track';
              statusSubtext = 'Target 2030 achievable';
            } else if (status === 'At-risk') {
              badgeColor = '#f59e0b';
              badgeBg = 'rgba(245, 158, 11, 0.18)';
              badgeBorder = 'rgba(245, 158, 11, 0.4)';
              statusText = 'At Risk';
              statusSubtext = 'Pace insufficient';
            } else if (status === 'Off-track') {
              badgeColor = '#ef4444';
              badgeBg = 'rgba(239, 68, 68, 0.18)';
              badgeBorder = 'rgba(239, 68, 68, 0.4)';
              statusText = 'Off Track';
              statusSubtext = 'Reversal or critical lag';
            }

            const currentTargetCode = goalStatusData?.sdg_target || activeTarget;
            const targetMeta = getTargetDetails(currentTargetCode, activeGoal);
            const baseline = countryStatus?.baseline_value != null ? Number(countryStatus.baseline_value).toFixed(1) : null;
            const projected = countryStatus?.projected_value_2030 != null ? Number(countryStatus.projected_value_2030).toFixed(1) : null;
            const baselineYear = countryStatus?.baseline_year || 2024;

            // Trend calculation
            let trendPill = '';
            if (baseline !== null && projected !== null && Number(baseline) !== 0) {
              const delta = ((Number(projected) - Number(baseline)) / Number(baseline)) * 100;
              const arrow = delta < 0 ? '↓' : (delta > 0 ? '↑' : '→');
              const sign = delta > 0 ? '+' : '';
              const isGoodTrend = (targetMeta.polarity === 'lower_is_better' && delta < 0) || (targetMeta.polarity !== 'lower_is_better' && delta > 0);
              const trendColor = isGoodTrend ? '#10b981' : (Math.abs(delta) < 5 ? '#f59e0b' : '#ef4444');
              trendPill = `<span style="font-size: 10px; font-weight: 700; color: ${trendColor}; background: rgba(255,255,255,0.08); padding: 2px 5px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.1);">${arrow} ${sign}${delta.toFixed(1)}%</span>`;
            }

            return `
              <div style="padding: 12px 16px; background: rgba(15, 23, 42, 0.92); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.16); box-shadow: 0 20px 35px -5px rgba(0, 0, 0, 0.7), 0 0 15px rgba(56, 189, 248, 0.12); font-family: Inter, system-ui, -apple-system, sans-serif; min-width: 250px; max-width: 320px; color: #f8fafc; pointer-events: none;">
                <!-- Header: Flag + Name + ISO -->
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px;">
                  <div style="display: flex; align-items: center; gap: 7px; overflow: hidden;">
                    <span style="font-size: 18px; line-height: 1;">${flagEmoji}</span>
                    <span style="font-weight: 700; font-size: 14px; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${name}</span>
                  </div>
                  ${isoCode ? `<span style="font-size: 10px; font-family: ui-monospace, SFMono-Regular, monospace; font-weight: 700; color: #94a3b8; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); padding: 2px 6px; border-radius: 4px;">${isoCode}</span>` : ''}
                </div>

                <!-- SDG Goal Context & Indicator -->
                <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 7px 10px; margin-bottom: 8px;">
                  <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px;">
                    <span style="display: inline-flex; align-items: center; gap: 4px; font-size: 10px; font-weight: 700; color: #ffffff; background: ${activeGoalColor}; padding: 2px 7px; border-radius: 4px;">
                      Goal ${activeGoal}
                    </span>
                    <span style="font-size: 10px; font-mono; font-weight: 600; color: #cbd5e1;">Target ${currentTargetCode}</span>
                  </div>
                  <div style="font-size: 11px; font-weight: 600; color: #f1f5f9; margin-top: 4px; line-height: 1.3;">
                    ${targetMeta.title}
                  </div>
                  <div style="font-size: 10px; color: #94a3b8; margin-top: 1px; line-height: 1.25; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${targetMeta.indicatorName}
                  </div>
                </div>

                <!-- Status Badge with Pulse -->
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; background: ${badgeBg}; border: 1px solid ${badgeBorder}; border-radius: 8px; margin-bottom: 8px;">
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${badgeColor}; box-shadow: 0 0 8px ${badgeColor};"></span>
                    <span style="font-size: 12px; font-weight: 700; color: ${badgeColor};">${statusText}</span>
                  </div>
                  <span style="font-size: 10px; color: #94a3b8; font-weight: 500;">${statusSubtext}</span>
                </div>

                <!-- Metrics Comparison -->
                ${baseline !== null ? `
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; padding: 8px; background: rgba(0, 0, 0, 0.3); border-radius: 8px; border: 1px solid rgba(255,255,255,0.06); margin-bottom: 8px;">
                    <div>
                      <div style="font-size: 9px; color: #94a3b8; text-transform: uppercase; font-weight: 600; letter-spacing: 0.03em;">Current / Baseline</div>
                      <div style="font-size: 12px; font-weight: 700; color: #f8fafc; margin-top: 2px;">
                        ${baseline} <span style="font-size: 9px; color: #94a3b8; font-weight: 400;">(${baselineYear})</span>
                      </div>
                    </div>
                    <div>
                      <div style="font-size: 9px; color: #94a3b8; text-transform: uppercase; font-weight: 600; letter-spacing: 0.03em;">2030 Projected</div>
                      <div style="font-size: 12px; font-weight: 700; color: ${badgeColor}; margin-top: 2px; display: flex; align-items: center; justify-content: space-between;">
                        <span>${projected !== null ? projected : 'N/A'}</span>
                        ${trendPill}
                      </div>
                    </div>
                  </div>
                ` : `
                  <div style="padding: 6px 8px; background: rgba(0, 0, 0, 0.2); border-radius: 6px; font-size: 10px; color: #94a3b8; font-style: italic; margin-bottom: 8px; text-align: center;">
                    Insufficient time-series observations for ML regression
                  </div>
                `}

                <!-- Action Cue -->
                <div style="padding-top: 6px; border-top: 1px solid rgba(255, 255, 255, 0.08); display: flex; align-items: center; justify-content: space-between; font-size: 10px;">
                  <span style="color: #64748b;">Trajectory Forecast</span>
                  <span style="color: #38bdf8; font-weight: 600; display: inline-flex; align-items: center; gap: 3px;">
                    Click to open dossier →
                  </span>
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

      {/* ===== GLOBAL TELEMETRY DISTRIBUTION BAR HUD (Placed below globe) ===== */}
      {showTelemetry && goalStatusData && (
        <div className="w-[95%] max-w-sm sm:max-w-md mt-4 transition-all duration-300 drop-shadow-xl z-20">
          <div className="bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-2.5 sm:p-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)] text-white">
            {/* Header: Title + Target indicator dropdown */}
            <div className="flex items-center justify-between text-xs mb-2 px-0.5 gap-2">
              <div className="flex items-center gap-2 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full ring-2 ring-white/30 animate-pulse flex-shrink-0"
                  style={{ backgroundColor: activeGoalColor }}
                />
                <span className="font-semibold text-slate-200 truncate text-[11px] sm:text-xs">
                  Global Status (Goal {activeGoal} · {SDG_SHORT_NAMES[activeGoal] || 'Goal ' + activeGoal})
                </span>
              </div>

              <div className="relative inline-flex items-center flex-shrink-0">
                <select
                  value={activeTarget}
                  onChange={(e) => handleTargetSelect(e.target.value)}
                  className="appearance-none bg-white/10 hover:bg-white/20 focus:bg-slate-800 text-[10px] font-mono font-bold text-slate-200 pl-2 pr-5 py-1 rounded-md border border-white/20 focus:outline-none focus:ring-1 focus:ring-sky-400 cursor-pointer transition-all"
                  title="Switch Target"
                >
                  {availableTargets.map(t => (
                    <option key={t.code} value={t.code} className="bg-slate-900 text-white py-1">
                      Target {t.code} — {t.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 pointer-events-none" />
              </div>
            </div>

            {/* Distribution Bar */}
            <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden flex gap-0.5 mb-2 border border-slate-700/50">
              <div
                className="h-full bg-emerald-500 transition-all duration-500 rounded-l-full"
                style={{ width: `${onTrackPct}%` }}
                title={`On Track: ${onTrackPct}% (${summary.on_track || 0} nations)`}
              />
              <div
                className="h-full bg-amber-500 transition-all duration-500"
                style={{ width: `${atRiskPct}%` }}
                title={`At Risk: ${atRiskPct}% (${summary.at_risk || 0} nations)`}
              />
              <div
                className="h-full bg-rose-500 transition-all duration-500 rounded-r-full"
                style={{ width: `${offTrackPct}%` }}
                title={`Off Track: ${offTrackPct}% (${summary.off_track || 0} nations)`}
              />
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
              <div className="flex items-center justify-center gap-1 bg-emerald-500/15 border border-emerald-500/30 py-1 px-1.5 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span className="font-bold text-emerald-400">{onTrackPct}%</span>
                <span className="text-slate-300 text-[9px] hidden sm:inline">On Track</span>
              </div>
              <div className="flex items-center justify-center gap-1 bg-amber-500/15 border border-amber-500/30 py-1 px-1.5 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span className="font-bold text-amber-400">{atRiskPct}%</span>
                <span className="text-slate-300 text-[9px] hidden sm:inline">At Risk</span>
              </div>
              <div className="flex items-center justify-center gap-1 bg-rose-500/15 border border-rose-500/30 py-1 px-1.5 rounded-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                <span className="font-bold text-rose-400">{offTrackPct}%</span>
                <span className="text-slate-300 text-[9px] hidden sm:inline">Off Track</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
