import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { SlidersHorizontal, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function PolicySimulator() {
  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-700">
      <Card className="border-slate-200 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <SlidersHorizontal className="w-6 h-6 text-primary" />
            What-If Policy Simulator (Module 4)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
            <div className="bg-slate-100 p-4 rounded-full">
              <SlidersHorizontal className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">Advanced Analytics Engine</h3>
            <p className="text-slate-500 max-w-lg">
              This module allows users to adjust trajectory variables using interactive sliders.
              Immediately see how different policy interventions might alter the 2030 outcomes based on AI forecasts.
            </p>
            <Button className="mt-4 shadow-sm" variant="outline">
              Under Construction <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
