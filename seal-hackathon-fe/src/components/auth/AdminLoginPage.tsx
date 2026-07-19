"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { App } from "antd";
import { Key, Mail, Shield } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { getRoleLandingPath } from "@/components/shell/routePolicies";
import styles from "./Auth.module.css";

export default function AdminLogin() {
  const router = useRouter();
  const { message } = App.useApp();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiRequest("/Auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password, remember: true }),
      });

      // Re-source identity from /Auth/me — the login response is not the
      // source of truth for role gates.
      const user = await refresh();
      if (!user) {
        message.error("Signed in, but the server did not return a user.");
        return;
      }

      if (!user.roles.includes("Admin")) {
        message.error("Access denied. Admin privileges required.");
        router.push(getRoleLandingPath(user.roles));
        return;
      }

      message.success("Admin login successful.");
      router.push("/admin");
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Admin login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${styles.authBg} ${styles.authCenter}`}>
      <div className={`glass-card ${styles.adminCard}`}>
        <div className={styles.adminHeader}>
          <div className={styles.dangerIconBox}>
            <Shield size={32} className={styles.dangerIcon} />
          </div>
          <h1 className={styles.adminTitle}>Admin Portal</h1>
          <p className={styles.adminText}>Uses the seeded backend admin account.</p>
        </div>

        <form onSubmit={handleLogin} className={styles.form}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className={styles.formIconWrap}>
              <Mail size={16} className={styles.formInlineIcon} />
              <input className={`form-input ${styles.paddedInput}`} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className={styles.formIconWrap}>
              <Key size={16} className={styles.formInlineIcon} />
              <input className={`form-input ${styles.paddedInput}`} type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>

          <button type="submit" className={`btn btn-danger ${styles.adminSubmit}`} disabled={loading}>
            {loading ? <span className="spinner" /> : "Secure Login"}
          </button>

          <button type="button" className={`btn btn-ghost ${styles.wideCenterButton}`} onClick={() => router.push("/auth/login")}>
            Back to User Login
          </button>
        </form>
      </div>
    </div>
  );
}
