const { REST, Routes } = require('discord.js');

const commands = [
    {
    name: 'unban',
    description: 'Odbanuj użytkownika (tylko moderator)',
    options: [
        {
            name: 'user_id',
            description: 'ID użytkownika do odbanowania',
            type: 3,
            required: true
        },
        {
            name: 'reason',
            description: 'Powód odbanowania',
            type: 3,
            required: false
        }
    ]
    },
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
    },
    {
        name: 'unmute',
        description: 'Zdejmij przerwę z użytkownika (tylko moderator)',
        options: [
            {
                name: 'user',
                description: 'Użytkownik do odciszenia',
                type: 6,
                required: true
            }
        ]
    },
    {
        name: 'ban',
        description: 'Zbanuj użytkownika (tylko moderator)',
        options: [
            {
                name: 'user',
                description: 'Użytkownik do zbanowania',
                type: 6,
                required: true
            },
            {
                name: 'reason',
                description: 'Powód bana',
                type: 3,
                required: true
            },
            {
                name: 'delete_messages',
                description: 'Usuń wiadomości (0-7 dni)',
                type: 4,
                required: true,
                choices: [
                    { name: 'Nie usuwaj', value: 0 },
                    { name: 'Ostatnie 24h', value: 1 },
                    { name: 'Ostatnie 3 dni', value: 3 },
                    { name: 'Ostatnie 7 dni', value: 7 }
                ]
            }
        ]
    },
    {
        name: 'reactionrole',
        description: 'Zarządzaj reaction role (tylko moderator)',
        options: [
            {
                name: 'add',
                description: 'Dodaj nowe reaction role',
                type: 1,
                options: [
                    {
                        name: 'message_id',
                        description: 'ID wiadomości',
                        type: 3,
                        required: true
                    },
                    {
                        name: 'emoji',
                        description: 'Emoji (np. ✅, 🔴, 🟢)',
                        type: 3,
                        required: true
                    },
                    {
                        name: 'role',
                        description: 'Rola do nadania',
                        type: 8,
                        required: true
                    }
                ]
            },
            {
                name: 'remove',
                description: 'Usuń reaction role',
                type: 1,
                options: [
                    {
                        name: 'message_id',
                        description: 'ID wiadomości',
                        type: 3,
                        required: true
                    },
                    {
                        name: 'emoji',
                        description: 'Emoji do usunięcia',
                        type: 3,
                        required: true
                    }
                ]
            },
            {
                name: 'list',
                description: 'Pokaż listę reaction role dla wiadomości',
                type: 1,
                options: [
                    {
                        name: 'message_id',
                        description: 'ID wiadomości',
                        type: 3,
                        required: true
                    }
                ]
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