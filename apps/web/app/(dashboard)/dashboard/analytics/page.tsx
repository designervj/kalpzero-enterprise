'use client';

import { useEffect, useMemo, useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  ArrowUpRight, 
  ArrowDownRight,
  PieChart,
  Activity,
  Calendar,
  Filter,
  Download
} from 'lucide-react';
import { useTheme } from '@/components/providers/theme-provider';
import { DashboardSummary } from '../dashboardType';

export default function AnalyticsPage() {
  const { themeMode } = useTheme();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/summary')
      .then(res => res.json())
      .then((payload: DashboardSummary) => setData(payload))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const cardClass = useMemo(() => 
    `rounded-[24px] border transition-all duration-300 backdrop-blur-xl p-6 ${
      themeMode === 'light' 
        ? 'border-slate-200 bg-white shadow-sm' 
        : 'border-slate-800/80 bg-slate-950/60 shadow-lg'
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
    <div className={`space-y-8 animate-in fade-in duration-500 ${themeMode === 'light' ? 'text-slate-900' : 'text-slate-100'}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance Analytics</h1>
          <p className={`text-sm mt-1 ${themeMode === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
            Deep dive into your workspace metrics and growth trends.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
            themeMode === 'light' ? 'bg-white border-slate-200 hover:bg-slate-50' : 'bg-slate-900 border-slate-700 hover:border-slate-600'
          }`}>
            <Calendar size={14} />
            Last 30 Days
          </button>
          <button className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
            themeMode === 'light' ? 'bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-700' : 'bg-cyan-600 text-white border-cyan-500 hover:bg-cyan-700'
          }`}>
            <Download size={14} />
            Export
          </button>
        </div>
      </div>

      {/* Metric Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: `$${(data?.revenue || 0).toLocaleString()}`, trend: '+12.5%', up: true, icon: TrendingUp, color: 'emerald' },
          { label: 'Active Users', value: (data?.userCount || 0).toLocaleString(), trend: '+5.2%', up: true, icon: Users, color: 'blue' },
          { label: 'Order Volume', value: (data?.orderCount || 0).toLocaleString(), trend: '-2.1%', up: false, icon: ShoppingCart, color: 'orange' },
          { label: 'Session Time', value: '4m 32s', trend: '+8.4%', up: true, icon: Activity, color: 'purple' },
        ].map((item, i) => (
          <div key={i} className={cardClass}>
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${
                themeMode === 'light' ? 'bg-slate-50' : 'bg-slate-800/50'
              }`}>
                <item.icon size={18} className={`text-${item.color}-500`} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold ${item.up ? 'text-emerald-500' : 'text-rose-500'}`}>
                {item.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {item.trend}
              </div>
            </div>
            <div className="text-2xl font-black">{item.value}</div>
            <div className="text-xs text-slate-500 mt-1">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`${cardClass} lg:col-span-2`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold flex items-center gap-2">
              <BarChart3 size={18} className="text-indigo-500" />
              Revenue Growth
            </h3>
            <div className="flex gap-2">
              <span className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Current
              </span>
              <span className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-slate-300"></span> Previous
              </span>
            </div>
          </div>
          
          {/* Mock Chart Visual */}
          <div className="h-64 flex items-end justify-between gap-2 px-2 mt-8">
            {[40, 60, 45, 80, 55, 90, 75, 85, 65, 95, 80, 100].map((h, i) => (
              <div key={i} className="flex-1 group relative">
                <div 
                  className={`w-full rounded-t-lg transition-all duration-500 ${
                    themeMode === 'light' ? 'bg-indigo-100 group-hover:bg-indigo-500' : 'bg-indigo-900/40 group-hover:bg-indigo-500'
                  }`}
                  style={{ height: `${h}%` }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    ${(h * 120).toLocaleString()}
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 mt-2 text-center rotate-45 md:rotate-0">
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={cardClass}>
          <h3 className="font-bold flex items-center gap-2 mb-6">
            <PieChart size={18} className="text-rose-500" />
            Module Distribution
          </h3>
          <div className="flex flex-col items-center justify-center h-64">
            {/* Visual Donut Chart */}
            <div className={`relative w-40 h-40 rounded-full border-[12px] flex items-center justify-center transition-all ${
              themeMode === 'light' ? 'border-slate-100' : 'border-slate-800'
            }`}>
              <div className="absolute inset-[-12px] rounded-full border-[12px] border-indigo-500 border-t-transparent border-r-transparent rotate-45"></div>
              <div className="absolute inset-[-12px] rounded-full border-[12px] border-emerald-500 border-l-transparent border-b-transparent border-t-transparent -rotate-12"></div>
              <div className="text-center">
                <div className="text-2xl font-black">{(data?.enabledModules || []).length}</div>
                <div className="text-[10px] uppercase text-slate-500 font-bold">Active</div>
              </div>
            </div>
            
            <div className="mt-8 w-full space-y-2">
              {[
                { label: 'E-commerce', val: '45%', color: 'bg-indigo-500' },
                { label: 'Content CMS', val: '30%', color: 'bg-emerald-500' },
                { label: 'Analytics', val: '25%', color: 'bg-amber-500' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                    <span className="text-slate-500">{item.label}</span>
                  </div>
                  <span className="font-bold">{item.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Details Table */}
      <div className={cardClass}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold">Recent Market Performance</h3>
          <button className="text-xs text-indigo-500 font-bold hover:underline">View Full Report</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className={`text-[10px] uppercase tracking-widest text-slate-500 border-b ${themeMode === 'light' ? 'border-slate-100' : 'border-slate-800'}`}>
                <th className="pb-4 font-bold">Market Segment</th>
                <th className="pb-4 font-bold">Conversion</th>
                <th className="pb-4 font-bold">Growth</th>
                <th className="pb-4 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {[
                { name: 'North America', conv: '4.2%', growth: '+12%', status: 'Stable' },
                { name: 'European Union', conv: '3.8%', growth: '+18%', status: 'Trending' },
                { name: 'Asia Pacific', conv: '5.1%', growth: '+24%', status: 'Aggressive' },
                { name: 'South America', conv: '2.4%', growth: '-4%', status: 'Volatile' },
              ].map((row, i) => (
                <tr key={i} className={`border-b last:border-0 ${themeMode === 'light' ? 'border-slate-50' : 'border-slate-800/50'}`}>
                  <td className="py-4 font-medium">{row.name}</td>
                  <td className="py-4">{row.conv}</td>
                  <td className={`py-4 font-bold ${row.growth.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>{row.growth}</td>
                  <td className="py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-black ${
                      themeMode === 'light' ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-400'
                    }`}>{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
