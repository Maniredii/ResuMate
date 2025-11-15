import db from './config/database.js';

console.log('=== Testing Database ===\n');

// Check all users
console.log('Users in database:');
const users = db.prepare('SELECT id, name, email, resume_path FROM users').all();
console.table(users);

// Check if resume files exist
console.log('\nChecking resume files:');
import fs from 'fs';
import path from 'path';

users.forEach(user => {
  if (user.resume_path) {
    const exists = fs.existsSync(user.resume_path);
    console.log(`User ${user.id} (${user.name}): ${user.resume_path} - ${exists ? '✓ EXISTS' : '✗ NOT FOUND'}`);
  } else {
    console.log(`User ${user.id} (${user.name}): No resume uploaded`);
  }
});

console.log('\n=== Test Complete ===');
