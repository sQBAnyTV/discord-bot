// Stałe levelowania
const XP_PER_MESSAGE = 10;

// Stałe voice XP
const VOICE_XP_PER_MINUTE = 10;
const VOICE_CHECK_INTERVAL = 60000;
const REQUIRED_USERS_IN_CHANNEL = 2;

// Cooldown dla wątków
const COOLDOWN_WATEK = 60000;

// Kanał XP (stały, nie zmienia się)
const KANAL_XP = '1473083672881139773';

module.exports = {
    XP_PER_MESSAGE,
    VOICE_XP_PER_MINUTE,
    VOICE_CHECK_INTERVAL,
    REQUIRED_USERS_IN_CHANNEL,
    COOLDOWN_WATEK,
    KANAL_XP
};