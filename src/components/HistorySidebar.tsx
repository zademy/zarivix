import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store/store';
import { clearHistory, deleteFromHistory, setTranscription } from '../store/audioSlice';

const HistorySidebar: React.FC = () => {
    const dispatch = useDispatch();
    const history = useSelector((state: RootState) => state.audio.history);

    const handleLoad = (text: string) => {
        dispatch(setTranscription(text));
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('¿Eliminar esta grabación?')) {
            dispatch(deleteFromHistory(id));
        }
    };

    return (
        <div className="w-80 bg-gray-900 h-screen flex flex-col shadow-xl text-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-700 bg-gray-800 flex justify-between items-center">
                <h2 className="text-xl font-bold text-orange-400">Historial</h2>
                {history.length > 0 && (
                    <button 
                        onClick={() => { if(confirm('¿Borrar todo?')) dispatch(clearHistory()); }}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                        Borrar Todo
                    </button>
                )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {history.length === 0 ? (
                    <p className="text-gray-500 text-center mt-10 text-sm">No hay grabaciones recientes.</p>
                ) : (
                    history.map((item) => (
                        <div 
                            key={item.id} 
                            onClick={() => handleLoad(item.text)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    handleLoad(item.text);
                                }
                            }}
                            className="bg-gray-800 p-3 rounded-lg hover:bg-gray-700 transition cursor-pointer group border border-gray-700"
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-xs text-gray-500">
                                    {new Date(item.timestamp).toLocaleString()}
                                </span>
                                <button 
                                    onClick={(e) => handleDelete(item.id, e)}
                                    className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity px-1"
                                >
                                    &times;
                                </button>
                            </div>
                            <p className="text-sm text-gray-300 line-clamp-3">
                                {item.text}
                            </p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default HistorySidebar;
