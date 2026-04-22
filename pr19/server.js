require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const pool = new Pool({
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    port: process.env.PG_PORT,
});


app.post('/api/users', async (req, res) => {
    try {
        const { first_name, last_name, age } = req.body;
        const now = Date.now();
        const result = await pool.query(
            `INSERT INTO users (first_name, last_name, age, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [first_name, last_name, age, now, now]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});


app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.get('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        if (result.rows.length === 0)
            return res.status(404).json({ error: 'User not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.patch('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { first_name, last_name, age } = req.body;
        const now = Date.now();

        const result = await pool.query(
            `UPDATE users
             SET first_name = COALESCE($1, first_name),
                 last_name  = COALESCE($2, last_name),
                 age        = COALESCE($3, age),
                 updated_at = $4
             WHERE id = $5
             RETURNING *`,
            [first_name, last_name, age, now, id]
        );

        if (result.rows.length === 0)
            return res.status(404).json({ error: 'User not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});


app.delete('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0)
            return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User deleted', user: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`PostgreSQL server running on http://localhost:${PORT}`);
});