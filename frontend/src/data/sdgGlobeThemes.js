// SDG Globe Color Themes
// Each SDG goal has a unique palette of 5 shades for country coloring.
// Ocean color is a shared light blue-grey inspired by the World Bank SDG Atlas.

export const OCEAN_COLOR = '#B8CCD8';
export const OCEAN_COLOR_DARK = '#A8BCC8';

// 5 shades per SDG goal — from lightest to darkest, based on official UN SDG color
export const sdgGlobeThemes = {
  1: { // No Poverty — Reds
    shades: ['#F5C6CB', '#EEA0A8', '#E57383', '#E5243B', '#B81D30'],
    ocean: OCEAN_COLOR,
  },
  2: { // Zero Hunger — Amber/Gold
    shades: ['#F5E6B8', '#EDCF7D', '#E5B84D', '#DDA63A', '#B8872E'],
    ocean: OCEAN_COLOR,
  },
  3: { // Good Health — Greens
    shades: ['#C8E6C0', '#9DD490', '#6FC05E', '#4C9F38', '#3A7D2B'],
    ocean: OCEAN_COLOR,
  },
  4: { // Quality Education — Deep Reds
    shades: ['#F0B8BF', '#E08090', '#D04A60', '#C5192D', '#9E1424'],
    ocean: OCEAN_COLOR,
  },
  5: { // Gender Equality — Orangey-Reds
    shades: ['#FFC5BB', '#FF9480', '#FF6545', '#FF3A21', '#CC2E1A'],
    ocean: OCEAN_COLOR,
  },
  6: { // Clean Water — Sky Blues
    shades: ['#BEE8F5', '#85D4ED', '#4DC0E5', '#26BDE2', '#1E97B5'],
    ocean: '#D0E4EE',
  },
  7: { // Clean Energy — Yellows
    shades: ['#FEF0B2', '#FDE47A', '#FCD842', '#FCC30B', '#CA9C09'],
    ocean: OCEAN_COLOR,
  },
  8: { // Decent Work — Maroon/Wine
    shades: ['#E0B0C0', '#C87090', '#B04060', '#A21942', '#821435'],
    ocean: OCEAN_COLOR,
  },
  9: { // Industry & Innovation — Burnt Orange
    shades: ['#FED0B0', '#FDA878', '#FD8040', '#FD6925', '#CA541E'],
    ocean: OCEAN_COLOR,
  },
  10: { // Reduced Inequalities — Deep Pink/Magenta
    shades: ['#F0A8C4', '#E46898', '#D83070', '#DD1367', '#B01052'],
    ocean: OCEAN_COLOR,
  },
  11: { // Sustainable Cities — Orange
    shades: ['#FEE0B0', '#FDC678', '#FDAD40', '#FD9D24', '#CA7E1D'],
    ocean: OCEAN_COLOR,
  },
  12: { // Responsible Consumption — Olive/Bronze
    shades: ['#E8D8B0', '#D4C088', '#C0A860', '#BF8B2E', '#997025'],
    ocean: OCEAN_COLOR,
  },
  13: { // Climate Action — Forest Green
    shades: ['#C0D8C2', '#88B88D', '#509858', '#3F7E44', '#326536'],
    ocean: OCEAN_COLOR,
  },
  14: { // Life Below Water — Ocean Blues
    shades: ['#B0D8F0', '#68B8E0', '#2898D0', '#0A97D9', '#0878AD'],
    ocean: '#C8DAEC',
  },
  15: { // Life on Land — Lime Greens
    shades: ['#CBF0A0', '#A4E468', '#7CD830', '#56C02B', '#459A22'],
    ocean: OCEAN_COLOR,
  },
  16: { // Peace & Justice — Teal/Dark Blue
    shades: ['#A0C8D8', '#6098B8', '#306898', '#00689D', '#00537E'],
    ocean: OCEAN_COLOR,
  },
  17: { // Partnerships — Navy
    shades: ['#A0B0C8', '#6880A0', '#385878', '#19486A', '#143A55'],
    ocean: OCEAN_COLOR,
  },
};

// Default theme when no specific SDG is selected (general blue theme)
export const defaultGlobeTheme = {
  shades: ['#C8D8E8', '#90B0D0', '#5888B8', '#3B6FA0', '#2A5580'],
  ocean: OCEAN_COLOR,
};

/**
 * Deterministic color assignment for a country based on SDG goal.
 * Uses a hash of the country name to consistently pick one of 5 shades.
 * @param {number|null} goalNumber - SDG goal number (1-17), null for default
 * @param {string} countryName - Country name for hashing
 * @returns {string} Hex color string
 */
export function getCountryColor(goalNumber, countryName) {
  const theme = goalNumber && sdgGlobeThemes[goalNumber]
    ? sdgGlobeThemes[goalNumber]
    : defaultGlobeTheme;

  // Simple deterministic hash
  let hash = 0;
  for (let i = 0; i < countryName.length; i++) {
    hash = ((hash << 5) - hash) + countryName.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  const index = Math.abs(hash) % theme.shades.length;
  return theme.shades[index];
}

/**
 * Get the ocean color for a specific SDG goal.
 * @param {number|null} goalNumber
 * @returns {string} Hex color string
 */
export function getOceanColor(goalNumber) {
  const theme = goalNumber && sdgGlobeThemes[goalNumber]
    ? sdgGlobeThemes[goalNumber]
    : defaultGlobeTheme;
  return theme.ocean;
}
