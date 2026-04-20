"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Link as LinkIcon,
  Grid,
  Menu as MenuIcon,
  Save,
  X,
  Edit2,
} from "lucide-react";
import {
  NavigationDocument,
  NavigationItem,
  NavigationItemType,
  NavigationItemTarget,
  MegaMenuColumn,
} from "@/lib/models/navigation";

export default function NavigationManager({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const [navigations, setNavigations] = useState<NavigationDocument[]>([]);
  const [selectedNav, setSelectedNav] = useState<NavigationDocument | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchNavigations();
  }, []);

  const fetchNavigations = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/navigations");
      const data = await res.json();
      setNavigations(data);
      if (data.length > 0 && !selectedNav) {
        // setSelectedNav(data[0]);
      }
    } catch (error) {
      console.error("Failed to fetch navigations", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNav = async () => {
    const name = prompt("Enter navigation menu name (e.g., Primary Menu):");
    if (!name) return;

    try {
      const res = await fetch("/api/navigations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, items: [] }),
      });
      const data = await res.json();
      if (data.success) {
        fetchNavigations();
      }
    } catch (error) {
      console.error("Failed to create navigation", error);
    }
  };

  const handleSaveNav = async () => {
    if (!selectedNav || !selectedNav._id) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/navigations/${selectedNav._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: selectedNav.name,
          items: selectedNav.items,
        }),
      });
      if (res.ok) {
        fetchNavigations();
        // alert('Navigation saved successfully');
      }
    } catch (error) {
      console.error("Failed to save navigation", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNav = async (id: string) => {
    if (!confirm("Are you sure you want to delete this menu?")) return;
    try {
      const res = await fetch(`/api/navigations/${id}`, { method: "DELETE" });
      if (res.ok) {
        if (selectedNav?._id?.toString() === id) {
          setSelectedNav(null);
        }
        fetchNavigations();
      }
    } catch (error) {
      console.error("Failed to delete navigation", error);
    }
  };

  const updateNavItems = (newItems: NavigationItem[]) => {
    if (!selectedNav) return;
    setSelectedNav({ ...selectedNav, items: newItems });
  };

  return (
    <div
      className={`flex ${embedded ? "flex-col h-full bg-white text-slate-900 border-none" : "h-full bg-slate-950 text-slate-200"}`}
    >
      {/* Sidebar - Menu List */}
      <div
        className={`${embedded ? "w-full" : "w-64 border-r border-slate-800"} flex flex-col`}
      >
        <div
          className={`p-4 border-b ${embedded ? "border-slate-100" : "border-slate-800"} flex justify-between items-center`}
        >
          <h2
            className={`font-semibold text-xs uppercase tracking-wider ${embedded ? "text-slate-500" : "text-slate-400"}`}
          >
            Menus
          </h2>
          <button
            onClick={handleCreateNav}
            className={`p-1.5 rounded-md transition-colors ${embedded ? "hover:bg-slate-100 text-violet-600" : "hover:bg-slate-800 text-cyan-400"}`}
            title="Create New Menu"
          >
            <Plus size={18} />
          </button>
        </div>
        <div
          className={`flex-1 overflow-y-auto p-2 space-y-1 ${embedded && selectedNav ? "hidden" : ""}`}
        >
          {isLoading ? (
            <div className="p-4 text-center text-slate-500 text-xs">
              Loading...
            </div>
          ) : navigations.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-xs italic">
              No menus created yet
            </div>
          ) : (
            navigations.map((nav) => (
              <button
                key={nav._id?.toString()}
                onClick={() => setSelectedNav(nav)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm flex justify-between items-center group transition-colors ${
                  selectedNav?._id?.toString() === nav._id?.toString()
                    ? embedded
                      ? "bg-violet-50 text-violet-700 border border-violet-200"
                      : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                    : embedded
                      ? "hover:bg-slate-50 text-slate-600"
                      : "hover:bg-slate-800 text-slate-400"
                }`}
              >
                <span className="truncate font-medium">{nav.name}</span>
                <Trash2
                  size={14}
                  className={`opacity-0 group-hover:opacity-100 transition-all ${embedded ? "hover:text-red-600" : "hover:text-red-400"}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteNav(nav._id?.toString()!);
                  }}
                />
              </button>
            ))
          )}
        </div>
      </div>

      {/* Editor Area */}
      <div
        className={`flex-1 flex flex-col ${embedded ? "bg-white" : "bg-slate-900/50"}`}
      >
        {selectedNav ? (
          <>
            <div
              className={`p-4 border-b ${embedded ? "border-slate-100 bg-slate-50/50" : "border-slate-800 bg-slate-950/40"} flex justify-between items-center`}
            >
              <div className="flex items-center gap-2">
                {embedded && (
                  <button
                    onClick={() => setSelectedNav(null)}
                    className="p-1 hover:bg-slate-200 rounded text-slate-500 mr-1"
                  >
                    <ChevronRight size={16} className="rotate-180" />
                  </button>
                )}
                <div>
                  <h1
                    className={`text-sm font-bold flex items-center gap-2 ${embedded ? "text-slate-900" : "text-white"}`}
                  >
                    {!embedded && (
                      <MenuIcon size={20} className="text-cyan-400" />
                    )}
                    {selectedNav.name}
                  </h1>
                  {!embedded && (
                    <p className="text-xs text-slate-500">
                      ID: {selectedNav._id?.toString()}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={handleSaveNav}
                disabled={isSaving}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50 ${
                  embedded
                    ? "bg-violet-600 hover:bg-violet-700 text-white shadow-sm"
                    : "bg-cyan-600 hover:bg-cyan-500 text-white"
                }`}
              >
                <Save size={14} />
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
            <div
              className={`flex-1 overflow-y-auto ${embedded ? "p-3" : "p-6"}`}
            >
              <div className={`${embedded ? "w-full" : "max-w-4xl mx-auto"}`}>
                <NavigationItemsEditor
                  items={selectedNav.items}
                  onChange={updateNavItems}
                  embedded={embedded}
                />
                <button
                  onClick={() => {
                    const newItem: NavigationItem = {
                      id: crypto.randomUUID(),
                      label: "New Link",
                      url: "#",
                      target: "_self",
                      type: "link",
                    };
                    updateNavItems([...selectedNav.items, newItem]);
                  }}
                  className={`mt-4 w-full py-3 border-2 border-dashed rounded-lg transition-all flex justify-center items-center gap-2 font-medium text-xs ${
                    embedded
                      ? "border-slate-200 text-slate-400 hover:text-violet-600 hover:border-violet-300 hover:bg-violet-50/30"
                      : "border-slate-800 text-slate-500 hover:text-cyan-400 hover:border-cyan-400/30 hover:bg-cyan-400/5"
                  }`}
                >
                  <Plus size={16} />
                  Add Menu Item
                </button>
              </div>
            </div>
          </>
        ) : (
          !embedded && (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
              <MenuIcon size={48} className="mb-4 opacity-20" />
              <p>Select a menu from the sidebar to start editing</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function NavigationItemsEditor({
  items,
  onChange,
  depth = 0,
  embedded = false,
}: {
  items: NavigationItem[];
  onChange: (items: NavigationItem[]) => void;
  depth?: number;
  embedded?: boolean;
}) {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {},
  );

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const updateItem = (id: string, updates: Partial<NavigationItem>) => {
    const newItems = items.map((item) => {
      if (item.id === id) return { ...item, ...updates };
      return item;
    });
    onChange(newItems);
  };

  const deleteItem = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  const moveItem = (index: number, direction: "up" | "down") => {
    const newItems = [...items];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const [movedItem] = newItems.splice(index, 1);
    newItems.splice(targetIndex, 0, movedItem);
    onChange(newItems);
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={item.id} className="group relative">
          <div
            className={`p-2 ${embedded ? "bg-slate-50" : "bg-slate-800/80"} border ${embedded ? "border-slate-200" : "border-slate-700/50"} rounded-lg shadow-sm hover:border-slate-400/50 transition-all ${depth > 0 ? "ml-4 border-l-2" : ""}`}
          >
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-1 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => moveItem(index, "up")}
                  disabled={index === 0}
                  className="hover:text-cyan-400 disabled:opacity-20"
                >
                  <ChevronDown size={14} className="rotate-180" />
                </button>
                <button
                  onClick={() => moveItem(index, "down")}
                  disabled={index === items.length - 1}
                  className="hover:text-cyan-400 disabled:opacity-20"
                >
                  <ChevronDown size={14} />
                </button>
              </div>

              <div className="flex-1 grid grid-cols-12 gap-2 items-center">
                <div className="col-span-4">
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) =>
                      updateItem(item.id, { label: e.target.value })
                    }
                    className={`w-full bg-transparent border-b border-transparent focus:border-violet-500 outline-none font-medium py-1 px-1 text-xs`}
                    placeholder="Label"
                  />
                </div>
                <div className="col-span-4">
                  <div
                    className={`flex items-center gap-1 text-[10px] ${embedded ? "text-slate-400" : "text-slate-500"} focus-within:text-violet-500`}
                  >
                    <LinkIcon size={10} />
                    <input
                      type="text"
                      value={item.url}
                      onChange={(e) =>
                        updateItem(item.id, { url: e.target.value })
                      }
                      className="w-full bg-transparent border-b border-transparent focus:border-violet-500 outline-none py-1"
                      placeholder="URL"
                    />
                  </div>
                </div>
                <div className="col-span-2">
                  <select
                    value={item.type}
                    onChange={(e) =>
                      updateItem(item.id, {
                        type: e.target.value as NavigationItemType,
                      })
                    }
                    className={`w-full ${embedded ? "bg-white border-slate-200" : "bg-slate-900 border-slate-700"} border rounded p-1 text-[10px] focus:ring-1 focus:ring-violet-500 outline-none`}
                  >
                    <option value="link">Link</option>
                    <option value="dropdown">Dropdown</option>
                    <option value="mega">Mega Menu</option>
                  </select>
                </div>
                <div className="col-span-2 flex items-center justify-end gap-2">
                  {item.type !== "link" && (
                    <button
                      onClick={() => toggleExpand(item.id)}
                      className={`p-1 rounded ${embedded ? "hover:bg-slate-200" : "hover:bg-slate-700"} transition-colors ${expandedItems[item.id] ? (embedded ? "text-violet-600" : "text-cyan-400") : "text-slate-400"}`}
                      title={
                        expandedItems[item.id]
                          ? "Collapse"
                          : "Expand nested items"
                      }
                    >
                      <Edit2 size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="p-1.5 rounded hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
                    title="Delete Item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>

            {expandedItems[item.id] && (
              <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-4">
                <div
                  className={`flex items-center gap-6 text-[10px] ${embedded ? "bg-slate-100/50" : "bg-slate-900/40"} p-2 rounded-md`}
                >
                  <label className="flex items-center gap-2 cursor-pointer hover:text-slate-600 transition-colors">
                    <input
                      type="checkbox"
                      checked={item.target === "_blank"}
                      onChange={(e) =>
                        updateItem(item.id, {
                          target: e.target.checked ? "_blank" : "_self",
                        })
                      }
                      className={`rounded ${embedded ? "border-slate-300" : "border-slate-700"} bg-white text-violet-600 focus:ring-violet-500`}
                    />
                    Open in new tab
                  </label>
                  <div className="text-slate-600">|</div>
                  <div className="flex items-center gap-2">
                    <span className="uppercase tracking-tighter text-[10px] font-bold opacity-30">
                      Type: {item.type}
                    </span>
                  </div>
                </div>

                {item.type === "dropdown" && (
                  <div className="space-y-3 pl-4 border-l border-slate-700">
                    <h4 className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2 flex items-center gap-2">
                      <ChevronRight size={10} />
                      Sub-menu Items
                    </h4>
                    <NavigationItemsEditor
                      items={item.children || []}
                      onChange={(newChildren) =>
                        updateItem(item.id, { children: newChildren })
                      }
                      depth={depth + 1}
                      embedded={embedded}
                    />
                    <button
                      onClick={() => {
                        const newChild: NavigationItem = {
                          id: crypto.randomUUID(),
                          label: "Sub Item",
                          url: "#",
                          target: "_self",
                          type: "link",
                        };
                        updateItem(item.id, {
                          children: [...(item.children || []), newChild],
                        });
                      }}
                      className="ml-6 py-1.5 px-3 border border-dashed border-slate-700 rounded text-xs text-slate-500 hover:text-cyan-400 hover:border-cyan-400/30 transition-all flex items-center gap-2"
                    >
                      <Plus size={14} />
                      Add Sub-Item
                    </button>
                  </div>
                )}

                {item.type === "mega" && (
                  <div className="space-y-4 pl-4 border-l border-cyan-900/50">
                    <h4 className="text-[10px] uppercase tracking-wider text-cyan-500 font-semibold mb-2 flex items-center gap-2">
                      <Grid size={10} />
                      Mega Menu Columns
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(item.megaMenuColumns || []).map((col, colIdx) => (
                        <div
                          key={colIdx}
                          className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 group/col relative"
                        >
                          <button
                            onClick={() => {
                              const newCols = [...(item.megaMenuColumns || [])];
                              newCols.splice(colIdx, 1);
                              updateItem(item.id, { megaMenuColumns: newCols });
                            }}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover/col:opacity-100 transition-opacity z-10"
                          >
                            <Trash2 size={10} />
                          </button>
                          <input
                            type="text"
                            value={col.title}
                            onChange={(e) => {
                              const newCols = [...(item.megaMenuColumns || [])];
                              newCols[colIdx].title = e.target.value;
                              updateItem(item.id, { megaMenuColumns: newCols });
                            }}
                            className="w-full bg-transparent border-b border-slate-700 focus:border-cyan-500 outline-none text-xs font-bold mb-3 pb-1"
                            placeholder="Column Title"
                          />
                          <div className="space-y-2">
                            {col.links.map((link, linkIdx) => (
                              <div
                                key={linkIdx}
                                className="flex flex-col gap-1 p-2 bg-slate-950/40 rounded border border-transparent hover:border-slate-800 transition-all group/link relative"
                              >
                                <button
                                  onClick={() => {
                                    const newCols = [
                                      ...(item.megaMenuColumns || []),
                                    ];
                                    newCols[colIdx].links.splice(linkIdx, 1);
                                    updateItem(item.id, {
                                      megaMenuColumns: newCols,
                                    });
                                  }}
                                  className="absolute top-1 right-1 text-slate-700 hover:text-red-400 opacity-0 group-hover/link:opacity-100 transition-opacity"
                                >
                                  <X size={10} />
                                </button>
                                <input
                                  type="text"
                                  value={link.label}
                                  onChange={(e) => {
                                    const newCols = [
                                      ...(item.megaMenuColumns || []),
                                    ];
                                    newCols[colIdx].links[linkIdx].label =
                                      e.target.value;
                                    updateItem(item.id, {
                                      megaMenuColumns: newCols,
                                    });
                                  }}
                                  className="w-full bg-transparent outline-none text-[10px] focus:text-cyan-400"
                                  placeholder="Link Label"
                                />
                                <input
                                  type="text"
                                  value={link.url}
                                  onChange={(e) => {
                                    const newCols = [
                                      ...(item.megaMenuColumns || []),
                                    ];
                                    newCols[colIdx].links[linkIdx].url =
                                      e.target.value;
                                    updateItem(item.id, {
                                      megaMenuColumns: newCols,
                                    });
                                  }}
                                  className="w-full bg-transparent outline-none text-[9px] text-slate-600 focus:text-cyan-600"
                                  placeholder="URL"
                                />
                              </div>
                            ))}
                            <button
                              onClick={() => {
                                const newCols = [
                                  ...(item.megaMenuColumns || []),
                                ];
                                newCols[colIdx].links.push({
                                  label: "New Link",
                                  url: "#",
                                });
                                updateItem(item.id, {
                                  megaMenuColumns: newCols,
                                });
                              }}
                              className="w-full py-1.5 border border-dashed border-slate-700 rounded text-[10px] text-slate-500 hover:text-cyan-400 hover:border-cyan-400/30 transition-all"
                            >
                              Add Link
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const newCol: MegaMenuColumn = {
                            title: "New Column",
                            links: [],
                          };
                          updateItem(item.id, {
                            megaMenuColumns: [
                              ...(item.megaMenuColumns || []),
                              newCol,
                            ],
                          });
                        }}
                        className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-700 rounded-lg text-slate-500 hover:text-cyan-400 hover:border-cyan-400/30 transition-all min-h-[120px]"
                      >
                        <Plus size={20} className="mb-1" />
                        <span className="text-[10px]">Add Column</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
