import React from 'react'

const TextInput = ({ value, onChange, placeholder }) => {
  return (
    <div className="space-y-2">
      <label htmlFor="text-input" className="block text-sm font-medium text-gray-700">
        Your Content
      </label>
      <textarea
        id="text-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={8}
        className="input-field"
      />
    </div>
  )
}

export default TextInput
