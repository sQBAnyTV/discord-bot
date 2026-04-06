const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'sklep',
    description: 'Wyświetla listę dostępnych przedmiotów w czarnym rynku',
    async execute(interaction) {
        const przedmioty = [
            { nazwa: '🔫 Pistolet', cena: 1000, opis: '+10% szansy na udany napad' },
            { nazwa: '🚗 Samochód', cena: 2500, opis: '-30% kary za porażkę' },
            { nazwa: '🛡️ Kamizelka', cena: 3000, opis: 'Chroni przed kradzieżą (50%)' },
            { nazwa: '📡 Zakłócacz', cena: 5000, opis: '40% szansy na uniknięcie bana' },
            { nazwa: '💣 C4', cena: 2000, opis: 'Fajnie wygląda! Ciekawe do czego może służyć?' },
            { nazwa: '💳 Karta magnetyczna', cena: 4000, opis: 'Wygląda jak karta pracownika banku' },
            { nazwa: '🔧 Wiertło', cena: 6000, opis: 'Nie planowałem robić remontu.' }
        ];

        let opis = '';
        for (const p of przedmioty) {
            opis += `**${p.nazwa}** – ${p.cena} monet\n`;
            opis += `> ${p.opis}\n\n`;
        }

        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('🖤 Czarny rynek')
            .setDescription(opis)
            .setFooter({ text: 'Użyj /kup <przedmiot> aby kupić przedmiot' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], flags: 64 });
    }
};