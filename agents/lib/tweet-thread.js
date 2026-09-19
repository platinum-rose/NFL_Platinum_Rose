// Pure helpers for reading X web-client GraphQL tweet results.
//
// Regression 2026-09-19: the bookmarks agent stored only legacy.full_text of the
// bookmarked tweet. Long posts (note_tweet) were cut at ~280 chars, and thread
// starters ("NFL ATS picks for EVERY Week 2 Game ⤵️") were ingested without the
// replies that carry the actual picks. ~14 of the last 45 vault reports hit this.

function unwrap(result) {
  if (!result) return null;
  if (result.__typename === 'TweetWithVisibilityResults' || (result.tweet && !result.legacy)) return result.tweet;
  return result;
}

export function tweetTextFromResult(result) {
  const r = unwrap(result);
  if (!r) return '';
  const note = r.note_tweet?.note_tweet_results?.result?.text;
  return note || r.legacy?.full_text || r.legacy?.text || '';
}

export function mediaUrlsFromResult(result) {
  const legacy = unwrap(result)?.legacy;
  const media = legacy?.extended_entities?.media || legacy?.entities?.media || [];
  return media.map((m) => m.media_url_https).filter(Boolean);
}

function authorIdOf(r) {
  return r?.legacy?.user_id_str || r?.core?.user_results?.result?.rest_id || null;
}

// Every tweet result in a TweetDetail response, in timeline order. Handles both
// single-tweet entries and conversation modules (entry.content.items[]).
export function flattenTweetDetail(json) {
  const instructions =
    json?.data?.threaded_conversation_with_injections_v2?.instructions ||
    json?.data?.tweetResult?.result?.timeline?.instructions || [];
  const out = [];
  const push = (res) => { const r = unwrap(res); if (r?.legacy?.id_str) out.push(r); };
  for (const inst of instructions) {
    const entries = inst.entries || (inst.entry ? [inst.entry] : []);
    for (const entry of entries) {
      push(entry?.content?.itemContent?.tweet_results?.result);
      for (const item of entry?.content?.items || []) push(item?.item?.itemContent?.tweet_results?.result);
    }
  }
  return out;
}

// The root tweet plus the author's own reply chain under it (the "thread").
// Replies from other accounts, and author replies to other people, are ignored.
export function extractAuthorThread(json, rootId, { maxTweets = 25 } = {}) {
  const tweets = flattenTweetDetail(json);
  const byId = new Map(tweets.map((t) => [t.legacy.id_str, t]));
  const root = byId.get(String(rootId));
  if (!root) return [];
  const authorId = authorIdOf(root);
  const chain = [root];
  const used = new Set([root.legacy.id_str]);
  while (chain.length < maxTweets) {
    const last = chain[chain.length - 1].legacy.id_str;
    const next = tweets.find((t) =>
      !used.has(t.legacy.id_str) &&
      t.legacy.in_reply_to_status_id_str === last &&
      authorIdOf(t) === authorId);
    if (!next) break;
    chain.push(next);
    used.add(next.legacy.id_str);
  }
  return chain.map((t) => ({
    id: t.legacy.id_str,
    text: tweetTextFromResult(t),
    media_urls: mediaUrlsFromResult(t),
  }));
}

export function mergeThread(thread) {
  if (!Array.isArray(thread) || thread.length === 0) return { text: '', media_urls: [] };
  if (thread.length === 1) return { text: thread[0].text, media_urls: thread[0].media_urls };
  const text = thread.map((t, i) => `[${i + 1}/${thread.length}] ${t.text.trim()}`).join('\n\n');
  const media_urls = [...new Set(thread.flatMap((t) => t.media_urls))];
  return { text, media_urls };
}
