"use client";
import React, { useState, useEffect } from 'react';
import { Typography, Table, Button, Space, Card, Tag, Input, App } from 'antd';
import { StarOutlined, FileOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { databaseService } from '../../../services/databaseService';
import Link from 'next/link';

const { Title, Text } = Typography;

export default function UserEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    setEvents(databaseService.getEvents());
  }, []);

  const filteredEvents = events.filter(e => 
    e.name?.toLowerCase().includes(searchText.toLowerCase()) || 
    e.season?.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    { 
      title: 'EVENT NAME', 
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
    { title: 'SEASON', dataIndex: 'season', key: 'season' },
    { 
      title: 'STATUS', 
      dataIndex: 'status', 
      key: 'status',
      render: (text: string) => (
        <Tag color={text === 'Active' ? 'processing' : 'default'} style={{ borderRadius: '12px', padding: '2px 10px' }}>
          {text}
        </Tag>
      )
    },
    { 
      title: 'ROUNDS', 
      dataIndex: 'roundsCount', 
      key: 'roundsCount',
      render: (text: string) => <b>{text} Rounds</b>
    },
    { 
      title: 'ACTIONS', 
      key: 'actions',
      render: (_: any, record: any) => (
        <Link href={`/dashboard/events/${record.id}`}>
          <Button type="primary" icon={<EyeOutlined />} style={{ borderRadius: '20px' }}>View & Participate</Button>
        </Link>
      )
    }
  ];

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Discover Hackathons</Title>
          <Text type="secondary">Browse and register for upcoming hackathon events organized by the system admin.</Text>
        </div>
        <Input 
          placeholder="Search events..." 
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
