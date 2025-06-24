// Simple TVTropes scraper for Spacepunk narrative generation
// Note: This is for educational/research purposes only. Respect robots.txt and rate limits.

import fetch from 'node-fetch'
import fs from 'fs/promises'
import Chance from 'chance'

export class TropesScraper {
  constructor(seed = 'spacepunk-tropes') {
    this.chance = new Chance(seed)
    this.baseUrl = 'https://tvtropes.org'
    this.scrapedTropes = new Map()
    this.rateLimitDelay = 2000 // 2 seconds between requests
    this.userAgent = 'Spacepunk Research Bot (Educational Use)'
  }

  // Scrape specific space/sci-fi related trope categories
  async scrapeSpacePunkTropes() {
    const spaceTropeCategories = [
      '/pmwiki/pmwiki.php/Main/SpaceOpera',
      '/pmwiki/pmwiki.php/Main/CyberPunk', 
      '/pmwiki/pmwiki.php/Main/SpaceTrucker',
      '/pmwiki/pmwiki.php/Main/CorporateWarfare',
      '/pmwiki/pmwiki.php/Main/MegaCorp',
      '/pmwiki/pmwiki.php/Main/SpaceStation',
      '/pmwiki/pmwiki.php/Main/SpacePirates',
      '/pmwiki/pmwiki.php/Main/ArtificialGravity',
      '/pmwiki/pmwiki.php/Main/SpaceIsolationMadness',
      '/pmwiki/pmwiki.php/Main/CorporateSponsoredSuperhero'
    ]

    const scrapedData = {
      categories: {},
      tropes: {},
      metadata: {
        scraped_at: new Date().toISOString(),
        total_categories: spaceTropeCategories.length,
        scraper_version: '1.0.0'
      }
    }

    for (const category of spaceTropeCategories) {
      try {
        console.log(`Scraping category: ${category}`)
        const categoryData = await this.scrapeCategory(category)
        const categoryName = category.split('/').pop()
        scrapedData.categories[categoryName] = categoryData
        
        // Merge tropes into main collection
        Object.assign(scrapedData.tropes, categoryData.tropes)
        
        // Rate limiting
        await this.delay(this.rateLimitDelay)
        
      } catch (error) {
        console.error(`Failed to scrape ${category}:`, error.message)
      }
    }

    scrapedData.metadata.total_tropes = Object.keys(scrapedData.tropes).length
    
    // Save to file
    await this.saveTropesData(scrapedData)
    
    return scrapedData
  }

