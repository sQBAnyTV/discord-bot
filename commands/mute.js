const { EmbedBuilder } = require('discord.js');
const { parseTime } = require('../utils/xpUtils');

module.exports = {
    name: 'mute',
    description: 'Wycisz użytkownika na określony czas (tylko moderator)',
    async execute(interaction, client, ROLA_HELPER, ROLA_MODERATOR) { // USUŃ KANAL_LOGOW z parametrów
        // UŻYJ process.env BEZPOŚREDNIO!
        const KANAL_LOGOW = process.env.KANAL_LOGOW;
        
        console.log(`========== MUTE DEBUG ==========`);
        console.log(`ROLA_HELPER: ${ROLA_HELPER}`);
        console.log(`ROLA_MODERATOR: ${ROLA_MODERATOR}`);
        console.log(`KANAL_LOGOW z env: ${KANAL_LOGOW}`);
        
        const member = interaction.member;
        const hasModRole = member.roles.cache.has(ROLA_MODERATOR);
        const isAdmin = member.permissions.has('Administrator');
        
        if (!hasModRole && !isAdmin) {
            return interaction.reply({
                content: '❌ Tylko moderatorzy mogą używać tej komendy!',
                flags: 64
            });
        }
        
        const targetUser = interaction.options.getUser('user');
        const timeStr = interaction.options.getString('time');
        const reason = interaction.options.getString('reason');
        const moderator = interaction.user;
        
        if (targetUser.id === moderator.id) {
            return interaction.reply({
                content: '❌ Nie możesz wyciszyć samego siebie!',
                flags: 64
            });
        }
        
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        if (!targetMember) {
            return interaction.reply({
                content: '❌ Nie znaleziono użytkownika na serwerze!',
                flags: 64
            });
        }
        
        const muteTimeMs = parseTime(timeStr);
        if (!muteTimeMs) {
            return interaction.reply({
                content: '❌ Nieprawidłowy format czasu. Użyj: `10m`, `1h`, `1d`, `7d` (max 28 dni)',
                flags: 64
            });
        }
        
        if (muteTimeMs > 28 * 24 * 60 * 60 * 1000) {
            return interaction.reply({
                content: '❌ Maksymalny czas przerwy to 28 dni!',
                flags: 64
            });
        }
        
        try {
            const endDate = new Date(Date.now() + muteTimeMs);
            await targetMember.timeout(muteTimeMs, reason);
            
            const dmEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('🔇 Otrzymałeś przerwę!')
                .setDescription(`Na serwerze **${interaction.guild.name}**`)
                .addFields(
                    { name: 'Moderator', value: moderator.tag, inline: true },
                    { name: 'Czas', value: timeStr, inline: true },
                    { name: 'Powód', value: reason, inline: false },
                    { name: 'Koniec', value: `<t:${Math.floor(endDate.getTime() / 1000)}:R>`, inline: false }
                )
                .setTimestamp();
            
            await targetUser.send({ embeds: [dmEmbed] }).catch(() => {
                console.log(`Nie udało się wysłać PW do ${targetUser.tag}`);
            });
            
            await interaction.reply({
                content: `✅ Użytkownik ${targetUser.tag} otrzymał przerwę na **${timeStr}**.`,
                flags: 64
            });
            
            // Log na kanał logów
            console.log(`Próba wysłania logu na kanał o ID: ${KANAL_LOGOW}`);
            const logChannel = client.channels.cache.get(KANAL_LOGOW);
            
            if (logChannel) {
                console.log(`✅ Znaleziono kanał: ${logChannel.name} (${logChannel.id})`);
                
                const logEmbed = new EmbedBuilder()
                    .setColor(0xFF8C00)
                    .setTitle('🔇 Nowa przerwa (mute)')
                    .addFields(
                        { name: 'Użytkownik', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                        { name: 'Moderator', value: `${moderator.tag} (${moderator.id})`, inline: true },
                        { name: 'Czas', value: timeStr, inline: true },
                        { name: 'Powód', value: reason, inline: false },
                        { name: 'Koniec', value: `<t:${Math.floor(endDate.getTime() / 1000)}:R>`, inline: false }
                    )
                    .setTimestamp();
                
                await logChannel.send({ embeds: [logEmbed] });
                console.log(`✅ Wysłano log mute dla ${targetUser.tag}`);
            } else {
                console.log(`❌ NIE znaleziono kanału o ID: ${KANAL_LOGOW}`);
            }
            
        } catch (error) {
            console.error('Błąd przy mute:', error);
            
            if (error.code === 50013) {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: '❌ Bot nie ma uprawnień do wyciszania! Sprawdź czy ma uprawnienie "Moderuj członków".',
                        flags: 64
                    });
                }
            } else {
                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: '❌ Wystąpił błąd podczas wyciszania.',
                        flags: 64
                    });
                }
            }
        }
    }
};