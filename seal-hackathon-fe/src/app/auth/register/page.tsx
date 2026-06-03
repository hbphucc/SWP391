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
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    studentId: "",
    university: "",
    customUniversity: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      message.error("Password confirmation does not match.");
      return;
    }

    setLoading(true);
    try {
      // MOCK DATA FOR FRONTEND DEVELOPMENT
      // Simulate API call to backend DTO structure
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const payload = {
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        studentType: studentType === "fpt" ? 0 : 1,
        studentCode: form.studentId,
        schoolName: studentType === "fpt" ? "FPT University" : (form.university === "Khác (Other / International)" ? form.customUniversity : form.university),
      };
      
      const mockUsers = JSON.parse(localStorage.getItem("mock_users") || "[]");
      mockUsers.push(payload);
      localStorage.setItem("mock_users", JSON.stringify(mockUsers));
      
      console.log("Mock Register Payload:", payload);

      message.success("Account created successfully. Please login.");
      router.push("/auth/login");
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not create account.");
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

            <h1 className={styles.title} style={{ fontSize: "1.3rem", marginBottom: "0.25rem" }}>Create your account</h1>
            <p className={styles.subtitle}>Register through the backend API</p>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className="form-group">
                <label className="form-label" htmlFor="fullName">Full Name</label>
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
                <label className="form-label" htmlFor="reg-pass">Password</label>
                <div className={styles.inputWrap}>
                  <Lock size={16} className={styles.inputIcon} />
                  <input id="reg-pass" type="password" className={`form-input ${styles.inputWithIcon}`} placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="confirm-pass">Confirm Password</label>
                <div className={styles.inputWrap}>
                  <Lock size={16} className={styles.inputIcon} />
                  <input id="confirm-pass" type="password" className={`form-input ${styles.inputWithIcon}`} placeholder="Confirm password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Student Type</label>
                <div className={styles.radioGroup}>
                  <label className={styles.radioOption}>
                    <input type="radio" name="type" value="fpt" checked={studentType === "fpt"} onChange={() => setStudentType("fpt")} required />
                    <GraduationCap size={20} style={{ color: "var(--color-primary)" }} />
                    <div>
                      <div className={styles.radioLabel}>FPT University Student</div>
                      <div className={styles.radioSub}>Use your FPT student code</div>
                    </div>
                  </label>
                  <label className={styles.radioOption}>
                    <input type="radio" name="type" value="external" checked={studentType === "external"} onChange={() => setStudentType("external")} required />
                    <Building2 size={20} style={{ color: "var(--color-violet)" }} />
                    <div>
                      <div className={styles.radioLabel}>External Student</div>
                      <div className={styles.radioSub}>Provide your school name</div>
                    </div>
                  </label>
                </div>
              </div>

              {studentType && (
                <>
                  <div className="form-group">
                    <label className="form-label" htmlFor="sid">Student ID</label>
                    <input id="sid" type="text" className="form-input" placeholder={studentType === "fpt" ? "SE123456" : "Your student ID"} value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} required />
                  </div>

                  {studentType === "external" && (
                    <>
                      <div className="form-group">
                        <label className="form-label" htmlFor="uni">University Name</label>
                        <input id="uni" type="text" className="form-input" list="vn-universities" placeholder="Type to search your university..." value={form.university} onChange={(e) => setForm({ ...form, university: e.target.value })} required />
                        <datalist id="vn-universities">
                          {vnUniversities.map((uni: string, idx: number) => (
                            <option key={idx} value={uni} />
                          ))}
                          <option value="Khác (Other / International)" />
                        </datalist>
                      </div>

                      {form.university === "Khác (Other / International)" && (
                        <div className="form-group">
                          <label className="form-label" htmlFor="customUni">Specify your University</label>
                          <input id="customUni" type="text" className="form-input" placeholder="Enter your international university name..." value={form.customUniversity} onChange={(e) => setForm({ ...form, customUniversity: e.target.value })} required />
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              <button type="submit" className="btn btn-primary btn-lg" style={{ justifyContent: "center" }} disabled={loading || !studentType}>
                {loading ? <span className="spinner" /> : <><CheckCircle size={16} /> Create Account</>}
              </button>
            </form>

            <p className={styles.switchRow}>
              Already have an account? <Link href="/auth/login" className={styles.switchLink}>Sign in</Link>
            </p>
          </div>
        </div>

        <div className={styles.rightSide}>
          <div className={styles.rightOverlay} />
          <div className={styles.rightContent}>
            <div className={styles.sloganIcon}>
              <Code2 size={24} color="white" />
            </div>
            <h1 className={styles.sloganTitle}>Join SEAL</h1>
            <p className={styles.sloganDesc}>Create an account, wait for admin approval, then start building with your team.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
