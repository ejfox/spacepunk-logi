import { LLMConfig } from '../utils/llmConfig.js'

export class MarketDataGenerator {
  constructor() {
    this.llmConfig = new LLMConfig()
  }

  async generateMarketCommentary(marketData) {
    if (!this.llmConfig.isConfigured()) {
      return this.getFallbackCommentary(marketData)
    }

    const prompt = `You are a cynical market analyst for a space logistics company. Generate a brief (1-2 sentence) market commentary about ${marketData.resourceName} at ${marketData.stationName}.

Current data:
- Price: ${marketData.currentPrice} CR (${marketData.priceTrend > 0 ? '+' : ''}${marketData.priceTrend.toFixed(1)}% trend)
- Supply: ${marketData.supply} units
- Demand: ${marketData.demand} units
- Supply/Demand Ratio: ${(marketData.supply / marketData.demand).toFixed(2)}

The commentary should be darkly humorous, corporate-speak, and cynical. Reference specific market conditions and use bureaucratic language. Keep it brief and punchy.`

    try {
      const response = await fetch(this.llmConfig.getEndpoint(), {
        method: 'POST',
        headers: this.llmConfig.getConfig().headers,
        body: JSON.stringify({
          model: this.llmConfig.getConfig().model,
          messages: [
            {
              role: 'system',
              content: 'You are a market analyst for a dystopian space corporation. Your commentary is always brief, cynical, and uses corporate doublespeak.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 100,
          temperature: 0.8
        })
      })

      if (!response.ok) {
        console.error('LLM API error:', response.status)
        return this.getFallbackCommentary(marketData)
      }

      const data = await response.json()
      return data.choices?.[0]?.message?.content || this.getFallbackCommentary(marketData)
    } catch (error) {
      console.error('Market commentary generation error:', error)
      return this.getFallbackCommentary(marketData)
    }
  }

  getFallbackCommentary(marketData) {
    const templates = [
      `Another day, another ${marketData.priceTrend > 0 ? 'profit opportunity' : 'market correction'} for ${marketData.resourceName}.`,
      `Supply chain "optimization" continues to ${marketData.supply > marketData.demand ? 'flood' : 'starve'} the ${marketData.resourceName} market.`,
      `Corporate recommends ${marketData.priceTrend > 0 ? 'immediate liquidation' : 'aggressive acquisition'} of ${marketData.resourceName} holdings.`,
      `${marketData.stationName} market conditions remain "within acceptable parameters" for ${marketData.resourceName}.`,
      `Regulatory compliance suggests ${marketData.resourceName} trading is "${marketData.priceTrend > 0 ? 'overheated' : 'undervalued'}".`
    ]
    
    return templates[Math.floor(Math.random() * templates.length)]
  }

  async generateEventDescription(event) {
    if (!this.llmConfig.isConfigured()) {
      return event.description
    }

    const prompt = `You are a news reporter for a dystopian space corporation. Write a brief (1-2 sentence) news headline about this market event:

Event: ${event.name}
Resource: ${event.resourceName}
Station: ${event.stationName}
Impact: Supply ${event.supplyMultiplier}x, Demand ${event.demandMultiplier}x

The headline should be darkly humorous, use corporate doublespeak, and sound like propaganda. Keep it brief and memorable.`

    try {
      const response = await fetch(this.llmConfig.getEndpoint(), {
        method: 'POST',
        headers: this.llmConfig.getConfig().headers,
        body: JSON.stringify({
          model: this.llmConfig.getConfig().model,
          messages: [
            {
              role: 'system',
              content: 'You are a corporate news writer who specializes in spinning market events with dystopian corporate propaganda.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 100,
          temperature: 0.9
        })
      })

      if (!response.ok) {
        return event.description
      }

      const data = await response.json()
      return data.choices?.[0]?.message?.content || event.description
    } catch (error) {
      console.error('Event description generation error:', error)
      return event.description
    }
  }
}