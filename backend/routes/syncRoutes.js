import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', '..', 'data', 'sync');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const router = express.Router();

// Get full sync state for a specific namespace (e.g. 'global' or 'user_123')
router.get('/state/:namespace', (req, res) => {
  try {
    const { namespace } = req.params;
    const filePath = path.join(DATA_DIR, `${namespace}.json`);
    
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return res.json({ success: true, data: JSON.parse(data) });
    }
    
    return res.json({ success: true, data: {} });
  } catch (error) {
    console.error('[SyncRoute] Get error:', error);
    res.status(500).json({ error: 'Failed to read state' });
  }
});

// Push full sync state
router.post('/state/:namespace', (req, res) => {
  try {
    const { namespace } = req.params;
    const { state } = req.body;
    
    if (!state || typeof state !== 'object') {
      return res.status(400).json({ error: 'Invalid state object' });
    }
    
    const filePath = path.join(DATA_DIR, `${namespace}.json`);
    fs.writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf-8');
    
    res.json({ success: true });
  } catch (error) {
    console.error('[SyncRoute] Post error:', error);
    res.status(500).json({ error: 'Failed to save state' });
  }
});

// Server-Sent Events (SSE) Endpoint for Real-Time Updates
const clients = new Set();

router.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  res.write(`data: {"type": "connected"}\n\n`);
  
  const client = res;
  clients.add(client);
  
  req.on('close', () => {
    clients.delete(client);
  });
});

// Endpoint to broadcast an event to all SSE clients
router.post('/broadcast', (req, res) => {
  const { event } = req.body;
  if (!event) return res.status(400).json({ error: 'Event object required' });
  
  const dataString = `data: ${JSON.stringify(event)}\n\n`;
  
  for (const client of clients) {
    client.write(dataString);
  }
  
  res.json({ success: true, broadcastedTo: clients.size });
});

export default router;
