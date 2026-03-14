const { EmbedBuilder } = require('discord.js');
const Gracz = require('../models/gracz');

module.exports = {
    name: 'top',
    description: 'Pokazuje top 10 graczy z najwyższym poziomem',
    async execute(interaction) {
        const topGracze = await Gracz.find({})
            .sort({ level: -1, xp: -1 })
            .limit(10);
        
        if (topGracze.length === 0) {
            return interaction.reply('📊 Jeszcze nie ma żadnych graczy w rankingu!');
        }
        
        let ranking = '';
        for (let i = 0; i < topGracze.length; i++) {
            const gracz = topGracze[i];
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '📌';
            ranking += `${medal} **${i + 1}.** <@${gracz.userId}> – **Poziom ${gracz.level}** (${gracz.xp} XP)\n`;
        }
        
        const embed = new EmbedBuilder()
            .setColor(0xFF8C00)
            .setTitle('🏆 TOP 10 graczy')
            .setDescription(ranking)
            .setFooter({ text: 'Gratulacje dla najlepszych!' })
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    }
};