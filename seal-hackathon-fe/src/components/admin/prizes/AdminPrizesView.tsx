"use client";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Typography, Table, Button, Space, Card, Drawer, Form, Input, InputNumber, App, Tag } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import { Lock } from "lucide-react";
import { apiRequest } from "@/lib/api";

const { Text } = Typography;

type PrizeDto = {
  prizeId: string;
  eventId: string;
  eventName: string;
  title: string;
  amount?: string | null;
  track?: string | null;
  description?: string | null;
  rank: number;
};

type PrizeFormValues = {
  title: string;
  amount?: string;
  track?: string;
  rank?: number;
  description?: string;
};

export default function AdminPrizesView({
  eventId,
  eventStatus,
  eventHasStarted,
}: {
  eventId: string;
  eventStatus?: string;
  eventStartDate?: string;
  eventHasStarted?: boolean;
}) {
  const { message, modal } = App.useApp();
  const isLocked = Boolean(
    eventHasStarted ||
    eventStatus === "Ongoing" ||
    eventStatus === "Completed" ||
    eventStatus === "Cancelled"
  );
  const [searchText, setSearchText] = useState("");
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<PrizeFormValues>();

  const {
    data: prizes = [],
    isFetching: loading,
    error,
    refetch: loadPrizes,
  } = useQuery({
    queryKey: ["prizes", eventId],
    queryFn: () => apiRequest<PrizeDto[]>(`/Prizes?eventId=${eventId}`),
    enabled: !!eventId,
  });

  useEffect(() => {
    if (error) message.error(error instanceof Error ? error.message : "Could not load prizes.");
  }, [error, message]);

  const showCreateDrawer = () => {
    if (isLocked) {
      message.error("Cannot create prizes because the event has started.");
      return;
    }
    setIsEditMode(false);
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({ rank: prizes.length + 1 });
    setDrawerVisible(true);
  };

  const showEditDrawer = (record: PrizeDto) => {
    setIsEditMode(true);
    setEditingId(record.prizeId);
    form.setFieldsValue({
      title: record.title,
      amount: record.amount ?? undefined,
      track: record.track ?? undefined,
      rank: record.rank,
      description: record.description ?? undefined,
    });
    setDrawerVisible(true);
  };

  const handleDelete = (record: PrizeDto) => {
    if (isLocked) {
      message.error("Cannot delete prizes because the event has started.");
      return;
    }
    modal.confirm({
      title: `Delete prize "${record.title}"?`,
      okType: "danger",
      onOk: async () => {
        try {
          await apiRequest(`/Prizes/${record.prizeId}`, { method: "DELETE" });
          message.success("Prize deleted successfully.");
          await loadPrizes();
        } catch (err) {
          message.error(err instanceof Error ? err.message : "Could not delete prize.");
        }
      },
    });
  };

  const handleFinish = async (values: PrizeFormValues) => {
    if (!eventId || isLocked) {
      if (isLocked) message.error("Cannot modify prizes because the event has started.");
      else message.error("Select an event first.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: values.title.trim(),
        amount: values.amount?.trim() || null,
        track: values.track?.trim() || null,
        description: values.description?.trim() || null,
        rank: values.rank ?? 0,
      };

      if (isEditMode && editingId) {
        await apiRequest(`/Prizes/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        message.success("Prize updated successfully.");
      } else {
        await apiRequest("/Prizes", {
          method: "POST",
          body: JSON.stringify({ ...payload, eventId }),
        });
        message.success("Prize created successfully.");
      }

      setDrawerVisible(false);
      await loadPrizes();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not save prize.");
    } finally {
      setSaving(false);
    }
  };

  const filteredPrizes = prizes.filter((p) =>
    p.title?.toLowerCase().includes(searchText.toLowerCase()) ||
    (p.track ?? "").toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: "RANK",
      dataIndex: "rank",
      key: "rank",
      width: 80,
      sorter: (a: PrizeDto, b: PrizeDto) => a.rank - b.rank,
      defaultSortOrder: "ascend" as const,
      render: (rank: number) => <Tag color="gold">#{rank}</Tag>,
    },
    { title: "TITLE", dataIndex: "title", key: "title", render: (text: string) => <b>{text}</b> },
    { title: "AMOUNT", dataIndex: "amount", key: "amount", render: (a?: string | null) => a || <Text type="secondary">—</Text> },
    { title: "TRACK", dataIndex: "track", key: "track", render: (t?: string | null) => t || <Text type="secondary">—</Text> },
    {
      title: "ACTIONS",
      key: "actions",
      width: 110,
      render: (_: unknown, record: PrizeDto) => (
        <Space>
          <Button type="text" aria-label={`Edit prize ${record.title}`} icon={<EditOutlined />} onClick={() => showEditDrawer(record)} disabled={isLocked} />
          <Button type="text" danger aria-label={`Delete prize ${record.title}`} icon={<DeleteOutlined />} onClick={() => handleDelete(record)} disabled={isLocked} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      {isLocked && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem 1rem",
            marginBottom: "1.25rem",
            background: "rgba(245, 158, 11, 0.1)",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            borderRadius: "var(--radius-md, 8px)",
            color: "var(--color-amber, #f59e0b)",
            fontSize: "0.875rem",
          }}
        >
          <Lock size={16} />
          <span>
            <strong>Prizes Locked:</strong> This event has already started. Prize configuration (create, edit, delete) is locked during or after the event.
          </span>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
        <Input
          placeholder="Search prizes..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 260, borderRadius: "20px" }}
          prefix={<SearchOutlined />}
        />
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={() => loadPrizes()} disabled={!eventId || loading} />
          <Button type="primary" icon={<PlusOutlined />} onClick={showCreateDrawer} style={{ borderRadius: "20px" }} disabled={!eventId || isLocked}>
            Create Prize
          </Button>
        </Space>
      </div>

      <Card variant="borderless" styles={{ body: { padding: 0 } }} style={{ background: "transparent" }}>
        <Table
          className="custom-antd-table"
          columns={columns}
          dataSource={filteredPrizes}
          pagination={{ pageSize: 10 }}
          rowKey="prizeId"
          loading={loading}
          locale={{ emptyText: eventId ? "No prizes for this event yet." : "Select an event first." }}
        />
      </Card>

      <Drawer
        title={isEditMode ? "Edit Prize" : "Create New Prize"}
        placement="right"
        styles={{ wrapper: { width: 480 } }}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        extra={
          <Space>
            <Button onClick={() => setDrawerVisible(false)}>Cancel</Button>
            <Button type="primary" loading={saving} onClick={() => form.submit()} disabled={isLocked}>
              {isEditMode ? "Save Changes" : "Create Prize"}
            </Button>
          </Space>
        }
      >
        <Form layout="vertical" form={form} onFinish={handleFinish}>
          <Form.Item name="title" label="Prize Title" rules={[{ required: true, message: "Please enter a prize title" }]}>
            <Input placeholder="e.g., Grand Prize" disabled={isLocked} />
          </Form.Item>

          <Form.Item name="amount" label="Amount">
            <Input placeholder="e.g., $10,000" disabled={isLocked} />
          </Form.Item>

          <Form.Item name="track" label="Track / Category">
            <Input placeholder="e.g., All Tracks or AI & Machine Learning" disabled={isLocked} />
          </Form.Item>

          <Form.Item name="rank" label="Rank" tooltip="Lower number shows first (1 = top prize).">
            <InputNumber min={0} style={{ width: "100%" }} placeholder="1" disabled={isLocked} />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="What this prize is awarded for..." disabled={isLocked} />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
