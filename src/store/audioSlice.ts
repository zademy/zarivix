import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { cleanAudioWithWebAudio } from '../utils/audioProcessing';
import { TranscriptionService } from '../services/transcriptionService';
import { HistoryService } from '../services/historyService';

// Define the state interface
export interface HistoryItem {
  id: string;
  text: string;
  timestamp: number;
  duration?: number;
  audioUrl?: string; // Optional: Base64 string for playback
}

export interface AudioState {
  isRecording: boolean;
  transcription: string;
  model: string;
  status: 'idle' | 'recording' | 'processing' | 'success' | 'error';
  errorMessage: string | null;
  history: HistoryItem[];
}

const initialState: AudioState = {
  isRecording: false,
  transcription: '',
  model: 'whisper-large-v3',
  status: 'idle',
  errorMessage: null,
  history: HistoryService.load(),
};

export const processAudio = createAsyncThunk(
  'audio/processAudio',
  async (audioBlob: Blob, { getState, rejectWithValue }) => {
    const state = getState() as { audio: AudioState };
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;

    if (!apiKey) {
      return rejectWithValue("API Key is missing");
    }

    // 1. Clean Audio (Web Audio API - DSP)
    let processedBlob = audioBlob;
    console.log("Starting Web Audio cleaning...");
    try {
      processedBlob = await cleanAudioWithWebAudio(audioBlob);
      console.log("Web Audio cleaning complete.");
    } catch (error) {
      console.error("Audio cleaning failed, proceeding with original:", error);
    }

    // 2. Save Audio (Base64 for local playback persistence)
    let audioUrl: string | undefined;
    try {
      // Strategy: Convert to Base64 to save in localStorage/state
      const reader = new FileReader();
      audioUrl = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(processedBlob);
      });
    } catch (e) {
      console.warn("Failed to convert audio to Base64", e);
    }

    // 3. Transcribe via Service
    try {
      const data = await TranscriptionService.transcribe(processedBlob, state.audio.model, apiKey);

      // Calculate duration for metrics
      // Bytes per second for WebM Opus at 320kbps: 320000 / 8 = 40000 bytes/sec
      const duration = processedBlob.size / 40000;

      return { text: data.text || "", audioUrl, duration };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Transcription failed";
      return rejectWithValue(message);
    }
  }
);

const audioSlice = createSlice({
  name: 'audio',
  initialState,
  reducers: {
    startRecording: (state) => {
      state.isRecording = true;
      state.status = 'recording';
      state.errorMessage = null;
      state.transcription = '';
    },
    stopRecording: (state) => {
      state.isRecording = false;
    },
    setModel: (state, action: PayloadAction<string>) => {
      state.model = action.payload;
    },
    clearTranscription: (state) => {
      state.transcription = '';
    },
    setTranscription: (state, action: PayloadAction<string>) => {
      state.transcription = action.payload;
    },
    addToHistory: (state, action: PayloadAction<HistoryItem>) => {
      state.history.unshift(action.payload);
      HistoryService.save(state.history);
    },
    deleteFromHistory: (state, action: PayloadAction<string>) => {
      state.history = state.history.filter(item => item.id !== action.payload);
      HistoryService.save(state.history);
    },
    clearHistory: (state) => {
      state.history = [];
      HistoryService.clear();
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(processAudio.pending, (state) => {
        state.status = 'processing';
        state.errorMessage = null;
      })
      .addCase(processAudio.fulfilled, (state, action) => {
        state.status = 'success';
        if (action.payload) {
          const { text, audioUrl, duration } = action.payload;
          const trimmedText = text.trim();

          state.transcription = trimmedText;

          const newItem: HistoryItem = {
            id: crypto.randomUUID(),
            text: trimmedText,
            timestamp: Date.now(),
            duration: duration || 0,
            audioUrl
          };

          state.history.unshift(newItem);
          HistoryService.save(state.history);
        }
      })
      .addCase(processAudio.rejected, (state, action) => {
        state.status = 'error';
        state.errorMessage = action.payload as string;
      });
  },
});

export const { startRecording, stopRecording, setModel, clearTranscription, setTranscription, addToHistory, deleteFromHistory, clearHistory } = audioSlice.actions;
export default audioSlice.reducer;
