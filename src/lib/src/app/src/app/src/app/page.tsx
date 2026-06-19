"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { UploadCloud, Search, FileText, Download, Trash2, Loader2, File as FileIcon } from "lucide-react";

type Material = {
  id: string;
  title: string;
  file_url: string;
  file_type: string;
  file_size: number;
  upload_date: string;
};

export default function LibraryDashboard() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ];

  useEffect(() => {
    fetchMaterials();
  }, []);

  async function fetchMaterials() {
    setLoading(true);
    const { data, error } = await supabase
      .from("materials")
      .select("*")
      .order("upload_date", { ascending: false });
    
    if (!error && data) setMaterials(data);
    setLoading(false);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!allowedTypes.includes(file.type)) {
      alert("Invalid file type. Only PDF, DOCX, and PPTX are allowed.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      alert("File is too large. Max 50MB.");
      return;
    }

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from("library")
      .upload(fileName, file);

    if (uploadError) {
      alert("Upload failed");
      setUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("library")
      .getPublicUrl(fileName);

    const newMaterial = {
      title: file.name,
      file_url: publicUrlData.publicUrl,
      file_type: fileExt?.toUpperCase() || "UNKNOWN",
      file_size: file.size,
    };

    const { error: dbError } = await supabase.from("materials").insert(newMaterial);

    if (!dbError) fetchMaterials();
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleDelete(id: string, fileUrl: string) {
    if (!confirm("Delete this file?")) return;
    
    const fileName = fileUrl.split("/").pop();
    if (fileName) {
      await supabase.storage.from("library").remove([fileName]);
    }
    await supabase.from("materials").delete().eq("id", id);
    fetchMaterials();
  }

  function formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024, dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }

  const filteredMaterials = materials.filter(m => 
    m.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">E-Library</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage and browse your documents.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search files..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
            />
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept=".pdf,.doc,.docx,.ppt,.pptx"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
            <span className="hidden md:inline">{uploading ? 'Uploading...' : 'Upload File'}</span>
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-white/50 dark:bg-slate-900/50">
          <FileText className="w-12 h-12 text-slate-400 mb-3" />
          <h3 className="text-lg font-medium">No files found</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Upload a document to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMaterials.map((material) => (
            <div key={material.id} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
                    <FileIcon className="w-6 h-6" />
                  </div>
                  <h3 className="font-medium truncate" title={material.title}>{material.title}</h3>
                </div>
              </div>
              
              <div className="mt-auto">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-4">
                  <span>{new Date(material.upload_date).toLocaleDateString()}</span>
                  <span>{formatBytes(material.file_size)} • {material.file_type}</span>
                </div>
                
                <div className="flex gap-2">
                  <a 
                    href={material.file_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                  >
                    <Download className="w-4 h-4" /> Download
                  </a>
                  <button 
                    onClick={() => handleDelete(material.id, material.file_url)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
