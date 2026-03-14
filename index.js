const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const mongoose = require('mongoose');
const express = require('express');
const Gracz = require('./models/gracz');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ] 
});

const token = process.env.TOKEN;
const KANAL_PROPONOWANIA = process.env.KANAL_ID;
const KANAL_LOGOW = process.env.KANAL_LOGOW;
const MONGODB_URI = process.env.MONGODB_URI;

// Stałe levelowania
const XP_PER_MESSAGE = 15; // XP za każdą wiadomość
const XP_COOLDOWN = 60000; // 60 sekund cooldown (żeby nie spamowali)
const LEVEL_MULTIPLIER = 100; // Każdy poziom wymaga: (level * LEVEL_MULTIPLIER) XP

// Funkcja do obliczania wymaganego XP na dany poziom
function wymaganeXp(level) {
    return level * LEVEL_MULTIPLIER;
}

// Funkcja do sprawdzania czy gracz awansował
async function sprawdzAwans(gracz) {
    while (gracz.xp >= wymaganeXp(gracz.level + 1)) {
        gracz.level++;
        // Wyślij wiadomość o awansie
        const channel = client.channels.cache.get(KANAL_LOGOW);
        if (channel) {
            await channel.send(`🎉 Gratulacje <@${gracz.userId}>! Awansowałeś na **poziom ${gracz.level}**! 🎉`);
        }
    }
    await gracz.save();
}

// Połączenie z MongoDB
mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ Połączono z MongoDB Atlas!');
    })
    .catch(err => {
        console.error('❌ Błąd połączenia z MongoDB:', err);
    });

client.once('ready', () => {
    console.log(`✅ Bot ${client.user.tag} jest online!`);
    console.log(`Nasłuchuję na kanale o ID: ${KANAL_PROPONOWANIA}`);
    console.log(`Kanał logów: ${KANAL_LOGOW}`);
});

// Nasłuchiwanie na komendy slash
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === 'ping') {
        await interaction.reply('Pong! 🏓');
    }
    
    if (interaction.commandName === 'level') {
        const gracz = await Gracz.findOne({ userId: interaction.user.id });
        
        if (!gracz) {
            return interaction.reply('📊 Jeszcze nie masz żadnego XP. Napisz coś na czacie!');
        }
        
        const aktualneXp = gracz.xp;
        const nastepnyLevel = gracz.level + 1;
        const wymagane = wymaganeXp(nastepnyLevel);
        const postep = Math.floor((aktualneXp / wymagane) * 100);
        
        const embed = new EmbedBuilder()
            .setColor(0xFF8C00)
            .setTitle(`📊 Poziom ${gracz.username}`)
            .addFields(
                { name: '📈 Poziom', value: gracz.level.toString(), inline: true },
                { name: '✨ XP', value: `${aktualneXp} / ${wymagane}`, inline: true },
                { name: '📝 Wiadomości', value: gracz.totalMessages.toString(), inline: true },
                { name: '📊 Postęp', value: `[${postep}%]` }
            )
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    }
});

// Nasłuchiwanie na wiadomości
client.on('messageCreate', async message => {
    if (message.author.bot) return;
    
    // -------------------- SYSTEM LEVELOWANIA --------------------
    // Pomijamy kanał propozycji
    if (message.channel.id !== KANAL_PROPONOWANIA) {
        try {
            let gracz = await Gracz.findOne({ userId: message.author.id });
            
            // Jeśli gracz nie istnieje, stwórz nowego
            if (!gracz) {
                gracz = new Gracz({
                    userId: message.author.id,
                    username: message.author.username
                });
            }
            
            // Sprawdź cooldown
            const now = Date.now();
            if (!gracz.lastMessageDate || (now - gracz.lastMessageDate > XP_COOLDOWN)) {
                // Dodaj XP
                gracz.xp += XP_PER_MESSAGE;
                gracz.totalMessages++;
                gracz.lastMessageDate = now;
                gracz.username = message.author.username; // aktualizuj nick
                
                // Sprawdź awans
                await sprawdzAwans(gracz);
                await gracz.save();
                
                // Opcjonalnie: reakcja potwierdzenia
                await message.react('⭐');
            }
        } catch (error) {
            console.error('Błąd systemu levelowania:', error);
        }
    }
    
    // -------------------- OBSŁUGA KANAŁU PROPOZYCJI --------------------
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
            
            // 5. Stwórz wątek do dyskusji
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
            }
            
        } catch (error) {
            console.error('Wystąpił błąd:', error);
            await message.channel.send('❌ Wystąpił błąd podczas przetwarzania propozycji.');
        }
    }
});

// Serwer HTTP dla Render
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Bot Discord działa! 🤖');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Serwer statusu nasłuchuje na porcie ${PORT}`);
});

client.login(token);