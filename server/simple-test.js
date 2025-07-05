import express from 'express';

const app = express();
const PORT = 3668;

app.get('/', (req, res) => {
  res.send('Hello from simple server!');
});

app.get('/test', (req, res) => {
  res.json({ message: 'API working', timestamp: new Date().toISOString() });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Simple server running at http://127.0.0.1:${PORT}`);
});