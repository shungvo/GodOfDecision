import http from 'http';
const server = http.createServer((req, res) => {
  console.log('REQUEST:', req.method, req.url);

  res.writeHead(200, {
    'Content-Type': 'text/plain',
  });

  res.end('Hello from Node');
});

server.listen(4567, '0.0.0.0', () => {
  console.log('Listening on 0.0.0.0:4567');
});
