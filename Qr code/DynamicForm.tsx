import React from 'react';
import { contentTypes } from '../data/contentTypes';

interface DynamicFormProps {
  contentType: string;
  formData: Record<string, string>;
  onChange: (data: Record<string, string>) => void;
}

export function DynamicForm({ contentType, formData, onChange }: DynamicFormProps) {
  const type = contentTypes.find(t => t.id === contentType);
  
  if (!type) return null;

  const handleFieldChange = (key: string, value: string) => {
    onChange({ ...formData, [key]: value });
  };

  return (
    <div className="space-y-4">
      {type.fields.map((field) => (
        <div key={field.key}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          
          {field.type === 'textarea' ? (
            <textarea
              value={formData[field.key] || ''}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          ) : field.type === 'select' ? (
            <select
              value={formData[field.key] || field.options?.[0] || ''}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              required={field.required}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              {field.options?.map((option) => (
                <option key={option} value={option}>
                  {option === 'nopass' ? 'No Password' : option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={field.type}
              value={formData[field.key] || ''}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              required={field.required}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          )}
        </div>
      ))}
    </div>
  );
}