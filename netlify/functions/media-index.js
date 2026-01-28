const https = require('https');

function fetchJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    https
      .get(url, options, res => {
        let data = '';
        res.on('data', chunk => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(error);
          }
        });
      })
      .on('error', reject);
  });
}

exports.handler = async () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [] }),
    };
  }

  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/resources/image?prefix=adieulang/&max_results=500&direction=desc`;

  try {
  const response = await fetchJson(url, {
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });

    const items = Array.isArray(response.resources)
      ? response.resources.map(item => ({
          path: item.public_id,
          url: item.secure_url || item.url,
        }))
      : [];

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    };
  } catch (error) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [] }),
    };
  }
};
