// Test streaming endpoint that mimics the real API for testing
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3666;

app.use(cors());
app.use(express.json());

app.get('/api/test', (req, res) => {
  res.json({ status: 'Backend is working', timestamp: new Date().toISOString() });
});

app.post('/api/dialog/generate-stream', async (req, res) => {
  console.log('Streaming dialog request received:', req.body);
  
  // Set up Server-Sent Events
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Send initial queue status
  res.write(`data: ${JSON.stringify({
    type: 'queue_status',
    queueStatus: {
      position: 1,
      queueLength: 0,
      priority: 'high'
    },
    dialog: {
      situation: '',
      choices: [],
      id: 'test-dialog-123',
      queueStatus: {},
      streamProgress: { characters: 0, percentage: 0 },
      elapsedTime: 0
    }
  })}\n\n`);

  let tokens = 0;
  let content = '';
  const maxTokens = 100;
  
  // Simulate streaming response
  const streamInterval = setInterval(() => {
    tokens += Math.floor(Math.random() * 5) + 1;
    content += `Token batch ${tokens}... `;
    
    // Send streaming chunk
    res.write(`data: ${JSON.stringify({
      type: 'chunk',
      content: `Token batch ${tokens}... `,
      fullContent: content,
      tokensReceived: tokens,
      maxTokens: maxTokens,
      dialog: {
        situation: content,
        choices: [],
        isStreaming: true,
        tokensReceived: tokens,
        maxTokens: maxTokens,
        streamingContent: content
      }
    })}\n\n`);

    if (tokens >= maxTokens) {
      clearInterval(streamInterval);
      
      // Send final dialog
      res.write(`data: ${JSON.stringify({
        type: 'complete',
        dialog: {
          situation: 'You discover a mysterious space station drifting in the void.',
          choices: [
            {
              id: 'investigate',
              text: 'Investigate the station',
              risk: 'medium',
              consequences: { fuel: -10, credits: 200, heat: 5 }
            },
            {
              id: 'ignore',
              text: 'Continue on your route',
              risk: 'low',
              consequences: { fuel: -5, credits: 0, heat: 0 }
            },
            {
              id: 'salvage',
              text: 'Attempt to salvage equipment',
              risk: 'high',
              consequences: { fuel: -15, credits: 500, heat: 15 }
            }
          ],
          id: 'test-dialog-complete'
        }
      })}\n\n`);
      
      res.end();
    }
  }, 200); // Send update every 200ms

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(streamInterval);
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Test streaming server running on http://localhost:${PORT}`);
  console.log('📡 Ready to test streaming dialog at /api/dialog/generate-stream');
});