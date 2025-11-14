import React from 'react'
import { FileText } from 'lucide-react'

const TextInput = ({ value, onChange, placeholder }) => {
  return (
    <div className="space-y-2">
      <label htmlFor="text-input" className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
        <FileText className="h-4 w-4 text-gray-500" />
        <span>Your Content</span>
      </label>
      <textarea
        id="text-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={10}
        className="input-field"
      />
    </div>
  )
}

export default TextInput
