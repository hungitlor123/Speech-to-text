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
    AudioUrl?: string;
    Duration?: number;
    RecordedAt?: string;
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
  // Raw API fields (kept for clarity)
  PersonID?: string;
  Email?: string;

  // Raw API fields for mapping
  TotalRecordings?: number;
  TotalSentenceContributions?: number;
  Recordings?: Array<{ SentenceID: string; Content: string; Duration?: number; RecordedAt?: string; AudioUrl?: string }>;

  // Mapped fields used by UI
  userEmail?: string;
  userId?: string | null;
  totalSentences?: number; // mapped from TotalSentencesDone
  TotalSentencesDone?: number;
  TotalContributedByUser?: number;
  TotalContributedApproved?: number;

  status1Count?: number;
  status2Count?: number;
  status3Count?: number;
  createdAt?: string | null;
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
  usersTotal: number;
  usersPage: number;
  usersLimit: number;
  usersTotalPages: number;
  usersTotalContributedSentences: number;
  usersTotalMale: number;
  usersTotalFemale: number;
  usersTotalCompletedSentences: number;
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
  usersTotal: 0,
  usersPage: 1,
  usersLimit: 10,
  usersTotalPages: 0,
  usersTotalContributedSentences: 0,
  usersTotalMale: 0,
  usersTotalFemale: 0,
  usersTotalCompletedSentences: 0,
  usersLoading: false,
  usersError: null,
  creatingUser: false,
  createUserError: null,
  deletingUser: false,
  deleteUserError: null,
  loadingSentences: false,
  sentencesError: null,
};

// Async thunk to fetch users with pagination
export interface FetchUsersParams {
  page?: number;
  limit?: number;
}

