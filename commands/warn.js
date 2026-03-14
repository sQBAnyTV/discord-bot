const { EmbedBuilder } = require('discord.js');
const Warn = require('../models/warn');

module.exports = {
    name: 'warn',
    description: 'Ostrzeż użytkownika (tylko dla moderatorów)',
    async execute(interaction, client, ROLA_HELPER, ROLA_MODERATOR, KANAL_LOGOW) {
        const member = interaction.member;
        const hasHelperRole = member.roles.cache.has(ROLA_HELPER);
        const hasModRole = member.roles.cache.has(ROLA_MODERATOR);
        const isAdmin = member.permissions.has('Administrator');
        
        if (!hasHelperRole && !hasModRole && !isAdmin) {
            return interaction.reply({
                content: '❌ Tylko osoby z rolą **Helper** lub **Moderator** mogą używać tej komendy!',
                ephemeral: true
            });
        }
        
        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');
        const moderator = interaction.user;
        
        if (targetUser.id === moderator.id) {
            return interaction.reply({
                content: '❌ Nie możesz ostrzec samego siebie!',
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
            const warn = new Warn({
                userId: targetUser.id,
                moderatorId: moderator.id,
                reason: reason,
                guildId: interaction.guild.id
            });
            await warn.save();
            
            const dmEmbed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('⚠️ Otrzymałeś ostrzeżenie!')
                .setDescription(`Na serwerze **${interaction.guild.name}**`)
                .addFields(
                    { name: 'Moderator', value: moderator.tag, inline: true },
                    { name: 'Powód', value: reason, inline: false }
                )
                .setTimestamp()
                .setFooter({ text: 'Ostrzeżenie zostało zapisane w bazie danych.' });
            
            await targetUser.send({ embeds: [dmEmbed] }).catch(() => {
                console.log(`Nie udało się wysłać PW do ${targetUser.tag}`);
            });
            
            await interaction.reply({
                content: `✅ Ostrzeżenie dla ${targetUser.tag} zostało zapisane. Użytkownik został powiadomiony PW.`,
                ephemeral: true
            });
            
            const logChannel = client.channels.cache.get(KANAL_LOGOW);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor(0xFF8C00)
                    .setTitle('⚠️ Nowe ostrzeżenie')
                    .addFields(
                        { name: 'Użytkownik', value: `${targetUser.tag} (${targetUser.id})`, inline: true },
                        { name: 'Moderator', value: `${moderator.tag} (${moderator.id})`, inline: true },
                        { name: 'Powód', value: reason, inline: false }
                    )
                    .setTimestamp();
                
                await logChannel.send({ embeds: [logEmbed] });
            }
            
        } catch (error) {
            console.error('Błąd przy warn:', error);
            await interaction.reply({
                content: '❌ Wystąpił błąd podczas zapisywania ostrzeżenia.',
                ephemeral: true
            });
        }
    }
};