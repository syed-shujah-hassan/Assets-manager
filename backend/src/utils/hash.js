const bcrypt = require('bcryptjs');

async function run() {
  const password = process.argv[2];

  if (!password) {
    console.error('Usage: node src/utils/hash.js <password>');
    process.exit(1);
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    console.log('Password:', password);
    console.log('Hash:    ', hash);
  } catch (err) {
    console.error('Error hashing password:', err.message);
    process.exit(1);
  }
}

run();
