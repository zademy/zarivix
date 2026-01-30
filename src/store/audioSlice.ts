import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';

// Define the state interface
export interface HistoryItem {
  id: string;
  text: string;
  timestamp: number;
  duration?: number;
  audioUrl?: string;
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
import { cleanAudioWithWebAudio } from '../utils/audioProcessing';


export const processAudio = createAsyncThunk(
  'audio/processAudio',
  async (audioBlob: Blob, { getState, rejectWithValue }) => {
    const state = getState() as { audio: AudioState };
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;

    if (!apiKey) {
      return rejectWithValue("API Key is missing");
    }

    // --- 0. Clean Audio (Web Audio API - DSP) ---
    // Using native filters (Highpass, Compressor) to improve quality without AI models.
    let processedBlob = audioBlob;
    console.log("Starting Web Audio cleaning...");
    try {
      processedBlob = await cleanAudioWithWebAudio(audioBlob);
      console.log("Web Audio cleaning complete.");
    } catch (error) {
      console.error("Audio cleaning failed, proceeding with original:", error);
    }

    // Convert processedBlob to audioUrl/base64 and use processedBlob for upload
    const blobToProcess = processedBlob;


    // --- 1. Save Audio (Base64 for local playback persistence) ---
    let audioUrl: string | undefined;

    try {
      // Strategy: Convert to Base64.
      // This allows saving small audio clips in localStorage.
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
      });
      reader.readAsDataURL(blobToProcess);
      audioUrl = await base64Promise;

    } catch (e) {
      console.warn("Failed to save audio", e);
    }
    // ------------------------------------------------------------------

    const formData = new FormData();
    formData.append("file", blobToProcess, "audio.wav");
    formData.append("model", state.audio.model);
    formData.append("language", "es"); // Force Spanish for better accuracy
    formData.append("temperature", "0"); // limit hallucinations
    // Fix for "Hola Hola" repetition: provide context prompt
    formData.append(
      "prompt",
      "Transcribe el audio en español de forma fiel. Elimina únicamente repeticiones accidentales inmediatas (por ejemplo 'hola hola') y ruidos evidentes. No reformules frases ni agregues contenido. Mantén la estructura original del discurso."
    );


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

      // Calculate duration before returning payload to appease Redux serializability
      // Bytes per second = 44100 * 2 (bytes) * 1 (channel) = 88200
      const duration = audioBlob.size / 88200;

      return { text: data.text || "", audioUrl, duration };
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
      // User request: Clear text box when starting new recording
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
          const { text: newText, audioUrl, duration } = action.payload;

          // User request: Remove leading spaces (Trim)
          const trimmedText = newText.trim();

          // Since we clear on start, we just set the new text.
          // However, if we revert to appending later, we keep the space logic but ensure it's trimmed.
          state.transcription = trimmedText;

          // Add to history automatically
          const newItem: HistoryItem = {
            id: crypto.randomUUID(),
            text: trimmedText,
            timestamp: Date.now(),
            duration: duration || 0,
            audioUrl // Save the base64 url
          };
          state.history.unshift(newItem);
          // Limit history to last 10 items to prevent localStorage overflow with base64
          if (state.history.length > 10) {
            state.history = state.history.slice(0, 10);
          }
          try {
            localStorage.setItem('transcriptionHistory', JSON.stringify(state.history));
          } catch (e) {
            console.error("Storage full", e);
            // Fallback: Remove audio from the item/s and try again
            // For now, just don't save to LS if it fails
          }
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
