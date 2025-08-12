import fs from 'fs';
import path from 'path';

// This script embeds drinks.json into the application during build time
// It creates a TypeScript file that exports the drinks data as a constant

async function embedDrinks() {
  try {
    // Read the drinks.json file
    const drinksPath = path.resolve(process.cwd(), '../../data/drinks.json');
    
    if (!fs.existsSync(drinksPath)) {
      console.error('drinks.json not found at:', drinksPath);
      process.exit(1);
    }

    const drinksData = fs.readFileSync(drinksPath, 'utf8');
    const drinks = JSON.parse(drinksData);

    // Create the embedded drinks file
    const embeddedDrinksContent = `// This file is auto-generated during build time
// Do not edit manually - edit data/drinks.json instead

export const embeddedDrinks = ${JSON.stringify(drinks, null, 2)} as const;

export type EmbeddedDrink = typeof embeddedDrinks[number];

export default embeddedDrinks;
`;

    // Write to the lib directory
    const outputPath = path.resolve(process.cwd(), 'lib/embedded-drinks.ts');
    const outputDir = path.dirname(outputPath);
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, embeddedDrinksContent);
    
    console.log(`✅ Embedded ${drinks.length} drinks from drinks.json into lib/embedded-drinks.ts`);
    
    // Also create a JSON file for easier access
    const jsonOutputPath = path.resolve(process.cwd(), 'public/embedded-drinks.json');
    fs.writeFileSync(jsonOutputPath, drinksData);
    
    console.log(`✅ Copied drinks.json to public/embedded-drinks.json`);
    
  } catch (error) {
    console.error('Error embedding drinks:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  embedDrinks();
}

export { embedDrinks };
