import React from 'react'
import { TestTube2 } from 'lucide-react'

const GenerateMockButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="btn-secondary w-full flex items-center justify-center space-x-2 whitespace-nowrap"
    >
      <TestTube2 className="h-4 w-4" />
      <span>Generate Mock</span>
    </button>
  )
}

export default GenerateMockButton
