import { log as logger } from '@eliware/common';
let sharedDiscordClient;

// Discord embed limits from the Discord API. Keep these local because the
// application client package does not expose webhook validation constants.
export const DISCORD_EMBED_DESCRIPTION_LIMIT = 4096;
export const DISCORD_EMBED_TOTAL_LIMIT = 6000;
export const DISCORD_EMBED_FIELD_VALUE_LIMIT = 1024;

export function setDiscordClient(client) {
  sharedDiscordClient = client;
}

export function clearDiscordClient(client) {
  if (!client || sharedDiscordClient === client) sharedDiscordClient = undefined;
}

// Discord limits: https://discord.com/developers/docs/resources/message#embed-limits

/** Keep the most useful part of oversized output: the tail contains the final error. */
export function tail(value, limit, marker = '\n... [truncated; showing log tail] ...\n') {
  const text = String(value ?? '');
  if (text.length <= limit) return text;
  if (limit <= marker.length) return text.slice(-limit);
  return marker + text.slice(-(limit - marker.length));
}

function textLength(value) {
  return typeof value === 'string' ? value.length : 0;
}

/** Enforce Discord's embed limits without dropping the end of deployment logs. */
export function limitEmbed(embed) {
  if (embed.description) embed.description = tail(embed.description, DISCORD_EMBED_DESCRIPTION_LIMIT);
  if (Array.isArray(embed.fields)) {
    embed.fields = embed.fields.slice(0, 25).map(field => ({
      ...field,
      name: tail(field.name || '', 256),
      value: tail(field.value || '', DISCORD_EMBED_FIELD_VALUE_LIMIT)
    }));
  }
  const textSize = () => textLength(embed.title) + textLength(embed.description) + textLength(embed.footer?.text) + textLength(embed.author?.name) + (embed.fields || []).reduce((n, f) => n + textLength(f.name) + textLength(f.value), 0);
  if (textSize() > DISCORD_EMBED_TOTAL_LIMIT && embed.description) {
    const other = textSize() - textLength(embed.description);
    embed.description = tail(embed.description, Math.max(0, DISCORD_EMBED_TOTAL_LIMIT - other));
  }
  return embed;
}

/**
 * Sends a notification to a Discord channel.
 * @param {Object} params
 * @param {string} params.channelId - The Discord channel snowflake.
 * @param {Object} params.post - The webhook payload.
 * @param {string} params.log - The log output.
 * @param {boolean} params.hasError - Whether an error occurred.
 * @param {string} [params.event] - GitHub event name.
 * @param {Object} [params.embed] - Optional pre-built embed.
 * @param {Object} [params.discordClient] - Optional Discord client for testing/injection.
 */
export async function send({ channelId, post, event = 'push', embed: providedEmbed, logOutput, hasError, log = logger, discordClient = sharedDiscordClient }) {
  if (!channelId) return;
  if (!discordClient) throw new Error('Discord client is not connected');
  const embed = providedEmbed
    ? { ...providedEmbed, fields: providedEmbed.fields?.map(field => ({ ...field })) }
    : await createEmbed({ post, event, logOutput, hasError });
  if (hasError) {
    embed.color = 0xFF0000;
    embed.title = `\u274c Error: ${embed.title}`;
  } else {
    embed.title = `\u2705 ${embed.title}`;
  }
  limitEmbed(embed);
  log.info('[Notifier] Sending message to Discord channel', { channelId });
  try {
    const channel = await discordClient.channels.fetch(channelId);
    if (!channel || typeof channel.send !== 'function') throw new Error(`Discord channel is not sendable: ${channelId}`);
    await channel.send({ embeds: [embed] });
  } catch (error) {
    log.error?.('[Notifier] Discord channel send failed', { error, event, channelId, repository: post.repository?.full_name });
    throw error;
  }
}

/**
 * Creates a Discord embed object for a webhook event.
 * @param {Object} params
 * @param {Object} params.post - The webhook payload.
 * @param {string} [params.logOutput] - The log output.
 * @param {boolean} [params.hasError] - Whether an error occurred.
 * @param {string} [params.event] - GitHub event name.
 * @returns {Object} The embed object.
 */
