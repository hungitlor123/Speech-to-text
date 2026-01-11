import React, { useState, useEffect } from 'react';
import { Button, Typography, Tag, Input, message, Spin } from 'antd';
import { BookOutlined, PlusOutlined, AudioOutlined, ReloadOutlined, RightOutlined, StopOutlined, LogoutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/services/store/store';
import {
  setCurrentSentence,
  setCurrentSentenceId,
  addRecording,
  setCurrentRecordingIndex,
  setIsRecording,
  setRecordingTime,
  fetchAvailableSentences,
  resetUserState
} from '@/services/features/userSlice';
import { uploadRecording, createUserSentence } from '@/services/features/recordingSlice';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import AudioWaveform from '@/components/AudioWaveform';
import RecordingWaveform from '@/components/RecordingWaveform';
import { cn } from '@/lib/utils';
import { clearPersistedUserData } from '@/lib/storageUtils';

const { Title, Text } = Typography;

const RecordingPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const {
    userInfo,
    recordings,
    currentRecordingIndex,
    currentSentence,
    currentSentenceId,
    availableSentences,
    loadingSentences
  } = useAppSelector((state) => state.user);
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [customSentence, setCustomSentence] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submittingSentence, setSubmittingSentence] = useState(false);

  const {
    isRecording,
    recordingTime,
    audioBlob,
    audioUrl,
    mediaStream,
    startRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder();

  useEffect(() => {
    clearPersistedUserData();

    if (!userInfo) {
      navigate('/');
      return;
    }

    // Fetch available sentences when component mounts or userInfo changes
    if (userInfo?.guestId && mode === 'existing') {
      dispatch(fetchAvailableSentences(userInfo.guestId));
    }
  }, [userInfo, dispatch, navigate, mode]);

  // Update current sentence when availableSentences changes
  useEffect(() => {
    if (availableSentences.length > 0 && mode === 'existing' && !currentSentence) {
      dispatch(setCurrentSentence(availableSentences[0].Content));
      dispatch(setCurrentSentenceId(availableSentences[0].SentenceID));
    }
  }, [availableSentences, mode, currentSentence, dispatch]);

  useEffect(() => {
    dispatch(setIsRecording(isRecording));
    dispatch(setRecordingTime(recordingTime));
  }, [isRecording, recordingTime, dispatch]);

  const handleStartRecording = async () => {
    try {
      await startRecording();
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const handleStopRecording = () => {
    stopRecording();
  };

  const handleSaveRecording = async () => {
    if (!audioBlob || !audioUrl || !currentSentence) {
      return;
    }

    if (!userInfo?.guestId) {
      message.error('Không tìm thấy thông tin người dùng');
      return;
    }

    // For existing mode, we need sentenceId
    if (mode === 'existing' && !currentSentenceId) {
      message.error('Không tìm thấy ID câu');
      return;
    }

    setUploading(true);
    try {
      if (mode === 'existing' && currentSentenceId) {
        // Upload recording for existing sentence
        const response = await uploadRecording(
          audioBlob,
          userInfo.guestId,
          currentSentenceId
        );

        if (response.success) {
          message.success('Ghi âm đã được lưu thành công!');

          const duration = recordingTime;
          dispatch(
            addRecording({
              sentence: currentSentence,
              sentenceId: currentSentenceId,
              audioBlob,
              audioUrl,
              duration,
            })
          );

          // Check if user has completed 2 recordings
          if (recordings.length + 1 >= 2) {
            // User has completed 2 recordings, go to thank you page
            setTimeout(() => {
              navigate('/thank-you');
            }, 500);
          } else {
            // Refresh available sentences to get updated list and move to next sentence
            if (userInfo?.guestId) {
              const updatedSentences = await dispatch(fetchAvailableSentences(userInfo.guestId)).unwrap();

              if (updatedSentences.length > 0) {
                // Move to next available sentence
                const nextSentence = updatedSentences[0];
                dispatch(setCurrentSentence(nextSentence.Content));
                dispatch(setCurrentSentenceId(nextSentence.SentenceID));
                dispatch(setCurrentRecordingIndex(recordings.length + 1));
              } else {
                // No more sentences available
                setTimeout(() => {
                  navigate('/thank-you');
                }, 500);
              }
            }
          }
        }
      } else {
        // For new mode, just save locally (no API call for custom sentences)
        const duration = recordingTime;
        dispatch(
          addRecording({
            sentence: currentSentence,
            audioBlob,
            audioUrl,
            duration,
          })
        );

        if (recordings.length + 1 >= 2) {
          setTimeout(() => {
            navigate('/thank-you');
          }, 500);
        } else {
          // Keep the same custom sentence
          dispatch(setCurrentSentence(customSentence.trim()));
        }
      }

      setIsPlaying(false);
      resetRecording();
    } catch (error: unknown) {
      console.error('Error uploading recording:', error);
      const errorMessage = error instanceof Error ? error.message : 'Không thể tải lên ghi âm. Vui lòng thử lại.';
      message.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleRetry = () => {
    setIsPlaying(false);
    resetRecording();
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleExit = () => {
    // Reset user state and navigate back to home page
    dispatch(resetUserState());
    clearPersistedUserData();
    navigate('/');
  };

  const handleSubmitCustomSentence = async () => {
    if (!customSentence.trim()) {
      message.warning('Vui lòng nhập câu trước khi gửi');
      return;
    }

    if (!userInfo?.name) {
      message.error('Không tìm thấy tên người dùng');
      return;
    }

    setSubmittingSentence(true);
    try {
      const response = await createUserSentence({
        name: userInfo.name,
        content: customSentence.trim(),
      });

      if (response.message) {
        message.success('Câu đã được gửi thành công!');
        // Reset form
        setCustomSentence('');
        dispatch(setCurrentSentence(''));
        // Stay on recording page, don't navigate away
      }
    } catch (error: unknown) {
      console.error('Error submitting sentence:', error);
      const errorMessage = error instanceof Error ? error.message : 'Không thể gửi câu. Vui lòng thử lại.';
      message.error(errorMessage);
    } finally {
      setSubmittingSentence(false);
    }
  };

  if (!userInfo) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white py-8 px-4 md:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-3 py-4">
          {/* Exit Button */}
          <div className="flex justify-end mb-2">
            <button
              onClick={handleExit}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 border border-gray-200 hover:border-red-300 text-sm font-medium"
              title="Thoát và nhập tên lại"
            >
              <LogoutOutlined />
              <span>Thoát</span>
            </button>
          </div>

          <div className="text-center space-y-3">
            <Title
              level={1}
              className="!mb-0 !text-4xl md:!text-5xl !font-bold !text-blue-600"
              style={{ letterSpacing: '-0.02em' }}
            >
              Ghi Âm
            </Title>
            <Text className="text-lg md:text-xl text-gray-600 font-medium">
              Xin chào, <span className="text-blue-600 font-semibold">{userInfo.name}</span>
            </Text>
          </div>
        </div>

        {/* Mode Selection */}
        <div className="flex justify-center gap-3 md:gap-4">
          <button
            onClick={() => setMode('existing')}
            className={cn(
              "px-5 md:px-6 py-2.5 md:py-3 rounded-xl font-medium transition-all duration-300",
              "flex items-center gap-2 text-base md:text-lg",
              mode === 'existing'
                ? "bg-blue-600 text-white shadow-lg shadow-blue-200 scale-[1.02]"
                : "bg-white text-gray-600 border-2 border-gray-200 hover:border-blue-300 hover:shadow-md"
            )}
          >
            <BookOutlined className="text-lg" />
            <span>Đọc câu có sẵn</span>
          </button>
          <button
            onClick={() => setMode('new')}
            className={cn(
              "px-5 md:px-6 py-2.5 md:py-3 rounded-xl font-medium transition-all duration-300",
              "flex items-center gap-2 text-base md:text-lg",
              mode === 'new'
                ? "bg-blue-600 text-white shadow-lg shadow-blue-200 scale-[1.02]"
                : "bg-white text-gray-600 border-2 border-gray-200 hover:border-blue-300 hover:shadow-md"
            )}
          >
            <PlusOutlined className="text-lg" />
            <span>Tạo câu mới</span>
          </button>
        </div>

        {/* Suggested / Custom Sentence Card */}
        {mode === 'existing' && (
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl p-[1px] shadow-md">
            <div className="bg-white rounded-[1rem] p-6 md:p-8 flex flex-col gap-4">
              {loadingSentences ? (
                <div className="flex justify-center items-center py-8">
                  <Spin size="large" />
                </div>
              ) : availableSentences.length === 0 ? (
                <div className="text-center py-8">
                  <Text className="text-gray-500 text-lg">
                    Không còn câu nào cần ghi âm. Cảm ơn bạn!
                  </Text>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                        <BookOutlined className="text-blue-600" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold tracking-[0.18em] text-blue-500 uppercase">
                          Câu gợi ý
                        </span>
                        <span className="text-xs text-gray-500">
                          Đọc to và rõ ràng theo đúng câu bên dưới
                        </span>
                      </div>
                    </div>
                    <Tag
                      color="blue"
                      className="px-3 py-1.5 text-xs md:text-sm font-semibold rounded-full border-0 bg-blue-50 text-blue-600"
                    >
                      {currentRecordingIndex + 1}/2
                    </Tag>
                  </div>
                  <div className="bg-gray-50 rounded-xl px-5 py-4 border border-gray-100">
                    <Text className="text-xl md:text-2xl text-gray-900 font-semibold leading-relaxed">
                      {currentSentence || 'Đang tải...'}
                    </Text>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {mode === 'new' && (
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl p-[1px] shadow-md">
            <div className="bg-white rounded-[1rem] p-6 md:p-8 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                    <PlusOutlined className="text-blue-600" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold tracking-[0.18em] text-blue-500 uppercase">
                      Tạo câu mới
                    </span>
                    <span className="text-xs text-gray-500">
                      Nhập câu bạn muốn tạo và gửi
                    </span>
                  </div>
                </div>
              </div>
              <Input.TextArea
                rows={4}
                placeholder="Nhập câu mà bạn muốn tạo..."
                value={customSentence}
                onChange={(e) => {
                  const value = e.target.value;
                  setCustomSentence(value);
                }}
                className="rounded-xl border-gray-300 hover:border-blue-400 focus:border-blue-500 focus:shadow-sm transition-all text-base"
                disabled={submittingSentence}
              />
              <Button
                type="primary"
                size="large"
                onClick={handleSubmitCustomSentence}
                loading={submittingSentence}
                disabled={submittingSentence || !customSentence.trim()}
                className="h-12 md:h-14 rounded-xl bg-blue-600 border-none hover:bg-blue-700 shadow-md hover:shadow-lg font-semibold transition-all"
                block
              >
                {submittingSentence ? 'Đang gửi...' : 'Gửi câu'}
              </Button>
            </div>
          </div>
        )}

        {/* Recording Waveform - Show during recording (only for existing mode) */}
        {mode === 'existing' && isRecording && mediaStream && (
          <RecordingWaveform mediaStream={mediaStream} isRecording={isRecording} />
        )}

        {/* Recording Time (only for existing mode) */}
        {mode === 'existing' && isRecording && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-red-50 border border-red-200 rounded-full shadow-sm">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
              <Text className="text-base md:text-lg font-semibold text-red-600">
                Thời gian ghi âm: {formatTime(recordingTime)}
              </Text>
            </div>
          </div>
        )}

        {/* Audio Waveform Card - Show after recording (only for existing mode) */}
        {mode === 'existing' && audioUrl && !isRecording && (
          <AudioWaveform
            audioUrl={audioUrl}
            isPlaying={isPlaying}
            onPlay={handlePlayPause}
            onPause={handlePlayPause}
          />
        )}

        {/* Recording Button (only for existing mode) */}
        {mode === 'existing' && !audioUrl && (
          <div className="flex flex-col items-center justify-center py-8 md:py-12 gap-6">
            <button
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              className={cn(
                "w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center text-white",
                "text-3xl md:text-4xl transition-all duration-300 transform hover:scale-110",
                "shadow-xl hover:shadow-2xl active:scale-95",
                isRecording
                  ? "bg-red-500 hover:bg-red-600 animate-pulse ring-4 ring-red-200"
                  : "bg-blue-600 hover:bg-blue-700 ring-4 ring-blue-200"
              )}
            >
              {isRecording ? <StopOutlined /> : <AudioOutlined />}
            </button>
            {!isRecording && (
              <Text className="text-sm text-gray-500 font-medium">
                Nhấn để bắt đầu ghi âm
              </Text>
            )}
          </div>
        )}

        {/* Control Buttons (only for existing mode) */}
        {mode === 'existing' && audioUrl && !isRecording && (
          <div className="flex flex-wrap justify-center gap-3 md:gap-4">
            <Button
              size="large"
              icon={<ReloadOutlined />}
              onClick={handleRetry}
              className="h-12 md:h-14 px-6 md:px-8 rounded-xl border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 font-semibold transition-all shadow-sm hover:shadow-md"
            >
              Thử lại
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<RightOutlined />}
              onClick={handleSaveRecording}
              loading={uploading}
              disabled={uploading}
              className="h-12 md:h-14 px-6 md:px-8 rounded-xl bg-blue-600 border-none hover:bg-blue-700 shadow-md hover:shadow-lg font-semibold transition-all"
            >
              {uploading ? 'Đang tải lên...' : 'Tiếp tục →'}
            </Button>
          </div>
        )}

        {/* Progress Indicator (only for existing mode) */}
        {mode === 'existing' && (
          <div className="text-center space-y-3 pt-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-100">
              <Text className="text-sm md:text-base font-medium text-blue-600">
                Đã ghi âm: <span className="font-bold">{recordings.length}/2</span>
              </Text>
            </div>
            <div className="w-full max-w-md mx-auto h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-500 rounded-full"
                style={{
                  width: `${(recordings.length / 2) * 100}%`
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecordingPage;
