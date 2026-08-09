const mongoose = require('mongoose');

const dns = require('node:dns/promises');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`[MongoDB] Connected: ${conn.connection.host}`);
    } catch (err) {
        console.error('[MongoDB] Connection failed:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;