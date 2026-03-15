const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'unban',
    description: 'Odbanuj użytkownika (tylko moderator)',
    async execute(interaction, client, ROLA_HELPER, ROLA_MODERATOR) {
        // Pobierz ID kanału logów z env
        const KANAL_LOGOW = process.env.KANAL_LOGOW;
        
        console.log(`========== UNBAN DEBUG ==========`);
        console.log(`ROLA_MODERATOR: ${ROLA_MODERATOR}`);
        console.log(`KANAL_LOGOW z env: ${KANAL_LOGOW}`);
        
        // Sprawdź uprawnienia (tylko moderator)
        const member = interaction.member;
        const hasModRole = member.roles.cache.has(ROLA_MODERATOR);
        const isAdmin = member.permissions.has('Administrator');
        
        if (!hasModRole && !isAdmin) {
            return interaction.reply({
                content: '❌ Tylko moderatorzy mogą używać tej komendy!',
                flags: 64
            });
        }
        
        // Pobierz opcje
        const targetUserId = interaction.options.getString('user_id');
        const reason = interaction.options.getString('reason') || 'Nie podano powodu';
        const moderator = interaction.user;
        
        try {
            // Sprawdź czy użytkownik jest zbanowany
            const banList = await interaction.guild.bans.fetch();
            const bannedUser = banList.get(targetUserId);
            
            if (!bannedUser) {
                return interaction.reply({
                    content: `❌ Użytkownik o ID \`${targetUserId}\` nie jest zbanowany na tym serwerze.`,
                    flags: 64
                });
            }
            
            // Wykonaj unbana
            await interaction.guild.members.unban(targetUserId, reason);
            
            // Potwierdzenie dla moderatora
            await interaction.reply({
                content: `✅ Użytkownik **${bannedUser.user.tag}** został odbanowany.`,
                flags: 64
            });
            
            // Log na kanał logów
            console.log(`Próba wysłania logu unbana na kanał o ID: ${KANAL_LOGOW}`);
            const logChannel = client.channels.cache.get(KANAL_LOGOW);
            
            if (logChannel) {
                console.log(`✅ Znaleziono kanał logów: ${logChannel.name} (${logChannel.id})`);
                
                const logEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('🔓 Odbanowanie')
                    .addFields(
                        { name: 'Użytkownik', value: `${bannedUser.user.tag} (${targetUserId})`, inline: true },
                        { name: 'Moderator', value: `${moderator.tag} (${moderator.id})`, inline: true },
                        { name: 'Powód', value: reason, inline: false }
                    )
                    .setTimestamp();
                
                await logChannel.send({ embeds: [logEmbed] });
                console.log(`✅ Wysłano log unbana dla ${bannedUser.user.tag}`);
            } else {
                console.log(`❌ NIE znaleziono kanału logów o ID: ${KANAL_LOGOW}`);
            }
            
        } catch (error) {
            console.error('❌ Błąd przy unban:', error);
            
            let errorMessage = '❌ Wystąpił błąd podczas odbanowywania.';
            
            if (error.code === 50013) {
                errorMessage = '❌ Bot nie ma uprawnień do odbanowywania! Sprawdź uprawnienia.';
            } else if (error.code === 10026) {
                errorMessage = '❌ Nie znaleziono bana dla tego użytkownika.';
            }
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: errorMessage,
                    flags: 64
                });
            }
        }
    }
};