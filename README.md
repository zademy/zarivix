# Zarivix Dictado

**Zarivix** is a high-performance, web-based voice transcription application built with React, Vite, and TypeScript. It leverages the browser's native capabilities to record, process, and transcribe audio with professional quality.

## 🚀 Features

- **High-Quality Recording:** Utilizes 44.1kHz PCM recording with `RecordRTC`.
- **Real-time Audio Processing:** Native Web Audio API pipeline:
  - **Highpass Filter (100Hz):** Removes rumble.
  - **Lowpass Filter (8kHz):** Reduces hiss.
  - **Dynamics Compressor:** Balances volume levels.
  - **Enveloping:** Fade-in/out to prevent clicking artifacts.
- **AI Transcription:** Integration with Groq/Whisper V3 for near-instant, high-accuracy transcription.
- **Clean UI:** Minimalist interface with auto-trimming and history management.

## 🛠 Tech Stack

- **Framework:** React 19 + Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **State Management:** Redux Toolkit
- **Audio:** RecordRTC + Web Audio API

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

## 🔧 Usage

1.  **Configure API Key:**
    Create a `.env` file in the root directory:

    ```env
    VITE_GROQ_API_KEY=your_groq_api_key_here
    ```

2.  **Start Development Server:**

    ```bash
    npm run dev
    ```

3.  **Build for Production:**
    ```bash
    npm run build
    ```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.adoc](CONTRIBUTING.adoc) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 🔒 Security

For security concerns, please refer to [SECURITY.md](SECURITY.md).
