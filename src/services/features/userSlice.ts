import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "@/services/constant/axiosInstance";
import {
  getSentences,
  getRecordings,
  Sentence,
  Recording as ApiRecording,
} from "./recordingSlice";

export interface UserInfo {
  name: string;
  gender: "male" | "female";
  guestId?: string;
}

export interface Recording {
  sentence: string;
  sentenceId?: string;
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

export interface AvailableSentence {
  SentenceID: string;
  Content: string;
  CreatedAt: string;
}

interface UserState {
  userInfo: UserInfo | null;
  recordings: Recording[];
  currentRecordingIndex: number;
  currentSentence: string;
  currentSentenceId: string | null;
  availableSentences: AvailableSentence[];
  isRecording: boolean;
  recordingTime: number;
  users: User[];
  usersLoading: boolean;
  usersError: string | null;
  creatingUser: boolean;
  createUserError: string | null;
  loadingSentences: boolean;
  sentencesError: string | null;
}

const initialState: UserState = {
  userInfo: null,
  recordings: [],
  currentRecordingIndex: 0,
  currentSentence: "",
  currentSentenceId: null,
  availableSentences: [],
  isRecording: false,
  recordingTime: 0,
  users: [],
  usersLoading: false,
  usersError: null,
  creatingUser: false,
  createUserError: null,
  loadingSentences: false,
  sentencesError: null,
};

// Async thunk to fetch users
export const fetchUsers = createAsyncThunk("user/fetchUsers", async () => {
  const response = await axiosInstance.get("users");
  return response.data;
});

// Async thunk to create user
export interface CreateUserRequest {
  name: string;
  gender: "male" | "female";
}

export interface CreateUserResponse {
  guestId: string;
  [key: string]: unknown; // For other potential response fields
}

export const createUser = createAsyncThunk(
  "user/createUser",
  async (userData: CreateUserRequest): Promise<CreateUserResponse> => {
    const response = await axiosInstance.post<CreateUserResponse>("users", {
      name: userData.name,
      gender: userData.gender === "male" ? "Male" : "Female", // Convert to capitalized format
    });
    return response.data;
  }
);

// Async thunk to fetch available sentences (sentences without completed recordings)
export const fetchAvailableSentences = createAsyncThunk(
  "user/fetchAvailableSentences",
  async (personId: string): Promise<AvailableSentence[]> => {
    // Fetch both sentences and recordings in parallel
    const [sentences, recordings] = await Promise.all([
      getSentences(),
      getRecordings(),
    ]);

    // Filter recordings for this person
    const userRecordings = recordings.filter(
      (rec: ApiRecording) => rec.PersonID === personId
    );

    // Get sentence IDs that have completed recordings (AudioUrl and IsApproved are NOT null)
    const completedSentenceIds = new Set(
      userRecordings
        .filter(
          (rec: ApiRecording) =>
            rec.AudioUrl !== null && rec.IsApproved !== null
        )
        .map((rec: ApiRecording) => rec.SentenceID)
    );

    // Filter sentences that don't have completed recordings
    // (either no recording exists, or recording exists but AudioUrl/IsApproved are null)
    const availableSentences = sentences.filter(
      (sentence: Sentence) => !completedSentenceIds.has(sentence.SentenceID)
    );

    // Only return first 2 sentences for user to record
    const limitedSentences = availableSentences.slice(0, 2);

    return limitedSentences.map((s: Sentence) => ({
      SentenceID: s.SentenceID,
      Content: s.Content,
      CreatedAt: s.CreatedAt,
    }));
  }
);

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUserInfo: (state, action: PayloadAction<UserInfo>) => {
      state.userInfo = action.payload;
    },
    setCurrentSentence: (state, action: PayloadAction<string>) => {
      state.currentSentence = action.payload;
    },
    setCurrentSentenceId: (state, action: PayloadAction<string | null>) => {
      state.currentSentenceId = action.payload;
    },
    setAvailableSentences: (
      state,
      action: PayloadAction<AvailableSentence[]>
    ) => {
      state.availableSentences = action.payload;
    },
    addRecording: (state, action: PayloadAction<Recording>) => {
      state.recordings.push(action.payload);
    },
    updateRecording: (
      state,
      action: PayloadAction<{ index: number; recording: Partial<Recording> }>
    ) => {
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
    resetUserState: () => initialState,
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
        state.usersError = action.error.message || "Failed to fetch users";
      })
      .addCase(createUser.pending, (state) => {
        state.creatingUser = true;
        state.createUserError = null;
      })
      .addCase(createUser.fulfilled, (state) => {
        state.creatingUser = false;
        // guestId will be set via setUserInfo action after API call
      })
      .addCase(createUser.rejected, (state, action) => {
        state.creatingUser = false;
        state.createUserError = action.error.message || "Failed to create user";
      })
      .addCase(fetchAvailableSentences.pending, (state) => {
        state.loadingSentences = true;
        state.sentencesError = null;
      })
      .addCase(fetchAvailableSentences.fulfilled, (state, action) => {
        state.loadingSentences = false;
        state.availableSentences = action.payload;
        // Set first available sentence as current if available
        if (action.payload.length > 0 && !state.currentSentence) {
          state.currentSentence = action.payload[0].Content;
          state.currentSentenceId = action.payload[0].SentenceID;
        }
      })
      .addCase(fetchAvailableSentences.rejected, (state, action) => {
        state.loadingSentences = false;
        state.sentencesError =
          action.error.message || "Failed to fetch available sentences";
      });
  },
});

export const {
  setUserInfo,
  setCurrentSentence,
  setCurrentSentenceId,
  setAvailableSentences,
  addRecording,
  updateRecording,
  setCurrentRecordingIndex,
  setIsRecording,
  setRecordingTime,
  resetRecordings,
  resetUserState,
} = userSlice.actions;

export default userSlice.reducer;
