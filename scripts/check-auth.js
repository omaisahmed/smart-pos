const http = require('http');

const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || 5000;

function post(path, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const opts = {
      hostname: HOST,
      port: PORT,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        ...headers,
      },
    };

    const req = http.request(opts, (res) => {
      let chunks = '';
      res.setEncoding('utf8');
      res.on('data', (c) => (chunks += c));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: chunks }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function get(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: HOST,
      port: PORT,
      path,
      method: 'GET',
      headers,
    };
    const req = http.request(opts, (res) => {
      let chunks = '';
      res.setEncoding('utf8');
      res.on('data', (c) => (chunks += c));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: chunks }));
    });
    req.on('error', reject);
    req.end();
  });
}

(async () => {
  try {
    console.log('Checking backend auth endpoints...');
    const email = process.env.ADMIN_EMAIL || 'admin@admin.com';
    const password = process.env.ADMIN_PASSWORD || 'admin';

    const login = await post('/api/login', { email, password });
    console.log('/api/login ->', login.status);
    if (login.status !== 200) {
      console.log('Response body:', login.body);
      process.exit(1);
    }

    const setCookie = login.headers['set-cookie'];
    const cookie = Array.isArray(setCookie) ? setCookie.map((c) => c.split(';')[0]).join('; ') : (setCookie || '').split(';')[0];
    if (!cookie) {
      console.log('No cookie received from login, session may not be set.');
      process.exit(1);
    }

    const user = await get('/api/auth/user', { Cookie: cookie });
    console.log('/api/auth/user ->', user.status);
    console.log('Body:', user.body);
    process.exit(user.status === 200 ? 0 : 1);
  } catch (err) {
    console.error('Error while checking auth:', err);
    process.exit(2);
  }
})();
