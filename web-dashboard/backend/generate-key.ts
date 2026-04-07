import { generateKeyPairSync } from 'crypto';
import * as fs from 'fs';

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem',
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem',
  },
});

// Tạo folder keys nếu chưa có
if (!fs.existsSync('keys')) {
  fs.mkdirSync('keys');
}

// Lưu file
fs.writeFileSync('keys/private.pem', privateKey);
fs.writeFileSync('keys/public.pem', publicKey);

console.log('✅ Generated keys in /keys folder');

//npx ts-node generate-key.ts