import React, { useState, useEffect } from 'react';
import { Typography, Table, Button, Space, Spin, Empty, Modal, Form, Input, message, Popconfirm, Row, Col, Statistic, Tabs, Tag, Select } from 'antd';
import { AudioOutlined, CheckCircleOutlined, PlayCircleOutlined, PlusOutlined, EditOutlined, DeleteOutlined, FileTextOutlined, CloseCircleOutlined, DownloadOutlined } from '@ant-design/icons';

import { getRecordings, getRecordingsByStatus, getSentences, createSentence, updateSentence, deleteSentence, approveRecording, rejectRecording, approveSentence, rejectSentence, downloadSentences, Recording, Sentence } from '@/services/features/recordingSlice';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers } from '@/services/features/userSlice';
import { AppDispatch, RootState } from '@/services/store/store';
import SidebarManager from '@/components/SidebarManager';

const { Title } = Typography;
const { TextArea } = Input;

const ManagerRecords: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { users } = useSelector((state: RootState) => state.user);
  const userRole = localStorage.getItem('userRole');
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [loadingRecordings, setLoadingRecordings] = useState(true);
  const [loadingSentences, setLoadingSentences] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingSentence, setEditingSentence] = useState<Sentence | null>(null);
  const [statusFilter, setStatusFilter] = useState<number | null>(null);
  const [recordingStatusFilter, setRecordingStatusFilter] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [form] = Form.useForm();

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
      message.error('Không thể tải danh sách ghi âm');
    } finally {
      setLoadingRecordings(false);
    }
  };

  const fetchSentences = async () => {
    setLoadingSentences(true);
    try {
      const data = await getSentences();
      setSentences(data);
    } catch (error) {
      console.error('Failed to fetch sentences:', error);
      message.error('Không thể tải danh sách câu');
    } finally {
      setLoadingSentences(false);
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

  const handleCreateSentence = () => {
    setEditingSentence(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditSentence = (sentence: Sentence) => {
    setEditingSentence(sentence);
    form.setFieldsValue({ content: sentence.Content });
    setIsModalVisible(true);
  };

  const handleDeleteSentence = async (sentenceId: string) => {
    try {
      await deleteSentence(sentenceId);
      message.success('Xóa câu thành công');
      fetchSentences();
    } catch (error) {
      console.error('Failed to delete sentence:', error);
      message.error('Xóa câu thất bại');
    }
  };

  const handleApproveRecording = async (recordingId: string) => {
    try {
      await approveRecording(recordingId);
      message.success('Duyệt bản ghi thành công');
      fetchRecordings();
    } catch (error) {
      console.error('Failed to approve recording:', error);
      message.error('Duyệt bản ghi thất bại');
    }
  };

  const handleRejectRecording = async (recordingId: string) => {
    try {
      await rejectRecording(recordingId);
      message.success('Từ chối bản ghi thành công');
      fetchRecordings();
    } catch (error) {
      console.error('Failed to reject recording:', error);
      message.error('Từ chối bản ghi thất bại');
    }
  };

  const handleApproveSentence = async (sentenceId: string) => {
    try {
      await approveSentence(sentenceId);
      message.success('Duyệt câu thành công');
      fetchSentences();
    } catch (error) {
      console.error('Failed to approve sentence:', error);
      message.error('Duyệt câu thất bại');
    }
  };

  const handleRejectSentence = async (sentenceId: string) => {
    try {
      await rejectSentence(sentenceId);
      message.success('Từ chối câu thành công');
      fetchSentences();
    } catch (error) {
      console.error('Failed to reject sentence:', error);
      message.error('Từ chối câu thất bại');
    }
  };

  const handleDownloadAll = async () => {
    setDownloading(true);
    try {
      const blob = await downloadSentences({ mode: 'all' });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `all-audio-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      message.success('Tải toàn bộ audio thành công');
    } catch (error) {
      console.error('Failed to download all audio:', error);
      message.error('Tải toàn bộ audio thất bại');
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadWithAudio = async () => {
    setDownloading(true);
    try {
      const blob = await downloadSentences({ mode: 'with-audio' });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sentences-with-audio-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      message.success('Tải câu đã thu thành công');
    } catch (error) {
      console.error('Failed to download sentences with audio:', error);
      message.error('Tải câu đã thu thất bại');
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadApproved = async () => {
    setDownloading(true);
    try {
      const blob = await downloadSentences({ mode: 'approved' });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sentences-approved-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      message.success('Tải câu đã duyệt thành công');
    } catch (error) {
      console.error('Failed to download approved sentences:', error);
      message.error('Tải câu đã duyệt thất bại');
    } finally {
      setDownloading(false);
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingSentence) {
        await updateSentence(editingSentence.SentenceID, values.content);
        message.success('Cập nhật câu thành công');
      } else {
        await createSentence(values.content);
        message.success('Tạo câu mới thành công');
      }
      setIsModalVisible(false);
      form.resetFields();
      fetchSentences();
    } catch (error) {
      console.error('Failed to save sentence:', error);
      message.error('Lưu câu thất bại');
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingSentence(null);
  };

  const recordingColumns = [

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

  const sentenceColumns = [

    {
      title: 'Nội dung',
      dataIndex: 'Content',
      key: 'Content',
      render: (text: string) => <span className="text-gray-900">{text}</span>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'Status',
      key: 'Status',
      width: 150,
      render: (status: number) => {
        const statusConfig: { [key: number]: { color: string; label: string } } = {
          0: { color: 'default', label: 'Chờ duyệt' },
          1: { color: 'green', label: 'Đã duyệt' },
          2: { color: 'blue', label: 'Đã thu âm' },
          3: { color: 'red', label: 'Bị từ chối' },
        };
        const config = statusConfig[status] || { color: 'default', label: 'Unknown' };
        return <Tag color={config.color}>{config.label}</Tag>;
      },
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
      title: 'Hành động',
      key: 'action',
      width: 250,
      render: (_: unknown, record: Sentence) => (
        <Space size="small">
          {record.Status === 0 ? (
            <>
              <Button
                icon={<CheckCircleOutlined />}
                size="small"
                onClick={() => handleApproveSentence(record.SentenceID)}
                className="rounded-full bg-green-500 hover:bg-green-600 border-green-500 text-white"
                style={{ backgroundColor: '#22c55e', borderColor: '#22c55e' }}
              >
                Duyệt
              </Button>
              <Button
                danger
                icon={<CloseCircleOutlined />}
                size="small"
                onClick={() => handleRejectSentence(record.SentenceID)}
                className="rounded-full"
              >
                Từ chối
              </Button>
            </>
          ) : (
            <>
              <Button
                icon={<EditOutlined />}
                size="small"
                onClick={() => handleEditSentence(record)}
                className="rounded-full bg-blue-500 hover:bg-blue-600 border-blue-500 text-white"
                style={{ backgroundColor: '#3b82f6', borderColor: '#3b82f6' }}
              >
                Sửa
              </Button>
              <Popconfirm
                title="Xóa câu này?"
                description="Bạn có chắc chắn muốn xóa câu này không?"
                onConfirm={() => handleDeleteSentence(record.SentenceID)}
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
              >
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  size="small"
                  className="rounded-full"
                >
                  Xóa
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  const approvedCount = recordings.filter((r) => r.IsApproved === 1 || r.IsApproved === true).length;

  return (
    <div className="flex">
      <SidebarManager />
      <div className="flex-1 min-h-screen bg-gray-50 py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-3 py-4">
            <Title
              level={1}
              className="!mb-0 !text-4xl md:!text-5xl !font-bold !text-blue-600"
              style={{ letterSpacing: '-0.02em' }}
            >
              Quản Lý Bản Thu & Câu
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
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-[1px] shadow-md">
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
                    value={approvedCount}
                    valueStyle={{ color: '#16a34a', fontSize: '32px', fontWeight: 'bold' }}
                  />
                </div>
              </div>
            </Col>

            <Col xs={24} sm={12} md={8} lg={8}>
              <div className="bg-gradient-to-r from-purple-500 to-violet-500 rounded-2xl p-[1px] shadow-md">
                <div className="bg-white rounded-[1rem] p-6">
                  <Statistic
                    title={
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                          <FileTextOutlined className="text-purple-600" />
                        </div>
                        <span className="text-gray-600 font-medium">Tổng câu</span>
                      </div>
                    }
                    value={sentences.length}
                    valueStyle={{ color: '#9333ea', fontSize: '32px', fontWeight: 'bold' }}
                  />
                </div>
              </div>
            </Col>
          </Row>

          {/* Tables */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <Tabs
              defaultActiveKey="recordings"
              items={[
                {
                  key: 'recordings',
                  label: (
                    <span className="flex items-center gap-2 font-semibold">
                      <AudioOutlined />
                      Danh sách ghi âm
                    </span>
                    
                  ),
                  children: (
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
                              { label: 'Trùng lặp', value: 3 },
                            ]}
                          />
                        </div>
                        {userRole === 'Admin' && (
                          <Button
                            icon={<DownloadOutlined />}
                            onClick={handleDownloadAll}
                            loading={downloading}
                            className="bg-amber-50 hover:bg-amber-100 border-amber-300 text-amber-600"
                          >
                            Tải toàn bộ Audio
                          </Button>
                        )}
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
                    
                  ),
                },
                {
                  key: 'sentences',
                  label: (
                    <span className="flex items-center gap-2 font-semibold">
                      <FileTextOutlined />
                      Quản lý câu
                    </span>
                  ),
                  children: (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="space-y-2">
                          
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-700">Lọc theo trạng thái:</span>
                            <Select
                              placeholder="Chọn trạng thái"
                              style={{ width: 200 }}
                              allowClear
                              onChange={setStatusFilter}
                              options={[
                                { label: 'Tất cả', value: null },
                                { label: 'Chờ duyệt', value: 0 },
                                { label: 'Đã duyệt', value: 1 },
                                { label: 'Đã thu âm', value: 2 },
                                { label: 'Bị từ chối', value: 3 },
                              ]}
                            />
                          </div>
                        </div>
                        
                        <Space>
                          {userRole === 'Admin' && (
                            <>
                              <Button
                                icon={<DownloadOutlined />}
                                onClick={handleDownloadWithAudio}
                                loading={downloading}
                                className="bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-600"
                              >
                                Tải câu đã thu
                              </Button>
                              <Button
                                icon={<DownloadOutlined />}
                                onClick={handleDownloadApproved}
                                loading={downloading}
                                className="bg-green-50 hover:bg-green-100 border-green-300 text-green-600"
                              >
                                Tải câu đã duyệt
                              </Button>
                            </>
                          )}
                          <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleCreateSentence}
                          >
                            Tạo câu mới
                          </Button>
                        </Space>
                      </div>
                      {loadingSentences ? (
                        <div className="flex justify-center py-12">
                          <Spin size="large" />
                        </div>
                      ) : sentences.length > 0 ? (
                        <Table
                          columns={sentenceColumns}
                          dataSource={statusFilter !== null ? sentences.filter(s => s.Status === statusFilter) : sentences}
                          rowKey="SentenceID"
                          pagination={{ pageSize: 10, responsive: true }}
                          scroll={{ x: 800 }}
                        />
                      ) : (
                        <Empty description="Chưa có câu nào" style={{ marginTop: 50 }} />
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Modal for Create/Edit Sentence */}
      <Modal
        title={editingSentence ? 'Chỉnh sửa câu' : 'Tạo câu mới'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText={editingSentence ? 'Cập nhật' : 'Tạo'}
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="content"
            label="Nội dung câu"
            rules={[{ required: true, message: 'Vui lòng nhập nội dung câu' }]}
          >
            <TextArea rows={4} placeholder="Nhập nội dung câu..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ManagerRecords;
