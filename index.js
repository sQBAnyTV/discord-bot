const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const fs = require('fs');
const licznikPath = './licznik.json';
const KANAL_LICZENIA = process.env.KANAL_LICZENIA;
const ROLA_MUTE_LICZENIE = process.env.ROLA_MUTE_LICZENIE;

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ] 
});

const token = process.env.TOKEN;
const KANAL_PROPONOWANIA = process.env.KANAL_ID;

// Funkcja do wczytania licznika
function wczytajLicznik() {
    try {
        const data = fs.readFileSync(licznikPath);
        return JSON.parse(data);
    } catch {
        return { 
            ostatnia_liczba: 0, 
            ostatni_uzytkownik: "", 
            rekord: 0,
            czyWyslanoRekord: false 
        };
    }
}

// Funkcja do zapisania licznika
function zapiszLicznik(liczba, uzytkownik, rekord, czyWyslanoRekord) {
    const data = { 
        ostatnia_liczba: liczba, 
        ostatni_uzytkownik: uzytkownik,
        rekord: rekord,
        czyWyslanoRekord: czyWyslanoRekord
    };
    fs.writeFileSync(licznikPath, JSON.stringify(data));
}

client.once('ready', () => {
    console.log(`✅ Bot ${client.user.tag} jest online!`);
    console.log(`Nasłuchuję na kanale o ID: ${KANAL_PROPONOWANIA}`);
    console.log(`Nasłuchuję na kanale liczenia o ID: ${KANAL_LICZENIA}`);
});

// Nasłuchiwanie na komendy slash
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === 'ping') {
        await interaction.reply('Pong! 🏓');
    }
    
    if (interaction.commandName === 'rekord') {
        const licznik = wczytajLicznik();
        const rekord = licznik.rekord || 0;
        
        await interaction.reply(`🏆 Aktualny rekord liczenia to: **${rekord}**! 👑`);
    }
});

// Nasłuchiwanie na wiadomości
client.on('messageCreate', async message => {
    if (message.author.bot) return;
    
    // -------------------- OBSŁUGA KANAŁU PROPOZYCJI --------------------
    if (message.channel.id === KANAL_PROPONOWANIA) {
        try {
            await message.delete();
            
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
            
            const sentMessage = await message.channel.send({ embeds: [embed] });
            
            await sentMessage.react('✅');
            await sentMessage.react('❌');
            
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
    
    // -------------------- OBSŁUGA KANAŁU LICZENIA --------------------
    if (message.channel.id === KANAL_LICZENIA) {
        // Ignoruj bota
        if (message.author.bot) return;
        
        const licznik = wczytajLicznik();
        const numer = parseInt(message.content);
        
        // Sprawdź czy to na pewno liczba
        if (isNaN(numer)) {
            await message.delete();
            return;
        }
        
        // Sprawdź czy nie ten sam użytkownik co poprzednio
        if (message.author.id === licznik.ostatni_uzytkownik) {
            await message.delete();
            const warning = await message.channel.send(`❌ ${message.author} nie możesz pisać dwa razy pod rząd! ⚠️`);
            setTimeout(() => warning.delete(), 5000);
            return;
        }
        
        // Sprawdź czy liczba jest poprawna (kolejna)
        const oczekiwanaLiczba = licznik.ostatnia_liczba + 1;
        
        if (numer === oczekiwanaLiczba) {
            // Dobra liczba
            
            let nowyRekord = licznik.rekord;
            let czyWyslano = licznik.czyWyslanoRekord || false;
            
            // Sprawdź czy to nowy rekord ogólny
            if (numer > licznik.rekord) {
                nowyRekord = numer;
                
                // Wyślij komunikat TYLKO jeśli jeszcze nie wysłano w tej turze
                if (!czyWyslano) {
                    await message.channel.send(`🎉 **NOWY REKORD!** ${numer} 🎉 👑`);
                    czyWyslano = true;
                }
            }
            
            zapiszLicznik(numer, message.author.id, nowyRekord, czyWyslano);
            
            // Dodaj reakcję potwierdzenia
            await message.react('✅');
        } else {
            // BŁĄD! Ktoś się pomylił
            try {
                // 1. Wyczyść kanał (usuń ostatnie 100 wiadomości)
                let fetched;
                do {
                    fetched = await message.channel.messages.fetch({ limit: 100 });
                    await message.channel.bulkDelete(fetched);
                } while (fetched.size >= 2);
                
                // 2. Nadaj rolę blokującą na 1h
                const muteRole = message.guild.roles.cache.get(ROLA_MUTE_LICZENIE);
                if (muteRole) {
                    const member = message.member;
                    await member.roles.add(muteRole);
                    
                    // Usuń rolę po 1h
                    setTimeout(async () => {
                        try {
                            await member.roles.remove(muteRole);
                            console.log(`Usunięto rolę mute liczenie dla ${member.user.tag}`);
                        } catch (e) {
                            console.error('Nie udało się usunąć roli:', e);
                        }
                    }, 60 * 60 * 1000); // 1 godzina
                }
                
                // 3. Wyślij wiadomość o błędzie z rekordem
                await message.channel.send(`❌ **${message.author.username}** nie potrafi liczyć! 😵\n🔄 Zaczynamy od nowa! 🔄\n🏆 Aktualny rekord to: **${licznik.rekord}** 👑`);
                
                // 4. Zresetuj licznik (zachowując rekord, resetując flagę wysłania)
                zapiszLicznik(0, "", licznik.rekord, false);
                
            } catch (error) {
                console.error('Błąd podczas czyszczenia kanału:', error);
                await message.channel.send('❌ Wystąpił błąd. Spróbuj ręcznie wyczyścić kanał.');
            }
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