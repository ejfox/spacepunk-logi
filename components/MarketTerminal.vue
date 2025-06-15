<template>
  <div class="market-terminal">
    <div class="terminal-header">
      <div class="terminal-title">[ MARKET DATA TERMINAL v2.3.1 ]</div>
      <div class="terminal-status">
        <span :class="{ 'blink': isConnected }">{{ connectionStatus }}</span>
        <span class="separator">|</span>
        <span>{{ currentTime }}</span>
        <span class="separator">|</span>
        <span>STATION: {{ currentStation }}</span>
      </div>
    </div>
    
    <div class="market-grid">
      <div class="market-header">
        <div class="col-name">COMMODITY</div>
        <div class="col-price">PRICE</div>
        <div class="col-change">24H%</div>
        <div class="col-sparkline">7D TREND</div>
        <div class="col-supply">SUPPLY</div>
        <div class="col-demand">DEMAND</div>
        <div class="col-ratio">S/D</div>
        <div class="col-volume">VOL</div>
      </div>
      
      <div class="market-category" v-for="category in groupedResources" :key="category.name">
        <div class="category-header">
          ── {{ category.name.toUpperCase() }} ──────────────────────────────────────────────────
        </div>
        
        <div
          v-for="resource in category.resources"
          :key="resource.id"
          class="market-row"
          :class="{
            'price-up': resource.price_trend > 5,
            'price-down': resource.price_trend < -5,
            'price-volatile': Math.abs(resource.price_trend) > 20
          }"
        >
          <div class="col-name">
            <span class="resource-code">{{ getResourceCode(resource) }}</span>
            {{ resource.resource_name || resource.name }}
          </div>
          
          <div class="col-price">
            <span class="price-symbol">¢</span>{{ formatPrice(resource.current_price) }}
          </div>
          
          <div class="col-change" :class="getPriceChangeClass(resource.price_trend)">
            {{ formatPriceChange(resource.price_trend) }}
          </div>
          
          <div class="col-sparkline">
            <span class="sparkline">{{ generateSparkline(resource) }}</span>
          </div>
          
          <div class="col-supply">
            {{ formatNumber(resource.supply) }}
          </div>
          
          <div class="col-demand">
            {{ formatNumber(resource.demand) }}
          </div>
          
          <div class="col-ratio" :class="getRatioClass(resource.supply, resource.demand)">
            {{ formatRatio(resource.supply, resource.demand) }}
          </div>
          
          <div class="col-volume">
            {{ formatVolume(resource) }}
          </div>
        </div>
      </div>
    </div>
    
    <div class="market-footer">
      <div class="market-stats">
        <span>AVG: ¢{{ marketAverage }}</span>
        <span class="separator">│</span>
        <span>↑{{ upCount }} ↓{{ downCount }}</span>
        <span class="separator">│</span>
        <span>VOL: {{ totalVolume }}</span>
      </div>
      <div class="market-alerts">
        <span v-if="alerts.length > 0" class="alert-indicator blink">
          [!] {{ alerts[0] }}
        </span>
      </div>
    </div>
    
    <div class="keyboard-hints">
      [TAB] SWITCH VIEW | [R] REFRESH | [F] FILTER | [S] SORT | [SPACE] QUICK TRADE
    </div>
  </div>
</template>

