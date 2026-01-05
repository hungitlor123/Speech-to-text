import { useEffect, useRef } from 'react';
import { PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons';

interface AudioWaveformProps {
    audioUrl: string | null;
    isPlaying: boolean;
    onPlay: () => void;
    onPause: () => void;
}

const AudioWaveform: React.FC<AudioWaveformProps> = ({ audioUrl, isPlaying, onPlay, onPause }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const dataArrayRef = useRef<Uint8Array | null>(null);

    useEffect(() => {
        if (!audioUrl) return;

        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const initAudioContext = async () => {
            try {
                const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
                const context = new AudioContextClass();
                const source = context.createMediaElementSource(audio);
                const analyserNode = context.createAnalyser();
                analyserNode.fftSize = 256;
                source.connect(analyserNode);
                analyserNode.connect(context.destination);

                const bufferLength = analyserNode.frequencyBinCount;
                const data = new Uint8Array(bufferLength);

                audioContextRef.current = context;
                analyserRef.current = analyserNode;
                dataArrayRef.current = data;
            } catch (error) {
                console.error('Error initializing audio context:', error);
            }
        };

        initAudioContext();

        audio.onended = () => {
            onPause();
        };

        const drawWaveform = () => {
            if (!canvas || !ctx) return;

            const width = canvas.width;
            const height = canvas.height;

            ctx.clearRect(0, 0, width, height);

            if (analyserRef.current && dataArrayRef.current) {
                const bufferLength = analyserRef.current.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);
                analyserRef.current.getByteFrequencyData(dataArray);

                ctx.fillStyle = '#1890FF';
                const barCount = 50;
                const barWidth = width / barCount;
                const spacing = 2;

                for (let i = 0; i < barCount; i++) {
                    const dataIndex = Math.floor((i / barCount) * dataArray.length);
                    const barHeight = (dataArray[dataIndex] / 255) * (height - 20) + 10;
                    const x = i * barWidth + spacing;
                    ctx.fillRect(x, height / 2 - barHeight / 2, barWidth - spacing * 2, barHeight);
                }
            } else {
                ctx.fillStyle = '#1890FF';
                const barCount = 50;
                const barWidth = width / barCount;
                const spacing = 2;

                for (let i = 0; i < barCount; i++) {
                    const barHeight = Math.random() * (height - 20) + 10;
                    const x = i * barWidth + spacing;
                    ctx.fillRect(x, height / 2 - barHeight / 2, barWidth - spacing * 2, barHeight);
                }
            }
        };

        const animate = () => {
            drawWaveform();
            if (isPlaying) {
                animationFrameRef.current = requestAnimationFrame(animate);
            }
        };

        if (isPlaying) {
            animate();
        } else {
            drawWaveform();
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            audio.pause();
            audio.currentTime = 0;
            if (audioContextRef.current) {
                audioContextRef.current.close().catch(console.error);
            }
        };
    }, [audioUrl, isPlaying, onPause]);

    return (
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
            <div className="flex items-center gap-4">
                <button
                    onClick={isPlaying ? onPause : onPlay}
                    className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl flex-shrink-0 transition-all duration-300 hover:scale-110 hover:shadow-lg active:scale-95 hover:bg-blue-700"
                >
                    {isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                </button>
                <canvas
                    ref={canvasRef}
                    width={400}
                    height={60}
                    className="w-full h-[60px] rounded-lg"
                />
            </div>
        </div>
    );
};

export default AudioWaveform;
