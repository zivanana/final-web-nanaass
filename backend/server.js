const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes_auth');
const articleRoutes = require('./routes_articles');

const app = express();
app.use(cors());
app.use(express.json());

// Sajikan file statis dari folder public
app.use(express.static(path.join(__dirname, 'public')));

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);

// Untuk development lokal (jalan di port 5000)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app; // Ekspor untuk Vercel
