import mysql from "mysql2/promise";

export const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: {
        // Chấp nhận self-signed (DEV only)
        rejectUnauthorized: false
    }
});


// Hàm kiểm tra kết nối
async function testConnection() {
    try {
        const connection = await db.getConnection();
        await connection.ping();
        console.log("✅ [Database] Connected successfully to Railway!");
        connection.release();
    } catch (err) {
        console.error("❌ [Database] Connection failed:", err);
    }
}

// Chỉ test trong môi trường dev để tránh spam log khi deploy
if (process.env.NODE_ENV !== "production") {
    testConnection();
}
