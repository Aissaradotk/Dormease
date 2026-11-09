require('dotenv').config();

const express = require('express');
const cors = require('cors');
const db = require('./DB');

const app = express();

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());
app.use(express.json());

// =====================================================
// TEST API + DATABASE
// =====================================================

app.get('/api', async (req, res) => {
  try {
    await db.query('SELECT 1');

    res.json({
      success: true,
      message: 'CPU SHOP API is running',
      database: true,
    });

  } catch (error) {
    console.error('DATABASE TEST ERROR:', error);

    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message,
    });
  }
});

// =====================================================
// LOGIN
// =====================================================

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอก Email และ Password',
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const [rows] = await db.query(
      `
      SELECT
        id,
        name,
        email,
        role
      FROM Users
      WHERE LOWER(email) = ?
        AND password = ?
      LIMIT 1
      `,
      [cleanEmail, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email หรือ Password ไม่ถูกต้อง',
      });
    }

    res.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      user: rows[0],
    });

  } catch (error) {
    console.error('LOGIN ERROR:', error);

    res.status(500).json({
      success: false,
      message: 'Login database error',
      error: error.message,
    });
  }
});

// =====================================================
// REGISTER
// =====================================================

app.post('/api/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกข้อมูลให้ครบ',
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (password.length < 4) {
      return res.status(400).json({
        success: false,
        message: 'Password ต้องมีอย่างน้อย 4 ตัว',
      });
    }

    // ตรวจ Email ซ้ำ
    const [existing] = await db.query(
      `
      SELECT id
      FROM Users
      WHERE LOWER(email) = ?
      LIMIT 1
      `,
      [cleanEmail]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email นี้มีผู้ใช้งานแล้ว',
      });
    }

    // สร้าง User ใหม่
    const [result] = await db.query(
      `
      INSERT INTO Users
      (
        name,
        email,
        password,
        role
      )
      VALUES (?, ?, ?, ?)
      `,
      [
        cleanName,
        cleanEmail,
        password,
        'User',
      ]
    );

    res.status(201).json({
      success: true,
      message: 'สมัครสมาชิกสำเร็จ',
      user: {
        id: result.insertId,
        name: cleanName,
        email: cleanEmail,
        role: 'User',
      },
    });

  } catch (error) {
    console.error('REGISTER ERROR:', error);

    res.status(500).json({
      success: false,
      message: 'Register database error',
      error: error.message,
    });
  }
});

// =====================================================
// GET ALL INVENTORY
// =====================================================

async function getProducts(req, res) {
  try {
    console.log('========================================');
    console.log('GET INVENTORY');

    const [rows] = await db.query(
      `
      SELECT
        id,
        name,
        stock,
        category,
        location,
        status,
        imageUrl
      FROM Inventory
      ORDER BY id DESC
      `
    );

    console.log('TOTAL PRODUCTS:', rows.length);

    res.json(rows);

  } catch (error) {
    console.error('GET INVENTORY ERROR:', error);

    res.status(500).json({
      success: false,
      message: 'Database error',
      error: error.message,
    });
  }
}

app.get('/api/products', getProducts);

app.get('/api/Inventory', getProducts);

// 3. POST /api/products : เพิ่มสินค้า
app.post('/api/products', async (req, res) => {
  try {
    const { name, stock, category, location, status, image, imageUrl } = req.body;
    const finalImage = image || imageUrl || null;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const sql = `
      INSERT INTO Inventory (name, stock, category, location, status, imageURL)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(sql, [
      name,
      Number(stock) || 0,
      category || null,
      location || null,
      status || 'Active',
      finalImage,
    ]);

    res.status(201).json({
      success: true,
      productId: result.insertId,
    });
  } catch (error) {
    console.error('Create Product Error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// 4. PUT /api/products/:id : แก้ไขสินค้า
app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, stock, category, location, status, image, imageUrl } = req.body;
    const finalImage = image || imageUrl || null;

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    const sql = `
      UPDATE Inventory
      SET name = ?, stock = ?, category = ?, location = ?, status = ?, imageURL = ?
      WHERE id = ?
    `;

    const [result] = await db.query(sql, [
      name,
      Number(stock) || 0,
      category || null,
      location || null,
      status || 'Active',
      finalImage,
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Update Product Error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// =====================================================
// GET SINGLE PRODUCT
// =====================================================

app.get('/api/Inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log('GET PRODUCT ID:', id);

    const [rows] = await db.query(
      `
      SELECT
        id,
        name,
        stock,
        category,
        location,
        status,
        imageUrl
      FROM Inventory
      WHERE id = ?
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.json(rows[0]);

  } catch (error) {
    console.error('GET SINGLE ERROR:', error);

    res.status(500).json({
      success: false,
      message: 'Database error',
      error: error.message,
    });
  }
});

// =====================================================
// ADD PRODUCT
// =====================================================

