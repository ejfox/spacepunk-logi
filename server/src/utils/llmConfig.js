export class LLMConfig {
  constructor() {
    // Check if we should use local LLM
    this.useLocalLLM = process.env.USE_LOCAL_LLM === 'true'
    
    if (this.useLocalLLM) {
      this.config = {
        baseUrl: process.env.LOCAL_LLM_URL || 'http://localhost:1234/v1',
        model: process.env.LOCAL_LLM_MODEL || 'lmstudio-community/Meta-Llama-3.1-8B-Instruct-GGUF',
        apiKey: null, // Local LLM doesn't need API key
        headers: {
          'Content-Type': 'application/json'
        }
      }
    } else {
      this.config = {
        baseUrl: 'https://openrouter.ai/api/v1',
        model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.2-3b-instruct:free',
        apiKey: process.env.OPENROUTER_API_KEY,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'http://localhost:3001',
          'X-Title': 'Spacepunk Logistics Sim'
        }
      }
    }
  }
  
  getConfig() {
    return this.config
  }
  
  isConfigured() {
    if (this.useLocalLLM) {
      return true // Local LLM is always ready if URL is accessible
    }
    return !!this.config.apiKey
  }
  
  getEndpoint(path = '/chat/completions') {
    return `${this.config.baseUrl}${path}`
  }
}