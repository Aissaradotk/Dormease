import mysql from 'mysql2/promise';

async function test() {
  try {
    const conn = await mysql.createConnection({
      host: '119.59.102.161',
      port: 3007,
      user: 'std6730202041',
      password: 's8*RgL1Z',
      database: 'ip_std6730202041'
    });
    console.log('Connected to MySQL via port 3007!');
    const [rows] = await conn.query("SHOW TABLES LIKE 'dorm_%'");
    console.log('Tables:', rows);
    await conn.end();
  } catch(e) {
    console.error('MySQL connect error:', e);
  }
}

test();
