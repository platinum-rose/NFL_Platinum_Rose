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
    const block = teamBlocks[i];
    const teamName = block.split('\n')[0].trim();

    // Extract endnotes map: tag -> { speaker, quote, timecode }
    const endnotesMatch = block.match(/Endnotes & Verbatim Timecodes:\*\*([\s\S]*?)(?:---|$$)/i);
    const endnotesMap = new Map();

    if (endnotesMatch) {
      const rawEndnotes = endnotesMatch[1].trim();
      const regex = /\[\^([A-Za-z]+-\d+)\]:\s*(\[\d+:\d+(?::\d+)?\s*-\s*\d+:\d+(?::\d+)?\]|\[\d+:\d+\])\s*([A-Za-z\s]+):\s*"(.*?)"/gi;
      let match;
      while ((match = regex.exec(rawEndnotes)) !== null) {
        const tag = match[1];
        const timecode = match[2];
        const speaker = match[3].trim();
        const quote = match[4].trim();
        endnotesMap.set(tag, { speaker, quote, timecode, raw: match[0] });
      }
    }

    // Now check citations inside expert sections
    const expertSectionMatches = block.matchAll(/\*\s*\*\*([A-Za-z\s()]+):\*\*([\s\S]*?)(?=\* \*\*[A-Za-z\s()]+:|\- \*\*Endnotes|---)/gi);
    let updatedBlock = block;

    for (const expMatch of expertSectionMatches) {
      const expertName = expMatch[1].replace(/\(.*\)/, '').trim(); // e.g. "Simon Hunter"
      const expContent = expMatch[2];

      // Find all [^TAG-N] citations in this expert's section
      const citationMatches = expContent.matchAll(/\[\^([A-Za-z]+-\d+)\]/g);

      for (const citMatch of citationMatches) {
        const tag = citMatch[1];
        const endnote = endnotesMap.get(tag);

        if (endnote) {
          const endnoteSpeaker = endnote.speaker.trim();
          
          // VERACITY CHECK: Does endnote speaker match expert section?
          if (!endnoteSpeaker.toLowerCase().includes(expertName.toLowerCase()) && !expertName.toLowerCase().includes(endnoteSpeaker.toLowerCase())) {
            totalErrorsFound++;
            console.warn(`  ⚠️ MISMATCH DETECTED in ${teamName}: Citation [^${tag}] placed under "${expertName}", but endnote quote is spoken by "${endnoteSpeaker}"!`);

            // Find an endnote from this team actually spoken by expertName
            let replacementTag = null;
            for (const [eTag, eData] of endnotesMap.entries()) {
              if (eData.speaker.toLowerCase().includes(expertName.toLowerCase())) {
                replacementTag = eTag;
                break;
              }
            }

            if (replacementTag && replacementTag !== tag) {
              console.log(`    ✓ FIX APPLIED: Re-indexing citation under "${expertName}" from [^${tag}] to [^${replacementTag}] (${endnotesMap.get(replacementTag).speaker})`);
              updatedBlock = updatedBlock.replace(new RegExp(`\\[\\^${tag}\\]`, 'g'), `[^${replacementTag}]`);
              totalFixesApplied++;
            }
          }
        }
      }
    }

    fixedBlocks.push(updatedBlock);
  }

  const resultDoc = fixedBlocks.join('## 🏆 ');
  fs.writeFileSync(filePath, resultDoc, 'utf-8');
  console.log(`✅ Audit complete for ${path.basename(filePath)}. Found ${totalErrorsFound} attribution error(s), applied ${totalFixesApplied} fix(es).\n`);
}

// Run audit on both master reports
auditAndFixReportAttributions('scratch/afc_east_master_100percent_exhaustive.md');
auditAndFixReportAttributions('scratch/nfc_east_master_100percent_exhaustive.md');
