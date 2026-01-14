import axiosInstance from "@/services/constant/axiosInstance";

export interface Sentence {
  SentenceID: string;
  Content: string;
  CreatedAt: string;
  Status: number;
}

export interface Recording {
  RecordingID: string;
  PersonID: string;
  SentenceID: string;
  AudioUrl: string | null;
  IsApproved: number | boolean | null;
  RecordedAt: string;
  Status?: number;
}

export const getSentences = async (): Promise<Sentence[]> => {
  try {
    const response = await axiosInstance.get("sentences");
    const data = response.data;
    // Handle both direct array and nested data structure
    if (Array.isArray(data)) {
      return data;
    } else if (data?.data && Array.isArray(data.data)) {
      return data.data;
    }
    console.warn('Unexpected data format from getSentences:', data);
    return [];
  } catch (error: any) {
    console.error('Error fetching sentences:', error);
    return [];
  }
};

export const getRecordings = async (): Promise<Recording[]> => {
  try {
    const response = await axiosInstance.get("recordings");
    const data = response.data;
    // Handle both direct array and nested data structure
    if (Array.isArray(data)) {
      return data;
    } else if (data?.data && Array.isArray(data.data)) {
      return data.data;
    }
    console.warn('Unexpected data format from getRecordings:', data);
    return [];
  } catch (error: any) {
    console.error('Error fetching recordings:', error);
    return [];
  }
};

export const getRecordingsByStatus = async (status: number): Promise<Recording[]> => {
  try {
    const response = await axiosInstance.get<{ isApproved: number; count: number; data: Recording[] }>(`recordings/status/${status}`);
    return Array.isArray(response.data.data) ? response.data.data : [];
  } catch (error: any) {
    console.error('Error fetching recordings by status:', error);
    return [];
  }
};

export interface UploadRecordingResponse {
  success: boolean;
  message: string;
  data: {
    personId: string;
    sentenceId: string;
    audioUrl: string;
    isApproved: boolean;
    recordedAt: string;
    _id: string;
    __v: number;
  };
}

export const uploadRecording = async (
  audioBlob: Blob,
  personId: string,
  sentenceId: string
): Promise<UploadRecordingResponse> => {
  try {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('personId', personId);
    formData.append('sentenceId', sentenceId);

    const response = await axiosInstance.post<UploadRecordingResponse>("recordings", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { message: "Upload failed" };
  }
};

// CRUD operations for Sentences
export const createSentence = async (content: string): Promise<Sentence> => {
  try {
    const response = await axiosInstance.post<Sentence>("sentences", { content });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { message: "Create sentence failed" };
  }
};

export const updateSentence = async (sentenceId: string, content: string): Promise<Sentence> => {
  try {
    const response = await axiosInstance.put<Sentence>(`sentences/${sentenceId}`, { content });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { message: "Update sentence failed" };
  }
};

export const deleteSentence = async (sentenceId: string): Promise<void> => {
  try {
    await axiosInstance.delete(`sentences/${sentenceId}`);
  } catch (error: any) {
    throw error.response?.data || { message: "Delete sentence failed" };
  }
};

// Approve/Reject Sentence
export const approveSentence = async (sentenceId: string): Promise<Sentence> => {
  try {
    const response = await axiosInstance.patch<Sentence>(`sentences/${sentenceId}/approve`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { message: "Approve sentence failed" };
  }
};

export const rejectSentence = async (sentenceId: string): Promise<Sentence> => {
  try {
    const response = await axiosInstance.patch<Sentence>(`sentences/${sentenceId}/reject`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { message: "Reject sentence failed" };
  }
};

// Approve/Reject Recording
export const approveRecording = async (recordingId: string): Promise<Recording> => {
  try {
    const response = await axiosInstance.patch<Recording>(`recordings/${recordingId}/approve`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { message: "Approve recording failed" };
  }
};

export const rejectRecording = async (recordingId: string): Promise<Recording> => {
  try {
    const response = await axiosInstance.patch<Recording>(`recordings/${recordingId}/reject`);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { message: "Reject recording failed" };
  }
};

// Create user sentence
export interface CreateUserSentenceRequest {
  name: string;
  content: string;
}

export interface CreateUserSentenceResponse {
  message: string;
  data: Array<{
    content: string;
    status: number;
    _id: string;
    __v: number;
    createdAt: string;
  }>;
}

export const createUserSentence = async (
  request: CreateUserSentenceRequest
): Promise<CreateUserSentenceResponse> => {
  try {
    const response = await axiosInstance.post<CreateUserSentenceResponse>(
      "sentences/user",
      request
    );
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { message: "Create user sentence failed" };
  }
};
// Download sentences with audio
export interface DownloadSentencesParams {
  mode?: 'with-audio' | 'without-audio' | 'all' | 'approved';
  status?: number;
  limit?: number;
}

export const downloadSentences = async (
  params?: DownloadSentencesParams
): Promise<Blob> => {
  try {
    const response = await axiosInstance.get<Blob>("sentences/download", {
      params: {
        mode: params?.mode || 'with-audio',
        status: params?.status,
        limit: params?.limit,
      },
      responseType: 'blob',
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { message: "Download sentences failed" };
  }
};

// Get top recorders
export interface TopRecorder {
  userId: string;
  name: string;
  gender: string;
  totalRecordings: number;
  approvedRecordings?: number;
  pendingRecordings?: number;
  rejectedRecordings?: number;
  createdAt: string;
}

export interface TopRecordersResponse {
  filter: {
    status: number | null;
    limit: number;
  };
  count: number;
  data: TopRecorder[];
}

export interface TopRecordersParams {
  status?: number;
  limit?: number;
}

export const getTopRecorders = async (
  params?: TopRecordersParams
): Promise<TopRecorder[]> => {
  try {
    const response = await axiosInstance.get<TopRecordersResponse>("users/top-recorders", {
      params: {
        status: params?.status,
        limit: params?.limit || 6,
      },
    });
    return response.data.data || [];
  } catch (error: any) {
    console.error('Error fetching top recorders:', error);
    return [];
  }
};