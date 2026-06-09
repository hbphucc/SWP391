"use client";
import { Cloud, HardDrive, Database } from "lucide-react";

export default function StoragePage() {
  return (
    <div style={{ maxWidth: 1100, height: "calc(100vh - 100px)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div className="page-header" style={{ flexShrink: 0 }}>
        <div>
          <h1 className="page-title">Lưu trữ đám mây</h1>
          <p className="page-subtitle">Mức sử dụng lưu trữ và hạn ngạch của hệ thống</p>
        </div>
      </div>

      <div className="glass-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem", flexShrink: 0 }}>
        <div className="glass-card" style={{ transition: "transform 0.2s" }} onMouseOver={e => e.currentTarget.style.transform = "translateY(-2px)"} onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
            <Cloud style={{ color: "var(--color-primary)" }} />
            <span style={{ fontSize: "0.8rem", color: "var(--color-text-3)", fontWeight: 500 }}>AWS S3</span>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--color-text-1)" }}>45.2 GB <span style={{ fontSize: "0.9rem", fontWeight: 500, color: "var(--color-text-3)" }}>/ 100 GB</span></div>
          <div className="progress" style={{ marginTop: "1rem", height: 6, background: "rgba(255,255,255,0.05)" }}>
            <div className="progress-fill" style={{ width: "45.2%", background: "var(--color-primary)", boxShadow: "0 0 10px var(--color-primary)" }} />
          </div>
        </div>
        
        <div className="glass-card" style={{ transition: "transform 0.2s" }} onMouseOver={e => e.currentTarget.style.transform = "translateY(-2px)"} onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
            <Database style={{ color: "var(--color-emerald)" }} />
            <span style={{ fontSize: "0.8rem", color: "var(--color-text-3)", fontWeight: 500 }}>PostgreSQL</span>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--color-text-1)" }}>2.1 GB <span style={{ fontSize: "0.9rem", fontWeight: 500, color: "var(--color-text-3)" }}>/ 10 GB</span></div>
          <div className="progress" style={{ marginTop: "1rem", height: 6, background: "rgba(255,255,255,0.05)" }}>
            <div className="progress-fill" style={{ width: "21%", background: "var(--color-emerald)", boxShadow: "0 0 10px var(--color-emerald)" }} />
          </div>
        </div>

        <div className="glass-card" style={{ transition: "transform 0.2s" }} onMouseOver={e => e.currentTarget.style.transform = "translateY(-2px)"} onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
            <HardDrive style={{ color: "var(--color-amber)" }} />
            <span style={{ fontSize: "0.8rem", color: "var(--color-text-3)", fontWeight: 500 }}>Cache (Redis)</span>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--color-text-1)" }}>840 MB <span style={{ fontSize: "0.9rem", fontWeight: 500, color: "var(--color-text-3)" }}>/ 2 GB</span></div>
          <div className="progress" style={{ marginTop: "1rem", height: 6, background: "rgba(255,255,255,0.05)" }}>
            <div className="progress-fill" style={{ width: "42%", background: "var(--color-amber)", boxShadow: "0 0 10px var(--color-amber)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
