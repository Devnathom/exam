// Minimal test to verify Hostinger works, then restore NestJS
const http = require('http');

const port = process.env.PORT || 3000;

const server = http.createServer((req: any, res: any) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'ok',
    message: 'Exam OMR API is running',
    port: port,
    env: process.env.NODE_ENV || 'unknown',
    path: req.url,
    time: new Date().toISOString(),
  }));
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
