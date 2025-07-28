import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Download, X, FileText, AlertCircle } from 'lucide-react';
import { BatchQRItem, QROptions } from '../types';
import QRCode from 'qrcode';
import JSZip from 'jszip';

interface BatchGeneratorProps {
  options: QROptions;
  onClose: () => void;
}

export function BatchGenerator({ options, onClose }: BatchGeneratorProps) {
  const [batchItems, setBatchItems] = useState<BatchQRItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        const items: BatchQRItem[] = lines.map((line, index) => ({
          id: `${Date.now()}-${index}`,
          content: line.trim(),
          filename: `qr-${index + 1}`,
          status: 'pending'
        }));
        
        setBatchItems(items);
      };
      reader.readAsText(file);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'text/plain': ['.txt']
    },
    multiple: false
  });

  const generateBatch = async () => {
    setIsProcessing(true);
    
    for (let i = 0; i < batchItems.length; i++) {
      const item = batchItems[i];
      
      setBatchItems(prev => prev.map(p => 
        p.id === item.id ? { ...p, status: 'generating' } : p
      ));

      try {
        const canvas = document.createElement('canvas');
        await QRCode.toCanvas(canvas, item.content, {
          errorCorrectionLevel: options.errorCorrectionLevel,
          width: options.width,
          margin: options.margin,
          color: options.color
        });

        const dataUrl = canvas.toDataURL('image/png');
        
        setBatchItems(prev => prev.map(p => 
          p.id === item.id ? { ...p, status: 'completed', dataUrl } : p
        ));
      } catch (error) {
        setBatchItems(prev => prev.map(p => 
          p.id === item.id ? { ...p, status: 'error' } : p
        ));
      }
    }
    
    setIsProcessing(false);
  };

  const downloadAll = async () => {
    const zip = new JSZip();
    const completedItems = batchItems.filter(item => item.status === 'completed' && item.dataUrl);
    
    completedItems.forEach((item) => {
      const base64Data = item.dataUrl!.split(',')[1];
      zip.file(`${item.filename}.png`, base64Data, { base64: true });
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'qr-codes.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: BatchQRItem['status']) => {
    switch (status) {
      case 'pending':
        return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
      case 'generating':
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      case 'completed':
        return <div className="w-4 h-4 bg-green-500 rounded-full" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Batch QR Generator</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {batchItems.length === 0 ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragActive
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Upload CSV or TXT file
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                Drag and drop your file here, or click to browse
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Each line should contain one piece of content to generate a QR code for
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {batchItems.length} items loaded
                </p>
                <div className="flex gap-2">
                  {!isProcessing && batchItems.some(item => item.status === 'pending') && (
                    <button
                      onClick={generateBatch}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Generate All
                    </button>
                  )}
                  {batchItems.some(item => item.status === 'completed') && (
                    <button
                      onClick={downloadAll}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download ZIP
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2">
                {batchItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    {getStatusIcon(item.status)}
                    <FileText className="w-4 h-4 text-gray-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {item.filename}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {item.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}