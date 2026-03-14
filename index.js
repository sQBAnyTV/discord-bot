const { Client, GatewayIntentBits } = require('discord.js');
const mongoose = require('mongoose');
const express = require('express');

// Wczytaj modele
require('./models/gracz');
require('./models/warn');
require('./models/reactionrole');

// Wczytaj funkcje pomocnicze
const { wymaganeXp, parseTime } = require('./utils/xpUtils');
const { sprawdzAwans } = require('./utils/levelUtils');
const { 
    XP_PER_MESSAGE,
    VOICE_XP_PER_MINUTE,
    VOICE_CHECK_INTERVAL,
    REQUIRED_USERS_IN_CHANNEL,
    KANAL_XP 
} = require('./utils/constants');

// Wczytaj eventy
const readyEvent = require('./events/ready');
const messageReactionEvent = require('./events/messageReaction');
const voiceStateUpdateEvent = require('./events/voiceStateUpdate');
const messageCreateEvent = require('./events/messageCreate');
const interactionCreateEvent = require('./events/interactionCreate');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMembers
    ] 
});

const token = process.env.TOKEN;
const KANAL_PROPONOWANIA = process.env.KANAL_ID;
const KANAL_LOGOW = process.env.KANAL_LOGOW;
const KANAL_LEVEL = process.env.KANAL_LEVEL;
const MONGODB_URI = process.env.MONGODB_URI;
const KANAL_KOMEND = process.env.KANAL_KOMEND;

// ID ról (ZMIEŃ NA SWOJE!)
const ROLA_HELPER = 'WPISZ_TUTAJ_ID_ROLI_HELPER';
const ROLA_MODERATOR = 'WPISZ_TUTAJ_ID_ROLI_MODERATOR';

// Mapy do śledzenia voice
const voiceTimers = new Map();
const voiceJoinTime = new Map();

// Połączenie z MongoDB
mongoose.connect(MONGODB_URI)
    .then(() => {
        console.log('✅ Połączono z MongoDB Atlas!');
    })
    .catch(err => {
        console.error('❌ Błąd połączenia z MongoDB:', err);
    });

// Rejestracja eventów
readyEvent(client, KANAL_PROPONOWANIA, KANAL_LOGOW, KANAL_LEVEL);
messageReactionEvent(client);
voiceStateUpdateEvent(client, voiceTimers, voiceJoinTime, KANAL_LEVEL);
messageCreateEvent(client, KANAL_PROPONOWANIA, KANAL_XP, KANAL_LEVEL);
interactionCreateEvent(client, KANAL_KOMEND, ROLA_HELPER, ROLA_MODERATOR, KANAL_LOGOW);

// Serwer HTTP dla Render
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Bot Discord działa! 🤖');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Serwer statusu nasłuchuje na porcie ${PORT}`);
});

// Wyczyść timery przy wyłączeniu
process.on('SIGINT', () => {
    console.log('Zatrzymywanie bota, czyszczenie timerów voice...');
    for (const [userId, timer] of voiceTimers) {
        clearInterval(timer);
    }
    voiceTimers.clear();
    voiceJoinTime.clear();
    process.exit(0);
});

client.login(token);