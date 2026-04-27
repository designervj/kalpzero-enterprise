'use client';

import { useEffect, useMemo, useState } from 'react';
import { 
  ShieldCheck, 
  Zap, 
  Globe, 
  Database, 
  Server, 
  Activity,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Boxes,
  Cpu,
  Layers
} from 'lucide-react';
import { useTheme } from '@/components/providers/theme-provider';
import { useAuth } from '@/components/AuthProvider';
import { DashboardSummary } from '../dashboardType';
import Link from 'next/link';

export default function OverviewPage() {
  const { themeMode } = useTheme();
  const auth = useAuth();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/summary')
      .then(res => res.json())
      .then((payload: DashboardSummary) => setData(payload))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const panelClass = useMemo(() => 
    `rounded-[32px] border transition-all duration-300 ${
      themeMode === 'light' 
        ? 'border-slate-200 bg-white shadow-sm' 
        : 'border-slate-800/80 bg-slate-950/40 shadow-inner'
    }`, [themeMode]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-20">
        <div className={`h-8 w-8 rounded-full border-2 animate-spin ${
          themeMode === 'light' ? 'border-indigo-200 border-t-indigo-600' : 'border-cyan-500/30 border-t-cyan-500'
        }`}></div>
      </div>
    );
  }

  return (
    <div className={`space-y-8 animate-in slide-in-from-bottom-4 duration-500 ${themeMode === 'light' ? 'text-slate-900' : 'text-slate-100'}`}>
      {/* Strategic Hero */}
      <div className={`${panelClass} relative overflow-hidden p-8 md:p-10`}>
        <div className={`absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none ${
          themeMode === 'light' ? 'bg-gradient-to-l from-indigo-500 to-transparent' : 'bg-gradient-to-l from-cyan-500/20 to-transparent'
        }`} />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
                themeMode === 'light' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}>
                <Activity size={12} className="animate-pulse" />
                System Live
              </span>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                themeMode === 'light' ? 'bg-slate-50 text-slate-500 border border-slate-100' : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                Node: {data?.tenantName || 'Cluster-01'}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">Strategic Command</h1>
            <p className={`text-lg leading-relaxed ${themeMode === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
              Your administrative control surface for the <strong>{data?.tenantName}</strong> enterprise ecosystem. 
              Manage provisioning, monitor module health, and oversee global operations.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 shrink-0">
             <div className={`p-5 rounded-3xl border transition-all ${
               themeMode === 'light' ? 'bg-slate-50/50 border-slate-100' : 'bg-slate-900/50 border-slate-800'
             }`}>
               <Cpu size={24} className="text-indigo-500 mb-3" />
               <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">CPU Priority</div>
               <div className="text-xl font-black mt-1">High</div>
             </div>
             <div className={`p-5 rounded-3xl border transition-all ${
               themeMode === 'light' ? 'bg-slate-50/50 border-slate-100' : 'bg-slate-900/50 border-slate-800'
             }`}>
               <Database size={24} className="text-emerald-500 mb-3" />
               <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">IO Response</div>
               <div className="text-xl font-black mt-1">12ms</div>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Module Matrix */}
        <div className={`${panelClass} lg:col-span-2 p-8`}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Boxes size={20} className="text-indigo-500" />
                Provisioned Module Matrix
              </h3>
              <p className="text-xs text-slate-500 mt-1">Current status of active software modules in this tenant scope.</p>
            </div>
            <Link href="/settings/modules" className="text-xs font-bold text-indigo-500 hover:underline">Manage Modules</Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(data?.enabledModules || ['core', 'auth', 'cms', 'ecommerce', 'analytics']).map((mod, i) => (
              <div key={i} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                themeMode === 'light' ? 'bg-slate-50 border-slate-100 hover:border-indigo-200' : 'bg-slate-900/30 border-slate-800 hover:border-slate-700'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    themeMode === 'light' ? 'bg-white shadow-sm text-indigo-600' : 'bg-slate-950 text-cyan-400'
                  }`}>
                    <Layers size={16} />
                  </div>
                  <div>
                    <div className="text-sm font-bold capitalize">{mod}</div>
                    <div className="text-[10px] text-slate-500">v2.4.0 • Optimized</div>
                  </div>
                </div>
                <CheckCircle2 size={16} className="text-emerald-500" />
              </div>
            ))}
          </div>
        </div>

        {/* System Health */}
        <div className="space-y-4">
          <div className={`${panelClass} p-6 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white border-0`}>
            <div className="flex items-center justify-between mb-8">
              <ShieldCheck size={28} />
              <div className="px-2 py-1 bg-white/20 rounded text-[10px] font-black uppercase tracking-widest">Secure</div>
            </div>
            <h3 className="text-xl font-bold mb-2">Security Perimeter</h3>
            <p className="text-sm text-indigo-100 mb-6">Global threat detection is active. No unauthorized access attempts in 48h.</p>
            <button className="w-full py-2 bg-white text-indigo-700 rounded-xl text-xs font-black hover:bg-indigo-50 transition-colors">
              Security Audit
            </button>
          </div>

          <div className={`${panelClass} p-6`}>
             <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Instance Infrastructure</h4>
             <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server size={14} className="text-slate-400" />
                    <span className="text-xs font-bold text-slate-500">Database</span>
                  </div>
                  <span className="text-xs font-black">PostgreSQL 15</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap size={14} className="text-slate-400" />
                    <span className="text-xs font-bold text-slate-500">API Latency</span>
                  </div>
                  <span className="text-xs font-black">24ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe size={14} className="text-slate-400" />
                    <span className="text-xs font-bold text-slate-500">CDN Edge</span>
                  </div>
                  <span className="text-xs font-black text-emerald-500">Global Active</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Control Actions */}
      <div className="space-y-4">
        <h3 className="text-lg font-black tracking-tight flex items-center gap-2 px-2">
          <Activity size={18} className="text-indigo-500" />
          Critical Path Operations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Provision Tenant', desc: 'Deploy new infrastructure node', icon: Server, color: 'text-indigo-500' },
            { label: 'Resource Monitor', desc: 'Inspect database and CPU usage', icon: Activity, color: 'text-emerald-500' },
            { label: 'Global Registry', desc: 'Sync cross-tenant metadata', icon: Boxes, color: 'text-amber-500' },
          ].map((action, i) => (
            <button key={i} className={`${panelClass} p-6 text-left group hover:scale-[1.02] transition-transform`}>
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-2xl ${themeMode === 'light' ? 'bg-slate-50' : 'bg-slate-900'} ${action.color}`}>
                  <action.icon size={20} />
                </div>
                <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
              </div>
              <div className="font-bold text-sm mb-1">{action.label}</div>
              <p className="text-xs text-slate-500 leading-relaxed">{action.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
