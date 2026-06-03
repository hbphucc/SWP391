"use client";
import React, { useState, useEffect } from 'react';
import { Typography, Table, Button, Space, Card, Tag, Drawer, Form, Input, App, Modal } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { databaseService } from '../../../services/databaseService';

const { Title, Text } = Typography;

export default function AdminTracksPage() {
  const { message } = App.useApp();
  const [tracks, setTracks] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    setTracks(databaseService.getTracks());
  }, []);

  const showCreateDrawer = () => {
    setIsEditMode(false);
    setEditingId(null);
    form.resetFields();
    setDrawerVisible(true);
  };

  const showEditDrawer = (record: any) => {
    setIsEditMode(true);
    setEditingId(record.id);
    form.setFieldsValue({
      name: record.name,
      desc: record.desc,
      mentor: record.mentor,
      teamsCount: record.teamsCount || 0,
      status: record.status || 'Active'
    });
    setDrawerVisible(true);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this track?',
      onOk: () => {
        databaseService.deleteTrack(id);
        setTracks(databaseService.getTracks());
        databaseService.logAction('Admin', `Deleted track ID ${id}`, 'delete');
        message.success('Track deleted successfully');
      }
    });
  };

  const handleFinish = (values: any) => {
    if (isEditMode) {
      const updatedTrack = { ...tracks.find(t => t.id === editingId), ...values };
      databaseService.updateTrack(updatedTrack);
      databaseService.logAction('Admin', `Updated track ${updatedTrack.name}`, 'edit');
      message.success('Track updated successfully');
    } else {
      const newTrack = { 
        ...values, 
        id: `TRK-${Date.now().toString().slice(-4)}`,
        teamsCount: 0,
        status: values.status || 'Active'
      };
      databaseService.addTrack(newTrack);
      databaseService.logAction('Admin', `Created new track ${newTrack.name}`, 'plus-circle');
      message.success('Track created successfully');
    }
    setTracks(databaseService.getTracks());
    setDrawerVisible(false);
  };

  const filteredTracks = tracks.filter(t => 
    t.name?.toLowerCase().includes(searchText.toLowerCase()) ||
    t.mentor?.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    { 
      title: 'TRACK NAME', 
      dataIndex: 'name', 
      key: 'name',
      render: (text: string) => <b style={{ color: "var(--color-text-1)" }}>{text}</b>
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
            style={{ width: 300, borderRadius: '20px', background: "rgba(15,23,42,0.6)", color: "white", border: "1px solid var(--color-border-1)" }}
            prefix={<SearchOutlined style={{ color: "var(--color-text-3)" }} />}
          />
          <Button type="primary" className="btn btn-primary" icon={<PlusOutlined />} onClick={showCreateDrawer} style={{ borderRadius: '20px' }}>
            Create Track
          </Button>
        </Space>
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
        title={<span style={{ color: "var(--color-text-1)" }}>{isEditMode ? "Edit Track" : "Create New Track"}</span>}
        placement="right"
        width={480}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        drawerStyle={{ background: "var(--color-bg-1)" }}
        headerStyle={{ borderBottom: "1px solid var(--color-border-1)", background: "var(--color-bg-2)" }}
        bodyStyle={{ background: "var(--color-bg-1)" }}
        extra={
          <Space>
            <Button onClick={() => setDrawerVisible(false)} style={{ background: "transparent", color: "var(--color-text-1)", borderColor: "var(--color-border-2)" }}>Cancel</Button>
            <Button type="primary" className="btn btn-primary" onClick={() => form.submit()}>
              {isEditMode ? 'Save Changes' : 'Create Track'}
            </Button>
          </Space>
        }
      >
        <Form layout="vertical" form={form} onFinish={handleFinish}>
          <Form.Item name="name" label={<span style={{ color: "var(--color-text-2)" }}>Track Name</span>} rules={[{ required: true, message: 'Please enter track name' }]}>
            <Input placeholder="e.g., AI & Machine Learning" style={{ background: "rgba(15,23,42,0.6)", color: "white", border: "1px solid var(--color-border-1)" }} />
          </Form.Item>
          
          <Form.Item name="desc" label={<span style={{ color: "var(--color-text-2)" }}>Description</span>}>
            <Input.TextArea rows={3} placeholder="Brief description of this track..." style={{ background: "rgba(15,23,42,0.6)", color: "white", border: "1px solid var(--color-border-1)" }} />
          </Form.Item>

          <Form.Item name="mentor" label={<span style={{ color: "var(--color-text-2)" }}>Assigned Mentor</span>}>
            <Input placeholder="e.g., Dr. Nguyen Van A" style={{ background: "rgba(15,23,42,0.6)", color: "white", border: "1px solid var(--color-border-1)" }} />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
