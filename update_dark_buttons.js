const fs = require('fs');
const path = '/Users/ajinachankunju/Documents/DU/DUspace/apps/web/src/app/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// The main change for the primary action buttons:
// They currently use: bg-neutral-900 ... text-white
// We will change: 
// 1. bg-neutral-900 to bg-neutral-900 dark:bg-white
// 2. text-white to text-white dark:text-neutral-900 (only when it's not the stats block or other non-button text-white)
// 3. hover:bg-neutral-700 to hover:bg-neutral-700 dark:hover:bg-neutral-200

// Target these specifically:
// "rounded-lg bg-neutral-900 py-2 text-[11px] font-medium text-white"
// "shrink-0 rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700"
// "flex items-center gap-2.5 rounded-xl bg-neutral-900 px-5 py-2.5 text-white transition hover:bg-neutral-700"
// "group flex items-center gap-2 rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-700"

content = content.replace(/bg-neutral-900(.*?)text-white(.*?)hover:bg-neutral-700/g, 'bg-neutral-900 dark:bg-white$1text-white dark:text-neutral-900$2hover:bg-neutral-700 dark:hover:bg-neutral-200');
content = content.replace(/bg-neutral-900 py-2 text-\[11px\] font-medium text-white/g, 'bg-neutral-900 dark:bg-white py-2 text-[11px] font-medium text-white dark:text-neutral-900');

fs.writeFileSync(path, content, 'utf8');
console.log('Done replacing buttons');
