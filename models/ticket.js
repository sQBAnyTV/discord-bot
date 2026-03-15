const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    ticketId: { type: String, required: true, unique: true },
    channelId: { type: String, required: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    category: { type: String, required: true },
    status: { type: String, default: 'open' },
    createdAt: { type: Date, default: Date.now },
    closedAt: { type: Date },
    closedBy: { type: String },
    closeReason: { type: String },
    transcriptUrl: { type: String }
});

module.exports = mongoose.model('Ticket', ticketSchema);