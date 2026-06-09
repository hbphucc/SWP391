"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { App } from "antd";
import { ArrowRight, Building2, CheckCircle, Code2, GraduationCap, Lock, Mail, Trophy, User } from "lucide-react";
import { apiRequest } from "@/lib/api";
import styles from "../auth.module.css";
import vnUniversities from "../../../data/vietnam_universities.json";

type StudentType = "fpt" | "external" | "";

export default function RegisterPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const [studentType, setStudentType] = useState<StudentType>("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    studentId: "",
    university: "",
    customUniversity: "",
    skills: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      message.error("Xác nhận mật khẩu không khớp.");
      return;
    }

    setLoading(true);
    try {
      if (!otpSent) {
        await apiRequest("/Auth/send-register-otp", {
          method: "POST",
          body: JSON.stringify({ email: form.email }),
          auth: false
        });
        message.success("Mã OTP đã được gửi đến email của bạn!");
        setOtpSent(true);
      } else {
        await apiRequest("/Auth/register", {
          method: "POST",
          body: JSON.stringify({
            fullName: form.fullName,
            email: form.email,
            password: form.password,
            studentType: studentType === "fpt" ? 0 : 1,
            studentCode: form.studentId,
            schoolName: studentType === "fpt" ? "FPT University" : (form.university === "Khác (Other / International)" ? form.customUniversity : form.university),
            skills: form.skills,
            otp: otp
          }),
          auth: false
        });

        message.success("Tạo tài khoản thành công. Vui lòng đăng nhập.");
        router.push("/auth/login");
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Yêu cầu thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authBg}>
      <div className={styles.splitContainer}>
        <div className={styles.leftSide}>
          <div className={styles.orb1} />
          <div className={styles.orb2} />

          <div className={styles.card} style={{ maxWidth: 460 }}>
            <div className={styles.logoWrap}>
              <div className={styles.logoIcon}>
                <Trophy size={24} />
              </div>
              <span className={styles.logoText}>SEAL</span>
            </div>

            <h1 className={styles.title} style={{ fontSize: "1.3rem", marginBottom: "0.25rem" }}>Tạo tài khoản của bạn</h1>
            <p className={styles.subtitle}>{otpSent ? "Xác minh email của bạn để tiếp tục" : "Đăng ký tài khoản hệ thống SEAL"}</p>

            {otpSent ? (
              <form onSubmit={handleSubmit} className={styles.form}>
                <div className="form-group">
                  <label className="form-label">Nhập OTP</label>
                  <div className={styles.inputWrap}>
                    <Lock size={16} className={styles.inputIcon} />
                    <input type="text" className={`form-input ${styles.inputWithIcon}`} placeholder="Mã OTP 6 chữ số" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6} />
                  </div>
                  <div style={{fontSize: "0.85rem", color: "var(--color-text-3)", marginTop: 8}}>Kiểm tra hộp thư đến hoặc thư rác để lấy mã OTP.</div>
                </div>
                <button type="submit" className="btn btn-primary btn-lg" style={{ justifyContent: "center", marginTop: "1rem" }} disabled={loading || otp.length < 6}>
                  {loading ? <span className="spinner" /> : <><CheckCircle size={16} /> <span>Xác minh & Đăng ký</span></>}
                </button>
                <button type="button" className="btn btn-ghost" style={{width: "100%", marginTop: 8}} onClick={() => setOtpSent(false)}>Quay lại</button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className={styles.form}>
              <div className="form-group">
                <label className="form-label" htmlFor="fullName">Họ và Tên</label>
                <div className={styles.inputWrap}>
                  <User size={16} className={styles.inputIcon} />
                  <input id="fullName" type="text" className={`form-input ${styles.inputWithIcon}`} placeholder="Nguyen Van A" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-email">Email</label>
                <div className={styles.inputWrap}>
                  <Mail size={16} className={styles.inputIcon} />
                  <input id="reg-email" type="email" className={`form-input ${styles.inputWithIcon}`} placeholder="you@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reg-pass">Mật khẩu</label>
                <div className={styles.inputWrap}>
                  <Lock size={16} className={styles.inputIcon} />
                  <input id="reg-pass" type="password" className={`form-input ${styles.inputWithIcon}`} placeholder="Mật khẩu" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="confirm-pass">Xác nhận Mật khẩu</label>
                <div className={styles.inputWrap}>
                  <Lock size={16} className={styles.inputIcon} />
                  <input id="confirm-pass" type="password" className={`form-input ${styles.inputWithIcon}`} placeholder="Xác nhận mật khẩu" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Loại sinh viên</label>
                <div className={styles.radioGroup}>
                  <label className={styles.radioOption}>
                    <input type="radio" name="type" value="fpt" checked={studentType === "fpt"} onChange={() => setStudentType("fpt")} required />
                    <GraduationCap size={20} style={{ color: "var(--color-primary)" }} />
                    <div>
                      <div className={styles.radioLabel}>Sinh viên Đại học FPT</div>
                      <div className={styles.radioSub}>Sử dụng mã số sinh viên FPT của bạn</div>
                    </div>
                  </label>
                  <label className={styles.radioOption}>
                    <input type="radio" name="type" value="external" checked={studentType === "external"} onChange={() => setStudentType("external")} required />
                    <Building2 size={20} style={{ color: "var(--color-violet)" }} />
                    <div>
                      <div className={styles.radioLabel}>Sinh viên trường khác</div>
                      <div className={styles.radioSub}>Cung cấp tên trường của bạn</div>
                    </div>
                  </label>
                </div>
              </div>

              {studentType && (
                <>
                  <div className="form-group">
                    <label className="form-label" htmlFor="sid">Mã số sinh viên</label>
                    <input id="sid" type="text" className="form-input" placeholder={studentType === "fpt" ? "SE123456" : "Mã số sinh viên của bạn"} value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} required />
                  </div>

                  {studentType === "external" && (
                    <>
                      <div className="form-group">
                        <label className="form-label" htmlFor="uni">Tên trường Đại học</label>
                        <input id="uni" type="text" className="form-input" list="vn-universities" placeholder="Nhập để tìm kiếm trường đại học của bạn..." value={form.university} onChange={(e) => setForm({ ...form, university: e.target.value })} required />
                        <datalist id="vn-universities">
                          {vnUniversities.map((uni: string, idx: number) => (
                            <option key={idx} value={uni} />
                          ))}
                          <option value="Khác (Other / International)" />
                        </datalist>
                      </div>

                      {form.university === "Khác (Other / International)" && (
                        <div className="form-group">
                          <label className="form-label" htmlFor="customUni">Ghi rõ trường Đại học của bạn</label>
                          <input id="customUni" type="text" className="form-input" placeholder="Nhập tên trường đại học quốc tế của bạn..." value={form.customUniversity} onChange={(e) => setForm({ ...form, customUniversity: e.target.value })} required />
                        </div>
                      )}
                    </>
                  )}

                  <div className="form-group">
                    <label className="form-label" htmlFor="skills">Kỹ năng / Chuyên môn (Tùy chọn)</label>
                    <div className={styles.inputWrap}>
                      <Code2 size={16} className={styles.inputIcon} />
                      <input id="skills" type="text" className={`form-input ${styles.inputWithIcon}`} placeholder="VD: React, Python, UI/UX" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
                    </div>
                  </div>
                </>
              )}

              <button type="submit" className="btn btn-primary btn-lg" style={{ justifyContent: "center", marginTop: "1rem" }} disabled={loading || !studentType}>
                {loading ? <span className="spinner" /> : <><CheckCircle size={16} /> <span>Tạo tài khoản</span></>}
              </button>
            </form>
            )}

            <p className={styles.switchRow}>
              Đã có tài khoản? <Link href="/auth/login" className={styles.switchLink}>Đăng nhập</Link>
            </p>
          </div>
        </div>

        <div className={styles.rightSide}>
          <div className={styles.rightOverlay} />
          <div className={styles.rightContent}>
            <div className={styles.sloganIcon}>
              <Code2 size={24} color="white" />
            </div>
            <h1 className={styles.sloganTitle}>Tham gia SEAL</h1>
            <p className={styles.sloganDesc}>Tạo tài khoản, chờ admin duyệt, sau đó bắt đầu xây dựng dự án cùng đội của bạn.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
