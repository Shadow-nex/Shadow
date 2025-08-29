module.exports = {
  apps: [
    {
      name: 'whatsapp-bot',
      script: './index.js',
      env: {
        NODE_ENV: 'production',
      }
    }
  ]
}