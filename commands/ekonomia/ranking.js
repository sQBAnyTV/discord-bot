const { EmbedBuilder } = require('discord.js');
const GraczEkonomia = require('../../models/GraczEkonomia');

module.exports = {
    name: 'ranking',
    description: 'Pokazuje ranking graczy (monety, napady)',
    async execute(interaction) {
        // Ranking monet (top 10)
        const topMonety = await GraczEkonomia.find({})
            .sort({ monety: -1 })
            .limit(10);

        // Ranking napadów (top 10)
        const topNapady = await GraczEkonomia.find({})
            .sort({ udaneNapady: -1 })
            .limit(10);

        let rankingMonety = '';
        for (let i = 0; i < topMonety.length; i++) {
            const gracz = topMonety[i];
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
            rankingMonety += `${medal} **${gracz.username}** – ${gracz.monety} monet\n`;
        }

        let rankingNapady = '';
        for (let i = 0; i < topNapady.length; i++) {
            const gracz = topNapady[i];
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
            rankingNapady += `${medal} **${gracz.username}** – ${gracz.udaneNapady} napadów\n`;
        }

        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('🏆 Ranking graczy')
            .addFields(
                { name: '💰 Najbogatsi', value: rankingMonety || 'Brak danych', inline: true },
                { name: '🔫 Najlepsi napadacze', value: rankingNapady || 'Brak danych', inline: true }
            )
            .setFooter({ text: 'Ranking aktualizuje się na bieżąco' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], flags: 64 });
    }
};