const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'faq',
    description: 'Wyświetla przewodnik po systemie ekonomii (tylko admin)',
    async execute(interaction) {
        // Sprawdź czy użytkownik ma uprawnienia administratora
        if (!interaction.member.permissions.has('Administrator')) {
            return interaction.reply({
                content: '❌ Tylko administrator może użyć tej komendy!',
                flags: 64
            });
        }

        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('📖 Przewodnik po systemie ekonomii')
            .setDescription('Oto wszystkie informacje, jak działa ekonomia na serwerze.')
            .addFields(
                {
                    name: '💰 **Podstawy**',
                    value: '`/daily` – codzienna premia (200–500 monet)\n`/portfel` – sprawdza stan konta i statystyki\n`/ranking` – topka najbogatszych i najlepszych napadaczy',
                    inline: false
                },
                {
                    name: '🔫 **Napady**',
                    value: '`/napad sklep` – podstawowy napad (60% szansy, 100–500 monet)\n`/napad konwój` – trudniejszy napad, wymaga specjalnego przedmiotu (50% szansy, 300–800 monet)\n`/napad bank` – zaawansowany napad, wymaga innego rzadkiego przedmiotu (40% szansy, 500–1500 monet)\n`/napad muzeum` – elitarny napad, wymaga bardzo rzadkiego przedmiotu (30% szansy, 800–2000 monet)',
                    inline: false
                },
                {
                    name: '⏳ **Cooldown**',
                    value: 'Każdy rodzaj napadu ma **20 minut** przerwy. Cooldown działa osobno dla sklepu, konwoju, banku i muzeum.',
                    inline: false
                },
                {
                    name: '🎁 **Drop przedmiotów**',
                    value: 'Podczas udanych napadów **20% szans** na zdobycie rzadkiego przedmiotu. Im wyższy poziom napadu, tym lepszy drop. Przedmioty te są kluczem do kolejnych, trudniejszych napadów.',
                    inline: false
                },
                {
                    name: '🎒 **Ekwipunek i sklep**',
                    value: '`/ekwipunek` – lista posiadanych przedmiotów\n`/sklep` – lista przedmiotów z cenami\n`/kup <przedmiot>` – zakup przedmiotu',
                    inline: false
                },
                {
                    name: '🛡️ **Przedmioty i ich efekty**',
                    value: '🔫 **Pistolet** (1000) – +10% szansy na udany napad\n🚗 **Samochód** (2500) – -30% kary za porażkę\n🛡️ **Kamizelka** (3000) – 50% szansy na uniknięcie straty\n📡 **Zakłócacz** (5000) – +15% szansy na udany napad',
                    inline: false
                },
                {
                    name: '⭐ **Poziom poszukiwań**',
                    value: '`/gwiazdki` – sprawdza poziom poszukiwań\n`/ukryj-sie` – zmniejsza poziom o 1 (koszt 1000 monet)\nPrzy 5 gwiazdkach nie możesz wykonywać napadów. Gwiazdki spadają co godzinę.',
                    inline: false
                }
            )
            .setFooter({ text: 'System ekonomii w stylu GTA | Powodzenia w napadach!' })
            .setTimestamp();

        // Wysyła wiadomość publiczną (na kanał, widoczną dla wszystkich)
        await interaction.channel.send({ embeds: [embed] });

        // Potwierdzenie dla admina (tylko dla niego)
        await interaction.reply({
            content: '✅ Przewodnik został wysłany na kanał!',
            flags: 64
        });
    }
};