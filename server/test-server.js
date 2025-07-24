// Minimal test server to debug port issue
import express from 'express';

const app = express();
const PORT = 3666;

app.get('/test', (req, res) => {
  res.json({ status: 'Test server working', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
});