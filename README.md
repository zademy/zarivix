# Zarivix Dictation

**Zarivix** is a high-performance web-based voice dictation application built with React, Vite, and TypeScript. It leverages the browser's native capabilities to record, process, and transcribe audio with professional quality, optimized specifically for Spanish language transcription.

## 🚀 Features

- **High-Quality Recording:** 44.1kHz PCM recording using `RecordRTC`
- **Real-time Audio Processing:** Native Web Audio API pipeline:
  - **Highpass Filter (100Hz):** Removes rumble and unwanted low frequencies
  - **Lowpass Filter (8kHz):** Reduces hiss and high-frequency noise
  - **Dynamics Compressor:** Balances volume levels
  - **Enveloping:** Fade-in/out to prevent clicking artifacts
- **AI Transcription:** Integration with Groq/Whisper V3 for near-instant, high-accuracy transcription
- **Spanish Optimized:** Specialized configuration for Spanish transcription with custom prompts
- **Intuitive Interface:** Minimalist design with history management and model selection
- **History Management:** Local storage of transcriptions with metadata
- **Keyboard Controls:** Support for keyboard shortcuts (Ctrl+Space / Opt+Space)

## 🛠 Tech Stack

- **Framework:** React 19 + Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **State Management:** Redux Toolkit
- **Audio:** RecordRTC + Web Audio API
- **Transcription:** Groq API (Whisper V3)

## 🏗 Architecture

### Core Components

- **App:** Main application component with layout structure
- **Recorder:** Logical component that attaches keyboard listeners (renders nothing)
- **ModelSelector:** Dropdown for selecting transcription models with rate limit info
- **TranscriptionDisplay:** Editable textarea for transcription output with auto-scroll
- **HistorySidebar:** Collapsible sidebar with transcription history and audio playback
- **StatusMessage:** Dynamic status indicators with keyboard shortcut hints

### Services

- **TranscriptionService:** Groq API communication for audio transcription
- **HistoryService:** Persistent local history management

### Custom Hooks

- **useAudioRecorder:** Complete audio recording flow management with keyboard controls

### State Management (Redux Toolkit)

- **audioSlice:** Global state for recording, transcription, history, and UI status

## 📦 Installation

Clone the repository:

```bash
git clone https://github.com/zademy/zarivix.git
cd zarivix
```

Install dependencies:

```bash
npm install
```

## 🔧 Configuration & Usage

1. **Configure API Key:**
   Create a `.env` file in the root directory:

   ```env
   VITE_GROQ_API_KEY=your_groq_api_key_here
   ```

2. **Start Development Server:**

   ```bash
   npm run dev
   ```

3. **Build for Production:**

   ```bash
   npm run build
   ```

4. **Preview Production Build:**
   ```bash
   npm run preview
   ```

## 🎮 Application Usage

1. **Select Model:** Choose between Whisper models (large-v3, large-v3-turbo)
2. **Record Audio:** Hold Ctrl+Space (Windows/Linux) or Opt+Space (Mac) to record
3. **Automatic Transcription:** Audio is processed and transcribed automatically
4. **View History:** Access previous transcriptions from the sidebar
5. **Manage Results:** Edit, copy, or delete transcriptions as needed

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint for code review

## 🔍 Technical Specifications

### Audio Processing

- Sample Rate: 44.1kHz
- Format: PCM/WAV
- Real-time processing with Web Audio API
- Human voice optimization

### Transcription

- Models: Whisper Large V3 and variants
- Language: Spanish (forced by default)
- Temperature: 0 (limits hallucinations)
- Custom Spanish prompt for accuracy

### Storage

- Local history in localStorage
- Timestamp and duration metadata
- Optional: base64 audio storage for playback

## 📊 UI/UX Features

- **Responsive Design:** Mobile-friendly interface
- **Dark Sidebar:** History panel with gray-900 theme
- **Status Indicators:** Real-time feedback with animations
- **Keyboard Shortcuts:** Cross-platform modifier key detection
- **Auto-scroll:** Textarea automatically scrolls to new content
- **Confirmation Dialogs:** Safe deletion with user confirmation

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.adoc](CONTRIBUTING.adoc) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 🔒 Security

For security concerns, please refer to [SECURITY.md](SECURITY.md).

## 📝 Development Notes

- Application is specifically optimized for Spanish transcription
- Requires valid Groq API key for functionality
- Audio processing is performed entirely in-browser
- No audio data stored on external servers (only transcriptions)
- Recorder component is logical-only (renders null, attaches listeners)
- History supports optional audio URL storage for playback
