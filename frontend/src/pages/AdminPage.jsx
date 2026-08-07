import React, { useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { ShieldCheck, Database, Sliders, LogIn, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';

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
      const response = await axios.post('http://localhost:8000/api/admin/login', {
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
      await axios.post('http://localhost:8000/api/admin/sync', {}, {
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
      await axios.post('http://localhost:8000/api/admin/config', { contamination }, {
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
      <div className="flex-1 w-full flex items-center justify-center p-6 bg-slate-50 min-h-0 overflow-y-auto">
        <Card className="w-full max-w-md border-slate-200 shadow-xl animate-in slide-in-from-bottom-4 fade-in">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto bg-rose-100 w-12 h-12 rounded-full flex items-center justify-center mb-2">
              <ShieldCheck className="w-6 h-6 text-rose-600" />
            </div>
            <CardTitle className="text-2xl">Admin Portal</CardTitle>
            <CardDescription>Enter your credentials to access system settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Username</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>
              
              {loginError && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
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
    );
  }

  return (
    <div className="flex-1 w-full p-6 space-y-6 bg-slate-50 min-h-0 overflow-y-auto animate-in slide-in-from-bottom-4 fade-in">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-rose-600" /> System Administration
            </h2>
            <p className="text-slate-500">Manage backend data pipelines and algorithm configurations.</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="text-slate-500">
            Log out
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Data Sync Hub */}
          <Card className="border-slate-200 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-500" /> Data Sync Hub
              </CardTitle>
              <CardDescription>Trigger a background rebuild of the SQLite database using the latest data pipeline scripts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 text-blue-800 text-sm rounded-lg border border-blue-100">
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
            </CardContent>
          </Card>

          {/* Algorithm Configurator */}
          <Card className="border-slate-200 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sliders className="w-5 h-5 text-purple-500" /> Algorithm Configurator
              </CardTitle>
              <CardDescription>Adjust the AI Anomaly Detection sensitivity (IsolationForest contamination parameter).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-slate-700">Contamination Ratio</span>
                  <span className="font-bold text-purple-600">{contamination.toFixed(2)}</span>
                </div>
                <input 
                  type="range" 
                  min="0.01" 
                  max="0.5" 
                  step="0.01" 
                  value={contamination}
                  onChange={(e) => setContamination(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Less Sensitive (0.01)</span>
                  <span>More Sensitive (0.50)</span>
                </div>
              </div>

              <div className="p-3 bg-purple-50 text-purple-800 text-xs rounded-lg border border-purple-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                Changes are saved atomically to admin_config.json and apply instantly to all new forecast requests. No server restart required.
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
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
