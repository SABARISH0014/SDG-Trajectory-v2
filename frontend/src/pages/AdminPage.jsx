import { API_BASE_URL } from '@/config';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import LoadingTriviaCard from '../components/LoadingTriviaCard';
import { invalidateTriviaCache } from '../lib/triviaService';
import { 
  ShieldCheck, 
  Database, 
  Sliders, 
  LogIn, 
  CheckCircle2, 
  ArrowLeft, 
  Loader2, 
  Activity, 
  Globe2, 
  Target, 
  Trash2, 
  RefreshCw, 
  Zap, 
  Server, 
  Table as TableIcon,
  PlusCircle,
  Edit2,
  AlertCircle,
  Save,
  X,
  Bot,
  Sparkles,
  Cpu,
  SlidersHorizontal,
  Flame,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  ScrollText,
  FileText,
  Download,
  Filter,
  Search,
  History,
  Lightbulb
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/input';
import { Slider } from '../components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { COUNTRIES, TARGETS } from '../lib/constants';
import { getTargetDetails } from '../data/sdgTargetsData';
import LanguageSwitcher from '../components/LanguageSwitcher';

const AVAILABLE_AI_MODELS = [
  { id: 'openrouter/auto', name: 'OpenRouter Auto — Best Available Router (Recommended)', tier: 'Recommended' },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3 Chat — High Accuracy & Reasoning', tier: 'Direct OpenRouter' },
  { id: 'nvidia/nemotron-3.5-lightning:free', name: 'Nvidia Nemotron 3.5 — Ultra-Fast Free Tier', tier: 'Fast Free' },
  { id: 'liquid/lfm-2.5-2.6b:free', name: 'Liquid LFM 2.5 — Lightweight Free Tier', tier: 'Speed' },
  { id: 'google/gemma-4-26b-a4b-it:free', name: 'Google Gemma 4 (26B) — Free (May be rate-limited)', tier: 'Free Tier' },
];

const ADMIN_NAV_TABS = [
  { id: 'overview', label: 'Overview & Health', icon: Activity, color: 'text-rose-600' },
  { id: 'data-explorer', label: 'Data Explorer & Overrides', icon: TableIcon, color: 'text-blue-600' },
  { id: 'ai-config', label: 'AI Copilot & Models', icon: Bot, color: 'text-indigo-600' },
  { id: 'algorithms', label: 'Algorithms & Pipelines', icon: Sliders, color: 'text-cyan-600' },
  { id: 'audit-logs', label: 'Audit & Activity Trail', icon: ScrollText, color: 'text-amber-600' },
  { id: 'trivia', label: 'Tips & Trivia', icon: Sparkles, color: 'text-amber-500' },
  { id: 'security', label: 'Security & Access', icon: KeyRound, color: 'text-emerald-600' },
];

const PERSONA_DESCRIPTIONS = {
  un_advisor: {
    title: 'Senior UN Policy Advisor',
    desc: 'Provides strategic, diplomatic, and evidence-based policy insights aligned with the UN 2030 Agenda.',
    accent: 'text-blue-600 bg-blue-50 border-blue-200'
  },
  data_scientist: {
    title: 'SDG Data Scientist & Quantitative Lead',
    desc: 'Focuses on empirical trajectory velocity, statistical confidence, time-series regression, and anomaly diagnostics.',
    accent: 'text-purple-600 bg-purple-50 border-purple-200'
  },
  economist: {
    title: 'Senior Macroeconomist & Fiscal Strategist',
    desc: 'Emphasizes capital efficiency, public funding allocation, ROI on development, and structural reforms.',
    accent: 'text-emerald-600 bg-emerald-50 border-emerald-200'
  },
  youth_advocate: {
    title: 'Global Youth & Equity Ambassador',
    desc: 'Highlights human-centric community impacts, intergenerational equity, and vulnerable population protections.',
    accent: 'text-rose-600 bg-rose-50 border-rose-200'
  }
};

export default function AdminPage() {
  const [token, setToken] = useState(() => localStorage.getItem('sdg_admin_token') || null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Active Tab: 'overview' | 'data-explorer' | 'ai-config' | 'algorithms' | 'security'
  const [activeTab, setActiveTab] = useState('overview');

  // Overview & Telemetry State
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [purgeStatus, setPurgeStatus] = useState('');
  const [purgeMessage, setPurgeMessage] = useState('');

  // Data Explorer & Record Editor State
  const [explorerCountry, setExplorerCountry] = useState('IND');
  const [explorerTarget, setExplorerTarget] = useState('8.6');
  const [records, setRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordActionStatus, setRecordActionStatus] = useState('');
  const [recordActionMessage, setRecordActionMessage] = useState('');
  
  // Edit / Insert Form State
  const [editingYear, setEditingYear] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editImputed, setEditImputed] = useState(false);
  
  // New Record Form State
  const [newYear, setNewYear] = useState('2024');
  const [newValue, setNewValue] = useState('');
  const [newImputed, setNewImputed] = useState(false);
  const [isInserting, setIsInserting] = useState(false);

  // AI & LLM Config State
  const [aiModel, setAiModel] = useState('google/gemma-4-26b-a4b-it:free');
  const [aiPersona, setAiPersona] = useState('un_advisor');
  const [aiTemperature, setAiTemperature] = useState(0.2);
  const [emergencyMockMode, setEmergencyMockMode] = useState(false);
  const [aiConfigStatus, setAiConfigStatus] = useState('');

  // Password Management State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwChangeStatus, setPwChangeStatus] = useState('');
  const [pwChangeMessage, setPwChangeMessage] = useState('');

  // Algorithm & Sync States
  const [contamination, setContamination] = useState(0.1);
  const [forecastConfidence, setForecastConfidence] = useState(0.95);
  const [imputationMethod, setImputationMethod] = useState('linear');
  const [syncStatus, setSyncStatus] = useState('');
  const [configStatus, setConfigStatus] = useState('');

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);
  const [auditFilter, setAuditFilter] = useState('ALL');
  const [auditSearch, setAuditSearch] = useState('');
  const [auditClearStatus, setAuditClearStatus] = useState('');

  // Tips & Trivia Management State
  const [triviaList, setTriviaList] = useState([]);
  const [triviaLoading, setTriviaLoading] = useState(false);
  const [triviaFilter, setTriviaFilter] = useState('ALL');
  const [triviaSearch, setTriviaSearch] = useState('');
  const [triviaStatus, setTriviaStatus] = useState('');
  const [triviaMessage, setTriviaMessage] = useState('');

  // Loading Screen Timing & Experience State
  const [triviaInterval, setTriviaInterval] = useState(3.5);
  const [triviaAllowedCategories, setTriviaAllowedCategories] = useState(['Website Tip', 'SDG Fact', 'UN Trivia']);
  const [triviaTimingSaving, setTriviaTimingSaving] = useState(false);
  const [triviaTimingStatus, setTriviaTimingStatus] = useState('');
  const [triviaTimingMessage, setTriviaTimingMessage] = useState('');
  const [showLiveTimingPreview, setShowLiveTimingPreview] = useState(false);

  // Trivia Modal / Editor State
  const [isTriviaModalOpen, setIsTriviaModalOpen] = useState(false);
  const [editingTriviaItem, setEditingTriviaItem] = useState(null);
  const [triviaFormCategory, setTriviaFormCategory] = useState('Website Tip');
  const [triviaFormText, setTriviaFormText] = useState('');
  const [triviaFormIcon, setTriviaFormIcon] = useState('💡');
  const [triviaFormActive, setTriviaFormActive] = useState(true);
  const [isSavingTrivia, setIsSavingTrivia] = useState(false);
  const [deletingTriviaId, setDeletingTriviaId] = useState(null);

  const fetchStats = async (authToken = token) => {
    if (!authToken) return;
    setStatsLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setStats(res.data);
    } catch (err) {
      console.error("Failed to fetch admin stats:", err);
      if (err.response && err.response.status === 401) {
        handleLogout();
      }
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchConfig = async (authToken = token) => {
    if (!authToken) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/config`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.data) {
        if (res.data.contamination !== undefined) setContamination(res.data.contamination);
        if (res.data.forecast_confidence !== undefined) setForecastConfidence(res.data.forecast_confidence);
        if (res.data.imputation_method) setImputationMethod(res.data.imputation_method);
      }
    } catch (err) {
      console.error("Failed to fetch admin config:", err);
      if (err.response && err.response.status === 401) {
        handleLogout();
      }
    }
  };

  const fetchAiConfig = async (authToken = token) => {
    if (!authToken) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/ai-config`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.data) {
        if (res.data.copilot_model) setAiModel(res.data.copilot_model);
        if (res.data.copilot_persona) setAiPersona(res.data.copilot_persona);
        if (res.data.copilot_temperature !== undefined) setAiTemperature(res.data.copilot_temperature);
        if (res.data.emergency_mock_mode !== undefined) setEmergencyMockMode(res.data.emergency_mock_mode);
      }
    } catch (err) {
      console.error("Failed to fetch AI config:", err);
      if (err.response && err.response.status === 401) {
        handleLogout();
      }
    }
  };

  const fetchAuditLogs = async (authToken = token) => {
    if (!authToken) return;
    setAuditLogsLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/audit-logs`, {
        params: { limit: 100 },
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setAuditLogs(res.data.audit_logs || []);
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
      if (err.response && err.response.status === 401) {
        handleLogout();
      }
    } finally {
      setAuditLogsLoading(false);
    }
  };

  const fetchRecords = async (country = explorerCountry, target = explorerTarget) => {
    if (!token) return;
    setRecordsLoading(true);
    setRecordActionMessage('');
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/data`, {
        params: { country_code: country, sdg_target: target },
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecords(res.data.records || []);
    } catch (err) {
      console.error("Failed to fetch indicator records:", err);
      if (err.response && err.response.status === 401) {
        handleLogout();
      }
    } finally {
      setRecordsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchStats();
      fetchConfig();
      fetchAiConfig();
      fetchAuditLogs();
      fetchTriviaList();
    }
  }, [token]);

  useEffect(() => {
    if (token && activeTab === 'data-explorer') {
      fetchRecords(explorerCountry, explorerTarget);
    }
    if (token && activeTab === 'audit-logs') {
      fetchAuditLogs();
    }
    if (token && activeTab === 'trivia') {
      fetchTriviaList();
    }
  }, [token, activeTab, explorerCountry, explorerTarget]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoginError('');
    try {
      const response = await axios.post(`${API_BASE_URL}/api/admin/login`, {
        username,
        password
      });
      const receivedToken = response.data.token;
      setToken(receivedToken);
      localStorage.setItem('sdg_admin_token', receivedToken);
    } catch (err) {
      if (err.response) {
        if (err.response.status === 401) {
          setLoginError('Invalid admin credentials. (Hint: admin / admin123)');
        } else if (err.response.status === 429) {
          setLoginError('Too many login attempts. Please wait a minute before trying again.');
        } else {
          setLoginError(err.response.data?.detail || `Server returned error (${err.response.status}).`);
        }
      } else if (err.request) {
        setLoginError(`Cannot reach backend server at ${API_BASE_URL}. Please ensure the backend is running.`);
      } else {
        setLoginError(err.message || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('sdg_admin_token');
  };

  const handlePurgeCache = async () => {
    setPurgeStatus('purging');
    setPurgeMessage('');
    try {
      const res = await axios.post(`${API_BASE_URL}/api/admin/cache/clear`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPurgeStatus('success');
      setPurgeMessage(res.data.message || 'Cache cleared successfully.');
      fetchStats();
      setTimeout(() => {
        setPurgeStatus('');
        setPurgeMessage('');
      }, 4000);
    } catch (err) {
      console.error("Purge cache failed:", err);
      setPurgeStatus('error');
      setPurgeMessage('Failed to purge cache. Please try again.');
      setTimeout(() => setPurgeStatus(''), 4000);
    }
  };

  const handleSaveRecord = async (year, value, isImputed) => {
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) {
      alert("Please enter a valid numeric indicator value.");
      return;
    }

    setRecordActionStatus('saving');
    try {
      const res = await axios.post(`${API_BASE_URL}/api/admin/data/record`, {
        country_code: explorerCountry,
        sdg_target: explorerTarget,
        year: parseInt(year, 10),
        indicator_value: numericValue,
        is_imputed: isImputed ? 1 : 0
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setRecordActionStatus('success');
      setRecordActionMessage(res.data.message || 'Record saved successfully.');
      setEditingYear(null);
      setIsInserting(false);
      setNewValue('');
      fetchRecords(explorerCountry, explorerTarget);
      fetchStats();
      setTimeout(() => setRecordActionMessage(''), 4000);
    } catch (err) {
      console.error("Failed to save record:", err);
      setRecordActionStatus('error');
      setRecordActionMessage(err.response?.data?.detail || 'Failed to save record.');
    }
  };

  const handleDeleteRecord = async (year) => {
    if (!window.confirm(`Are you sure you want to delete data point for ${explorerCountry} Target ${explorerTarget} (Year ${year})?`)) {
      return;
    }

    setRecordActionStatus('saving');
    try {
      const res = await axios.delete(`${API_BASE_URL}/api/admin/data/record`, {
        params: {
          country_code: explorerCountry,
          sdg_target: explorerTarget,
          year: parseInt(year, 10)
        },
        headers: { Authorization: `Bearer ${token}` }
      });

      setRecordActionStatus('success');
      setRecordActionMessage(res.data.message || 'Record deleted successfully.');
      fetchRecords(explorerCountry, explorerTarget);
      fetchStats();
      setTimeout(() => setRecordActionMessage(''), 4000);
    } catch (err) {
      console.error("Failed to delete record:", err);
      setRecordActionStatus('error');
      setRecordActionMessage(err.response?.data?.detail || 'Failed to delete record.');
    }
  };

  const handleUpdateAiConfig = async () => {
    setAiConfigStatus('saving');
    try {
      await axios.post(`${API_BASE_URL}/api/admin/ai-config`, {
        copilot_model: aiModel,
        copilot_persona: aiPersona,
        copilot_temperature: aiTemperature,
        emergency_mock_mode: emergencyMockMode
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAiConfigStatus('success');
      setTimeout(() => setAiConfigStatus(''), 3000);
    } catch (err) {
      console.error("Failed to update AI config:", err);
      setAiConfigStatus('error');
      setTimeout(() => setAiConfigStatus(''), 3000);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwChangeStatus('error');
      setPwChangeMessage("New password and confirm password do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setPwChangeStatus('error');
      setPwChangeMessage("New password must be at least 6 characters.");
      return;
    }

    setPwChangeStatus('saving');
    setPwChangeMessage('');
    try {
      const res = await axios.post(`${API_BASE_URL}/api/admin/change-password`, {
        current_password: currentPassword,
        new_password: newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPwChangeStatus('success');
      setPwChangeMessage(res.data.message || "Password updated successfully.");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setPwChangeStatus('');
        setPwChangeMessage('');
      }, 5000);
    } catch (err) {
      console.error("Failed to change password:", err);
      setPwChangeStatus('error');
      setPwChangeMessage(err.response?.data?.detail || "Failed to update password. Please check your current password.");
    }
  };

  const handleSync = async () => {
    setSyncStatus('syncing');
    try {
      await axios.post(`${API_BASE_URL}/api/admin/sync`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSyncStatus('success');
      fetchStats();
      setTimeout(() => setSyncStatus(''), 3000);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 409) {
        setSyncStatus('locked');
        setTimeout(() => setSyncStatus(''), 5000);
      } else if (err.response && err.response.status === 401) {
        alert("Your admin session has expired. Please log in again.");
        handleLogout();
      } else {
        setSyncStatus('error');
      }
    }
  };

  const handleConfigUpdate = async () => {
    setConfigStatus('saving');
    try {
      await axios.post(`${API_BASE_URL}/api/admin/config`, { 
        contamination,
        forecast_confidence: forecastConfidence,
        imputation_method: imputationMethod
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConfigStatus('success');
      fetchAuditLogs();
      setTimeout(() => setConfigStatus(''), 3000);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 401) {
        alert("Your admin session has expired. Please log in again.");
        handleLogout();
      } else {
        setConfigStatus('error');
      }
    }
  };

  const handleClearAuditLogs = async () => {
    if (!window.confirm("Are you sure you want to clear all system audit logs? This action is irreversible.")) {
      return;
    }
    setAuditClearStatus('clearing');
    try {
      await axios.post(`${API_BASE_URL}/api/admin/audit-logs/clear`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAuditLogs([]);
      setAuditClearStatus('success');
      setTimeout(() => setAuditClearStatus(''), 3000);
    } catch (err) {
      console.error("Failed to clear audit logs:", err);
      setAuditClearStatus('error');
    }
  };

  const handleExportAuditLogsCsv = () => {
    if (!auditLogs.length) return;
    const headers = ["Timestamp (UTC)", "Action Type", "Actor", "Status", "Description"];
    const rows = auditLogs.map(log => [
      `"${log.timestamp}"`,
      `"${log.action_type}"`,
      `"${log.actor}"`,
      `"${log.status}"`,
      `"${(log.description || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sdg_admin_audit_logs_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchTriviaList = async (authToken = token) => {
    if (!authToken) return;
    setTriviaLoading(true);
    try {
      const [resTrivia, resConfig] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/admin/trivia`, {
          headers: { Authorization: `Bearer ${authToken}` }
        }),
        axios.get(`${API_BASE_URL}/api/trivia/config`).catch(() => null)
      ]);
      const items = Array.isArray(resTrivia.data) 
        ? resTrivia.data 
        : (resTrivia.data?.trivia || resTrivia.data?.items || []);
      setTriviaList(items);

      if (resConfig && resConfig.data) {
        if (resConfig.data.rotation_interval) {
          setTriviaInterval(parseFloat(resConfig.data.rotation_interval));
        }
        if (Array.isArray(resConfig.data.active_categories) && resConfig.data.active_categories.length > 0) {
          setTriviaAllowedCategories(resConfig.data.active_categories);
        }
      }
    } catch (err) {
      console.error("Failed to fetch admin trivia:", err);
      if (err.response && err.response.status === 401) {
        handleLogout();
      }
    } finally {
      setTriviaLoading(false);
    }
  };

  const handleSaveLoadingConfig = async (e) => {
    if (e) e.preventDefault();
    setTriviaTimingSaving(true);
    setTriviaTimingStatus('saving');
    try {
      await axios.post(`${API_BASE_URL}/api/admin/trivia/config`, {
        rotation_interval: parseFloat(triviaInterval),
        active_categories: triviaAllowedCategories,
        spinner_style: 'sdg_ring'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      invalidateTriviaCache();
      setTriviaTimingStatus('success');
      setTriviaTimingMessage('Loading screen rotation settings updated successfully.');
      setTimeout(() => {
        setTriviaTimingStatus('');
        setTriviaTimingMessage('');
      }, 3500);
    } catch (err) {
      console.error("Failed to update loading screen timing:", err);
      setTriviaTimingStatus('error');
      setTriviaTimingMessage(err.response?.data?.detail || 'Failed to update timing configuration.');
    } finally {
      setTriviaTimingSaving(false);
    }
  };

  const handleToggleAllowedCategory = (cat) => {
    setTriviaAllowedCategories(prev => {
      if (prev.includes(cat)) {
        if (prev.length === 1) return prev;
        return prev.filter(c => c !== cat);
      } else {
        return [...prev, cat];
      }
    });
  };

  const handleOpenCreateTrivia = () => {
    setEditingTriviaItem(null);
    setTriviaFormCategory('Website Tip');
    setTriviaFormText('');
    setTriviaFormIcon('💡');
    setTriviaFormActive(true);
    setIsTriviaModalOpen(true);
    setTriviaMessage('');
  };

  const handleOpenEditTrivia = (item) => {
    setEditingTriviaItem(item);
    setTriviaFormCategory(item.category || 'Website Tip');
    setTriviaFormText(item.text || '');
    setTriviaFormIcon(item.icon || '💡');
    setTriviaFormActive(Boolean(item.is_active));
    setIsTriviaModalOpen(true);
    setTriviaMessage('');
  };

  const handleSaveTriviaItem = async (e) => {
    e.preventDefault();
    if (!triviaFormText.trim()) return;

    setIsSavingTrivia(true);
    setTriviaStatus('saving');
    try {
      if (editingTriviaItem) {
        await axios.put(`${API_BASE_URL}/api/admin/trivia/${editingTriviaItem.id}`, {
          category: triviaFormCategory,
          text: triviaFormText.trim(),
          icon: triviaFormIcon || '💡',
          is_active: triviaFormActive
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTriviaStatus('success');
        setTriviaMessage('Tip / Trivia item updated successfully.');
      } else {
        await axios.post(`${API_BASE_URL}/api/admin/trivia`, {
          category: triviaFormCategory,
          text: triviaFormText.trim(),
          icon: triviaFormIcon || '💡',
          is_active: triviaFormActive
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTriviaStatus('success');
        setTriviaMessage('New Tip / Trivia item created successfully.');
      }
      setIsTriviaModalOpen(false);
      fetchTriviaList();
      setTimeout(() => {
        setTriviaStatus('');
        setTriviaMessage('');
      }, 3500);
    } catch (err) {
      console.error("Failed to save trivia item:", err);
      setTriviaStatus('error');
      setTriviaMessage(err.response?.data?.detail || 'Failed to save trivia item.');
    } finally {
      setIsSavingTrivia(false);
    }
  };

  const handleDeleteTriviaItem = async (id) => {
    if (!window.confirm("Are you sure you want to delete this tip / trivia item?")) return;
    setDeletingTriviaId(id);
    try {
      await axios.delete(`${API_BASE_URL}/api/admin/trivia/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTriviaStatus('success');
      setTriviaMessage('Trivia item deleted successfully.');
      fetchTriviaList();
      setTimeout(() => {
        setTriviaStatus('');
        setTriviaMessage('');
      }, 3000);
    } catch (err) {
      console.error("Failed to delete trivia item:", err);
      setTriviaStatus('error');
      setTriviaMessage(err.response?.data?.detail || 'Failed to delete trivia item.');
    } finally {
      setDeletingTriviaId(null);
    }
  };

  const handleToggleTriviaActive = async (item) => {
    const nextStatus = item.is_active ? 0 : 1;
    setTriviaList(prev => prev.map(t => t.id === item.id ? { ...t, is_active: nextStatus } : t));
    try {
      await axios.put(`${API_BASE_URL}/api/admin/trivia/${item.id}`, {
        category: item.category,
        text: item.text,
        icon: item.icon,
        is_active: Boolean(nextStatus)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error("Failed to toggle trivia item:", err);
      fetchTriviaList();
    }
  };

  const filteredTrivia = triviaList.filter(item => {
    const term = triviaSearch.trim().toLowerCase();
    const matchesSearch = !term ||
      (item.text && item.text.toLowerCase().includes(term)) ||
      (item.category && item.category.toLowerCase().includes(term));
    if (!matchesSearch) return false;
    if (triviaFilter === 'ALL') return true;
    return item.category === triviaFilter;
  });

  const getTriviaCategoryBadge = (category) => {
    if (category === 'Website Tip') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (category === 'SDG Fact') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (category === 'UN Trivia') return 'bg-purple-50 text-purple-700 border-purple-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  const TRIVIA_EMOJI_PRESETS = ['💡', '🌍', '🇺🇳', '⚡', '📊', '🎯', '🌱', '🤝', '📈', '🕊️', '🔬', '🎓'];

  const filteredLogs = auditLogs.filter(log => {
    const term = auditSearch.trim().toLowerCase();
    const matchesSearch = !term || 
      (log.description && log.description.toLowerCase().includes(term)) ||
      (log.action_type && log.action_type.toLowerCase().includes(term)) ||
      (log.actor && log.actor.toLowerCase().includes(term));
    
    if (!matchesSearch) return false;
    if (auditFilter === 'ALL') return true;
    if (auditFilter === 'AUTH') return log.action_type.startsWith('AUTH') || log.action_type.includes('PASSWORD');
    if (auditFilter === 'DATA') return log.action_type.startsWith('DATA');
    if (auditFilter === 'AI') return log.action_type.startsWith('AI');
    if (auditFilter === 'ALGORITHM') return log.action_type.startsWith('ALGORITHM');
    if (auditFilter === 'CACHE') return log.action_type.startsWith('CACHE');
    if (auditFilter === 'PIPELINE') return log.action_type.startsWith('PIPELINE') || log.action_type.startsWith('SYNC');
    return true;
  });

  const getCategoryBadge = (actionType = '') => {
    if (actionType.startsWith('AUTH') || actionType.includes('PASSWORD')) return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    if (actionType.startsWith('DATA')) return 'bg-blue-50 text-blue-700 border border-blue-200';
    if (actionType.startsWith('AI')) return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
    if (actionType.startsWith('ALGORITHM')) return 'bg-purple-50 text-purple-700 border border-purple-200';
    if (actionType.startsWith('CACHE')) return 'bg-amber-50 text-amber-700 border border-amber-200';
    if (actionType.startsWith('PIPELINE') || actionType.startsWith('SYNC')) return 'bg-cyan-50 text-cyan-700 border border-cyan-200';
    return 'bg-slate-100 text-slate-700 border border-slate-200';
  };

  const currentTargetDetails = getTargetDetails(explorerTarget);

  // Login View
  if (!token) {
    return (
      <div className="min-h-screen flex flex-col bg-cream">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-cream to-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="w-full max-w-md bg-white shadow-xl border-slate-200">
            <CardHeader className="text-center space-y-2 mb-2">
              <div className="mx-auto bg-rose-100 w-12 h-12 rounded-full flex items-center justify-center mb-1">
                <ShieldCheck className="w-6 h-6 text-rose-600" />
              </div>
              <CardTitle className="text-2xl font-serif font-bold text-warm-gray">Admin Portal</CardTitle>
              <CardDescription className="text-sm text-slate-500">Enter your credentials to access system settings.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Username</label>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Password</label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                {loginError && (
                  <div className="p-3 bg-red-50 text-red-600 text-sm border border-red-100 rounded-md flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <Button type="submit" disabled={loading} className="w-full h-11 bg-rose-600 hover:bg-rose-700 text-white font-medium transition-all duration-300 hover:shadow-md">
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> <span>Authenticating...</span></> : <><LogIn className="w-4 h-4 mr-2" /> <span>Secure Sign In</span></>}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Authenticated Admin Dashboard
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Standardized Project Navbar */}
      <Navbar />

      {/* Admin Context Subheader Banner */}
      <div className="bg-navy/90 border-b border-white/10 text-white py-2.5 px-4 sm:px-6 lg:px-8 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-xs">
            <Link to="/" className="text-slate-400 hover:text-white transition-colors">Home</Link>
            <span className="text-slate-600">/</span>
            <span className="text-teal-400 font-semibold">Admin Portal</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-300 font-medium">
              {ADMIN_NAV_TABS.find(t => t.id === activeTab)?.label || activeTab}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-slate-300 bg-white/10 px-2.5 py-1 rounded-md border border-white/10">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Authenticated as <strong className="text-white">admin</strong></span>
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout} 
              className="text-xs h-7 border-rose-400/40 text-rose-300 hover:bg-rose-500/20 hover:text-white bg-transparent"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-300">
        
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-navy flex items-center gap-2.5">
              <ShieldCheck className="w-7 h-7 text-rose-600" /> <span>Control Center & Administration</span>
            </h2>
            <p className="text-slate-500 mt-1 max-w-2xl text-xs sm:text-sm">
              Live telemetry, database operations, indicator overrides, AI models, algorithm parameters, and loading screen tips.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>System Online</span>
            </span>
          </div>
        </div>

        {/* Standardized Navigation Tabs Bar */}
        <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-2 shadow-xs flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {ADMIN_NAV_TABS.map(tab => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-navy text-white shadow-sm'
                    : 'text-slate-600 hover:text-navy hover:bg-slate-100/70'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-teal-400' : tab.color}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ========================================================= */}
        {/* TAB 1: OVERVIEW & SYSTEM HEALTH                           */}
        {/* ========================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* Top 4 KPI Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Total Records */}
              <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Data Points</div>
                  <div className="text-2xl font-serif font-bold text-warm-gray mt-1">
                    {statsLoading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : (stats?.total_records?.toLocaleString() || '18,400+')}
                  </div>
                  <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Turso Cloud Database
                  </div>
                </div>
                <div className="bg-blue-50 text-blue-600 p-3 rounded-xl">
                  <Database className="w-6 h-6" />
                </div>
              </div>

              {/* Countries */}
              <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Countries Tracked</div>
                  <div className="text-2xl font-serif font-bold text-warm-gray mt-1">
                    {statsLoading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : (stats?.total_countries || '193')}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium mt-1">
                    Global UN Members
                  </div>
                </div>
                <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl">
                  <Globe2 className="w-6 h-6" />
                </div>
              </div>

              {/* Targets */}
              <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">SDG Targets</div>
                  <div className="text-2xl font-serif font-bold text-warm-gray mt-1">
                    {statsLoading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : (stats?.total_targets || '169')}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium mt-1">
                    Across All 17 Goals
                  </div>
                </div>
                <div className="bg-purple-50 text-purple-600 p-3 rounded-xl">
                  <Target className="w-6 h-6" />
                </div>
              </div>

              {/* Query Cache */}
              <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cache Slices</div>
                  <div className="text-2xl font-serif font-bold text-warm-gray mt-1">
                    {statsLoading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : (stats?.cache_entries ?? 0)}
                  </div>
                  <div className="text-[11px] text-amber-600 font-medium mt-1 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> In-Memory TTL Cache
                  </div>
                </div>
                <div className="bg-amber-50 text-amber-600 p-3 rounded-xl">
                  <Zap className="w-6 h-6" />
                </div>
              </div>

            </div>

            {/* Service Health & Cache Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Service Health Grid (2 Cols) */}
              <div className="md:col-span-2 bg-white border border-slate-200 p-6 rounded-xl shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-semibold text-warm-gray flex items-center gap-2">
                    <Server className="w-4 h-4 text-blue-600" /> <span>Core Infrastructure Health</span>
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => fetchStats()} 
                    disabled={statsLoading}
                    className="h-8 text-xs text-slate-500 hover:text-navy"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${statsLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh Telemetry</span>
                  </Button>
                </div>

                <div className="space-y-3">
                  
                  {/* Turso Database */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <div>
                        <div className="text-sm font-semibold text-slate-800">Turso LibSQL Database</div>
                        <div className="text-xs text-slate-500">Primary serverless SQLite storage for global indicators</div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {stats?.turso_status === 'online' ? 'Operational' : 'Online'}
                    </span>
                  </div>

                  {/* FastAPI Backend */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <div>
                        <div className="text-sm font-semibold text-slate-800">FastAPI Trajectory Engine</div>
                        <div className="text-xs text-slate-500">Regression prediction, policy simulations, and caching</div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Active (Port 8000)
                    </span>
                  </div>

                  {/* OpenRouter AI */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${stats?.openrouter_status === 'configured' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <div>
                        <div className="text-sm font-semibold text-slate-800">OpenRouter AI Gateway</div>
                        <div className="text-xs text-slate-500">SDG Policy Copilot LLM completions proxy</div>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                      stats?.openrouter_status === 'configured'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {stats?.openrouter_status === 'configured' ? 'Configured' : 'Missing Key'}
                    </span>
                  </div>

                </div>
              </div>

              {/* Cache Management Card */}
              <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <h3 className="text-base font-semibold text-warm-gray flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" /> <span>Cache Management</span>
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    The backend memoizes country dataframes and calculations for 5 minutes (300s TTL). Purging flushes all cached slices instantly.
                  </p>
                </div>

                <div className="p-3 bg-amber-50/60 text-amber-900 border border-amber-200/60 rounded-lg text-xs">
                  Active entries: <strong className="font-mono">{stats?.cache_entries ?? 0}</strong> slices
                </div>

                {purgeMessage && (
                  <div className={`p-2.5 rounded-lg text-xs font-medium border ${
                    purgeStatus === 'success' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {purgeMessage}
                  </div>
                )}

                <Button
                  onClick={handlePurgeCache}
                  disabled={purgeStatus === 'purging'}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs h-10 shadow-sm transition-all"
                >
                  {purgeStatus === 'purging' ? (
                    <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> <span>Purging Cache...</span></>
                  ) : (
                    <><Trash2 className="w-3.5 h-3.5 mr-2 text-rose-400" /> <span>Purge Query Cache</span></>
                  )}
                </Button>
              </div>

            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: DATA EXPLORER & SINGLE-INDICATOR OVERRIDES         */}
        {/* ========================================================= */}
        {activeTab === 'data-explorer' && (
          <div className="space-y-6">
            
            {/* Filter Bar Card */}
            <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-semibold text-warm-gray flex items-center gap-2">
                    <TableIcon className="w-4 h-4 text-rose-600" /> <span>Target Data Explorer & Live Overwrite</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select a country and SDG target to inspect or adjust individual historical data points in Turso.
                  </p>
                </div>
                
                <Button
                  onClick={() => setIsInserting(!isInserting)}
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 self-start sm:self-auto"
                >
                  {isInserting ? <><X className="w-3.5 h-3.5 mr-1" /> Close Add Form</> : <><PlusCircle className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Add Data Point</>}
                </Button>
              </div>

              {/* Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Country Selection</label>
                  <Select value={explorerCountry} onValueChange={setExplorerCountry}>
                    <SelectTrigger className="h-10 text-xs bg-white border-slate-200">
                      <SelectValue placeholder="Select Country" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {COUNTRIES.map(c => (
                        <SelectItem key={c.code} value={c.code} className="text-xs">
                          {c.name} ({c.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">SDG Target Selection</label>
                  <Select value={explorerTarget} onValueChange={setExplorerTarget}>
                    <SelectTrigger className="h-10 text-xs bg-white border-slate-200">
                      <SelectValue placeholder="Select Target" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {TARGETS.map(t => (
                        <SelectItem key={t.code} value={t.code} className="text-xs">
                          Target {t.code}: {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Target Metadata Banner */}
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <strong className="text-slate-800">Target {explorerTarget}: </strong>
                  <span>{currentTargetDetails.title}</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                  <span>Unit: <strong className="text-slate-700">{currentTargetDetails.unit}</strong></span>
                  <span>•</span>
                  <span>Polarity: <strong className="text-slate-700">{currentTargetDetails.polarity === 'lower_is_better' ? 'Lower is Better' : 'Higher is Better'}</strong></span>
                </div>
              </div>

              {/* Status Message */}
              {recordActionMessage && (
                <div className={`p-3 rounded-lg text-xs font-medium border flex items-center gap-2 ${
                  recordActionStatus === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {recordActionStatus === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />}
                  <span>{recordActionMessage}</span>
                </div>
              )}
            </div>

            {/* Insert Form Card (Toggleable) */}
            {isInserting && (
              <div className="bg-emerald-50/50 border border-emerald-200 p-5 rounded-xl shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between border-b border-emerald-100 pb-2.5">
                  <h4 className="text-sm font-semibold text-emerald-900 flex items-center gap-1.5">
                    <PlusCircle className="w-4 h-4 text-emerald-600" />
                    <span>Add / Overwrite Data Point for {explorerCountry} (Target {explorerTarget})</span>
                  </h4>
                  <span className="text-[11px] text-emerald-700 font-medium">Auto-invalidates cache upon saving</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Year</label>
                    <Input
                      type="number"
                      min={1990}
                      max={2030}
                      value={newYear}
                      onChange={(e) => setNewYear(e.target.value)}
                      className="h-9 text-xs bg-white"
                      placeholder="e.g. 2024"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Indicator Value ({currentTargetDetails.unit})</label>
                    <Input
                      type="number"
                      step="any"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      className="h-9 text-xs bg-white"
                      placeholder="e.g. 18.5"
                    />
                  </div>

                  <div className="flex items-end gap-2">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer pb-2">
                      <input
                        type="checkbox"
                        checked={newImputed}
                        onChange={(e) => setNewImputed(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Mark as Imputed / Estimate</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-emerald-100">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsInserting(false)}
                    className="text-xs h-8 bg-white border-slate-200"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSaveRecord(newYear, newValue, newImputed)}
                    disabled={!newValue || recordActionStatus === 'saving'}
                    className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                  >
                    {recordActionStatus === 'saving' ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                    <span>Save Data Point</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Historical Records Table Card */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Recorded Annual Time Series ({records.length} Points)
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchRecords(explorerCountry, explorerTarget)}
                  disabled={recordsLoading}
                  className="h-7 text-xs text-slate-500 hover:text-navy px-2"
                >
                  <RefreshCw className={`w-3 h-3 mr-1 ${recordsLoading ? 'animate-spin' : ''}`} />
                  <span>Reload Table</span>
                </Button>
              </div>

              {recordsLoading ? (
                <div className="p-12 flex flex-col items-center justify-center space-y-2 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
                  <span className="text-xs">Loading database records...</span>
                </div>
              ) : records.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  No historical records found for {explorerCountry} (Target {explorerTarget}). Click "Add Data Point" above to create one.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                      <tr>
                        <th className="py-3 px-4">Year</th>
                        <th className="py-3 px-4">Indicator Value</th>
                        <th className="py-3 px-4">Origin / Quality</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {records.map((r) => {
                        const isEditing = editingYear === r.Year;
                        return (
                          <tr key={r.Year} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-navy">
                              {r.Year}
                            </td>

                            <td className="py-3 px-4">
                              {isEditing ? (
                                <Input
                                  type="number"
                                  step="any"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="h-8 text-xs w-36 bg-white"
                                />
                              ) : (
                                <span className="font-mono font-semibold text-slate-900 text-sm">
                                  {r.IndicatorValue !== null && r.IndicatorValue !== undefined
                                    ? Number(r.IndicatorValue).toFixed(2)
                                    : 'N/A'
                                  }
                                  <span className="ml-1 text-[11px] font-normal text-slate-400">
                                    {currentTargetDetails.unit}
                                  </span>
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              {isEditing ? (
                                <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={editImputed}
                                    onChange={(e) => setEditImputed(e.target.checked)}
                                    className="rounded border-slate-300 text-emerald-600"
                                  />
                                  <span>Imputed</span>
                                </label>
                              ) : (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  r.is_imputed
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                                }`}>
                                  {r.is_imputed ? 'Imputed / ML Fill' : 'Official Report'}
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-4 text-right">
                              {isEditing ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveRecord(r.Year, editValue, editImputed)}
                                    disabled={recordActionStatus === 'saving'}
                                    className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2.5"
                                  >
                                    <Save className="w-3 h-3 mr-1" /> Save
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingYear(null)}
                                    className="h-7 text-xs bg-white text-slate-600 px-2"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setEditingYear(r.Year);
                                      setEditValue(String(r.IndicatorValue ?? ''));
                                      setEditImputed(Boolean(r.is_imputed));
                                    }}
                                    className="h-7 text-xs text-slate-600 hover:text-navy hover:bg-slate-100 px-2"
                                  >
                                    <Edit2 className="w-3 h-3 mr-1 text-slate-500" /> Edit
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteRecord(r.Year)}
                                    className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: AI COPILOT & LLM SETTINGS                          */}
        {/* ========================================================= */}
        {activeTab === 'ai-config' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Model & Persona Configuration */}
            <div className="border border-slate-200 bg-white p-6 sm:p-8 space-y-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
              <div>
                <h3 className="text-xl font-serif font-semibold flex items-center gap-2 text-warm-gray">
                  <Bot className="w-5 h-5 text-indigo-600" /> <span>AI Policy Copilot Engine</span>
                </h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  Configure the primary LLM model and conversational persona powering the SDG Policy Copilot and automated trajectory synthesis.
                </p>
              </div>

              {/* Model Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-600" /> Active LLM Completion Model
                </label>
                <Select value={aiModel} onValueChange={setAiModel}>
                  <SelectTrigger className="h-10 text-xs bg-white border-slate-200">
                    <SelectValue placeholder="Select AI Model" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_AI_MODELS.map(m => (
                      <SelectItem key={m.id} value={m.id} className="text-xs">
                        {m.name} ({m.tier})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-slate-400">
                  Proxied through OpenRouter with multi-model fallback resiliency.
                </p>
              </div>

              {/* Persona Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Copilot Analytical Persona
                </label>
                <Select value={aiPersona} onValueChange={setAiPersona}>
                  <SelectTrigger className="h-10 text-xs bg-white border-slate-200">
                    <SelectValue placeholder="Select Analytical Persona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="un_advisor" className="text-xs">Senior UN Policy Advisor (Default)</SelectItem>
                    <SelectItem value="data_scientist" className="text-xs">SDG Data Scientist & Quantitative Lead</SelectItem>
                    <SelectItem value="economist" className="text-xs">Senior Macroeconomist & Fiscal Strategist</SelectItem>
                    <SelectItem value="youth_advocate" className="text-xs">Global Youth & Equity Ambassador</SelectItem>
                  </SelectContent>
                </Select>

                {/* Persona Preview Box */}
                {PERSONA_DESCRIPTIONS[aiPersona] && (
                  <div className={`p-3 rounded-lg border text-xs space-y-1 ${PERSONA_DESCRIPTIONS[aiPersona].accent}`}>
                    <div className="font-semibold">{PERSONA_DESCRIPTIONS[aiPersona].title}</div>
                    <div className="text-[11px] leading-relaxed opacity-90">{PERSONA_DESCRIPTIONS[aiPersona].desc}</div>
                  </div>
                )}
              </div>

              {/* Save Button */}
              <Button
                onClick={handleUpdateAiConfig}
                disabled={aiConfigStatus === 'saving'}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm h-11 transition-all duration-300 hover:shadow-md"
              >
                {aiConfigStatus === 'saving' ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> <span>Saving AI Config...</span></> :
                  aiConfigStatus === 'success' ? <><CheckCircle2 className="w-4 h-4 mr-2 text-green-300" /> <span>AI Config Saved Successfully</span></> :
                    <span>Apply AI Configuration</span>}
              </Button>
            </div>

            {/* Hyperparameters & Emergency Fallback */}
            <div className="border border-slate-200 bg-white p-6 sm:p-8 space-y-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col justify-between">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-serif font-semibold flex items-center gap-2 text-warm-gray">
                    <SlidersHorizontal className="w-5 h-5 text-amber-500" /> <span>Temperature & Failover</span>
                  </h3>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                    Control response determinism and manage system fallback modes.
                  </p>
                </div>

                {/* Temperature Slider */}
                <div className="space-y-3">
                  <div className="flex justify-between text-xs items-center bg-slate-50 p-2.5 rounded-md border border-slate-100">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-500" /> LLM Temperature (Creativity)
                    </span>
                    <span className="font-mono font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                      {aiTemperature.toFixed(2)}
                    </span>
                  </div>

                  <Slider
                    min={0.0}
                    max={1.0}
                    step={0.05}
                    value={[aiTemperature]}
                    onValueChange={(vals) => setAiTemperature(vals[0])}
                    className="w-full py-2"
                  />

                  <div className="flex justify-between text-[11px] font-medium text-slate-400">
                    <span>Factual & Precise (0.0)</span>
                    <span>Brainstorming (1.0)</span>
                  </div>
                </div>

                {/* Emergency Mock Mode Toggle */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-800">Emergency Mock Data Fallback</div>
                      <div className="text-[11px] text-slate-500">Enable local statistical mocks when upstream APIs are offline</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={emergencyMockMode}
                        onChange={(e) => setEmergencyMockMode(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 text-slate-600 text-xs border border-slate-200 rounded-lg">
                <strong>Storage Notice:</strong> All AI hyperparameters are synchronized across Turso Cloud database and apply dynamically to all live Copilot conversations.
              </div>
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: ALGORITHMS & DATA PIPELINE                         */}
        {/* ========================================================= */}
        {activeTab === 'algorithms' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Data Sync Hub */}
            <div className="border border-slate-200 bg-white p-6 sm:p-8 space-y-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-serif font-semibold flex items-center gap-2 text-warm-gray">
                    <Database className="w-5 h-5 text-blue-500" /> <span>Incremental Data Sync</span>
                  </h3>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                    Trigger a background sync to fetch the latest UN, WHO, and World Bank datasets. This pipeline performs a surgical update rather than a full rebuild.
                  </p>
                </div>
                <div className="p-4 bg-blue-50/50 text-blue-800 text-xs sm:text-sm border border-blue-100 rounded-md">
                  <strong>System Notice:</strong> This triggers the <code>backend-ci.yml</code> <strong>GitHub Action</strong> to scrape global APIs on GitHub servers, keeping the Render web server performant without timeouts.
                </div>
              </div>
              <div>
                <Button
                  onClick={handleSync}
                  disabled={syncStatus === 'syncing'}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm h-11 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                >
                  {syncStatus === 'syncing' ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> <span>Dispatching GitHub Action...</span></> :
                    syncStatus === 'success' ? <><CheckCircle2 className="w-4 h-4 mr-2 text-green-300" /> <span>GitHub Action Triggered Successfully</span></> :
                      <span>Trigger Database Sync</span>}
                </Button>
                {syncStatus === 'locked' && <p className="text-sm text-amber-500 text-center font-medium mt-2 animate-in fade-in">A sync is already in progress. Please wait.</p>}
                {syncStatus === 'error' && <p className="text-sm text-red-500 text-center font-medium mt-2 animate-in fade-in">Failed to trigger sync.</p>}
              </div>
            </div>

            {/* Algorithm Configurator */}
            <div className="border border-slate-200 bg-white p-6 sm:p-8 space-y-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
              <div>
                <h3 className="text-xl font-serif font-semibold flex items-center gap-2 text-warm-gray">
                  <Sliders className="w-5 h-5 text-purple-500" /> <span>ML & Trajectory Hyperparameters</span>
                </h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  Fine-tune outlier detection, forecasting interval bounds, and missing data imputation strategies.
                </p>
              </div>

              {/* Anomaly Detection Contamination */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs items-center bg-slate-50 p-2.5 rounded-md border border-slate-100">
                  <span className="font-semibold text-slate-700">Anomaly Contamination Ratio</span>
                  <span className="font-mono font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded text-xs">{contamination.toFixed(2)}</span>
                </div>
                <Slider
                  min={0.01}
                  max={0.5}
                  step={0.01}
                  value={[contamination]}
                  onValueChange={(vals) => setContamination(vals[0])}
                  className="w-full py-1.5"
                />
                <div className="flex justify-between text-[11px] font-medium text-slate-400">
                  <span>Less Sensitive (0.01)</span>
                  <span>More Sensitive (0.50)</span>
                </div>
              </div>

              {/* Confidence Interval Bandwidth */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Forecasting Confidence Interval</label>
                <Select value={String(forecastConfidence)} onValueChange={(v) => setForecastConfidence(parseFloat(v))}>
                  <SelectTrigger className="h-9 text-xs bg-white border-slate-200">
                    <SelectValue placeholder="Select Confidence Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.80" className="text-xs">80% Interval (Tight / Conservative)</SelectItem>
                    <SelectItem value="0.90" className="text-xs">90% Interval (Standard UN Baseline)</SelectItem>
                    <SelectItem value="0.95" className="text-xs">95% Interval (Recommended Benchmark)</SelectItem>
                    <SelectItem value="0.99" className="text-xs">99% Interval (High Uncertainty Coverage)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Default Imputation Strategy */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Historical Gap Imputation Technique</label>
                <Select value={imputationMethod} onValueChange={setImputationMethod}>
                  <SelectTrigger className="h-9 text-xs bg-white border-slate-200">
                    <SelectValue placeholder="Select Imputation Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linear" className="text-xs">Piecewise Linear Interpolation (Default)</SelectItem>
                    <SelectItem value="forward_fill" className="text-xs">Last Observation Carried Forward (LOCF)</SelectItem>
                    <SelectItem value="mean" className="text-xs">Historical Baseline Mean Filling</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 bg-purple-50 text-purple-800 text-xs border border-purple-100 rounded-md flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-purple-600" />
                <span className="leading-relaxed">Saved securely to Turso <code>system_config</code> table; dynamically applies across all live predictions.</span>
              </div>

              <Button
                onClick={handleConfigUpdate}
                disabled={configStatus === 'saving'}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-sm h-11 transition-all duration-300 hover:shadow-md"
              >
                {configStatus === 'saving' ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> <span>Saving Hyperparameters...</span></> :
                  configStatus === 'success' ? <><CheckCircle2 className="w-4 h-4 mr-2 text-green-300" /> <span>Configuration Saved</span></> :
                    <span>Apply Algorithm Configuration</span>}
              </Button>
              {configStatus === 'error' && <p className="text-sm text-red-500 text-center font-medium animate-in fade-in">Failed to save configuration.</p>}
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: AUDIT & ACTIVITY TRAIL                             */}
        {/* ========================================================= */}
        {activeTab === 'audit-logs' && (
          <div className="space-y-6">
            
            {/* Header Actions Card */}
            <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-serif font-semibold text-warm-gray flex items-center gap-2">
                  <ScrollText className="w-5 h-5 text-amber-600" />
                  <span>System Activity & Audit Trail</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                  Immutable audit records tracking data overrides, cache invalidations, AI model switches, algorithm updates, and authentication events.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchAuditLogs()}
                  disabled={auditLogsLoading}
                  className="h-9 text-xs bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${auditLogsLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportAuditLogsCsv}
                  disabled={!auditLogs.length}
                  className="h-9 text-xs bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                  <span>Export CSV</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAuditLogs}
                  disabled={auditClearStatus === 'clearing' || !auditLogs.length}
                  className="h-9 text-xs border-rose-200 text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  <span>Clear History</span>
                </Button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search audit trail by description, action, or actor..."
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    className="pl-9 h-10 text-xs bg-slate-50/50 border-slate-200"
                  />
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {['ALL', 'AUTH', 'DATA', 'AI', 'ALGORITHM', 'CACHE', 'PIPELINE'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setAuditFilter(cat)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                        auditFilter === cat
                          ? 'bg-navy text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Audit Log Table */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              {auditLogsLoading ? (
                <div className="p-12 flex flex-col items-center justify-center space-y-2 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
                  <span className="text-xs">Loading audit trail...</span>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  No audit trail records found matching the current search or filter.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                      <tr>
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4">Action Category</th>
                        <th className="py-3 px-4">Actor</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Event Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {filteredLogs.map((log, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getCategoryBadge(log.action_type)}`}>
                              {log.action_type}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                            {log.actor || 'admin'}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.status === 'FAILED'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {log.status || 'SUCCESS'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-700 text-xs leading-relaxed max-w-md">
                            {log.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: SECURITY & ACCESS CONTROL                          */}
        {/* ========================================================= */}
        {activeTab === 'security' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Change Password Card */}
            <div className="border border-slate-200 bg-white p-6 sm:p-8 space-y-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
              <div>
                <h3 className="text-xl font-serif font-semibold flex items-center gap-2 text-warm-gray">
                  <KeyRound className="w-5 h-5 text-emerald-600" /> <span>Change Admin Password</span>
                </h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  Update your master administrator password. Password hashes are generated using Bcrypt (Salt Factor 12) and stored in Turso.
                </p>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Current Password</label>
                  <div className="relative">
                    <Input
                      type={showCurrentPw ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className="h-10 text-xs pr-10 bg-white"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPw(!showCurrentPw)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">New Password (min 6 characters)</label>
                  <div className="relative">
                    <Input
                      type={showNewPw ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      className="h-10 text-xs pr-10 bg-white"
                      placeholder="Enter new strong password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Confirm New Password</label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-10 text-xs bg-white"
                    placeholder="Repeat new password"
                  />
                </div>

                {pwChangeMessage && (
                  <div className={`p-3 rounded-lg text-xs font-medium border flex items-center gap-2 ${
                    pwChangeStatus === 'success'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {pwChangeStatus === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />}
                    <span>{pwChangeMessage}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={pwChangeStatus === 'saving'}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm h-11 transition-all duration-300 hover:shadow-md"
                >
                  {pwChangeStatus === 'saving' ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> <span>Updating Password...</span></> :
                    <><Lock className="w-4 h-4 mr-2" /> <span>Update Password</span></>}
                </Button>
              </form>
            </div>

            {/* Session & Security Context Card */}
            <div className="border border-slate-200 bg-white p-6 sm:p-8 space-y-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col justify-between">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-serif font-semibold flex items-center gap-2 text-warm-gray">
                    <ShieldCheck className="w-5 h-5 text-rose-600" /> <span>Session & Access Security</span>
                  </h3>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                    Active authentication context and cryptographic settings for this session.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                    <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-emerald-600" /> Active Identity
                    </span>
                    <span className="font-mono font-bold text-navy bg-white px-2.5 py-1 rounded border border-slate-200">
                      admin
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                    <span className="font-semibold text-slate-600">Token Algorithm</span>
                    <span className="font-mono text-slate-700">JWT (HS256)</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                    <span className="font-semibold text-slate-600">Password Hashing</span>
                    <span className="font-mono text-slate-700">Bcrypt (Salt 12)</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                    <span className="font-semibold text-slate-600">Session Expiration</span>
                    <span className="font-mono text-slate-700">30 minutes</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100">
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full text-xs h-10 border-rose-200 text-rose-600 hover:bg-rose-50"
                >
                  Terminate Active Session & Sign Out
                </Button>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 7: LOADING TIPS & TRIVIA MANAGER                      */}
        {/* ========================================================= */}
        {activeTab === 'trivia' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header Control Card */}
            <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-warm-gray flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" /> <span>Loading Screen Tips, Tricks & Trivia</span>
                  </h3>
                  <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                    Short facts, website tips, and United Nations trivia that dynamically rotate during forecast calculations and page transitions to keep users informed and engaged.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <Button
                    onClick={() => fetchTriviaList()}
                    variant="outline"
                    size="sm"
                    disabled={triviaLoading}
                    className="text-xs h-8 bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 mr-1.5 text-slate-500 ${triviaLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </Button>
                  
                  <Button
                    onClick={handleOpenCreateTrivia}
                    size="sm"
                    className="text-xs h-8 bg-rose-600 hover:bg-rose-700 text-white font-medium shadow-sm transition-all"
                  >
                    <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                    <span>Add New Tip / Trivia</span>
                  </Button>
                </div>
              </div>

              {/* Status / Alert Banner */}
              {triviaMessage && (
                <div className={`p-3 rounded-lg text-xs font-medium border flex items-center gap-2 ${
                  triviaStatus === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {triviaStatus === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  )}
                  <span>{triviaMessage}</span>
                </div>
              )}

              {/* Metric Counter Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-center">
                  <div className="text-[11px] font-medium text-slate-500">Total Curated</div>
                  <div className="text-xl font-bold font-mono text-navy mt-0.5">{triviaList.length}</div>
                </div>
                <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-100 text-center">
                  <div className="text-[11px] font-medium text-emerald-700">Active Rotating</div>
                  <div className="text-xl font-bold font-mono text-emerald-700 mt-0.5">
                    {triviaList.filter(t => t.is_active).length}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-100 text-center">
                  <div className="text-[11px] font-medium text-blue-700">Website Tips</div>
                  <div className="text-xl font-bold font-mono text-blue-700 mt-0.5">
                    {triviaList.filter(t => t.category === 'Website Tip').length}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-emerald-50/40 border border-emerald-100 text-center">
                  <div className="text-[11px] font-medium text-emerald-800">SDG Facts</div>
                  <div className="text-xl font-bold font-mono text-emerald-800 mt-0.5">
                    {triviaList.filter(t => t.category === 'SDG Fact').length}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-purple-50/60 border border-purple-100 text-center col-span-2 sm:col-span-1">
                  <div className="text-[11px] font-medium text-purple-700">UN Trivia</div>
                  <div className="text-xl font-bold font-mono text-purple-700 mt-0.5">
                    {triviaList.filter(t => t.category === 'UN Trivia').length}
                  </div>
                </div>
              </div>

              {/* Search & Filter Toolbar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search by keywords or text..."
                    value={triviaSearch}
                    onChange={(e) => setTriviaSearch(e.target.value)}
                    className="pl-8 h-9 text-xs bg-slate-50 border-slate-200"
                  />
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-medium text-slate-400 mr-1 flex items-center gap-1">
                    <Filter className="w-3 h-3" /> Filter:
                  </span>
                  {['ALL', 'Website Tip', 'SDG Fact', 'UN Trivia'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setTriviaFilter(cat)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                        triviaFilter === cat
                          ? 'bg-navy text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Timing & Experience Configuration Card */}
            <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-sm font-semibold text-warm-gray flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-teal-600" />
                    <span>Loading Screen Timing & Experience Settings</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Adjust how fast messages rotate on loading screens, toggle allowed categories, or test in real time.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowLiveTimingPreview(!showLiveTimingPreview)}
                    className="text-xs h-8 text-slate-700 border-slate-200"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1 text-teal-600" />
                    <span>{showLiveTimingPreview ? 'Hide Live Preview' : 'Test Live Preview'}</span>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveLoadingConfig}
                    disabled={triviaTimingSaving}
                    className="text-xs h-8 bg-teal-600 hover:bg-teal-700 text-white font-medium shadow-sm transition-all"
                  >
                    {triviaTimingSaving ? (
                      <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Saving...</>
                    ) : (
                      <><Save className="w-3.5 h-3.5 mr-1.5" /> Save Timing Options</>
                    )}
                  </Button>
                </div>
              </div>

              {triviaTimingMessage && (
                <div className={`p-2.5 rounded-lg text-xs font-medium border flex items-center gap-2 ${
                  triviaTimingStatus === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {triviaTimingStatus === 'success' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                  )}
                  <span>{triviaTimingMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Rotation Duration Setting */}
                <div className="space-y-3 p-4 rounded-xl bg-slate-50/70 border border-slate-200/70 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <span>Rotation Duration per Tip</span>
                      </label>
                      <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                        {triviaInterval} seconds
                      </span>
                    </div>

                    <input
                      type="range"
                      min="2.0"
                      max="10.0"
                      step="0.5"
                      value={triviaInterval}
                      onChange={(e) => setTriviaInterval(parseFloat(e.target.value))}
                      className="w-full accent-teal-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                    />

                    <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                      <span>Fast (2.0s)</span>
                      <span className="text-teal-700 font-semibold">Recommended (3.5s - 4.5s)</span>
                      <span>Relaxed (10.0s)</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed pt-1 border-t border-slate-200/50">
                    Controls how long each trivia or tip stays visible before automatically cycling to the next message.
                  </p>
                </div>

                {/* Allowed Categories Toggle */}
                <div className="space-y-3 p-4 rounded-xl bg-slate-50/70 border border-slate-200/70">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Active Categories in Loading Screen Rotation
                  </label>
                  <div className="space-y-2">
                    {[
                      { id: 'Website Tip', label: 'Website Tips & Tricks', icon: '💡', desc: 'Short navigation shortcuts and tool highlights' },
                      { id: 'SDG Fact', label: 'SDG Facts & Targets', icon: '🌱', desc: 'UN 2030 quantitative goals and key milestones' },
                      { id: 'UN Trivia', label: 'United Nations Trivia', icon: '🇺🇳', desc: 'Treaties, member states, and historical facts' }
                    ].map(cat => (
                      <label
                        key={cat.id}
                        className={`flex items-start gap-3 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                          triviaAllowedCategories.includes(cat.id)
                            ? 'bg-white border-teal-300 shadow-xs'
                            : 'bg-slate-100/60 border-slate-200 text-slate-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={triviaAllowedCategories.includes(cat.id)}
                          onChange={() => handleToggleAllowedCategory(cat.id)}
                          className="mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                        />
                        <div className="min-w-0">
                          <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <span>{cat.icon}</span>
                            <span>{cat.label}</span>
                          </span>
                          <span className="text-[11px] text-slate-500 block">{cat.desc}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Interactive Preview Box (Toggleable) */}
              {showLiveTimingPreview && (
                <div className="pt-2 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Live Loading Card Preview (Rotating every {triviaInterval}s)</span>
                    </span>
                    <span className="text-[11px] text-teal-700 font-medium">Real-time simulation</span>
                  </div>
                  <div className="max-w-xl mx-auto rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                    <LoadingTriviaCard 
                      isScoped={false}
                      customInterval={triviaInterval}
                      overrideTriviaList={filteredTrivia.length > 0 ? filteredTrivia : null}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Trivia Items List / Cards */}
            <div className="space-y-3">
              {triviaLoading && triviaList.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3">
                  <Loader2 className="w-6 h-6 animate-spin text-rose-600 mx-auto" />
                  <p className="text-xs text-slate-500">Loading tips & trivia items from Turso...</p>
                </div>
              ) : filteredTrivia.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3">
                  <Lightbulb className="w-8 h-8 text-amber-400 mx-auto" />
                  <div className="text-sm font-semibold text-slate-700">No matching tips or trivia found</div>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    {triviaSearch || triviaFilter !== 'ALL'
                      ? 'Try clearing your search term or selecting another category filter.'
                      : 'There are no items in the database yet. Click "Add New Tip / Trivia" above to create one.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredTrivia.map((item) => (
                    <div
                      key={item.id}
                      className={`bg-white border rounded-xl p-4 transition-all duration-200 hover:shadow-md flex flex-col justify-between gap-3 ${
                        item.is_active ? 'border-slate-200' : 'border-slate-200/60 opacity-60 bg-slate-50/50'
                      }`}
                    >
                      {/* Top Row: Icon + Badge + Active Switch */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200/60 flex items-center justify-center text-lg shadow-xs flex-shrink-0">
                            {item.icon || '💡'}
                          </div>
                          <div>
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getTriviaCategoryBadge(item.category)}`}>
                              {item.category}
                            </span>
                            <span className="ml-2 text-[10px] font-mono text-slate-400">#{item.id}</span>
                          </div>
                        </div>

                        {/* Status Toggle Badge */}
                        <button
                          onClick={() => handleToggleTriviaActive(item)}
                          title={item.is_active ? 'Click to deactivate' : 'Click to activate'}
                          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-all flex items-center gap-1 ${
                            item.is_active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${item.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                          <span>{item.is_active ? 'Active' : 'Inactive'}</span>
                        </button>
                      </div>

                      {/* Content Text */}
                      <p className="text-xs text-slate-700 leading-relaxed font-normal flex-1">
                        "{item.text}"
                      </p>

                      {/* Card Footer Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                        <span>{item.created_at ? new Date(item.created_at).toLocaleDateString() : 'System Seed'}</span>
                        <div className="flex items-center gap-1.5">
                          <Button
                            onClick={() => handleOpenEditTrivia(item)}
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-slate-600 hover:text-navy hover:bg-slate-100"
                          >
                            <Edit2 className="w-3 h-3 mr-1" />
                            <span>Edit</span>
                          </Button>
                          <Button
                            onClick={() => handleDeleteTriviaItem(item.id)}
                            variant="ghost"
                            size="sm"
                            disabled={deletingTriviaId === item.id}
                            className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          >
                            {deletingTriviaId === item.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <>
                                <Trash2 className="w-3 h-3 mr-1" />
                                <span>Delete</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Dialog for Add / Edit */}
            {isTriviaModalOpen && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h4 className="text-base font-semibold text-warm-gray flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>{editingTriviaItem ? 'Edit Tip / Trivia Item' : 'Add New Tip / Trivia Item'}</span>
                    </h4>
                    <button
                      onClick={() => setIsTriviaModalOpen(false)}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveTriviaItem} className="space-y-4">
                    {/* Category Selection */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Message Category</label>
                      <Select value={triviaFormCategory} onValueChange={setTriviaFormCategory}>
                        <SelectTrigger className="h-9 text-xs bg-white border-slate-200">
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Website Tip" className="text-xs">
                            💡 Website Tip (Navigation, keyboard shortcuts, features)
                          </SelectItem>
                          <SelectItem value="SDG Fact" className="text-xs">
                            🌱 SDG Fact (Sustainable Development Goals context & targets)
                          </SelectItem>
                          <SelectItem value="UN Trivia" className="text-xs">
                            🇺🇳 UN Trivia (United Nations history, member states & treaties)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Icon Selection & Presets */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                        <span>Display Emoji / Icon</span>
                        <span className="text-[11px] font-normal text-slate-400">Click a preset or enter any emoji</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="text"
                          value={triviaFormIcon}
                          onChange={(e) => setTriviaFormIcon(e.target.value)}
                          maxLength={4}
                          className="w-16 h-9 text-center text-lg bg-white border-slate-200"
                        />
                        <div className="flex items-center gap-1 flex-wrap flex-1">
                          {TRIVIA_EMOJI_PRESETS.map((emoji) => (
                            <button
                              type="button"
                              key={emoji}
                              onClick={() => setTriviaFormIcon(emoji)}
                              className={`w-8 h-8 rounded-md text-sm transition-all border ${
                                triviaFormIcon === emoji
                                  ? 'bg-amber-100 border-amber-300 scale-105'
                                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Text Area */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                        <span>Message Text</span>
                        <span className={`text-[11px] ${triviaFormText.length > 180 ? 'text-amber-600 font-semibold' : 'text-slate-400'}`}>
                          {triviaFormText.length}/200 chars
                        </span>
                      </label>
                      <textarea
                        value={triviaFormText}
                        onChange={(e) => setTriviaFormText(e.target.value)}
                        required
                        maxLength={220}
                        rows={3}
                        placeholder="e.g. SDG 13 focuses on Climate Action with national mitigation commitments."
                        className="w-full text-xs p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none font-sans"
                      />
                      <p className="text-[11px] text-slate-400">
                        Short, punchy 1-2 sentence messages work best for quick reading while loading.
                      </p>
                    </div>

                    {/* Active Checkbox */}
                    <div className="pt-1">
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={triviaFormActive}
                          onChange={(e) => setTriviaFormActive(e.target.checked)}
                          className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 w-4 h-4"
                        />
                        <span>Active in loading screen rotation immediately</span>
                      </label>
                    </div>

                    {/* Modal Actions */}
                    <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsTriviaModalOpen(false)}
                        className="text-xs h-9 border-slate-200 text-slate-600"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={isSavingTrivia || !triviaFormText.trim()}
                        className="text-xs h-9 bg-rose-600 hover:bg-rose-700 text-white font-medium shadow-sm transition-all"
                      >
                        {isSavingTrivia ? (
                          <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Saving...</>
                        ) : (
                          <><Save className="w-3.5 h-3.5 mr-1.5" /> Save Item</>
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}

          </div>
        )}

      </main>
    </div>
  );
}
