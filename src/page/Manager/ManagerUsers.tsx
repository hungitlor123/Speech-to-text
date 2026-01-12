import React, { useEffect, useState } from 'react';
import { Typography, Table, Spin, Empty, Row, Col, Statistic, Tag, Button, Popconfirm, message, Space, Input, DatePicker, Select } from 'antd';
import { ManOutlined, WomanOutlined, TeamOutlined, DeleteOutlined, TrophyOutlined, SearchOutlined } from '@ant-design/icons';
import Sidebar from '@/components/Sidebar';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, deleteUser } from '@/services/features/userSlice';
import { getTopRecorders, TopRecorder } from '@/services/features/recordingSlice';
import { AppDispatch, RootState } from '@/services/store/store';
import type { Dayjs } from 'dayjs';

const { Title, Text } = Typography;

const ManagerUsers: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { users, usersLoading, deletingUser } = useSelector((state: RootState) => state.user);
  const [topRecorders, setTopRecorders] = useState<TopRecorder[]>([]);
  const [loadingTopRecorders, setLoadingTopRecorders] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [filterGender, setFilterGender] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState<Dayjs | null>(null);

  useEffect(() => {
    dispatch(fetchUsers());
    fetchTopRecorders();
  }, [dispatch]);

  const fetchTopRecorders = async () => {
    setLoadingTopRecorders(true); 
    try {
      const data = await getTopRecorders({ limit: 6 });
      setTopRecorders(data);
    } catch (error) {
      console.error('Failed to fetch top recorders:', error);
    } finally {
      setLoadingTopRecorders(false);
    }
  };

  const handleDeleteUser = async (personId: string, userName: string) => {
    try {
      await dispatch(deleteUser(personId)).unwrap();
      message.success(`Đã xóa người dùng ${userName} thành công`);
    } catch (error: any) {
      message.error(error.message || 'Không thể xóa người dùng');
    }
  };

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
      title: 'Ngày tạo',
      dataIndex: 'CreatedAt',
      key: 'CreatedAt',
      width: 180,
      render: (date: string) => {
        if (!date) return '-';
        return new Date(date).toLocaleString('vi-VN');
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space>
          <Popconfirm
            title="Xóa người dùng"
            description={`Bạn có chắc chắn muốn xóa người dùng "${record.Name}"?`}
            onConfirm={() => handleDeleteUser(record.PersonID, record.Name)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true, loading: deletingUser }}
          >
            <Button 
              danger 
              icon={<DeleteOutlined />}
              loading={deletingUser}
              size="small"
            >
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const maleCount = users.filter((u) => u.Gender === 'Male').length;
  const femaleCount = users.filter((u) => u.Gender === 'Female').length;

  // Filter data based on search and filter criteria
  const filteredUsers = users.filter((user) => {
    const matchName = user.Name.toLowerCase().includes(searchName.toLowerCase());
    const matchGender = filterGender ? user.Gender === filterGender : true;
    const matchDate = filterDate 
      ? new Date(user.CreatedAt).toDateString() === filterDate.toDate().toDateString() 
      : true;
    
    return matchName && matchGender && matchDate;
  });

  const handleClearFilters = () => {
    setSearchName('');
    setFilterGender(null);
    setFilterDate(null);
  };

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
                
              </div>

              {/* Filter Section */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-700">Bộ lọc:</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <Input
                    placeholder="Tìm kiếm theo tên"
                    prefix={<SearchOutlined />}
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    allowClear
                  />
                  <Select
                    placeholder="Lọc theo giới tính"
                    value={filterGender}
                    onChange={setFilterGender}
                    allowClear
                    options={[
                      { label: 'Nam', value: 'Male' },
                      { label: 'Nữ', value: 'Female' },
                    ]}
                  />
                  <DatePicker
                    placeholder="Lọc theo ngày tạo"
                    value={filterDate}
                    onChange={setFilterDate}
                    format="DD/MM/YYYY"
                  />
                  <Button onClick={handleClearFilters} className="bg-gray-200 hover:bg-gray-300">
                    Xóa bộ lọc
                  </Button>
                </div>
              </div>

              {/* Results Info */}
              <div>
                
              </div>

              {usersLoading ? (
                <div className="flex justify-center py-12">
                  <Spin size="large" />
                </div>
              ) : filteredUsers.length > 0 ? (
                <Table
                  columns={columns}
                  dataSource={filteredUsers}
                  rowKey="PersonID"
                  pagination={{ pageSize: 10, responsive: true }}
                  scroll={{ x: 800 }}
                />
              ) : (
                <Empty description="Không tìm thấy người dùng phù hợp" style={{ marginTop: 50 }} />
              )}
            </div>
          </div>

          {/* Top Recorders */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="space-y-4">
              <div>
                <Title level={3} className="!text-amber-600 !mb-2 flex items-center gap-2">
                  <TrophyOutlined />
                  Top Những Người Ghi Âm
                </Title>
                <Text className="text-gray-600">
                  Danh sách 10 người ghi âm nhiều nhất trong hệ thống
                </Text>
              </div>

              {loadingTopRecorders ? (
                <div className="flex justify-center py-12">
                  <Spin size="large" />
                </div>
              ) : topRecorders.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {topRecorders.map((recorder, index) => (
                    <div
                      key={recorder.userId}
                      className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200 hover:shadow-md transition-shadow"
                    >
                      {/* Rank Badge */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-white ${
                              index === 0
                                ? 'bg-gradient-to-r from-yellow-400 to-yellow-500'
                                : index === 1
                                ? 'bg-gradient-to-r from-gray-400 to-gray-500'
                                : index === 2
                                ? 'bg-gradient-to-r from-orange-400 to-orange-500'
                                : 'bg-gray-400'
                            }`}
                          >
                            {index + 1}
                          </span>
                          <span className="text-xs font-semibold text-amber-700">
                            {index === 0 ? 'Vàng' : index === 1 ? 'Bạc' : index === 2 ? 'Đồng' : `#${index + 1}`}
                          </span>
                        </div>
                      </div>

                      {/* User Info */}
                      <div className="space-y-2">
                        <h4 className="font-bold text-gray-900 text-sm">{recorder.name}</h4>
                        <div className="flex items-center gap-2">
                          <Tag
                            color={recorder.gender === 'Male' ? 'blue' : 'pink'}
                            className="font-medium text-xs"
                          >
                            {recorder.gender === 'Male' ? 'Nam' : 'Nữ'}
                          </Tag>
                        </div>

                        {/* Stats */}
                        <div className="bg-white rounded-lg p-2 space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600">Tổng bản ghi:</span>
                            <span className="font-bold text-amber-600">
                              {recorder.totalRecordings}
                            </span>
                          </div>
                          {recorder.approvedRecordings !== undefined && (
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-600">Đã duyệt:</span>
                              <span className="font-bold text-green-600">
                                {recorder.approvedRecordings}
                              </span>
                            </div>
                          )}
                          {recorder.rejectedRecordings !== undefined && (
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-600">Từ chối:</span>
                              <span className="font-bold text-red-600">
                                {recorder.rejectedRecordings}
                              </span>
                            </div>
                          )}
                          {recorder.pendingRecordings !== undefined && recorder.pendingRecordings > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-600">Chờ duyệt:</span>
                              <span className="font-bold text-blue-600">
                                {recorder.pendingRecordings}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty description="Chưa có dữ liệu ghi âm" style={{ marginTop: 50 }} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerUsers;
