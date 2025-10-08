import React, { useState, useMemo } from 'react'
import { 
  Search, 
  Lightbulb, Target, Rocket, Shield, TrendingUp, Users, Settings, Heart, Star, CheckCircle,
  BarChart3, PieChart, LineChart, Activity, Zap, Award, BookOpen, Briefcase, Calendar,
  Camera, Clock, Code, Database, Download, Edit, FileText, Globe, Home, Image, Mail,
  MapPin, MessageCircle, Phone, Plus, Save, Share, Tag, Trash2, Upload, Video, Volume2
} from 'lucide-react'

const AssetLibrary = ({ onAddIcon, onAddShape, onAddDataVisualization }) => {
  const [activeTab, setActiveTab] = useState('icons')
  const [searchQuery, setSearchQuery] = useState('')

  // Comprehensive icon library organized by categories
  const iconCategories = {
    'Business': {
      'Briefcase': Briefcase,
      'Target': Target,
      'TrendingUp': TrendingUp,
      'BarChart3': BarChart3,
      'PieChart': PieChart,
      'LineChart': LineChart,
      'Activity': Activity,
      'Award': Award,
      'Users': Users,
      'Settings': Settings
    },
    'Creative': {
      'Lightbulb': Lightbulb,
      'Rocket': Rocket,
      'Star': Star,
      'Heart': Heart,
      'Zap': Zap,
      'Camera': Camera,
      'Image': Image,
      'Video': Video,
      'Edit': Edit,
      'BookOpen': BookOpen
    },
    'Communication': {
      'MessageCircle': MessageCircle,
      'Mail': Mail,
      'Phone': Phone,
      'Share': Share,
      'Volume2': Volume2,
      'Globe': Globe,
      'MapPin': MapPin
    },
    'System': {
      'CheckCircle': CheckCircle,
      'Shield': Shield,
      'Clock': Clock,
      'Calendar': Calendar,
      'Save': Save,
      'Download': Download,
      'Upload': Upload,
      'Plus': Plus,
      'Trash2': Trash2,
      'Tag': Tag
    },
    'Tech': {
      'Code': Code,
      'Database': Database,
      'FileText': FileText,
      'Home': Home
    }
  }

  // Data visualization templates
  const dataVisualizationTemplates = [
    {
      id: 'bar-chart',
      name: 'Bar Chart',
      icon: BarChart3,
      description: 'Compare values across categories',
      type: 'bar',
      sampleData: [
        { label: 'Q1', value: 40 },
        { label: 'Q2', value: 60 },
        { label: 'Q3', value: 80 },
        { label: 'Q4', value: 70 }
      ]
    },
    {
      id: 'pie-chart',
      name: 'Pie Chart',
      icon: PieChart,
      description: 'Show parts of a whole',
      type: 'pie',
      sampleData: [
        { label: 'Desktop', value: 45 },
        { label: 'Mobile', value: 35 },
        { label: 'Tablet', value: 20 }
      ]
    },
    {
      id: 'donut-chart',
      name: 'Donut Chart',
      icon: PieChart,
      description: 'Modern pie chart with center hole',
      type: 'donut',
      sampleData: [
        { label: 'Sales', value: 50 },
        { label: 'Marketing', value: 30 },
        { label: 'Support', value: 20 }
      ]
    },
    {
      id: 'line-chart',
      name: 'Line Chart',
      icon: LineChart,
      description: 'Show trends over time',
      type: 'line',
      sampleData: [
        { label: 'Jan', value: 20 },
        { label: 'Feb', value: 30 },
        { label: 'Mar', value: 25 },
        { label: 'Apr', value: 40 }
      ]
    }
  ]

  // Filter icons based on search query
  const filteredIcons = useMemo(() => {
    if (!searchQuery) return iconCategories

    const filtered = {}
    Object.entries(iconCategories).forEach(([category, icons]) => {
      const categoryIcons = Object.entries(icons).filter(([name]) =>
        name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      if (categoryIcons.length > 0) {
        filtered[category] = Object.fromEntries(categoryIcons)
      }
    })
    return filtered
  }, [searchQuery])

  const handleIconClick = (iconName) => {
    if (onAddIcon) {
      onAddIcon(iconName)
    }
  }

  const handleDataVisualizationClick = (template) => {
    if (onAddDataVisualization) {
      onAddDataVisualization({
        type: template.type,
        data: template.sampleData,
        title: template.name,
        colors: ['#ff6600', '#4a9eff', '#00b894', '#ff6b6b', '#9c27b0', '#ff9800']
      })
    }
  }

  const renderIconGrid = () => {
    return Object.entries(filteredIcons).map(([category, icons]) => (
      <div key={category} className="mb-4">
        <h5 className="text-xs font-semibold text-gray-700 mb-2">{category}</h5>
        <div className="grid grid-cols-3 gap-1">
          {Object.entries(icons).map(([name, IconComponent]) => (
            <button
              key={name}
              onClick={() => handleIconClick(name)}
              className="flex flex-col items-center space-y-1 p-2 bg-gray-50 hover:bg-blue-50 rounded transition-colors group"
              title={name}
            >
              <IconComponent className="h-4 w-4 text-gray-600 group-hover:text-blue-600" />
              <span className="text-xs text-gray-500 group-hover:text-blue-600 truncate w-full">
                {name}
              </span>
            </button>
          ))}
        </div>
      </div>
    ))
  }

  const renderDataVisualizations = () => {
    return (
      <div className="space-y-2">
        {dataVisualizationTemplates.map((template) => {
          const IconComponent = template.icon
          return (
            <button
              key={template.id}
              onClick={() => handleDataVisualizationClick(template)}
              className="w-full flex items-center space-x-3 p-3 bg-gray-50 hover:bg-green-50 rounded transition-colors group"
            >
              <IconComponent className="h-5 w-5 text-gray-600 group-hover:text-green-600" />
              <div className="flex-1 text-left">
                <div className="text-sm font-medium text-gray-900 group-hover:text-green-700">
                  {template.name}
                </div>
                <div className="text-xs text-gray-500 group-hover:text-green-600">
                  {template.description}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="card">
      <h4 className="font-semibold mb-3 flex items-center text-sm">
        <Search className="h-3 w-3 mr-1" />
        Asset Library
      </h4>

      {/* Search Bar */}
      <div className="mb-3">
        <input
          type="text"
          placeholder="Search icons..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-3">
        <button
          onClick={() => setActiveTab('icons')}
          className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
            activeTab === 'icons'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Icons
        </button>
        <button
          onClick={() => setActiveTab('charts')}
          className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
            activeTab === 'charts'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Charts
        </button>
      </div>

      {/* Content */}
      <div className="max-h-64 overflow-y-auto">
        {activeTab === 'icons' && renderIconGrid()}
        {activeTab === 'charts' && renderDataVisualizations()}
      </div>

      {/* Quick Stats */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          {activeTab === 'icons' 
            ? `${Object.values(filteredIcons).reduce((acc, icons) => acc + Object.keys(icons).length, 0)} icons available`
            : `${dataVisualizationTemplates.length} chart templates available`
          }
        </div>
      </div>
    </div>
  )
}

export default AssetLibrary
