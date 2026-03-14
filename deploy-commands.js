const { REST, Routes } = require('discord.js');

const commands = [
    {
        name: 'ping',
        description: 'Odpowiada Pong!',
    },
    {
        name: 'level',
        description: 'Pokazuje twój poziom i XP',
    },
    {
        name: 'top',
        description: 'Pokazuje top 10 graczy z najwyższym poziomem',
    },
    {
        name: 'warn',
        description: 'Ostrzeż użytkownika (tylko dla moderatorów)',
        options: [
            {
                name: 'user',
                description: 'Użytkownik do ostrzeżenia',
                type: 6,
                required: true
            },
            {
                name: 'reason',
                description: 'Powód ostrzeżenia',
                type: 3,
                required: true
            }
        ]
    },
    {
        name: 'mute',
        description: 'Wycisz użytkownika na określony czas (tylko moderator)',
        options: [
            {
                name: 'user',
                description: 'Użytkownik do wyciszenia',
                type: 6,
                required: true
            },
            {
                name: 'time',
                description: 'Czas (np. 10m, 1h, 1d)',
                type: 3,
                required: true
            },
            {
                name: 'reason',
                description: 'Powód wyciszenia',
                type: 3,
                required: true
            }
        ]
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