const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ] 
});

const token = process.env.TOKEN;
const KANAL_PROPONOWANIA = process.env.KANAL_ID;

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
    if (message.author.bot) return;
    
    if (message.channel.id === KANAL_PROPONOWANIA) {
        try {
            // 1. Usuń oryginalną wiadomość
            await message.delete();
            
            // 2. Stwórz embed
            const embed = new EmbedBuilder()
                .setColor(0xFF8C00)
                .setTitle('📝 Nowa propozycja!')
                .setDescription(message.content)
                .setAuthor({ 
                    name: message.author.username, 
                    iconURL: message.author.displayAvatarURL() 
                })
                .setTimestamp()
                .setFooter({ text: 'Zagłosuj używając reakcji poniżej' });
            
            // 3. Wyślij embed
            const sentMessage = await message.channel.send({ embeds: [embed] });
            
            // 4. Dodaj reakcje
            await sentMessage.react('✅');
            await sentMessage.react('❌');
            
            // 5. STWÓRZ WĄTEK DO DYSKUSJI
            try {
                const thread = await sentMessage.startThread({
                    name: `Dyskusja: ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`,
                    autoArchiveDuration: 1440,
                    reason: 'Automatyczny wątek pod propozycją',
                });
                
                await thread.send(`👋 Witaj ${message.author}! Tutaj możecie dyskutować o podanej propozycji.`);
                console.log(`Utworzono wątek: ${thread.name}`);
                
            } catch (threadError) {
                console.error('Nie udało się utworzyć wątku:', threadError);
                // Nie wysyłamy błędu na kanał, żeby nie spamować
            }
            
        } catch (error) {
            console.error('Wystąpił błąd:', error);
            await message.channel.send('❌ Wystąpił błąd podczas przetwarzania propozycji.');
        }
    }
});

// Serwer HTTP dla Render
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Bot Discord działa! 🤖');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Serwer statusu nasłuchuje na porcie ${PORT}`);
});

client.login(token);