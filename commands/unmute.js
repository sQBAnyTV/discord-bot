const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'unmute',
    description: 'Zdejmij przerwę z użytkownika (tylko moderator)',
    async execute(interaction, client, ROLA_HELPER, ROLA_MODERATOR, KANAL_LOGOW) {
        console.log(`========== UNMUTE DEBUG ==========`);
        console.log(`ROLA_HELPER: ${ROLA_HELPER}`);
        console.log(`ROLA_MODERATOR: ${ROLA_MODERATOR}`);
        console.log(`KANAL_LOGOW: ${KANAL_LOGOW}`);
        
        // Sprawdź uprawnienia
        const member = interaction.member;
        const hasModRole = member.roles.cache.has(ROLA_MODERATOR);
        const isAdmin = member.permissions.has('Administrator');
        
        if (!hasModRole && !isAdmin) {
            return interaction.reply({
                content: '❌ Tylko moderatorzy mogą używać tej komendy!',
                ephemeral: true
            });
        }
        
        const targetUser = interaction.options.getUser('user');
        const moderator = interaction.user;
        
        if (targetUser.id === moderator.id) {
            return interaction.reply({
                content: '❌ Nie możesz zdjąć przerwy samemu sobie!',
                ephemeral: true
            });
        }
        
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        if (!targetMember) {
            return interaction.reply({
                content: '❌ Nie znaleziono użytkownika na serwerze!',
                ephemeral: true
            });
        }
        
        try {
            // Zdejmij timeout
            await targetMember.timeout(null);
            
            // Wyślij PW do użytkownika
            const dmEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('🔊 Przerwa zdjęta!')
                .setDescription(`Na serwerze **${interaction.guild.name}**`)
                .addFields(
                    { name: 'Moderator', value: moderator.tag, inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'Przerwa została zdjęta przed czasem.' });
            
            await targetUser.send({ embeds: [dmEmbed] }).catch(() => {
                console.log(`Nie udało się wysłać PW do ${targetUser.tag}`);
            });
            
            // Potwierdzenie dla moderatora
            await interaction.reply({
                content: `✅ Przerwa dla ${targetUser.tag} została zdjęta.`,
                ephemeral: true
            });
            
            // Log na kanał logów
            console.log(`Próba wysłania logu na kanał o ID: ${KANAL_LOGOW}`);
            const logChannel = client.channels.cache.get(KANAL_LOGOW);
            
            if (logChannel) {
                console.log(`✅ Znaleziono kanał: ${logChannel.name} (${logChannel.id})`);
                
                const logEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('🔊 Przerwa zdjęta (unmute)')
                    .addFields(
                        { name: 'Użytkownik', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                        { name: 'Moderator', value: `${moderator.tag} (${moderator.id})`, inline: true }
                    )
                    .setTimestamp();
                
                await logChannel.send({ embeds: [logEmbed] });
                console.log(`✅ Wysłano log unmute dla ${targetUser.tag}`);
            } else {
                console.log(`❌ NIE znaleziono kanału o ID: ${KANAL_LOGOW}`);
            }
            
        } catch (error) {
            console.error('Błąd przy unmute:', error);
            
            if (error.code === 50013) {
                return interaction.reply({
                    content: '❌ Bot nie ma uprawnień do zarządzania przerwami! Sprawdź uprawnienia.',
                    ephemeral: true
                });
            }
            
            await interaction.reply({
                content: '❌ Wystąpił błąd podczas zdejmowania przerwy.',
                ephemeral: true
            });
        }
    }
};