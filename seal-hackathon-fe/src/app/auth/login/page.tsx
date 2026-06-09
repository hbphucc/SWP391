"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { App } from "antd";
import { ArrowRight, Code2, Eye, EyeOff, Lock, Mail, Trophy } from "lucide-react";
import { apiRequest, saveAuthSession } from "@/lib/api";
import styles from "../auth.module.css";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect");
  const switchEmail = searchParams.get("switch_email");
  const isAddingAccount = searchParams.get("add_account") === "true";
  const { message } = App.useApp();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: switchEmail || "", password: "", remember: false });
  const [isReadOnly, setIsReadOnly] = useState(true); // Anti-autofill trick

  useEffect(() => {
    // We intentionally leave it as readOnly=true.
    // It will only become false when the user explicitly triggers onFocus or onMouseDown.
  }, []);

  useEffect(() => {
    // If user explicitly wants to switch or add account, don't auto-redirect
    if (switchEmail || isAddingAccount) return;

    const stored = (localStorage.getItem("currentUser") || sessionStorage.getItem("currentUser"));
    if (stored) {
      if (redirectUrl) {
        router.push(redirectUrl);
        return;
      }
      try {
        const user = JSON.parse(stored);
        if (user.roles && user.roles.includes("Admin")) {
          router.push("/admin");
        } else if (user.roles && user.roles.includes("Mentor")) {
          router.push("/mentor");
        } else {
          router.push("/dashboard");
        }
      } catch (e) {
        router.push("/dashboard");
      }
    }
  }, [router, redirectUrl, switchEmail, isAddingAccount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = await apiRequest<any>("/Auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: form.email,
          password: form.password
        }),
        auth: false
      });

      console.log("Login Successful:", payload);

      const currentUser = saveAuthSession(payload, form.remember);
      message.success("Đăng nhập thành công!");
      
      if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        if (currentUser.roles.includes("Admin")) router.push("/admin");
        else if (currentUser.roles.includes("Mentor")) router.push("/mentor");
        else router.push("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể đăng nhập. Vui lòng thử lại.");
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

          <div className={styles.card}>
            <div className={styles.logoWrap}>
              <div className={styles.logoIcon}>
                <Trophy size={24} />
              </div>
              <span className={styles.logoText}>SEAL</span>
            </div>

            <h1 className={styles.title}>Chào mừng trở lại</h1>
            <p className={styles.subtitle}>Đăng nhập bằng tài khoản hệ thống SEAL</p>

            <div className={styles.form} onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(e as any); }}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <div className={styles.inputWrap}>
                  <Mail size={16} className={styles.inputIcon} />
                  <input
                    type="text"
                    name="random_email_str"
                    className={`form-input ${styles.inputWithIcon}`}
                    placeholder="you@fpt.edu.vn"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    disabled={!!switchEmail}
                    readOnly={isReadOnly}
                    onFocus={() => setIsReadOnly(false)}
                    style={switchEmail ? { background: "rgba(0,0,0,0.3)", color: "var(--color-text-3)", cursor: "not-allowed" } : {}}
                    autoComplete="new-password"
                    spellCheck="false"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Mật khẩu</label>
                <div className={styles.inputWrap}>
                  <Lock size={16} className={styles.inputIcon} />
                  <input
                    type={showPass ? "text" : "password"}
                    name={"p_" + Math.random().toString(36).substring(7)}
                    className={`form-input ${styles.inputWithIcon} ${styles.inputWithTrail}`}
                    placeholder="Password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                    readOnly={isReadOnly}
                    onFocus={() => setIsReadOnly(false)}
                    autoComplete="new-password"
                  />
                  <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(!showPass)}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--color-text-2)", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={form.remember}
                    onChange={(e) => setForm({ ...form, remember: e.target.checked })}
                    style={{ accentColor: "var(--color-primary)" }}
                  />
                  Nhớ mật khẩu
                </label>
                <Link href="/auth/forgot-password" className={styles.forgotLink}>Quên mật khẩu?</Link>
              </div>

              {error && (
                <div style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.25)", borderRadius: "var(--radius-md)", padding: "0.65rem 1rem", fontSize: "0.82rem", color: "#fb7185" }}>
                  {error}
                </div>
              )}

              <button type="button" onClick={handleSubmit} className={`btn btn-primary btn-lg ${styles.submitBtn}`} disabled={loading}>
                {loading ? <span className="spinner" /> : <><ArrowRight size={18} /> <span>Đăng nhập</span></>}
              </button>
            </div>

            <p className={styles.switchRow}>
              Chưa có tài khoản? <Link href="/auth/register" className={styles.switchLink}>Tạo tài khoản mới</Link>
            </p>
          </div>
        </div>

        <div className={styles.rightSide}>
          <div className={styles.rightOverlay} />
          <div className={styles.rightContent}>
            <div className={styles.sloganIcon}>
              <Code2 size={24} color="white" />
            </div>
            <h1 className={styles.sloganTitle}>SEAL Hackathon</h1>
            <p className={styles.sloganDesc}>
              Quản lý sự kiện, đội thi, bài nộp, chấm điểm và bảng xếp hạng từ một hệ thống kết nối.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{display: 'flex', justifyContent: 'center', padding: '50px'}}>Đang tải...</div>}>
      <LoginForm />
    </Suspense>
  );
}
