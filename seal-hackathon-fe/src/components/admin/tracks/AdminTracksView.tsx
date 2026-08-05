"use client";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Table, Button, Space, Card, Drawer, Form, Input, App } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import { Lock } from "lucide-react";
import { apiRequest } from "@/lib/api";

type CategoryDto = {
  categoryId: string;
  categoryName: string;
  description?: string | null;
};

export default function AdminTracksView({
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
  const [form] = Form.useForm();

  // Shares the ["event-categories", eventId] cache with the user-facing tracks
  // page, so a CRUD refetch here also freshens that view.
  const {
    data: tracks = [],
    isFetching: loading,
    error,
    refetch: loadTracks,
  } = useQuery({
    queryKey: ["event-categories", eventId],
    queryFn: () => apiRequest<CategoryDto[]>(`/events/${eventId}/categories`),
    enabled: !!eventId,
  });

  useEffect(() => {
    if (error) message.error(error instanceof Error ? error.message : "Could not load categories.");
  }, [error, message]);

  const showCreateDrawer = () => {
    if (isLocked) {
      message.error("Cannot create tracks because the event has started.");
      return;
    }
    setIsEditMode(false);
    setEditingId(null);
    form.resetFields();
    setDrawerVisible(true);
  };

  const showEditDrawer = (record: CategoryDto) => {
    setIsEditMode(true);
    setEditingId(record.categoryId);
    form.setFieldsValue({
      categoryName: record.categoryName,
      description: record.description,
    });
    setDrawerVisible(true);
  };

  const handleDelete = (id: string) => {
    if (!eventId || isLocked) {
      if (isLocked) message.error("Cannot delete track because the event has started.");
      return;
    }
    modal.confirm({
      title: "Are you sure you want to delete this track?",
      onOk: async () => {
        try {
          await apiRequest(`/events/${eventId}/categories/${id}`, { method: "DELETE" });
          message.success("Track deleted successfully.");
          await loadTracks();
        } catch (err) {
          message.error(err instanceof Error ? err.message : "Could not delete track.");
        }
      },
    });
  };

  const handleFinish = async (values: { categoryName: string; description?: string }) => {
    if (!eventId || isLocked) {
      if (isLocked) message.error("Cannot modify tracks because the event has started.");
      else message.error("Select an event first.");
      return;
    }
    setSaving(true);
    try {
      if (isEditMode && editingId) {
        await apiRequest(`/events/${eventId}/categories/${editingId}`, {
          method: "PUT",
          body: JSON.stringify({
            categoryName: values.categoryName.trim(),
            description: values.description?.trim() || null,
          }),
        });
        message.success("Track updated successfully.");
      } else {
        await apiRequest(`/events/${eventId}/categories`, {
          method: "POST",
          body: JSON.stringify({
            categoryName: values.categoryName.trim(),
            description: values.description?.trim() || null,
          }),
        });
        message.success("Track created successfully.");
      }
      setDrawerVisible(false);
      await loadTracks();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not save track.");
    } finally {
      setSaving(false);
    }
  };

  const filteredTracks = tracks.filter(t =>
    t.categoryName?.toLowerCase().includes(searchText.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: "TRACK NAME",
      dataIndex: "categoryName",
      key: "categoryName",
      render: (text: string) => <b>{text}</b>
    },
    { title: "DESCRIPTION", dataIndex: "description", key: "description", ellipsis: true },
    {
      title: "ACTIONS",
      key: "actions",
      render: (_: unknown, record: CategoryDto) => (
        <Space>
          <Button type="text" aria-label={`Edit track ${record.categoryName}`} icon={<EditOutlined />} onClick={() => showEditDrawer(record)} disabled={isLocked} />
          <Button type="text" danger aria-label={`Delete track ${record.categoryName}`} icon={<DeleteOutlined />} onClick={() => handleDelete(record.categoryId)} disabled={isLocked} />
        </Space>
      )
    }
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
            <strong>Tracks Locked:</strong> This event has already started. Track configuration (create, edit, delete) is locked during or after the event.
          </span>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
        <Input
          placeholder="Search tracks..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 260, borderRadius: "20px" }}
          prefix={<SearchOutlined />}
        />
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={() => loadTracks()} disabled={!eventId || loading} />
          <Button type="primary" icon={<PlusOutlined />} onClick={showCreateDrawer} style={{ borderRadius: "20px" }} disabled={!eventId || isLocked}>
            Create Track
          </Button>
        </Space>
      </div>

      <Card variant="borderless" styles={{ body: { padding: 0 } }} style={{ background: "transparent" }}>
        <Table
          className="custom-antd-table"
          columns={columns}
          dataSource={filteredTracks}
          pagination={{ pageSize: 10 }}
          rowKey="categoryId"
          loading={loading}
          locale={{ emptyText: eventId ? "No tracks found for this event." : "Select an event first." }}
        />
      </Card>

      <Drawer
        title={isEditMode ? "Edit Track" : "Create New Track"}
        placement="right"
        styles={{ wrapper: { width: 480 } }}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        extra={
          <Space>
            <Button onClick={() => setDrawerVisible(false)} disabled={saving}>Cancel</Button>
            <Button type="primary" loading={saving} onClick={() => form.submit()} disabled={isLocked}>
              {isEditMode ? "Save Changes" : "Create Track"}
            </Button>
          </Space>
        }
      >
        <Form layout="vertical" form={form} onFinish={handleFinish}>
          <Form.Item name="categoryName" label="Track Name" rules={[{ required: true, message: "Please enter track name" }]}>
            <Input placeholder="e.g., AI & Machine Learning" disabled={isLocked} />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Brief description of this track..." disabled={isLocked} />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
