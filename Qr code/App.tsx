import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Download, Copy, Settings, AlertCircle, CheckCircle, QrCode, Share2, Layers, Palette, Sun, Moon } from 'lucide-react';
import QRCode from 'qrcode';
import { QROptions, NotificationState, ExportFormat, QRHistory } from './types';
import { ThemeToggle } from './components/ThemeToggle';
import { ContentTypeSelector } from './components/ContentTypeSelector';
import { DynamicForm } from './components/DynamicForm';
import { BatchGenerator } from './components/BatchGenerator';
import { HistoryPanel } from './components/HistoryPanel';
import { generateQRContent } from './data/contentTypes';
import { exportAsSVG, exportAsPDF, downloadFile, shareQRCode } from './utils/exportUtils';
import { useTheme } from './hooks/useTheme';
import { useQRHistory } from './hooks/useQRHistory';

function App() {
  const { resolvedTheme } = useTheme();
  const { saveToHistory } = useQRHistory();
  
  const [contentType, setContentType] = useState('url');
  const [formData, setFormData] = useState<Record<string, string>>({ url: 'https://example.com' });
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const [showBatchGenerator, setShowBatchGenerator] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    message: '',
    type: 'success'
  });
  
  const [options, setOptions] = useState<QROptions>({
    errorCorrectionLevel: 'M',
    width: 300,
    margin: 4,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    logoUrl: '',
    logoSize: 20,
    eyeStyle: 'square',
    gradient: {
      enabled: false,
      colors: ['#000000', '#333333'],
      direction: 'horizontal'
    }
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 3000);
  }, []);

  const generateQRCode = useCallback(async (content: string, qrOptions: QROptions) => {
    if (!content.trim()) {
      setQrDataUrl('');
      return;
    }

    setIsGenerating(true);
    
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      await QRCode.toCanvas(canvas, content, {
        errorCorrectionLevel: qrOptions.errorCorrectionLevel,
        width: qrOptions.width,
        margin: qrOptions.margin,
        color: qrOptions.color
      });

      const dataUrl = canvas.toDataURL('image/png');
      setQrDataUrl(dataUrl);
      
      // Save to history
      saveToHistory({
        content,
        type: contentType,
        options: qrOptions,
        dataUrl
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      showNotification('Error generating QR code. Please check your input.', 'error');
    } finally {
      setIsGenerating(false);
    }
  }, [showNotification, contentType, saveToHistory]);

  const debouncedGenerate = useCallback((content: string, qrOptions: QROptions) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      generateQRCode(content, qrOptions);
    }, 300);
  }, [generateQRCode]);

  useEffect(() => {
    const content = generateQRContent(contentType, formData);
    debouncedGenerate(content, options);
  }, [formData, contentType, options, debouncedGenerate]);

  const handleDownload = async (format: ExportFormat) => {
    if (!qrDataUrl) {
      showNotification('No QR code to download', 'error');
      return;
    }

    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      switch (format) {
        case 'png':
          const pngDataUrl = canvas.toDataURL('image/png');
          const pngLink = document.createElement('a');
          pngLink.download = 'qrcode.png';
          pngLink.href = pngDataUrl;
          document.body.appendChild(pngLink);
          pngLink.click();
          document.body.removeChild(pngLink);
          break;
          
        case 'jpeg':
          const jpegCanvas = document.createElement('canvas');
          const ctx = jpegCanvas.getContext('2d');
          if (!ctx) return;
          jpegCanvas.width = canvas.width;
          jpegCanvas.height = canvas.height;
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, jpegCanvas.width, jpegCanvas.height);
          ctx.drawImage(canvas, 0, 0);
          const jpegDataUrl = jpegCanvas.toDataURL('image/jpeg', 0.9);
          const jpegLink = document.createElement('a');
          jpegLink.download = 'qrcode.jpeg';
          jpegLink.href = jpegDataUrl;
          document.body.appendChild(jpegLink);
          jpegLink.click();
          document.body.removeChild(jpegLink);
          break;
          
        case 'svg':
          const svgString = await exportAsSVG(canvas, options);
          const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
          downloadFile(svgBlob, 'qrcode.svg');
          break;
          
        case 'pdf':
          const pdfBlob = await exportAsPDF(canvas, options);
          downloadFile(pdfBlob, 'qrcode.pdf');
          break;
      }

      showNotification(`QR code downloaded as ${format.toUpperCase()}`, 'success');
    } catch (error) {
      console.error('Error downloading QR code:', error);
      showNotification('Error downloading QR code', 'error');
    }
  };

  const handleShare = async () => {
    if (!qrDataUrl) {
      showNotification('No QR code to share', 'error');
      return;
    }

    try {
      const content = generateQRContent(contentType, formData);
      await shareQRCode(qrDataUrl, content);
      showNotification('QR code shared successfully', 'success');
    } catch (error) {
      console.error('Error sharing QR code:', error);
      showNotification('Error sharing QR code', 'error');
    }
  };

  const handleCopyToClipboard = async () => {
    if (!qrDataUrl) {
      showNotification('No QR code to copy', 'error');
      return;
    }

    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.toBlob(async (blob) => {
        if (blob) {
          const item = new ClipboardItem({ 'image/png': blob });
          await navigator.clipboard.write([item]);
          showNotification('QR code copied to clipboard', 'success');
        }
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      showNotification('Error copying to clipboard', 'error');
    }
  };

  const handleLoadFromHistory = (item: QRHistory) => {
    setContentType(item.type);
    setOptions(item.options);
    // Parse content back to form data based on type
    if (item.type === 'url') {
      setFormData({ url: item.content });
    } else if (item.type === 'text') {
      setFormData({ text: item.content });
    }
    // Add more parsing logic for other content types as needed
    setShowHistory(false);
  };

  const updateOptions = (newOptions: Partial<QROptions>) => {
    setOptions(prev => ({ ...prev, ...newOptions }));
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      resolvedTheme === 'dark'
        ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900'
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    }`}>
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-white/20 dark:border-gray-700/20 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">QR Code Generator Pro</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Advanced QR code generation with premium features</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowBatchGenerator(true)}
                className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Layers className="w-4 h-4" />
                <span className="hidden sm:inline">Batch</span>
              </button>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <QrCode className="w-4 h-4" />
                <span className="hidden sm:inline">History</span>
              </button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm transition-all duration-300 ${
          notification.type === 'success'
            ? 'bg-green-500/90 text-white'
            : notification.type === 'error'
            ? 'bg-red-500/90 text-white'
            : 'bg-blue-500/90 text-white'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className={`grid gap-8 ${showHistory ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2'}`}>
          {/* Input Section */}
          <div className="space-y-6">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Create QR Code</h2>
              
              <div className="space-y-4">
                <ContentTypeSelector
                  selectedType={contentType}
                  onTypeChange={setContentType}
                />
                
                <DynamicForm
                  contentType={contentType}
                  formData={formData}
                  onChange={setFormData}
                />
              </div>
            </div>

            {/* Customization Panel */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Palette className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Customization</h2>
                </div>
                <button
                  onClick={() => setShowCustomization(!showCustomization)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  {showCustomization ? 'Hide' : 'Show'} Options
                </button>
              </div>

              {showCustomization && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Size</label>
                      <select
                        value={options.width}
                        onChange={(e) => updateOptions({ width: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        <option value={200}>Small (200px)</option>
                        <option value={300}>Medium (300px)</option>
                        <option value={400}>Large (400px)</option>
                        <option value={500}>Extra Large (500px)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Error Correction</label>
                      <select
                        value={options.errorCorrectionLevel}
                        onChange={(e) => updateOptions({ errorCorrectionLevel: e.target.value as any })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      >
                        <option value="L">Low (~7%)</option>
                        <option value="M">Medium (~15%)</option>
                        <option value="Q">Quartile (~25%)</option>
                        <option value="H">High (~30%)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Foreground Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={options.color.dark}
                          onChange={(e) => updateOptions({ color: { ...options.color, dark: e.target.value } })}
                          className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                        />
                        <input
                          type="text"
                          value={options.color.dark}
                          onChange={(e) => updateOptions({ color: { ...options.color, dark: e.target.value } })}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Background Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={options.color.light}
                          onChange={(e) => updateOptions({ color: { ...options.color, light: e.target.value } })}
                          className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                        />
                        <input
                          type="text"
                          value={options.color.light}
                          onChange={(e) => updateOptions({ color: { ...options.color, light: e.target.value } })}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Output Section */}
          <div className="space-y-6">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Generated QR Code</h2>
              
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  {isGenerating && (
                    <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                  
                  <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow-inner border-2 border-gray-100 dark:border-gray-700">
                    <canvas
                      ref={canvasRef}
                      className="max-w-full h-auto"
                      style={{ display: qrDataUrl ? 'block' : 'none' }}
                    />
                    
                    {!qrDataUrl && !isGenerating && (
                      <div className="w-64 h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                        <p className="text-gray-500 dark:text-gray-400 text-center">Fill in the form to generate QR code</p>
                      </div>
                    )}
                  </div>
                </div>

                {qrDataUrl && (
                  <div className="flex flex-wrap gap-2 justify-center">
                    <button
                      onClick={() => handleDownload('png')}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 text-sm"
                    >
                      <Download className="w-4 h-4" />
                      PNG
                    </button>
                    
                    <button
                      onClick={() => handleDownload('jpeg')}
                      className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 text-sm"
                    >
                      <Download className="w-4 h-4" />
                      JPEG
                    </button>
                    
                    <button
                      onClick={() => handleDownload('svg')}
                      className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 text-sm"
                    >
                      <Download className="w-4 h-4" />
                      SVG
                    </button>
                    
                    <button
                      onClick={() => handleDownload('pdf')}
                      className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 text-sm"
                    >
                      <Download className="w-4 h-4" />
                      PDF
                    </button>
                    
                    <button
                      onClick={handleCopyToClipboard}
                      className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 text-sm"
                    >
                      <Copy className="w-4 h-4" />
                      Copy
                    </button>
                    
                    <button
                      onClick={handleShare}
                      className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 text-sm"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>
                  </div>
                )}
              </div>
              
              {qrDataUrl && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <strong>Type:</strong> {contentType} | <strong>Size:</strong> {options.width}px | <strong>Error Correction:</strong> {options.errorCorrectionLevel}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Generated: {new Date().toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            {/* Usage Instructions */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/20 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Pro Features</h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <p><strong>✨</strong> Multiple content types (WiFi, Contact, Event, etc.)</p>
                <p><strong>🎨</strong> Advanced customization options</p>
                <p><strong>📦</strong> Batch generation from CSV files</p>
                <p><strong>💾</strong> History and favorites</p>
                <p><strong>🌙</strong> Dark/Light theme support</p>
                <p><strong>📱</strong> Multi-format export (PNG, SVG, PDF)</p>
                <p><strong>🔗</strong> Native sharing capabilities</p>
              </div>
            </div>
          </div>
          
          {/* History Panel */}
          {showHistory && (
            <div className="space-y-6">
              <HistoryPanel onLoadFromHistory={handleLoadFromHistory} />
            </div>
          )}
        </div>
      </div>
      
      {/* Batch Generator Modal */}
      {showBatchGenerator && (
        <BatchGenerator
          options={options}
          onClose={() => setShowBatchGenerator(false)}
        />
      )}
    </div>
  );
}

export default App;