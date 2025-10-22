import React from 'react'
import { Sparkles, Loader2 } from 'lucide-react'

const GenerateButton = ({ onClick, isLoading, disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`
        btn-primary w-full flex items-center justify-center space-x-2 whitespace-nowrap
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${isLoading ? 'cursor-wait' : ''}
      `}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Generating...</span>
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4" />
          <span>Generate Carousel</span>
        </>
      )}
    </button>
  )
}

export default GenerateButton
