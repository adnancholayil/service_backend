const http = require('http');

const query = `
  query GetBanners {
    adminBanners {
      id
      title
      imageUrl
      link
      isActive
      createdAt
      updatedAt
    }
  }
`;

const data = JSON.stringify({ query });

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/graphql',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => console.log(body));
});

req.on('error', (e) => console.error(e));
req.write(data);
req.end();
