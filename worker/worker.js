import 'dotenv/config';
import { Worker } from 'bullmq';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

const worker = new Worker(
  process.env.QUEUE_NAME,
  async (job) => {
    const { task, data } = job.data;

    if (task === 'send-email') {
      const { to, subject, body } = data;

      if (!to || typeof to !== 'string') {
        throw new Error('Invalid job data: "to" is required');
      }

      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to,
        subject: subject ?? '(No Subject)',
        text: body ?? '',
      });

      console.log(`Email sent to ${to}`);
      return { success: true, to };
    }

    throw new Error(`Unknown task type: "${task}"`);
  },
  {
    connection: {
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
    },
  }
);

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed: ${err.message}`);
});

worker.on('error', (err) => {
  console.error('Worker error:', err.message);
});

console.log('Worker is running and waiting for jobs...');
