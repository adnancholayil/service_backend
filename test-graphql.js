const http = require('http');

async function testBackend() {
  const getResponse = (data) => {
    return new Promise((resolve, reject) => {
      const headers = {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      };

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
    const queryData = JSON.stringify({
      query: `
        query GetHomeData($longitude: Float, $latitude: Float) {
          categories { id name slug icon }
          providers(longitude: $longitude, latitude: $latitude) {
            id businessName description rating reviewsCount
            user { name avatar }
            category { name }
            services { id name description price category { name } }
          }
          publicReviews(limit: 3) {
            id rating comment createdAt customer { name avatar }
          }
          publicBanners { id title imageUrl link }
        }
      `
    });
    const queryRes = await getResponse(queryData);
    console.log('Query Response:', JSON.stringify(queryRes, null, 2));
  } catch (err) {
    console.error(err);
  }
}

testBackend();
