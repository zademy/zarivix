import ModelSelector from './components/ModelSelector';
import StatusMessage from './components/StatusMessage';
import TranscriptionDisplay from './components/TranscriptionDisplay';
import Recorder from './components/Recorder';
import HistorySidebar from './components/HistorySidebar';

function App() {
  return (
    <div className="bg-gray-100 min-h-screen flex font-sans">
      <Recorder />
      {/* Sidebar Panel */}
      <HistorySidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-lg text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Dictado por Voz con Groq</h1>
          <ModelSelector />
          <StatusMessage />
          <TranscriptionDisplay />
          
          <div className="mt-8 text-sm text-gray-400">
              <p>Mantén presionadas las teclas mientras hablas. Suelta para terminar.</p>
              <p className="mt-2 text-xs">Requiere una API Key válida de Groq (configurada en código).</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
