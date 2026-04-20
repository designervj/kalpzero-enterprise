"use client";

import React, { useState } from "react";
import {
  Palette,
  RotateCcw,
  CheckCircle2,
  Type,
  Image as ImageIcon,
  Layout,
  Box,
  MousePointer2,
  Save,
  Eye,
  Upload,
  Activity,
  ChevronRight,
  Search,
  Bell,
  Settings,
  Layers,
  PieChart,
  BarChart3,
  TrendingUp,
  Zap,
} from "lucide-react";
import { SmartColorPicker } from "../ui/smart-color-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface BrandingCustomizerProps {
  formData: any;
  setFormData: (data: any) => void;
}

const COLOR_PRESETS = {
  default: {
    name: "Kalp Default",
    primary: "#00f0ff",
    secondary: "#8b5cf6",
    accent: "#00f0ff",
    background: "#030712",
    foreground: "#ffffff",
  },
  ocean: {
    name: "Deep Ocean",
    primary: "#3b82f6",
    secondary: "#2dd4bf",
    accent: "#f59e0b",
    background: "#0f172a",
    foreground: "#f8fafc",
  },
  emerald: {
    name: "Emerald City",
    primary: "#10b981",
    secondary: "#f59e0b",
    accent: "#f59e0b",
    background: "#ffffff",
    foreground: "#111827",
  },
  sunset: {
    name: "Royal Sunset",
    primary: "#8b5cf6",
    secondary: "#f43f5e",
    accent: "#f59e0b",
    background: "#ffffff",
    foreground: "#111827",
  },
  lava: {
    name: "Volcanic Lava",
    primary: "#ef4444",
    secondary: "#f97316",
    accent: "#f59e0b",
    background: "#ffffff",
    foreground: "#111827",
  },
};

const FONTS = [
  { name: "Inter", value: "Inter" },
  { name: "Roboto", value: "Roboto" },
  { name: "Outfit", value: "Outfit" },
  { name: "Playfair Display", value: "Playfair Display" },
  { name: "Montserrat", value: "Montserrat" },
  { name: "Poppins", value: "Poppins" },
];

