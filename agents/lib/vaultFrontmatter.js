const FRONTMATTER_RE = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/;

function yamlString(value) {
  return JSON.stringify(String(value ?? ''));
}

function hasFrontmatter(markdown) {
  return FRONTMATTER_RE.test(String(markdown ?? ''));
}

export function ensureVaultFrontmatter(markdown, {
  title = null,
  sourceSystem = 'nfl-dashboard',
  sourceType = 'generated-note',
  sensitivity = 'green',
  tags = [],
} = {}) {
  const body = String(markdown ?? '');
  if (hasFrontmatter(body)) return body;

  const now = new Date().toISOString();
  const tagList = Array.isArray(tags) ? tags.map(String) : [];
  const lines = [
    '---',
    `sensitivity: ${sensitivity}`,
    'owner_project: nfl-dashboard',
    `source_system: ${sourceSystem}`,
    `source_type: ${sourceType}`,
    'canonical_status: generated',
    `title: ${yamlString(title || 'NFL generated note')}`,
    `created: ${now}`,
    `modified: ${now}`,
    `tags: [${tagList.map(yamlString).join(', ')}]`,
    '---',
    '',
  ];
  return `${lines.join('\n')}${body}`;
}
