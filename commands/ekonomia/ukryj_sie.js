const { EmbedBuilder } = require('discord.js');
const GraczEkonomia = require('../../models/GraczEkonomia');

module.exports = {
    name: 'ukryj-sie',
    description: 'Zmniejsza poziom poszukiwań o 1 (koszt 1000 monet)',
    async execute(interaction) {
        let gracz = await GraczEkonomia.findOne({ userId: interaction.user.id });

        if (!gracz) {
            gracz = new GraczEkonomia({
                userId: interaction.user.id,
                username: interaction.user.username
            });
            await gracz.save();
        }

        if (gracz.poziomPoszukiwan <= 0) {
            return interaction.reply({
                content: '❌ Nie masz żadnych gwiazdek do zmniejszenia!',
                flags: 64
            });
        }

        const koszt = 1000;

        if (gracz.monety < koszt) {
            return interaction.reply({
                content: `❌ Nie masz wystarczająco monet! Potrzebujesz **${koszt}** monet.`,
                flags: 64
            });
        }

        // Zmniejsz gwiazdki i odejmij monety
        gracz.monety -= koszt;
        gracz.poziomPoszukiwan = Math.max(0, gracz.poziomPoszukiwan - 1);
        await gracz.save();

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🕵️ Ukrywasz się przed policją!')
            .setDescription(`Zmniejszono poziom poszukiwań o 1.`)
            .addFields(
                { name: '⭐ Nowy poziom poszukiwań', value: `${gracz.poziomPoszukiwan.toFixed(1)} / 5`, inline: true },
                { name: '💰 Pozostałe monety', value: `${gracz.monety}`, inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed], flags: 64 });
    }
};