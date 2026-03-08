const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent // Potrzebne do czytania wiadomości
    ] 
});

const token = process.env.TOKEN;

// ID kanału, na którym bot ma nasłuchiwać propozycji
// Musisz to zmienić na ID swojego kanału!
const KANAL_PROPONOWANIA = '1480275088711614626';

client.once('ready', () => {
    console.log(`✅ Bot ${client.user.tag} jest online!`);
    console.log(`Nasłuchuję na kanale o ID: ${KANAL_PROPONOWANIA}`);
});

// Nasłuchiwanie na komendy slash
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === 'ping') {
        await interaction.reply('Pong! 🏓');
    }
});

// Nasłuchiwanie na wiadomości
client.on('messageCreate', async message => {
    // Ignoruj wiadomości od botów (żeby bot nie reagował na samego siebie)
    if (message.author.bot) return;
    
    // Sprawdź czy wiadomość jest na odpowiednim kanale
    if (message.channel.id === KANAL_PROPONOWANIA) {
        try {
            // 1. Usuń oryginalną wiadomość
            await message.delete();
            
            // 2. Stwórz embed (ładną wiadomość)
            const embed = new EmbedBuilder()
                .setColor(0xFF8C00) // Pomarańczowy kolor
                .setTitle('📝 Nowa propozycja!')
                .setDescription(message.content) // Treść propozycji
                .setAuthor({ 
                    name: message.author.username, 
                    iconURL: message.author.displayAvatarURL() 
                })
                .setTimestamp() // Dodaje czas wysłania
                .setFooter({ text: 'Zagłosuj używając reakcji poniżej' });
            
            // 3. Wyślij embed na ten sam kanał
            const sentMessage = await message.channel.send({ embeds: [embed] });
            
            // 4. Dodaj reakcje (plus i minus)
            await sentMessage.react('✅');
            await sentMessage.react('❌');
            
        } catch (error) {
            console.error('Wystąpił błąd:', error);
            // Jeśli coś pójdzie nie tak, poinformuj na kanale
            await message.channel.send('❌ Wystąpił błąd podczas przetwarzania propozycji.');
        }
    }
});

client.login(token);