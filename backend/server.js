const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function authenticateRequest(req, res, next) {
  try {
    const { role, pin } = req.query;
    if (!role || !pin) {
      return res.status(401).json({ success: false, error: "Missing role or PIN" });
    }

    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query('SELECT * FROM pins WHERE role = ? AND pin = ?', [role.toLowerCase(), pin]);
      if (rows.length > 0) {
        next();
      } else {
        res.status(401).json({ success: false, error: `Invalid PIN for role: ${role}` });
      }
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("[AUTH] Authentication error caught:", error);
    res.status(500).json({ success: false, error: "Authentication failed" });
  }
}

app.get('/api/fetch-data', authenticateRequest, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    try {
      const [members] = await connection.query('SELECT * FROM members');
      const [admins] = await connection.query('SELECT * FROM admins');
      const [transactions] = await connection.query('SELECT * FROM transactions');
      const [investments] = await connection.query('SELECT * FROM investments');
      const [stakes] = await connection.query('SELECT * FROM stakes');
      const [transfers] = await connection.query('SELECT * FROM transfers');
      const [expenses] = await connection.query('SELECT * FROM expenses');

      const responseData = {
        members,
        admins,
        transactions,
        investments,
        stakes,
        transfers,
        expenses,
        pendingSignups: [],
      };

      res.json({
        success: true,
        data: responseData,
        timestamp: new Date().toISOString(),
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('[FETCH-DATA] Error fetching data from MySQL:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch data from database',
      details: String(error),
    });
  }
});

app.post('/api/update-data', authenticateRequest, async (req, res) => {
  try {
    const { tableName, ...rowData } = req.body;
    const connection = await pool.getConnection();
    try {
      if (rowData.id) {
        const [rows] = await connection.query(`SELECT * FROM ${tableName} WHERE id = ?`, [rowData.id]);
        if (rows.length > 0) {
          await connection.query(`UPDATE ${tableName} SET ? WHERE id = ?`, [rowData, rowData.id]);
        } else {
          await connection.query(`INSERT INTO ${tableName} SET ?`, [rowData]);
        }
      } else {
        await connection.query(`INSERT INTO ${tableName} SET ?`, [rowData]);
      }
      res.json({ success: true, timestamp: new Date().toISOString() });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating database:', error);
    res.status(500).json({ error: 'Failed to update database' });
  }
});

app.delete('/api/update-data', authenticateRequest, async (req, res) => {
  try {
    const { tableName, id, name } = req.body;
    const connection = await pool.getConnection();
    try {
      if (id) {
        await connection.query(`DELETE FROM ${tableName} WHERE id = ?`, [id]);
      } else if (name) {
        await connection.query(`DELETE FROM ${tableName} WHERE name = ?`, [name]);
      }
      res.json({ success: true, timestamp: new Date().toISOString() });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error deleting from database:', error);
    res.status(500).json({ error: 'Failed to delete from database' });
  }
});

const PORT = process.env.PORT || 8080;
console.log(`DEBUG: PORT is ${process.env.PORT}`);
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
