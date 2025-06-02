const crypto = require("crypto");

function generateSignature(data, key) {
  const sortedData = Object.keys(data).sort().reduce((acc, key) => {
    acc[key] = data[key];
    return acc;
  }, {});

  const rawSignature = Object.entries(sortedData)
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  return crypto.createHmac("sha256", key).update(rawSignature).digest("hex");
}

module.exports = { generateSignature };
