// js/config.js
const API_URL = (() => {
  // Local development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3000/api';
  }
  
  // Production - GitHub Pages with Cloudflare Workers
  return ' https://cakesbyvarsha-api.narenmak7.workers.dev/api';
})();
