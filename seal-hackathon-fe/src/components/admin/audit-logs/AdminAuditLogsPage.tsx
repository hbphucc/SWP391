"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileText, RotateCcw, Search, Shield } from "lucide-react";
import { App, Table, Tag, Input } from "antd";
import { apiRequest, fetchCurrentUser } from "@/lib/api";

interface AuditLogItem {
  id: string;
  actorUserId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  description: string;
  createdAt: string;
}

export default function AuditLogsPage() {
  const { message } = App.useApp();
  const [searchText, setSearchText] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [actorFilter, setActorFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [filterNow, setFilterNow] = useState(() => Date.now());

  // Gate the page on the current user's Admin role; on error the user stays non-admin.
  const { data: currentUser, isLoading: authLoading } = useQuery({
    queryKey: ["current-user"],
    queryFn: fetchCurrentUser,
  });
  const isAdmin = currentUser?.roles.includes("Admin") ?? false;
  const authChecked = !authLoading;

  const {
    data: logs = [],
    isFetching: loading,
    error: logsError,
    refetch: loadLogs,
  } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: () => apiRequest<AuditLogItem[]>("/admin/audit-logs"),
    enabled: isAdmin,
  });

  useEffect(() => {
    if (logsError) message.error(logsError instanceof Error ? logsError.message : "Could not load audit logs.");
  }, [logsError, message]);

  const filteredLogs = useMemo(() => {
    const query = searchText.toLowerCase();
    return logs.filter((log) => {
      if (actionFilter !== "all" && log.action !== actionFilter) return false;
      if (entityFilter !== "all" && (log.entityType ?? "System") !== entityFilter) return false;
      if (actorFilter !== "all" && (log.actorEmail ?? log.actorName ?? "System / Guest") !== actorFilter) return false;

      if (dateFilter !== "all") {
        const createdAt = new Date(log.createdAt).getTime();
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        if (dateFilter === "today" && createdAt < startOfToday.getTime()) return false;
        if (dateFilter === "7days" && filterNow - createdAt > 7 * 24 * 60 * 60 * 1000) return false;
        if (dateFilter === "30days" && filterNow - createdAt > 30 * 24 * 60 * 60 * 1000) return false;
      }

      if (!query.trim()) return true;

      return (
        log.action.toLowerCase().includes(query) ||
        (log.actorName && log.actorName.toLowerCase().includes(query)) ||
        (log.actorEmail && log.actorEmail.toLowerCase().includes(query)) ||
        (log.description && log.description.toLowerCase().includes(query)) ||
        (log.entityType && log.entityType.toLowerCase().includes(query))
      );
    });
  }, [actionFilter, actorFilter, dateFilter, entityFilter, filterNow, logs, searchText]);

  const actionOptions = useMemo(
    () => Array.from(new Set(logs.map((log) => log.action))).sort((a, b) => a.localeCompare(b)),
    [logs]
  );

  const entityOptions = useMemo(
    () => Array.from(new Set(logs.map((log) => log.entityType ?? "System"))).sort((a, b) => a.localeCompare(b)),
    [logs]
  );

  const actorOptions = useMemo(
    () => Array.from(new Set(logs.map((log) => log.actorEmail ?? log.actorName ?? "System / Guest"))).sort((a, b) => a.localeCompare(b)),
    [logs]
  );

  const hasFilters = searchText.trim() || actionFilter !== "all" || entityFilter !== "all" || actorFilter !== "all" || dateFilter !== "all";

  const clearFilters = () => {
    setSearchText("");
    setActionFilter("all");
    setEntityFilter("all");
    setActorFilter("all");
    setDateFilter("all");
  };

  const exportCsv = () => {
    const headers = ["Time", "Actor", "Email", "Action", "Target Type", "Target Id", "Details"];
    const escapeCell = (value: string | null) => `"${(value ?? "").replaceAll("\"", "\"\"")}"`;
    const rows = filteredLogs.map((log) => [
      new Date(log.createdAt).toLocaleString(),
      log.actorName ?? "System / Guest",
      log.actorEmail ?? "",
      log.action,
      log.entityType ?? "",
      log.entityId ?? "",
      log.description,
    ].map(escapeCell).join(","));

    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    {
      title: "Time",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (t: string) => (
        <span style={{ fontSize: "0.85rem", color: "var(--color-text-2)" }}>
          {new Date(t).toLocaleString()}
        </span>
      ),
      width: "180px",
    },
    {
      title: "Actor",
      key: "actor",
      render: (_: unknown, record: AuditLogItem) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{record.actorName || "System / Guest"}</div>
          {record.actorEmail && (
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-3)" }}>{record.actorEmail}</div>
          )}
        </div>
      ),
      width: "200px",
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      render: (action: string) => {
        let color = "blue";
        if (action.includes("delete")) color = "volcano";
        else if (action.includes("create")) color = "green";
        else if (action.includes("update") || action.includes("edit")) color = "orange";
        else if (action.includes("login") || action.includes("auth")) color = "purple";
        return <Tag color={color}>{action}</Tag>;
      },
      width: "150px",
    },
    {
      title: "Target Type",
      dataIndex: "entityType",
      key: "entityType",
      render: (type: string | null) => (
        type ? <span className="badge badge-neutral">{type}</span> : "-"
      ),
      width: "120px",
    },
    {
      title: "Details",
      dataIndex: "description",
      key: "description",
      render: (desc: string) => (
        <span style={{ fontSize: "0.88rem", color: "var(--color-text-1)" }}>{desc}</span>
      ),
    },
  ];

  if (!authChecked) {
    return (
      <div className="empty-state">
        <span className="spinner" />
        <div className="empty-title">Checking access</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <Shield size={48} style={{ color: "var(--color-danger)", marginBottom: 16 }} />
        <h2>Access Denied</h2>
        <p>This page is restricted to Event Administrators only.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <FileText size={28} /> System Audit Logs
          </h1>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button className="btn btn-secondary btn-icon" onClick={() => loadLogs()} disabled={loading} title="Refresh logs">
            <RotateCcw size={15} />
          </button>
          <button className="btn btn-secondary" onClick={exportCsv} disabled={filteredLogs.length === 0}>
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center", marginBottom: "1rem" }}>
        <Input
          prefix={<Search size={16} style={{ color: "var(--color-text-3)" }} />}
          placeholder="Search action, actor, details..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ flex: "1 1 260px" }}
          allowClear
        />
        <select className="form-input" value={actionFilter} onChange={(event) => setActionFilter(event.target.value)} style={{ flex: "0 1 190px" }}>
          <option value="all">All actions</option>
          {actionOptions.map((action) => <option key={action} value={action}>{action}</option>)}
        </select>
        <select className="form-input" value={entityFilter} onChange={(event) => setEntityFilter(event.target.value)} style={{ flex: "0 1 170px" }}>
          <option value="all">All targets</option>
          {entityOptions.map((entity) => <option key={entity} value={entity}>{entity}</option>)}
        </select>
        <select className="form-input" value={actorFilter} onChange={(event) => setActorFilter(event.target.value)} style={{ flex: "0 1 220px" }}>
          <option value="all">All actors</option>
          {actorOptions.map((actor) => <option key={actor} value={actor}>{actor}</option>)}
        </select>
        <select
          className="form-input"
          value={dateFilter}
          onChange={(event) => {
            setDateFilter(event.target.value);
            setFilterNow(Date.now());
          }}
          style={{ flex: "0 1 150px" }}
        >
          <option value="all">Any time</option>
          <option value="today">Today</option>
          <option value="7days">Last 7 days</option>
          <option value="30days">Last 30 days</option>
        </select>
        {hasFilters && (
          <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
            Clear filters
          </button>
        )}
        <span className="badge badge-neutral">{filteredLogs.length} logs</span>
      </div>

      <div className="card">
        <Table
          className="custom-antd-table"
          dataSource={filteredLogs}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 15, showSizeChanger: false }}
        />
      </div>
    </div>
  );
}
