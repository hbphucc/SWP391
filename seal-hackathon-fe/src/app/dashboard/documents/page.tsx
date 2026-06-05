"use client";
import { useState, useRef, useEffect } from "react";
import { FileText, Download, Upload, Folder, MoreVertical } from "lucide-react";
import { App } from "antd";

type DocumentItem = {
  name: string;
  size: string;
  date: string;
  type: string;
};

export default function DocumentsPage() {
  const { message } = App.useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<DocumentItem[]>([]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const defaultDocs: DocumentItem[] = [
        { name: "SEAL_Hackathon_Rulebook.pdf", size: "2.4 MB", date: "May 10", type: "pdf" },
        { name: "Judging_Rubric_v2.xlsx", size: "1.1 MB", date: "May 12", type: "excel" },
        { name: "Sponsorship_Deck.pptx", size: "5.6 MB", date: "May 15", type: "powerpoint" },
      ];
      const stored = localStorage.getItem("mock_documents");
      if (stored) {
        setDocs(JSON.parse(stored) as DocumentItem[]);
      } else {
        localStorage.setItem("mock_documents", JSON.stringify(defaultDocs));
        setDocs(defaultDocs);
      }
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Simulate file upload
      const newDoc = {
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(1) + " MB",
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        type: file.name.split('.').pop() || "unknown"
      };
      
      const newDocs = [newDoc, ...docs];
      setDocs(newDocs);
      localStorage.setItem("mock_documents", JSON.stringify(newDocs));
      message.success("File uploaded successfully!");
    }
    // Reset input
    if (e.target) e.target.value = '';
  };

  const handleDownload = (docName: string) => {
    // Simulate a download by creating a blob and an anchor tag
    const blob = new Blob(["This is a simulated mock file for " + docName], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = docName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    message.success(`Downloading ${docName}...`);
  };

  return (
    <div style={{ maxWidth: 1100, height: "calc(100vh - 100px)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div className="page-header" style={{ flexShrink: 0 }}>
        <div>
          <h1 className="page-title">Documents Library</h1>
          <p className="page-subtitle">Manage official hackathon resources</p>
        </div>
        <div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            style={{ display: 'none' }} 
          />
          <button className="btn btn-primary" onClick={handleUploadClick}>
            <Upload size={15} style={{ marginRight: "0.5rem" }} /> Upload File
          </button>
        </div>
      </div>

      <div className="glass-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem", flexShrink: 0 }}>
        {["Rules & Guidelines", "Templates", "Marketing Assets"].map(folder => (
          <div key={folder} className="glass-card" style={{ display: "flex", alignItems: "center", gap: "1rem", cursor: "pointer", transition: "transform 0.2s" }} onMouseOver={e => e.currentTarget.style.transform = "translateY(-2px)"} onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}>
            <Folder size={24} style={{ color: "var(--color-primary)" }} />
            <div style={{ fontWeight: 600, color: "var(--color-text-1)" }}>{folder}</div>
          </div>
        ))}
      </div>

      <div className="glass-card" style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", padding: 0 }}>
        <h4 style={{ padding: "1.25rem 1.5rem", margin: 0, borderBottom: "1px solid var(--color-border-1)", color: "var(--color-text-1)", background: "rgba(255,255,255,0.02)" }}>Recent Files</h4>
        <div style={{ display: "flex", flexDirection: "column", overflowY: "auto", flex: 1 }}>
          {docs.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-3)" }}>No documents found.</div>
          ) : docs.map((d, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.5rem", borderBottom: i === docs.length - 1 ? "none" : "1px solid var(--color-border-1)", transition: "background 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <FileText size={18} style={{ color: "var(--color-primary-2)" }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--color-text-1)" }}>{d.name}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--color-text-3)", marginTop: "0.25rem" }}>{d.size} · Uploaded {d.date}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button className="btn btn-sm" onClick={() => handleDownload(d.name)} style={{ background: "rgba(99,102,241,0.1)", color: "var(--color-primary-2)", padding: "0.4rem 0.8rem", border: "1px solid rgba(99,102,241,0.2)" }}>
                  <Download size={14} style={{ marginRight: 4 }} /> Download
                </button>
                <button className="btn btn-ghost btn-sm btn-icon"><MoreVertical size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
