import React, { useState, useEffect } from 'react';
import { Typography, Row, Col, Statistic, Table, Button, Space, Spin, Empty, message } from 'antd';
import { AudioOutlined, CheckCircleOutlined, ClockCircleOutlined, PlayCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { getRecordings, getSentences, approveRecording, rejectRecording, Recording, Sentence } from '@/services/features/recordingSlice';
import Sidebar from '@/components/Sidebar';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers } from '@/services/features/userSlice';
import { AppDispatch, RootState } from '@/services/store/store';

const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { users } = useSelector((state: RootState) => state.user);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [recordingsData, sentencesData] = await Promise.all([
          getRecordings(),
          getSentences()
        ]);
        setRecordings(recordingsData);
        setSentences(sentencesData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    dispatch(fetchUsers());
  }, [dispatch]);

  const handlePlay = (audioUrl: string | null, id: string) => {
    if (!audioUrl) return;

    if (playingId === id) {
      setPlayingId(null);
    } else {
      setPlayingId(id);
      const audio = new Audio(audioUrl);
      audio.onended = () => setPlayingId(null);
      audio.play();
    }
  };

  const handleApproveRecording = async (recordingId: string) => {
    try {
      await approveRecording(recordingId);
      message.success('Duyệt bản ghi thành công');
      const recordingsData = await getRecordings();
      setRecordings(recordingsData);
    } catch (error) {
      console.error('Failed to approve recording:', error);
      message.error('Duyệt bản ghi thất bại');
    }
  };

  const handleRejectRecording = async (recordingId: string) => {
    try {
      await rejectRecording(recordingId);
      message.success('Từ chối bản ghi thành công');
      const recordingsData = await getRecordings();
      setRecordings(recordingsData);
    } catch (error) {
      console.error('Failed to reject recording:', error);
      message.error('Từ chối bản ghi thất bại');
    }
  };

  const columns = [
    {
      title: 'Người dùng',
      dataIndex: 'PersonID',
      key: 'PersonID',
      width: 200,
      render: (personId: string) => {
        const user = users.find(u => u.PersonID === personId);
        return <span className="font-medium text-gray-900">{user?.Name || 'Unknown'}</span>;
      },
    },
    {
      title: 'Nội dung câu',
      dataIndex: 'SentenceID',
      key: 'SentenceID',
      width: 300,
      render: (sentenceId: string) => {
        const sentence = sentences.find(s => s.SentenceID === sentenceId);
        return <span className="text-gray-900">{sentence?.Content || 'Unknown'}</span>;
      },
    },
    {
      title: 'Ngày ghi',
      dataIndex: 'RecordedAt',
      key: 'RecordedAt',
      width: 180,
      render: (date: string) => {
        if (!date) return '-';
        return new Date(date).toLocaleString('vi-VN');
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'IsApproved',
      key: 'IsApproved',
      width: 100,
      render: (isApproved: boolean) => (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isApproved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
          {isApproved ? 'Đã duyệt' : 'Chờ duyệt'}
        </span>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 280,
      render: (_: unknown, record: Recording) => (
        <Space size="small">
          <Button
            type={playingId === record.RecordingID ? 'primary' : 'default'}
            icon={<PlayCircleOutlined />}
            size="small"
            onClick={() => handlePlay(record.AudioUrl, record.RecordingID)}
            className={`rounded-full ${playingId === record.RecordingID ? 'bg-blue-500 hover:bg-blue-600 border-blue-500' : 'hover:border-blue-400'}`}
          >
            {playingId === record.RecordingID ? 'Đang phát' : 'Phát'}
          </Button>
          {!record.IsApproved && (
            <>
              <Button
                icon={<CheckCircleOutlined />}
                size="small"
                onClick={() => handleApproveRecording(record.RecordingID)}
                className="rounded-full bg-blue-500 hover:bg-blue-600 border-blue-500 text-white"
                style={{ backgroundColor: '#3b82f6', borderColor: '#3b82f6' }}
              >
                Duyệt
              </Button>
              <Button
                danger
                icon={<CloseCircleOutlined />}
                size="small"
                onClick={() => handleRejectRecording(record.RecordingID)}
                className="rounded-full"
              >
                Từ chối
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 min-h-screen bg-white py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-3 py-4">

            <Text className="text-lg md:text-xl text-gray-600 font-medium">
              Xin chào, <span className="text-blue-600 font-semibold">Manager</span>
            </Text>
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
                          <AudioOutlined className="text-blue-600" />
                        </div>
                        <span className="text-gray-600 font-medium">Tổng ghi âm</span>
                      </div>
                    }
                    value={recordings.length}
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
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                          <CheckCircleOutlined className="text-green-600" />
                        </div>
                        <span className="text-gray-600 font-medium">Đã duyệt</span>
                      </div>
                    }
                    value={recordings.filter((r) => r.IsApproved).length}
                    valueStyle={{ color: '#16a34a', fontSize: '32px', fontWeight: 'bold' }}
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
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                          <ClockCircleOutlined className="text-purple-600" />
                        </div>
                        <span className="text-gray-600 font-medium">Chờ duyệt</span>
                      </div>
                    }
                    value={recordings.filter((r) => !r.IsApproved).length}
                    valueStyle={{ color: '#9333ea', fontSize: '32px', fontWeight: 'bold' }}
                  />
                </div>
              </div>
            </Col>
          </Row>

          {/* Recordings Table */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="space-y-4">
              <div>
                <Title level={3} className="!text-blue-600 !mb-2">
                  Danh sách ghi âm
                </Title>
                <Text className="text-gray-600">
                  Quản lý tất cả các bản ghi âm từ người dùng
                </Text>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <Spin size="large" />
                </div>
              ) : recordings.length > 0 ? (
                <Table
                  columns={columns}
                  dataSource={recordings}
                  rowKey="RecordingID"
                  pagination={{ pageSize: 10, responsive: true }}
                  scroll={{ x: 800 }}
                />
              ) : (
                <Empty description="Chưa có bản ghi âm nào" style={{ marginTop: 50 }} />
              )}
            </div>
          </div>

          {/* Welcome Card */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl p-[1px] shadow-md">
            <div className="bg-white rounded-[1rem] p-6 md:p-8">
              <div className="text-center space-y-4">
                <Title level={3} className="!text-blue-600 !mb-2">
                  Chào mừng đến với trang quản trị
                </Title>
                <Text className="text-gray-600 text-base">
                  Bạn có thể quản lý người dùng, bản ghi âm và các dữ liệu khác tại đây.
                </Text>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;