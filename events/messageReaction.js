const ReactionRole = require('../models/ReactionRole');

module.exports = (client) => {
    console.log('✅ Rejestruję eventy reakcji...');
    
    // Sprawdź czy client istnieje i jest gotowy
    console.log(`Client ready: ${client.isReady() ? 'tak' : 'nie'}`);
    console.log(`Zarejestrowane eventy: ${client.eventNames().join(', ')}`);
    
    client.on('messageReactionAdd', async (reaction, user) => {
        console.log(`\n========== REAKCJA DODANA ==========`);
        console.log(`🔍 Wykryto reakcję: ${reaction.emoji.name} od ${user.tag}`);
        console.log(`Wiadomość ID: ${reaction.message.id}`);
        console.log(`Kanał: ${reaction.message.channel?.name || 'nieznany'}`);
        console.log(`Serwer: ${reaction.message.guild?.name || 'nieznany'}`);
        
        if (user.bot) {
            console.log('🤖 To bot - ignoruję');
            return;
        }

        try {
            if (reaction.partial) {
                console.log('📦 Reakcja częściowa - pobieram pełne dane...');
                await reaction.fetch();
                console.log('✅ Pobrano pełne dane reakcji');
            }

            console.log(`🔍 Szukam w bazie: messageId=${reaction.message.id}, emoji=${reaction.emoji.name}`);
            
            const rr = await ReactionRole.findOne({
                messageId: reaction.message.id,
                emoji: reaction.emoji.name
            });

            if (!rr) {
                console.log('❌ Nie znaleziono wpisu w bazie dla tej reakcji');
                return;
            }

            console.log(`✅ Znaleziono wpis: rola ID ${rr.roleId}`);

            // Pobierz członka i rolę
            const member = await reaction.message.guild.members.fetch(user.id);
            const role = reaction.message.guild.roles.cache.get(rr.roleId);

            if (!member) {
                console.log('❌ Nie znaleziono członka na serwerze');
                return;
            }

            if (!role) {
                console.log(`❌ Nie znaleziono roli o ID ${rr.roleId} na serwerze`);
                return;
            }

            console.log(`✅ Znaleziono rolę: ${role.name}`);
            
            // Dodaj rolę
            await member.roles.add(role);
            console.log(`✅ Dodano rolę ${role.name} użytkownikowi ${user.tag}`);
            
        } catch (error) {
            console.error('❌ BŁĄD przy dodawaniu roli z reakcji:', error);
        }
    });

    client.on('messageReactionRemove', async (reaction, user) => {
        console.log(`\n========== REAKCJA USUNIĘTA ==========`);
        console.log(`🔍 Usunięto reakcję: ${reaction.emoji.name} od ${user.tag}`);
        console.log(`Wiadomość ID: ${reaction.message.id}`);
        
        if (user.bot) {
            console.log('🤖 To bot - ignoruję');
            return;
        }

        try {
            if (reaction.partial) {
                console.log('📦 Reakcja częściowa - pobieram pełne dane...');
                await reaction.fetch();
            }

            console.log(`🔍 Szukam w bazie: messageId=${reaction.message.id}, emoji=${reaction.emoji.name}`);
            
            const rr = await ReactionRole.findOne({
                messageId: reaction.message.id,
                emoji: reaction.emoji.name
            });

            if (!rr) {
                console.log('❌ Nie znaleziono wpisu w bazie dla tej reakcji');
                return;
            }

            console.log(`✅ Znaleziono wpis: rola ID ${rr.roleId}`);

            const member = await reaction.message.guild.members.fetch(user.id);
            const role = reaction.message.guild.roles.cache.get(rr.roleId);

            if (!member) {
                console.log('❌ Nie znaleziono członka na serwerze');
                return;
            }

            if (!role) {
                console.log(`❌ Nie znaleziono roli o ID ${rr.roleId} na serwerze`);
                return;
            }

            console.log(`✅ Znaleziono rolę: ${role.name}`);
            
            // Usuń rolę
            await member.roles.remove(role);
            console.log(`✅ Usunięto rolę ${role.name} użytkownikowi ${user.tag}`);
            
        } catch (error) {
            console.error('❌ BŁĄD przy usuwaniu roli z reakcji:', error);
        }
    });

    console.log('✅ Eventy reakcji zarejestrowane pomyślnie');
};