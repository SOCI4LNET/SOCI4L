/**
 * SOCI4L Figma Plugin - Variables Setup
 * 
 * Bu script'i Figma Plugin olarak kullanmak için:
 * 1. Figma Desktop'ta: Plugins → Development → New Plugin
 * 2. manifest.json oluşturun (aşağıdaki manifest'i kullanın)
 * 3. Bu dosyayı code.ts olarak kaydedin
 * 4. Plugin'i çalıştırın
 * 
 * VEYA: Bu script'i manuel olarak Figma Plugin Editor'da çalıştırabilirsiniz
 */

// Brand Colors
const BRAND_COLORS = [
  { name: 'brand/50', hex: '#EEF2FF' },
  { name: 'brand/100', hex: '#E0E7FF' },
  { name: 'brand/200', hex: '#C7D2FE' },
  { name: 'brand/300', hex: '#A5B4FC' },
  { name: 'brand/400', hex: '#818CF8' },
  { name: 'brand/500', hex: '#2845D6' }, // Main
  { name: 'brand/600', hex: '#4F46E5' },
  { name: 'brand/700', hex: '#4338CA' },
  { name: 'brand/800', hex: '#3730A3' },
  { name: 'brand/900', hex: '#312E81' },
  { name: 'brand/950', hex: '#1E1B4B' },
  { name: 'brand/main', hex: '#2845D6' },
];

// Semantic Colors - Light
const SEMANTIC_LIGHT = [
  { name: 'background', hex: '#F0F0F0' },
  { name: 'foreground', hex: '#0A0A0A' },
  { name: 'card', hex: '#F0F0F0' },
  { name: 'card-foreground', hex: '#0A0A0A' },
  { name: 'primary', hex: '#171717' },
  { name: 'primary-foreground', hex: '#FAFAFA' },
  { name: 'secondary', hex: '#F4F4F5' },
  { name: 'secondary-foreground', hex: '#171717' },
  { name: 'muted', hex: '#F0F0F0' },
  { name: 'muted-foreground', hex: '#737373' },
  { name: 'accent', hex: '#E4E4E7' },
  { name: 'accent-foreground', hex: '#171717' },
  { name: 'border', hex: '#E4E4E7' },
  { name: 'input', hex: '#E4E4E7' },
  { name: 'destructive', hex: '#EF4444' },
  { name: 'destructive-foreground', hex: '#FAFAFA' },
  { name: 'popover', hex: '#F0F0F0' },
  { name: 'popover-foreground', hex: '#0A0A0A' },
];

// Semantic Colors - Dark
const SEMANTIC_DARK = [
  { name: 'background', hex: '#0A0A0A' },
  { name: 'foreground', hex: '#FAFAFA' },
  { name: 'card', hex: '#0A0A0A' },
  { name: 'card-foreground', hex: '#FAFAFA' },
  { name: 'primary', hex: '#FAFAFA' },
  { name: 'primary-foreground', hex: '#171717' },
  { name: 'secondary', hex: '#27272A' },
  { name: 'secondary-foreground', hex: '#FAFAFA' },
  { name: 'muted', hex: '#27272A' },
  { name: 'muted-foreground', hex: '#A3A3A3' },
  { name: 'accent', hex: '#171717' },
  { name: 'accent-foreground', hex: '#FAFAFA' },
  { name: 'border', hex: '#27272A' },
  { name: 'input', hex: '#27272A' },
  { name: 'destructive', hex: '#7F1D1D' },
  { name: 'destructive-foreground', hex: '#FAFAFA' },
  { name: 'popover', hex: '#0A0A0A' },
  { name: 'popover-foreground', hex: '#FAFAFA' },
];

// Spacing
const SPACING = [
  { name: 'spacing/1', value: 4 },
  { name: 'spacing/2', value: 8 },
  { name: 'spacing/3', value: 12 },
  { name: 'spacing/4', value: 16 },
  { name: 'spacing/6', value: 24 },
  { name: 'spacing/8', value: 32 },
  { name: 'spacing/12', value: 48 },
  { name: 'spacing/16', value: 64 },
];

// Radius
const RADIUS = [
  { name: 'radius/sm', value: 4 },
  { name: 'radius/md', value: 6 },
  { name: 'radius/lg', value: 8 },
];

// Helper: Hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255,
  } : null;
}

// Main plugin function
async function setupVariables() {
  console.log('🚀 Setting up SOCI4L Variables...');

  // Get or create variable collections
  const localVariables = figma.variables.getLocalVariables();
  
  // Find or create collections
  let brandCollection = localVariables.find(v => v.name === 'Brand Colors');
  let semanticCollection = localVariables.find(v => v.name === 'Semantic Colors');
  let spacingCollection = localVariables.find(v => v.name === 'Spacing');
  let radiusCollection = localVariables.find(v => v.name === 'Radius');

  // Create Brand Colors
  console.log('Creating Brand Colors...');
  BRAND_COLORS.forEach(({ name, hex }) => {
    const rgb = hexToRgb(hex);
    if (rgb) {
      const variable = figma.variables.createVariable(name, brandCollection || null, 'COLOR');
      variable.setValueForMode(figma.variables.getLocalVariableCollections()[0].modes[0].modeId, rgb);
    }
  });

  // Create Semantic Colors (Light & Dark modes)
  console.log('Creating Semantic Colors...');
  const lightMode = figma.variables.getLocalVariableCollections()[0].modes.find(m => m.name === 'Light')?.modeId;
  const darkMode = figma.variables.getLocalVariableCollections()[0].modes.find(m => m.name === 'Dark')?.modeId;

  SEMANTIC_LIGHT.forEach(({ name, hex }) => {
    const rgb = hexToRgb(hex);
    if (rgb && lightMode) {
      const variable = figma.variables.createVariable(name, semanticCollection || null, 'COLOR');
      variable.setValueForMode(lightMode, rgb);
    }
  });

  SEMANTIC_DARK.forEach(({ name, hex }) => {
    const rgb = hexToRgb(hex);
    if (rgb && darkMode) {
      // Find existing variable or create new
      const existing = localVariables.find(v => v.name === name);
      if (existing) {
        existing.setValueForMode(darkMode, rgb);
      }
    }
  });

  // Create Spacing
  console.log('Creating Spacing Variables...');
  SPACING.forEach(({ name, value }) => {
    const variable = figma.variables.createVariable(name, spacingCollection || null, 'FLOAT');
    variable.setValueForMode(figma.variables.getLocalVariableCollections()[0].modes[0].modeId, value);
  });

  // Create Radius
  console.log('Creating Radius Variables...');
  RADIUS.forEach(({ name, value }) => {
    const variable = figma.variables.createVariable(name, radiusCollection || null, 'FLOAT');
    variable.setValueForMode(figma.variables.getLocalVariableCollections()[0].modes[0].modeId, value);
  });

  console.log('✅ Variables created successfully!');
  figma.notify('SOCI4L Variables setup complete! 🎉');
  figma.closePlugin();
}

// Run
setupVariables();
