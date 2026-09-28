const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();for(const w of [1,2]){const p=await b.newPage({viewport:{width:1100,height:900}});
await p.goto(`file:///home/claude/w12/prev${w}.html`);await p.waitForTimeout(1200);
await p.screenshot({path:`full${w}.png`,fullPage:true});}await b.close();})();
