// routes_articles.js — CRUD Artikel dengan Neon.tech PostgreSQL
const express = require('express');
const sql = require('./config_db');
const auth = require('./middleware_auth');
const router = express.Router();

// GET semua artikel
router.get('/', async (req, res) => {
  try {
    const rows = await sql`
      SELECT * FROM articles ORDER BY created_at DESC
    `;
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET satu artikel
router.get('/:id', async (req, res) => {
  try {
    const rows = await sql`
      SELECT * FROM articles WHERE id = ${req.params.id}
    `;
    if (!rows.length) return res.status(404).json({ message: 'Artikel tidak ditemukan' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST buat artikel baru
router.post('/', auth, async (req, res) => {
  const { title, category, excerpt, content, image_url } = req.body;
  if (!title || !content) return res.status(400).json({ message: 'Judul dan konten wajib diisi' });
  try {
    const rows = await sql`
      INSERT INTO articles (user_id, title, category, excerpt, content, image_url)
      VALUES (${req.userId}, ${title}, ${category || 'Lainnya'}, ${excerpt || ''}, ${content}, ${image_url || ''})
      RETURNING *
    `;
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update artikel
router.put('/:id', auth, async (req, res) => {
  const { title, category, excerpt, content, image_url } = req.body;
  try {
    const rows = await sql`
      UPDATE articles
      SET title = COALESCE(${title}, title),
          category = COALESCE(${category}, category),
          excerpt = COALESCE(${excerpt}, excerpt),
          content = COALESCE(${content}, content),
          image_url = COALESCE(${image_url}, image_url)
      WHERE id = ${req.params.id} AND user_id = ${req.userId}
      RETURNING *
    `;
    if (!rows.length) return res.status(404).json({ message: 'Artikel tidak ditemukan atau bukan milik kamu' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE hapus artikel
router.delete('/:id', auth, async (req, res) => {
  try {
    await sql`
      DELETE FROM articles WHERE id = ${req.params.id} AND user_id = ${req.userId}
    `;
    res.json({ message: 'Artikel berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
