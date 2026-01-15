import React, { useState, useEffect } from 'react';
import { Typography, Table, Button, Space, Spin, Empty, Row, Col, Tag, Select } from 'antd';
import { AudioOutlined, CheckCircleOutlined, PlayCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, DownloadOutlined } from '@ant-design/icons';
import Sidebar from '@/components/Sidebar';
import { getRecordings, getRecordingsByStatus, getSentences, approveRecording, rejectRecording, downloadSentences, Recording, Sentence } from '@/services/features/recordingSlice';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers } from '@/services/features/userSlice';
import { AppDispatch, RootState } from '@/services/store/store';

const { Title, Text } = Typography;

const ManagerRecords: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { users } = useSelector((state: RootState) => state.user);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [loadingRecordings, setLoadingRecordings] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [recordingStatusFilter, setRecordingStatusFilter] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchRecordings();
    fetchSentences();
    dispatch(fetchUsers());
  }, [dispatch]);

  useEffect(() => {
    fetchRecordings(recordingStatusFilter);
  }, [recordingStatusFilter]);

  const fetchRecordings = async (status?: number | null) => {
    setLoadingRecordings(true);
    try {
      let data;
      if (status !== null && status !== undefined) {
        data = await getRecordingsByStatus(status);
      } else {
        data = await getRecordings();
      }
      setRecordings(data);
    } catch (error) {
      console.error('Failed to fetch recordings:', error);
    } finally {
      setLoadingRecordings(false);
    }
  };

  const fetchSentences = async () => {
    try {
      const data = await getSentences();
      setSentences(data);
    } catch (error) {
      console.error('Failed to fetch sentences:', error);
    }
  };

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
      fetchRecordings();
    } catch (error) {
      console.error('Failed to approve recording:', error);
    }
  };

  const handleRejectRecording = async (recordingId: string) => {
    try {
      await rejectRecording(recordingId);
      fetchRecordings();
    } catch (error) {
      console.error('Failed to reject recording:', error);
    }
  };

  const handleDownloadAll = async () => {
    setDownloading(true);
    try {
      const blob = await downloadSentences({ mode: 'all' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `all-audio-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download all audio:', error);
    } finally {
      setDownloading(false);
    }
  };

  const recordingColumns = [
    {
      title: 'Email ',
      dataIndex: 'PersonID',
      key: 'PersonID',
      width: 200,
      render: (personId: string) => {
        const user = users.find(u => u.PersonID === personId);
        return <span className="font-medium text-gray-900">{user?.Email || 'Unknown'}</span>;
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
      width: 150,
      render: (isApproved: number | boolean | null) => {
        const statusConfig: { [key: number]: { color: string; label: string } } = {
          0: { color: 'gold', label: 'Chờ duyệt' },
          1: { color: 'green', label: 'Đã duyệt' },
          2: { color: 'red', label: 'Bị từ chối' },
          3: { color: 'orange', label: 'Trùng lặp' },
        };
        const status = typeof isApproved === 'number' ? isApproved : (isApproved ? 1 : 0);
        const config = statusConfig[status] || { color: 'default', label: 'Unknown' };
        return <Tag color={config.color}>{config.label}</Tag>;
      },
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
          {(record.IsApproved === 0 || record.IsApproved === false || record.IsApproved === null) && (
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

  const approvedCount = recordings.filter((r) => r.IsApproved === 1 || r.IsApproved === true).length;
  const totalRecorded = recordings.length;
  const pendingRecordings = recordings.filter((r) => r.IsApproved === 0 || r.IsApproved === false || r.IsApproved === null).length;
  const rejectedCount = recordings.filter((r) => r.IsApproved === 2).length;

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 min-h-screen bg-gray-50 py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto space-y-8">{/* Header */}
          <div className="text-center space-y-3 py-4">
            <Title
              level={1}
              className="!mb-0 !text-4xl md:!text-5xl !font-bold !text-blue-600"
              style={{ letterSpacing: '-0.02em' }}
            >
              Quản Lý Ghi Âm
            </Title>
          </div>

          {/* Statistics Grid (match Dashboard) */}
          <Row gutter={[12, 12]} className="mb-2">
            <Col xs={12} sm={12} md={4} lg={4}>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <Text className="text-xs text-gray-500 font-medium block mb-1">Tổng bản ghi</Text>
                    <Text className="text-2xl font-bold text-blue-600">{totalRecorded}</Text>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <AudioOutlined className="text-xl text-blue-600" />
                  </div>
                </div>
                
              </div>
            </Col>

            <Col xs={12} sm={12} md={4} lg={4}>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-green-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <Text className="text-xs text-gray-500 font-medium block mb-1">Đã duyệt</Text>
                    <Text className="text-2xl font-bold text-green-600">{approvedCount}</Text>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <CheckCircleOutlined className="text-xl text-green-600" />
                  </div>
                </div>
              </div>
            </Col>

            <Col xs={12} sm={12} md={4} lg={4}>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-amber-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <Text className="text-xs text-gray-500 font-medium block mb-1">Chờ duyệt</Text>
                    <Text className="text-2xl font-bold text-amber-600">{pendingRecordings}</Text>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                    <ClockCircleOutlined className="text-xl text-amber-600" />
                  </div>
                </div>
              </div>
            </Col>

            <Col xs={12} sm={12} md={4} lg={4}>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <Text className="text-xs text-gray-500 font-medium block mb-1">Bị từ chối</Text>
                    <Text className="text-2xl font-bold text-purple-600">{rejectedCount}</Text>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <CloseCircleOutlined className="text-xl text-purple-600" />
                  </div>
                </div>
              </div>
            </Col>

            
          </Row>

          {/* Table */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">Lọc theo trạng thái:</span>
                  <Select
                    placeholder="Chọn trạng thái"
                    style={{ width: 200 }}
                    allowClear
                    value={recordingStatusFilter}
                    onChange={setRecordingStatusFilter}
                    options={[
                      { label: 'Tất cả', value: null },
                      { label: 'Chờ duyệt', value: 0 },
                      { label: 'Đã duyệt', value: 1 },
                      { label: 'Bị từ chối', value: 2 },
                      
                    ]}
                  />
                </div>
                <Space size="small">
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={handleDownloadAll}
                    loading={downloading}
                    className="bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-600"
                  >
                    Tải toàn bộ Audio
                  </Button>
                </Space>
              </div>

              {loadingRecordings ? (
                <div className="flex justify-center py-12">
                  <Spin size="large" />
                </div>
              ) : recordings.length > 0 ? (
                <Table
                  columns={recordingColumns}
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
        </div>
      </div>
    </div>
  );
};

export default ManagerRecords;