  async scrapeCategory(categoryPath) {
    const url = `${this.baseUrl}${categoryPath}`
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const html = await response.text()
      return this.parseCategory(html, categoryPath)
      
    } catch (error) {
      console.error(`Error fetching ${url}:`, error.message)
      return { tropes: {}, description: '', examples: [] }
    }
  }

  parseCategory(html, categoryPath) {
    const categoryData = {
      tropes: {},
      description: '',
      examples: [],
      related_tropes: []
    }

    // Extract main description (very basic HTML parsing)
    const descriptionMatch = html.match(/<div[^>]*class="folder"[^>]*>(.*?)<\/div>/s)
    if (descriptionMatch) {
      categoryData.description = this.cleanText(descriptionMatch[1])
    }

    // Extract trope links (basic regex - not perfect but functional)
    const tropeLinks = html.match(/\/pmwiki\/pmwiki\.php\/Main\/[A-Za-z0-9]+/g) || []
    const uniqueTropes = [...new Set(tropeLinks)]

    // Extract trope names and create entries
    uniqueTropes.forEach(link => {
      const tropeName = link.split('/').pop()
      if (tropeName && tropeName.length > 2) {
        categoryData.tropes[tropeName] = {
          name: this.camelCaseToWords(tropeName),
          url: `${this.baseUrl}${link}`,
          category: categoryPath.split('/').pop(),
          keywords: this.generateKeywords(tropeName)
        }
      }
    })

    return categoryData
  }

  // Convert CamelCase trope names to readable words
  camelCaseToWords(str) {
    return str.replace(/([A-Z])/g, ' $1').trim()
  }

  // Generate keywords for trope matching
  generateKeywords(tropeName) {
    const words = this.camelCaseToWords(tropeName).toLowerCase().split(' ')
    const keywords = [...words]
    
    // Add variations and synonyms
    if (words.includes('corp') || words.includes('corporate')) {
      keywords.push('corporation', 'business', 'company')
    }
    if (words.includes('space')) {
      keywords.push('spaceship', 'galaxy', 'interstellar', 'cosmic')
    }
    if (words.includes('cyber')) {
      keywords.push('technology', 'digital', 'hacking', 'virtual')
    }
    
    return keywords
  }

  cleanText(html) {
    // Remove HTML tags and decode entities (basic)
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 500) // Limit length
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async saveTropesData(data) {
    const filename = `spacepunk-tropes-${Date.now()}.json`
    const filepath = `./src/data/${filename}`
    
    try {
      await fs.writeFile(filepath, JSON.stringify(data, null, 2))
      console.log(`Tropes data saved to ${filepath}`)
      
      // Also save a simplified CSV for easy import
      await this.saveCSV(data, `./src/data/spacepunk-tropes-${Date.now()}.csv`)
      
    } catch (error) {
      console.error('Failed to save tropes data:', error)
    }
  }

  async saveCSV(data, filepath) {
    const csvRows = ['name,category,keywords,url']
    
    Object.entries(data.tropes).forEach(([key, trope]) => {
      const row = [
        `"${trope.name}"`,
        `"${trope.category}"`, 
        `"${trope.keywords.join(';')}"`,
        `"${trope.url}"`
      ].join(',')
      csvRows.push(row)
    })
    
    await fs.writeFile(filepath, csvRows.join('\n'))
    console.log(`CSV saved to ${filepath}`)
  }

  // Create a curated spacepunk tropes collection without scraping
  generateCuratedSpacePunkTropes() {
    return {
      corporate: [
        { name: "Mega Corp", keywords: ["corporation", "business", "monopoly", "evil company"], description: "Massive corporations with more power than governments" },
        { name: "Corporate Warfare", keywords: ["business war", "corporate espionage", "hostile takeover"], description: "Companies fighting like nations" },
        { name: "Wage Slave", keywords: ["employee", "worker", "indentured", "corporate drone"], description: "Workers trapped in corporate systems" },
        { name: "Company Town", keywords: ["corporate control", "employee housing", "company store"], description: "Settlements owned entirely by corporations" },
        { name: "Corporate Sponsored Superhero", keywords: ["branded hero", "corporate mascot", "sponsored"], description: "Heroes funded and controlled by corporations" }
      ],
      
      space: [
        { name: "Space Trucker", keywords: ["hauler", "cargo", "freight", "logistics"], description: "Blue collar workers in space" },
        { name: "Space Station", keywords: ["orbital", "habitat", "outpost", "dock"], description: "Artificial habitats in space" },
        { name: "Space Pirates", keywords: ["raiders", "smugglers", "outlaws", "bandits"], description: "Criminal organizations in space" },
        { name: "Generation Ship", keywords: ["colony ship", "long journey", "multi-generation"], description: "Ships that travel for generations" },
        { name: "Space Isolation Madness", keywords: ["cabin fever", "space madness", "isolation"], description: "Psychological effects of space travel" }
      ],
      
      cyberpunk: [
        { name: "Cyber Punk", keywords: ["hacker", "technology", "dystopia", "rebellion"], description: "High tech, low life dystopian future" },
        { name: "Digital Piracy", keywords: ["hacking", "data theft", "cyber crime"], description: "Criminal activity in digital space" },
        { name: "Corporate Samurai", keywords: ["cyber warrior", "corporate enforcer", "tech fighter"], description: "Warriors serving corporate masters" },
        { name: "Memory Implant", keywords: ["artificial memory", "brain chip", "neural interface"], description: "Technology that affects memory" },
        { name: "AI Is A Crapshoot", keywords: ["artificial intelligence", "AI rebellion", "machine uprising"], description: "AI that doesn't work as intended" }
      ],
      
      narrative: [
        { name: "Mundane Made Awesome", keywords: ["ordinary", "bureaucratic", "paperwork", "mundane"], description: "Treating boring things as epic" },
        { name: "Blatant Lies", keywords: ["corporate speak", "euphemism", "propaganda"], description: "Obvious falsehoods presented as truth" },
        { name: "Suspiciously Specific Denial", keywords: ["denial", "cover up", "corporate PR"], description: "Denials that reveal more than they hide" },
        { name: "Kafka Komedy", keywords: ["bureaucracy", "absurd", "catch 22", "red tape"], description: "Comedy derived from bureaucratic nightmares" },
        { name: "Dystopia Justifies The Means", keywords: ["necessary evil", "corporate efficiency", "dystopia"], description: "Justifying terrible systems for efficiency" }
      ]
    }
  }

  // Quick method to get spacepunk tropes without scraping
  async getSpacePunkTropes() {
    try {
      // Try to load existing scraped data
      const existingData = await fs.readFile('./src/data/spacepunk-tropes.json', 'utf8')
      return JSON.parse(existingData)
    } catch (error) {
      // Fall back to curated collection
      console.log('Using curated tropes collection')
      const curated = this.generateCuratedSpacePunkTropes()
      
      // Save for future use
      await fs.writeFile('./src/data/spacepunk-tropes.json', JSON.stringify(curated, null, 2))
      return curated
    }
  }
}

// Usage example:
// const scraper = new TropesScraper()
// const tropes = await scraper.getSpacePunkTropes()
// console.log('Available tropes:', Object.keys(tropes).length)