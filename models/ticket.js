const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    ticketId: { type: String, required: true, unique: true }, // np. "0001"
    channelId: { type: String, required: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    category: { type: String, required: true },
    status: { type: String, default: 'open' }, // open / closed
    createdAt: { type: Date, default: Date.now },
    closedAt: { type: Date },
    transcriptUrl: { type: String }
});

module.exports = mongoose.model('Ticket', ticketSchema);