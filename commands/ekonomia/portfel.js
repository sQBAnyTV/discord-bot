const { EmbedBuilder } = require('discord.js');
const GraczEkonomia = require('../../models/GraczEkonomia');

module.exports = {
    name: 'portfel',
    description: 'Pokazuje twoje monety, poziom poszukiwań i ekwipunek',
    async execute(interaction) {
        let gracz = await GraczEkonomia.findOne({ userId: interaction.user.id });

        if (!gracz) {
            gracz = new GraczEkonomia({
                userId: interaction.user.id,
                username: interaction.user.username
            });
            await gracz.save();
        }

        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle(`💰 Portfel gracza ${interaction.user.username}`)
            .addFields(
                { name: '🪙 Monety', value: `${gracz.monety}`, inline: true },
                { name: '⭐ Poziom poszukiwań', value: `${gracz.poziomPoszukiwan} / 5`, inline: true },
                { name: '🛡️ Poziom ochrony', value: `${gracz.poziomOchrony} / 5`, inline: true },
                { name: '🎯 Doświadczenie', value: `${gracz.doswiadczenie}`, inline: true },
                { name: '✅ Udane napady', value: `${gracz.udaneNapady}`, inline: true },
                { name: '❌ Nieudane napady', value: `${gracz.nieudaneNapady}`, inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed], flags: 64 });
    }
};