<script>
export default {
  name: 'MarketTerminal',
  
  data() {
    return {
      resources: [],
      isConnected: true,
      currentTime: '',
      currentStation: 'EARTH-ALPHA',
      alerts: [],
      priceHistory: {},
      updateInterval: null,
      sparklineChars: ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█']
    }
  },
  
  computed: {
    connectionStatus() {
      return this.isConnected ? 'ONLINE' : 'OFFLINE';
    },
    
    groupedResources() {
      const groups = {};
      this.resources.forEach(resource => {
        const category = resource.category || 'other';
        if (!groups[category]) {
          groups[category] = {
            name: category,
            resources: []
          };
        }
        groups[category].resources.push(resource);
      });
      
      return Object.values(groups).sort((a, b) => {
        const order = ['tech', 'consumable', 'green', 'luxury', 'other'];
        return order.indexOf(a.name) - order.indexOf(b.name);
      });
    },
    
    marketAverage() {
      if (this.resources.length === 0) return '0.00';
      const sum = this.resources.reduce((acc, r) => acc + (r.current_price || 0), 0);
      return (sum / this.resources.length).toFixed(2);
    },
    
    upCount() {
      return this.resources.filter(r => r.price_trend > 0).length;
    },
    
    downCount() {
      return this.resources.filter(r => r.price_trend < 0).length;
    },
    
    totalVolume() {
      const vol = this.resources.reduce((acc, r) => acc + (r.supply || 0) + (r.demand || 0), 0);
      return this.formatNumber(vol);
    }
  },
  
  methods: {
    async fetchMarketData() {
      try {
        const response = await fetch('/api/market/data?stationId=' + this.currentStation.toLowerCase());
        const data = await response.json();
        this.resources = data;
        
        // Update price history for sparklines
        this.resources.forEach(resource => {
          if (!this.priceHistory[resource.id]) {
            this.priceHistory[resource.id] = [];
          }
          this.priceHistory[resource.id].push(resource.current_price);
          // Keep only last 20 prices
          if (this.priceHistory[resource.id].length > 20) {
            this.priceHistory[resource.id].shift();
          }
        });
        
        this.checkForAlerts();
      } catch (error) {
        console.error('Market data fetch error:', error);
        this.isConnected = false;
      }
    },
    
    getResourceCode(resource) {
      const name = resource.resource_name || resource.name || '';
      return name.substring(0, 3).toUpperCase().padEnd(3, 'X');
    },
    
    formatPrice(price) {
      return (price || 0).toFixed(2).padStart(7, ' ');
    },
    
    formatPriceChange(trend) {
      if (!trend) return '  0.0%';
      const sign = trend > 0 ? '+' : '';
      return `${sign}${trend.toFixed(1)}%`.padStart(6, ' ');
    },
    
    getPriceChangeClass(trend) {
      if (trend > 5) return 'positive';
      if (trend < -5) return 'negative';
      return 'neutral';
    },
    
    generateSparkline(resource) {
      const history = this.priceHistory[resource.id] || [resource.current_price];
      if (history.length < 2) return '────────';
      
      const min = Math.min(...history);
      const max = Math.max(...history);
      const range = max - min || 1;
      
      return history.slice(-8).map(price => {
        const normalized = (price - min) / range;
        const index = Math.floor(normalized * (this.sparklineChars.length - 1));
        return this.sparklineChars[index];
      }).join('');
    },
    
    formatNumber(num) {
      if (!num) return '0';
      if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
      return num.toString();
    },
    
    formatRatio(supply, demand) {
      if (!demand || demand === 0) return '∞';
      const ratio = supply / demand;
      return ratio.toFixed(2);
    },
    
    getRatioClass(supply, demand) {
      const ratio = supply / demand;
      if (ratio < 0.5) return 'shortage';
      if (ratio > 2) return 'surplus';
      return 'balanced';
    },
    
    formatVolume(resource) {
      const vol = (resource.supply || 0) + (resource.demand || 0);
      return this.formatNumber(vol);
    },
    
    checkForAlerts() {
      this.alerts = [];
      
      this.resources.forEach(resource => {
        if (Math.abs(resource.price_trend) > 20) {
          const direction = resource.price_trend > 0 ? 'SURGE' : 'CRASH';
          this.alerts.push(`${direction}: ${resource.resource_name || resource.name}`);
        }
        
        const ratio = resource.supply / resource.demand;
        if (ratio < 0.2) {
          this.alerts.push(`SHORTAGE: ${resource.resource_name || resource.name}`);
        }
      });
    },
    
    updateClock() {
      const now = new Date();
      this.currentTime = now.toISOString().split('T')[1].split('.')[0];
    }
  },
  
  mounted() {
    this.fetchMarketData();
    this.updateClock();
    
    // Update market data every 30 seconds
    this.updateInterval = setInterval(() => {
      this.fetchMarketData();
    }, 30000);
    
    // Update clock every second
    setInterval(() => {
      this.updateClock();
    }, 1000);
  },
  
  beforeUnmount() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}
</script>

