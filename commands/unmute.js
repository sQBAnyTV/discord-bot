const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'unmute',
    description: 'Zdejmij przerwę z użytkownika (tylko moderator)',
    async execute(interaction, client, ROLA_MODERATOR, KANAL_LOGOW) {
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
            await targetMember.timeout(null);
            
            await interaction.reply({
                content: `✅ Przerwa dla ${targetUser.tag} została zdjęta.`,
                ephemeral: true
            });
            
            // Log na kanał logów
            const logChannel = client.channels.cache.get(KANAL_LOGOW);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle('🔊 Przerwa zdjęta (unmute)')
                    .addFields(
                        { name: 'Użytkownik', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                        { name: 'Moderator', value: `${moderator.tag} (${moderator.id})`, inline: true }
                    )
                    .setTimestamp();
                
                await logChannel.send({ embeds: [logEmbed] });
            }
            
        } catch (error) {
            console.error('Błąd przy unmute:', error);
            await interaction.reply({
                content: '❌ Wystąpił błąd podczas zdejmowania przerwy.',
                ephemeral: true
            });
        }
    }
};