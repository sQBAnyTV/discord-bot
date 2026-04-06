const { EmbedBuilder } = require('discord.js');
const GraczEkonomia = require('../../models/GraczEkonomia');

module.exports = {
    name: 'kup',
    description: 'Kup przedmiot w czarnym rynku',
    options: [
        {
            name: 'przedmiot',
            description: 'Przedmiot do kupienia',
            type: 3,
            required: true,
            choices: [
                { name: '🔫 Pistolet', value: 'pistolet' },
                { name: '🚗 Samochód', value: 'samochod' },
                { name: '🛡️ Kamizelka', value: 'kamizelka' },
                { name: '📡 Zakłócacz', value: 'zaklocacz' },
                { name: '💣 C4', value: 'c4' },
                { name: '💳 Karta magnetyczna', value: 'karta_magnetyczna' },
                { name: '🔧 Wiertło', value: 'wiertlo' }
            ]
        }
    ],
    async execute(interaction) {
        const przedmiot = interaction.options.getString('przedmiot');
        let gracz = await GraczEkonomia.findOne({ userId: interaction.user.id });

        if (!gracz) {
            gracz = new GraczEkonomia({
                userId: interaction.user.id,
                username: interaction.user.username
            });
            await gracz.save();
        }

        // Cennik przedmiotów
        const cennik = {
            pistolet: { nazwa: '🔫 Pistolet', cena: 1000, klucz: 'pistolet' },
            samochod: { nazwa: '🚗 Samochód', cena: 2500, klucz: 'samochod' },
            kamizelka: { nazwa: '🛡️ Kamizelka', cena: 3000, klucz: 'kamizelka' },
            zaklocacz: { nazwa: '📡 Zakłócacz', cena: 5000, klucz: 'zaklocacz' },
            c4: { nazwa: '💣 C4', cena: 2000, klucz: 'c4' },
            karta_magnetyczna: { nazwa: '💳 Karta magnetyczna', cena: 4000, klucz: 'karta_magnetyczna' },
            wiertlo: { nazwa: '🔧 Wiertło', cena: 6000, klucz: 'wiertlo' }
        };

        const produkt = cennik[przedmiot];
        if (!produkt) {
            return interaction.reply({
                content: '❌ Nieprawidłowy przedmiot!',
                flags: 64
            });
        }

        // Sprawdź czy gracza stać
        if (gracz.monety < produkt.cena) {
            return interaction.reply({
                content: `❌ Nie masz wystarczająco monet! Brakuje **${produkt.cena - gracz.monety}** monet.`,
                flags: 64
            });
        }

        // Odejmij monety i dodaj przedmiot
        gracz.monety -= produkt.cena;
        if (!gracz.ekwipunek[produkt.klucz]) {
            gracz.ekwipunek[produkt.klucz] = 0;
        }
        gracz.ekwipunek[produkt.klucz] += 1;
        await gracz.save();

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🛒 Zakup udany!')
            .setDescription(`Kupiłeś **${produkt.nazwa}** za **${produkt.cena}** monet.`)
            .addFields(
                { name: '💰 Pozostałe monety', value: `${gracz.monety}`, inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed], flags: 64 });
    }
};