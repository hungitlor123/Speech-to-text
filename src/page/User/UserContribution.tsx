import React, { useEffect, useState } from "react";
import { Typography, Table, Spin, Empty } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  TrophyOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  AudioOutlined,
} from "@ant-design/icons";
import SidebarUser from "@/components/SidebarUser";
import {
  fetchTopContributors,
  TopContributor,
} from "@/services/features/userSlice";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/services/store/store";

const { Title, Text } = Typography;

const UserContribution: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [topContributors, setTopContributors] = useState<TopContributor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTopContributors();
    const intervalId = setInterval(
      () => {
        loadTopContributors();
      },
      5 * 60 * 1000,
    );

    return () => clearInterval(intervalId);
  }, []);

  const loadTopContributors = async () => {
    setLoading(true);
    try {
      const result = await dispatch(fetchTopContributors()).unwrap();
      setTopContributors(result);
    } catch (error) {
      console.error("Failed to fetch top contributors:", error);
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<TopContributor> = [
    {
      title: "Hạng",
      key: "rank",
      width: 120,
      render: (_: unknown, __: TopContributor, index: number) => {
        return (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-white ${
                  index === 0
                    ? "bg-gradient-to-r from-yellow-400 to-yellow-500"
                    : index === 1
                      ? "bg-gradient-to-r from-gray-400 to-gray-500"
                      : index === 2
                        ? "bg-gradient-to-r from-orange-400 to-orange-500"
                        : "bg-blue-400"
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
      title: "Người dùng",
      dataIndex: "userEmail",
      key: "userEmail",
      width: 250,
      render: (name: string, record: TopContributor) => (
        <div className="flex items-center gap-3">
          <div>
            <div className="font-semibold text-base text-gray-900">
              {name || "Ẩn danh"}
            </div>
            <div className="text-sm text-gray-500">
              {record.createdAt
                ? new Date(record.createdAt).toLocaleDateString("vi-VN")
                : "N/A"}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Số câu ghi âm",
      dataIndex: "RecordingTotalCount",
      key: "RecordingTotalCount",
      width: 200,
      defaultSortOrder: "descend",
      sorter: (a: TopContributor, b: TopContributor) =>
        (a.RecordingTotalCount || 0) - (b.RecordingTotalCount || 0),
      render: (count: number | undefined) => (
        <div className="flex items-center gap-2">
          <AudioOutlined style={{ fontSize: "18px", color: "#1890ff" }} />
          <Text strong style={{ fontSize: "16px", color: "#1890ff" }}>
            {(count || 0).toLocaleString()}
          </Text>
        </div>
      ),
    },
    {
      title: "Số câu đóng góp",
      dataIndex: "totalSentences",
      key: "totalSentences",
      width: 200,
      sorter: (a: TopContributor, b: TopContributor) =>
        (a.totalSentences || 0) - (b.totalSentences || 0),
      render: (count: number | undefined) => (
        <div className="flex items-center gap-2">
          <FileTextOutlined style={{ fontSize: "18px", color: "#52c41a" }} />
          <Text strong style={{ fontSize: "16px", color: "#52c41a" }}>
            {(count || 0).toLocaleString()}
          </Text>
        </div>
      ),
    },
    {
      title: "Đã duyệt",
      dataIndex: "status1Count",
      key: "status1Count",
      width: 150,
      sorter: (a: TopContributor, b: TopContributor) =>
        (a.status1Count || 0) - (b.status1Count || 0),
      render: (count: number | undefined) => (
        <div className="flex items-center gap-2">
          <CheckCircleOutlined style={{ fontSize: "18px", color: "#52c41a" }} />
          <Text strong style={{ fontSize: "16px", color: "#52c41a" }}>
            {(count || 0).toLocaleString()}
          </Text>
        </div>
      ),
    },
  ];

  return (
    <div className="flex">
      <SidebarUser />
      <div className="flex-1 min-h-screen bg-gray-50 py-8 px-4 md:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-3 py-4">
            <div className="flex items-center justify-center gap-3">
              <TrophyOutlined style={{ fontSize: "48px", color: "#faad14" }} />
              <Title
                level={1}
                className="!mb-0 !text-4xl md:!text-5xl !font-bold !text-blue-600"
                style={{ letterSpacing: "-0.02em" }}
              >
                Top Người Đóng Góp
              </Title>
            </div>
          </div>

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
                  showTotal: (total) => `Tổng ${total} người dùng`,
                }}
                scroll={{ x: 800 }}
                rowClassName={(_, index) => {
                  if (index === 0) return "bg-yellow-50";
                  if (index === 1) return "bg-gray-50";
                  if (index === 2) return "bg-orange-50";
                  return "";
                }}
              />
            ) : (
              <Empty
                description="Chưa có dữ liệu đóng góp"
                style={{ marginTop: 50 }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserContribution;
