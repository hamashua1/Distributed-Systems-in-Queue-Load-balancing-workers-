import 'dotenv/config';
import express from 'express';
import { Queue } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());

const queue = new Queue(process.env.QUEUE_NAME, {
  connection: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  },
});

queue.on('error', (err) => {
  console.error('Redis queue connection error:', err.message);
});

// POST /job — client submits a job
app.post('/job', async (req, res) => {
  const { task, data } = req.body;

  if (!task || typeof task !== 'string' || task.trim() === '') {
    return res.status(400).json({ error: 'task is required and must be a non-empty string' });
  }

  if (task.length > 200) {
    return res.status(400).json({ error: 'task must be 200 characters or fewer' });
  }

  if (data !== undefined && (typeof data !== 'object' || Array.isArray(data) || data === null)) {
    return res.status(400).json({ error: 'data must be a plain object if provided' });
  }

  const jobId = uuidv4();

  try {
    await queue.add(task, { jobId, task, data: data ?? {} }, { jobId });
  } catch (err) {
    console.error('Failed to enqueue job:', err.message);
    return res.status(503).json({ error: 'Failed to enqueue job. Please try again later.' });
  }

  return res.status(202).json({
    jobId,
    status: 'queued',
    message: 'Job accepted. Use GET /job/:id to check the result.',
  });
});

// GET /job/:id — client checks job result
app.get('/job/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const job = await queue.getJob(id);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const state = await job.getState();
    const result = job.returnvalue ?? null;
    const failReason = job.failedReason ? 'Job processing failed.' : null;

    return res.status(200).json({
      jobId: id,
      state,
      result,
      ...(failReason && { error: failReason }),
    });
  } catch (err) {
    console.error('Failed to fetch job status:', err.message);
    return res.status(503).json({ error: 'Failed to fetch job status. Please try again later.' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