export default function BrandingCustomizer({
  formData,
  setFormData,
}: BrandingCustomizerProps) {
  const brand = formData.brand || {
    primary: "#00f0ff",
    secondary: "#8b5cf6",
    accent: "#00f0ff",
    background: "#030712",
    foreground: "#ffffff",
    muted: "#1e293b",
    mutedForeground: "#94a3b8",
    border: "#334155",
    input: "#0f172a",
    ring: "#00f0ff",
    fonts: {
      heading: "Inter",
      body: "Inter",
    },
    customCSS: "",
    logo: {
      url: "",
      width: 200,
      height: 60,
    },
    buttonRadius: "0.5rem",
  };

  const updateBrand = (updates: any) => {
    setFormData((prev: any) => ({
      ...prev,
      brand: { ...brand, ...updates },
    }));
  };

  const handleColorChange = (key: string, value: string) => {
    updateBrand({ [key]: value });
  };

  const applyPreset = (preset: any) => {
    updateBrand({
      primary: preset.primary,
      secondary: preset.secondary,
      accent: preset.accent,
      background: preset.background,
      foreground: preset.foreground,
      ring: preset.primary,
      border: preset.background === "#ffffff" ? "#e2e8f0" : "#334155",
      muted: preset.background === "#ffffff" ? "#f1f5f9" : "#1e293b",
    });
  };

  const resetToDefault = () => {
    updateBrand({
      primary: "#00f0ff",
      secondary: "#8b5cf6",
      accent: "#00f0ff",
      background: "#030712",
      foreground: "#ffffff",
      muted: "#1e293b",
      mutedForeground: "#94a3b8",
      border: "#334155",
      input: "#0f172a",
      ring: "#00f0ff",
      fonts: {
        heading: "Inter",
        body: "Inter",
      },
      customCSS: "",
      buttonRadius: "0.5rem",
    });
  };

  return (
    <div className="space-y-10 animate-in slide-in-from-right-4 fade-in duration-700">
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Badge className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter">
              Premium Module
            </Badge>
            <h2 className="text-4xl font-black text-white tracking-tighter">
              Brand Identity
            </h2>
          </div>
          <p className="text-slate-500 text-sm font-medium">
            Define your unified design system across all tenant environments.
          </p>
        </div>
        <div className="flex gap-4">
          <Button
            variant="ghost"
            onClick={resetToDefault}
            className="gap-2 text-slate-500 hover:text-white transition-all hover:bg-white/5"
          >
            <RotateCcw size={16} />{" "}
            <span className="text-[10px] font-black uppercase tracking-widest">
              Reset
            </span>
          </Button>
          <Button className="gap-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 shadow-xl shadow-black/40">
            <Eye size={16} />{" "}
            <span className="text-[10px] font-black uppercase tracking-widest">
              Visual Test
            </span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Configuration Panel */}
        <div className="lg:col-span-7 space-y-8">
          <Tabs defaultValue="colors" className="w-full">
            <TabsList className="bg-slate-900/50 backdrop-blur-2xl border-white/5 shadow-2xl mb-8 p-1.5 w-max">
              <TabsTrigger value="colors" className="gap-2">
                <Palette size={14} /> Colors
              </TabsTrigger>
              <TabsTrigger value="logo" className="gap-2">
                <ImageIcon size={14} /> Identity
              </TabsTrigger>
              <TabsTrigger value="presets" className="gap-2">
                <Zap size={14} /> Themes
              </TabsTrigger>
              <TabsTrigger value="advanced" className="gap-2">
                <Layers size={14} /> Advanced
              </TabsTrigger>
            </TabsList>

            <TabsContent value="colors" className="space-y-8">
              <Card className="border-white/5 relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500/0 via-cyan-500/40 to-cyan-500/0"></div>
                <CardHeader className="bg-white/[0.02]">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400/80 mb-1">
                        Color Palette
                      </CardTitle>
                      <CardDescription className="text-slate-500 font-medium">
                        Fine-tune the mathematical relationship between your
                        brand shades.
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="opacity-50">
                      HSL Mapping
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-8 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                  {[
                    {
                      label: "Primary",
                      key: "primary",
                      desc: "Active states & primary actions",
                    },
                    {
                      label: "Secondary",
                      key: "secondary",
                      desc: "Accentuation for data & icons",
                    },
                    {
                      label: "Accent",
                      key: "accent",
                      desc: "Critical UI alerts & feedback",
                    },
                    {
                      label: "Background",
                      key: "background",
                      desc: "Global body & window background",
                    },
                    {
                      label: "Foreground",
                      key: "foreground",
                      desc: "Headings, text & primary labels",
                    },
                    {
                      label: "Muted",
                      key: "muted",
                      desc: "Subtle areas & card backgrounds",
                    },
                    {
                      label: "Border",
                      key: "border",
                      desc: "Structural lines & connectors",
                    },
                    {
                      label: "Ring",
                      key: "ring",
                      desc: "Focus indicators & glow effects",
                    },
                  ].map((c) => (
                    <div
                      key={c.key}
                      className="group animate-in fade-in slide-in-from-left-4 duration-500"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-3 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]"></div>
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                            {c.label}
                          </Label>
                        </div>
                        <span className="text-[9px] font-mono text-slate-600 group-hover:text-cyan-400 transition-colors uppercase">
                          {brand[c.key]}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 p-1 bg-black/40 border border-white/5 rounded-2xl group-hover:border-white/10 transition-all duration-300">
                        <SmartColorPicker
                          value={brand[c.key]}
                          onChange={(next) => handleColorChange(c.key, next)}
                          variant="dark"
                          className="w-14 h-14 rounded-xl border border-white/10 shadow-2xl shadow-black/80 ring-1 ring-white/5"
                        />
                        <div className="flex-1">
                          <p className="text-[9px] text-slate-500 leading-tight font-medium pr-4">
                            {c.desc}
                          </p>
                          <div className="mt-2 h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-cyan-500/20"
                              style={{ width: "100%" }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="logo" className="space-y-6">
              <Card className="border-white/5 overflow-hidden">
                <CardHeader className="bg-white/[0.02]">
                  <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400/80 mb-1">
                    Identity Assets
                  </CardTitle>
                  <CardDescription className="text-slate-500 font-medium">
                    Manage High-DPI logos and SVG vector branding assets.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-8 space-y-8">
                  <div className="flex items-center gap-8 p-10 rounded-3xl border border-dashed border-slate-800 bg-white/[0.02] transition-all hover:bg-white/[0.04] group relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="w-24 h-24 rounded-2xl bg-slate-900 shadow-2xl ring-1 ring-white/10 flex items-center justify-center overflow-hidden z-10 shrink-0">
                      {brand.logo?.url ? (
                        <img
                          src={brand.logo.url}
                          alt="Logo"
                          className="w-16 h-16 object-contain"
                        />
                      ) : (
                        <ImageIcon
                          size={32}
                          className="text-slate-700 group-hover:text-cyan-500 transition-colors"
                        />
                      )}
                    </div>
                    <div className="flex-1 z-10">
                      <h4 className="text-lg font-black text-white mb-1 tracking-tight">
                        Main Brand Mark
                      </h4>
                      <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                        System-wide logo used in navigation bars, invoices, and
                        authenticated views. Optimized for dark containers.
                      </p>
                      <div className="flex gap-4">
                        <Button className="bg-cyan-500 hover:bg-cyan-400 text-black text-[10px] font-black uppercase tracking-widest px-6 h-10 shadow-lg shadow-cyan-500/20">
                          <Upload size={14} className="mr-2" /> Upload Asset
                        </Button>
                        <Button
                          variant="outline"
                          className="border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-widest h-10"
                        >
                          Library
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Asset URL Mapping
                      </Label>
                      <Input
                        value={brand.logo?.url || ""}
                        onChange={(e) =>
                          updateBrand({
                            logo: { ...brand.logo, url: e.target.value },
                          })
                        }
                        placeholder="https://cdn.example.com/assets/logo-white.svg"
                        className="bg-black/40 border-slate-800 h-12 text-xs font-mono focus:ring-1 focus:ring-cyan-500/50"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Constraint Width
                        </Label>
                        <Input
                          type="number"
                          value={brand.logo?.width || 200}
                          onChange={(e) =>
                            updateBrand({
                              logo: {
                                ...brand.logo,
                                width: parseInt(e.target.value) || 200,
                              },
                            })
                          }
                          className="bg-black/40 border-slate-800 h-12 text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Constraint Height
                        </Label>
                        <Input
                          type="number"
                          value={brand.logo?.height || 60}
                          onChange={(e) =>
                            updateBrand({
                              logo: {
                                ...brand.logo,
                                height: parseInt(e.target.value) || 60,
                              },
                            })
                          }
                          className="bg-black/40 border-slate-800 h-12 text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent
              value="presets"
              className="animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              <Card className="border-white/5">
                <CardHeader className="bg-white/[0.02]">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400/80 mb-1">
                        Curated Themes
                      </CardTitle>
                      <CardDescription className="text-slate-500 font-medium">
                        Standardized color theories for industry verticals.
                      </CardDescription>
                    </div>
                    <Badge className="bg-white/5 border border-white/10 text-[9px] text-slate-500">
                      5 Dynamic Sets
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(COLOR_PRESETS).map(
                    ([key, p]: [string, any]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => applyPreset(p)}
                        className={`group relative p-6 rounded-3xl border transition-all duration-300 text-left hover:shadow-3xl hover:-translate-y-1 ${brand.primary === p.primary ? "border-cyan-500 bg-cyan-500/5 shadow-2xl shadow-cyan-500/10" : "border-slate-800 bg-black/40 hover:border-slate-700 hover:bg-slate-900/50"}`}
                      >
                        {brand.primary === p.primary && (
                          <div className="absolute top-4 right-4 text-cyan-500">
                            <CheckCircle2
                              size={16}
                              fill="currentColor"
                              className="text-cyan-500/20"
                            />
                          </div>
                        )}
                        <h4 className="text-sm font-black text-white mb-6 group-hover:text-cyan-400 transition-colors uppercase tracking-tight">
                          {p.name}
                        </h4>

                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-3">
                            {[
                              p.primary,
                              p.secondary,
                              p.accent,
                              p.background,
                              p.foreground,
                            ].map((c, i) => (
                              <div
                                key={i}
                                className="w-10 h-10 rounded-full border-4 border-slate-900 shadow-xl transition-all group-hover:scale-110"
                                style={{ backgroundColor: c, zIndex: 10 - i }}
                              ></div>
                            ))}
                          </div>
                          <div className="ml-4 h-[1px] flex-1 bg-white/10 group-hover:bg-cyan-500/30 transition-all"></div>
                          <span className="text-[10px] font-black uppercase text-slate-600 group-hover:text-cyan-500 transition-colors ml-2">
                            Apply
                          </span>
                        </div>
                      </button>
                    ),
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-6">
              <Card className="border-white/5 overflow-hidden">
                <CardHeader className="bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <div className="p-2 border border-blue-500/20 bg-blue-500/10 rounded-lg text-blue-400">
                      <Layers size={14} />
                    </div>
                    <div>
                      <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400/80 mb-1">
                        System Overrides
                      </CardTitle>
                      <CardDescription className="text-slate-500 font-medium">
                        Fine-tune corner radius, typography, and raw CSS
                        injection.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-8 space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Heading Typeface
                      </Label>
                      <Select
                        value={brand.fonts?.heading || "Inter"}
                        onChange={(e) =>
                          updateBrand({
                            fonts: { ...brand.fonts, heading: e.target.value },
                          })
                        }
                      >
                        {FONTS.map((f) => (
                          <option key={f.name} value={f.name}>
                            {f.name}
                          </option>
                        ))}
                      </Select>
                      <div
                        className="p-6 rounded-2xl bg-black/40 border border-slate-800 text-xl font-black tracking-tight"
                        style={{ fontFamily: brand.fonts?.heading }}
                      >
                        The quick brown fox jumps over the lazy dog.
                      </div>
                    </div>
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Body Typeface
                      </Label>
                      <Select
                        value={brand.fonts?.body || "Inter"}
                        onChange={(e) =>
                          updateBrand({
                            fonts: { ...brand.fonts, body: e.target.value },
                          })
                        }
                      >
                        {FONTS.map((f) => (
                          <option key={f.name} value={f.name}>
                            {f.name}
                          </option>
                        ))}
                      </Select>
                      <div
                        className="p-6 rounded-2xl bg-black/40 border border-slate-800 text-xs leading-relaxed opacity-60"
                        style={{ fontFamily: brand.fonts?.body }}
                      >
                        Every aspect of the interface has been designed to
                        provide the highest level of clarity and efficiency in
                        data management and system orchestration.
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 border-t border-white/5 pt-10">
                    <div className="flex justify-between items-center">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Component Radius
                      </Label>
                      <span className="text-[10px] font-mono text-cyan-400">
                        {brand.buttonRadius}
                      </span>
                    </div>
                    <div className="flex gap-4">
                      {[
                        { id: "0px", label: "Square" },
                        { id: "0.5rem", label: "Balanced" },
                        { id: "1rem", label: "Soft" },
                        { id: "9999px", label: "Pill" },
                      ].map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => updateBrand({ buttonRadius: r.id })}
                          className={`flex-1 py-4 px-2 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${brand.buttonRadius === r.id ? "border-cyan-500 bg-cyan-500/10 text-cyan-300 shadow-xl shadow-cyan-500/10" : "border-slate-800 bg-black/40 text-slate-500 hover:border-slate-600"}`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 border-t border-white/5 pt-10">
                    <div className="flex justify-between items-center mb-1">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Raw CSS Injection
                      </Label>
                      <Badge
                        variant="outline"
                        className="h-5 text-[8px] opacity-40"
                      >
                        System Level
                      </Badge>
                    </div>
                    <div className="relative group">
                      <div className="absolute top-4 right-4 text-cyan-500/20 group-hover:text-cyan-500/40 transition-colors">
                        <Zap size={20} />
                      </div>
                      <Textarea
                        value={brand.customCSS || ""}
                        onChange={(e) =>
                          updateBrand({ customCSS: e.target.value })
                        }
                        placeholder="/* Add proprietary dashboard styles here... */"
                        className="font-mono text-[11px] bg-black/40 border-slate-800 min-h-[150px] rounded-3xl p-6 focus:ring-cyan-500/20 resize-none"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* High-Fidelity Mockup Preview */}
        <div className="lg:col-span-5">
          <div className="sticky top-6">
            <div className="relative group">
              {/* Decorative background glow */}
              <div className="absolute -inset-10 bg-cyan-500/10 blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

              <Card
                className="bg-[#030712] border-slate-800/80 overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] border-2 transition-all duration-700 hover:scale-[1.01]"
                style={{ borderColor: `${brand.primary}15` }}
              >
                {/* Top OS bar mock */}
                <div className="px-6 py-4 bg-black/60 border-b border-white/5 flex items-center justify-between backdrop-blur-3xl">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500/40 border border-rose-500/50"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/40 border border-amber-500/50"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/40 border border-emerald-500/50"></div>
                    </div>
                    <div className="h-4 w-[1px] bg-white/10 mx-2"></div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Settings size={12} />
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                        Control Center
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-slate-500">
                    <Search size={14} className="opacity-40" />
                    <Bell size={14} className="opacity-40" />
                    <div className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                      <Activity size={10} className="text-cyan-500" />
                    </div>
                  </div>
                </div>

                {/* Main dashboard content mock */}
                <div
                  className="p-0 flex h-[620px]"
                  style={{
                    background: brand.background,
                    color: brand.foreground,
                  }}
                >
                  {/* Sidebar Mock */}
                  <div className="w-20 border-r border-white/5 bg-black/30 flex flex-col items-center py-8 gap-10">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                      <Zap size={22} className="text-black fill-black" />
                    </div>

                    <div className="flex flex-col gap-6">
                      {[
                        PieChart,
                        BarChart3,
                        TrendingUp,
                        Layers,
                        MousePointer2,
                      ].map((Icon, i) => (
                        <div
                          key={i}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${i === 2 ? "bg-white/5 text-white ring-1 ring-white/10" : "text-slate-600 hover:text-slate-400"}`}
                        >
                          <Icon size={20} />
                        </div>
                      ))}
                    </div>

                    <div className="mt-auto w-10 h-10 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center text-slate-600">
                      <Settings size={20} />
                    </div>
                  </div>

                  {/* Content Mock */}
                  <div className="flex-1 p-8 flex flex-col relative overflow-hidden">
                    <div className="flex items-center justify-between mb-10">
                      <div className="flex items-center gap-4">
                        {brand.logo?.url ? (
                          <img
                            src={brand.logo.url}
                            alt="Logo"
                            style={{
                              width: `${brand.logo.width / 8}px`,
                              height: "auto",
                            }}
                          />
                        ) : (
                          <div
                            className="flex items-center gap-2 font-black text-xl tracking-tighter"
                            style={{ color: brand.primary }}
                          >
                            <Activity size={18} />
                            <span>
                              KALP
                              <span className="font-light opacity-30">
                                ZERO
                              </span>
                            </span>
                          </div>
                        )}
                        <Badge
                          variant="outline"
                          className="opacity-40 text-[8px] h-4"
                        >
                          v4.2.0-STABLE
                        </Badge>
                      </div>
                      <div className="h-10 px-4 rounded-xl border border-white/5 bg-black/20 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Live Services
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4 mb-10">
                      <h3
                        className="text-5xl font-black leading-[0.9] tracking-tighter"
                        style={{ fontFamily: brand.fonts?.heading || "Inter" }}
                      >
                        Digital{" "}
                        <span style={{ color: brand.primary }}>
                          Sovereignty
                        </span>{" "}
                        Defined.
                      </h3>
                      <p
                        className="text-[11px] uppercase tracking-widest font-bold opacity-30 leading-relaxed max-w-[85%]"
                        style={{ fontFamily: brand.fonts?.body || "Inter" }}
                      >
                        Synchronized Multi-Tenant Core Orchestration.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-8">
                      {[
                        {
                          label: "Cloud Latency",
                          value: "14ms",
                          icon: Activity,
                          color: brand.primary,
                        },
                        {
                          label: "Active Nodes",
                          value: "4.2k",
                          icon: Layers,
                          color: brand.secondary,
                        },
                      ].map(
                        (stat, i) =>
                          stat && (
                            <div
                              key={i}
                              className="p-6 rounded-[2.5rem] border group transition-all duration-500 hover:bg-white/[0.02]"
                              style={{
                                borderColor: brand.border,
                                background: `linear-gradient(135deg, ${brand.muted}40, transparent)`,
                              }}
                            >
                              <div
                                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-2xl transition-transform group-hover:scale-110"
                                style={{
                                  backgroundColor: `${stat.color}15`,
                                  border: `1px solid ${stat.color}30`,
                                }}
                              >
                                <stat.icon
                                  size={22}
                                  style={{ color: stat.color }}
                                />
                              </div>
                              <div className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em] mb-1">
                                {stat.label}
                              </div>
                              <div className="text-3xl font-black tracking-tighter tabular-nums">
                                {stat.value}
                              </div>
                            </div>
                          ),
                      )}
                    </div>

                    <div className="mt-auto space-y-6">
                      <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                          style={{
                            backgroundColor: brand.primary,
                            width: "72%",
                          }}
                        ></div>
                      </div>
                      <div className="flex gap-4">
                        <button
                          className="flex-1 py-5 text-[10px] font-black uppercase tracking-[0.3em] text-black shadow-3xl transition-all duration-300 hover:opacity-90 active:scale-[0.98] ring-offset-2 ring-offset-black"
                          style={{
                            backgroundColor: brand.primary,
                            borderRadius: brand.buttonRadius,
                          }}
                        >
                          Launch Gateway
                        </button>
                        <button className="px-8 flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all">
                          <ChevronRight size={20} className="text-white" />
                        </button>
                      </div>
                    </div>

                    {/* Mock decorative elements */}
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-cyan-500/10 blur-[80px] rounded-full"></div>
                  </div>
                </div>
              </Card>

              {/* Floating "Live" Indicator */}
              <div className="absolute -top-3 -right-3 flex items-center gap-2 bg-black border border-white/10 px-3 py-1.5 rounded-full shadow-2xl z-50">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-ping"></div>
                <span className="text-[8px] font-black uppercase tracking-widest text-cyan-400">
                  Reactive Rendering
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        ${brand.customCSS || ""}
        .group:hover .shadow-3xl {
          box-shadow: 0 35px 60px -15px rgba(0, 0, 0, 0.5);
        }
      `}</style>
    </div>
  );
}
