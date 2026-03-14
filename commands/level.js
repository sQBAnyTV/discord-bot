const { EmbedBuilder } = require('discord.js');
const Gracz = require('../models/gracz');
const { wymaganeXp } = require('../utils/xpUtils');

module.exports = {
    name: 'level',
    description: 'Pokazuje twój poziom i XP',
    async execute(interaction) {
        const gracz = await Gracz.findOne({ userId: interaction.user.id });
        
        if (!gracz) {
            return interaction.reply('📊 Jeszcze nie masz żadnego XP. Napisz coś na czacie!');
        }
        
        const aktualneXp = gracz.xp;
        const nastepnyLevel = gracz.level + 1;
        const wymagane = wymaganeXp(nastepnyLevel);
        const postep = Math.floor((aktualneXp / wymagane) * 100);
        
        const embed = new EmbedBuilder()
            .setColor(0xFF8C00)
            .setTitle(`📊 Poziom ${gracz.username}`)
            .addFields(
                { name: '📈 Poziom', value: gracz.level.toString(), inline: true },
                { name: '✨ XP', value: `${aktualneXp} / ${wymagane}`, inline: true },
                { name: '📝 Wiadomości', value: gracz.totalMessages.toString(), inline: true },
                { name: '📊 Postęp', value: `[${postep}%]` }
            )
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    }
};