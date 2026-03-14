const mongoose = require('mongoose');

const graczSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    username: String,
    level: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
    totalMessages: { type: Number, default: 0 },
    lastMessageDate: Date
});

module.exports = mongoose.model('Gracz', graczSchema);