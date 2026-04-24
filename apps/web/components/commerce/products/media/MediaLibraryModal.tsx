"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { MediaUploader } from "./MediaManage";
import { Button } from "@/components/ui/button";
import { ImageIcon, X, Layers } from "lucide-react";

interface MediaLibraryModalProps {
  onSelect: (media: { url: string; alt: string }) => void;
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
}

export const MediaLibraryModal = ({
  onSelect,
  trigger,
  isOpen: externalOpen,
  onClose: externalClose,
}: MediaLibraryModalProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = externalOpen !== undefined;
  const open = isControlled ? externalOpen : internalOpen;

  const setOpen = (val: boolean) => {
    if (isControlled) {
      if (!val && externalClose) externalClose();
    } else {
      setInternalOpen(val);
    }
  };

  const handleSelect = (media: any) => {
    onSelect({
      url: media.url,
      alt: media.alt || "",
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="!max-w-6xl !p-0 !h-[85vh] bg-ink border-gold/20 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="h-full flex flex-col relative">
          {/* Tactical Overlay Grid */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-kalp-grid z-0" />
          
          {/* Premium Header */}
          <div className="relative z-10 flex items-center justify-between p-6 border-b border-white/5 bg-charcoal/50 backdrop-blur-md">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="absolute -inset-1 bg-gold/20 blur-sm rounded-full animate-pulse" />
                <div className="relative bg-ink border border-gold/30 p-2 rounded-sm">
                  <Layers className="text-gold" size={20} />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-white uppercase tracking-[0.25em]">
                    Asset <span className="text-gold">Intelligence</span>
                  </h2>
                  <div className="px-2 py-0.5 bg-olive/20 border border-olive/30 rounded-none">
                    <span className="text-[8px] font-black text-olive-light uppercase tracking-widest">v4.0 SECURE</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest pt-1 italic">
                  Centralized media deployment protocol active.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 pr-8">
               <div className="flex flex-col items-end">
                  <span className="text-[9px] font-black text-gold/40 uppercase tracking-tighter">System Status</span>
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                    <span className="size-1.5 bg-emerald-500 rounded-full animate-ping" /> Nominal
                  </span>
               </div>
            </div>
          </div>

          {/* Integrated Content Area */}
          <div className="flex-1 overflow-hidden relative z-10 flex flex-col">
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              <MediaUploader onSelect={handleSelect} hideHeader={true} />
            </div>
          </div>

          {/* Tactical Footer */}
          <div className="p-4 border-t border-white/5 bg-charcoal/30 flex justify-between items-center relative z-10">
            <div className="flex gap-4">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Encryption</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">AES-256-GCM</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Protocol</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">SECURE-SYNC</span>
              </div>
            </div>
            <p className="text-[9px] font-black text-white/10 uppercase tracking-[0.3em]">Authorized Personnel Only</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
