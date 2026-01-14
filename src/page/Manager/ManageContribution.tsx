import React, { useEffect, useState } from 'react';
import { Typography, Table, Spin, Empty, Card, Row, Col, Statistic, Avatar } from 'antd';
import { TrophyOutlined, UserOutlined, AudioOutlined, FileTextOutlined, CrownOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import SidebarManager from '@/components/SidebarManager';
import { fetchTopContributors, TopContributor } from '@/services/features/userSlice';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/services/store/store';

const { Title, Text } = Typography;

const ManageContribution: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [topContributors, setTopContributors] = useState<TopContributor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTopContributors();
  }, []);

  const loadTopContributors = async () => {
    setLoading(true);
    try {
      const result = await dispatch(fetchTopContributors()).unwrap();
      setTopContributors(result);
    } catch (error) {
      console.error('Failed to fetch top contributors:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
          title: 'Hạng',
          key: 'rank',
          width: 120,
          render: (_: unknown, __: TopContributor, index: number) => {
            return (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-white ${
                      index === 0
                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-500'
                        : index === 1
                        ? 'bg-gradient-to-r from-gray-400 to-gray-500'
                        : index === 2
                        ? 'bg-gradient-to-r from-orange-400 to-orange-500'
                        : 'bg-blue-400'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span className="text-xs font-semibold text-amber-700">
                    {index === 0 ? 'Vàng' : index === 1 ? 'Bạc' : index === 2 ? 'Đồng' : `#${index + 1}`}
                  </span>
                </div>
              </div>
            );
          },
        },
    {
      title: 'Người dùng',
      dataIndex: 'userName',
      key: 'userName',
      width: 250,
      render: (name: string, record: TopContributor) => (
        <div className="flex items-center gap-3">
          <Avatar
            size={48}
            icon={<UserOutlined />}
            style={{
              backgroundColor: '#1890ff',
              fontSize: '20px'
            }}
          />
          <div>
            <div className="font-semibold text-base text-gray-900">{name || 'Ẩn danh'}</div>
            <div className="text-sm text-gray-500">
              {record.createdAt ? new Date(record.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Số câu đóng góp',
      dataIndex: 'totalSentences',
      key: 'totalSentences',
      width: 200,
      sorter: (a: TopContributor, b: TopContributor) => a.totalSentences - b.totalSentences,
      render: (count: number | undefined) => (
        <div className="flex items-center gap-2">
          <FileTextOutlined style={{ fontSize: '18px', color: '#52c41a' }} />
          <Text strong style={{ fontSize: '16px', color: '#52c41a' }}>{(count || 0).toLocaleString()}</Text>
        </div>
      ),
    },
    {
      title: 'Đã duyệt',
      dataIndex: 'status1Count',
      key: 'status1Count',
      width: 150,
      sorter: (a: TopContributor, b: TopContributor) => a.status1Count - b.status1Count,
      render: (count: number | undefined) => (
        <div className="flex items-center gap-2">
          <CheckCircleOutlined style={{ fontSize: '18px', color: '#52c41a' }} />
          <Text strong style={{ fontSize: '16px', color: '#52c41a' }}>{(count || 0).toLocaleString()}</Text>
        </div>
      ),
    },
    {
      title: 'Từ chối',
      dataIndex: 'status3Count',
      key: 'status3Count',
      width: 150,
      sorter: (a: TopContributor, b: TopContributor) => a.status3Count - b.status3Count,
      render: (count: number | undefined) => (
        <div className="flex items-center gap-2">
          <CloseCircleOutlined style={{ fontSize: '18px', color: '#f5222d' }} />
          <Text strong style={{ fontSize: '16px', color: '#f5222d' }}>{(count || 0).toLocaleString()}</Text>
        </div>
      ),
    },
    {
      title: 'Tổng đóng góp',
      key: 'total',
      width: 200,
      sorter: (a: TopContributor, b: TopContributor) =>
        (a.totalSentences) - (b.totalSentences),
      render: (_: unknown, record: TopContributor) => {
        const total = (record?.totalSentences || 0);
        return (
          <div className="flex items-center gap-2">
            <TrophyOutlined style={{ fontSize: '18px', color: '#faad14' }} />
            <Text strong style={{ fontSize: '16px', color: '#faad14' }}>{total.toLocaleString()}</Text>
          </div>
        );
      },
    },
  ];

  const topThree = Array.isArray(topContributors) ? topContributors.slice(0, 3) : [];
  const totalSentences = Array.isArray(topContributors) ? topContributors.reduce((sum, c) => sum + c.totalSentences, 0) : 0;
  const totalRecordings = Array.isArray(topContributors) ? topContributors.reduce((sum, c) => sum + c.status1Count, 0) : 0;

  return (
    <div className="flex">
      <SidebarManager />
      <div className="flex-1 min-h-screen bg-gray-50 py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-3 py-4">
            <div className="flex items-center justify-center gap-3">
              <TrophyOutlined style={{ fontSize: '48px', color: '#faad14' }} />
              <Title
                level={1}
                className="!mb-0 !text-4xl md:!text-5xl !font-bold !text-blue-600"
                style={{ letterSpacing: '-0.02em' }}
              >
                Top Người Đóng Góp
              </Title>
            </div>

          </div>

          {/* Top 3 Podium */}
          {!loading && Array.isArray(topThree) && topThree.length >= 3 && (
            <Row gutter={[16, 16]} className="mb-8">
              {/* Second Place */}
              <Col xs={24} md={8}>
                <Card
                  className="text-center shadow-lg hover:shadow-xl transition-shadow"
                  style={{
                    borderTop: '4px solid #C0C0C0',
                    background: 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)'
                  }}
                >
                  <div className="flex flex-col items-center gap-1.5 py-2">
                    <TrophyOutlined style={{ fontSize: '28px', color: '#C0C0C0' }} />
                    <Avatar
                      size={56}
                      icon={<UserOutlined />}
                      style={{
                        backgroundColor: '#1890ff',
                        fontSize: '22px'
                      }}
                    />
                    <div className="text-center">
                      <Text strong style={{ fontSize: '14px' }}>{topThree[1]?.userName || '-'}</Text>
                      <div className="text-lg font-bold text-gray-700 mt-1">
                        {((topThree[1]?.totalSentences || 0)).toLocaleString()}
                      </div>
                      <Text className="text-xs text-gray-500">Tổng đóng góp</Text>
                    </div>
                  </div>
                </Card>
              </Col>

              {/* First Place */}
              <Col xs={24} md={8}>
                <Card
                  className="text-center shadow-xl hover:shadow-2xl transition-shadow"
                  style={{
                    borderTop: '4px solid #FFD700',
                    background: 'linear-gradient(135deg, #fffbeb 0%, #ffffff 100%)',
                    transform: 'scale(1.05)'
                  }}
                >
                  <div className="flex flex-col items-center gap-1.5 py-2">
                    <CrownOutlined style={{ fontSize: '34px', color: '#FFD700' }} />
                    <Avatar
                      size={68}
                      icon={<UserOutlined />}
                      style={{
                        backgroundColor: '#1890ff',
                        fontSize: '26px',
                        border: '2px solid #FFD700'
                      }}
                    />
                    <div className="text-center">
                      <Text strong style={{ fontSize: '16px', color: '#FFD700' }}>{topThree[0]?.userName || '-'}</Text>
                      <div className="text-xl font-bold text-yellow-600 mt-1">
                        {((topThree[0]?.totalSentences || 0)).toLocaleString()}
                      </div>
                      <Text className="text-xs text-gray-500">Tổng đóng góp</Text>
                    </div>
                  </div>
                </Card>
              </Col>

              {/* Third Place */}
              <Col xs={24} md={8}>
                <Card
                  className="text-center shadow-lg hover:shadow-xl transition-shadow"
                  style={{
                    borderTop: '4px solid #CD7F32',
                    background: 'linear-gradient(135deg, #fef3e8 0%, #ffffff 100%)'
                  }}
                >
                  <div className="flex flex-col items-center gap-1.5 py-2">
                    <TrophyOutlined style={{ fontSize: '28px', color: '#CD7F32' }} />
                    <Avatar
                      size={56}
                      icon={<UserOutlined />}
                      style={{
                        backgroundColor: '#1890ff',
                        fontSize: '22px'
                      }}
                    />
                    <div className="text-center">
                      <Text strong style={{ fontSize: '14px' }}>{topThree[2]?.userName || '-'}</Text>
                      <div className="text-lg font-bold text-orange-700 mt-1">
                        {((topThree[2]?.totalSentences || 0)).toLocaleString()}
                      </div>
                      <Text className="text-xs text-gray-500">Tổng đóng góp</Text>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
          )}

          {/* Statistics Cards */}
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl p-[1px] shadow-md">
                <div className="bg-white rounded-[1rem] p-6">
                  <Statistic
                    title={
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <UserOutlined className="text-blue-600" />
                        </div>
                        <span className="text-gray-600 font-medium">Tổng người đóng góp</span>
                      </div>
                    }
                    value={topContributors.length}
                    valueStyle={{ color: '#2563eb', fontSize: '32px', fontWeight: 'bold' }}
                  />
                </div>
              </div>
            </Col>

            <Col xs={24} sm={8}>
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-[1px] shadow-md">
                <div className="bg-white rounded-[1rem] p-6">
                  <Statistic
                    title={
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                          <FileTextOutlined className="text-green-600" />
                        </div>
                        <span className="text-gray-600 font-medium">Tổng câu đóng góp</span>
                      </div>
                    }
                    value={totalSentences}
                    valueStyle={{ color: '#16a34a', fontSize: '32px', fontWeight: 'bold' }}
                  />
                </div>
              </div>
            </Col>

            <Col xs={24} sm={8}>
              <div className="bg-gradient-to-r from-purple-500 to-violet-500 rounded-2xl p-[1px] shadow-md">
                <div className="bg-white rounded-[1rem] p-6">
                  <Statistic
                    title={
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                          <AudioOutlined className="text-purple-600" />
                        </div>
                        <span className="text-gray-600 font-medium">Tổng bản ghi âm</span>
                      </div>
                    }
                    value={totalRecordings}
                    valueStyle={{ color: '#9333ea', fontSize: '32px', fontWeight: 'bold' }}
                  />
                </div>
              </div>
            </Col>
          </Row>

          {/* Top Contributors Table */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="mb-4">
              <Title level={3} className="!mb-2">
                <TrophyOutlined className="mr-2" />
                Bảng xếp hạng
              </Title>

            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Spin size="large" />
              </div>
            ) : topContributors.length > 0 ? (
              <Table
                columns={columns}
                dataSource={topContributors}
                rowKey={(record) => record.userId || record.userName}
                pagination={{
                  pageSize: 20,
                  responsive: true,
                  showTotal: (total) => `Tổng ${total} người dùng`
                }}
                scroll={{ x: 800 }}
                rowClassName={(_, index) => {
                  if (index === 0) return 'bg-yellow-50';
                  if (index === 1) return 'bg-gray-50';
                  if (index === 2) return 'bg-orange-50';
                  return '';
                }}
              />
            ) : (
              <Empty description="Chưa có dữ liệu đóng góp" style={{ marginTop: 50 }} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageContribution;
