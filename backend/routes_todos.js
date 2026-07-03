const express = require('express');
const db = require('../config/db');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all todos for user
router.get('/', auth, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM todos WHERE user_id = ? ORDER BY todo_date ASC, created_at ASC', [req.userId]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create todo
router.post('/', auth, async (req, res) => {
    const { text, category, todo_date, completed } = req.body;
    if (!text) return res.status(400).json({ message: 'Text wajib diisi' });
    try {
        const [result] = await db.query(
            'INSERT INTO todos (user_id, text, category, todo_date, completed) VALUES (?, ?, ?, ?, ?)',
            [req.userId, text, category || 'Lainnya', todo_date || null, completed || false]
        );
        const [newTodo] = await db.query('SELECT * FROM todos WHERE id = ?', [result.insertId]);
        res.status(201).json(newTodo[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update todo (toggle completed, edit text, dll)
router.put('/:id', auth, async (req, res) => {
    const { text, category, todo_date, completed } = req.body;
    try {
        await db.query(
            'UPDATE todos SET text = COALESCE(?, text), category = COALESCE(?, category), todo_date = COALESCE(?, todo_date), completed = COALESCE(?, completed) WHERE id = ? AND user_id = ?',
            [text, category, todo_date, completed, req.params.id, req.userId]
        );
        const [updated] = await db.query('SELECT * FROM todos WHERE id = ?', [req.params.id]);
        res.json(updated[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete todo
router.delete('/:id', auth, async (req, res) => {
    try {
        await db.query('DELETE FROM todos WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
        res.json({ message: 'Todo deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
