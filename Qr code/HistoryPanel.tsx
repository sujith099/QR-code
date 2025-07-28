import React from 'react';
import { History, Heart, Trash2, Download, Copy } from 'lucide-react';
import { useQRHistory } from '../hooks/useQRHistory';
import { QRHistory } from '../types';

interface HistoryPanelProps {
  onLoadFromHistory: (item: QRHistory) => void;
}

export function HistoryPanel({ onLoadFromHistory }: HistoryPanelProps) {
  const { history, favorites, toggleFavorite, clearHistory } = useQRHistory();

  const handleDownload = (item: QRHistory) => {
    const link = document.createElement('a');
    link.download = `qr-${item.id}.png`;
    link.href = item.dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = async (item: QRHistory) => {
    try {
      const response = await fetch(item.dataUrl);
      const blob = await response.blob();
      const clipboardItem = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([clipboardItem]);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">History</h2>
        </div>
        {history.length > 0 && (
          <button
            onClick={clearHistory}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

      {favorites.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Favorites</h3>
          <div className="space-y-2">
            {favorites.slice(0, 3).map((item) => (
              <HistoryItem
                key={item.id}
                item={item}
                onLoad={onLoadFromHistory}
                onToggleFavorite={toggleFavorite}
                onDownload={handleDownload}
                onCopy={handleCopy}
              />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {history.slice(0, 10).map((item) => (
          <HistoryItem
            key={item.id}
            item={item}
            onLoad={onLoadFromHistory}
            onToggleFavorite={toggleFavorite}
            onDownload={handleDownload}
            onCopy={handleCopy}
          />
        ))}
        {history.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No QR codes generated yet
          </p>
        )}
      </div>
    </div>
  );
}

interface HistoryItemProps {
  item: QRHistory;
  onLoad: (item: QRHistory) => void;
  onToggleFavorite: (id: string) => void;
  onDownload: (item: QRHistory) => void;
  onCopy: (item: QRHistory) => void;
}

function HistoryItem({ item, onLoad, onToggleFavorite, onDownload, onCopy }: HistoryItemProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
      <img
        src={item.dataUrl}
        alt="QR Code"
        className="w-12 h-12 rounded border border-gray-200 dark:border-gray-600"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {item.content.length > 50 ? `${item.content.substring(0, 50)}...` : item.content}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {item.createdAt.toLocaleDateString()} • {item.type}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onToggleFavorite(item.id)}
          className={`p-1.5 rounded-lg transition-colors ${
            item.isFavorite
              ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
              : 'text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-600'
          }`}
        >
          <Heart className={`w-4 h-4 ${item.isFavorite ? 'fill-current' : ''}`} />
        </button>
        <button
          onClick={() => onCopy(item)}
          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
        >
          <Copy className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDownload(item)}
          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={() => onLoad(item)}
          className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Load
        </button>
      </div>
    </div>
  );
}