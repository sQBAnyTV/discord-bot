const Gracz = require('../models/gracz');
const { wymaganeXp } = require('./xpUtils');

// Funkcja do sprawdzania czy gracz awansował
async function sprawdzAwans(gracz, client, KANAL_LEVEL) {
    while (gracz.xp >= wymaganeXp(gracz.level + 1)) {
        gracz.level++;
        // Wyślij wiadomość o awansie na KANAŁ LEVEL
        const channel = client.channels.cache.get(KANAL_LEVEL);
        if (channel) {
            await channel.send(`🎉 Gratulacje <@${gracz.userId}>! Awansowałeś na **poziom ${gracz.level}**! 🎉`);
        }
    }
    await gracz.save();
}

module.exports = { sprawdzAwans };