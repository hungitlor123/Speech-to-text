import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from "@/services/constant/axiosInstance";

export interface UserInfo {
  name: string;
  gender: 'male' | 'female';
}

export interface Recording {
  sentence: string;
  audioBlob: Blob | null;
  audioUrl: string | null;
  duration: number;
}

export interface User {
  PersonID: string;
  Name: string;
  Gender: string;
  Role: string;
  CreatedAt: string;
}

interface UserState {
  userInfo: UserInfo | null;
  recordings: Recording[];
  currentRecordingIndex: number;
  currentSentence: string;
  isRecording: boolean;
  recordingTime: number;
  users: User[];
  usersLoading: boolean;
  usersError: string | null;
}

const initialState: UserState = {
  userInfo: null,
  recordings: [],
  currentRecordingIndex: 0,
  currentSentence: '',
  isRecording: false,
  recordingTime: 0,
  users: [],
  usersLoading: false,
  usersError: null,
};

// Async thunk to fetch users
export const fetchUsers = createAsyncThunk(
  'user/fetchUsers',
  async () => {
    const response = await axiosInstance.get('users');
    return response.data;
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserInfo: (state, action: PayloadAction<UserInfo>) => {
      state.userInfo = action.payload;
    },
    setCurrentSentence: (state, action: PayloadAction<string>) => {
      state.currentSentence = action.payload;
    },
    addRecording: (state, action: PayloadAction<Recording>) => {
      state.recordings.push(action.payload);
    },
    updateRecording: (state, action: PayloadAction<{ index: number; recording: Partial<Recording> }>) => {
      const { index, recording } = action.payload;
      if (state.recordings[index]) {
        state.recordings[index] = { ...state.recordings[index], ...recording };
      }
    },
    setCurrentRecordingIndex: (state, action: PayloadAction<number>) => {
      state.currentRecordingIndex = action.payload;
    },
    setIsRecording: (state, action: PayloadAction<boolean>) => {
      state.isRecording = action.payload;
    },
    setRecordingTime: (state, action: PayloadAction<number>) => {
      state.recordingTime = action.payload;
    },
    resetRecordings: (state) => {
      state.recordings = [];
      state.currentRecordingIndex = 0;
      state.isRecording = false;
      state.recordingTime = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.usersLoading = true;
        state.usersError = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.usersLoading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.usersLoading = false;
        state.usersError = action.error.message || 'Failed to fetch users';
      });
  },
});

export const {
  setUserInfo,
  setCurrentSentence,
  addRecording,
  updateRecording,
  setCurrentRecordingIndex,
  setIsRecording,
  setRecordingTime,
  resetRecordings,
} = userSlice.actions;

export default userSlice.reducer;