export interface FetchUsersResponse {
  users: User[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  totalContributedSentences: number;
  totalMale: number;
  totalFemale: number;
  totalCompletedSentences: number;
}

export const fetchUsers = createAsyncThunk<
  FetchUsersResponse,
  FetchUsersParams | undefined
>("user/fetchUsers", async (params) => {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 10;

  const response = await axiosInstance.get("users", {
    params: { page, limit },
  });
  const data = response.data;

  const rawDataArray: unknown[] = Array.isArray(data)
    ? data
    : (data && Array.isArray((data as { data?: unknown[] }).data)
        ? (data as { data: unknown[] }).data
        : []);

  // Map API fields to User interface fields
  const items: User[] = rawDataArray.map((item: unknown) => {
    const rawItem = item as {
      PersonID?: string;
      Email?: string;
      Gender?: string;
      Role?: string;
      CreatedAt?: string;
      TotalRecordings?: number;
      TotalRecordingDuration?: number;
      TotalSentenceContributions?: number;
      Recordings?: Array<{ SentenceID: string; Content: string; Duration?: number; RecordedAt?: string; AudioUrl?: string }>;
      SentenceContributions?: Array<{ SentenceID: string; Content: string; Status: number; CreatedAt: string }>;
      SentencesDone?: Array<{ SentenceID: string; Content: string }>;
      CreatedSentences?: Array<{ SentenceID: string; Content: string; Status: number; CreatedAt: string }>;
    };
    return {
      PersonID: rawItem.PersonID ?? '',
      Email: rawItem.Email ?? '',
      Gender: rawItem.Gender ?? '',
      Role: rawItem.Role,
      CreatedAt: rawItem.CreatedAt ?? '',
      TotalRecordingDuration: rawItem.TotalRecordingDuration,
      TotalSentencesDone: rawItem.TotalRecordings, // Map TotalRecordings -> TotalSentencesDone
      TotalContributedByUser: rawItem.TotalSentenceContributions, // Map TotalSentenceContributions -> TotalContributedByUser
      // Map Recordings -> SentencesDone (câu đã làm/đã ghi âm)
      SentencesDone: rawItem.Recordings?.map((r) => ({
        SentenceID: r.SentenceID,
        Content: r.Content,
        AudioUrl: r.AudioUrl,
        Duration: r.Duration,
        RecordedAt: r.RecordedAt,
      })) ?? rawItem.SentencesDone ?? [],
      // Map SentenceContributions -> CreatedSentences (câu đóng góp)
      CreatedSentences: rawItem.SentenceContributions?.map((s) => ({
        SentenceID: s.SentenceID,
        Content: s.Content,
        Status: s.Status,
        CreatedAt: s.CreatedAt,
      })) ?? rawItem.CreatedSentences ?? [],
    };
  });

  return {
    users: items,
    totalCount: (data as { totalCount?: number })?.totalCount ?? items.length,
    totalPages: (data as { totalPages?: number })?.totalPages ?? 1,
    currentPage: (data as { currentPage?: number })?.currentPage ?? page,
    limit: (data as { limit?: number })?.limit ?? limit,
    totalContributedSentences:
      (data as { totalContributedSentences?: number })?.totalContributedSentences ?? 0,
    totalMale: (data as { totalMale?: number })?.totalMale ?? 0,
    totalFemale: (data as { totalFemale?: number })?.totalFemale ?? 0,
    totalCompletedSentences:
      (data as { totalCompletedSentences?: number })?.totalCompletedSentences ?? 0,
  };
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
    // Backwards-compatible: if called without params, fetch first page (server default)
    const response = await axiosInstance.get("users");
    const payload: { data?: TopContributor[] } | TopContributor[] = response.data;

    // Normalize to an array of items
    const items: TopContributor[] = Array.isArray(payload)
      ? payload
      : (payload && Array.isArray(payload.data) ? payload.data : []);

    return items.map((item) => ({
      PersonID: item.PersonID ?? undefined,
      Email: item.Email ?? undefined,
      userEmail: item.Email ?? item.userEmail ?? "Ẩn danh",
      userId: item.PersonID ?? item.userId ?? null,
      // Use API fields requested by user:
      // - Số câu ghi âm <- TotalRecordings
      // - Số câu đóng góp <- TotalSentenceContributions
      RecordingTotalCount: Number(item.TotalRecordings ?? item.TotalSentencesDone ?? item.Recordings?.length ?? 0),
      totalSentences: Number(item.TotalSentenceContributions ?? item.TotalContributedByUser ?? item.totalSentences ?? 0),
      TotalSentencesDone: Number(item.TotalRecordings ?? item.TotalSentencesDone ?? 0),
      TotalContributedByUser: Number(item.TotalSentenceContributions ?? item.TotalContributedByUser ?? 0),
      TotalContributedApproved: Number(item.TotalContributedByUser ?? 0),
      // Set 'Đã duyệt' the same as TotalSentenceContributions per request
      status1Count: Number(item.TotalSentenceContributions ?? item.TotalContributedByUser ?? item.TotalContributedApproved ?? item.status1Count ?? 0),
      status2Count: Number(item.status2Count ?? 0),
      status3Count: Number(item.status3Count ?? 0),
      createdAt: item.createdAt ?? null,
      RecordedSentences: item.RecordedSentences ?? item.RecordedSentences,
    }));
  }
);

// New thunk: fetch top contributors with pagination metadata
export interface FetchTopContributorsParams {
  page?: number;
  limit?: number;
}

export interface FetchTopContributorsResponse {
  items: TopContributor[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export const fetchTopContributorsPaginated = createAsyncThunk<
  FetchTopContributorsResponse,
  FetchTopContributorsParams | undefined
>("user/fetchTopContributorsPaginated", async (params) => {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  const response = await axiosInstance.get("users", { params: { page, limit } });
  const data = response.data;

  const rawArray: unknown[] = Array.isArray(data)
    ? data
    : (data && Array.isArray((data as { data?: unknown[] }).data)
      ? (data as { data: unknown[] }).data
      : []);

  const items: TopContributor[] = rawArray.map((item: unknown) => {
    const it = item as any;
    return {
      PersonID: it.PersonID ?? undefined,
      Email: it.Email ?? undefined,
      userEmail: it.Email ?? it.userEmail ?? "Ẩn danh",
      userId: it.PersonID ?? it.userId ?? null,
      RecordingTotalCount: Number(it.TotalRecordings ?? it.TotalSentencesDone ?? it.Recordings?.length ?? 0),
      totalSentences: Number(it.TotalSentenceContributions ?? it.TotalContributedByUser ?? it.totalSentences ?? 0),
      TotalSentencesDone: Number(it.TotalRecordings ?? it.TotalSentencesDone ?? 0),
      TotalContributedByUser: Number(it.TotalSentenceContributions ?? it.TotalContributedByUser ?? 0),
      TotalContributedApproved: Number(it.TotalContributedByUser ?? 0),
      status1Count: Number(it.TotalSentenceContributions ?? it.TotalContributedByUser ?? it.TotalContributedApproved ?? it.status1Count ?? 0),
      status2Count: Number(it.status2Count ?? 0),
      status3Count: Number(it.status3Count ?? 0),
      createdAt: it.createdAt ?? null,
      RecordedSentences: it.RecordedSentences ?? [],
    } as TopContributor;
  });

  return {
    items,
    totalCount: (data as { totalCount?: number })?.totalCount ?? items.length,
    totalPages: (data as { totalPages?: number })?.totalPages ?? 1,
    currentPage: (data as { currentPage?: number })?.currentPage ?? page,
    limit: (data as { limit?: number })?.limit ?? limit,
  };
});

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
        state.users = action.payload.users;
        state.usersTotal = action.payload.totalCount;
        state.usersPage = action.payload.currentPage;
        state.usersLimit = action.payload.limit;
        state.usersTotalPages = action.payload.totalPages;
        state.usersTotalContributedSentences = action.payload.totalContributedSentences;
        state.usersTotalMale = action.payload.totalMale;
        state.usersTotalFemale = action.payload.totalFemale;
        state.usersTotalCompletedSentences = action.payload.totalCompletedSentences;
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
