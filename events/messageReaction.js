const ReactionRole = require('../models/reactionrole');

module.exports = (client) => {
    // Obsługa dodawania reakcji
    client.on('messageReactionAdd', async (reaction, user) => {
        if (user.bot) return;

        try {
            if (reaction.partial) await reaction.fetch();

            const rr = await ReactionRole.findOne({
                messageId: reaction.message.id,
                emoji: reaction.emoji.name
            });

            if (!rr) return;

            const member = await reaction.message.guild.members.fetch(user.id);
            const role = reaction.message.guild.roles.cache.get(rr.roleId);

            if (role && member) {
                await member.roles.add(role);
                console.log(`Dodano rolę ${role.name} użytkownikowi ${user.tag}`);
            }
        } catch (error) {
            console.error('Błąd przy dodawaniu roli z reakcji:', error);
        }
    });

    // Obsługa usuwania reakcji
    client.on('messageReactionRemove', async (reaction, user) => {
        if (user.bot) return;

        try {
            if (reaction.partial) await reaction.fetch();

            const rr = await ReactionRole.findOne({
                messageId: reaction.message.id,
                emoji: reaction.emoji.name
            });

            if (!rr) return;

            const member = await reaction.message.guild.members.fetch(user.id);
            const role = reaction.message.guild.roles.cache.get(rr.roleId);

            if (role && member) {
                await member.roles.remove(role);
                console.log(`Usunięto rolę ${role.name} użytkownikowi ${user.tag}`);
            }
        } catch (error) {
            console.error('Błąd przy usuwaniu roli z reakcji:', error);
        }
    });
};