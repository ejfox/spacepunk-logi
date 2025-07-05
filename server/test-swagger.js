import express from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3667; // Different port to avoid conflicts

// Load OpenAPI spec
console.log('Loading OpenAPI spec from:', join(__dirname, 'openapi.yaml'));
const swaggerDocument = YAML.load(join(__dirname, 'openapi.yaml'));
console.log('OpenAPI spec loaded:', swaggerDocument.info.title);

// Basic Swagger UI setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/', (req, res) => {
  res.send(`
    <h1>Test Swagger Server</h1>
    <p><a href="/api-docs">API Documentation</a></p>
  `);
});

app.listen(PORT, () => {
  console.log(`Test server running at http://localhost:${PORT}`);
  console.log(`Swagger UI at http://localhost:${PORT}/api-docs`);
});