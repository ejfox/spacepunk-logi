<template>
  <div class="story-log">
    <div class="story-header" v-if="title">
      <h2 class="story-title">{{ title }}</h2>
      <div class="story-meta" v-if="timestamp || location">
        <span v-if="timestamp" class="story-timestamp">{{ formatTimestamp(timestamp) }}</span>
        <span v-if="location" class="story-location">{{ location }}</span>
      </div>
    </div>

    <div class="story-content">
      <div v-for="(entry, index) in entries" :key="index" 
           class="story-entry" 
           :class="entry.type">
        <div v-if="entry.speaker" class="story-speaker">
          {{ entry.speaker }}
        </div>

        <div class="story-text" v-html="formatStoryText(entry.text)">
        </div>

        <div v-if="entry.choices && entry.choices.length" class="story-choices">
          <button v-for="(choice, choiceIndex) in entry.choices" :key="choiceIndex" class="story-choice"
            @click="$emit('choice', choice)">
            {{ choice.text }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="showContinue" class="story-continue">
      <button class="continue-btn" @click="$emit('continue')">
        Continue
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  title: String,
  timestamp: [String, Number, Date],
  location: String,
  entries: {
    type: Array,
    default: () => []
  },
  showContinue: {
    type: Boolean,
    default: false
  }
})

defineEmits(['choice', 'continue'])

// Format timestamp
const formatTimestamp = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Format story text with emphasis
const formatStoryText = (text) => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')
}
</script>

<style scoped>
/* Override global font with maximum specificity */
.story-log,
.story-log * {
  font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif !important;
}

.story-log {
  max-width: 680px;
  margin: 0 auto;
  padding: 48px 64px;
  background: linear-gradient(135deg, #fefefe 0%, #f8f8f8 100%);
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.1),
    0 8px 16px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  color: #2c2c2c;
  line-height: 1.75;
  position: relative;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .story-log {
    background: linear-gradient(135deg, #f8f8f6 0%, #ede9e1 100%);
    color: #2a2922;
    box-shadow:
      0 24px 48px rgba(0, 0, 0, 0.2),
      0 12px 24px rgba(0, 0, 0, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.6);
  }
}

.story-header {
  text-align: center;
  margin-bottom: 40px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.story-title {
  font-size: 28px;
  font-weight: 500;
  margin: 0 0 20px 0;
  color: #1a1a1a;
  letter-spacing: -0.025em;
  line-height: 1.3;
}

.story-meta {
  display: flex;
  justify-content: center;
  gap: 24px;
  font-size: 12px;
  color: #666;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.story-entry {
  margin-bottom: 36px;
}

.story-entry.dialogue {
  padding-left: 32px;
  border-left: 4px solid #e5e5e5;
  position: relative;
}

.story-entry.dialogue::before {
  content: '"';
  position: absolute;
  left: -4px;
  top: -8px;
  font-size: 48px;
  line-height: 1;
  color: #e0e0e0;
  font-family: Georgia, serif;
}

.story-entry.action {
  font-style: italic;
  color: #555;
}

.story-entry.system {
  background: rgba(0, 0, 0, 0.03);
  padding: 16px 20px;
  border-radius: 6px;
  font-size: 14px;
  color: #666;
}

.story-speaker {
  font-weight: 600;
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.story-text {
  font-size: 17px;
  line-height: 1.8;
  color: #2c2c2c;
  font-weight: 400;
}

.story-text strong {
  font-weight: 600;
  color: #1a1a1a;
}

.story-text em {
  font-style: italic;
  color: #444;
}

.story-choices {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.story-choice {
  background: #f8f8f8;
  border: 1px solid #e0e0e0;
  padding: 12px 20px;
  border-radius: 6px;
  font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif !important;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.story-choice:hover {
  background: #f0f0f0;
  border-color: #ccc;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.story-continue {
  text-align: center;
  margin-top: 40px;
  padding-top: 24px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.continue-btn {
  background: #2c2c2c;
  color: white;
  border: none;
  padding: 12px 32px;
  border-radius: 6px;
  font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif !important;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.continue-btn:hover {
  background: #1a1a1a;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* Responsive design */
@media (max-width: 768px) {
  .story-log {
    padding: 24px 32px;
    margin: 16px;
  }

  .story-title {
    font-size: 20px;
  }

  .story-text {
    font-size: 15px;
  }
}

@media (max-width: 480px) {
  .story-log {
    padding: 20px 24px;
    margin: 12px;
  }

  .story-meta {
    flex-direction: column;
    gap: 8px;
  }
}
</style>
