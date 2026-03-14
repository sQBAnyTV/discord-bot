const mongoose = require('mongoose');

const muteSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    moderatorId: { type: String, required: true },
    reason: { type: String, required: true },
    endTime: { type: Date, required: true }, // Kiedy mute wygasa
    guildId: { type: String, required: true },
    active: { type: Boolean, default: true }
});

module.exports = mongoose.model('Mute', muteSchema);