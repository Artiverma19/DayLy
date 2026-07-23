import 'dotenv/config';

const response = await fetch('http://localhost:3000/api/content/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ platform: 'linkedin', topic: 'study tips', includeHashtags: true, count: 1 })
});
console.log('status', response.status, response.statusText);
console.log('headers', Object.fromEntries(response.headers.entries()));
const body = await response.text();
console.log('body', body);
