const http = require('http');
const url = require('url');
const fs = require('fs');

const DB_PATH = './db.json';

let db;

try {
  const data = fs.readFileSync(DB_PATH, 'utf8');
  db = JSON.parse(data);
} catch (err) {
  console.error('Error reading db.json, initializing with default data:', err);
  db = {
    members: [],
    admins: [{ id: 'admin_1', name: 'Super Admin', role: 'superadmin', username: 'admin' }],
    transactions: [],
    investments: [],
    stakes: [],
    transfers: [],
    expenses: [],
    pins: []
  };
}

const saveDb = () => {
  fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), (err) => {
    if (err) {
      console.error('Error writing to db.json:', err);
    }
  });
};

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const endpoint = parsedUrl.query.endpoint;

  if (req.method === 'GET' && endpoint === 'fetch-data') {
    res.writeHead(200);
    res.end(JSON.stringify({ success: true, data: db }));
  } else if (req.method === 'POST' && endpoint === 'update-data') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const { type, action, data } = payload;
        
        if (action === 'insert' && db[type + 's']) {
          db[type + 's'].push({ id: Date.now().toString(), ...data });
          saveDb();
        }
        
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, data: db }));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
      }
    });
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

server.listen(8081, () => {
  console.log('Mock server is live at http://localhost:8081');
});
