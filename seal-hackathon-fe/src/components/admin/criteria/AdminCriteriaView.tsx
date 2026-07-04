"use client";
import { useState, useCallback, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { App, Table, Tag, Modal, Button, Input, InputNumber } from "antd";
import { apiRequest } from "@/lib/api";

interface CriteriaDto {
  criteriaId: string;
  criteriaName: string;
  weight: number;
  maxScore: number;
  roundId: string;
}

interface CriteriaRow {
  key: string;
  round: string;
  criteria: CriteriaDto[];
}

type SavedCriteria = Pick<CriteriaDto, "criteriaId" | "criteriaName" | "maxScore" | "weight">;

const CRITERIA_TOTAL_WEIGHT = 100;
const DEFAULT_CRITERIA_WEIGHT = 10;

export default function AdminCriteriaView({
  eventName,
  rounds,
}: {
  eventName: string;
  rounds: { roundId: string; roundName: string }[];
}) {
  const { message } = App.useApp();
  const [rows, setRows] = useState<CriteriaRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRound, setSelectedRound] = useState<{ roundId: string; roundName: string } | null>(null);
  const [editingCriteria, setEditingCriteria] = useState<CriteriaDto[]>([]);
  const [deletedCriteriaIds, setDeletedCriteriaIds] = useState<string[]>([]);
  const [savingModal, setSavingModal] = useState(false);

  const roundIds = rounds.map((r) => r.roundId).join(",");

  const loadCriteriaList = useCallback(async () => {
    setLoading(true);
    try {
      const built = await Promise.all(
        rounds.map(async (round) => {
          try {
            const criteria = await apiRequest<CriteriaDto[]>(`/rounds/${round.roundId}/criteria`);
            return { key: round.roundId, round: round.roundName, criteria: criteria || [] };
          } catch {
            return { key: round.roundId, round: round.roundName, criteria: [] };
          }
        })
      );
      setRows(built);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not load criteria.");
      setRows([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message, roundIds]);

  useEffect(() => {
    const timer = setTimeout(() => void loadCriteriaList(), 0);
    return () => clearTimeout(timer);
  }, [loadCriteriaList]);

  const openManageModal = (record: CriteriaRow) => {
    setSelectedRound({ roundId: record.key, roundName: record.round });
    setEditingCriteria(record.criteria.map((c) => ({ ...c })));
    setDeletedCriteriaIds([]);
    setModalOpen(true);
  };

  const handleAddCriterion = () => {
    const tempId = `temp-${Date.now()}`;
    const newCriterion: CriteriaDto = {
      criteriaId: tempId,
      criteriaName: "",
      weight: DEFAULT_CRITERIA_WEIGHT,
      maxScore: CRITERIA_TOTAL_WEIGHT,
      roundId: selectedRound?.roundId ?? "",
    };
    setEditingCriteria((current) => [...current, newCriterion]);
  };

  const handleRemoveCriterion = (index: number, criteriaId: string) => {
    if (!criteriaId.startsWith("temp-")) {
      setDeletedCriteriaIds((current) => [...current, criteriaId]);
    }
    setEditingCriteria((current) => current.filter((_, i) => i !== index));
  };

  const handleSaveCriteria = async () => {
    if (!selectedRound) return;

    for (const c of editingCriteria) {
      if (!c.criteriaName.trim()) {
        message.error("Please enter a name for all criteria.");
        return;
      }
      if (c.weight === null || c.weight === undefined || c.weight < 0 || c.weight > CRITERIA_TOTAL_WEIGHT) {
        message.error(`Criteria weight must be between 0 and ${CRITERIA_TOTAL_WEIGHT}.`);
        return;
      }
    }

    const totalWeight = editingCriteria.reduce((sum, c) => sum + (c.weight || 0), 0);
    if (totalWeight !== CRITERIA_TOTAL_WEIGHT) {
      message.error(`Total weight must be exactly ${CRITERIA_TOTAL_WEIGHT}%. Current: ${totalWeight}%.`);
      return;
    }

    setSavingModal(true);
    try {
      for (const id of deletedCriteriaIds) {
        await apiRequest(`/rounds/${selectedRound.roundId}/criteria/${id}`, { method: "DELETE" });
      }

      // Set all weights to 0 first to bypass backend "must total 100%" check
      // while criteria are being individually created/updated.
      const savedCriteriaList = await editingCriteria.reduce<Promise<SavedCriteria[]>>(
        async (savedCriteriaPromise, criterion) => {
          const savedCriteria = await savedCriteriaPromise;
          const criteriaName = criterion.criteriaName.trim();

          if (criterion.criteriaId.startsWith("temp-")) {
            const res = await apiRequest<{ criteriaId: string }>(`/rounds/${selectedRound.roundId}/criteria`, {
              method: "POST",
              body: JSON.stringify({ criteriaName, maxScore: CRITERIA_TOTAL_WEIGHT, weight: 0 }),
            });

            return [
              ...savedCriteria,
              { criteriaId: res.criteriaId, criteriaName, maxScore: CRITERIA_TOTAL_WEIGHT, weight: criterion.weight },
            ];
          }

          await apiRequest(`/rounds/${selectedRound.roundId}/criteria/${criterion.criteriaId}`, {
            method: "PUT",
            body: JSON.stringify({ criteriaName, maxScore: CRITERIA_TOTAL_WEIGHT, weight: 0 }),
          });

          return [
            ...savedCriteria,
            { criteriaId: criterion.criteriaId, criteriaName, maxScore: CRITERIA_TOTAL_WEIGHT, weight: criterion.weight },
          ];
        },
        Promise.resolve([]),
      );

      for (const c of savedCriteriaList) {
        await apiRequest(`/rounds/${selectedRound.roundId}/criteria/${c.criteriaId}`, {
          method: "PUT",
          body: JSON.stringify({ criteriaName: c.criteriaName, maxScore: CRITERIA_TOTAL_WEIGHT, weight: c.weight }),
        });
      }

      message.success("Criteria updated successfully.");
      setModalOpen(false);
      await loadCriteriaList();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Failed to update criteria.");
    } finally {
      setSavingModal(false);
    }
  };

  const modalTotalWeight = editingCriteria.reduce((sum, c) => sum + (c.weight || 0), 0);

  const columns = [
    { title: "Round", dataIndex: "round", key: "round", render: (t: string) => <b>{t}</b> },
    {
      title: "Criteria breakdown",
      key: "criteria",
      render: (_: unknown, record: CriteriaRow) => (
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {record.criteria.length === 0 ? (
            <span style={{ fontSize: "0.82rem", color: "var(--color-text-3)", fontStyle: "italic" }}>
              No criteria configured yet.
            </span>
          ) : (
            record.criteria.map((c) => (
              <Tag key={c.criteriaId} color="blue">
                {c.criteriaName} ({c.weight}%)
              </Tag>
            ))
          )}
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: CriteriaRow) => (
        <Button size="small" type="primary" onClick={() => openManageModal(record)}>
          Manage Criteria
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Table
        className="custom-antd-table"
        dataSource={rows}
        columns={columns}
        rowKey="key"
        loading={loading}
        pagination={false}
        locale={{ emptyText: loading ? "Loading criteria…" : "No rounds configured for this event yet." }}
      />

      <Modal
        title={`Manage Criteria - ${selectedRound?.roundName} (${eventName})`}
        open={modalOpen}
        onCancel={() => !savingModal && setModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setModalOpen(false)} disabled={savingModal}>
            Cancel
          </Button>,
          <Button key="save" type="primary" onClick={handleSaveCriteria} loading={savingModal} disabled={modalTotalWeight !== CRITERIA_TOTAL_WEIGHT}>
            Save Changes
          </Button>,
        ]}
        width={650}
      >
        <div style={{ marginTop: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <span style={{ fontWeight: 600, color: modalTotalWeight === CRITERIA_TOTAL_WEIGHT ? "var(--color-emerald, #10b981)" : "var(--color-rose, #f43f5e)" }}>
              Total Weight: {modalTotalWeight}% {modalTotalWeight === CRITERIA_TOTAL_WEIGHT ? "OK" : `(must equal ${CRITERIA_TOTAL_WEIGHT}%)`}
            </span>
            <Button size="small" type="dashed" onClick={handleAddCriterion} icon={<Plus size={12} />}>
              Add Criterion
            </Button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "400px", overflowY: "auto" }}>
            {editingCriteria.map((c, index) => (
              <div
                key={c.criteriaId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem",
                  background: "var(--color-surface-2, #1e1e30)",
                  border: "1px solid var(--color-border-2, #2d2d44)",
                  borderRadius: "var(--radius-md, 8px)",
                }}
              >
                <Input
                  style={{ flex: 1 }}
                  placeholder="Criterion Name (e.g. Creativity)"
                  value={c.criteriaName}
                  onChange={(e) =>
                    setEditingCriteria(
                      (current) => current.map((x, i) => (i === index ? { ...x, criteriaName: e.target.value } : x))
                    )
                  }
                  disabled={savingModal}
                />
                <InputNumber
                  style={{ width: 80 }}
                  min={0}
                  max={CRITERIA_TOTAL_WEIGHT}
                  formatter={(value) => `${value}%`}
                  parser={(value) => value ? parseInt(value.replace("%", ""), 10) : 0}
                  value={c.weight}
                  onChange={(val) =>
                    setEditingCriteria(
                      (current) => current.map((x, i) => (i === index ? { ...x, weight: val ?? 0 } : x))
                    )
                  }
                  disabled={savingModal}
                />
                <Button
                  type="text"
                  danger
                  onClick={() => handleRemoveCriterion(index, c.criteriaId)}
                  icon={<Trash2 size={16} />}
                  disabled={savingModal}
                />
              </div>
            ))}

            {editingCriteria.length === 0 && (
              <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-3, #718096)", fontStyle: "italic" }}>
                No criteria defined. Click &quot;Add Criterion&quot; to start.
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
