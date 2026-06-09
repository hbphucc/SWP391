"use client";
import { useState } from "react";
import { Trophy, Mail, ArrowRight, CheckCircle, Key, Lock } from "lucide-react";
import Link from "next/link";
import styles from "../auth.module.css";
import { apiRequest } from "@/lib/api";
import { App } from "antd";

export default function ForgotPasswordPage() {
  const { message } = App.useApp();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiRequest("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
        auth: false,
      });
      message.success("Mã OTP đã được gửi đến email của bạn!");
      setStep(2);
    } catch (err: any) {
      message.error(err.message || "Gửi email thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      message.error("Xác nhận mật khẩu không khớp!");
      return;
    }
    setLoading(true);
    try {
      await apiRequest("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, otp, newPassword }),
        auth: false,
      });
      message.success("Đặt lại mật khẩu thành công!");
      setStep(3);
    } catch (err: any) {
      message.error(err.message || "OTP không hợp lệ hoặc đặt lại mật khẩu thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authBg}>
      <div className={styles.orb1} /><div className={styles.orb2} /><div className={styles.orb3} />
      <div className={styles.card}>
        <div className={styles.logoWrap}>
          <div className={styles.logoIcon}><Trophy size={24} /></div>
          <span className={styles.logoText}>SEAL</span>
        </div>

        {step === 3 && (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(16,185,129,0.12)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem", border: "1px solid rgba(16,185,129,0.3)" }}>
              <CheckCircle size={32} style={{ color: "#34d399" }} />
            </div>
            <h1 className={styles.title} style={{ fontSize: "1.3rem" }}>Đặt Lại Mật Khẩu Hoàn Tất!</h1>
            <p className={styles.subtitle} style={{ marginBottom: "1.5rem" }}>
              Mật khẩu của bạn đã được đặt lại thành công.
            </p>
            <Link href="/auth/login">
              <button className="btn btn-primary btn-lg" style={{ width: "100%", justifyContent: "center" }}>
                Quay lại Đăng nhập
              </button>
            </Link>
          </div>
        )}

        {step === 1 && (
          <>
            <h1 className={styles.title} style={{ fontSize: "1.3rem" }}>Quên mật khẩu?</h1>
            <p className={styles.subtitle}>Nhập email của bạn và chúng tôi sẽ gửi mã OTP để đặt lại.</p>
            <form onSubmit={handleSendEmail} className={styles.form}>
              <div className="form-group">
                <label className="form-label" htmlFor="forgot-email">Email</label>
                <div className={styles.inputWrap}>
                  <Mail size={16} className={styles.inputIcon} />
                  <input id="forgot-email" type="email" className={`form-input ${styles.inputWithIcon}`}
                    placeholder="you@fpt.edu.vn" value={email}
                    onChange={e => setEmail(e.target.value)} required />
                </div>
              </div>
              <button type="submit" className={`btn btn-primary btn-lg ${styles.submitBtn}`} disabled={loading}>
                {loading ? <span className="spinner" /> : <><ArrowRight size={18} /> <span>Gửi OTP</span></>}
              </button>
            </form>
            <p className={styles.switchRow}>
              Nhớ mật khẩu? <Link href="/auth/login" className={styles.switchLink}>Đăng nhập →</Link>
            </p>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className={styles.title} style={{ fontSize: "1.3rem" }}>Nhập OTP</h1>
            <p className={styles.subtitle}>Kiểm tra email của bạn để lấy mã OTP 6 chữ số.</p>
            <form onSubmit={handleResetPassword} className={styles.form}>
              <div className="form-group">
                <label className="form-label">Mã OTP</label>
                <div className={styles.inputWrap}>
                  <Key size={16} className={styles.inputIcon} />
                  <input type="text" className={`form-input ${styles.inputWithIcon}`}
                    placeholder="123456" value={otp}
                    onChange={e => setOtp(e.target.value)} required maxLength={6} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Mật khẩu mới</label>
                <div className={styles.inputWrap}>
                  <Lock size={16} className={styles.inputIcon} />
                  <input type="password" className={`form-input ${styles.inputWithIcon}`}
                    placeholder="Mật khẩu mới" value={newPassword}
                    onChange={e => setNewPassword(e.target.value)} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Xác nhận mật khẩu</label>
                <div className={styles.inputWrap}>
                  <Lock size={16} className={styles.inputIcon} />
                  <input type="password" className={`form-input ${styles.inputWithIcon}`}
                    placeholder="Xác nhận mật khẩu" value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)} required />
                </div>
              </div>
              <button type="submit" className={`btn btn-primary btn-lg ${styles.submitBtn}`} disabled={loading || !newPassword || newPassword !== confirmPassword}>
                {loading ? <span className="spinner" /> : <><CheckCircle size={18} /> <span>Đặt lại mật khẩu</span></>}
              </button>
              <button type="button" onClick={() => setStep(1)} className="btn btn-secondary btn-lg" style={{ width: "100%", marginTop: "1rem", justifyContent: "center" }} disabled={loading}>
                Quay lại
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
