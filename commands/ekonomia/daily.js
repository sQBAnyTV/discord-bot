const GraczEkonomia = require('../../models/GraczEkonomia');

module.exports = {
    name: 'daily',
    description: 'Codzienna premia (monety)',
    async execute(interaction) {
        let gracz = await GraczEkonomia.findOne({ userId: interaction.user.id });

        if (!gracz) {
            gracz = new GraczEkonomia({
                userId: interaction.user.id,
                username: interaction.user.username
            });
        }

        const now = new Date();
        const lastDaily = gracz.ostatnieDaily;

        if (lastDaily && (now - lastDaily) < 24 * 60 * 60 * 1000) {
            const next = new Date(lastDaily.getTime() + 24 * 60 * 60 * 1000);
            return interaction.reply({
                content: `⏳ Premię możesz odebrać ponownie <t:${Math.floor(next / 1000)}:R>`,
                flags: 64
            });
        }

        const premia = 200 + Math.floor(Math.random() * 300); // 200–500 monet
        gracz.monety += premia;
        gracz.ostatnieDaily = now;
        await gracz.save();

        await interaction.reply({
            content: `✅ Odebrałeś dzienną premię! Otrzymałeś **${premia}** monet.`,
            flags: 64
        });
    }
};