export async function createEmbed({ post = {}, event, logOutput, hasError }) {
  const embed = {};
  if (post.ref && post.ref.startsWith('refs/tags/')) {
    const repoName = post.repository?.full_name || 'Unknown Repository';
    const repoUrl = post.repository?.html_url || '';
    const tag = post.ref.replace('refs/tags/', '');
    const repoShortName = repoName.split('/').pop();
    const tagUrl = repoName && tag ? `https://github.com/${repoName}/releases/tag/${encodeURIComponent(tag)}` : repoUrl;
    embed.title = `${repoShortName} ${tag} has been released! \ud83c\udf89`;
    embed.url = tagUrl;
    embed.color = 0xFFD700;
    embed.timestamp = new Date().toISOString();
    embed.thumbnail = { url: 'https://eliware.org/logos/eliware_64.png' };
    let authorName = post.pusher?.name || 'unknown';
    let authorIcon = undefined;
    let authorUrl = undefined;
    if (post.sender && post.sender.avatar_url) {
      authorIcon = post.sender.avatar_url;
    } else if (post.repository && post.repository.owner && post.repository.owner.avatar_url) {
      authorIcon = post.repository.owner.avatar_url;
    }
    if (post.pusher && post.pusher.name) {
      authorUrl = `https://github.com/${post.pusher.name}`;
    }
    embed.author = { name: authorName };
    if (authorIcon) embed.author.icon_url = authorIcon;
    if (authorUrl) embed.author.url = authorUrl;
    embed.footer = { text: 'GitHub Tag Push Event' };
    return embed;
  }
  if (post.commits) {
    const repoName = post.repository?.full_name || 'Unknown Repository';
    const repoUrl = post.repository?.html_url || '';
    const branch = post.ref ? post.ref.replace(/^refs\/heads\//, '') : 'unknown';
    const pusher = post.pusher?.name || 'unknown';
    embed.title = `New Commits Pushed to ${repoName}`;
    embed.url = repoUrl;
    embed.color = 0x00FF00;
    embed.timestamp = post.head_commit?.timestamp || new Date().toISOString();
    embed.thumbnail = { url: 'https://knit.eliware.org/assets/knit.png' };
    let addedFiles = new Set();
    let removedFiles = new Set();
    let modifiedFiles = new Set();
    if (Array.isArray(post.commits)) {
      for (const commit of post.commits) {
        if (Array.isArray(commit.added)) {
          commit.added.forEach(f => addedFiles.add(f));
        }
        if (Array.isArray(commit.removed)) {
          commit.removed.forEach(f => removedFiles.add(f));
        }
        if (Array.isArray(commit.modified)) {
          commit.modified.forEach(f => modifiedFiles.add(f));
        }
      }
    }
    if (post.head_commit) {
      if (Array.isArray(post.head_commit.added)) {
        post.head_commit.added.forEach(f => addedFiles.add(f));
      }
      if (Array.isArray(post.head_commit.removed)) {
        post.head_commit.removed.forEach(f => removedFiles.add(f));
      }
      if (Array.isArray(post.head_commit.modified)) {
        post.head_commit.modified.forEach(f => modifiedFiles.add(f));
      }
    }
    modifiedFiles.forEach(f => {
      addedFiles.delete(f);
      removedFiles.delete(f);
    });
    let description = `Branch: **${branch}** - Commits: **${post.commits.length}**\n`;
    for (const commit of post.commits) {
      const message = commit.message || '';
      const url = commit.url || '';
      const shortId = commit.id?.substring(0, 7) || '';
      description += `**${shortId}**: [${message}](${url})\n`;
    }
    // Truncate before appending log output
    if (description.length > 1800) {
      description = description.slice(0, 1797) + '...';
    }
    if (hasError && logOutput) {
      const available = Math.max(0, DISCORD_EMBED_DESCRIPTION_LIMIT - description.length - 10);
      description += '```text\n' + tail(logOutput, available) + '\n```';
    }
    embed.description = description.trim();
    let authorName = pusher;
    let authorIcon = undefined;
    let authorUrl = undefined;
    if (post.sender && post.sender.avatar_url) {
      authorIcon = post.sender.avatar_url;
    } else if (post.repository && post.repository.owner && post.repository.owner.avatar_url) {
      authorIcon = post.repository.owner.avatar_url;
    }
    if (post.pusher && post.pusher.name) {
      authorUrl = `https://github.com/${post.pusher.name}`;
    }
    embed.author = { name: authorName };
    if (authorIcon) embed.author.icon_url = authorIcon;
    if (authorUrl) embed.author.url = authorUrl;
    embed.fields = [];
    if (addedFiles.size > 0) {
      embed.fields.push({
        name: `New (${addedFiles.size})`,
        value: Array.from(addedFiles).join('\n'),
        inline: false
      });
    }
    if (removedFiles.size > 0) {
      embed.fields.push({
        name: `Deleted (${removedFiles.size})`,
        value: Array.from(removedFiles).join('\n'),
        inline: false
      });
    }
    if (modifiedFiles.size > 0) {
      embed.fields.push({
        name: `Modified (${modifiedFiles.size})`,
        value: Array.from(modifiedFiles).join('\n'),
        inline: false
      });
    }
    embed.footer = { text: 'GitHub Push Event' };
  } else {
    const repoName = post.repository?.full_name || 'Unknown Repository';
    const action = post.action || 'Event';
    embed.title = event && event !== 'push'
      ? `${repoName} - ${event}${post.action ? `: ${action}` : ''}`
      : `${repoName} - ${action}`;
    embed.color = 0x3498db;
    embed.description = event
      ? `GitHub event **${event}** received. See details on GitHub for more information.`
      : 'See details on GitHub for more information.';
    embed.thumbnail = { url: 'https://knit.eliware.org/assets/knit.png' };
    if (hasError && logOutput) {
      embed.description += '```text\n' + logOutput + '\n```';
    }
    embed.footer = { text: 'GitHub Event' };
  }
  return limitEmbed(embed);
}
