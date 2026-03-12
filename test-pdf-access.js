const https = require('https');

const url = 'https://slvunledlovxbgemqmyq.supabase.co/storage/v1/object/public/user-files/163ca0ba-f76d-4e1b-bf17-1c1237bb5f85/1773184057662-CURRICULO%20THIERRY%20MARKETING.pdf';

https.get(url, (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Content-Type:', res.headers['content-type']);
  console.log('Content-Length:', res.headers['content-length']);
}).on('error', (e) => {
  console.error(e);
});
