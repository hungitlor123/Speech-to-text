import { useEffect, useRef, useState } from 'react';
import { PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons';
import WaveSurfer from 'wavesurfer.js';

interface AudioWaveformProps {
    audioUrl: string | null;
    isPlaying: boolean;
    onPlay: () => void;
    onPause: () => void;
}

const AudioWaveform: React.FC<AudioWaveformProps> = ({ audioUrl, isPlaying, onPlay, onPause }) => {
    const waveformRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const [duration, setDuration] = useState<number>(0);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [internalPlaying, setInternalPlaying] = useState(false);
    const onPlayRef = useRef(onPlay);
    const onPauseRef = useRef(onPause);

    // Update refs when callbacks change
    useEffect(() => {
        onPlayRef.current = onPlay;
        onPauseRef.current = onPause;
    }, [onPlay, onPause]);

    useEffect(() => {
        if (!audioUrl || !waveformRef.current) return;

        let isMounted = true;
        let wavesurfer: WaveSurfer | null = null;
        const abortController = new AbortController();

        // Create WaveSurfer instance
        try {
            wavesurfer = WaveSurfer.create({
                container: waveformRef.current,
                waveColor: '#93c5fd',
                progressColor: '#3b82f6',
                cursorColor: '#1e40af',
                barWidth: 3,
                barRadius: 3,
                barGap: 2,
                height: 100,
                normalize: true,
                interact: true,
                dragToSeek: true,
                backend: 'MediaElement', // Use MediaElement for better blob URL support
            });

            wavesurferRef.current = wavesurfer;

            // Event listeners
            const handleReady = () => {
                if (isMounted && wavesurfer) {
                    const duration = wavesurfer.getDuration();
                    setDuration(duration);
                }
            };

            const handlePlay = () => {
                if (isMounted) {
                    setInternalPlaying(true);
                    onPlayRef.current();
                }
            };

            const handlePause = () => {
                if (isMounted) {
                    setInternalPlaying(false);
                    onPauseRef.current();
                }
            };

            const handleFinish = () => {
                if (isMounted) {
                    setInternalPlaying(false);
                    onPause();
                }
            };

            const handleTimeUpdate = (time: number) => {
                if (isMounted) {
                    setCurrentTime(time);
                }
            };

            const handleError = () => {
                // Ignore abort errors (component unmounted during load)
                // These are expected and harmless
                // Silently ignore expected errors
            };

            // Remove any existing listeners first to avoid duplicates
            wavesurfer.unAll();

            // Register event listeners
            wavesurfer.on('ready', handleReady);
            wavesurfer.on('play', handlePlay);
            wavesurfer.on('pause', handlePause);
            wavesurfer.on('finish', handleFinish);
            wavesurfer.on('timeupdate', handleTimeUpdate);
            wavesurfer.on('error', handleError);

            // Load audio with error handling
            // For MediaElement backend, use regular load() which works well with blob URLs
            const loadPromise = wavesurfer.load(audioUrl);

            // Handle abort signal
            abortController.signal.addEventListener('abort', () => {
                if (wavesurfer) {
                    try {
                        if (wavesurfer.isPlaying()) {
                            wavesurfer.pause();
                        }
                    } catch {
                        // Ignore errors during abort
                    }
                }
            });

            loadPromise.catch(() => {
                // Ignore abort errors (component unmounted during load)
                // These are expected and harmless
                // Silently ignore expected errors
            });
        } catch {
            // Silently handle initialization errors
        }

        // Cleanup
        return () => {
            isMounted = false;
            abortController.abort();

            if (wavesurfer) {
                try {
                    // Remove all event listeners first
                    wavesurfer.unAll();
                    // Stop playback first
                    if (wavesurfer.isPlaying()) {
                        wavesurfer.pause();
                    }
                    // Destroy instance - this will cancel any pending load requests
                    wavesurfer.destroy();
                } catch {
                    // Silently ignore errors during cleanup (especially abort errors)
                    // These are expected when component unmounts during audio load
                }
                wavesurferRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [audioUrl]); // Remove onPlay and onPause from dependencies to prevent re-renders

    // Handle play/pause from parent (only sync, don't trigger play)
    // The button click handler will handle actual play/pause
    // This effect is mainly for syncing state
    useEffect(() => {
        if (!wavesurferRef.current) return;

        const wavesurfer = wavesurferRef.current;
        const isCurrentlyPlaying = wavesurfer.isPlaying();

        // Only sync if state is different (don't trigger play from here)
        // The button click will handle the actual play/pause
        if (isPlaying !== isCurrentlyPlaying && internalPlaying === isCurrentlyPlaying) {
            // State is out of sync, but don't auto-play/pause
            // Let the user control it via button
        }
    }, [isPlaying, internalPlaying]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (!audioUrl) {
        return null;
    }

    return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
                <button
                    onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        if (!wavesurferRef.current) {
                            return;
                        }

                        const wavesurfer = wavesurferRef.current;

                        // Prevent multiple rapid clicks
                        if (wavesurfer.isPlaying() === internalPlaying) {
                            // State is already correct, just toggle
                            if (wavesurfer.isPlaying()) {
                                wavesurfer.pause();
                            } else {
                                const duration = wavesurfer.getDuration();

                                if (duration > 0) {
                                    try {
                                        await wavesurfer.play();
                                    } catch (playError) {
                                        if (playError instanceof Error) {
                                            alert(`Không thể phát audio: ${playError.message}`);
                                        }
                                    }
                                } else {
                                    wavesurfer.once('ready', () => {
                                        wavesurfer.play().catch(() => {
                                            // Silently handle play errors
                                        });
                                    });
                                }
                            }
                        }
                    }}
                    className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl flex-shrink-0 transition-all duration-300 hover:scale-110 hover:shadow-lg active:scale-95 hover:bg-blue-700 shadow-md"
                >
                    {internalPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                </button>
                <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-700 mb-1">Nghe lại bản ghi</div>
                    <div className="text-xs text-gray-500">
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </div>
                </div>
            </div>
            <div
                ref={waveformRef}
                className="w-full rounded-lg bg-white/50 p-3"
            />
        </div>
    );
};

export default AudioWaveform;
