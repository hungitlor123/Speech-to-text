import React, { useEffect } from 'react';
import { Typography, Table, Spin, Empty, Row, Col, Statistic, Tag } from 'antd';
import { ManOutlined, WomanOutlined, TeamOutlined } from '@ant-design/icons';
import Sidebar from '@/components/Sidebar';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers } from '@/services/features/userSlice';
import { AppDispatch, RootState } from '@/services/store/store';

const { Title, Text } = Typography;

const ManagerUsers: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { users, usersLoading } = useSelector((state: RootState) => state.user);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const columns = [
    
    {
      title: 'Tên',
      dataIndex: 'Name',
      key: 'Name',
      width: 200,
      render: (text: string) => <span className="font-medium text-gray-900">{text}</span>,
    },
    {
      title: 'Giới tính',
      dataIndex: 'Gender',
      key: 'Gender',
      width: 120,
      render: (gender: string) => (
        <Tag color={gender === 'Male' ? 'blue' : 'pink'} className="font-medium">
          {gender === 'Male' ? 'Nam' : 'Nữ'}
        </Tag>
      ),
    },
    {
      title: 'Vai trò',
      dataIndex: 'Role',
      key: 'Role',
      width: 120,
      render: (role: string) => (
        <Tag color={role === 'Admin' ? 'red' : 'green'} className="font-medium">
          {role}
        </Tag>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'CreatedAt',
      key: 'CreatedAt',
      width: 180,
      render: (date: string) => {
        if (!date) return '-';
        return new Date(date).toLocaleString('vi-VN');
      },
    },
  ];

  const maleCount = users.filter((u) => u.Gender === 'Male').length;
  const femaleCount = users.filter((u) => u.Gender === 'Female').length;

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 min-h-screen bg-gray-50 py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-3 py-4">
            <Title 
              level={1} 
              className="!mb-0 !text-4xl md:!text-5xl !font-bold !text-blue-600"
              style={{ letterSpacing: '-0.02em' }}
            >
              Quản Lý Người Dùng
            </Title>
            
          </div>

          {/* Statistics Cards */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8} lg={8}>
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl p-[1px] shadow-md">
                <div className="bg-white rounded-[1rem] p-6">
                  <Statistic
                    title={
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <TeamOutlined className="text-blue-600" />
                        </div>
                        <span className="text-gray-600 font-medium">Tổng người dùng</span>
                      </div>
                    }
                    value={users.length}
                    valueStyle={{ color: '#2563eb', fontSize: '32px', fontWeight: 'bold' }}
                  />
                </div>
              </div>
            </Col>

            <Col xs={24} sm={12} md={8} lg={8}>
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl p-[1px] shadow-md">
                <div className="bg-white rounded-[1rem] p-6">
                  <Statistic
                    title={
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <ManOutlined className="text-blue-600" />
                        </div>
                        <span className="text-gray-600 font-medium">Nam</span>
                      </div>
                    }
                    value={maleCount}
                    valueStyle={{ color: '#2563eb', fontSize: '32px', fontWeight: 'bold' }}
                  />
                </div>
              </div>
            </Col>

            <Col xs={24} sm={12} md={8} lg={8}>
              <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl p-[1px] shadow-md">
                <div className="bg-white rounded-[1rem] p-6">
                  <Statistic
                    title={
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                          <WomanOutlined className="text-pink-600" />
                        </div>
                        <span className="text-gray-600 font-medium">Nữ</span>
                      </div>
                    }
                    value={femaleCount}
                    valueStyle={{ color: '#ec4899', fontSize: '32px', fontWeight: 'bold' }}
                  />
                </div>
              </div>
            </Col>
          </Row>

          {/* Users Table */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="space-y-4">
              <div>
                <Title level={3} className="!text-blue-600 !mb-2">
                  Danh sách người dùng
                </Title>
                <Text className="text-gray-600">
                  Tổng hợp thông tin tất cả người dùng trong hệ thống
                </Text>
              </div>

              {usersLoading ? (
                <div className="flex justify-center py-12">
                  <Spin size="large" />
                </div>
              ) : users.length > 0 ? (
                <Table
                  columns={columns}
                  dataSource={users}
                  rowKey="PersonID"
                  pagination={{ pageSize: 10, responsive: true }}
                  scroll={{ x: 800 }}
                />
              ) : (
                <Empty description="Chưa có người dùng nào" style={{ marginTop: 50 }} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerUsers;
