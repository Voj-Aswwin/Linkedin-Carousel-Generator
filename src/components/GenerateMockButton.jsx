import React from 'react'
import { TestTube2 } from 'lucide-react'

const GenerateMockButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="btn-secondary flex items-center space-x-2"
    >
      <TestTube2 className="h-4 w-4" />
      <span>Generate Mock</span>
    </button>
  )
}

export default GenerateMockButton
