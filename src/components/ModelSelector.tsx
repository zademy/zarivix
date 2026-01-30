import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import { setModel } from '../store/audioSlice';

const ModelSelector: React.FC = () => {
    const dispatch = useDispatch();
    const currentModel = useSelector((state: RootState) => state.audio.model);

    return (
        <div className="mb-4 w-full">
            <select
                value={currentModel}
                onChange={(e) => dispatch(setModel(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-center bg-white"
            >
                <option value="whisper-large-v3">whisper-large-v3</option>
                <option value="whisper-large-v3-turbo">whisper-large-v3-turbo</option>
            </select>
            <div className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded text-left">
                <strong className="block mb-1 text-gray-700">Límites Gratuitos (Free Tier):</strong>
                <ul className="list-disc ml-5 space-y-1">
                    <li>20 Requests/min | 2,000 Requests/día</li>
                    <li>7,200 seg audio/hora (~2 hrs)</li>
                    <li>28,800 seg audio/día (~8 hrs)</li>
                </ul>
                <div className="mt-2 text-right">
                    <a href="https://console.groq.com/settings/limits" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:text-orange-600 no-underline font-medium">Ver mis límites exactos &rarr;</a>
                </div>
            </div>
        </div>
    );
};

export default ModelSelector;
