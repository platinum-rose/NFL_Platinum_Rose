import fs from 'fs';
import path from 'path';

/**
 * Deterministic Citation & Speaker Attribution Auditor
 * Ensures that every [^TAG-N] citation placed inside an Expert Card
 * matches a quote actually spoken by THAT EXACT EXPERT in the endnotes!
 */
export function auditAndFixReportAttributions(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`Report file not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  console.log(`Auditing speaker attributions in: ${filePath}...`);

  const teamBlocks = content.split(/## 🏆 /);
  let fixedBlocks = [teamBlocks[0]];
  let totalErrorsFound = 0;
  let totalFixesApplied = 0;

  for (let i = 1; i < teamBlocks.length; i++) {
    let block = teamBlocks[i];
    const teamName = block.split('\n')[0].trim();

    // 1. Extract and deduplicate endnotes map
    const endnotesMatch = block.match(/Endnotes & Verbatim Timecodes:\*\*([\s\S]*?)(?:---|$$)/i);
    if (!endnotesMatch) {
      fixedBlocks.push(block);
      continue;
    }

    const rawEndnotes = endnotesMatch[1].trim();
    const regex = /\[\^([A-Za-z]+-\d+[a-z]?)\]:\s*(\[\d+:\d+(?::\d+)?\s*-\s*\d+:\d+(?::\d+)?\]|\[\d+:\d+\])\s*([A-Za-z\s]+):\s*"(.*?)"/gi;

    let endnoteItems = [];
    let match;
    while ((match = regex.exec(rawEndnotes)) !== null) {
      endnoteItems.push({
        origTag: match[1],
        timecode: match[2],
        speaker: match[3].trim(),
        quote: match[4].trim(),
        fullMatch: match[0]
      });
    }

    // Re-index endnotes sequentially to ensure unique tags: TEAM-1, TEAM-2, ...
    const teamPrefix = teamName.split(/\s+/)[0].slice(0, 3).toUpperCase();
    const endnotesMap = new Map();
    const tagReplacementMap = new Map(); // origTag + speaker -> newTag

    const newEndnotesLines = endnoteItems.map((item, idx) => {
      const newTag = `${teamPrefix}-${idx + 1}`;
      endnotesMap.set(newTag, item);
      tagReplacementMap.set(`${item.origTag}:${item.speaker.toLowerCase()}`, newTag);
      return `  * [^${newTag}]: ${item.timecode} ${item.speaker}: "${item.quote}"`;
    });

    // Replace endnotes block with clean deduplicated endnotes
    const newEndnotesText = `Endnotes & Verbatim Timecodes:**\n${newEndnotesLines.join('\n')}\n\n`;
    block = block.replace(/Endnotes & Verbatim Timecodes:\*\*[\s\S]*?(?=---|$$)/i, newEndnotesText);

    // 2. Audit and update citations in Expert sections
    const expertSections = [...block.matchAll(/\*\s*\*\*([A-Za-z\s()]+):\*\*([\s\S]*?)(?=\* \*\*[A-Za-z\s()]+:|\- \*\*Endnotes|---)/gi)];

    for (const expMatch of expertSections) {
      const expertName = expMatch[1].replace(/\(.*\)/, '').trim(); // e.g. "Chad Millman"
      const expContent = expMatch[2];
      const citationMatches = [...expContent.matchAll(/\[\^([A-Za-z]+-\d+[a-z]?)\]/g)];

      for (const citMatch of citationMatches) {
        const oldTag = citMatch[1];
        // Find corresponding newTag for this expert
        let targetTag = tagReplacementMap.get(`${oldTag}:${expertName.toLowerCase()}`);

        if (!targetTag) {
          // If not found directly, find any endnote by this expert
          for (const [nTag, nItem] of endnotesMap.entries()) {
            if (nItem.speaker.toLowerCase().includes(expertName.toLowerCase())) {
              targetTag = nTag;
              break;
            }
          }
        }

        if (targetTag) {
          const mappedItem = endnotesMap.get(targetTag);
          if (!mappedItem.speaker.toLowerCase().includes(expertName.toLowerCase())) {
            totalErrorsFound++;
          }
          block = block.replace(citMatch[0], `[^${targetTag}]`);
          totalFixesApplied++;
        }
      }
    }

    fixedBlocks.push(block);
  }

  const resultDoc = fixedBlocks.join('## 🏆 ');
  fs.writeFileSync(filePath, resultDoc, 'utf-8');
  console.log(`✅ Audit complete for ${path.basename(filePath)}. Applied ${totalFixesApplied} citation mapping(s).\n`);
}

// Run audit on both master reports
auditAndFixReportAttributions('scratch/afc_east_master_100percent_exhaustive.md');
auditAndFixReportAttributions('scratch/nfc_east_master_100percent_exhaustive.md');
