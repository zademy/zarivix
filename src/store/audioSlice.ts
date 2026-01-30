import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';

// Define the state interface
export interface HistoryItem {
  id: string;
  text: string;
  timestamp: number;
}

export interface AudioState {
  isRecording: boolean;
  transcription: string;
  model: string;
  status: 'idle' | 'recording' | 'processing' | 'success' | 'error';
  errorMessage: string | null;
  history: HistoryItem[];
}

// Load history from localStorage
const loadHistory = (): HistoryItem[] => {
  try {
    const serialized = localStorage.getItem('transcriptionHistory');
    return serialized ? JSON.parse(serialized) : [];
  } catch (e) {
    console.error("Failed to load history", e);
    return [];
  }
};

const initialState: AudioState = {
  isRecording: false,
  transcription: '',
  model: 'whisper-large-v3', // Default model
  status: 'idle',
  errorMessage: null,
  history: loadHistory(),
};

// Async thunk for processing audio with Groq
export const processAudio = createAsyncThunk(
  'audio/processAudio',
  async (audioBlob: Blob, { getState, rejectWithValue }) => {
    const state = getState() as { audio: AudioState };
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;

    if (!apiKey) {
      return rejectWithValue("API Key is missing");
    }

    const formData = new FormData();
    formData.append("file", audioBlob, "audio.webm");
    formData.append("model", state.audio.model);
    formData.append("language", "es"); // Force Spanish for better accuracy
    formData.append("temperature", "0"); // limit hallucinations
    // Fix for "Hola Hola" repetition: provide context prompt
    formData.append("prompt", "Transcripción exacta del audio en español. Evita repeticiones.");

    try {
      const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        const errData = await response.json();
        return rejectWithValue(errData.error?.message || "Error traversing Groq API");
      }

      const data = await response.json();
      return data.text || "";
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Network error";
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
        localStorage.setItem('transcriptionHistory', JSON.stringify(state.history));
    },
    deleteFromHistory: (state, action: PayloadAction<string>) => {
        state.history = state.history.filter(item => item.id !== action.payload);
        localStorage.setItem('transcriptionHistory', JSON.stringify(state.history));
    },
    clearHistory: (state) => {
        state.history = [];
        localStorage.removeItem('transcriptionHistory');
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
            const newText = action.payload;
            // Add a space if there is already text
            state.transcription += (state.transcription ? " " : "") + newText;
            
            // Add to history automatically
            const newItem: HistoryItem = {
                id: crypto.randomUUID(),
                text: newText,
                timestamp: Date.now()
            };
            state.history.unshift(newItem);
            localStorage.setItem('transcriptionHistory', JSON.stringify(state.history));
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
