import React, { useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store/store';
import { setTranscription } from '../store/audioSlice';

const TranscriptionDisplay: React.FC = () => {
    const dispatch = useDispatch();
    const transcription = useSelector((state: RootState) => state.audio.transcription);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
        }
    }, [transcription]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        dispatch(setTranscription(e.target.value));
    };

    return (
        <textarea
            ref={textareaRef}
            id="output"
            className="w-full h-40 p-4 border border-gray-300 rounded-lg resize-none text-base focus:outline-none focus:ring-2 focus:ring-gray-400"
            placeholder="Tu texto de alta precisión aparecerá aquí..."
            value={transcription}
            onChange={handleChange}
        ></textarea>
    );
};

export default TranscriptionDisplay;
