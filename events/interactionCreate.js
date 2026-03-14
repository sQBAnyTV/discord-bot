// Wczytaj wszystkie komendy
const pingCommand = require('../commands/ping');
const levelCommand = require('../commands/level');
const topCommand = require('../commands/top');
const warnCommand = require('../commands/warn');
const muteCommand = require('../commands/mute');
const unmuteCommand = require('../commands/unmute');
const reactionroleCommand = require('../commands/reactionrole');

// Mapa komend
const commands = new Map();
commands.set(pingCommand.name, pingCommand);
commands.set(levelCommand.name, levelCommand);
commands.set(topCommand.name, topCommand);
commands.set(warnCommand.name, warnCommand);
commands.set(muteCommand.name, muteCommand);
commands.set(unmuteCommand.name, unmuteCommand);
commands.set(reactionroleCommand.name, reactionroleCommand);

// Lista komend moderacyjnych (dostępne wszędzie)
const komendyModeracyjne = ['warn', 'mute', 'unmute', 'reactionrole'];

module.exports = (client, KANAL_KOMEND, ROLA_HELPER, ROLA_MODERATOR, KANAL_LOGOW) => {
    client.on('interactionCreate', async interaction => {
        if (!interaction.isCommand()) return;

        const command = commands.get(interaction.commandName);
        if (!command) return;

        // Logi debugowania
        console.log(`Wykonuję komendę: ${interaction.commandName}`);
        console.log(`KANAL_LOGOW w interactionCreate: ${KANAL_LOGOW}`);

        // Sprawdź ograniczenia kanału
        if (!komendyModeracyjne.includes(interaction.commandName)) {
            if (interaction.channel.id !== KANAL_KOMEND) {
                return interaction.reply({
                    content: `❌ Komend można używać tylko na kanale <#${KANAL_KOMEND}>!`,
                    ephemeral: true
                });
            }
        }

        try {
            await command.execute(interaction, client, ROLA_HELPER, ROLA_MODERATOR, KANAL_LOGOW);
        } catch (error) {
            console.error(`Błąd w komendzie ${interaction.commandName}:`, error);
            
            // Sprawdź czy już odpowiedziano
            if (interaction.replied || interaction.deferred) {
                try {
                    await interaction.followUp({
                        content: '❌ Wystąpił błąd podczas wykonywania komendy.',
                        ephemeral: true
                    });
                } catch (e) {
                    console.error('Nie udało się wysłać followUp:', e);
                }
            } else {
                try {
                    await interaction.reply({
                        content: '❌ Wystąpił błąd podczas wykonywania komendy.',
                        ephemeral: true
                    });
                } catch (e) {
                    console.error('Nie udało się wysłać reply:', e);
                }
            }
        }
    });
};