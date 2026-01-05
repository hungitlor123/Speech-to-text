import React from 'react';
import { Button } from 'antd';
import { AudioOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/services/store/store';

const ThankYouPage: React.FC = () => {
  const navigate = useNavigate();
  const { userInfo, recordings } = useAppSelector((state) => state.user);

  const handleRecordMore = () => {
    navigate('/recording');
  };

  if (!userInfo) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-2xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 md:p-12 border border-white/20 shadow-2xl text-center space-y-8">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-32 h-32 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center shadow-xl transform hover:scale-110 transition-transform duration-300">
                <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                  <AudioOutlined className="text-5xl text-blue-600" />
                </div>
              </div>
              {/* Success Checkmark Animation */}
              <div className="absolute -top-2 -right-2 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-6xl font-bold text-white drop-shadow-lg">
            Cảm ơn bạn
          </h1>

          {/* Message */}
          <p className="text-xl md:text-2xl text-white/90 font-light">
            Cảm ơn <span className="font-semibold">{userInfo.name}</span> đã hoàn thành
          </p>

          {/* Recording Count */}
          <div className="space-y-2">
            <div className="text-7xl md:text-8xl font-bold text-white drop-shadow-lg">
              {recordings.length}
            </div>
            <p className="text-2xl md:text-3xl text-white/90 font-light">
              câu ghi âm
            </p>
          </div>

          {/* Button */}
          <Button
            type="primary"
            size="large"
            onClick={handleRecordMore}
            className="h-14 px-8 rounded-xl bg-white text-blue-600 border-none text-lg font-semibold shadow-2xl hover:bg-blue-50 hover:scale-105 transition-all duration-300"
          >
            Ghi âm thêm
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ThankYouPage;