<style scoped>
.market-terminal {
  font-family: 'Courier New', Courier, monospace;
  background: #000;
  color: #0f0;
  padding: 10px;
  border: 2px solid #0f0;
  min-height: 600px;
  font-size: 12px;
  line-height: 1.2;
  position: relative;
  overflow: hidden;
}

.terminal-header {
  border-bottom: 1px solid #0f0;
  padding-bottom: 5px;
  margin-bottom: 10px;
}

.terminal-title {
  font-weight: bold;
  text-align: center;
  margin-bottom: 5px;
}

.terminal-status {
  display: flex;
  justify-content: center;
  gap: 10px;
  font-size: 11px;
}

.separator {
  color: #080;
}

.market-grid {
  margin-bottom: 10px;
}

.market-header {
  display: grid;
  grid-template-columns: 3fr 1.5fr 1fr 2fr 1fr 1fr 0.8fr 1fr;
  gap: 5px;
  border-bottom: 2px solid #0f0;
  padding-bottom: 5px;
  margin-bottom: 5px;
  font-weight: bold;
  color: #0f0;
}

.market-category {
  margin-bottom: 10px;
}

.category-header {
  color: #080;
  font-size: 10px;
  margin: 5px 0;
  overflow: hidden;
  white-space: nowrap;
}

.market-row {
  display: grid;
  grid-template-columns: 3fr 1.5fr 1fr 2fr 1fr 1fr 0.8fr 1fr;
  gap: 5px;
  padding: 2px 0;
  border-bottom: 1px solid #030;
  transition: all 0.3s ease;
}

.market-row:hover {
  background: #030;
  color: #0f0;
}

.price-up {
  background: #020;
}

.price-down {
  background: #200;
}

.price-volatile {
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.col-name {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.resource-code {
  color: #080;
  margin-right: 5px;
  font-size: 10px;
}

.col-price {
  text-align: right;
  font-weight: bold;
}

.price-symbol {
  color: #080;
  font-size: 10px;
}

.col-change {
  text-align: right;
}

.positive {
  color: #0f0;
}

.negative {
  color: #f00;
}

.neutral {
  color: #888;
}

.col-sparkline {
  font-size: 16px;
  line-height: 1;
  letter-spacing: -2px;
  color: #0f0;
}

.sparkline {
  display: inline-block;
  width: 100%;
}

.col-supply, .col-demand, .col-volume {
  text-align: right;
  color: #080;
}

.col-ratio {
  text-align: right;
  font-weight: bold;
}

.shortage {
  color: #f00;
}

.surplus {
  color: #00f;
}

.balanced {
  color: #0f0;
}

.market-footer {
  border-top: 1px solid #0f0;
  padding-top: 5px;
  display: flex;
  justify-content: space-between;
  font-size: 11px;
}

.market-stats {
  display: flex;
  gap: 10px;
}

.alert-indicator {
  color: #f00;
  font-weight: bold;
}

.blink {
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50%, 100% { opacity: 1; }
  25%, 75% { opacity: 0; }
}

.keyboard-hints {
  position: absolute;
  bottom: 5px;
  left: 10px;
  right: 10px;
  text-align: center;
  font-size: 10px;
  color: #080;
  background: #000;
}

/* Glitch effect for volatile markets */
.price-volatile .col-price {
  animation: glitch 0.3s infinite;
}

@keyframes glitch {
  0%, 100% { 
    transform: translate(0);
    color: #0f0;
  }
  20% { 
    transform: translate(-1px, 1px);
    color: #f00;
  }
  40% { 
    transform: translate(1px, -1px);
    color: #00f;
  }
  60% { 
    transform: translate(-1px, 0);
    color: #ff0;
  }
  80% { 
    transform: translate(1px, 0);
    color: #0ff;
  }
}

/* Scrollbar styling */
.market-terminal::-webkit-scrollbar {
  width: 10px;
}

.market-terminal::-webkit-scrollbar-track {
  background: #000;
  border: 1px solid #0f0;
}

.market-terminal::-webkit-scrollbar-thumb {
  background: #0f0;
  border: 1px solid #000;
}

.market-terminal::-webkit-scrollbar-thumb:hover {
  background: #0f0;
}
</style>