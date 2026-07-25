#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {
  DEFAULT_CLIENT_PATH,
  DEFAULT_TOKEN_PATH,
  getAccessToken,
  writeJson,
  youtubeGet
} from './lib/youtube-oauth.js';

function argValue(name, fallback = null) {
  const idx = process.argv.indexOf(name);
  return idx === -1 ? fallback : process.argv[idx + 1];
}

const clientPath = argValue('--client', DEFAULT_CLIENT_PATH);
const tokenPath = argValue('--token', DEFAULT_TOKEN_PATH);
const outPath = argValue('--out', path.join(process.cwd(), 'data', 'podcasts', 'youtube-account-discovery.json'));
const maxPages = Number(argValue('--max-pages', 10));

async function listPages(pathname, params, { optional = false } = {}) {
  const accessToken = await getAccessToken({ clientPath, tokenPath });
  const items = [];
  let pageToken = '';

  for (let page = 0; page < maxPages; page += 1) {
    let json;
    try {
      json = await youtubeGet(pathname, { ...params, pageToken }, accessToken);
    } catch (err) {
      if (optional && /channelNotFound|Channel not found/i.test(err.message)) {
        console.warn(`Warning: ${pathname} could not be listed because this Google account has no YouTube channel/profile yet.`);
        return items;
      }
      throw err;
    }
    items.push(...(json.items || []));
    pageToken = json.nextPageToken || '';
    if (!pageToken) break;
  }

  return items;
}

function toChannelFeed(channelId) {
  return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
}

const subscriptions = await listPages('subscriptions', {
  part: 'snippet,contentDetails',
  mine: 'true',
  maxResults: 50
}, { optional: true });

const playlists = await listPages('playlists', {
  part: 'snippet,contentDetails,status',
  mine: 'true',
  maxResults: 50
}, { optional: true });

const account = {
  discovered_at: new Date().toISOString(),
  mode: 'youtube_readonly_oauth',
  subscriptions: subscriptions.map(item => {
    const channelId = item.snippet?.resourceId?.channelId;
    return {
      subscription_id: item.id,
      title: item.snippet?.title || '',
      channel_id: channelId || '',
      channel_url: channelId ? `https://www.youtube.com/channel/${channelId}` : '',
      feed_url: channelId ? toChannelFeed(channelId) : '',
      activity_type: item.contentDetails?.activityType || ''
    };
  }),
  playlists: playlists.map(item => ({
    playlist_id: item.id,
    title: item.snippet?.title || '',
    privacy_status: item.status?.privacyStatus || '',
    item_count: item.contentDetails?.itemCount ?? null,
    playlist_url: `https://www.youtube.com/playlist?list=${item.id}`
  }))
};

writeJson(outPath, account);

const sourceConfigPath = path.join(process.cwd(), 'config', 'youtube-podcast-sources.local.json');
const previousConfig = fs.existsSync(sourceConfigPath)
  ? JSON.parse(fs.readFileSync(sourceConfigPath, 'utf8'))
  : {};
writeJson(sourceConfigPath, {
  generated_at: account.discovered_at,
  source: 'youtube_account_discovery',
  include_channel_ids: previousConfig.include_channel_ids || [],
  include_playlist_ids: previousConfig.include_playlist_ids || [],
  candidate_channels: account.subscriptions,
  candidate_playlists: account.playlists
});

console.log(`Discovered ${account.subscriptions.length} subscriptions and ${account.playlists.length} playlists.`);
console.log(`Saved account inventory: ${outPath}`);
console.log(`Saved editable source config: ${sourceConfigPath}`);
