const http = require('http');

async function testBackend() {
  const loginData = JSON.stringify({
    query: `
      mutation {
        login(email: "admin@servicehub.com", password: "adminpassword123") {
          accessToken
        }
      }
    `
  });

  const getResponse = (data, token = null) => {
    return new Promise((resolve, reject) => {
      const headers = {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const options = {
        hostname: 'localhost',
        port: 4000,
        path: '/graphql',
        method: 'POST',
        headers
      };

      const req = http.request(options, res => {
        let body = '';
        res.on('data', d => { body += d; });
        res.on('end', () => { resolve(JSON.parse(body)); });
      });
      req.on('error', reject);
      req.write(data);
      req.end();
    });
  };

  try {
    const loginRes = await getResponse(loginData);
    const token = loginRes.data?.login?.accessToken;
    console.log('Token received:', !!token);

    if (token) {
      const createData = JSON.stringify({
        query: `
          mutation {
            createBanner(title: "Test Banner", imageUrl: "https://test.com/img.jpg") {
              id
              title
            }
          }
        `
      });
      const createRes = await getResponse(createData, token);
      console.log('Create Banner Response:', JSON.stringify(createRes, null, 2));

      const queryData = JSON.stringify({
        query: `
          query {
            adminBanners {
              id
              title
            }
          }
        `
      });
      const queryRes = await getResponse(queryData, token);
      console.log('Query Banners Response:', JSON.stringify(queryRes, null, 2));
    }
  } catch (err) {
    console.error(err);
  }
}

testBackend();
