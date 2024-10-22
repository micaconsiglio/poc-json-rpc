import express from 'express';
import { JSONRPCServer } from 'json-rpc-2.0';
import sqlite3 from 'sqlite3';

const server = new JSONRPCServer();

sqlite3.verbose();
const db = new sqlite3.Database('database.db');

db.serialize(() => {
  db.run(
    'CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, dni TEXT, name TEXT, surname TEXT, email TEXT)'
  );
});

server.addMethod('createUser', ({ dni, name, surname, email }) => {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO users (dni, name, surname, email) VALUES (?,?, ?, ?)',
      [dni, name, surname, email],
      function (err) {
        if (err) return reject(err);
        resolve ({
          id: this.lastID,
          dni,
          name,
          surname,
          email,
        });
      }
    );
  });
});

server.addMethod('getUser', ({ id }) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE id=?', [id], function (err, user) {
      if (err) return reject(err);
      resolve(user);
    });
  });
});

server.addMethod('updateUser', ({ id, dni, name, surname, email }) => {
  return new Promise((resolve, reject) => {
    db.run('UPDATE users SET dni = ?, name = ?, surname = ?, email = ? WHERE id=?', [dni, name, surname, email, id], function (err, user) {
      if (err) return reject(err);
      resolve({
        id,
        dni,
        name,
        surname,
        email,
      });
    });
  });
});

server.addMethod('deleteUser', ({ id }) => {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM users WHERE id=?', [id], function (err, user) {
      if (err) return reject(err);
      resolve(user);
    });
  });
});

const app = express();

app.use(express.json());

app.post('/json-rpc', (req, res, next) => {
  const rpcBody = req.body;
  return server.receive(rpcBody).then((jsonRPCResponse) => {
    if (jsonRPCResponse) {
      return res.json(jsonRPCResponse);
    }
    res.sendStatus(204);
  });
});

app.listen(8000, () => {
  console.log('Listen on port 8000');
});
