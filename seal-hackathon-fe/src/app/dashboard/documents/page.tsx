"use client";
import { useState, useRef, useEffect } from "react";
import { FileText, Download, Upload, Folder, MoreVertical, Trash2, Edit2 } from "lucide-react";
import { App, Dropdown } from "antd";
import { apiRequest } from "@/lib/api";

export default function DocumentsPage() {
  const { message } = App.useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<any[]>([]);
  
  // Rename state
  const [renamingIndex, setRenamingIndex] = useState<number | null>(null);
  const [newName, setNewName] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  const fetchDocuments = async () => {
    try {
      const data = await apiRequest<any[]>("/documents");
      // Format data to match UI expectations
      const formattedDocs = data.map(d => ({
        id: d.id,
        name: d.name,
        size: (d.sizeBytes / (1024 * 1024)).toFixed(2) + " MB",
        date: new Date(d.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        type: d.type
      }));
      setDocs(formattedDocs);
    } catch (error: any) {
      message.error(error.message || "Tải tài liệu thất bại");
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem("currentUser") || sessionStorage.getItem("currentUser");
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
    fetchDocuments();
  }, []);

  const isAdmin = currentUser?.role?.toLowerCase()?.includes("admin") || false;

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        message.error("Tập tin quá lớn. Vui lòng tải lên tập tin dưới 20MB.");
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      try {
        message.loading({ content: "Đang tải lên...", key: "uploading" });
        await apiRequest("/documents/upload", {
          method: "POST",
          body: formData,
        });
        message.success({ content: "Tải lên tập tin thành công!", key: "uploading" });
        fetchDocuments();
      } catch (error: any) {
        message.error({ content: error.message || "Tải lên tập tin thất bại", key: "uploading" });
      }
    }
    if (e.target) e.target.value = '';
  };

  const handleDownload = (doc: any) => {
    // API endpoint for downloading the file
    const url = `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://seal-bhc5f6d9a6abe8ev.southeastasia-01.azurewebsites.net/api"}/documents/download/${doc.id}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDelete = async (index: number) => {
    const doc = docs[index];
    try {
      await apiRequest(`/documents/${doc.id}`, { method: "DELETE" });
      message.success("Xóa tập tin thành công!");
      setDocs(docs.filter((_, i) => i !== index));
    } catch (error: any) {
      message.error(error.message || "Xóa tập tin thất bại");
    }
  };

  const openRenameModal = (index: number) => {
    setRenamingIndex(index);
    const docName = docs[index].name;
    const lastDotIndex = docName.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      setNewName(docName.substring(0, lastDotIndex));
    } else {
      setNewName(docName);
    }
  };

  const handleRenameSubmit = async () => {
    if (renamingIndex === null) return;
    if (!newName.trim()) {
      message.error("Tên tập tin không được để trống");
      return;
    }
    
    const doc = docs[renamingIndex];
    const oldName = doc.name;
    const extensionMatch = oldName.match(/\.[^.]+$/);
    const extension = extensionMatch ? extensionMatch[0] : '';
    
    let finalName = newName.trim();
    if (extension && !finalName.endsWith(extension)) {
      finalName += extension;
    }

    try {
      await apiRequest(`/documents/${doc.id}/rename`, {
        method: "PUT",
        body: JSON.stringify({ newName: finalName }),
      });
      message.success("Đổi tên tập tin thành công!");
      fetchDocuments();
      setRenamingIndex(null);
    } catch (error: any) {
      message.error(error.message || "Đổi tên tập tin thất bại");
    }
  };

  return (
    <>
      <div style={{ maxWidth: 1100, height: "calc(100vh - 100px)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div className="page-header" style={{ flexShrink: 0 }}>
          <div>
            <h1 className="page-title">Thư viện tài liệu</h1>
            <p className="page-subtitle">Quản lý tài nguyên chính thức của hackathon</p>
          </div>
          {isAdmin && (
            <div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                style={{ display: 'none' }} 
              />
              <button className="btn btn-primary" onClick={handleUploadClick}>
                <Upload size={15} style={{ marginRight: "0.5rem" }} /> Tải lên tập tin
              </button>
            </div>
          )}
        </div>

        <div className="glass-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "2rem", flexShrink: 0 }}>
          {["Quy định & Hướng dẫn", "Biểu mẫu", "Tài nguyên Marketing"].map(folder => (
            <div key={folder} className="glass-card" style={{ display: "flex", alignItems: "center", gap: "1rem", cursor: "pointer", transition: "transform 0.2s" }} onMouseOver={e => e.currentTarget.style.transform = "translateY(-2px)"} onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}>
              <Folder size={24} style={{ color: "var(--color-primary)" }} />
              <div style={{ fontWeight: 600, color: "var(--color-text-1)" }}>{folder}</div>
            </div>
          ))}
        </div>

        <div className="glass-card" style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", padding: 0 }}>
          <h4 style={{ padding: "1.25rem 1.5rem", margin: 0, borderBottom: "1px solid var(--color-border-1)", color: "var(--color-text-1)", background: "rgba(255,255,255,0.02)" }}>Tập tin gần đây</h4>
          <div style={{ display: "flex", flexDirection: "column", overflowY: "auto", flex: 1 }}>
            {docs.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-3)" }}>Không tìm thấy tài liệu nào.</div>
            ) : docs.map((d, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.5rem", borderBottom: i === docs.length - 1 ? "none" : "1px solid var(--color-border-1)", transition: "background 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <FileText size={18} style={{ color: "var(--color-primary-2)" }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--color-text-1)" }}>{d.name}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--color-text-3)", marginTop: "0.25rem" }}>{d.size} · Đã tải lên {d.date}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <button className="btn btn-sm" onClick={() => handleDownload(d)} style={{ background: "rgba(99,102,241,0.1)", color: "var(--color-primary-2)", padding: "0.4rem 0.8rem", border: "1px solid rgba(99,102,241,0.2)" }}>
                    <Download size={14} style={{ marginRight: 4 }} /> Tải xuống
                  </button>
                  {isAdmin && (
                    <Dropdown
                      menu={{
                        items: [
                          {
                            key: 'rename',
                            label: <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Edit2 size={14} /> Đổi tên</span>,
                            onClick: () => openRenameModal(i)
                          },
                          {
                            type: 'divider'
                          },
                          {
                            key: 'delete',
                            danger: true,
                            label: <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Trash2 size={14} /> Xóa tập tin</span>,
                            onClick: () => handleDelete(i)
                          }
                        ]
                      }}
                      trigger={['click']}
                      placement="bottomRight"
                    >
                      <button className="btn btn-ghost btn-sm btn-icon">
                        <MoreVertical size={14} />
                      </button>
                    </Dropdown>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rename Modal */}
      {renamingIndex !== null && (
        <div className="modal-overlay" onClick={() => setRenamingIndex(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <h2 className="modal-title">Đổi tên tập tin</h2>
            </div>
            <div className="form-group" style={{ marginBottom: "1.5rem" }}>
              <label className="form-label">Tên tập tin mới</label>
              <input 
                type="text" 
                className="form-input" 
                value={newName} 
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRenameSubmit()}
                autoFocus
              />
            </div>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
              <button className="btn btn-ghost" onClick={() => setRenamingIndex(null)}>Hủy</button>
              <button className="btn btn-primary" onClick={handleRenameSubmit}>Lưu thay đổi</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
