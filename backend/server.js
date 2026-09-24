import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import decisionRoutes from './routes/decision.routes.js';
import tarotRoutes from './routes/tarot.routes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/auth', authRoutes);
app.use('/api/decision', decisionRoutes);
app.use('/api/tarot', tarotRoutes);

app.get('/', (req, res) => {
  res.send('GodOfDecision Backend API is running!');
});

// Handle malformed JSON bodies instead of crashing with an unhandled error
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON in request body.',
    });
  }
  return next(err);
});

app.listen(port, () => {
  console.log(`Backend API listening on port ${port}`);
});
