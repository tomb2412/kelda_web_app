import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

let passagePlan = {
  timestamp: new Date().toISOString(),
  title: 'Cowes to Yarmouth – Sample Passage Plan',
  departure_place_name: 'Cowes',
  desination_place_name: 'Yarmouth',
  course_to_steer: [
    {
      name: 'Cowes Yacht Haven (departure)',
      coordinates: "50°45.3'N, 001°18.3'W",
      bearing: '270',
      distance_nm: 3.7,
      eta: '10:37 BST',
    },
    {
      name: 'Mid-Solent waypoint',
      coordinates: "50°45.0'N, 001°24.0'W",
      bearing: '272',
      distance_nm: 2.9,
      eta: '11:06 BST',
    },
  ],
};

/**
 * GET /passage_plan
 * Returns the most recently submitted passage plan payload.
 */
app.get('/passage_plan', (_req, res) => {
  res.json(passagePlan);
});

/**
 * POST /passage_plan
 * Accepts a passage plan payload and stores it in-memory for future retrieval.
 */
app.post('/passage_plan', (req, res) => {
  const { course_to_steer } = req.body ?? {};
  if (!Array.isArray(course_to_steer) || course_to_steer.length === 0) {
    return res.status(400).json({ error: 'course_to_steer must be a non-empty array' });
  }

  const destination =
    req.body.destination_place_name ?? req.body.desination_place_name ?? 'Destination';

  passagePlan = {
    timestamp: req.body.timestamp ?? new Date().toISOString(),
    title: req.body.title ?? 'Passage Plan',
    departure_place_name: req.body.departure_place_name ?? 'Departure',
    desination_place_name: destination,
    destination_place_name: destination,
    course_to_steer,
  };

  return res.status(201).json(passagePlan);
});

const distPath = path.resolve(__dirname, 'dist');
if (process.env.NODE_ENV === 'production' && fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const PORT = process.env.PORT ?? 5174;
app.listen(PORT, () => {
  console.log(`API server listening on port ${PORT}`);
});
