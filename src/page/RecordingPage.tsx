import React, { useState, useEffect, useRef } from 'react';
import { Button, Typography, Tag, Input, message, Spin } from 'antd';
import { BookOutlined, PlusOutlined, AudioOutlined, ReloadOutlined, RightOutlined, StopOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/services/store/store';
import { 
  setCurrentSentence, 
  setCurrentSentenceId,
  addRecording, 
  setCurrentRecordingIndex, 
  setIsRecording, 
  setRecordingTime,
  fetchAvailableSentences
} from '@/services/features/userSlice';
import { uploadRecording } from '@/services/features/recordingSlice';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import AudioWaveform from '@/components/AudioWaveform';
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
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const {
    isRecording,
    recordingTime,
    audioBlob,
    audioUrl,
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

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsPlaying(false);
      resetRecording();
    } catch (error: any) {
      console.error('Error uploading recording:', error);
      message.error('Không thể tải lên ghi âm. Vui lòng thử lại.');
    } finally {
      setUploading(false);
    }
  };

  const handleRetry = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    resetRecording();
  };

  const handlePlayPause = () => {
    if (audioUrl) {
      if (!audioRef.current) {
        audioRef.current = new Audio(audioUrl);
        audioRef.current.onended = () => setIsPlaying(false);
        audioRef.current.onpause = () => setIsPlaying(false);
      }

      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch((error) => {
          console.error('Error playing audio:', error);
          setIsPlaying(false);
        });
        setIsPlaying(true);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!userInfo) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white py-8 px-4 md:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3 py-4">
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
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-xs font-semibold tracking-[0.18em] text-blue-500 uppercase">
                  Câu của bạn
                </span>
                <span className="text-sm text-gray-500">
                  Nhập câu bạn muốn đọc sau đó bấm ghi âm
                </span>
              </div>
              <Tag
                color="blue"
                className="px-3 py-1.5 text-xs md:text-sm font-semibold rounded-full border-0 bg-blue-50 text-blue-600"
              >
                {recordings.length}/2 đã hoàn thành
              </Tag>
            </div>
            <Input.TextArea
              rows={3}
              placeholder="Nhập câu mà bạn muốn đọc..."
              value={customSentence}
              onChange={(e) => {
                const value = e.target.value;
                setCustomSentence(value);
                dispatch(setCurrentSentence(value));
              }}
              className="rounded-xl border-gray-300 hover:border-blue-400 focus:border-blue-500 focus:shadow-sm transition-all text-base"
            />
          </div>
        )}

        {/* Audio Waveform Card */}
        {audioUrl && (
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
            <AudioWaveform
              audioUrl={audioUrl}
              isPlaying={isPlaying}
              onPlay={handlePlayPause}
              onPause={handlePlayPause}
            />
          </div>
        )}

        {/* Recording Time */}
        {isRecording && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-red-50 border border-red-200 rounded-full">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
              <Text className="text-base md:text-lg font-semibold text-red-600">
                Thời gian ghi âm: {formatTime(recordingTime)}
              </Text>
            </div>
          </div>
        )}

        {/* Recording Button */}
        {!audioUrl && (
          <div className="flex justify-center py-12 md:py-16">
            <button
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              className={cn(
                "w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center text-white",
                "text-3xl md:text-4xl transition-all duration-300 transform hover:scale-110",
                "shadow-xl hover:shadow-2xl",
                isRecording
                  ? "bg-red-500 hover:bg-red-600 animate-pulse"
                  : "bg-blue-600 hover:bg-blue-700"
              )}
            >
              <AudioOutlined />
            </button>
          </div>
        )}

        {/* Control Buttons */}
        {audioUrl && (
          <div className="flex flex-wrap justify-center gap-3 md:gap-4">
            <Button
              size="large"
              icon={<ReloadOutlined />}
              onClick={handleRetry}
              className="h-11 md:h-12 px-5 md:px-6 rounded-xl border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 font-medium transition-all"
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
              className="h-11 md:h-12 px-5 md:px-6 rounded-xl bg-blue-600 border-none hover:bg-blue-700 shadow-md hover:shadow-lg font-medium transition-all"
            >
              {uploading ? 'Đang tải lên...' : 'Tiếp tục →'}
            </Button>
            {isRecording && (
              <Button
                danger
                size="large"
                icon={<StopOutlined />}
                onClick={handleStopRecording}
                className="h-11 md:h-12 px-5 md:px-6 rounded-xl font-medium"
              >
                Kết thúc ghi âm
              </Button>
            )}
          </div>
        )}

        {/* Progress Indicator */}
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
      </div>
    </div>
  );
};

export default RecordingPage;
