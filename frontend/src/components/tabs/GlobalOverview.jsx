import React from 'react';
import GlobeView from '../GlobeView';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Globe2, TrendingUp, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function GlobalOverview() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-8 w-full max-w-7xl mx-auto"
    >
      {/* Hero Section: Globe + Context Panel */}
      <div className="flex flex-col md:flex-row gap-8 items-stretch min-h-[500px]">
        {/* Globe Container */}
        <div className="flex-1 w-full rounded-2xl overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent z-10 pointer-events-none" />
          <GlobeView />
          <div className="absolute bottom-6 left-6 z-20 text-white pointer-events-none">
            <h2 className="text-2xl font-bold tracking-tight">Global SDG Status</h2>
            <p className="text-slate-300 text-sm mt-1 max-w-xs">
              Interactive geographic overview of the 17 Sustainable Development Goals.
            </p>
          </div>
        </div>

        {/* Layman's Context Panel */}
        <div className="w-full md:w-96 flex flex-col gap-4">
          <Card className="flex-1 bg-white border-slate-200 shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-all duration-300">
            <CardHeader className="pb-2 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
              <CardTitle className="text-xl text-slate-800">What are the SDGs?</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-slate-600 space-y-4">
              <p className="leading-relaxed">
                The Sustainable Development Goals are 17 global objectives set by the UN to end poverty, protect the planet, and ensure peace and prosperity by 2030.
              </p>
            </CardContent>
          </Card>

          <Card className="flex-1 bg-gradient-to-br from-blue-600 to-indigo-700 border-transparent shadow-xl shadow-blue-900/20 text-white hover:shadow-2xl transition-all duration-300">
            <CardHeader className="pb-2 border-b border-white/10">
              <CardTitle className="text-xl text-white">AI Forecasting</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-blue-50 space-y-4">
              <p className="leading-relaxed">
                Our AI analyzes historical data trajectories to predict whether a country will hit their 2030 target. It simulates how policy changes today could alter tomorrow's outcome.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card className="border-slate-200 shadow-md hover:shadow-xl transition-all duration-300 bg-white cursor-pointer group">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                <Globe2 className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Countries Tracked</p>
                <h4 className="text-3xl font-bold text-slate-800">193</h4>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card className="border-slate-200 shadow-md hover:shadow-xl transition-all duration-300 bg-white cursor-pointer group">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                <TrendingUp className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Global On-Track</p>
                <h4 className="text-3xl font-bold text-slate-800">15%</h4>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 300 }}>
          <Card className="border-slate-200 shadow-md hover:shadow-xl transition-all duration-300 bg-white cursor-pointer group">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-red-100 text-red-600 rounded-xl group-hover:bg-red-600 group-hover:text-white transition-colors duration-300">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Critical Alerts</p>
                <h4 className="text-3xl font-bold text-slate-800">42</h4>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
