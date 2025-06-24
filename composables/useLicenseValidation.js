import { computed } from 'vue'
import { useAppStore } from './appStore'

export function useLicenseValidation() {
  const store = useAppStore()
  
  const currentLicense = computed(() => store.player?.software_license || 'BASIC')
  
  const hasBasicAccess = computed(() => true) // Everyone has basic access
  
  const hasStandardAccess = computed(() => {
    return currentLicense.value === 'STANDARD' || currentLicense.value === 'PROFESSIONAL'
  })
  
  const hasProfessionalAccess = computed(() => {
    return currentLicense.value === 'PROFESSIONAL'
  })
  
  // Tab access validation
  const canAccessTab = (tabName) => {
    const tabRequirements = {
      // BASIC tabs (always available)
      'crew': 'BASIC',
      'market': 'BASIC',
      'ship_systems': 'BASIC',
      
      // STANDARD tabs
      'missions': 'STANDARD',
      'ship_log': 'STANDARD',
      'training': 'STANDARD',
      
      // PROFESSIONAL tabs
      'analytics': 'PROFESSIONAL',
      'automation': 'PROFESSIONAL',
      'advanced_nav': 'PROFESSIONAL'
    }
    
    const requiredLicense = tabRequirements[tabName] || 'BASIC'
    
    switch (requiredLicense) {
      case 'BASIC':
        return hasBasicAccess.value
      case 'STANDARD':
        return hasStandardAccess.value
      case 'PROFESSIONAL':
        return hasProfessionalAccess.value
      default:
        return false
    }
  }
  
  // Get locked tabs for current license
  const getLockedTabs = computed(() => {
    const allTabs = [
      { name: 'crew', license: 'BASIC' },
      { name: 'market', license: 'BASIC' },
      { name: 'ship_systems', license: 'BASIC' },
      { name: 'missions', license: 'STANDARD' },
      { name: 'ship_log', license: 'STANDARD' },
      { name: 'training', license: 'STANDARD' },
      { name: 'analytics', license: 'PROFESSIONAL' },
      { name: 'automation', license: 'PROFESSIONAL' },
      { name: 'advanced_nav', license: 'PROFESSIONAL' }
    ]
    
    return allTabs.filter(tab => !canAccessTab(tab.name))
  })
  
  // Get next available upgrade
  const getNextUpgrade = computed(() => {
    switch (currentLicense.value) {
      case 'BASIC':
        return {
          name: 'STANDARD',
          cost: 5000,
          features: ['Mission Board Access', 'Ship\'s Log Terminal', 'Training Queue Management']
        }
      case 'STANDARD':
        return {
          name: 'PROFESSIONAL',
          cost: 25000,
          features: ['Advanced Analytics Dashboard', 'Automation Scripts', 'Enhanced Navigation Systems']
        }
      default:
        return null
    }
  })
  
  // Generate corporate jargon for license benefits
  const getLicenseDescription = (license) => {
    const descriptions = {
      'BASIC': 'Essential ship management functionality with limited interface access. Suitable for entry-level logistics operators.',
      'STANDARD': 'Enhanced operational capabilities including mission tracking and crew development tools. Recommended for established captains.',
      'PROFESSIONAL': 'Full-spectrum command suite with advanced analytics and automation. Enterprise-grade solution for serious logistics professionals.'
    }
    return descriptions[license] || ''
  }
  
  return {
    currentLicense,
    hasBasicAccess,
    hasStandardAccess,
    hasProfessionalAccess,
    canAccessTab,
    getLockedTabs,
    getNextUpgrade,
    getLicenseDescription
  }
}