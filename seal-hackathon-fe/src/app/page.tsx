"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Users, Trophy, Layers, ArrowRight, Zap, Globe, Rocket, Award, X, Gift, CheckCircle2 } from "lucide-react";
import styles from "./page.module.css";

const MOCK_COMPETITIONS = [
  {
    id: 1,
    title: "SEAL Global Hackathon 2026",
    status: "Đang diễn ra",
    teamsCount: 124,
    membersPerTeam: "3-5",
    date: "15/05 - 30/06, 2026",
    rounds: 3,
    description: "Tham gia thử thách kỹ thuật phần mềm đỉnh cao và xây dựng tương lai của các ứng dụng AI.",
    featuredTeams: [
      { name: "Alpha Devs", members: "John, Alice, Bob" },
      { name: "Code Ninjas", members: "Sarah, Mike, Tom, Emma" }
    ],
    details: {
      roundsInfo: [
        { name: "Vòng 1: Lên ý tưởng & Lập kế hoạch", time: "15/05 - 25/05" },
        { name: "Vòng 2: Phát triển nguyên mẫu (Prototype)", time: "26/05 - 15/06" },
        { name: "Vòng 3: Chung kết & Thuyết trình", time: "16/06 - 30/06" }
      ],
      prizes: "Giải nhất: 100.000.000 VNĐ | Giải nhì: 50.000.000 VNĐ",
      rules: "Các đội thi phát triển phần mềm dựa trên AI giải quyết các vấn đề thực tiễn. Yêu cầu mã nguồn mở và có thể deploy nghiệm thu."
    },
    result: null
  },
  {
    id: 2,
    title: "FinTech Innovators Challenge",
    status: "Sắp diễn ra",
    teamsCount: 86,
    membersPerTeam: "2-4",
    date: "10/07 - 20/08, 2026",
    rounds: 2,
    description: "Cách mạng hóa tài chính kỹ thuật số với các giải pháp công nghệ blockchain và hợp đồng thông minh tiên tiến.",
    featuredTeams: [
      { name: "Crypto Kings", members: "David, Anna" },
      { name: "PayPioneers", members: "Kevin, Lily, James" }
    ],
    details: {
      roundsInfo: [
        { name: "Vòng 1: Vòng sơ loại & Trình bày ý tưởng", time: "10/07 - 25/07" },
        { name: "Vòng 2: Hackathon 48h & Pitching", time: "18/08 - 20/08" }
      ],
      prizes: "Giải nhất: 80.000.000 VNĐ + Cơ hội thực tập tại đối tác",
      rules: "Sản phẩm phải ứng dụng công nghệ tài chính, bảo mật cao và thân thiện với người dùng."
    },
    result: null
  },
  {
    id: 3,
    title: "GreenTech Sustainability 2025",
    status: "Đã kết thúc",
    teamsCount: 52,
    membersPerTeam: "4",
    date: "01/01 - 15/02, 2025",
    rounds: 4,
    description: "Phát triển các giải pháp phần mềm để ứng phó với biến đổi khí hậu và thúc đẩy lối sống bền vững.",
    featuredTeams: [
      { name: "Eco Warriors", members: "Sophia, Lucas, Mia, Noah" },
      { name: "Planet Savers", members: "Liam, Olivia, Ethan, Ava" }
    ],
    details: {
      roundsInfo: [
        { name: "Vòng 1: Đăng ký & Ghép đội", time: "01/01 - 10/01" },
        { name: "Vòng 2: Phân tích & Thiết kế", time: "11/01 - 20/01" },
        { name: "Vòng 3: Coding Marathon", time: "21/01 - 10/02" },
        { name: "Vòng 4: Chung kết", time: "15/02" }
      ],
      prizes: "Giải nhất: 50.000.000 VNĐ | Giải nhì: 30.000.000 VNĐ",
      rules: "Đánh giá dựa trên mức độ ảnh hưởng đến môi trường và tính khả thi của giải pháp."
    },
    result: "Đội Chiến Thắng: Eco Warriors (Ứng dụng AI phân loại rác thải xuất sắc)"
  }
];

