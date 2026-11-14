// ============================================================================
// FINANCIAL LOAN MANAGEMENT SYSTEM - BACKEND SERVER
// ============================================================================
// Technology Stack: Node.js, Express.js, PostgreSQL (pg pool), Neon Cloud
// Architecture: RESTful Micro-Modular MVC (Routes -> Controllers -> Services -> DB)
// ============================================================================

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const errorHandler = require('./middleware/errorHandler');
const applicationRoutes = require('./routes/applicationRoutes');
const loanRoutes = require('./routes/loanRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const { query } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware Stack
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static assets (React production build from dist if available, else frontend root)
const distPath = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
} else {
  app.use(express.static(path.join(__dirname, '..', 'frontend')));
}

// ----------------------------------------------------------------------------
// API Healthcheck & Connectivity Probe
// ----------------------------------------------------------------------------
app.get('/api/health', async (req, res) => {
  try {
    const dbTest = await query('SELECT NOW() as db_time, current_database() as database;');
    res.json({
      status: 'healthy',
      server_time: new Date(),
      database_connected: true,
      database_time: dbTest.rows[0].db_time,
      database_name: dbTest.rows[0].database,
      version: '1.0.0'
    });
  } catch (error) {
    res.status(503).json({
      status: 'degraded',
      server_time: new Date(),
      database_connected: false,
      error: error.message
    });
  }
});

// ----------------------------------------------------------------------------
// API Routing Endpoints
// ----------------------------------------------------------------------------
app.use('/api/applications', applicationRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Catch-all route to serve React SPA client-side routes (e.g. /loan-application, /dashboard)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const distIndex = path.join(__dirname, '..', 'frontend', 'dist', 'index.html');
  if (fs.existsSync(distIndex)) {
    return res.sendFile(distIndex);
  }
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// Centralized Global Error Handler
app.use(errorHandler);

// Start Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log('============================================================');
    console.log(`🏦 FINANCIAL LOAN MANAGEMENT SERVER IS RUNNING`);
    console.log(`📡 URL         : http://localhost:${PORT}`);
    console.log(`📄 Loan Form   : http://localhost:${PORT}/loan-application.html`);
    console.log(`📊 Dashboard   : http://localhost:${PORT}/dashboard.html`);
    console.log(`🩺 Health API  : http://localhost:${PORT}/api/health`);
    console.log('============================================================');
  });
}

module.exports = app;

