import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function AdminPanel() {
  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-700">
      <Card className="border-slate-200 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2 text-rose-600">
            <ShieldCheck className="w-6 h-6" />
            Administration & System Maintenance (Module 5)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
            <div className="bg-rose-50 p-4 rounded-full">
              <ShieldCheck className="w-12 h-12 text-rose-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">Secure Access Required</h3>
            <p className="text-slate-500 max-w-lg">
              This area contains the Data Synchronization Hub and AI Algorithm Configurator. Only authenticated backend administrators may trigger dataset refreshes or tweak anomaly detection sensitivity.
            </p>
            <Button className="mt-4 shadow-sm bg-rose-600 hover:bg-rose-700 text-white" variant="default">
              Login to Admin Portal <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
