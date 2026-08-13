/**
 * drop-text-index.js
 * Run once: node drop-text-index.js
 * Drops the old text index on the snippets collection so Mongoose
 * recreates it with the correct language_override option on next server start.
 */
require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('snippets');

    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes.map(i => i.name));

    // Find and drop any text index
    const textIndex = indexes.find(i =>
        Object.values(i.key || {}).includes('text')
    );

    if (textIndex) {
        await collection.dropIndex(textIndex.name);
        console.log(`✅ Dropped index: ${textIndex.name}`);
    } else {
        console.log('ℹ️  No text index found — nothing to drop.');
    }

    await mongoose.disconnect();
    console.log('Done. Now restart your backend server.');
}

main().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
