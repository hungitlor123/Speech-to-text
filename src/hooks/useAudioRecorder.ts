import { useState, useRef, useEffect } from "react";

interface UseAudioRecorderReturn {
  isRecording: boolean;
  recordingTime: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  mediaStream: MediaStream | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  resetRecording: () => void;
}

export const useAudioRecorder = (): UseAudioRecorderReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recorderRef = useRef<any | null>(null); // fallback recorder (RecordRTC) for iOS/Safari
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setMediaStream(stream);
      
      // Prefer native MediaRecorder when available and usable
      const canUseNative =
        typeof (window as any).MediaRecorder !== "undefined" &&
        (MediaRecorder as any).isTypeSupported
          ? (MediaRecorder as any).isTypeSupported("audio/webm;codecs=opus") ||
            (MediaRecorder as any).isTypeSupported("audio/webm")
          : typeof (window as any).MediaRecorder !== "undefined";

      if (canUseNative) {
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/webm",
          });
          setAudioBlob(audioBlob);
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);

          // Stop all tracks
          stream.getTracks().forEach((track) => track.stop());
          setMediaStream(null);
          streamRef.current = null;
          mediaRecorderRef.current = null;
        };

        mediaRecorder.start();
        setIsRecording(true);
        setRecordingTime(0);
      } else {
        // Fallback for iOS / browsers without MediaRecorder support
        try {
          const mod = await import("recordrtc");
          const RecordRTC = (mod && (mod as any).default) || mod;
          const recorder = new (RecordRTC as any)(stream, {
            type: "audio",
            mimeType: "audio/wav",
            // preferWebAudio allows using WebAudio to generate WAV which is more compatible
            recorderType: (RecordRTC as any).StereoAudioRecorder || undefined,
          });
          recorderRef.current = recorder;
          audioChunksRef.current = [];

          recorder.startRecording();
          setIsRecording(true);
          setRecordingTime(0);
        } catch (e) {
          console.error("Fallback recorder failed to load:", e);
          // If fallback import fails, stop tracks and rethrow so UI can show error
          stream.getTracks().forEach((track) => track.stop());
          setMediaStream(null);
          streamRef.current = null;
          throw e;
        }
      }

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      throw error;
    }
  };

  const stopRecording = () => {
    if (!isRecording) return;

    // If using native MediaRecorder
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // If using fallback recorder (RecordRTC)
    if (recorderRef.current) {
      try {
        const recorder = recorderRef.current;
        recorder.stopRecording(() => {
          const audioBlob = recorder.getBlob();
          setAudioBlob(audioBlob);
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);

          // Stop all tracks
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
          }
          setMediaStream(null);
          streamRef.current = null;
          recorderRef.current = null;
        });
      } catch (e) {
        console.error("Error stopping fallback recorder:", e);
      } finally {
        setIsRecording(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
      return;
    }
  };

  const resetRecording = () => {
    stopRecording();
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setMediaStream(null);
    setRecordingTime(0);
    audioChunksRef.current = [];
  };

  return {
    isRecording,
    recordingTime,
    audioBlob,
    audioUrl,
    mediaStream,
    startRecording,
    stopRecording,
    resetRecording,
  };
};
