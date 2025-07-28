import { useState, useEffect } from 'react';
import { QRHistory } from '../types';

export function useQRHistory() {
  const [history, setHistory] = useState<QRHistory[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('qr-history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHistory(parsed.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt)
        })));
      } catch (error) {
        console.error('Error loading history:', error);
      }
    }
  }, []);

  const saveToHistory = (item: Omit<QRHistory, 'id' | 'createdAt' | 'isFavorite'>) => {
    const newItem: QRHistory = {
      ...item,
      id: Date.now().toString(),
      createdAt: new Date(),
      isFavorite: false
    };

    const updatedHistory = [newItem, ...history.slice(0, 49)]; // Keep last 50 items
    setHistory(updatedHistory);
    localStorage.setItem('qr-history', JSON.stringify(updatedHistory));
  };

  const toggleFavorite = (id: string) => {
    const updatedHistory = history.map(item =>
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    );
    setHistory(updatedHistory);
    localStorage.setItem('qr-history', JSON.stringify(updatedHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('qr-history');
  };

  return {
    history,
    saveToHistory,
    toggleFavorite,
    clearHistory,
    favorites: history.filter(item => item.isFavorite)
  };
}