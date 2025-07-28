import { QRContentType } from '../types';

export const contentTypes: QRContentType[] = [
  {
    id: 'text',
    name: 'Plain Text',
    icon: '📝',
    fields: [
      { key: 'text', label: 'Text Content', type: 'textarea', placeholder: 'Enter your text...', required: true }
    ]
  },
  {
    id: 'url',
    name: 'Website URL',
    icon: '🌐',
    fields: [
      { key: 'url', label: 'Website URL', type: 'url', placeholder: 'https://example.com', required: true }
    ]
  },
  {
    id: 'wifi',
    name: 'Wi-Fi Network',
    icon: '📶',
    fields: [
      { key: 'ssid', label: 'Network Name (SSID)', type: 'text', placeholder: 'MyWiFiNetwork', required: true },
      { key: 'password', label: 'Password', type: 'text', placeholder: 'password123' },
      { key: 'security', label: 'Security Type', type: 'select', options: ['WPA', 'WEP', 'nopass'], required: true },
      { key: 'hidden', label: 'Hidden Network', type: 'select', options: ['false', 'true'] }
    ]
  },
  {
    id: 'contact',
    name: 'Contact Card',
    icon: '👤',
    fields: [
      { key: 'firstName', label: 'First Name', type: 'text', placeholder: 'John', required: true },
      { key: 'lastName', label: 'Last Name', type: 'text', placeholder: 'Doe' },
      { key: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+1234567890' },
      { key: 'email', label: 'Email', type: 'email', placeholder: 'john@example.com' },
      { key: 'organization', label: 'Organization', type: 'text', placeholder: 'Company Inc.' },
      { key: 'url', label: 'Website', type: 'url', placeholder: 'https://example.com' }
    ]
  },
  {
    id: 'email',
    name: 'Email',
    icon: '📧',
    fields: [
      { key: 'email', label: 'Email Address', type: 'email', placeholder: 'recipient@example.com', required: true },
      { key: 'subject', label: 'Subject', type: 'text', placeholder: 'Email subject' },
      { key: 'body', label: 'Message', type: 'textarea', placeholder: 'Email message...' }
    ]
  },
  {
    id: 'sms',
    name: 'SMS Message',
    icon: '💬',
    fields: [
      { key: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+1234567890', required: true },
      { key: 'message', label: 'Message', type: 'textarea', placeholder: 'Your SMS message...' }
    ]
  },
  {
    id: 'event',
    name: 'Calendar Event',
    icon: '📅',
    fields: [
      { key: 'title', label: 'Event Title', type: 'text', placeholder: 'Meeting Title', required: true },
      { key: 'startDate', label: 'Start Date', type: 'date', required: true },
      { key: 'startTime', label: 'Start Time', type: 'time', required: true },
      { key: 'endDate', label: 'End Date', type: 'date' },
      { key: 'endTime', label: 'End Time', type: 'time' },
      { key: 'location', label: 'Location', type: 'text', placeholder: 'Conference Room A' },
      { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Event description...' }
    ]
  },
  {
    id: 'location',
    name: 'Location',
    icon: '📍',
    fields: [
      { key: 'latitude', label: 'Latitude', type: 'text', placeholder: '40.7128', required: true },
      { key: 'longitude', label: 'Longitude', type: 'text', placeholder: '-74.0060', required: true },
      { key: 'query', label: 'Location Name', type: 'text', placeholder: 'New York City' }
    ]
  }
];

export function generateQRContent(type: string, data: Record<string, string>): string {
  switch (type) {
    case 'text':
      return data.text || '';
    
    case 'url':
      return data.url || '';
    
    case 'wifi':
      return `WIFI:T:${data.security || 'WPA'};S:${data.ssid || ''};P:${data.password || ''};H:${data.hidden === 'true' ? 'true' : 'false'};;`;
    
    case 'contact':
      const vcard = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${data.firstName || ''} ${data.lastName || ''}`.trim(),
        data.firstName ? `N:${data.lastName || ''};${data.firstName};;;` : '',
        data.phone ? `TEL:${data.phone}` : '',
        data.email ? `EMAIL:${data.email}` : '',
        data.organization ? `ORG:${data.organization}` : '',
        data.url ? `URL:${data.url}` : '',
        'END:VCARD'
      ].filter(Boolean).join('\n');
      return vcard;
    
    case 'email':
      const emailParts = [`mailto:${data.email || ''}`];
      const params = [];
      if (data.subject) params.push(`subject=${encodeURIComponent(data.subject)}`);
      if (data.body) params.push(`body=${encodeURIComponent(data.body)}`);
      if (params.length > 0) emailParts.push(`?${params.join('&')}`);
      return emailParts.join('');
    
    case 'sms':
      return `sms:${data.phone || ''}${data.message ? `?body=${encodeURIComponent(data.message)}` : ''}`;
    
    case 'event':
      const formatDateTime = (date: string, time: string) => {
        if (!date) return '';
        const dateTime = new Date(`${date}T${time || '00:00'}`);
        return dateTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };
      
      const startDateTime = formatDateTime(data.startDate, data.startTime);
      const endDateTime = formatDateTime(data.endDate || data.startDate, data.endTime || data.startTime);
      
      const vevent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'BEGIN:VEVENT',
        `SUMMARY:${data.title || ''}`,
        startDateTime ? `DTSTART:${startDateTime}` : '',
        endDateTime ? `DTEND:${endDateTime}` : '',
        data.location ? `LOCATION:${data.location}` : '',
        data.description ? `DESCRIPTION:${data.description}` : '',
        'END:VEVENT',
        'END:VCALENDAR'
      ].filter(Boolean).join('\n');
      return vevent;
    
    case 'location':
      if (data.query) {
        return `geo:${data.latitude || '0'},${data.longitude || '0'}?q=${encodeURIComponent(data.query)}`;
      }
      return `geo:${data.latitude || '0'},${data.longitude || '0'}`;
    
    default:
      return '';
  }
}