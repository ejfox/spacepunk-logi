export class LLMConfig {
  constructor() {
    // Initialize multiple LLM providers with fallback/round-robin
    this.providers = [];
    this.currentProviderIndex = 0;
    
    // Add local LLM if enabled
    if (process.env.USE_LOCAL_LLM === 'true') {
      this.providers.push({
        name: 'local',
        type: 'local',
        baseUrl: process.env.LOCAL_LLM_URL || 'http://localhost:1234/v1',
        model: process.env.LOCAL_LLM_MODEL || 'lmstudio-community/Meta-Llama-3.1-8B-Instruct-GGUF',
        apiKey: null,
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 45000, // 45s timeout for local
        priority: 1 // Higher priority
      });
    }
    
    // Add OpenRouter free models if API key is available
    if (process.env.OPENROUTER_API_KEY) {
      const freeModels = [
        'meta-llama/llama-3.2-3b-instruct:free',
        'microsoft/phi-3-mini-128k-instruct:free',
        'google/gemma-2-9b-it:free',
        'huggingfaceh4/zephyr-7b-beta:free'
      ];
      
      freeModels.forEach((model, index) => {
        this.providers.push({
          name: `openrouter-${index}`,
          type: 'openrouter',
          baseUrl: 'https://openrouter.ai/api/v1',
          model: model,
          apiKey: process.env.OPENROUTER_API_KEY,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'http://localhost:3001',
            'X-Title': 'Spacepunk Logistics Sim'
          },
          timeout: 30000, // 30s timeout for OpenRouter
          priority: 2 // Lower priority than local
        });
      });
    }
    
    console.log(`🤖 LLM Providers configured: ${this.providers.length} providers`);
    this.providers.forEach(p => console.log(`   ${p.name}: ${p.model} (${p.type})`));
    
    // Fallback to primary provider for backward compatibility
    this.config = this.providers[0] || this.getDefaultConfig();
  }
  
  getDefaultConfig() {
    return {
      name: 'fallback',
      type: 'openrouter',
      baseUrl: 'https://openrouter.ai/api/v1',
      model: 'meta-llama/llama-3.2-3b-instruct:free',
      apiKey: process.env.OPENROUTER_API_KEY,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:3001',
        'X-Title': 'Spacepunk Logistics Sim'
      },
      timeout: 30000,
      priority: 3
    };
  }
  
  getConfig() {
    return this.config
  }
  
  // Get next provider in round-robin fashion
  getNextProvider() {
    if (this.providers.length === 0) return this.getDefaultConfig();
    
    const provider = this.providers[this.currentProviderIndex];
    this.currentProviderIndex = (this.currentProviderIndex + 1) % this.providers.length;
    return provider;
  }
  
  // Get best available provider (prioritizes by priority, then availability)
  async getBestProvider() {
    const sortedProviders = [...this.providers].sort((a, b) => a.priority - b.priority);
    
    for (const provider of sortedProviders) {
      if (await this.isProviderAvailable(provider)) {
        console.log(`🎯 Selected provider: ${provider.name} (${provider.model})`);
        return provider;
      }
    }
    
    console.log('⚠️ No providers available, using fallback');
    return this.getDefaultConfig();
  }
  
  // Check if a provider is available (quick health check)
  async isProviderAvailable(provider) {
    if (provider.type === 'local') {
      try {
        const response = await fetch(`${provider.baseUrl.replace('/v1', '')}/health`, {
          method: 'GET',
          timeout: 2000 // Quick check
        });
        return response.ok;
      } catch {
        return false; // Local LLM not available
      }
    }
    
    // OpenRouter is generally available
    return !!provider.apiKey;
  }
  
  isConfigured() {
    return this.providers.length > 0 || !!this.getDefaultConfig().apiKey;
  }
  
  getEndpoint(path = '/chat/completions', provider = null) {
    const config = provider || this.config;
    return `${config.baseUrl}${path}`
  }
}