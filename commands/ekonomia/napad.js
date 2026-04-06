const { EmbedBuilder } = require('discord.js');
const GraczEkonomia = require('../../models/GraczEkonomia');

module.exports = {
    name: 'napad',
    description: 'Wykonaj napad (sklep, konwój, bank, muzeum)',
    async execute(interaction) {
        const rodzaj = interaction.options.getString('rodzaj');
        let gracz = await GraczEkonomia.findOne({ userId: interaction.user.id });

        if (!gracz) {
            gracz = new GraczEkonomia({
                userId: interaction.user.id,
                username: interaction.user.username
            });
            await gracz.save();
        }

        if (gracz.poziomPoszukiwan >= 5) {
            return interaction.reply({
                content: '⚠️ Masz 5 gwiazdek! Nie możesz wykonać napadu.',
                flags: 64
            });
        }

        // Parametry napadów
        const parametry = {
            sklep: { nazwa: '🏪 Sklep', szansa: 0.6, zyskMin: 100, zyskMax: 500, strataMin: 50, strataMax: 200, gwiazdkiSukces: 1, gwiazdkiPorażka: 0.5, wymagany: null, drop: 'c4', dropNazwa: 'C4' },
            konwoj: { nazwa: '🚚 Konwój', szansa: 0.5, zyskMin: 300, zyskMax: 800, strataMin: 100, strataMax: 200, gwiazdkiSukces: 1.5, gwiazdkiPorażka: 1, wymagany: 'c4', drop: 'karta_magnetyczna', dropNazwa: 'kartę magnetyczną' },
            bank: { nazwa: '🏦 Bank', szansa: 0.4, zyskMin: 500, zyskMax: 1500, strataMin: 150, strataMax: 300, gwiazdkiSukces: 2, gwiazdkiPorażka: 1.5, wymagany: 'karta_magnetyczna', drop: 'wiertlo', dropNazwa: 'wiertło' },
            muzeum: { nazwa: '🏛️ Muzeum', szansa: 0.3, zyskMin: 800, zyskMax: 2000, strataMin: 200, strataMax: 400, gwiazdkiSukces: 2.5, gwiazdkiPorażka: 2, wymagany: 'wiertlo', drop: null, dropNazwa: null }
        };

        const p = parametry[rodzaj];

        // Cooldown (20 minut)
        const cooldownCzas = 20 * 60 * 1000;
        const ostatniNapad = gracz.cooldownNapad?.[rodzaj];
        const teraz = new Date();

        if (ostatniNapad && (teraz - ostatniNapad) < cooldownCzas) {
            const pozostalo = Math.ceil((cooldownCzas - (teraz - ostatniNapad)) / 60000);
            return interaction.reply({
                content: `⏳ Musisz poczekać jeszcze **${pozostalo} minut** przed kolejnym napadem na **${p.nazwa}**!`,
                flags: 64
            });
        }

        // Sprawdź wymagany przedmiot
        if (p.wymagany && (!gracz.ekwipunek || gracz.ekwipunek[p.wymagany] < 1)) {
            return interaction.reply({
                content: `❌ Nie masz **${p.dropNazwa}**! Wymagane do napadu na ${p.nazwa}.`,
                flags: 64
            });
        }

        // Zużyj wymagany przedmiot
        if (p.wymagany) {
            gracz.ekwipunek[p.wymagany] -= 1;
        }

        const sukces = Math.random() < p.szansa;
        let wiadomosc = '';
        let zmianaMonet = 0;
        let zmianaPoszukiwan = 0;

        if (sukces) {
            const zysk = Math.floor(Math.random() * (p.zyskMax - p.zyskMin + 1)) + p.zyskMin;
            zmianaMonet = zysk;
            zmianaPoszukiwan = p.gwiazdkiSukces;
            gracz.udaneNapady += 1;
            wiadomosc = `✅ **Udany napad na ${p.nazwa}!** Zdobywasz **${zysk}** monet.`;

            // Drop przedmiotu (20% szans)
            if (p.drop) {
                const drop = Math.random() < 0.2;
                if (drop) {
                    gracz.ekwipunek[p.drop] += 1;
                    wiadomosc += `\n🎁 **Dodatkowo zdobywasz ${p.dropNazwa}!**`;
                }
            }
        } else {
            const strata = Math.floor(Math.random() * (p.strataMax - p.strataMin + 1)) + p.strataMin;
            zmianaMonet = -strata;
            zmianaPoszukiwan = p.gwiazdkiPorażka;
            gracz.nieudaneNapady += 1;
            wiadomosc = `❌ **Nieudany napad na ${p.nazwa}!** Traci sz **${strata}** monet.`;
        }

        gracz.monety += zmianaMonet;
        gracz.poziomPoszukiwan += zmianaPoszukiwan;
        gracz.cooldownNapad[rodzaj] = teraz;
        await gracz.save();

        const embed = new EmbedBuilder()
            .setColor(sukces ? 0x00FF00 : 0xFF0000)
            .setTitle(`🔫 ${p.nazwa}`)
            .setDescription(wiadomosc)
            .addFields(
                { name: '💰 Stan konta', value: `${gracz.monety} monet`, inline: true },
                { name: '⭐ Poziom poszukiwań', value: `${gracz.poziomPoszukiwan.toFixed(1)} / 5`, inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed], flags: 64 });
    }
};