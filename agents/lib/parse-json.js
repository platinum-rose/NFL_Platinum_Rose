// agents/lib/parse-json.js
//
// Shared tolerant JSON extraction, moved out of agents/portfolio-synthesize.js
// (rev 17-19 design review) so it can be reused identically by Stage 1 (in the
// CLI) and by the new committee module (agents/lib/committee.js) without a
// circular import back into the CLI's own unguarded top-level IIFE.
//
// Strips code fences / surrounding prose and handles both object ({...}) and
// array ([...]) top-level shapes, since Stage 2/3 return
// { "verdicts": [...] } / { "finalized": [...], "passes": [...] } objects,
// while some callers may hand it a bare array. Pure function, no I/O, no
// CLI-arg or env reads (same convention as agents/lib/board-validate.js).

export function parseJSON(text) {
  let t = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const firstObj = t.indexOf('{'), lastObj = t.lastIndexOf('}');
  const firstArr = t.indexOf('['), lastArr = t.lastIndexOf(']');
  const useObj = firstObj >= 0 && (firstArr < 0 || firstObj <= firstArr);
  if (useObj && lastObj > firstObj) t = t.slice(firstObj, lastObj + 1);
  else if (firstArr >= 0 && lastArr > firstArr) t = t.slice(firstArr, lastArr + 1);
  return JSON.parse(t);
}
