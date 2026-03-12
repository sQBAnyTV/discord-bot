const { REST, Routes } = require('discord.js');

const commands = [
    {
        name: 'ping',
        description: 'Odpowiada Pong!',
    },
    {
        name: 'rekord',
        description: 'Pokazuje aktualny rekord liczenia',
    }
];

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID || '1480274981756731613';

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        console.log('Rozpoczęto rejestrację komend...');
        await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands },
        );
        console.log('✅ Komendy zostały zarejestrowane!');
    } catch (error) {
        console.error('❌ Błąd podczas rejestracji:', error);
    }
})();