"use client";
import React, { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Send, Paperclip, FileText, Download, X, MessageSquare, Loader2, AlertCircle } from "lucide-react";
import { App, Spin, Tag, Tooltip } from "antd";
import { apiRequest, apiUpload, apiDownload } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import styles from "./TeamChatPanel.module.css";

interface ChatMessage {
  id: string;
  teamId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  documentId?: string | null;
  documentName?: string | null;
  documentSize?: number | null;
  sentAt: string;
}

interface TeamChatPanelProps {
  teamId: string;
  disabled?: boolean;
  disabledReason?: string;
}

function formatBytes(bytes?: number | null): string {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function TeamChatPanel({ teamId, disabled = false, disabledReason }: TeamChatPanelProps) {
  const { user } = useAuth();
  const { message } = App.useApp();

  const [inputText, setInputText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    data: messagesList = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["team-chat", teamId],
    queryFn: () => apiRequest<ChatMessage[]>(`/teams/${teamId}/chat`),
    refetchInterval: 4000,
  });

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isInitialLoadRef = useRef(true);
  const prevMessageCountRef = useRef(0);

  useEffect(() => {
    if (messagesList.length === 0) return;

    const container = messagesContainerRef.current;
    if (!container) return;

    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120;
    const isNewMessageAdded = messagesList.length > prevMessageCountRef.current;

    if (isInitialLoadRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
      isInitialLoadRef.current = false;
    } else if (isNewMessageAdded && isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    prevMessageCountRef.current = messagesList.length;
  }, [messagesList]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        message.error("File size cannot exceed 10 MB.");
        return;
      }
      setSelectedFile(file);
    }
    if (e.target) e.target.value = "";
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !selectedFile) {
      return;
    }

    setSending(true);
    try {
      const formData = new FormData();
      if (inputText.trim()) {
        formData.append("message", inputText.trim());
      }
      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      await apiUpload<ChatMessage>(`/teams/${teamId}/chat`, formData);
      setInputText("");
      setSelectedFile(null);
      await refetch();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const handleDownload = async (docId: string, fileName: string) => {
    setDownloadingId(docId);
    try {
      const blob = await apiDownload(`/Documents/${docId}/download`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Download failed.");
    } finally {
      setDownloadingId(null);
    }
  };

  const renderRoleBadge = (role: string) => {
    const roleLower = role.toLowerCase();
    if (roleLower === "mentor") {
      return <Tag color="success" style={{ marginLeft: 6, marginRight: 0, fontSize: "0.72rem", fontWeight: 600 }}>Mentor</Tag>;
    }
    if (roleLower === "leader") {
      return <Tag color="blue" style={{ marginLeft: 6, marginRight: 0, fontSize: "0.72rem" }}>Leader</Tag>;
    }
    if (roleLower === "admin") {
      return <Tag color="purple" style={{ marginLeft: 6, marginRight: 0, fontSize: "0.72rem" }}>Admin</Tag>;
    }
    return <Tag style={{ marginLeft: 6, marginRight: 0, fontSize: "0.72rem" }}>Member</Tag>;
  };

  return (
    <div className={styles.chatContainer}>
      {/* Header */}
      <div className={styles.chatHeader}>
        <div className={styles.headerLeft}>
          <MessageSquare size={19} className={styles.headerIcon} />
          <h3 className={styles.headerTitle}>Mentor & Team Private Chat</h3>
        </div>
        <span className={styles.headerBadge}>
          Encrypted Channel
        </span>
      </div>

      {/* Messages Feed */}
      <div className={styles.messagesFeed} ref={messagesContainerRef}>
        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <Spin size="large" />
          </div>
        ) : messagesList.length === 0 ? (
          <div className={styles.emptyFeed}>
            <MessageSquare size={48} className={styles.emptyIcon} />
            <p className={styles.emptyTitle}>No messages yet in this team channel.</p>
            <p className={styles.emptySubtitle}>All team members & mentor can exchange messages and documents here!</p>
          </div>
        ) : (
          messagesList.map((msg) => {
            const isMe = msg.senderId === user?.id;
            const isMentor = msg.senderRole.toLowerCase() === "mentor";

            return (
              <div
                key={msg.id}
                className={`${styles.messageRow} ${isMe ? styles.myMessageRow : styles.otherMessageRow}`}
              >
                {/* Sender Header */}
                <div className={styles.senderHeader}>
                  <span className={`${styles.senderName} ${isMe ? styles.mySenderName : ""}`}>
                    {isMe ? "You" : msg.senderName}
                  </span>
                  {renderRoleBadge(msg.senderRole)}
                  <span className={styles.timestamp}>
                    {new Date(msg.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                {/* Bubble Container */}
                <div
                  className={`${styles.messageBubble} ${
                    isMe ? styles.myBubble : isMentor ? styles.mentorBubble : styles.defaultBubble
                  }`}
                >
                  {/* Message Text */}
                  {msg.message && (
                    <p className={`${styles.messageText} ${msg.documentId ? styles.withDocument : ""}`}>
                      {msg.message}
                    </p>
                  )}

                  {/* Attached File Card */}
                  {msg.documentId && msg.documentName && (
                    <div
                      className={styles.fileCard}
                      onClick={() => handleDownload(msg.documentId!, msg.documentName!)}
                    >
                      <div className={styles.fileInfo}>
                        <div className={styles.fileIconBox}>
                          <FileText size={17} />
                        </div>
                        <div className={styles.fileDetails}>
                          <span className={styles.fileName}>
                            {msg.documentName}
                          </span>
                          <span className={styles.fileMeta}>
                            {formatBytes(msg.documentSize)} • Click to download
                          </span>
                        </div>
                      </div>
                      <Tooltip title="Download file">
                        <div className={styles.downloadIconBox}>
                          {downloadingId === msg.documentId ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Download size={16} />
                          )}
                        </div>
                      </Tooltip>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className={styles.inputArea}>
        {disabled ? (
          <div style={{ padding: "0.9rem 1rem", background: "var(--color-surface-2)", borderTop: "1px solid var(--color-border-2)", fontSize: "0.85rem", color: "var(--color-text-3)", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
            <AlertCircle size={16} style={{ color: "var(--color-amber)" }} />
            <span>{disabledReason || "This chat channel is closed because the event has ended."}</span>
          </div>
        ) : (
          <>
            {/* Selected File Preview */}
            {selectedFile && (
              <div className={styles.filePreviewBar}>
                <div className={styles.filePreviewInfo}>
                  <FileText size={16} style={{ color: "var(--color-primary-2)" }} />
                  <span className={styles.filePreviewName}>
                    {selectedFile.name}
                  </span>
                  <span className={styles.filePreviewSize}>({formatBytes(selectedFile.size)})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className={styles.removeFileBtn}
                >
                  <X size={15} />
                </button>
              </div>
            )}

            <form onSubmit={handleSend} className={styles.formRow}>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className={styles.hiddenFileInput}
              />

              <Tooltip title="Attach document or file (max 10MB)">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={styles.attachBtn}
                >
                  <Paperclip size={19} />
                </button>
              </Tooltip>

              <input
                type="text"
                placeholder="Type a message to your team / mentor..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className={styles.textInput}
              />

              <button
                type="submit"
                disabled={sending || (!inputText.trim() && !selectedFile)}
                className={styles.sendBtn}
              >
                {sending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Sending</span>
                  </>
                ) : (
                  <>
                    <span>Send</span>
                    <Send size={16} />
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
