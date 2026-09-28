const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1100,height:900}});
await p.goto('file:///home/claude/cum/prev.html');await p.waitForTimeout(1200);await p.screenshot({path:'full.png',fullPage:true});await b.close();})();
