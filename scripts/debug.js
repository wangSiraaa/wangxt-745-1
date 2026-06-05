import http from 'http';

const options = {
  hostname: '127.0.0.1',
  port: 3001,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-User-Id': 'test',
  },
};

const req = http.request(options, (res) => {
  console.log(`状态码: ${res.statusCode}`);
  console.log('响应头:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('响应体:', data);
  });
});

req.on('error', (e) => {
  console.error(`请求错误: ${e.message}`);
});

req.write(JSON.stringify({ username: 'declarant', password: '123456' }));
req.end();
