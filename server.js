require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./server/config/db');
const authRoutes = require('./server/routes/authRoutes');
const currencyRoutes = require('./server/routes/currencyRoutes');
const rateRoutes = require('./server/routes/rateRoutes');
const convertRoutes = require('./server/routes/convertRoutes');
const conversionRoutes = require('./server/routes/conversionRoutes');
const pairRoutes = require('./server/routes/pairRoutes');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Currency Flow API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/currencies', currencyRoutes);
app.use('/api/rates', rateRoutes);
app.use('/api/convert', convertRoutes);
app.use('/api/conversions', conversionRoutes);
app.use('/api/pairs', pairRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: 'Internal server error' });
});

connectDB().catch((error) => {
  console.error(`MongoDB connection failed: ${error.message}`);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
