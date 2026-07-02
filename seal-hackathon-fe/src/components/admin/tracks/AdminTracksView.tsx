"use client";
import React, { useEffect, useState } from "react";
import { Table, Button, Space, Card, Drawer, Form, Input, App } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import { apiRequest } from "@/lib/api";

type CategoryDto = {
  categoryId: string;
  categoryName: string;
  description?: string | null;
};

export default function AdminTracksView({ eventId }: { eventId: string }) {
  const { message, modal } = App.useApp();
  const [tracks, setTracks] = useState<CategoryDto[]>([]);
  const [searchText, setSearchText] = useState("");
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const loadTracks = async () => {
    if (!eventId) {
      setTracks([]);
      return;
    }
    setLoading(true);
    try {
      setTracks(await apiRequest<CategoryDto[]>(`/events/${eventId}/categories`));
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not load categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!eventId) return;
    let active = true;
    apiRequest<CategoryDto[]>(`/events/${eventId}/categories`)
      .then((data) => { if (active) setTracks(data); })
      .catch((err) => { if (active) message.error(err instanceof Error ? err.message : "Could not load categories."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [eventId, message]);

  const showCreateDrawer = () => {
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
    if (!eventId) return;
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
    if (!eventId) {
      message.error("Select an event first.");
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
          <Button type="text" aria-label={`Edit track ${record.categoryName}`} icon={<EditOutlined />} onClick={() => showEditDrawer(record)} />
          <Button type="text" danger aria-label={`Delete track ${record.categoryName}`} icon={<DeleteOutlined />} onClick={() => handleDelete(record.categoryId)} />
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
        <Input
          placeholder="Search tracks..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 260, borderRadius: "20px" }}
          prefix={<SearchOutlined />}
        />
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={loadTracks} disabled={!eventId || loading} />
          <Button type="primary" icon={<PlusOutlined />} onClick={showCreateDrawer} style={{ borderRadius: "20px" }} disabled={!eventId}>
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
            <Button type="primary" loading={saving} onClick={() => form.submit()}>
              {isEditMode ? "Save Changes" : "Create Track"}
            </Button>
          </Space>
        }
      >
        <Form layout="vertical" form={form} onFinish={handleFinish}>
          <Form.Item name="categoryName" label="Track Name" rules={[{ required: true, message: "Please enter track name" }]}>
            <Input placeholder="e.g., AI & Machine Learning" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Brief description of this track..." />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
