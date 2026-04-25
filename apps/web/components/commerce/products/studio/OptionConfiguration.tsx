"use client";

import React from "react";
import { Layers, Sparkles, Plus, Zap } from "lucide-react";

import { useSelector } from "react-redux";
import { RootState } from "@/hook/store/store";
import { useSearchParams } from "next/navigation";
import { SectionCard } from "./Common";
import { cn } from "@/lib/utils";
import { ProductOption } from "@/hook/slices/commerce/products/ProductType";

interface OptionConfigurationProps {
  attributeSetIds: string[];
  options: ProductOption[];
  onToggleAttributeSet: (id: string) => void;
  onOptionChange: (idx: number, opt: ProductOption) => void;
  onAddOptionValue: (idx: number) => void;
  onRegenerateVariants: () => void;
}

export function OptionConfiguration({
  attributeSetIds,
  options,
  onToggleAttributeSet,
  onOptionChange,
  onAddOptionValue,
  onRegenerateVariants,
}: OptionConfigurationProps) {
  // Using generic "product" slice as currently defined in store.ts
  const { allProducts } = useSelector(
    (state: RootState) => state.product,
  );
  const { allAttributes, isFetchedAttributes } = useSelector(
    (state: RootState) => state.attribute,
  );
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const prevProduct = allProducts.find((item: any) => item._id === editId);

  if (!isFetchedAttributes) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-ink/20 border border-white/5 rounded-sm">
        <div className="h-6 w-6 border-2 border-white/5 border-t-gold rounded-full animate-spin shadow-lg shadow-gold/20" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 italic mt-4">
          Decrypting Attribute Matrices...
        </span>
      </div>
    );
  }

  return (
    <SectionCard
      icon={<Layers size={18} />}
      title="Configuration Matrix"
    >
      <div className="space-y-8">
        {/* Attribute Set Grid */}
        <div className="flex flex-wrap gap-2">
          {allAttributes.map((set: any) => {
            const active = attributeSetIds.includes(set.key || set.id);
            return (
              <button
                type="button"
                key={set.id}
                onClick={() => onToggleAttributeSet(set.key || set.id)}
                className={cn(
                  "px-4 py-2 border transition-all text-[10px] font-black uppercase tracking-widest rounded-sm",
                  active
                    ? "bg-gold/10 border-gold/40 text-gold shadow-[0_0_15px_rgba(201,162,39,0.1)]"
                    : "bg-ink border-white/10 text-white/40 hover:text-white hover:border-gold/20"
                )}
              >
                {set.name}
              </button>
            );
          })}
        </div>

        {options.length > 0 ? (
          <div className="space-y-8">
            {(() => {
              const groups: Record<
                string,
                {
                  name: string;
                  items: { opt: ProductOption; originalIdx: number }[];
                }
              > = {};

              options.forEach((opt, originalIdx) => {
                const setId = opt.attributeSetId || "other";
                if (!groups[setId]) {
                  const attributeSet = allAttributes.find(
                    (s: any) => (s.key || s.id) === setId,
                  );
                  groups[setId] = {
                    name: attributeSet?.name || "Global Assets",
                    items: [],
                  };
                }
                groups[setId].items.push({ opt, originalIdx });
              });

              return Object.entries(groups).map(([setId, group]) => (
                <div key={setId} className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-gold/40 whitespace-nowrap">
                      {group.name}
                    </span>
                    <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                  </div>

                  <div className="space-y-4">
                    {group.items.map(({ opt, originalIdx }) => (
                      <div
                        key={originalIdx}
                        className="bg-black/20 border border-white/5 p-5 rounded-sm space-y-4 hover:border-white/10 transition-colors"
                      >
                        <div className="flex items-center justify-between border-b border-white/5 pb-4">
                          <div className="flex flex-col">
                            <span className="text-[11px] font-black text-white uppercase tracking-widest">
                              {opt.label}
                            </span>
                            <span className="text-[8px] font-bold text-white/20 uppercase tracking-[0.2em] italic">
                              IDENTIFIER: {opt.key}
                            </span>
                          </div>
                          
                          <label className="flex items-center gap-3 cursor-pointer group">
                            <span className="text-[9px] font-black text-white/30 group-hover:text-white transition-colors uppercase tracking-widest italic">
                              Active for Variants
                            </span>
                            <div className="relative">
                              <input
                                type="checkbox"
                                className="peer hidden"
                                checked={opt.useForVariants}
                                onChange={(e) => {
                                  onOptionChange(originalIdx, {
                                    ...opt,
                                    useForVariants: e.target.checked,
                                  });
                                }}
                              />
                              <div className="h-5 w-9 bg-ink border border-white/10 rounded-full peer-checked:bg-emerald-500/10 peer-checked:border-emerald-500/40 transition-all" />
                              <div className="absolute top-1 left-1 h-3 w-3 bg-white/10 rounded-full peer-checked:bg-emerald-400 peer-checked:translate-x-4 transition-all" />
                            </div>
                          </label>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          {opt.values.map((val) => {
                            const selected = opt.selectedValues.includes(val);
                            const wasPrevSelected = (prevProduct as any)?.options
                              ?.find((item: any) => item.label === opt.label)
                              ?.selectedValues.includes(val);

                            return (
                              <button
                                type="button"
                                key={val}
                                onClick={() => {
                                  const exists = opt.selectedValues.includes(val);
                                  onOptionChange(originalIdx, {
                                    ...opt,
                                    selectedValues: exists
                                      ? opt.selectedValues.filter((v) => v !== val)
                                      : [...opt.selectedValues, val],
                                  });
                                }}
                                disabled={wasPrevSelected}
                                className={cn(
                                  "px-3 py-1.5 border text-[10px] font-black transition-all uppercase tracking-widest",
                                  selected
                                    ? "bg-gold border-gold text-black shadow-lg shadow-gold/20"
                                    : "bg-ink border-white/10 text-white/40 hover:text-white hover:border-white/20",
                                  wasPrevSelected && "opacity-50 cursor-not-allowed border-dashed"
                                )}
                              >
                                {val}
                                {selected && !wasPrevSelected && (
                                  <span className="ml-2 inline-block h-1 w-1 bg-black rounded-full animate-pulse" />
                                )}
                              </button>
                            );
                          })}

                          <div className="flex-1 flex items-center gap-2 min-w-[200px]">
                            <input
                              value={opt.draftValue || ""}
                              onChange={(e) => {
                                onOptionChange(originalIdx, {
                                  ...opt,
                                  draftValue: e.target.value,
                                });
                              }}
                              onKeyDown={(e) =>
                                e.key === "Enter" &&
                                onAddOptionValue(originalIdx)
                              }
                              placeholder="INJECT NEW ATTRIBUTE..."
                              className="flex-1 h-10 bg-black/40 border border-white/10 rounded-sm px-4 text-xs font-bold text-white uppercase tracking-widest placeholder:text-white/10 focus:border-gold outline-none transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => onAddOptionValue(originalIdx)}
                              className="h-10 px-4 bg-charcoal border border-white/10 text-white/40 hover:text-white hover:border-gold/40 transition-all shadow-xl active:scale-95"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ));
            })()}

            <button
              type="button"
              onClick={onRegenerateVariants}
              className="w-full flex items-center justify-center gap-3 py-4 bg-ink border border-dashed border-white/10 text-gold/60 font-black text-[10px] uppercase tracking-[0.3em] hover:bg-gold/5 hover:border-gold/40 hover:text-gold transition-all group"
            >
              <Sparkles size={16} className="group-hover:rotate-12 transition-transform" />
              Re-Sync Matrix Logic
            </button>
          </div>
        ) : (
          <div className="py-16 flex flex-col items-center justify-center gap-6 bg-ink/20 border border-dashed border-white/5 rounded-sm opacity-30 group hover:opacity-50 transition-opacity">
            <div className="h-20 w-20 rounded-full border border-white/10 flex items-center justify-center bg-white/[0.02] shadow-inner">
               <Zap size={40} className="text-white/20 group-hover:text-gold transition-colors" />
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 leading-relaxed">
                NO ATTRIBUTE MATRICES MAPPED
              </p>
              <p className="text-[8px] font-bold uppercase tracking-widest text-white/20 mt-1 italic">
                Awaiting Authorization of Asset Metadata
              </p>
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
