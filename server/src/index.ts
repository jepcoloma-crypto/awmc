import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { requestLogger } from './middleware/logger';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import patientRoutes from './routes/patients';
import appointmentRoutes from './routes/appointments';
import doctorRoutes from './routes/doctors';
import billingRoutes from './routes/billing';
import serviceRoutes from './routes/services';
import procedureTypeRoutes from './routes/procedureTypes';
import userRoutes from './routes/users';
import reportRoutes from './routes/reports';
import settingRoutes from './routes/settings';
import reminderRoutes from './routes/reminders';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'], credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(requestLogger);

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/procedure-types', procedureTypeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/reminders', reminderRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Alyssa Wellness & Medical Clinic Server running on http://localhost:${PORT}`);
});
