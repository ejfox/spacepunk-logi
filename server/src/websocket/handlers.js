import { v4 as uuidv4 } from 'uuid';

const clients = new Map();

export function setupWebSocketHandlers(wss, tickEngine) {
  // Listen for tick events
  tickEngine.on('tick:complete', (tickData) => {
    broadcast(wss, {
      type: 'tick:update',
      data: tickData
    });
  });

  // Listen for market update events
  tickEngine.on('market:updated', (marketData) => {
    broadcast(wss, {
      type: 'market:update',
      data: marketData
    });
  });

  // Listen for market events
  tickEngine.on('market:event', (eventData) => {
    broadcast(wss, {
      type: 'market:event',
      data: eventData
    });
  });

  // Listen for significant price changes
  tickEngine.on('market:priceChange', (priceData) => {
    broadcast(wss, {
      type: 'market:priceChange',
      data: priceData
    });
  });

  wss.on('connection', (ws) => {
    const clientId = uuidv4();
    const client = {
      id: clientId,
      ws,
      authenticated: false,
      playerId: null
    };
    
    clients.set(clientId, client);
    console.log(`Client ${clientId} connected. Total clients: ${clients.size}`);

    // Send initial connection confirmation
    ws.send(JSON.stringify({
      type: 'connection:established',
      data: {
        clientId,
        serverTime: new Date().toISOString(),
        currentTick: tickEngine.currentTick,
        tickInterval: tickEngine.tickInterval
      }
    }));

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        await handleMessage(client, data);
      } catch (error) {
        console.error('WebSocket: Failed to parse message from client:', {
          clientId,
          messageLength: message?.length,
          messagePreview: message?.toString().substring(0, 100),
          error: error.message
        });
        ws.send(JSON.stringify({
          type: 'error',
          data: { message: 'Invalid message format' }
        }));
      }
    });

    ws.on('close', () => {
      clients.delete(clientId);
      console.log(`Client ${clientId} disconnected. Total clients: ${clients.size}`);
    });

    ws.on('error', (error) => {
      console.error(`WebSocket error for client ${clientId}:`, error);
    });
  });
}

async function handleMessage(client, message) {
  const { type, data } = message;

  switch (type) {
    case 'auth:login':
      // TODO: Implement authentication
      client.authenticated = true;
      client.playerId = data.playerId || 'test-player';
      sendToClient(client, {
        type: 'auth:success',
        data: { playerId: client.playerId }
      });
      break;

    case 'ping':
      sendToClient(client, {
        type: 'pong',
        data: { timestamp: Date.now() }
      });
      break;

    case 'ship:status':
      // TODO: Fetch ship status from database
      sendToClient(client, {
        type: 'ship:status',
        data: { message: 'Ship status not yet implemented' }
      });
      break;

    default:
      sendToClient(client, {
        type: 'error',
        data: { message: `Unknown message type: ${type}` }
      });
  }
}

function sendToClient(client, message) {
  if (client.ws.readyState === 1) { // WebSocket.OPEN
    client.ws.send(JSON.stringify(message));
  }
}

function broadcast(wss, message) {
  const data = JSON.stringify(message);
  wss.clients.forEach((ws) => {
    if (ws.readyState === 1) { // WebSocket.OPEN
      ws.send(data);
    }
  });
}