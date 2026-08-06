"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { App, Modal, Table, Button, Input, InputNumber, Select, Popconfirm } from "antd";
import { Plus, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/api";

type CriterionType = "Unspecified" | "Technical" | "Soft";

const CRITERION_TYPE_OPTIONS: { value: CriterionType; label: string }[] = [
  { value: "Unspecified", label: "Unlabelled" },
  { value: "Technical", label: "Technical" },
  { value: "Soft", label: "Soft / subjective" },
];

type CriteriaTemplate = {
  criteriaTemplateId: string;
  criteriaName: string;
  description?: string | null;
  weight: number;
  maxScore: number;
  criterionType: CriterionType;
  displayOrder: number;
};

/**
 * The reusable rubric. Organisers were retyping the same criteria for every
 * hackathon; this keeps one list and copies from it onto a round.
 *
 * Applying copies values rather than linking, so editing a template afterwards
 * never changes a round judges are already marking.
 */
export default function CriteriaTemplateModal({
  open,
  onClose,
  roundId,
  onApplied,
}: {
  open: boolean;
  onClose: () => void;
  /** When set, the modal can copy the selection onto this round. */
  roundId?: string;
  onApplied?: () => void;
}) {
  const { message } = App.useApp();
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftWeight, setDraftWeight] = useState<number>(10);
  const [draftType, setDraftType] = useState<CriterionType>("Unspecified");

  const { data: templates = [], refetch, isLoading } = useQuery({
    queryKey: ["criteria-templates"],
    queryFn: () => apiRequest<CriteriaTemplate[]>("/criteria-templates"),
    enabled: open,
  });

  const createTemplate = async () => {
    const name = draftName.trim();
    if (!name) {
      message.warning("Give the criterion a name.");
      return;
    }
    setBusy(true);
    try {
      await apiRequest("/criteria-templates", {
        method: "POST",
        body: JSON.stringify({
          criteriaName: name,
          weight: draftWeight,
          maxScore: 100,
          criterionType: draftType,
          displayOrder: templates.length + 1,
        }),
      });
      message.success("Template added.");
      setDraftName("");
      await refetch();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not add template.");
    } finally {
      setBusy(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      await apiRequest(`/criteria-templates/${id}`, { method: "DELETE" });
      message.success("Template deleted.");
      setSelected((cur) => cur.filter((x) => x !== id));
      await refetch();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not delete template.");
    }
  };

  const applyToRound = async () => {
    if (!roundId || selected.length === 0) return;
    setBusy(true);
    try {
      const res = await apiRequest<{ message: string }>(`/criteria-templates/apply/${roundId}`, {
        method: "POST",
        body: JSON.stringify({ templateIds: selected, replace: false }),
      });
      message.success(res.message);
      setSelected([]);
      onApplied?.();
      onClose();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not apply templates.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Criteria templates"
      open={open}
      onCancel={onClose}
      width={720}
      footer={
        roundId
          ? [
              <Button key="cancel" onClick={onClose}>Close</Button>,
              <Button key="apply" type="primary" loading={busy} disabled={selected.length === 0} onClick={applyToRound}>
                Add {selected.length || ""} to this round
              </Button>,
            ]
          : [<Button key="cancel" onClick={onClose}>Close</Button>]
      }
    >
      <p style={{ color: "var(--color-text-2)" }}>
        Kept outside any event and reused across hackathons. Adding to a round copies
        the values, so editing a template later never changes a round already in use.
      </p>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <Input
          style={{ flex: "1 1 200px" }}
          placeholder="Criterion name (e.g. Code Quality)"
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onPressEnter={createTemplate}
          disabled={busy}
        />
        <InputNumber
          style={{ width: 90 }}
          min={0}
          max={100}
          value={draftWeight}
          onChange={(v) => setDraftWeight(v ?? 0)}
          formatter={(v) => `${v}%`}
          parser={(v) => (v ? parseInt(v.replace("%", ""), 10) : 0)}
          disabled={busy}
        />
        <Select<CriterionType>
          style={{ width: 170 }}
          value={draftType}
          options={CRITERION_TYPE_OPTIONS}
          onChange={setDraftType}
          disabled={busy}
        />
        <Button icon={<Plus size={14} />} onClick={createTemplate} loading={busy}>
          Add
        </Button>
      </div>

      <Table<CriteriaTemplate>
        size="small"
        rowKey="criteriaTemplateId"
        loading={isLoading}
        dataSource={templates}
        pagination={false}
        locale={{ emptyText: "No templates yet — add the criteria you reuse most." }}
        rowSelection={
          roundId
            ? {
                selectedRowKeys: selected,
                onChange: (keys) => setSelected(keys as string[]),
              }
            : undefined
        }
        columns={[
          { title: "Criterion", dataIndex: "criteriaName", key: "name" },
          { title: "Weight", dataIndex: "weight", key: "weight", render: (w: number) => `${w}%` },
          {
            title: "Type",
            dataIndex: "criterionType",
            key: "type",
            render: (t: CriterionType) =>
              CRITERION_TYPE_OPTIONS.find((o) => o.value === t)?.label ?? t,
          },
          {
            title: "",
            key: "action",
            width: 48,
            render: (_: unknown, record: CriteriaTemplate) => (
              <Popconfirm
                title="Delete this template?"
                description="Rounds already using a copy are unaffected."
                onConfirm={() => deleteTemplate(record.criteriaTemplateId)}
              >
                <Button size="small" type="text" danger icon={<Trash2 size={14} />} />
              </Popconfirm>
            ),
          },
        ]}
      />
    </Modal>
  );
}
