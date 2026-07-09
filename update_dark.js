const fs = require('fs');
const path = '/Users/ajinachankunju/Documents/DU/DUspace/apps/web/src/app/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const replacements = [
  [/bg-white(?!(\/|\s*dark:))/g, 'bg-white dark:bg-neutral-950'],
  [/bg-neutral-50(?!(\/|\s*dark:))/g, 'bg-neutral-50 dark:bg-neutral-900'],
  [/bg-neutral-100(?!(\/|\s*dark:))/g, 'bg-neutral-100 dark:bg-neutral-800'],
  [/text-neutral-900(?!(\/|\s*dark:))/g, 'text-neutral-900 dark:text-white'],
  [/text-neutral-700(?!(\/|\s*dark:))/g, 'text-neutral-700 dark:text-neutral-300'],
  [/text-neutral-500(?!(\/|\s*dark:))/g, 'text-neutral-500 dark:text-neutral-400'],
  [/border-neutral-200(?!(\/|\s*dark:))/g, 'border-neutral-200 dark:border-neutral-800'],
  [/border-neutral-100(?!(\/|\s*dark:))/g, 'border-neutral-100 dark:border-neutral-800'],
  [/from-white(?!(\/|\s*dark:))/g, 'from-white dark:from-neutral-950'],
  [/to-neutral-50\/50(?!(\/|\s*dark:))/g, 'to-neutral-50/50 dark:to-neutral-900/50'],
];

for (const [regex, replacement] of replacements) {
  content = content.replace(regex, replacement);
}

fs.writeFileSync(path, content, 'utf8');
console.log('Done replacing classes');
