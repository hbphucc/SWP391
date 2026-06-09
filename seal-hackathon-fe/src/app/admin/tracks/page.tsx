"use client";
import React, { useState, useEffect } from 'react';
import { Typography, Table, Button, Space, Card, Tag, Drawer, Form, Input, App, Modal } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { apiRequest } from '@/lib/api';

const { Title, Text } = Typography;

export default function AdminTracksPage() {
  const { message } = App.useApp();
  const [tracks, setTracks] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      loadTracks(selectedEventId);
    } else {
      setTracks([]);
    }
  }, [selectedEventId]);

  const loadEvents = async () => {
    try {
      const evts = await apiRequest<any[]>("/Events");
      setEvents(evts);
      if (evts.length > 0) {
        setSelectedEventId(evts[0].eventId);
      }
    } catch (err) {
      message.error("Failed to load events.");
    }
  };

  const loadTracks = async (eventId: string) => {
    setLoading(true);
    try {
      const data = await apiRequest<any[]>(`/events/${eventId}/categories`);
      setTracks(data.map((c: any) => ({
        id: c.categoryId,
        name: c.categoryName,
        desc: c.description,
        mentor: null, // Mentor mapping is not in the Category entity
        teamsCount: 0 // Teams count not returned directly in Category
      })));
    } catch (err) {
      message.error("Failed to load tracks.");
    } finally {
      setLoading(false);
    }
  };

  const showCreateDrawer = () => {
    if (!selectedEventId) return message.warning("Please select an event first.");
    setIsEditMode(false);
    setEditingId(null);
    form.resetFields();
    setDrawerVisible(true);
  };

  const showEditDrawer = (record: any) => {
    setIsEditMode(true);
    setEditingId(record.id);
    form.setFieldsValue({
      categoryName: record.name,
      description: record.desc
    });
    setDrawerVisible(true);
  };

  const handleDelete = (id: string) => {
    if (!selectedEventId) return;
    Modal.confirm({
      title: 'Are you sure you want to delete this track?',
      onOk: async () => {
        try {
          await apiRequest(`/events/${selectedEventId}/categories/${id}`, { method: "DELETE" });
          message.success('Track deleted successfully');
          loadTracks(selectedEventId);
        } catch (err: any) {
          message.error(err.message || "Failed to delete track");
        }
      }
    });
  };

  const handleFinish = async (values: any) => {
    if (!selectedEventId) return;
    try {
      if (isEditMode && editingId) {
        await apiRequest(`/events/${selectedEventId}/categories/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(values)
        });
        message.success('Track updated successfully');
      } else {
        await apiRequest(`/events/${selectedEventId}/categories`, {
          method: "POST",
          body: JSON.stringify(values)
        });
        message.success('Track created successfully');
      }
      setDrawerVisible(false);
      loadTracks(selectedEventId);
    } catch (err: any) {
      message.error(err.message || "Operation failed");
    }
  };

  const filteredTracks = tracks.filter(t => 
    (t.name?.toLowerCase() || '').includes(searchText.toLowerCase()) ||
    (t.desc?.toLowerCase() || '').includes(searchText.toLowerCase()) ||
    (t.mentor?.toLowerCase() || '').includes(searchText.toLowerCase())
  );

  const columns = [
    { 
      title: 'TRACK NAME', 
      dataIndex: 'name', 
      key: 'name',
      render: (text: string) => <b style={{ color: "var(--color-text)" }}>{text}</b>
    },
    { title: 'DESCRIPTION', dataIndex: 'desc', key: 'desc', ellipsis: true },
    { title: 'MENTOR', dataIndex: 'mentor', key: 'mentor', render: (text: string) => text || <Text type="secondary">Unassigned</Text> },
    { title: 'TEAMS', dataIndex: 'teamsCount', key: 'teamsCount', render: (val: number) => <Tag color="blue">{val || 0} Teams</Tag> },
    { 
      title: 'ACTIONS', 
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => showEditDrawer(record)} style={{ color: "var(--color-primary)" }} />
          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
        </Space>
      )
    }
  ];

  return (
    <div style={{ maxWidth: 1100, overflow: 'hidden' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">Track Management</h1>
          <p className="page-subtitle">Manage competition tracks, categories, and assign mentors.</p>
        </div>
        <Space>
          <Input 
            placeholder="Search tracks or mentors..." 
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300, borderRadius: '20px', border: "1px solid var(--color-border)" }}
            prefix={<SearchOutlined style={{ color: "var(--color-text-3)" }} />}
          />
          <Button type="primary" className="btn btn-primary" icon={<PlusOutlined />} onClick={showCreateDrawer} style={{ borderRadius: '20px' }}>
            Create Track
          </Button>
        </Space>
      </div>

      <div className="glass-card" style={{ padding: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <b style={{ color: "var(--color-text)" }}>Selected Event:</b>
        <select 
          className="form-select" 
          value={selectedEventId || ""} 
          onChange={e => setSelectedEventId(e.target.value)} 
          style={{ width: 300 }}
        >
          {events.map(e => (
            <option key={e.eventId} value={e.eventId}>{e.eventName}</option>
          ))}
        </select>
      </div>

      <div className="glass-card" style={{ padding: 0 }}>
        <Table 
          columns={columns} 
          dataSource={filteredTracks} 
          pagination={{ pageSize: 10 }} 
          rowKey="id"
          style={{ background: 'transparent' }}
          className="custom-antd-table"
        />
      </div>

      <Drawer
        title={<span style={{ color: "var(--color-text)" }}>{isEditMode ? "Edit Track" : "Create New Track"}</span>}
        placement="right"
        width={480}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        drawerStyle={{ background: "var(--color-bg)" }}
        headerStyle={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-bg-2)" }}
        bodyStyle={{ background: "var(--color-bg)" }}
        extra={
          <Space>
            <Button onClick={() => setDrawerVisible(false)} style={{ background: "transparent", color: "var(--color-text)", borderColor: "var(--color-border-2)" }}>Cancel</Button>
            <Button type="primary" className="btn btn-primary" onClick={() => form.submit()}>
              {isEditMode ? 'Save Changes' : 'Create Track'}
            </Button>
          </Space>
        }
      >
        <Form layout="vertical" form={form} onFinish={handleFinish}>
          {!isEditMode && (
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-3)', display: 'block', marginBottom: 8 }}>Suggestions:</span>
              <Space size={[0, 8]} wrap>
                {["AI & Machine Learning", "Web Development", "Mobile App", "Cybersecurity", "Game Design", "Open Innovation"].map(track => (
                  <Tag 
                    key={track} 
                    style={{ cursor: 'pointer', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-2)' }}
                    onClick={() => form.setFieldsValue({ categoryName: track })}
                  >
                    {track}
                  </Tag>
                ))}
              </Space>
            </div>
          )}
          <Form.Item name="categoryName" label={<span style={{ color: "var(--color-text-2)" }}>Track Name</span>} rules={[{ required: true, message: 'Please enter track name' }]}>
            <Input placeholder="e.g., AI & Machine Learning" style={{ border: "1px solid var(--color-border)" }} />
          </Form.Item>
          
          <Form.Item name="description" label={<span style={{ color: "var(--color-text-2)" }}>Description</span>}>
            <Input.TextArea rows={3} placeholder="Brief description of this track..." style={{ border: "1px solid var(--color-border)" }} />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
