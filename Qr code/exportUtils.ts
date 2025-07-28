import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { QROptions } from '../types';

export async function exportAsSVG(canvas: HTMLCanvasElement, options: QROptions): Promise<string> {
  const size = options.width;
  const margin = options.margin * 4; // Convert to pixels
  const totalSize = size + (margin * 2);
  
  // Create SVG string
  const svgString = `
    <svg width="${totalSize}" height="${totalSize}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${totalSize}" height="${totalSize}" fill="${options.color.light}"/>
      <image x="${margin}" y="${margin}" width="${size}" height="${size}" href="${canvas.toDataURL()}" />
    </svg>
  `;
  
  return svgString;
}

export async function exportAsPDF(canvas: HTMLCanvasElement, options: QROptions): Promise<Blob> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  const imgData = canvas.toDataURL('image/png');
  const imgWidth = 50; // 50mm width
  const imgHeight = 50; // 50mm height
  
  // Center the QR code on the page
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const x = (pageWidth - imgWidth) / 2;
  const y = (pageHeight - imgHeight) / 2;
  
  pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
  
  return pdf.output('blob');
}

export function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function shareQRCode(dataUrl: string, content: string) {
  if (navigator.share) {
    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], 'qrcode.png', { type: 'image/png' });
      
      await navigator.share({
        title: 'QR Code',
        text: `QR Code for: ${content}`,
        files: [file]
      });
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback to copying to clipboard
      try {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
      } catch (clipboardError) {
        console.error('Error copying to clipboard:', clipboardError);
      }
    }
  } else {
    // Fallback for browsers without Web Share API
    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  }
}