"use client";
import React, { useState, useEffect } from 'react';
import { Typography, Table, Button, Space, Card, Tag, Input, App } from 'antd';
import { StarOutlined, FileOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { apiRequest } from '@/lib/api';
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;

export default function UserEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await apiRequest<any[]>('/Events');
        const mapped = data.map(ev => ({
          id: ev.eventId,
          name: ev.eventName,
          season: new Date(ev.startDate).getFullYear().toString(),
          status: ev.status === "Ongoing" ? "Active" : ev.status,
          roundsCount: ev.rounds?.length || 0,
          icon: 'star'
        }));
        setEvents(mapped);
      } catch (err) {
        console.error("Tải sự kiện thất bại", err);
      }
    };
    fetchEvents();
  }, []);

  const filteredEvents = events.filter(e => 
    e.name?.toLowerCase().includes(searchText.toLowerCase()) || 
    e.season?.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    { 
      title: 'TÊN SỰ KIỆN', 
      dataIndex: 'name', 
      key: 'name', 
      render: (text: string, record: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ padding: '8px', background: 'var(--color-surface-2)', borderRadius: '6px' }}>
            {record.icon === 'star' ? <StarOutlined style={{color: '#60a5fa'}} /> : <FileOutlined style={{color: '#9ca3af'}} />}
          </div>
          <b>{text}</b>
        </div>
      ) 
    },
    { title: 'MÙA GIẢI', dataIndex: 'season', key: 'season' },
    { 
      title: 'TRẠNG THÁI', 
      dataIndex: 'status', 
      key: 'status',
      render: (text: string) => (
        <Tag color={text === 'Active' ? 'processing' : 'default'} style={{ borderRadius: '12px', padding: '2px 10px' }}>
          {text}
        </Tag>
      )
    },
    { 
      title: 'VÒNG THI', 
      dataIndex: 'roundsCount', 
      key: 'roundsCount',
      render: (text: string) => <b>{text} Vòng thi</b>
    },
    { 
      title: 'THAO TÁC', 
      key: 'actions',
      render: (_: any, record: any) => (
        <Button 
          type="primary" 
          icon={<EyeOutlined />} 
          style={{ borderRadius: '20px' }}
          onClick={() => router.push(`/dashboard/events/${record.id}`)}
        >
          Xem & Tham gia
        </Button>
      )
    }
  ];

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Khám phá Hackathon</Title>
          <Text type="secondary">Duyệt và đăng ký các sự kiện hackathon sắp tới do quản trị viên hệ thống tổ chức.</Text>
        </div>
        <Input 
          placeholder="Tìm kiếm sự kiện..." 
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300, borderRadius: '20px' }}
          prefix={<SearchOutlined />}
        />
      </div>

      <Card variant="borderless" styles={{ body: { padding: 0 } }} style={{ background: 'transparent' }}>
        <Table 
          columns={columns} 
          dataSource={filteredEvents} 
          pagination={{ pageSize: 10 }} 
          rowKey="id" 
        />
      </Card>
    </div>
  );
}
