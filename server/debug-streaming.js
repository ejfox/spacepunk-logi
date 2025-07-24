// Simple streaming test
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/dialog/generate-stream', async (req, res) => {
  console.log('🎬 DEBUG: Streaming request received');
  
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  console.log('📡 DEBUG: Headers sent, starting interval...');
  
  let count = 0;
  const interval = setInterval(() => {
    count++;
    console.log(`📤 DEBUG: Sending chunk ${count}`);
    
    res.write(`data: {"type":"chunk","content":"Chunk ${count}","count":${count}}\n\n`);
    
    if (count >= 5) {
      console.log('✅ DEBUG: Sending completion');
      res.write(`data: {"type":"complete","message":"Done!"}\n\n`);
      res.end();
      clearInterval(interval);
    }
  }, 1000);
  
  req.on('close', () => {
    console.log('🔌 DEBUG: Client disconnected');
    clearInterval(interval);
  });
});

app.listen(3668, () => {
  console.log('🚀 DEBUG SERVER on port 3668');
});