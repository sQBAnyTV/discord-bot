const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'ping',
    description: 'Odpowiada Pong!',
    async execute(interaction) {
        await interaction.reply('Pong! 🏓');
    }
};