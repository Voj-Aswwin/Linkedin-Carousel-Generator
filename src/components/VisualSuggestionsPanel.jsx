import React, { useState, useEffect } from 'react'
import { Sparkles, TrendingUp, BarChart3, PieChart, Lightbulb, Target, Rocket, Shield, Users, Settings, Heart, Star, CheckCircle, Loader2, Type } from 'lucide-react'
import { visualAnalyzerService } from '../services/visualAnalyzerService'

const VisualSuggestionsPanel = ({ 
  slideData, 
  onAddIcon, 
  onAddDataVisualization, 
  onAddKeywordArt,
  isAnalyzing = false 
}) => {
  const [suggestions, setSuggestions] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  // Icon mapping for Lucide React
  const iconMap = {
    'Lightbulb': Lightbulb,
    'Target': Target,
    'Rocket': Rocket,
    'Shield': Shield,
    'TrendingUp': TrendingUp,
    'Users': Users,
    'Settings': Settings,
    'Heart': Heart,
    'Star': Star,
    'CheckCircle': CheckCircle
  }

  // Analyze slide content when slideData changes
  useEffect(() => {
    if (slideData && slideData.title?.text) {
      analyzeSlide()
    }
  }, [slideData])

  const analyzeSlide = async () => {
    if (!slideData) return
    
    setIsLoading(true)
    try {
      const visualSuggestions = await visualAnalyzerService.analyzeSlideContent(slideData)
      setSuggestions(visualSuggestions)
      console.log('🎨 AI Visual Suggestions:', visualSuggestions)
    } catch (error) {
      console.error('Error getting visual suggestions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddIcon = (iconName) => {
    if (onAddIcon) {
      onAddIcon(iconName)
    }
  }

  const handleAddDataVisualization = (data) => {
    if (onAddDataVisualization) {
      onAddDataVisualization(data)
    }
  }

  const handleAddKeywordArt = (keywords) => {
    if (onAddKeywordArt) {
      onAddKeywordArt(keywords)
    }
  }

  const getIconComponent = (iconName) => {
    const IconComponent = iconMap[iconName]
    return IconComponent ? <IconComponent className="h-4 w-4" /> : <Lightbulb className="h-4 w-4" />
  }

  if (isLoading || isAnalyzing) {
    return (
      <div className="card">
        <h4 className="font-semibold mb-2 flex items-center text-sm">
          <Sparkles className="h-3 w-3 mr-1" />
          AI Visual Suggestions
        </h4>
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          <span className="ml-2 text-sm text-gray-600">Analyzing content...</span>
        </div>
      </div>
    )
  }

  if (!suggestions) {
    return (
      <div className="card">
        <h4 className="font-semibold mb-2 flex items-center text-sm">
          <Sparkles className="h-3 w-3 mr-1" />
          AI Visual Suggestions
        </h4>
        <button
          onClick={analyzeSlide}
          className="w-full px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
        >
          <Sparkles className="h-3 w-3 inline mr-1" />
          Analyze Slide
        </button>
      </div>
    )
  }

  return (
    <div className="card">
      <h4 className="font-semibold mb-2 flex items-center text-sm">
        <Sparkles className="h-3 w-3 mr-1" />
        AI Visual Suggestions
      </h4>
      
      <div className="space-y-3">
        {/* Visual Type Indicator */}
        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
          <strong>Suggested:</strong> {suggestions.visualType === 'datapoints' ? 'Data Visualization' : 
                                    suggestions.visualType === 'keywords' ? 'Keyword Art' : 'Icon'}
        </div>

        {/* Icon Suggestion */}
        {suggestions.visualType === 'icon' && suggestions.icon && (
          <div className="space-y-2">
            <div className="text-xs text-gray-600">Suggested Icon:</div>
            <button
              onClick={() => handleAddIcon(suggestions.icon)}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            >
              {getIconComponent(suggestions.icon)}
              <span className="text-sm font-medium">{suggestions.icon}</span>
            </button>
          </div>
        )}

        {/* Data Visualization Suggestion */}
        {suggestions.visualType === 'datapoints' && suggestions.datapoints && (
          <div className="space-y-2">
            <div className="text-xs text-gray-600">Suggested Chart:</div>
            <button
              onClick={() => handleAddDataVisualization(suggestions.datapoints)}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="text-sm font-medium">{suggestions.datapoints.title}</span>
            </button>
            <div className="text-xs text-gray-500">
              Type: {suggestions.datapoints.type} | Data points: {suggestions.datapoints.data.length}
            </div>
          </div>
        )}

        {/* Keyword Art Suggestion */}
        {suggestions.visualType === 'keywords' && suggestions.keywords && (
          <div className="space-y-2">
            <div className="text-xs text-gray-600">Suggested Keywords:</div>
            <button
              onClick={() => handleAddKeywordArt(suggestions.keywords)}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
            >
              <Type className="h-4 w-4" />
              <span className="text-sm font-medium">Add Keyword Art</span>
            </button>
            <div className="text-xs text-gray-500">
              Keywords: {suggestions.keywords.join(', ')}
            </div>
          </div>
        )}

        {/* AI Reasoning */}
        {suggestions.reasoning && (
          <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
            <strong>AI Reasoning:</strong> {suggestions.reasoning}
          </div>
        )}

        {/* Refresh Button */}
        <button
          onClick={analyzeSlide}
          className="w-full px-2 py-1 text-xs text-gray-600 hover:text-gray-800 transition-colors"
        >
          🔄 Refresh Suggestions
        </button>
      </div>
    </div>
  )
}

export default VisualSuggestionsPanel
