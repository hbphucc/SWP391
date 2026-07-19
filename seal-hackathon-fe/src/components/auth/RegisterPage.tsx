"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { App } from "antd";
import { ArrowLeft, Building2, CheckCircle, Code2, GraduationCap, Lock, Mail, Phone, Trophy, User } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { getRoleLandingPath } from "@/components/shell/routePolicies";
import { PASSWORD_PATTERN, PASSWORD_RULE_MESSAGE } from "@/lib/constants";
import { DEVELOPER_ROLES, PROGRAMMING_LANGUAGES } from "@/lib/developerProfile";
import styles from "./Auth.module.css";
import vnUniversities from "../../data/vietnam_universities.json";

type StudentType = "fpt" | "external" | "";

export default function RegisterPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const googleButtonRendered = useRef(false);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const googleSignInEnabled = Boolean(googleClientId && googleClientId !== "YOUR_GOOGLE_CLIENT_ID");
  const [studentType, setStudentType] = useState<StudentType>("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    studentId: "",
    university: "",
    customUniversity: "",
    phoneNumber: "",
    developerRole: "",
    programmingLanguages: [] as string[],
  });

  const { refresh } = useAuth();

  const handleGoogleLoginResponse = async (response: { credential: string }) => {
    setLoading(true);
    try {
      const idToken = response.credential;
      await apiRequest("/Auth/google-login", {
        method: "POST",
        body: JSON.stringify({ idToken }),
      });

      const signedIn = await refresh();
      if (!signedIn) {
        message.error("Signed in, but the server did not return a user. Try again.");
        return;
      }

      message.success("Logged in successfully via Google!");
      router.push(getRoleLandingPath(signedIn.roles));
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Google login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const initGoogleSignIn = () => {
    if (!googleSignInEnabled || googleButtonRendered.current || typeof window === "undefined") return;

    const google = (window as unknown as { google?: { accounts?: { id?: { initialize: (config: object) => void; renderButton: (el: HTMLElement | null, config: object) => void } } } }).google;
    const target = document.getElementById("google-register-btn");
    if (google && google.accounts && google.accounts.id && target) {
      google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleLoginResponse,
      });
      google.accounts.id.renderButton(
        target,
        {
          theme: "outline",
          size: "large",
          width: 340,
          shape: "rectangular",
        }
      );
      googleButtonRendered.current = true;
    }
  };

  const toggleProgrammingLanguage = (language: string) => {
    setForm((current) => ({
      ...current,
      programmingLanguages: current.programmingLanguages.includes(language)
        ? current.programmingLanguages.filter((item) => item !== language)
        : [...current.programmingLanguages, language],
    }));
  };

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentType) {
      message.error("Please select a student type.");
      return;
    }

    if (studentType === "fpt" && !form.email.toLowerCase().endsWith("@fpt.edu.vn")) {
      message.error("FPT University students must use an @fpt.edu.vn email address.");
      return;
    }

    if (!PASSWORD_PATTERN.test(form.password)) {
      message.error(PASSWORD_RULE_MESSAGE);
      return;
    }

    if (form.password !== form.confirmPassword) {
      message.error("Password confirmation does not match.");
      return;
    }

    if (!form.phoneNumber.trim()) {
      message.error("Please enter your phone number.");
      return;
    }

    if (!form.developerRole) {
      message.error("Please select your developer role.");
      return;
    }

    if (form.programmingLanguages.length === 0) {
      message.error("Please select at least one programming language or technology.");
      return;
    }

    if (studentType === "external") {
      if (!form.university.trim()) {
        message.error("Please select or enter your university.");
        return;
      }
      if (form.university === "Other / International" && !form.customUniversity.trim()) {
        message.error("Please specify your university name.");
        return;
      }
    }

    setStep("confirm");
  };

  const handleConfirmAndRegister = async () => {
    setLoading(true);
    try {
      const isCustomUniversity = form.university === "Other / International";
      const enteredUni = isCustomUniversity ? form.customUniversity : form.university;
      const isFpt = enteredUni.toLowerCase().includes("fpt");
      
      const finalSchoolName = studentType === "fpt"
        ? "FPT University"
        : isFpt
          ? `Local - ${enteredUni}`
          : `External - ${enteredUni}`;

      await apiRequest("/Auth/register", {
        method: "POST",
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          studentType: studentType === "fpt" ? 0 : 1,
          studentCode: form.studentId,
          schoolName: finalSchoolName,
          phoneNumber: form.phoneNumber.trim(),
          developerRole: form.developerRole,
          programmingLanguages: form.programmingLanguages,
        }),
      });

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
      {googleSignInEnabled && (
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          onReady={initGoogleSignIn}
        />
      )}
      <div className={styles.splitContainer}>
        <div className={styles.leftSide}>
          <Link href="/" className={styles.backBtn}>
            <ArrowLeft size={16} /> Quay về
          </Link>
          <div className={styles.orb1} />
          <div className={styles.orb2} />

          <div className={`${styles.card} ${styles.registerCard}`}>
            <div className={styles.logoWrap}>
              <div className={styles.logoIcon}>
                <Trophy size={24} />
              </div>
              <span className={styles.logoText}>SEAL</span>
            </div>

            {step === "form" ? (
              <>
                <h1 className={`${styles.title} ${styles.compactTitle}`}>Create your account</h1>
                <p className={styles.subtitle}>Register through the backend API</p>

                <form onSubmit={handleReview} className={styles.form}>
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
                    <span className="form-hint">{PASSWORD_RULE_MESSAGE}</span>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="confirm-pass">Confirm Password</label>
                    <div className={styles.inputWrap}>
                      <Lock size={16} className={styles.inputIcon} />
                      <input id="confirm-pass" type="password" className={`form-input ${styles.inputWithIcon}`} placeholder="Confirm password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="phone-number">Phone Number</label>
                    <div className={styles.inputWrap}>
                      <Phone size={16} className={styles.inputIcon} />
                      <input
                        id="phone-number"
                        type="tel"
                        className={`form-input ${styles.inputWithIcon}`}
                        placeholder="+84 912 345 678"
                        value={form.phoneNumber}
                        onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                        autoComplete="tel"
                        maxLength={30}
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.developerSection}>
                    <div className={styles.developerHeading}>
                      <Code2 size={18} />
                      <div>
                        <div className={styles.radioLabel}>Developer Profile</div>
                        <div className={styles.radioSub}>Tell teammates how you like to build.</div>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="developer-role">Developer Role</label>
                      <select
                        id="developer-role"
                        className="form-input"
                        value={form.developerRole}
                        onChange={(e) => setForm({ ...form, developerRole: e.target.value })}
                        required
                      >
                        <option value="">Select your role</option>
                        {DEVELOPER_ROLES.map((role) => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Programming Languages &amp; Technologies</label>
                      <div className={styles.languageOptions}>
                        {PROGRAMMING_LANGUAGES.map((language) => {
                          const selected = form.programmingLanguages.includes(language);
                          return (
                            <button
                              type="button"
                              key={language}
                              aria-pressed={selected}
                              onClick={() => toggleProgrammingLanguage(language)}
                              className={`${styles.languageOption} ${selected ? styles.languageOptionSelected : ""}`}
                            >
                              {language}
                            </button>
                          );
                        })}
                      </div>
                      <span className="form-hint">Select at least one option.</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Student Type</label>
                    <div className={styles.radioGroup}>
                      <label className={styles.radioOption}>
                        <input type="radio" name="type" value="fpt" checked={studentType === "fpt"} onChange={() => setStudentType("fpt")} required />
                        <GraduationCap size={20} className={styles.primaryIcon} />
                        <div>
                          <div className={styles.radioLabel}>FPT University Student</div>
                          <div className={styles.radioSub}>Use your FPT student code</div>
                        </div>
                      </label>
                      <label className={styles.radioOption}>
                        <input type="radio" name="type" value="external" checked={studentType === "external"} onChange={() => setStudentType("external")} required />
                        <Building2 size={20} className={styles.violetIcon} />
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
                              <option value="Other / International" />
                            </datalist>
                          </div>

                          {form.university === "Other / International" && (
                            <div className="form-group">
                              <label className="form-label" htmlFor="customUni">Specify your University</label>
                              <input id="customUni" type="text" className="form-input" placeholder="Enter your international university name..." value={form.customUniversity} onChange={(e) => setForm({ ...form, customUniversity: e.target.value })} required />
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}

                  <button type="submit" className={`btn btn-primary btn-lg ${styles.centeredButton}`} disabled={!studentType}>
                    Continue <CheckCircle size={16} />
                  </button>
                </form>

                {googleSignInEnabled && (
                  <>
                    <div className={`${styles.dividerRow} ${styles.dividerSpacing}`}>
                      <div className={styles.dividerLine} />
                      <div className={styles.dividerText}>OR</div>
                      <div className={styles.dividerLine} />
                    </div>

                    <div className={styles.googleWrap}>
                      <div id="google-register-btn" className={styles.googleButtonSlot} />
                    </div>
                  </>
                )}

                <p className={styles.switchRow}>
                  Already have an account? <Link href="/auth/login" className={styles.switchLink}>Sign in</Link>
                </p>
              </>
            ) : (
              <>
                <h1 className={`${styles.title} ${styles.compactTitle}`}>Confirm your details</h1>
                <p className={styles.subtitle}>Please verify your information before registering.</p>

                <div className={styles.reviewPanel}>
                  <div className={styles.reviewRow}>
                    <span className={styles.reviewLabel}>Full Name</span>
                    <strong className={styles.reviewValue}>{form.fullName}</strong>
                  </div>
                  <div className={styles.reviewRow}>
                    <span className={styles.reviewLabel}>Email</span>
                    <strong className={styles.reviewValue}>{form.email}</strong>
                  </div>
                  <div className={styles.reviewRow}>
                    <span className={styles.reviewLabel}>Student Type</span>
                    <strong className={styles.reviewValue}>{studentType === "fpt" ? "FPT University" : "External"}</strong>
                  </div>
                  <div className={styles.reviewRow}>
                    <span className={styles.reviewLabel}>Student ID</span>
                    <strong className={styles.reviewValue}>{form.studentId}</strong>
                  </div>
                  <div className={`${styles.reviewRow} ${styles.reviewRowGap}`}>
                    <span className={styles.reviewLabel}>Phone Number</span>
                    <strong className={styles.reviewValueRight}>{form.phoneNumber}</strong>
                  </div>
                  <div className={`${styles.reviewRow} ${styles.reviewRowGap}`}>
                    <span className={styles.reviewLabel}>Developer Role</span>
                    <strong className={styles.reviewValueRight}>{form.developerRole}</strong>
                  </div>
                  <div className={`${styles.reviewRow} ${styles.reviewRowGap}`}>
                    <span className={styles.reviewLabel}>Languages</span>
                    <strong className={`${styles.reviewValueRight} ${styles.reviewValueClamp}`}>
                      {form.programmingLanguages.join(", ")}
                    </strong>
                  </div>
                  <div className={styles.reviewRow}>
                    <span className={styles.reviewLabel}>University</span>
                    <strong className={`${styles.reviewValueRight} ${styles.reviewValueClamp}`}>
                      {studentType === "fpt" 
                        ? "FPT University" 
                        : (() => {
                            const uni = form.university === "Other / International" ? form.customUniversity : form.university;
                            return uni.toLowerCase().includes("fpt") ? `Local - ${uni}` : `External - ${uni}`;
                          })()
                      }
                    </strong>
                  </div>
                </div>

                <div className={styles.reviewActions}>
                  <button type="button" className={`btn btn-ghost ${styles.reviewActionButton}`} onClick={() => setStep("form")} disabled={loading}>
                    Back to Edit
                  </button>
                  <button type="button" className={`btn btn-primary ${styles.reviewActionButton}`} onClick={handleConfirmAndRegister} disabled={loading}>
                    {loading ? <span className="spinner" /> : <><CheckCircle size={16} /> Confirm</>}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className={styles.rightSide}>
          <video
            className={styles.rightVideo}
            src="/images/auth_illustration.mp4"
            poster="/images/auth_illustration.jpg"
            autoPlay
            loop
            muted
            playsInline
          />
          <div className={styles.rightOverlay} />
        </div>
      </div>
    </div>
  );
}
