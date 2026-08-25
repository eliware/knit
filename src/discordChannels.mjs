const GUILD_ANNOUNCEMENT = 5;

export function channelName(repository) {
  if (!/^[^/]+\/[^/]+$/.test(repository || '')) throw new Error('Repository is required to resolve a Discord channel');
  return repository.split('/').at(-1).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100) || 'repository';
}

function channelTopic(packageJson = {}) {
  const description = typeof packageJson.description === 'string' ? packageJson.description.trim() : '';
  const keywords = Array.isArray(packageJson.keywords) ? packageJson.keywords.filter(keyword => typeof keyword === 'string') : [];
  return [description, keywords.length ? `Keywords: ${keywords.join(', ')}` : ''].filter(Boolean).join('\n').slice(0, 1024);
}

export function createChannelResolver({ client, guildId, log = console } = {}) {
  if (!client || !guildId) throw new Error('Discord client and guild ID are required');
  const cache = new Map();
  return async function resolveChannel({ repository, privateRepository = false, packageJson } = {}) {
    const name = channelName(repository);
    let channel = cache.get(repository);
    const guild = await client.guilds.fetch(guildId);
    if (!channel) {
      const channels = await guild.channels.fetch();
      channel = channels.find(candidate => candidate?.name === name && candidate?.type === GUILD_ANNOUNCEMENT);
    if (!channel) {
        const options = {
          name,
          type: GUILD_ANNOUNCEMENT,
          permissionOverwrites: [{
            id: guild.roles.everyone.id,
            allow: privateRepository ? [] : ['ViewChannel'],
            deny: ['SendMessages', 'SendMessagesInThreads', 'CreatePublicThreads', 'CreatePrivateThreads', ...(privateRepository ? ['ViewChannel'] : [])]
          }]
        };
        channel = await guild.channels.create(options);
        log.info?.('[Discord] Created repository channel', { repository, private: privateRepository });
      }
    }
    if (channel.permissionOverwrites?.edit && guild.roles?.everyone?.id) {
      await channel.permissionOverwrites.edit(guild.roles.everyone.id, {
        ViewChannel: !privateRepository,
        SendMessages: false,
        SendMessagesInThreads: false,
        CreatePublicThreads: false,
        CreatePrivateThreads: false
      });
    }
    const topic = channelTopic(packageJson);
    if (topic && typeof channel.edit === 'function' && channel.topic !== topic) await channel.edit({ topic });
    cache.set(repository, channel);
    return channel.id;
  };
}
