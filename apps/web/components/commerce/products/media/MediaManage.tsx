"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Upload,
  Link2,
  X,
  Search,
  Image as ImageIcon,
  Clock,
  Trash2,
  Plus,
  Terminal,
  Database,
  Layers,
} from "lucide-react";

export const MediaUploader = ({
  onSelect,
  hideHeader = false,
}: {
  onSelect?: (item: any) => void;
  hideHeader?: boolean;
}) => {
  const [activeTab, setActiveTab] = useState<string>("upload");
  const [uploadMethod, setUploadMethod] = useState<string>("file");
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [mediaLibrary, setMediaLibrary] = useState<any[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const fileObjects = files.map((file: File) => ({
      file,
      filename: file.name,
      alt: "",
      preview: URL.createObjectURL(file),
      size: (file.size / 1024).toFixed(0) + " KB",
      foldername: "",
      type: "image",
    }));
    setSelectedFiles([...selectedFiles, ...fileObjects]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.dataTransfer.files) return;
    const files = Array.from(e.dataTransfer.files);
    const fileObjects = files.map((file: File) => ({
      file,
      filename: file.name,
      alt: "",
      preview: URL.createObjectURL(file),
      size: (file.size / 1024).toFixed(0) + " KB",
      foldername: "",
      type: "image",
    }));
    setSelectedFiles([...selectedFiles, ...fileObjects]);
  };

  const updateFileMetadata = (index: number, field: string, value: string) => {
    const updated = [...selectedFiles];
    updated[index][field] = value;
    setSelectedFiles(updated);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    const newMedia = selectedFiles.map((file: any, idx: number) => ({
      id: mediaLibrary.length + idx + 1,
      filename: file.filename,
      url: file.preview,
      alt: file.alt || file.filename,
      file: file.file,
      foldername: file.foldername ? file.foldername : "Uncategorized",
      type: file.type,
    }));

    const formData: any = new FormData();
    for (let i of newMedia) {
      formData.append("files", i.file);
      formData.append("name", i.filename);
      formData.append("altText", i.alt);
      formData.append("foldername", i.foldername);
    }

    try {
      const response = await fetch("/api/admin/media", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        setMediaLibrary([...data.data, ...mediaLibrary]);
        setSelectedFiles([]);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleUrlUpload = () => {
    if (!urlInput) return;

    const newMedia = {
      id: mediaLibrary.length + 1,
      name: "Image from URL",
      url: urlInput,
      alt: "Image from URL",
      date: new Date().toISOString().split("T")[0],
      size: "N/A",
    };

    setMediaLibrary([newMedia, ...mediaLibrary]);
    setUrlInput("");
  };

  const folders = Array.from(
    new Set(
      mediaLibrary
        .map((item: any) => item.foldername)
        .filter((name) => name && name.trim() !== ""),
    ),
  ).sort();

  const filteredMedia = mediaLibrary.filter((item: any) => {
    const matchesSearch =
      item.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.alt.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFolder =
      selectedFolder === null || item.foldername === selectedFolder;

    return matchesSearch && matchesFolder;
  });

  useEffect(() => {
    async function getMedia() {
      const response = await fetch("/api/admin/media");
      const data = await response.json();
      if (data.success) {
        setMediaLibrary(data.data);
      }
    }
    getMedia();
  }, []);

  return (
    // <div className="min-h-screen bg-ink p-4 md:p-8">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full h-full mx-auto"
    >
      {/* Tactical Header */}
      {!hideHeader && (
        <div className="mb-10 border-l-4 border-gold pl-6">
          <div className="flex items-center gap-3 mb-2">
            <Database className="text-gold" size={24} />
            <h1 className="text-3xl font-black text-white uppercase tracking-[0.2em]">
              Media <span className="text-gold">Intelligence</span>
            </h1>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic opacity-70">
            Centralized asset management and tactical deployment protocol.
          </p>
        </div>
      )}

      {/* Tactical Tabs */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="flex gap-1 bg-charcoal p-1 rounded-sm border border-charcoal-light self-start">
          {["upload", "library"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-6 py-2 text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === tab
                  ? "bg-gold text-ink"
                  : "text-slate-400 hover:text-gold"
              }`}
            >
              {tab === "upload" ? "Initiate Upload" : "Asset Repository"}
            </button>
          ))}
        </div>

        {activeTab === "library" && (
          <div className="flex-1 relative group">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gold opacity-50 group-focus-within:opacity-100 transition-opacity"
              size={16}
            />
            <input
              type="text"
              placeholder="PROBE REPOSITORY..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-ink border border-charcoal-light text-white text-xs font-bold placeholder:text-slate-600 focus:outline-none focus:border-gold transition-all uppercase tracking-widest"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === "upload" ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-6"
          >
            <div className="flex gap-2 p-1 bg-charcoal border border-charcoal-light w-fit rounded-sm">
              {[
                { value: "file", icon: Upload, label: "Hard Drive" },
                { value: "url", icon: Link2, label: "Network URL" },
              ].map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => setUploadMethod(value)}
                  className={`flex items-center gap-2 px-6 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all ${
                    uploadMethod === value
                      ? "bg-olive text-white shadow-lg"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>

            {uploadMethod === "file" ? (
              <div className="space-y-6">
                <motion.div
                  whileHover={{ scale: 1.005 }}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => document.getElementById("fileInput")?.click()}
                  className="relative bg-charcoal border-2 border-dashed border-charcoal-light rounded-sm p-16 text-center cursor-pointer transition-all hover:border-gold group"
                >
                  <input
                    id="fileInput"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="w-20 h-20 mx-auto mb-6 bg-ink border border-charcoal-light flex items-center justify-center group-hover:border-gold transition-colors">
                    <Upload
                      className="text-slate-500 group-hover:text-gold transition-colors"
                      size={32}
                    />
                  </div>
                  <p className="text-sm font-black text-white uppercase tracking-[0.2em] mb-2">
                    Awaiting Deployment Signals
                  </p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                    Drop assets or probe files • Max payload: 100MB
                  </p>
                </motion.div>

                {selectedFiles.length > 0 && (
                  <motion.div className="space-y-4">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="bg-charcoal border border-charcoal-light p-4 flex gap-6"
                      >
                        <img
                          src={file.preview}
                          alt=""
                          className="w-24 h-24 object-cover border border-charcoal-light"
                        />
                        <div className="flex-1 space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-xs font-black text-gold uppercase tracking-widest truncate max-w-xs">
                                {file.filename}
                              </p>
                              <p className="text-[10px] font-bold text-slate-500">
                                {file.size}
                              </p>
                            </div>
                            <button
                              onClick={() => removeFile(index)}
                              className="p-2 hover:bg-red-500/10 text-slate-600 hover:text-red-500 transition-all"
                            >
                              <X size={18} />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                              type="text"
                              value={file.alt}
                              onChange={(e) =>
                                updateFileMetadata(index, "alt", e.target.value)
                              }
                              placeholder="DESCRIPTIVE TAG (ALT)"
                              className="bg-ink border border-charcoal-light p-3 text-[10px] font-bold text-white focus:border-gold outline-none uppercase tracking-widest"
                            />
                            <input
                              type="text"
                              value={file.foldername}
                              onChange={(e) =>
                                updateFileMetadata(
                                  index,
                                  "foldername",
                                  e.target.value,
                                )
                              }
                              placeholder="SECTOR/FOLDER"
                              className="bg-ink border border-charcoal-light p-3 text-[10px] font-bold text-white focus:border-gold outline-none uppercase tracking-widest"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={handleUpload}
                      className="w-full py-4 bg-olive text-white font-black uppercase tracking-[0.3em] text-xs hover:bg-olive-light transition-all shadow-xl shadow-olive/10"
                    >
                      Execute Upload Sequence ({selectedFiles.length} Assets)
                    </button>
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="bg-charcoal border border-charcoal-light p-8">
                <label className="block text-[10px] font-black text-gold uppercase tracking-widest mb-4">
                  Remote Intel Link
                </label>
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="HTTPS://TACTICAL-INTEL.COM/IMAGE.JPG"
                    className="flex-1 bg-ink border border-charcoal-light p-4 text-xs font-bold text-white focus:border-gold outline-none uppercase tracking-widest"
                  />
                  <button
                    onClick={handleUrlUpload}
                    className="px-8 py-4 bg-gold text-ink font-black uppercase tracking-widest text-xs hover:bg-white transition-all flex items-center gap-2"
                  >
                    <Plus size={16} /> Intercept
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="library"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {folders.length > 0 && (
              <div className="flex flex-wrap gap-2 pb-4 border-b border-charcoal-light">
                <button
                  onClick={() => setSelectedFolder(null)}
                  className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                    selectedFolder === null
                      ? "bg-gold text-ink"
                      : "bg-charcoal text-slate-400 border border-charcoal-light"
                  }`}
                >
                  All Sectors
                </button>
                {folders.map((folder: any) => (
                  <button
                    key={folder}
                    onClick={() => setSelectedFolder(folder)}
                    className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                      selectedFolder === folder
                        ? "bg-gold text-ink"
                        : "bg-charcoal text-slate-400 border border-charcoal-light"
                    }`}
                  >
                    {folder}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <AnimatePresence>
                {filteredMedia.map((item: any, index: number) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -5 }}
                    onClick={() => setSelectedMedia(item)}
                    className="group relative bg-charcoal border border-charcoal-light rounded-sm overflow-hidden cursor-pointer hover:border-gold transition-all"
                  >
                    <div className="aspect-square bg-ink overflow-hidden border-b border-charcoal-light">
                      <img
                        src={item.url}
                        alt={item.alt}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                      />
                    </div>
                    <div className="p-3 bg-charcoal-dark">
                      <p className="text-[9px] font-black text-slate-200 uppercase tracking-widest truncate">
                        {item.filename}
                      </p>
                      <div className="flex items-center gap-2 mt-1 opacity-50">
                        <Clock size={10} className="text-gold" />
                        <span className="text-[8px] font-bold text-slate-400 uppercase">
                          {(item.size / 1024).toFixed(0)} KB
                        </span>
                      </div>
                    </div>

                    <div className="absolute inset-0 bg-gold/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="flex gap-2">
                        <button className="p-2 bg-olive hover:bg-white text-white hover:text-ink transition-all shadow-lg">
                          <Plus size={14} />
                        </button>
                        <button className="p-2 bg-red-600 hover:bg-white text-white hover:text-ink transition-all shadow-lg">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {filteredMedia.length === 0 && (
              <div className="text-center py-20 bg-charcoal border border-charcoal-light">
                <Terminal className="mx-auto mb-4 text-slate-700" size={48} />
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">
                  No assets localized in current sector.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tactical Detail Modal */}
      <AnimatePresence>
        {selectedMedia && (
          <div
            className="fixed inset-0 bg-ink/90 backdrop-blur-md flex items-center justify-center p-6 z-[100]"
            onClick={() => setSelectedMedia(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              className="bg-charcoal border-2 border-gold p-1 max-w-3xl w-full shadow-[0_0_50px_rgba(212,175,55,0.15)]"
            >
              <div className="bg-ink p-6">
                <div className="flex items-center justify-between mb-6 border-b border-charcoal pb-4">
                  <div className="flex items-center gap-3">
                    <Layers size={20} className="text-gold" />
                    <h3 className="text-lg font-black text-white uppercase tracking-[0.2em]">
                      Asset <span className="text-gold">Intelligence</span>
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedMedia(null)}
                    className="p-2 text-slate-500 hover:text-gold transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-charcoal p-2 border border-charcoal-light">
                    <img
                      src={selectedMedia.url}
                      alt=""
                      className="w-full h-auto object-contain bg-ink"
                    />
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="border-l-2 border-gold pl-4">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                          Codename
                        </p>
                        <p className="text-sm font-black text-white uppercase tracking-widest">
                          {selectedMedia.filename}
                        </p>
                      </div>
                      <div className="border-l-2 border-olive pl-4">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                          Sector Path
                        </p>
                        <p className="text-sm font-black text-white uppercase tracking-widest">
                          {selectedMedia.foldername || "ROOT SECURE"}
                        </p>
                      </div>
                      <div className="border-l-2 border-slate-700 pl-4">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                          Payload Size
                        </p>
                        <p className="text-sm font-black text-white uppercase tracking-widest">
                          {typeof selectedMedia.size === "number"
                            ? `${(selectedMedia.size / 1024).toFixed(0)} KB`
                            : selectedMedia.size}
                        </p>
                      </div>
                    </div>

                    {onSelect ? (
                      <button
                        onClick={() => {
                          onSelect(selectedMedia);
                          setSelectedMedia(null);
                        }}
                        className="w-full py-4 bg-olive text-white font-black uppercase tracking-[0.2em] text-xs hover:bg-white hover:text-ink transition-all"
                      >
                        Deploy to Interface
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedMedia.url);
                          setSelectedMedia(null);
                        }}
                        className="w-full py-4 bg-charcoal-light text-white font-black uppercase tracking-[0.2em] text-xs hover:bg-gold hover:text-ink transition-all border border-charcoal-light"
                      >
                        Copy Intel URL
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
    // </div>
  );
};
