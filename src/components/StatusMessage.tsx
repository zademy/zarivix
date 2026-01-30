import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';

const StatusMessage: React.FC = () => {
    const { status, errorMessage, isRecording } = useSelector((state: RootState) => state.audio);

    let content = (
        <span>
            Presiona <span className="bg-gray-200 border border-gray-300 rounded px-2 py-0.5 text-gray-700 font-mono text-sm">Ctrl</span> + <span className="bg-gray-200 border border-gray-300 rounded px-2 py-0.5 text-gray-700 font-mono text-sm">Espacio</span> para hablar
        </span>
    );
    let className = "text-lg font-semibold text-gray-600 mb-4 min-h-[1.5em]";

    if (status === 'recording' || isRecording) {
        content = <span>🎙️ Escuchando... (Whisper)</span>;
        className = "text-lg font-semibold text-rose-500 animate-pulse mb-4 min-h-[1.5em]";
    } else if (status === 'processing') {
        content = <span>⚡ Procesando...</span>;
        className = "text-lg font-semibold text-blue-500 mb-4 min-h-[1.5em]";
    } else if (status === 'error') {
        content = <span>Error: {errorMessage}</span>;
        className = "text-lg font-semibold text-red-600 mb-4 min-h-[1.5em]";
    }

    return (
        <div className={className}>
            {content}
        </div>
    );
};

export default StatusMessage;
