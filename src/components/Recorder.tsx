import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import RecordRTC from 'recordrtc';
import type { AppDispatch, RootState } from '../store/store';
import { startRecording, stopRecording, processAudio } from '../store/audioSlice';

const Recorder: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { isRecording } = useSelector((state: RootState) => state.audio);
    const mediaRecorderRef = useRef<RecordRTC | null>(null);
    // audioChunksRef is no longer needed with RecordRTC as it handles blob internally
    // const audioChunksRef = useRef<Blob[]>([]);

    useEffect(() => {
        // Request permissions on mount with explicit constraints for voice
        navigator.mediaDevices.getUserMedia({
            audio: {
                //echoCancellation: true,
                //noiseSuppression: true,
                //autoGainControl: true,
                //channelCount: 1
            }
        })
            .then(stream => {
                // Initialize RecordRTC
                const recorder = new RecordRTC(stream, {
                    type: 'audio',
                    mimeType: 'audio/wav',
                    recorderType: RecordRTC.StereoAudioRecorder,
                    numberOfAudioChannels: 1,
                    // desiredSampRate: 16000, // REMOVED: Resampling might cause stutter on some devices
                    bufferSize: 16384,         // INCREASED: Larger buffer to prevent "clicks/stutter"
                });
                mediaRecorderRef.current = recorder;
            })
            .catch(err => {
                console.error("Error accessing microphone:", err);
            });
    }, [dispatch]);

    useEffect(() => {
        const isMac = navigator.userAgent.toLowerCase().includes("mac");

        const handleKeyDown = (event: KeyboardEvent) => {
            let shouldStart = false;

            if (isMac) {
                // macOS: Alt (Option) + Space
                if (event.altKey && event.code === 'Space') {
                    shouldStart = true;
                }
            } else if (event.ctrlKey && event.code === 'Space') {
                // Windows/Linux: Ctrl + Space
                shouldStart = true;
            }

            if (shouldStart) {
                event.preventDefault(); // Prevent scrolling

                if (!isRecording && mediaRecorderRef.current) {
                    const recorder = mediaRecorderRef.current;
                    // RecordRTC state check is not as straightforward as MediaRecorder 'inactive'
                    // We rely on Redux state 'isRecording' mostly, but can check recorder.state if needed
                    // For RecordRTC, we just call startRecording
                    dispatch(startRecording());
                    recorder.startRecording();
                }
            }
        };

        const handleKeyUp = (event: KeyboardEvent) => {
             // Check for key release
            let shouldStop = false;
            
            if (event.code === 'Space' || (isMac && event.key === 'Alt') || (!isMac && event.key === 'Control')) {
                shouldStop = true;
            }

            if (shouldStop) {
                 // We stop if we are currently recording
                if (isRecording && mediaRecorderRef.current) {
                    dispatch(stopRecording());
                    mediaRecorderRef.current.stopRecording(() => {
                        const blob = mediaRecorderRef.current?.getBlob();
                        if (blob) {
                            dispatch(processAudio(blob));
                        }
                    });
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);
        };
    }, [isRecording, dispatch]);

    // This component is purely logical and renders nothing
    return null;
};

export default Recorder;
