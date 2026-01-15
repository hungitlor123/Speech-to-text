import React, { useEffect, useState } from 'react';
import { Typography, Table, Spin, Empty, Row, Col, Tag, Button, Popconfirm, message, Space, Modal } from 'antd';
import { ManOutlined, WomanOutlined, TeamOutlined, DeleteOutlined, TrophyOutlined, FileTextOutlined } from '@ant-design/icons';

import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, deleteUser } from '@/services/features/userSlice';
import { getTopRecorders, TopRecorder } from '@/services/features/recordingSlice';
import { AppDispatch, RootState } from '@/services/store/store';
import Sidebar from '@/components/Sidebar';

const { Title, Text } = Typography;

const ManagerUsers: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { users, usersLoading, deletingUser } = useSelector((state: RootState) => state.user);
  const [topRecorders, setTopRecorders] = useState<TopRecorder[]>([]);
  const [loadingTopRecorders, setLoadingTopRecorders] = useState(false);
  const [sentencesModalVisible, setSentencesModalVisible] = useState(false);
  const [selectedUserSentences, setSelectedUserSentences] = useState<Array<{ SentenceID: string; Content: string }>>([]);
  const [selectedUserName, setSelectedUserName] = useState('');
  const [contributedSentencesModalVisible, setContributedSentencesModalVisible] = useState(false);
  const [selectedUserContributedSentences, setSelectedUserContributedSentences] = useState<Array<{ SentenceID: string; Content: string; Status: number; CreatedAt: string }>>([]);
  const [selectedContributorName, setSelectedContributorName] = useState('');

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

  const handleShowSentences = (userName: string, sentences?: Array<{ SentenceID: string; Content: string }>) => {
    setSelectedUserName(userName);
    setSelectedUserSentences(sentences || []);
    setSentencesModalVisible(true);
  };

  const handleShowContributedSentences = (userName: string, sentences?: Array<{ SentenceID: string; Content: string; Status: number; CreatedAt: string }>) => {
    setSelectedContributorName(userName);
    setSelectedUserContributedSentences(sentences || []);
    setContributedSentencesModalVisible(true);
  };

  const columns = [
    {
      title: 'STT',
        width: 60,
      key: 'stt',
      render: (_: any, __: any, index: number) => (
        <span className="font-medium text-gray-900">{index + 1}</span>
      ),
    },

    {
      title: 'Email',
      dataIndex: 'Email',
      key: 'Email',
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
      title: 'Số câu đã làm',
      dataIndex: 'TotalSentencesDone',
      key: 'TotalSentencesDone',
      width: 120,
      align: 'center' as const,
      sorter: (a: any, b: any) => (a.TotalSentencesDone || 0) - (b.TotalSentencesDone || 0),
      render: (total: number, record: any) => (
        <Tag 
          color="blue" 
          className="font-medium cursor-pointer hover:opacity-80"
          onClick={() => handleShowSentences(record.Name, record.SentencesDone)}
        >
          {total || 0} câu
        </Tag>
      ),
    },
    {
      title: 'Tổng thời lượng',
      dataIndex: 'TotalRecordingDuration',
      key: 'TotalRecordingDuration',
      width: 140,
      align: 'center' as const,
      sorter: (a: any, b: any) => (a.TotalRecordingDuration || 0) - (b.TotalRecordingDuration || 0),
      render: (duration: number) => (
        <Tag color="green" className="font-medium">
          {duration ? `${duration.toFixed(2)}s` : '0s'}
        </Tag>
      ),
    },
    {
      title: 'Số câu đóng góp',
      dataIndex: 'TotalContributedByUser',
      key: 'TotalContributedByUser',
      width: 130,
      align: 'center' as const,
      sorter: (a: any, b: any) => (a.TotalContributedByUser || 0) - (b.TotalContributedByUser || 0),
      render: (total: number, record: any) => (
        <Tag 
          color="purple" 
          className="font-medium cursor-pointer hover:opacity-80"
          onClick={() => handleShowContributedSentences(record.Name, record.CreatedSentences)}
        >
          {total || 0} câu
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

  const totalUsers = users.length;
  const maleCount = users.filter((u) => u.Gender === 'Male').length;
  const femaleCount = users.filter((u) => u.Gender === 'Female').length;
  const totalSentencesDone = users.reduce((sum, u) => sum + (u.TotalSentencesDone || 0), 0);
  const totalContributedByUsers = users.reduce((sum, u) => sum + (u.TotalContributedByUser || 0), 0);

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

          {/* Statistics Grid (match Dashboard) */}
          <Row gutter={[12, 12]} className="mb-2">
            <Col xs={12} sm={12} md={4} lg={4}>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <Text className="text-xs text-gray-500 font-medium block mb-1">Tổng người dùng</Text>
                    <Text className="text-2xl font-bold text-blue-600">{totalUsers}</Text>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <TeamOutlined className="text-xl text-blue-600" />
                  </div>
                </div>
              </div>
            </Col>

            <Col xs={12} sm={12} md={4} lg={4}>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-green-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <Text className="text-xs text-gray-500 font-medium block mb-1">Nam</Text>
                    <Text className="text-2xl font-bold text-green-600">{maleCount}</Text>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <ManOutlined className="text-xl text-green-600" />
                  </div>
                </div>
              </div>
            </Col>

            <Col xs={12} sm={12} md={4} lg={4}>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-pink-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <Text className="text-xs text-gray-500 font-medium block mb-1">Nữ</Text>
                    <Text className="text-2xl font-bold text-pink-600">{femaleCount}</Text>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-pink-100 flex items-center justify-center">
                    <WomanOutlined className="text-xl text-pink-600" />
                  </div>
                </div>
              </div>
            </Col>

            <Col xs={12} sm={12} md={4} lg={4}>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <Text className="text-xs text-gray-500 font-medium block mb-1">Câu đã làm</Text>
                    <Text className="text-2xl font-bold text-purple-600">{totalSentencesDone}</Text>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <FileTextOutlined className="text-xl text-purple-600" />
                  </div>
                </div>
              </div>
            </Col>

            <Col xs={12} sm={12} md={4} lg={4}>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-amber-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <Text className="text-xs text-gray-500 font-medium block mb-1">Câu đóng góp</Text>
                    <Text className="text-2xl font-bold text-amber-600">{totalContributedByUsers}</Text>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                    <TrophyOutlined className="text-xl text-amber-600" />
                  </div>
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

              {/* Filters UI intentionally omitted to match Admin page */}

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
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-white ${index === 0
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
      {/* Modal hiển thị danh sách câu đã làm */}
      <Modal
        title={`Danh sách câu đã làm - ${selectedUserName}`}
        open={sentencesModalVisible}
        onCancel={() => setSentencesModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setSentencesModalVisible(false)}>
            Đóng
          </Button>
        ]}
        width={800}
      >
        {selectedUserSentences.length > 0 ? (
          <div className="space-y-3">
            {selectedUserSentences.map((sentence, index) => (
              <div 
                key={sentence.SentenceID} 
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium mb-1">{sentence.Content}</p>
                    <p className="text-xs text-gray-500">ID: {sentence.SentenceID}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty description="Chưa có câu nào được hoàn thành" />
        )}
      </Modal>

      {/* Modal hiển thị danh sách câu đóng góp */}
      <Modal
        title={`Danh sách câu đóng góp - ${selectedContributorName}`}
        open={contributedSentencesModalVisible}
        onCancel={() => setContributedSentencesModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setContributedSentencesModalVisible(false)}>
            Đóng
          </Button>
        ]}
        width={800}
      >
        {selectedUserContributedSentences.length > 0 ? (
          <div className="space-y-3">
            {selectedUserContributedSentences.map((sentence, index) => (
              <div 
                key={sentence.SentenceID} 
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-semibold text-sm">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium mb-1">{sentence.Content}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-xs text-gray-500">ID: {sentence.SentenceID}</p>
                      <Tag color={sentence.Status === 1 ? 'green' : sentence.Status === 2 ? 'red' : 'blue'} className="text-xs">
                        {sentence.Status === 1 ? 'Đã duyệt' : sentence.Status === 2 ? 'Từ chối' : 'Chờ duyệt'}
                      </Tag>
                      <span className="text-xs text-gray-400">
                        {new Date(sentence.CreatedAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty description="Chưa có câu nào được đóng góp" />
        )}
      </Modal>
    </div>
  );
};

export default ManagerUsers;