app.post('/api/Inventory', async (req, res) => {
  try {
    const {
      name,
      stock,
      category,
      location,
      status,
      imageUrl,
    } = req.body;

    if (
      !name ||
      !category ||
      !location ||
      !status
    ) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกข้อมูลสินค้าให้ครบ',
      });
    }

    const stockNumber = Number(stock);

    if (
      Number.isNaN(stockNumber) ||
      stockNumber < 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Stock ต้องเป็นตัวเลข 0 ขึ้นไป',
      });
    }

    const [result] = await db.query(
      `
      INSERT INTO Inventory
      (
        name,
        stock,
        category,
        location,
        status,
        imageUrl
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        name.trim(),
        stockNumber,
        category.trim(),
        location.trim(),
        status.trim(),
        imageUrl
          ? imageUrl.trim()
          : '',
      ]
    );

    console.log(
      'ADD PRODUCT SUCCESS ID:',
      result.insertId
    );

    res.status(201).json({
      success: true,
      message: 'เพิ่มสินค้าสำเร็จ',
      id: result.insertId,
    });

  } catch (error) {
    console.error('ADD PRODUCT ERROR:', error);

    res.status(500).json({
      success: false,
      message: 'Database error',
      error: error.message,
    });
  }
});

// =====================================================
// UPDATE PRODUCT
// =====================================================

app.put('/api/Inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log('UPDATE PRODUCT ID:', id);

    const {
      name,
      stock,
      category,
      location,
      status,
      imageUrl,
    } = req.body;

    if (
      !name ||
      !category ||
      !location ||
      !status
    ) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกข้อมูลสินค้าให้ครบ',
      });
    }

    const stockNumber = Number(stock);

    if (
      Number.isNaN(stockNumber) ||
      stockNumber < 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Stock ต้องเป็นตัวเลข 0 ขึ้นไป',
      });
    }

    const [result] = await db.query(
      `
      UPDATE Inventory
      SET
        name = ?,
        stock = ?,
        category = ?,
        location = ?,
        status = ?,
        imageUrl = ?
      WHERE id = ?
      `,
      [
        name.trim(),
        stockNumber,
        category.trim(),
        location.trim(),
        status.trim(),
        imageUrl
          ? imageUrl.trim()
          : '',
        id,
      ]
    );

    console.log(
      'UPDATE AFFECTED ROWS:',
      result.affectedRows
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.json({
      success: true,
      message: 'แก้ไขสินค้าสำเร็จ',
    });

  } catch (error) {
    console.error('UPDATE ERROR:', error);

    res.status(500).json({
      success: false,
      message: 'Database error',
      error: error.message,
    });
  }
});

// =====================================================
// DELETE PRODUCT
// ระบบลบสินค้า
// =====================================================

app.delete('/api/Inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log('========================================');
    console.log('DELETE PRODUCT');
    console.log('PRODUCT ID:', id);

    // =================================================
    // ตรวจสอบ ID
    // =================================================

    if (
      id === undefined ||
      id === null ||
      String(id).trim() === ''
    ) {
      console.log('DELETE ERROR: ID EMPTY');

      return res.status(400).json({
        success: false,
        message: 'ไม่พบ ID ของสินค้า',
      });
    }

    // =================================================
    // ตรวจสอบก่อนว่ามีสินค้านี้จริงหรือไม่
    // =================================================

    const [checkRows] = await db.query(
      `
      SELECT
        id,
        name
      FROM Inventory
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    console.log(
      'PRODUCT FOUND:',
      checkRows.length
    );

    if (checkRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบสินค้าที่ต้องการลบ',
        id: id,
      });
    }

    console.log(
      'PRODUCT NAME:',
      checkRows[0].name
    );

    // =================================================
    // DELETE FROM DATABASE
    // =================================================

    const [result] = await db.query(
      `
      DELETE FROM Inventory
      WHERE id = ?
      `,
      [id]
    );

    console.log(
      'DELETE AFFECTED ROWS:',
      result.affectedRows
    );

    // =================================================
    // ตรวจสอบผลลัพธ์
    // =================================================

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'ลบไม่สำเร็จ ไม่พบสินค้า',
      });
    }

    // =================================================
    // DELETE SUCCESS
    // =================================================

    console.log(
      'DELETE SUCCESS:',
      checkRows[0].name
    );

    console.log('========================================');

    res.json({
      success: true,
      message: 'ลบสินค้าสำเร็จ',
      deletedId: id,
      deletedProduct: checkRows[0].name,
    });

  } catch (error) {
    console.error('========================================');
    console.error('DELETE ERROR:', error);
    console.error('========================================');

    res.status(500).json({
      success: false,
      message: 'Database error',
      error: error.message,
    });
  }
});

// =====================================================
// 404 ROUTE
// =====================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    method: req.method,
    path: req.originalUrl,
  });
});

// =====================================================
// START SERVER
// =====================================================

const PORT = process.env.PORT || 3007;

app.listen(
  PORT,
  '0.0.0.0',
  () => {
    console.log('');
    console.log(
      '========================================'
    );
    console.log(
      '          CPU SHOP SERVER'
    );
    console.log(
      '========================================'
    );
    console.log(
      `Server: http://119.59.102.161:${PORT}`
    );
    console.log(
      `API: http://119.59.102.161:${PORT}/api`
    );
    console.log(
      `Login: http://119.59.102.161:${PORT}/api/login`
    );
    console.log(
      `Register: http://119.59.102.161:${PORT}/api/register`
    );
    console.log(
      `Inventory: http://119.59.102.161:${PORT}/api/Inventory`
    );
    console.log(
      `Delete: DELETE http://119.59.102.161:${PORT}/api/Inventory/:id`
    );
    console.log(
      '========================================'
    );
    console.log('');
  }
);