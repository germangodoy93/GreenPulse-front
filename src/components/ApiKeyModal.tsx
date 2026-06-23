import { useState } from 'react';

interface ApiKeyModalProps {
  apiKey: string;
  onClose: () => void;
}

export default function ApiKeyModal({ apiKey, onClose }: ApiKeyModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 text-xl">
            ⚠️
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">API Key generada</h2>
            <p className="text-sm text-slate-500">Esta clave no se volverá a mostrar</p>
          </div>
        </div>

        <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm text-green-400 break-all mb-4">
          {apiKey}
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6 text-sm text-yellow-800">
          Copia y guarda esta API key de forma segura. Una vez que cierres este modal, no podrás recuperarla.
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleCopy}
            className="flex-1 py-2.5 rounded-lg font-semibold transition"
            style={{ backgroundColor: copied ? '#3fae3a' : '#f1f5f9', color: copied ? '#fff' : '#1e293b' }}
          >
            {copied ? '¡Copiado!' : 'Copiar al portapapeles'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg font-semibold bg-slate-800 text-white hover:bg-slate-700 transition"
          >
            Entendido, cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
