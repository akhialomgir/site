import { createServer } from 'http';
import { readFileSync } from 'fs';
const html = readFileSync('index.html');
createServer((_, res) => res.end(html)).listen(3000);