const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'setup-ticket',
    description: 'Tworzy panel ticketowy (tylko admin)',
    async execute(interaction, client, ROLA_HELPER, ROLA_MODERATOR) {
        if (!interaction.member.permissions.has('Administrator')) {
            return interaction.reply({
                content: '❌ Tylko administrator może użyć tej komendy!',
                flags: 64
            });
        }

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🎫 System ticketów')
            .setDescription('Kliknij w przycisk, aby otworzyć ticket:')
            .addFields(
                { name: '❓ Inne', value: 'Pytania, problemy, zgłoszenia', inline: true }
            )
            .setFooter({ text: 'Wybierz kategorię' });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket_inne')
                    .setLabel('❓ Inne')
                    .setStyle(ButtonStyle.Primary)
            );

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: '✅ Panel ticketowy utworzony!', flags: 64 });
    }
};