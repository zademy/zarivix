import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import RecordRTC from "recordrtc";
import type { AppDispatch, RootState } from "../store/store";
import {
    startRecording,
    stopRecording,
    processAudio,
} from "../store/audioSlice";

export const useAudioRecorder = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { isRecording } = useSelector((state: RootState) => state.audio);
    const streamRef = useRef<MediaStream | null>(null);
    const recorderRef = useRef<RecordRTC | null>(null);

    // 1. Initialize Microphone Stream
    useEffect(() => {
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
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    // 2. Handle Keyboard Shortcuts & Recording Logic
    useEffect(() => {
        const isMac = navigator.userAgent.toLowerCase().includes("mac");

        const handleKeyDown = (event: KeyboardEvent) => {
            let shouldStart = false;

            if (isMac) {
                if (event.altKey && event.code === "Space") shouldStart = true;
            } else if (event.ctrlKey && event.code === "Space") {
                shouldStart = true;
            }

            if (shouldStart) {
                event.preventDefault();

                if (!isRecording && streamRef.current) {
                    const recorder = new RecordRTC(streamRef.current, {
                        type: "audio",
                        mimeType: "audio/webm",
                        recorderType: RecordRTC.MediaStreamRecorder,
                        numberOfAudioChannels: 1,
                        desiredSampRate: 44100,
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
            let shouldStop = false;

            if (
                event.code === "Space" ||
                (isMac && event.key === "Alt") ||
                (!isMac && event.key === "Control")
            ) {
                shouldStop = true;
            }

            if (shouldStop) {
                if (isRecording && recorderRef.current) {
                    dispatch(stopRecording());

                    recorderRef.current.stopRecording(() => {
                        const blob = recorderRef.current?.getBlob();
                        if (blob && blob.size > 0) {
                            dispatch(processAudio(blob));
                        } else {
                            console.warn("Recorded blob was empty or null");
                        }

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

    return { isRecording };
};
