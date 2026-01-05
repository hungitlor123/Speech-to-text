import React, { useState } from 'react';
import { Modal, Input, Button, Typography } from 'antd';
import { UserOutlined, ManOutlined, WomanOutlined } from '@ant-design/icons';
import { useAppDispatch } from '@/services/store/store';
import { setUserInfo } from '@/services/features/userSlice';
import { cn } from '@/lib/utils';

const { Title, Text } = Typography;

interface UserInfoModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const UserInfoModal: React.FC<UserInfoModalProps> = ({ open, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const dispatch = useAppDispatch();

  const handleContinue = () => {
    if (name.trim() && gender) {
      dispatch(setUserInfo({ name: name.trim(), gender }));
      setName('');
      setGender(null);
      onSuccess();
      onClose();
    }
  };

  const handleCancel = () => {
    setName('');
    setGender(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      footer={null}
      closable={true}
      maskClosable={false}
      width={600}
      className="user-info-modal"
      styles={{
        content: {
          borderRadius: '24px',
          overflow: 'hidden',
          padding: 0,
        },
        body: {
          padding: '48px 40px',
        },
      }}
    >
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Title 
            level={2} 
            className="!mb-0 !text-3xl !font-bold !text-blue-600"
            style={{ letterSpacing: '-0.02em' }}
          >
            Xin chào!
          </Title>
          <Text className="text-gray-600 text-base">
            Bạn có thể cho chúng tôi biết thông tin của bạn
          </Text>
        </div>

        {/* Name Input */}
        <div className="space-y-2">
          <Text strong className="text-base block text-gray-700 font-semibold">
            Tên của bạn
          </Text>
          <Input
            size="large"
            placeholder="Nhập tên của bạn"
            prefix={<UserOutlined className="text-gray-400" />}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12 rounded-xl border-gray-300 hover:border-blue-400 focus:border-blue-500 transition-colors"
            onPressEnter={handleContinue}
          />
        </div>

        {/* Gender Selection */}
        <div className="space-y-3">
          <Text strong className="text-base block text-gray-700 font-semibold">
            Giới tính
          </Text>
          <div className="grid grid-cols-2 gap-4">
            {/* Male Option */}
            <button
              onClick={() => setGender('male')}
              className={cn(
                "relative p-6 rounded-xl border-2 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg",
                "flex flex-col items-center gap-3 bg-white",
                gender === 'male'
                  ? "border-blue-500 bg-blue-50 shadow-md"
                  : "border-gray-200 hover:border-blue-300"
              )}
            >
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center transition-colors",
                gender === 'male' ? "bg-blue-100" : "bg-gray-100"
              )}>
                <ManOutlined className={cn(
                  "text-3xl transition-colors",
                  gender === 'male' ? "text-blue-600" : "text-gray-400"
                )} />
              </div>
              <Text strong className={cn(
                "text-base transition-colors font-semibold",
                gender === 'male' ? "text-blue-600" : "text-gray-600"
              )}>
                Nam
              </Text>
              {gender === 'male' && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
              )}
            </button>

            {/* Female Option */}
            <button
              onClick={() => setGender('female')}
              className={cn(
                "relative p-6 rounded-xl border-2 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg",
                "flex flex-col items-center gap-3 bg-white",
                gender === 'female'
                  ? "border-pink-500 bg-pink-50 shadow-md"
                  : "border-gray-200 hover:border-pink-300"
              )}
            >
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center transition-colors",
                gender === 'female' ? "bg-pink-100" : "bg-gray-100"
              )}>
                <WomanOutlined className={cn(
                  "text-3xl transition-colors",
                  gender === 'female' ? "text-pink-600" : "text-gray-400"
                )} />
              </div>
              <Text strong className={cn(
                "text-base transition-colors font-semibold",
                gender === 'female' ? "text-pink-600" : "text-gray-600"
              )}>
                Nữ
              </Text>
              {gender === 'female' && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Continue Button */}
        <Button
          type="primary"
          size="large"
          block
          onClick={handleContinue}
          disabled={!name.trim() || !gender}
          className={cn(
            "h-12 rounded-xl text-base font-semibold transition-all duration-300",
            "bg-blue-600 border-none hover:bg-blue-700",
            "hover:shadow-lg hover:scale-[1.01]",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          )}
        >
          Tiếp tục
        </Button>
      </div>
    </Modal>
  );
};

export default UserInfoModal;
