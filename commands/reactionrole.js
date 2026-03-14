const { EmbedBuilder } = require('discord.js');
const ReactionRole = require('../models/reactionrole');

module.exports = {
    name: 'reactionrole',
    description: 'Zarządzaj reaction role',
    async execute(interaction, client, ROLA_MODERATOR) {
        const member = interaction.member;
        const hasModRole = member.roles.cache.has(ROLA_MODERATOR);
        const isAdmin = member.permissions.has('Administrator');
        
        if (!hasModRole && !isAdmin) {
            return interaction.reply({
                content: '❌ Tylko moderatorzy mogą używać tej komendy!',
                ephemeral: true
            });
        }

        const subcommand = interaction.options.getSubcommand();

        // DODAWANIE
        if (subcommand === 'add') {
            const messageId = interaction.options.getString('message_id');
            const emoji = interaction.options.getString('emoji');
            const role = interaction.options.getRole('role');

            try {
                const message = await interaction.channel.messages.fetch(messageId).catch(() => null);
                if (!message) {
                    return interaction.reply({
                        content: '❌ Nie znaleziono wiadomości o podanym ID na tym kanale!',
                        ephemeral: true
                    });
                }

                const existing = await ReactionRole.findOne({
                    messageId: messageId,
                    emoji: emoji
                });

                if (existing) {
                    return interaction.reply({
                        content: `❌ To emoji (${emoji}) jest już przypisane do roli <@&${existing.roleId}> dla tej wiadomości!`,
                        ephemeral: true
                    });
                }

                const rr = new ReactionRole({
                    messageId: messageId,
                    channelId: interaction.channel.id,
                    guildId: interaction.guild.id,
                    emoji: emoji,
                    roleId: role.id
                });
                await rr.save();

                await message.react(emoji);

                await interaction.reply({
                    content: `✅ Dodano reaction role: ${emoji} → ${role} dla wiadomości ${messageId}`,
                    ephemeral: true
                });

            } catch (error) {
                console.error('Błąd przy dodawaniu reaction role:', error);
                await interaction.reply({
                    content: '❌ Wystąpił błąd. Sprawdź czy emoji jest poprawne.',
                    ephemeral: true
                });
            }
        }

        // USUWANIE
        if (subcommand === 'remove') {
            const messageId = interaction.options.getString('message_id');
            const emoji = interaction.options.getString('emoji');

            const deleted = await ReactionRole.findOneAndDelete({
                messageId: messageId,
                emoji: emoji
            });

            if (!deleted) {
                return interaction.reply({
                    content: '❌ Nie znaleziono takiego reaction role!',
                    ephemeral: true
                });
            }

            await interaction.reply({
                content: `✅ Usunięto reaction role dla emoji ${emoji}`,
                ephemeral: true
            });
        }

        // LISTA
        if (subcommand === 'list') {
            const messageId = interaction.options.getString('message_id');

            const list = await ReactionRole.find({ messageId: messageId });

            if (list.length === 0) {
                return interaction.reply({
                    content: '📋 Brak reaction role dla tej wiadomości.',
                    ephemeral: true
                });
            }

            let opis = '';
            for (const item of list) {
                opis += `${item.emoji} → <@&${item.roleId}>\n`;
            }

            const embed = new EmbedBuilder()
                .setColor(0xFF8C00)
                .setTitle('📋 Reaction role dla wiadomości')
                .setDescription(opis)
                .setFooter({ text: `ID wiadomości: ${messageId}` });

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    }
};