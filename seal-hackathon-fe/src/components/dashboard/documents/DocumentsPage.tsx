"use client";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { FileText, Download, Upload, Trash2, Search, X } from "lucide-react";
import { App } from "antd";
import { apiRequest, apiUpload, apiDownload } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import PageHeader from "@/components/workspace/PageHeader";
import styles from "./DocumentsPage.module.css";

interface DocumentDto {
  documentId: string;
  fileName: string;
  contentType: string;
  eventId?: string;
  eventName?: string;
  roundName?: string;
  isPromptDocument?: boolean;
  uploadedAt: string;
  uploaderName?: string;
  size: number;
  teamId?: string;
  teamName?: string;
}

interface MentorTeam {
  teamId: string;
  teamName: string;
}

type EventOption = {
  eventId: string;
  eventName: string;
};

type DocumentTypeFilter = "all" | "pdf" | "image" | "document" | "spreadsheet" | "presentation" | "archive" | "other";

const DOCUMENT_TYPE_OPTIONS: { value: DocumentTypeFilter; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "pdf", label: "PDF" },
  { value: "image", label: "Images" },
  { value: "document", label: "Documents" },
  { value: "spreadsheet", label: "Spreadsheets" },
  { value: "presentation", label: "Presentations" },
  { value: "archive", label: "Archives" },
  { value: "other", label: "Other" },
];

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + " KB";
  return bytes + " B";
}

