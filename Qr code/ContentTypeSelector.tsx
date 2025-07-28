import React from 'react';
import { contentTypes } from '../data/contentTypes';

interface ContentTypeSelectorProps {
  selectedType: string;
  onTypeChange: (type: string) => void;
}

export function ContentTypeSelector({ selectedType, onTypeChange }: ContentTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Content Type</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {contentTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => onTypeChange(type.id)}
            className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
              selectedType === type.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400'
            }`}
          >
            <span className="text-2xl">{type.icon}</span>
            <span className="text-xs font-medium text-center">{type.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}