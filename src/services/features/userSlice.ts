import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "@/services/constant/axiosInstance";
import {
  getSentences,
  getRecordingsByPersonId,
  Sentence,
} from "./recordingSlice";

export interface UserInfo {
  email: string;
  gender: "male" | "female";
  userId?: string;
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
  Email: string;
  Gender: string;
  Role?: string;
  CreatedAt: string;
  SentencesDone?: Array<{
    SentenceID: string;
    Content: string;
  }>;
  TotalRecordingDuration?: number;
  TotalSentencesDone?: number;
  TotalContributedByUser?: number;
  CreatedSentences?: Array<{
    SentenceID: string;
    Content: string;
    Status: number;
    CreatedAt: string;
  }>;
}

export interface TopContributor {
  userEmail: string;
  userId: string | null;
  totalSentences: number;
  
  status1Count: number;
  status2Count: number;
  status3Count: number;
  createdAt: string | null;
  RecordedSentences?: Array<{
    SentenceID: string;
    Content: string;
    RecordingCount: number;
    ApprovedCount: number;
  }>;
  RecordingTotalCount?: number;
}

export interface AvailableSentence {
  SentenceID: string;
  Content: string;
  CreatedAt: string;
  Status: number;
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
  deletingUser: boolean;
  deleteUserError: string | null;
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
  deletingUser: false,
  deleteUserError: null,
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
  email: string;
  gender: "male" | "female";
}

export interface CreateUserResponse {
  userId: string;
  [key: string]: unknown; // For other potential response fields
}

export const createUser = createAsyncThunk(
  "user/createUser",
  async (userData: CreateUserRequest): Promise<CreateUserResponse> => {
    const response = await axiosInstance.post<CreateUserResponse>("users", {
      email: userData.email,
      gender: userData.gender === "male" ? "Male" : "Female", // Convert to capitalized format
    });
    return response.data;
  }
);
export const deleteUser = createAsyncThunk(
  "user/deleteUser",
  async (personId: string): Promise<{ personId: string }> => {
    await axiosInstance.delete(`users/${personId}`);
    return { personId };
  }
);

export const fetchTopContributors = createAsyncThunk(
  "user/fetchTopContributors",
  async (): Promise<TopContributor[]> => {
    const response = await axiosInstance.get<{ filter: any; count: number; data: TopContributor[] }>("users/top-sentence-contributors");
    return response.data.data || [];
  }
);

// Async thunk to fetch available sentences (sentences with status === 1)
// Filters out sentences that the user has already recorded
export const fetchAvailableSentences = createAsyncThunk(
  "user/fetchAvailableSentences",
  async (personId: string): Promise<AvailableSentence[]> => {
    try {
      // Fetch sentences
      const sentences = await getSentences();

      // Filter sentences with status === 1 (Được duyệt - có thể đi voice)
      const approvedSentences = sentences.filter(
        (sentence: Sentence) => sentence.Status === 1
      );

      // If personId is provided, filter out sentences that user has already recorded
      let availableSentences = approvedSentences;
      if (personId) {
        try {
          const userRecordings = await getRecordingsByPersonId(personId);
          
          const recordedSentenceIds = new Set(
            userRecordings.map((recording) => recording.SentenceID)
          );
          
          // Filter out sentences that have been recorded by this user
          availableSentences = approvedSentences.filter(
            (sentence) => !recordedSentenceIds.has(sentence.SentenceID)
          );
        } catch (error) {
          console.error("Error fetching user recordings:", error);
          // If error occurs, return all approved sentences as fallback
        }
      }

      // Randomly shuffle and return available sentences
      const shuffled = [...availableSentences].sort(() => Math.random() - 0.5);

      return shuffled.map((s: Sentence) => ({
        SentenceID: s.SentenceID,
        Content: s.Content,
        CreatedAt: s.CreatedAt,
        Status: s.Status,
      }));
    } catch (error) {
      console.error("Error in fetchAvailableSentences:", error);
      throw error;
    }
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
        state.users = Array.isArray(action.payload) ? action.payload : (action.payload?.data || []);
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
        // userId will be set via setUserInfo action after API call
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
      })
      .addCase(deleteUser.pending, (state) => {
        state.deletingUser = true;
        state.deleteUserError = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.deletingUser = false;
        // Remove deleted user from the list
        state.users = state.users.filter(
          (user) => user.PersonID !== action.payload.personId
        );
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.deletingUser = false;
        state.deleteUserError = action.error.message || "Failed to delete user";
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
