module.exports = (client, KANAL_PROPONOWANIA, KANAL_LOGOW, KANAL_LEVEL) => {
    client.once('ready', () => {
        console.log(`✅ Bot ${client.user.tag} jest online!`);
        console.log(`Nasłuchuję na kanale o ID: ${KANAL_PROPONOWANIA}`);
        console.log(`Kanał logów (warny): ${KANAL_LOGOW}`);
        console.log(`Kanał level (awanse): ${KANAL_LEVEL}`);
        console.log(`Kanał XP: 1473083672881139773`);
    });
};