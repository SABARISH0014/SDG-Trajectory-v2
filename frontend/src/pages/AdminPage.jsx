import { API_BASE_URL } from '@/config';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ShieldCheck, Database, Sliders, LogIn, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/input';
import { Slider } from '../components/ui/slider';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function AdminPage() {
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Dashboard states
  const [contamination, setContamination] = useState(0.1);
  const [syncStatus, setSyncStatus] = useState('');
  const [configStatus, setConfigStatus] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoginError('');
    try {
      const response = await axios.post(`${API_BASE_URL}/api/admin/login`, {
        username,
        password
      });
      setToken(response.data.token);
    } catch (err) {
      setLoginError('Invalid admin credentials. (Hint: admin / admin123)');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncStatus('syncing');
    try {
      await axios.post(`${API_BASE_URL}/api/admin/sync`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSyncStatus('success');
      setTimeout(() => setSyncStatus(''), 3000);
    } catch (err) {
      console.error(err);
      setSyncStatus('error');
    }
  };

  const handleConfigUpdate = async () => {
    setConfigStatus('saving');
    try {
      await axios.post(`${API_BASE_URL}/api/admin/config`, { contamination }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConfigStatus('success');
      setTimeout(() => setConfigStatus(''), 3000);
    } catch (err) {
      console.error(err);
      setConfigStatus('error');
    }
  };

  const handleLogout = () => {
    setToken(null);
  };

  if (!token) {
    return (
      <div className="h-screen overflow-hidden flex flex-col bg-cream">
        <header className="flex-none w-full h-14 bg-navy/95 backdrop-blur-md z-50 border-b border-white/10 flex items-center justify-between px-6">
          <Link to="/" className="flex items-center text-sm font-semibold tracking-wide text-white hover:text-slate-300 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> <span>Back to Forecaster</span>
          </Link>
          <LanguageSwitcher />
        </header>
        <div className="flex-1 flex items-center justify-center p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="w-full max-w-md bg-white">
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
                  <div className="p-3 bg-red-50 text-red-600 text-sm border border-red-100 rounded-md">
                    {loginError}
                  </div>
                )}

                <Button type="submit" disabled={loading} className="w-full h-10 bg-rose-600 hover:bg-rose-700 text-white">
                  {loading ? <span>Authenticating...</span> : <><LogIn className="w-4 h-4 mr-2" /> <span>Sign In</span></>}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-cream flex flex-col">
      <header className="flex-none w-full h-14 bg-navy/95 backdrop-blur-md z-50 border-b border-white/10 flex items-center justify-between px-6">
        <Link to="/" className="flex items-center text-sm font-semibold tracking-wide text-white hover:text-slate-300 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> <span>Back to Forecaster</span>
        </Link>
        <LanguageSwitcher />
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 flex flex-col justify-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 scale-[0.80] origin-center">
        <div className="flex items-end justify-between border-b border-slate-200 pb-4 mb-2">
          <div>
            <h2 className="text-3xl font-serif font-bold text-warm-gray flex items-center gap-2">
              <ShieldCheck className="w-8 h-8 text-rose-600" /> <span>System Administration</span>
            </h2>
            <p className="text-slate-500 mt-2 max-w-2xl text-sm">
              Manage backend data pipelines, trigger master database syncs, and securely configure the AI Anomaly Detection sensitivity parameters.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="text-slate-600 border-slate-200 hover:bg-slate-50 bg-white h-9 shadow-sm">
            Secure Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Data Sync Hub */}
          <div className="border border-slate-200 bg-white p-8 space-y-6 rounded-lg shadow-sm">
            <div>
              <h3 className="text-xl font-serif font-semibold flex items-center gap-2 text-warm-gray">
                <Database className="w-5 h-5 text-blue-500" /> <span>Incremental Data Sync</span>
              </h3>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">Trigger a background sync to fetch the latest UN, WHO, and World Bank datasets. This pipeline performs a surgical update rather than a full rebuild.</p>
            </div>
            <div className="p-4 bg-blue-50/50 text-blue-800 text-sm border border-blue-100 rounded-md">
              <strong>System Notice:</strong> This sync incrementally updates Turso database records using ON CONFLICT DO UPDATE. It runs asynchronously without blocking active API requests.
            </div>
            <Button
              onClick={handleSync}
              disabled={syncStatus === 'syncing'}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm h-11 transition-all"
            >
              {syncStatus === 'syncing' ? <span>Sync triggered (running in background)...</span> :
                syncStatus === 'success' ? <><CheckCircle2 className="w-4 h-4 mr-2" /> <span>Sync Triggered Successfully</span></> :
                  <span>Trigger Database Sync</span>}
            </Button>
            {syncStatus === 'error' && <p className="text-sm text-red-500 text-center font-medium animate-in fade-in">Failed to trigger sync.</p>}
          </div>

          {/* Algorithm Configurator */}
          <div className="border border-slate-200 bg-white p-8 space-y-8 rounded-lg shadow-sm">
            <div>
              <h3 className="text-xl font-serif font-semibold flex items-center gap-2 text-warm-gray">
                <Sliders className="w-5 h-5 text-purple-500" /> <span>Algorithm Configurator</span>
              </h3>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">Adjust the AI Anomaly Detection sensitivity (IsolationForest <span className="notranslate font-mono bg-slate-100 px-1 rounded text-xs">contamination</span> parameter).</p>
            </div>
            <div className="space-y-5">
              <div className="flex justify-between text-sm items-center bg-slate-50 p-3 rounded-md border border-slate-100">
                <span className="font-medium text-slate-700">Contamination Ratio</span>
                <span className="font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded text-base">{contamination.toFixed(2)}</span>
              </div>
              <Slider
                min={0.01}
                max={0.5}
                step={0.01}
                value={[contamination]}
                onValueChange={(vals) => setContamination(vals[0])}
                className="w-full py-2"
              />
              <div className="flex justify-between text-[11px] font-medium text-slate-400">
                <span>Less Sensitive (0.01)</span>
                <span>More Sensitive (0.50)</span>
              </div>
            </div>

            <div className="p-4 bg-purple-50/50 text-purple-800 text-sm border border-purple-100 rounded-md flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-600" />
              <span className="leading-relaxed">Changes are saved atomically to <span className="notranslate font-mono">admin_config.json</span> and apply instantly to all new AI forecast requests.</span>
            </div>

            <Button
              onClick={handleConfigUpdate}
              disabled={configStatus === 'saving'}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white shadow-sm h-11 transition-all"
            >
              {configStatus === 'saving' ? <span>Saving Configuration...</span> :
                configStatus === 'success' ? <><CheckCircle2 className="w-4 h-4 mr-2" /> <span>Configuration Saved</span></> :
                  <span>Apply Configuration</span>}
            </Button>
            {configStatus === 'error' && <p className="text-sm text-red-500 text-center font-medium animate-in fade-in">Failed to save configuration.</p>}
          </div>
        </div>
      </main>
    </div>
  );
}
