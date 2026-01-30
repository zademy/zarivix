# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Native Web Audio API implementation for noise reduction (Highpass, Lowpass, Compressor).
- Fade-in/Fade-out envelope to prevent audio clipping artifacts.
- "Trim" functionality to clean transcription text automatically.
- Code of Conduct, Contributing guidelines, and Security policy.

### Changed

- Refactored `Recorder.tsx` to use fresh `RecordRTC` instances for each session (fixes empty audio bug).
- Switched default recording sample rate to 44.1kHz for better stability.
- Updated `audioSlice` to clear transcription text on new recording start.

### Removed

- Removed `electron` and `electron-builder` (project is now pure Web).
- Removed `rnnoise-wasm` (AI noise suppression) to reduce bundle size.
- Removed `ffmpeg` dependencies (replaced by native Web Audio API).
