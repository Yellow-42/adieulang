const fs = require('fs');
const path = require('path');

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']);

function isImage(filePath) {
  return IMAGE_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

exports.handler = async () => {
  const uploadsDir = path.join(__dirname, '..', '..', 'assets', 'uploads');

  try {
    const files = fs.readdirSync(uploadsDir);
    const items = files
      .filter(file => isImage(file))
      .map(file => ({
        path: `assets/uploads/${file}`,
        url: `/assets/uploads/${file}`,
      }));

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
