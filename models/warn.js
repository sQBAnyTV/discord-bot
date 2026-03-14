const mongoose = require('mongoose');

const warnSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    moderatorId: { type: String, required: true },
    reason: { type: String, required: true },
    date: { type: Date, default: Date.now },
    guildId: { type: String, required: true }
});

module.exports = mongoose.model('Warn', warnSchema);