function formatDate(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getFileExtension(fileName: string) {
  const lastDotIndex = fileName.lastIndexOf(".");
  return lastDotIndex >= 0 ? fileName.slice(lastDotIndex + 1).toLowerCase() : "";
}

function getDocumentType(doc: DocumentDto): DocumentTypeFilter {
  const contentType = doc.contentType.toLowerCase();
  const extension = getFileExtension(doc.fileName);

  if (contentType.includes("pdf") || extension === "pdf") return "pdf";
  if (contentType.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(extension)) return "image";
  if (contentType.includes("word") || contentType.includes("document") || ["doc", "docx", "txt", "rtf"].includes(extension)) return "document";
  if (contentType.includes("sheet") || contentType.includes("excel") || ["xls", "xlsx", "csv"].includes(extension)) return "spreadsheet";
  if (contentType.includes("presentation") || contentType.includes("powerpoint") || ["ppt", "pptx"].includes(extension)) return "presentation";
  if (contentType.includes("zip") || contentType.includes("rar") || contentType.includes("7z") || ["zip", "rar", "7z", "tar", "gz"].includes(extension)) return "archive";

  return "other";
}

function getDocumentTypeLabel(doc: DocumentDto) {
  const type = getDocumentType(doc);
  return DOCUMENT_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? "Other";
}

export default function DocumentsPage() {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes("Admin");
  const isMentor = user?.roles?.includes("Mentor");
  const isJudge = user?.roles?.includes("Judge");
  const usesRegisteredEventFilter = !isAdmin && (isMentor || isJudge);

  const { message, modal } = App.useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<DocumentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [registeredEventIds, setRegisteredEventIds] = useState<string[]>([]);
  const [selectedRegisteredEventId, setSelectedRegisteredEventId] = useState("all");
  const [selectedEventId, setSelectedEventId] = useState<string>("global");
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState<DocumentTypeFilter>("all");
  const [mentorTeams, setMentorTeams] = useState<MentorTeam[]>([]);
  const [viewContext, setViewContext] = useState<string>("official");

  const loadEvents = useCallback(async () => {
    try {
      const data = await apiRequest<EventOption[]>("/Events");
      setEvents(data.map(e => ({ eventId: e.eventId, eventName: e.eventName })));
    } catch (err) {
      message.warning(err instanceof Error ? err.message : "Could not load events for document filters.");
    }
  }, [message]);

  const loadRegistrations = useCallback(async () => {
    if (!usesRegisteredEventFilter) return;
    try {
      const data = await apiRequest<string[]>("/Events/my-registrations");
      setRegisteredEventIds(data);
      setSelectedRegisteredEventId((current) =>
        current === "all" || data.includes(current) ? current : "all"
      );
    } catch (err) {
      message.warning(err instanceof Error ? err.message : "Could not load registered events.");
      setRegisteredEventIds([]);
      setSelectedRegisteredEventId("all");
    }
  }, [message, usesRegisteredEventFilter]);

  const loadMentorTeams = useCallback(async () => {
    if (!isMentor) return;
    try {
      const data = await apiRequest<MentorTeam[]>("/mentor/teams");
      setMentorTeams(data);
    } catch (err) {
      message.warning(err instanceof Error ? err.message : "Could not load mentor team filters.");
    }
  }, [isMentor, message]);

  const loadDocs = useCallback(async () => {
    try {
      const data = await apiRequest<DocumentDto[]>("/Documents");
      setDocs(data);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not load documents.");
      setDocs([]);
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    void Promise.resolve().then(async () => {
      await loadEvents();
      await loadRegistrations();
      await loadDocs();
      await loadMentorTeams();
    });
  }, [loadDocs, loadEvents, loadMentorTeams, loadRegistrations]);

  const registeredEvents = useMemo(() => {
    if (!usesRegisteredEventFilter) return [];
    const registered = new Set(registeredEventIds);
    return events.filter((event) => registered.has(event.eventId));
  }, [events, registeredEventIds, usesRegisteredEventFilter]);

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("file", file);
        if (selectedEventId !== "global") {
          fd.append("eventId", selectedEventId);
        }
        await apiUpload("/Documents", fd);
        message.success("File uploaded successfully!");
        await loadDocs();
      } catch (err) {
        message.error(err instanceof Error ? err.message : "Upload failed.");
      } finally {
        setUploading(false);
      }
    }
    if (e.target) e.target.value = "";
  };

  const handleDownload = async (doc: DocumentDto) => {
    try {
      const blob = await apiDownload(`/Documents/${doc.documentId}/download`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Download failed.");
    }
  };

  const handleDelete = (doc: DocumentDto) => {
    modal.confirm({
      title: `Delete "${doc.fileName}"?`,
      content: "This permanently removes the file for everyone. This cannot be undone.",
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await apiRequest(`/Documents/${doc.documentId}`, { method: "DELETE" });
          message.success("Document deleted.");
          await loadDocs();
        } catch (err) {
          message.error(err instanceof Error ? err.message : "Delete failed.");
        }
      },
    });
  };

  const filteredDocs = useMemo(() => {
    const scopedDocs = (() => {
      if (isAdmin || !isMentor) return docs;
      if (viewContext === "official") return docs.filter(d => !d.teamId);
      return docs.filter(d => d.teamId === viewContext);
    })();

    const eventScopedDocs = (() => {
      if (!usesRegisteredEventFilter || (isMentor && viewContext !== "official")) return scopedDocs;
      if (selectedRegisteredEventId !== "all") {
        return scopedDocs.filter((doc) => doc.eventId === selectedRegisteredEventId);
      }
      return scopedDocs.filter((doc) => !doc.eventId || registeredEventIds.includes(doc.eventId));
    })();

    const query = searchText.trim().toLowerCase();

    return eventScopedDocs.filter((doc) => {
      const matchesType = typeFilter === "all" || getDocumentType(doc) === typeFilter;
      const matchesSearch =
        query.length === 0 ||
        doc.fileName.toLowerCase().includes(query) ||
        (doc.eventName ?? "").toLowerCase().includes(query) ||
        (doc.roundName ?? "").toLowerCase().includes(query) ||
        (doc.uploaderName ?? "").toLowerCase().includes(query);

      return matchesType && matchesSearch;
    });
  }, [docs, isAdmin, isMentor, registeredEventIds, searchText, selectedRegisteredEventId, typeFilter, usesRegisteredEventFilter, viewContext]);

  const hasActiveFilters = searchText.trim().length > 0 || typeFilter !== "all";

  const clearFilters = () => {
    setSearchText("");
    setTypeFilter("all");
  };

  const subtitle = usesRegisteredEventFilter
    ? "Review official resources and round prompts for events you are registered to support."
    : "Upload, organize, and download official hackathon resources.";

  return (
    <div className={styles.root}>
      <PageHeader
        title="Documents Library"
        subtitle={subtitle}
        actions={(
          <div className={styles.toolbar}>
            {usesRegisteredEventFilter && (
              <select
                className={`form-input ${styles.eventFilterSelect}`}
                value={selectedRegisteredEventId}
                onChange={(e) => setSelectedRegisteredEventId(e.target.value)}
                disabled={registeredEvents.length === 0 || (isMentor && viewContext !== "official")}
                aria-label="Filter documents by registered event"
              >
                <option value="all">All registered events</option>
                {registeredEvents.map((event) => (
                  <option key={event.eventId} value={event.eventId}>{event.eventName}</option>
                ))}
              </select>
            )}
            {isAdmin && (
              <select
                className={`form-input ${styles.adminSelect}`}
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
              >
                <option value="global">Global (No Event)</option>
                {events.map(e => (
                  <option key={e.eventId} value={e.eventId}>{e.eventName}</option>
                ))}
              </select>
            )}
            {isMentor && !isAdmin && mentorTeams.length > 0 && (
              <select
                className={`form-input ${styles.mentorSelect}`}
                value={viewContext}
                onChange={(e) => setViewContext(e.target.value)}
              >
                <option value="official">Official Resources</option>
                {mentorTeams.map(t => (
                  <option key={t.teamId} value={t.teamId}>Team: {t.teamName}</option>
                ))}
              </select>
            )}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className={styles.hiddenInput} />
            <button className="btn btn-primary" onClick={handleUploadClick} disabled={uploading}>
              {uploading ? <span className="spinner" /> : <><Upload size={15} className={styles.buttonIcon} /> Upload File</>}
            </button>
          </div>
        )}
      />

      <div className={`glass-card ${styles.card}`}>
        <div className={styles.cardHeader}>
          <div>
            <h4 className={styles.cardTitle}>All Files</h4>
            <p className={styles.cardSubtitle}>
              Showing {filteredDocs.length} of {docs.length} document{docs.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className={styles.filters}>
            <div className={styles.searchBox}>
              <Search size={15} className={styles.searchIcon} />
              <input
                className={styles.searchInput}
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search by file, event, round, or uploader..."
                aria-label="Search documents"
              />
            </div>
            <select
              className={`form-input ${styles.typeSelect}`}
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as DocumentTypeFilter)}
              aria-label="Filter documents by type"
            >
              {DOCUMENT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            {hasActiveFilters && (
              <button className={`btn btn-ghost btn-sm ${styles.clearButton}`} onClick={clearFilters}>
                <X size={14} /> Clear
              </button>
            )}
          </div>
        </div>
        <div className={styles.list}>
          {loading ? (
            <div className={styles.emptyState}>Loading documents...</div>
          ) : filteredDocs.length === 0 ? (
            <div className={styles.emptyState}>
              {hasActiveFilters ? "No documents match these filters." : "No documents found. Upload one to get started."}
            </div>
          ) : filteredDocs.map((doc, index) => (
            <div key={doc.documentId} className={`${styles.row} ${index === filteredDocs.length - 1 ? styles.lastRow : ""}`}>
              <div className={styles.fileInfo}>
                <FileText size={18} className={styles.fileIcon} />
                <div>
                  <div className={styles.fileName}>
                    {doc.fileName}
                    {doc.eventName && <span className={styles.eventTag}>{doc.eventName}</span>}
                    {doc.isPromptDocument && <span className={styles.promptTag}>Round prompt</span>}
                  </div>
                  <div className={styles.fileMeta}>
                    {[
                      getDocumentTypeLabel(doc),
                      formatSize(doc.size),
                      doc.roundName ? `Round: ${doc.roundName}` : null,
                      `Uploaded ${formatDate(doc.uploadedAt)}`,
                      doc.uploaderName,
                    ].filter(Boolean).join(" · ")}
                  </div>
                </div>
              </div>
              <div className={styles.actions}>
                <button className={`btn btn-sm ${styles.downloadButton}`} onClick={() => handleDownload(doc)}>
                  <Download size={14} className={styles.downloadIcon} /> Download
                </button>
                {isAdmin && (
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={() => handleDelete(doc)} aria-label={`Delete ${doc.fileName}`}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
