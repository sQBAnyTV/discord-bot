const { EmbedBuilder } = require('discord.js');
const GraczEkonomia = require('../../models/GraczEkonomia');

module.exports = {
    name: 'gwiazdki',
    description: 'Pokazuje twój poziom poszukiwań',
    async execute(interaction) {
        let gracz = await GraczEkonomia.findOne({ userId: interaction.user.id });

        if (!gracz) {
            gracz = new GraczEkonomia({
                userId: interaction.user.id,
                username: interaction.user.username
            });
            await gracz.save();
        }

        const poziom = gracz.poziomPoszukiwan;
        const maks = 5;
        const pasek = '⭐'.repeat(Math.floor(poziom)) + '☆'.repeat(maks - Math.floor(poziom));

        const embed = new EmbedBuilder()
            .setColor(0xFFA500)
            .setTitle(`⭐ Poziom poszukiwań ${interaction.user.username}`)
            .setDescription(`${pasek}\n**${poziom.toFixed(1)} / ${maks}**`)
            .addFields(
                { name: 'ℹ️ Informacje', value: 'Przy 5 gwiazdkach nie możesz wykonywać napadów.\nGwiazdki spadają co godzinę.\nMożesz je zmniejszyć za pomocą `/ukryj_sie`.' }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed], flags: 64 });
    }
};