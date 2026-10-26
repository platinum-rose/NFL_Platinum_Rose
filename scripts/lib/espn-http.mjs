/** Shared ESPN JSON request used by settlement and tracker builders. */
export const ESPN_API_BASE = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';

export async function fetchEspnJson(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'NFL-Dashboard-Reconciler/2.0' },
  });
  if (!response.ok) throw new Error(`ESPN request failed (${response.status}): ${url}`);
  return response.json();
}
