import { API_BASE_URL } from '@/config';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ShieldCheck, Database, Sliders, LogIn, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/input';
import { Slider } from '../components/ui/slider';

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
      <div className="min-h-screen flex flex-col bg-cream">
        <header className="bg-navy h-14 flex items-center px-6">
          <Link to="/" className="flex items-center text-sm font-medium text-slate-300 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to SDG Trajectory
          </Link>
        </header>
        <div className="flex-1 flex items-center justify-center p-6">
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
                  {loading ? "Authenticating..." : <><LogIn className="w-4 h-4 mr-2" /> Sign In</>}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-navy h-14 flex items-center px-6">
        <Link to="/" className="flex items-center text-sm font-medium text-slate-300 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to SDG Trajectory
        </Link>
      </header>
      
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-serif font-bold text-warm-gray flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-rose-600" /> System Administration
            </h2>
            <p className="text-slate-500 mt-1">Manage backend data pipelines and algorithm configurations.</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="text-slate-500 border-slate-200">
            Log out
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Data Sync Hub */}
          <div className="border border-slate-200 bg-white p-6 space-y-4">
            <div>
              <h3 className="text-lg font-serif font-semibold flex items-center gap-2 text-warm-gray">
                <Database className="w-5 h-5 text-blue-500" /> Data Sync Hub
              </h3>
              <p className="text-sm text-slate-500 mt-1">Trigger a background rebuild of the SQLite database using the latest data pipeline scripts.</p>
            </div>
            <div className="p-4 bg-blue-50 text-blue-800 text-sm border border-blue-100">
              Warning: Syncing rebuilds the entire master grid. This process runs asynchronously and will not block API requests.
            </div>
            <Button 
              onClick={handleSync} 
              disabled={syncStatus === 'syncing'}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {syncStatus === 'syncing' ? "Sync triggered (running in background)..." : 
               syncStatus === 'success' ? <><CheckCircle2 className="w-4 h-4 mr-2" /> Sync Triggered Successfully</> : 
               "Trigger Database Sync"}
            </Button>
            {syncStatus === 'error' && <p className="text-sm text-red-500 text-center">Failed to trigger sync.</p>}
          </div>

          {/* Algorithm Configurator */}
          <div className="border border-slate-200 bg-white p-6 space-y-6">
            <div>
              <h3 className="text-lg font-serif font-semibold flex items-center gap-2 text-warm-gray">
                <Sliders className="w-5 h-5 text-purple-500" /> Algorithm Configurator
              </h3>
              <p className="text-sm text-slate-500 mt-1">Adjust the AI Anomaly Detection sensitivity (IsolationForest contamination parameter).</p>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-slate-700">Contamination Ratio</span>
                <span className="font-bold text-purple-600">{contamination.toFixed(2)}</span>
              </div>
              <Slider 
                min={0.01} 
                max={0.5} 
                step={0.01} 
                value={[contamination]}
                onValueChange={(vals) => setContamination(vals[0])}
                className="w-full py-2"
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>Less Sensitive (0.01)</span>
                <span>More Sensitive (0.50)</span>
              </div>
            </div>

            <div className="p-3 bg-purple-50 text-purple-800 text-xs border border-purple-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              Changes are saved atomically to admin_config.json and apply instantly to all new forecast requests.
            </div>

            <Button 
              onClick={handleConfigUpdate} 
              disabled={configStatus === 'saving'}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              {configStatus === 'saving' ? "Saving Configuration..." : 
               configStatus === 'success' ? <><CheckCircle2 className="w-4 h-4 mr-2" /> Configuration Saved</> : 
               "Apply Configuration"}
            </Button>
            {configStatus === 'error' && <p className="text-sm text-red-500 text-center">Failed to save configuration.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
