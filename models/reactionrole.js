const mongoose = require('mongoose');

const reactionRoleSchema = new mongoose.Schema({
    messageId: { type: String, required: true },
    channelId: { type: String, required: true },
    guildId: { type: String, required: true },
    emoji: { type: String, required: true },
    roleId: { type: String, required: true }
});

module.exports = mongoose.model('ReactionRole', reactionRoleSchema);