export default function LandingPage() {
  const [selectedComp, setSelectedComp] = useState<typeof MOCK_COMPETITIONS[0] | null>(null);

  return (
    <div className={styles.container}>
      {/* Background Decorative Elements */}
      <div className={styles.bgBlob1}></div>
      <div className={styles.bgBlob2}></div>

      {/* Navbar */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={styles.header}
      >
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <Zap style={{ color: "#fff" }} size={20} />
          </div>
          <span className={styles.logoText}>
            SEAL <span style={{ color: "var(--color-primary-2)" }}>Hackathons</span>
          </span>
        </div>
        
        <div className={styles.navLinks}>
          <Link href="/auth/login" className="btn btn-ghost">
            Đăng nhập
          </Link>
          <Link href="/auth/register" className="btn btn-primary">
            Đăng ký
          </Link>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className={styles.main}>
        
        {/* Hero Section */}
        <motion.div 
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className={styles.hero}
        >
          <div className={styles.heroTag}>
            <Rocket size={16} />
            <span>Khơi dậy tiềm năng sáng tạo</span>
          </div>
          <h1 className={styles.heroTitle}>
            Khám phá & Tham gia <br/>
            <span className="gradient-text">Các Cuộc Thi Đỉnh Cao</span>
          </h1>
          <p className={styles.heroDesc}>
            Kết nối với các tài năng hàng đầu, thể hiện kỹ năng của bạn và xây dựng những giải pháp phần mềm xuất chúng trong các cuộc thi Hackathon uy tín toàn cầu.
          </p>
        </motion.div>

        {/* Competitions Section */}
        <div className={styles.competitionsSection}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h2 className={styles.sectionTitle}>
              <Globe style={{ color: "var(--color-primary-2)" }} />
              Các Cuộc Thi Nổi Bật
            </h2>
          </motion.div>

          <div className="grid-3">
            {MOCK_COMPETITIONS.map((comp, index) => (
              <motion.div
                key={comp.id}
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                className="glass-card"
                style={{ display: "flex", flexDirection: "column", height: "100%" }}
              >
                {/* Top Badge */}
                <div className={styles.cardHeader}>
                  <span className={`badge ${comp.status === 'Đang diễn ra' ? 'badge-success' : comp.status === 'Đã kết thúc' ? 'badge-neutral' : 'badge-primary'}`}>
                    <span className={styles.pingBadge}>
                      {comp.status === 'Đang diễn ra' && (
                        <span className={styles.pingAnim} style={{ backgroundColor: "var(--color-emerald)" }}></span>
                      )}
                      <span className={styles.pingDot} style={{ backgroundColor: comp.status === 'Đang diễn ra' ? "var(--color-emerald)" : comp.status === 'Đã kết thúc' ? "var(--color-text-3)" : "var(--color-primary-2)" }}></span>
                    </span>
                    {comp.status}
                  </span>
                  
                  <div className={styles.cardIconWrapper}>
                    <Trophy size={16} style={{ color: "var(--color-amber)" }} />
                  </div>
                </div>

                <h3 className={styles.cardTitle}>
                  {comp.title}
                </h3>
                <p className={styles.cardDesc}>
                  {comp.description}
                </p>

                {/* Stats Grid */}
                <div className={styles.statsGrid}>
                  <div className={styles.statItem}>
                    <div className={styles.statLabel}>
                      <Users size={12} /> Số đội
                    </div>
                    <div className={styles.statValue}>{comp.teamsCount}</div>
                  </div>
                  
                  <div className={styles.statItem}>
                    <div className={styles.statLabel}>
                      <Users size={12} /> Thành viên
                    </div>
                    <div className={styles.statValue}>{comp.membersPerTeam} người</div>
                  </div>

                  <div className={styles.statItem}>
                    <div className={styles.statLabel}>
                      <Layers size={12} /> Số vòng
                    </div>
                    <div className={styles.statValue}>{comp.rounds} Vòng</div>
                  </div>

                  <div className={styles.statItem}>
                    <div className={styles.statLabel}>
                      <Calendar size={12} /> Thời gian
                    </div>
                    <div className={styles.statValue} style={{ fontSize: "0.8rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={comp.date}>
                      {comp.date}
                    </div>
                  </div>
                </div>

                {/* Featured Teams */}
                <div style={{ marginBottom: "1.5rem", padding: "0.75rem", background: "rgba(30, 41, 59, 0.4)", borderRadius: "8px", fontSize: "0.85rem" }}>
                  <div style={{ color: "var(--color-text-2)", fontWeight: 600, marginBottom: "0.5rem", fontSize: "0.75rem", textTransform: "uppercase" }}>Các đội nổi bật</div>
                  {comp.featuredTeams.map((team, i) => (
                    <div key={i} style={{ marginBottom: "0.25rem" }}>
                      <span style={{ color: "var(--color-primary-2)", fontWeight: 500 }}>{team.name}:</span> <span style={{ color: "var(--color-text-3)" }}>{team.members}</span>
                    </div>
                  ))}
                </div>

                {/* Result for Completed */}
                <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {comp.status === "Đã kết thúc" && comp.result && (
                    <div style={{ padding: "0.75rem", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "8px", fontSize: "0.85rem", color: "var(--color-emerald)" }}>
                      <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: "0.25rem" }}><Award size={14} /> Kết quả</div>
                      <div style={{ marginTop: "0.25rem" }}>{comp.result}</div>
                    </div>
                  )}

                  <div className={styles.cardAction}>
                    <button className="btn btn-secondary w-full" style={{ width: "100%", justifyContent: "center" }} onClick={() => setSelectedComp(comp)}>
                      Xem chi tiết <ArrowRight size={16} style={{ marginLeft: "0.5rem" }} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedComp && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setSelectedComp(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="modal-content"
              style={{ background: "var(--color-bg-2)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-xl)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header" style={{ marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 className="modal-title" style={{ color: "var(--color-text)", fontSize: "1.5rem" }}>Chi tiết cuộc thi</h2>
                <button onClick={() => setSelectedComp(null)} className="btn-icon btn-ghost" style={{ padding: "0.25rem" }}>
                  <X size={24} />
                </button>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "var(--color-primary-2)", marginBottom: "0.5rem" }}>{selectedComp.title}</h3>
                  <p style={{ color: "var(--color-text-2)", fontSize: "0.95rem" }}>{selectedComp.description}</p>
                </div>

                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <span className={`badge ${selectedComp.status === 'Đang diễn ra' ? 'badge-success' : selectedComp.status === 'Đã kết thúc' ? 'badge-neutral' : 'badge-primary'}`}>
                    {selectedComp.status}
                  </span>
                  <span className="badge badge-neutral"><Users size={12} style={{marginRight: "4px"}} /> {selectedComp.teamsCount} đội</span>
                  <span className="badge badge-neutral"><Calendar size={12} style={{marginRight: "4px"}} /> {selectedComp.date}</span>
                </div>

                {selectedComp.details && (
                  <>
                    <div style={{ background: "rgba(99, 102, 241, 0.05)", padding: "1rem", borderRadius: "12px", border: "1px solid var(--color-border)" }}>
                      <h4 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600, color: "var(--color-text)", marginBottom: "0.75rem" }}>
                        <Layers size={18} style={{ color: "var(--color-primary-2)" }} /> Thông tin các vòng thi
                      </h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {selectedComp.details.roundsInfo.map((r, idx) => (
                          <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                            <div style={{ marginTop: "2px", color: "var(--color-cyan)" }}><CheckCircle2 size={16} /></div>
                            <div>
                              <div style={{ fontWeight: 500, color: "var(--color-text)" }}>{r.name}</div>
                              <div style={{ fontSize: "0.85rem", color: "var(--color-text-3)" }}>Thời gian: {r.time}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ background: "rgba(16, 185, 129, 0.05)", padding: "1rem", borderRadius: "12px", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                      <h4 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600, color: "var(--color-text)", marginBottom: "0.5rem" }}>
                        <Gift size={18} style={{ color: "var(--color-emerald)" }} /> Giải thưởng & Thể lệ
                      </h4>
                      <p style={{ fontSize: "0.9rem", color: "var(--color-text-2)", marginBottom: "0.5rem" }}><strong>Giải thưởng:</strong> {selectedComp.details.prizes}</p>
                      <p style={{ fontSize: "0.9rem", color: "var(--color-text-2)" }}><strong>Thể lệ:</strong> {selectedComp.details.rules}</p>
                    </div>
                  </>
                )}

                {selectedComp.result && (
                  <div style={{ background: "rgba(245, 158, 11, 0.08)", padding: "1rem", borderRadius: "12px", border: "1px solid rgba(245, 158, 11, 0.3)" }}>
                    <h4 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600, color: "var(--color-amber)", marginBottom: "0.5rem" }}>
                      <Award size={18} /> Kết Quả Chung Cuộc
                    </h4>
                    <p style={{ fontSize: "1rem", fontWeight: 500, color: "var(--color-text)" }}>{selectedComp.result}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
