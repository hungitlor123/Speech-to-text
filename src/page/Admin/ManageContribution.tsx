import React, { useEffect, useState } from 'react';
import { Typography, Table, Spin, Empty, Row, Col } from 'antd';
import { TrophyOutlined, UserOutlined, FileTextOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import Sidebar from '@/components/Sidebar';
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
              
            </div>
          </div>
        );
      },
    },
    {
      title: 'Email ',
      dataIndex: 'userEmail',
      key: 'userEmail',
      width: 250,
      render: (userEmail: string, record: TopContributor) => (
        <div className="flex items-center gap-3">
          
          
          <div>
            <div className="font-semibold text-base text-gray-900 break-all">{userEmail || 'Ẩn danh'}</div>
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
      sorter: (a: TopContributor, b: TopContributor) => (a.totalSentences || 0) - (b.totalSentences || 0),
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
      sorter: (a: TopContributor, b: TopContributor) => (a.status1Count || 0) - (b.status1Count || 0),
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
      sorter: (a: TopContributor, b: TopContributor) => (a.status3Count || 0) - (b.status3Count || 0),
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
        (a.totalSentences || 0) - (b.totalSentences || 0),
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

  const totalSentences = Array.isArray(topContributors) ? topContributors.reduce((sum, c) => sum + (c.totalSentences || 0), 0) : 0;
  const approvedCount = Array.isArray(topContributors) ? topContributors.reduce((sum, c) => sum + (c.status1Count || 0), 0) : 0;
  const rejectedCount = Array.isArray(topContributors) ? topContributors.reduce((sum, c) => sum + (c.status3Count || 0), 0) : 0;
  const pendingCount = Math.max(totalSentences - approvedCount - rejectedCount, 0);

  return (
    <div className="flex">
      <Sidebar />
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

          {/* Statistics Grid (match Dashboard) */}
          <Row gutter={[12, 12]} className="mb-2">
            <Col xs={12} sm={12} md={4} lg={4}>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <Text className="text-xs text-gray-500 font-medium block mb-1">Người đóng góp</Text>
                    <Text className="text-2xl font-bold text-blue-600">{topContributors.length}</Text>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <UserOutlined className="text-xl text-blue-600" />
                  </div>
                </div>
              </div>
            </Col>

            <Col xs={12} sm={12} md={4} lg={4}>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-green-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <Text className="text-xs text-gray-500 font-medium block mb-1">Câu đóng góp</Text>
                    <Text className="text-2xl font-bold text-green-600">{totalSentences}</Text>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <FileTextOutlined className="text-xl text-green-600" />
                  </div>
                </div>
              </div>
            </Col>

            <Col xs={12} sm={12} md={4} lg={4}>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <Text className="text-xs text-gray-500 font-medium block mb-1">Đã duyệt</Text>
                    <Text className="text-2xl font-bold text-purple-600">{approvedCount}</Text>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <CheckCircleOutlined className="text-xl text-purple-600" />
                  </div>
                </div>
              </div>
            </Col>

            <Col xs={12} sm={12} md={4} lg={4}>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-amber-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <Text className="text-xs text-gray-500 font-medium block mb-1">Chờ duyệt</Text>
                    <Text className="text-2xl font-bold text-amber-600">{pendingCount}</Text>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                    <ClockCircleOutlined className="text-xl text-amber-600" />
                  </div>
                </div>
              </div>
            </Col>

            <Col xs={12} sm={12} md={4} lg={4}>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-red-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <Text className="text-xs text-gray-500 font-medium block mb-1">Bị từ chối</Text>
                    <Text className="text-2xl font-bold text-red-600">{rejectedCount}</Text>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                    <CloseCircleOutlined className="text-xl text-red-600" />
                  </div>
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
                rowKey={(record) => (record.userId || record.userEmail) as string}
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
