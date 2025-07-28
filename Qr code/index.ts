export interface QROptions {
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  width: number;
  margin: number;
  color: {
    dark: string;
    light: string;
  };
  logoUrl?: string;
  logoSize?: number;
  eyeStyle?: 'square' | 'circle' | 'rounded';
  gradient?: {
    enabled: boolean;
    colors: string[];
    direction: 'horizontal' | 'vertical' | 'diagonal';
  };
}

export interface NotificationState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface QRContentType {
  id: string;
  name: string;
  icon: string;
  fields: QRField[];
}

export interface QRField {
  key: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'url' | 'textarea' | 'select' | 'date' | 'time';
  placeholder?: string;
  required?: boolean;
  options?: string[];
}

export interface BatchQRItem {
  id: string;
  content: string;
  filename: string;
  status: 'pending' | 'generating' | 'completed' | 'error';
  dataUrl?: string;
}

export interface QRHistory {
  id: string;
  content: string;
  type: string;
  createdAt: Date;
  options: QROptions;
  dataUrl: string;
  isFavorite: boolean;
}

export type Theme = 'light' | 'dark' | 'auto';
export type ExportFormat = 'png' | 'jpeg' | 'svg' | 'pdf';