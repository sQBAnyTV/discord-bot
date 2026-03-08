const { REST, Routes } = require('discord.js');

// Komenda którą chcemy utworzyć
const commands = [
    {
        name: 'ping',
        description: 'Odpowiada Pong!',
    },
];

// Twój token i ID z Discord Developer Portalu
const token = 'MTQ4MDI3NDk4MTc1NjczMTYxMw.GF4eOp.wIKLGimyMh5qypkolwCJsnSASq_vQ_UxQYP3Gw';
const clientId = '1480274981756731613'; // To to ID które kopiowaliśmy z OAuth2

// REST = Representational State Transfer - sposób komunikacji z API Discorda
const rest = new REST({ version: '10' }).setToken(token);

// Rejestrujemy komendę
(async () => {
    try {
        console.log('Rozpoczęto rejestrację komendy /ping');

        await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands },
        );

        console.log('✅ Komenda /ping została zarejestrowana!');
    } catch (error) {
        console.error('❌ Błąd podczas rejestracji:', error);
    }
})();