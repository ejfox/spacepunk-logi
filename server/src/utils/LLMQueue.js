import { EventEmitter } from 'events';

export class LLMQueue extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.queue = [];
    this.processing = false;
    this.requestsPerMinute = options.requestsPerMinute || 30; // Conservative default
    this.requestsThisMinute = 0;
    this.windowStart = Date.now();
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
    
    // Track request timing for smart batching
    this.averageResponseTime = 2000; // Start with 2s estimate
    this.responseTimeHistory = [];
    
    console.log(`🤖 LLM Queue initialized: ${this.requestsPerMinute} req/min limit`);
  }

  // Add request to queue with priority support
  async enqueue(llmFunction, priority = 'normal') {
    return new Promise((resolve, reject) => {
      const request = {
        id: this.generateRequestId(),
        llmFunction,
        priority,
        resolve,
        reject,
        attempts: 0,
        enqueuedAt: Date.now()
      };

      // Insert by priority (high -> normal -> low)
      if (priority === 'high') {
        this.queue.unshift(request);
      } else if (priority === 'low') {
        this.queue.push(request);
      } else {
        // Insert normal priority in middle
        const firstLowIndex = this.queue.findIndex(r => r.priority === 'low');
        if (firstLowIndex === -1) {
          this.queue.push(request);
        } else {
          this.queue.splice(firstLowIndex, 0, request);
        }
      }

      this.emit('queued', { id: request.id, queueLength: this.queue.length, priority });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      // Check rate limit
      if (!this.canMakeRequest()) {
        const waitTime = this.getWaitTime();
        console.log(`⏱️  Rate limit reached, waiting ${waitTime}ms (${this.queue.length} queued)`);
        await this.sleep(waitTime);
        continue;
      }

      const request = this.queue.shift();
      await this.processRequest(request);
    }
    
    this.processing = false;
  }

  async processRequest(request) {
    const startTime = Date.now();
    request.attempts++;

    try {
      this.trackRequest();
      
      this.emit('processing', { 
        id: request.id, 
        attempt: request.attempts,
        queuedFor: startTime - request.enqueuedAt 
      });

      const result = await request.llmFunction();
      const responseTime = Date.now() - startTime;
      
      this.updateResponseTimeStats(responseTime);
      this.emit('completed', { id: request.id, responseTime, attempts: request.attempts });
      
      request.resolve(result);
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      this.emit('error', { 
        id: request.id, 
        error: error.message, 
        attempt: request.attempts,
        responseTime 
      });

      if (request.attempts < this.maxRetries) {
        // Exponential backoff for retries
        const delay = this.retryDelay * Math.pow(2, request.attempts - 1);
        console.log(`🔄 Retrying request ${request.id} in ${delay}ms (attempt ${request.attempts + 1}/${this.maxRetries})`);
        
        await this.sleep(delay);
        
        // Re-queue with high priority for retry
        request.priority = 'high';
        this.queue.unshift(request);
      } else {
        console.error(`❌ Request ${request.id} failed after ${this.maxRetries} attempts:`, error.message);
        request.reject(error);
      }
    }
  }

  canMakeRequest() {
    const now = Date.now();
    
    // Reset window if a minute has passed
    if (now - this.windowStart >= 60000) {
      this.requestsThisMinute = 0;
      this.windowStart = now;
    }
    
    return this.requestsThisMinute < this.requestsPerMinute;
  }

  getWaitTime() {
    const timeInWindow = Date.now() - this.windowStart;
    return Math.max(0, 60000 - timeInWindow);
  }

  trackRequest() {
    this.requestsThisMinute++;
  }

  updateResponseTimeStats(responseTime) {
    this.responseTimeHistory.push(responseTime);
    
    // Keep only last 20 response times for rolling average
    if (this.responseTimeHistory.length > 20) {
      this.responseTimeHistory.shift();
    }
    
    this.averageResponseTime = this.responseTimeHistory.reduce((a, b) => a + b) / this.responseTimeHistory.length;
  }

  // Smart batching - estimate if we can fit multiple requests in the window
  canBatch(requestCount) {
    const estimatedTime = this.averageResponseTime * requestCount;
    const remainingWindow = 60000 - (Date.now() - this.windowStart);
    const remainingRequests = this.requestsPerMinute - this.requestsThisMinute;
    
    return requestCount <= remainingRequests && estimatedTime < remainingWindow;
  }

  // Utility methods
  generateRequestId() {
    return `llm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Queue statistics
  getStats() {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      requestsThisMinute: this.requestsThisMinute,
      requestsPerMinute: this.requestsPerMinute,
      averageResponseTime: Math.round(this.averageResponseTime),
      windowTimeRemaining: Math.max(0, 60000 - (Date.now() - this.windowStart)),
      priorityBreakdown: {
        high: this.queue.filter(r => r.priority === 'high').length,
        normal: this.queue.filter(r => r.priority === 'normal').length,
        low: this.queue.filter(r => r.priority === 'low').length
      }
    };
  }

  // Batch processing for crew narratives
  async batchEnqueue(requests, priority = 'normal') {
    const promises = requests.map(request => this.enqueue(request, priority));
    return Promise.all(promises);
  }
}