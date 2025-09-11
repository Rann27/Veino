import React from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: number;
}

export default function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Enter content here...",
  height = 400 
}: RichTextEditorProps) {
  // Temporary fallback to textarea while we fix CKEditor
  return (
    <div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={Math.floor(height / 20)}
        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
        style={{ minHeight: height }}
      />
      <div className="mt-2 text-sm text-gray-500">
        HTML tags supported: &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;img src="url"&gt;, &lt;a href="url"&gt;
      </div>
    </div>
  );
}
