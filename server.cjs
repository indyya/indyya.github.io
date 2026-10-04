const express = require('express');
const path = require('node:path');

const app = express();
const port = Number(process.env.PORT || 3000);

for (const [route, file] of [
  ['/', 'index.html'],
  ['/index.html', 'index.html'],
  ['/style.css', 'style.css'],
  ['/tv.js', 'tv.js'],
]) {
  app.get(route, (req, res) => res.sendFile(path.join(__dirname, file)));
}

app.listen(port, 'localhost', () => {
  console.log('Site running at http://localhost:' + port);
}).on('error', (error) => {
  console.error('Could not start the local server:', error.message);
  process.exitCode = 1;
});
