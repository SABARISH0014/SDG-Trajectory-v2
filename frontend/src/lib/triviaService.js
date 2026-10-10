import axios from 'axios';
import { API_BASE_URL } from '@/config';

export const DEFAULT_TRIVIA_ITEMS = [
  {
    id: 1,
    category: "SDG Fact",
    text: "Over 2 billion people worldwide still lack safely managed drinking water services (SDG 6).",
    icon: "Droplet"
  },
  {
    id: 2,
    category: "Website Tip",
    text: "You can simulate policy accelerations up to 2.0x on any indicator in the What-If Policy Simulator!",
    icon: "Sliders"
  },
  {
    id: 3,
    category: "UN Trivia",
    text: "The 17 SDGs were adopted unanimously by all 193 UN Member States in September 2015 as part of the 2030 Agenda.",
    icon: "Globe"
  },
  {
    id: 4,
    category: "Website Tip",
    text: "Click 'Executive Briefing (PDF)' on any trajectory to export an official, board-ready 1-page dossier.",
    icon: "FileText"
  },
  {
    id: 5,
    category: "SDG Fact",
    text: "Renewable energy must expand three times faster than current rates to achieve universal clean energy by 2030 (SDG 7).",
    icon: "Zap"
  },
  {
    id: 6,
    category: "Website Tip",
    text: "Interact with the 3D globe on the homepage: click any nation to view its complete 17-Goal development breakdown.",
    icon: "Compass"
  },
  {
    id: 7,
    category: "SDG Fact",
    text: "Global greenhouse gas emissions must drop by 43% by 2030 to limit global warming to 1.5°C (SDG 13).",
    icon: "Flame"
  },
  {
    id: 8,
    category: "Website Tip",
    text: "Use the Country Benchmarking tool to compare development trajectories of any two countries side-by-side.",
    icon: "Scale"
  },
  {
    id: 9,
    category: "UN Trivia",
    text: "The 2030 Agenda encompasses 169 quantitative targets tracked by over 230 multilateral indicators.",
    icon: "Target"
  },
  {
    id: 10,
    category: "Website Tip",
    text: "Need customized policy recommendations? Open the AI Policy Copilot on the bottom right for instant tailored insights.",
    icon: "Sparkles"
  },
  {
    id: 11,
    category: "SDG Fact",
    text: "Over 700 million people still live in extreme poverty worldwide, subsisting on less than $2.15 a day (SDG 1).",
    icon: "Users"
  },
  {
    id: 12,
    category: "UN Trivia",
    text: "The UN General Assembly Hall in New York was designed by an international team including Le Corbusier and Oscar Niemeyer.",
    icon: "Building"
  }
];

let cachedTrivia = null;
let cachedConfig = null;

export async function getActiveTriviaList() {
  if (cachedTrivia && cachedTrivia.length > 0) {
    return cachedTrivia;
  }
  try {
    const res = await axios.get(`${API_BASE_URL}/api/trivia`, { timeout: 4000 });
    const items = Array.isArray(res.data) ? res.data : (res.data?.trivia || res.data?.items);
    if (items && Array.isArray(items) && items.length > 0) {
      cachedTrivia = items;
      return items;
    }
  } catch (err) {
    console.warn("Could not fetch remote trivia, using local defaults:", err);
  }
  return DEFAULT_TRIVIA_ITEMS;
}

export async function getLoadingConfig() {
  if (cachedConfig) return cachedConfig;
  try {
    const res = await axios.get(`${API_BASE_URL}/api/trivia/config`, { timeout: 3000 });
    if (res.data) {
      cachedConfig = res.data;
      return res.data;
    }
  } catch (err) {
    console.warn("Could not fetch remote loading config, using default:", err);
  }
  return {
    rotation_interval: 3.5,
    active_categories: ["Website Tip", "SDG Fact", "UN Trivia"],
    spinner_style: "sdg_ring"
  };
}

export function invalidateTriviaCache() {
  cachedTrivia = null;
  cachedConfig = null;
}
