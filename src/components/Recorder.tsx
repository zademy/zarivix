import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import RecordRTC from "recordrtc";
import type { AppDispatch, RootState } from "../store/store";
import {
  startRecording,
  stopRecording,
  processAudio,
} from "../store/audioSlice";

const Recorder: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isRecording } = useSelector((state: RootState) => state.audio);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<RecordRTC | null>(null);

  useEffect(() => {
    // Request permissions on mount with explicit constraints
    navigator.mediaDevices
      .getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 44100,
          sampleSize: 16,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      })
      .then((stream) => {
        streamRef.current = stream;
        console.log("Microphone access granted");
      })
      .catch((err) => {
        console.error("Error accessing microphone:", err);
      });

    return () => {
      // Cleanup stream on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    const isMac = navigator.userAgent.toLowerCase().includes("mac");

    const handleKeyDown = (event: KeyboardEvent) => {
      let shouldStart = false;

      if (isMac) {
        // macOS: Alt (Option) + Space
        if (event.altKey && event.code === "Space") {
          shouldStart = true;
        }
      } else if (event.ctrlKey && event.code === "Space") {
        // Windows/Linux: Ctrl + Space
        shouldStart = true;
      }

      if (shouldStart) {
        event.preventDefault(); // Prevent scrolling

        if (!isRecording && streamRef.current) {
          // Create a fresh recorder instance for every session
          // This prevents issues with stale state or appending to previous recordings
          const recorder = new RecordRTC(streamRef.current, {
            type: "audio",
            mimeType: "audio/wav",
            recorderType: RecordRTC.StereoAudioRecorder,
            numberOfAudioChannels: 1,
            desiredSampRate: 44100, // Standard CD Quality (often more stable than 48k)
            timeSlice: 0,
            bufferSize: 16384,
          });

          recorderRef.current = recorder;
          recorder.startRecording();
          dispatch(startRecording());
        }
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      // Check for key release
      let shouldStop = false;

      if (
        event.code === "Space" ||
        (isMac && event.key === "Alt") ||
        (!isMac && event.key === "Control")
      ) {
        shouldStop = true;
      }

      if (shouldStop) {
        // We stop if we are currently recording
        if (isRecording && recorderRef.current) {
          dispatch(stopRecording());

          recorderRef.current.stopRecording(() => {
            const blob = recorderRef.current?.getBlob();
            if (blob && blob.size > 0) {
              dispatch(processAudio(blob));
            } else {
              console.warn("Recorded blob was empty or null");
            }

            // Destroy recorder to free memory
            recorderRef.current?.destroy();
            recorderRef.current = null;
          });
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [isRecording, dispatch]);

  // This component is purely logical and renders nothing
  return null;
};

export default Recorder;
