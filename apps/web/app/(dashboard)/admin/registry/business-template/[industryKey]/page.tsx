"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { IndustryEditor } from "@/components/admin/registry/IndustryEditor";
import { Loader2, X } from "lucide-react";

interface IndustryEditorPageProps {
  params: Promise<{
    industryKey: string;
  }>;
}

export default function IndustryEditorPage({
  params,
}: IndustryEditorPageProps) {
  const { industryKey } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [industryDoc, setIndustryDoc] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/system/templates");
        const data = await res.json();
        if (!res.ok) throw new Error("Failed to fetch templates");

        const industry = data.find(
          (i: any) =>
            i.key === industryKey ||
            i.industry.toLowerCase().replace(/\s+/g, "-") === industryKey,
        );

        if (!industry) throw new Error("Industry not found");

        setIndustryDoc(industry);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [industryKey]);

  const handleSave = async (updatedDoc: any) => {
    setSaving(true);
    try {
      const res = await fetch("/api/system/templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedDoc),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save industry changes");
      }

      router.push("/admin/registry?tab=templates");
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
        <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">
          Loading Industry Template...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 p-8 text-center">
        <div className="h-12 w-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-2">
          <X size={24} />
        </div>
        <h2 className="text-lg font-bold text-white uppercase tracking-tight">
          Configuration Error
        </h2>
        <p className="text-sm text-slate-400 max-w-md">{error}</p>
        <button
          onClick={() => router.push("/admin/registry")}
          className="mt-4 px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-all"
        >
          Back to Registry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <IndustryEditor
        initialData={industryDoc}
        onSave={handleSave}
        onCancel={() => router.push("/admin/registry")}
        saving={saving}
      />
    </div>
  );
}
