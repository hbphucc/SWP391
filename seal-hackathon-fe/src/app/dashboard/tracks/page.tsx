"use client";
import { useState, useEffect } from "react";
import { Users, Bot, Globe, Smartphone, Shield, Lightbulb, Search } from "lucide-react";
import { Input } from "antd";

export default function UserTracksPage() {
  const [tracks, setTracks] = useState<any[]>([]);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    const loadTracks = async () => {
      try {
        const { apiRequest } = await import("@/lib/api");
        const evts = await apiRequest<any[]>("/Events");
        if (evts.length > 0) {
          const eventId = evts[0].eventId;
          const data = await apiRequest<any[]>(`/events/${eventId}/categories`);
          setTracks(data.map((c: any) => ({
            id: c.categoryId,
            name: c.categoryName,
            desc: c.description,
            teamsCount: c.teamCount || 0,
            mentor: null,
          })));
        }
      } catch (err) {
        console.error("Lỗi tải hạng mục:", err);
      }
    };
    loadTracks();
  }, []);

  const getIcon = (name: string) => {
    if (!name) return <Lightbulb size={24} style={{ color: "#f59e0b" }} />;
    if (name.toLowerCase().includes("ai") || name.toLowerCase().includes("bot")) return <Bot size={24} style={{ color: "#10b981" }} />;
    if (name.toLowerCase().includes("web") || name.toLowerCase().includes("globe")) return <Globe size={24} style={{ color: "#3b82f6" }} />;
    if (name.toLowerCase().includes("mobile") || name.toLowerCase().includes("app")) return <Smartphone size={24} style={{ color: "#8b5cf6" }} />;
    if (name.toLowerCase().includes("security") || name.toLowerCase().includes("shield")) return <Shield size={24} style={{ color: "#ef4444" }} />;
    return <Lightbulb size={24} style={{ color: "#f59e0b" }} />;
  };

  const filteredTracks = tracks.filter(t => 
    t.name?.toLowerCase().includes(searchText.toLowerCase()) ||
    t.desc?.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Hạng mục Cuộc thi</h1>
          <p className="page-subtitle">Khám phá các hạng mục chuyên môn và tìm nơi bạn thuộc về.</p>
        </div>
        <Input 
          placeholder="Tìm kiếm hạng mục..." 
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 250, borderRadius: '20px' }}
          prefix={<Search size={16} />}
        />
      </div>

      <div className="grid-3">
        {filteredTracks.map(t => (
          <div key={t.id} className="glass-card" style={{ padding: "1.5rem", display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
              <div style={{ width: 48, height: 48, background: "var(--color-surface-2)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {getIcon(t.name)}
              </div>
              <div>
                <h3 style={{ fontSize: "1.1rem", margin: 0, fontWeight: 700 }}>{t.name}</h3>
                <span className="badge badge-primary" style={{ marginTop: 4 }}>ID: {t.id}</span>
              </div>
            </div>
            
            <p style={{ color: "var(--color-text-2)", fontSize: "0.9rem", flexGrow: 1, marginBottom: "1.5rem" }}>
              {t.desc || "Không có mô tả cho hạng mục này."}
            </p>

            <div style={{ background: "var(--color-surface-2)", padding: "10px", borderRadius: "8px", marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.8rem", color: "var(--color-text-3)", marginBottom: "4px" }}>Cố vấn phụ trách</div>
              <div style={{ fontWeight: 600 }}>{t.mentor || "Chưa phân công"}</div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-text)", fontSize: "0.85rem", paddingTop: "1rem", borderTop: "1px solid var(--color-border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Users size={15} style={{ color: "#3b82f6" }} /> <strong>{t.teamsCount || 0}</strong> Đội đã tham gia
              </div>
            </div>
          </div>
        ))}
        {filteredTracks.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--color-text-3)' }}>
            Không tìm thấy hạng mục nào khớp với tìm kiếm của bạn.
          </div>
        )}
      </div>
    </div>
  );
}
