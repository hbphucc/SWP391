import type { Metadata } from "next";
import Script from "next/script";
import ThemeProvider from "../components/ThemeProvider";
import AIChatbotWrapper from "../components/AIChatbotWrapper";
import "./globals.css";

export const metadata: Metadata = {
  title: "SEAL – Hệ thống Quản lý Hackathon Kỹ thuật Phần mềm",
  description:
    "SEAL (Software Engineering Agile League) là nền tảng quản lý hackathon học thuật cho cuộc thi SE thường niên của Đại học FPT, hỗ trợ quản lý sự kiện, đăng ký đội thi, giám khảo và phân tích.",
  keywords: ["hackathon", "SEAL", "FPT", "software engineering", "competition"],
  authors: [{ name: "Hệ thống SEAL" }],
  openGraph: {
    title: "Hệ thống Quản lý Hackathon SEAL",
    description: "Quản lý sự kiện hackathon, đội thi, bài nộp và giám khảo một cách liền mạch.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div id="google_translate_element" style={{ display: "none" }}></div>
        <ThemeProvider>
          {children}
          <AIChatbotWrapper />
        </ThemeProvider>
        
        <Script id="google-translate-patch" strategy="beforeInteractive">
          {`
            if (typeof Node === 'function' && Node.prototype) {
              const originalRemoveChild = Node.prototype.removeChild;
              Node.prototype.removeChild = function(child) {
                if (child.parentNode !== this) {
                  if (console) console.warn('Cannot remove a child from a different parent', child, this);
                  return child;
                }
                return originalRemoveChild.apply(this, arguments);
              };
              const originalInsertBefore = Node.prototype.insertBefore;
              Node.prototype.insertBefore = function(newNode, referenceNode) {
                if (referenceNode && referenceNode.parentNode !== this) {
                  if (console) console.warn('Cannot insert before a reference node from a different parent', referenceNode, this);
                  return newNode;
                }
                return originalInsertBefore.apply(this, arguments);
              };
            }
          `}
        </Script>
        <Script
          src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="afterInteractive"
        />
        <Script id="google-translate-init" strategy="afterInteractive">
          {`
            window.googleTranslateElementInit = function() {
              new window.google.translate.TranslateElement(
                { 
                  pageLanguage: 'vi', 
                  includedLanguages: 'en,vi,ko,ja,zh-CN,fr,de,th',
                  autoDisplay: false 
                },
                'google_translate_element'
              );
            };
          `}
        </Script>
      </body>
    </html>
  );
}
