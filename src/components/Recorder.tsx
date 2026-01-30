import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store/store';
import { startRecording, stopRecording, processAudio } from '../store/audioSlice';

const Recorder: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { isRecording } = useSelector((state: RootState) => state.audio);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    useEffect(() => {
        // Request permissions on mount
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                const mediaRecorder = new MediaRecorder(stream);
                mediaRecorderRef.current = mediaRecorder;

                mediaRecorder.ondataavailable = (event) => {
                    audioChunksRef.current.push(event.data);
                };

                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    dispatch(processAudio(audioBlob));
                    audioChunksRef.current = [];
                };
            })
            .catch(err => {
                console.error("Error accessing microphone:", err);
                // In a real app, dispatch an error action here
            });
    }, [dispatch]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Check for Ctrl + Space
            if (event.ctrlKey && event.code === 'Space') {
                event.preventDefault(); // Prevent scrolling

                if (!isRecording && mediaRecorderRef.current && mediaRecorderRef.current.state === "inactive") {
                    dispatch(startRecording());
                    mediaRecorderRef.current.start();
                }
            }
        };

        const handleKeyUp = (event: KeyboardEvent) => {
             // Check for key release
            if (event.code === 'Space' || event.key === 'Control') {
                 // We stop if we are currently recording
                if (isRecording && mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
                    dispatch(stopRecording());
                    mediaRecorderRef.current.stop();
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
