const { EmbedBuilder } = require('discord.js');
const GraczEkonomia = require('../../models/GraczEkonomia');

module.exports = {
    name: 'ekwipunek',
    description: 'Pokazuje twoje przedmioty',
    async execute(interaction) {
        let gracz = await GraczEkonomia.findOne({ userId: interaction.user.id });

        if (!gracz) {
            gracz = new GraczEkonomia({
                userId: interaction.user.id,
                username: interaction.user.username
            });
            await gracz.save();
        }

        // Lista przedmiotów z nazwami i emoji
        const przedmioty = [
            { nazwa: 'Pistolet', klucz: 'pistolet', emoji: '🔫' },
            { nazwa: 'Samochód', klucz: 'samochod', emoji: '🚗' },
            { nazwa: 'Kamizelka', klucz: 'kamizelka', emoji: '🛡️' },
            { nazwa: 'Zakłócacz', klucz: 'zaklocacz', emoji: '📡' },
            { nazwa: 'C4', klucz: 'c4', emoji: '💣' },
            { nazwa: 'Karta magnetyczna', klucz: 'karta_magnetyczna', emoji: '💳' },
            { nazwa: 'Wiertło', klucz: 'wiertlo', emoji: '🔧' }
        ];

        let opis = '';
        let licznik = 0;

        for (const p of przedmioty) {
            const ilosc = gracz.ekwipunek?.[p.klucz] || 0;
            if (ilosc > 0) {
                opis += `${p.emoji} **${p.nazwa}:** ${ilosc}\n`;
                licznik += ilosc;
            }
        }

        if (opis === '') {
            opis = 'Twój ekwipunek jest pusty.';
        }

        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle(`🎒 Ekwipunek gracza ${interaction.user.username}`)
            .setDescription(opis)
            .addFields(
                { name: '📦 Łącznie przedmiotów', value: `${licznik}`, inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed], flags: 64 });
    }
};