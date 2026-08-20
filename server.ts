import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { router as apiRouter } from './server/routes';
import { scheduler } from './server/scheduler';
import { workerPool } from './server/worker-pool';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body Parser with reasonable limit
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Request logger
  app.use((req, res, next) => {
    if (!req.path.startsWith('/api/events') && !req.path.startsWith('/@') && !req.path.startsWith('/src')) {
      // console.log(`[HTTP] ${req.method} ${req.path}`);
    }
    next();
  });

  // Mount API routes
  app.use('/api', apiRouter);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Start background engines (Scheduler Ticker & Worker Pool)
  scheduler.start();
  workerPool.start();

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: 3000 },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Distributed Job Scheduler] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Fatal bootstrap error:', err);
});
