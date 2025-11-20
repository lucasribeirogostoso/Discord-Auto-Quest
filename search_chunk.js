const fs = require('fs');
const data = fs.readFileSync('discord_web.js', 'utf-8');
const idx = data.indexOf('"webpackChunkdiscord_app"');
console.log('index', idx);
