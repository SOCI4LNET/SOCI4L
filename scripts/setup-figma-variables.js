/**
 * SOCI4L Figma Variables Setup Script
 * 
 * Bu script, Figma file'ınıza design system variables'larını ekler.
 * 
 * Kullanım:
 * 1. Figma'dan Personal Access Token alın: https://www.figma.com/developers/api#access-tokens
 * 2. Token'ı environment variable olarak ayarlayın: FIGMA_ACCESS_TOKEN=your_token
 * 3. Script'i çalıştırın: node scripts/setup-figma-variables.js
 * 
 * Not: Figma Variables API henüz beta aşamasında. Eğer çalışmazsa, manuel olarak
 * docs/FIGMA_VARIABLES_SETUP.md dosyasındaki adımları takip edin.
 */

const FIGMA_FILE_KEY = 'wLkuqYmrXwXqhKyxPdzcLY';
const FIGMA_API_BASE = 'https://api.figma.com/v1';

// Brand Colors (from brand page)
const BRAND_COLORS = {
  'brand/50': { hex: '#EEF2FF', hsl: '230 69% 98%' },
  'brand/100': { hex: '#E0E7FF', hsl: '230 69% 95%' },
  'brand/200': { hex: '#C7D2FE', hsl: '230 69% 90%' },
  'brand/300': { hex: '#A5B4FC', hsl: '230 69% 82%' },
  'brand/400': { hex: '#818CF8', hsl: '230 69% 65%' },
  'brand/500': { hex: '#2845D6', hsl: '230 69% 50%' }, // Main
  'brand/600': { hex: '#4F46E5', hsl: '230 69% 40%' },
  'brand/700': { hex: '#4338CA', hsl: '230 69% 30%' },
  'brand/800': { hex: '#3730A3', hsl: '230 69% 20%' },
  'brand/900': { hex: '#312E81', hsl: '230 69% 10%' },
  'brand/950': { hex: '#1E1B4B', hsl: '230 69% 5%' },
  'brand/main': { hex: '#2845D6', hsl: '230 69% 50%' },
};

// Semantic Colors - Light Mode
const SEMANTIC_COLORS_LIGHT = {
  'background': { hex: '#F0F0F0', hsl: '0 0% 94%' },
  'foreground': { hex: '#0A0A0A', hsl: '0 0% 4%' },
  'card': { hex: '#F0F0F0', hsl: '0 0% 94%' },
  'card-foreground': { hex: '#0A0A0A', hsl: '0 0% 3.9%' },
  'primary': { hex: '#171717', hsl: '0 0% 9%' },
  'primary-foreground': { hex: '#FAFAFA', hsl: '0 0% 98%' },
  'secondary': { hex: '#F4F4F5', hsl: '240 5% 96%' },
  'secondary-foreground': { hex: '#171717', hsl: '0 0% 9%' },
  'muted': { hex: '#F0F0F0', hsl: '0 0% 94%' },
  'muted-foreground': { hex: '#737373', hsl: '0 0% 45.1%' },
  'accent': { hex: '#E4E4E7', hsl: '240 6% 90%' },
  'accent-foreground': { hex: '#171717', hsl: '0 0% 9%' },
  'border': { hex: '#E4E4E7', hsl: '240 6% 90%' },
  'input': { hex: '#E4E4E7', hsl: '240 6% 90%' },
  'destructive': { hex: '#EF4444', hsl: '0 84.2% 60.2%' },
  'destructive-foreground': { hex: '#FAFAFA', hsl: '0 0% 98%' },
  'popover': { hex: '#F0F0F0', hsl: '0 0% 94%' },
  'popover-foreground': { hex: '#0A0A0A', hsl: '0 0% 3.9%' },
};

// Semantic Colors - Dark Mode
const SEMANTIC_COLORS_DARK = {
  'background': { hex: '#0A0A0A', hsl: '0 0% 4%' },
  'foreground': { hex: '#FAFAFA', hsl: '0 0% 98%' },
  'card': { hex: '#0A0A0A', hsl: '0 0% 4%' },
  'card-foreground': { hex: '#FAFAFA', hsl: '0 0% 98%' },
  'primary': { hex: '#FAFAFA', hsl: '0 0% 98%' },
  'primary-foreground': { hex: '#171717', hsl: '0 0% 9%' },
  'secondary': { hex: '#27272A', hsl: '240 4% 16%' },
  'secondary-foreground': { hex: '#FAFAFA', hsl: '0 0% 98%' },
  'muted': { hex: '#27272A', hsl: '240 4% 16%' },
  'muted-foreground': { hex: '#A3A3A3', hsl: '0 0% 63.9%' },
  'accent': { hex: '#171717', hsl: '0 0% 9%' },
  'accent-foreground': { hex: '#FAFAFA', hsl: '0 0% 98%' },
  'border': { hex: '#27272A', hsl: '240 4% 16%' },
  'input': { hex: '#27272A', hsl: '240 4% 16%' },
  'destructive': { hex: '#7F1D1D', hsl: '0 62.8% 30.6%' },
  'destructive-foreground': { hex: '#FAFAFA', hsl: '0 0% 98%' },
  'popover': { hex: '#0A0A0A', hsl: '0 0% 4%' },
  'popover-foreground': { hex: '#FAFAFA', hsl: '0 0% 98%' },
};

// Spacing Variables
const SPACING_VARIABLES = {
  'spacing/1': 4,
  'spacing/2': 8,
  'spacing/3': 12,
  'spacing/4': 16,
  'spacing/6': 24,
  'spacing/8': 32,
  'spacing/12': 48,
  'spacing/16': 64,
};

// Radius Variables
const RADIUS_VARIABLES = {
  'radius/sm': 4,
  'radius/md': 6,
  'radius/lg': 8,
};

// Helper: Hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255,
  } : null;
}

// Helper: Make API request
async function figmaRequest(endpoint, method = 'GET', body = null) {
  const token = process.env.FIGMA_ACCESS_TOKEN;
  if (!token) {
    throw new Error('FIGMA_ACCESS_TOKEN environment variable is required. Get it from: https://www.figma.com/developers/api#access-tokens');
  }

  const url = `${FIGMA_API_BASE}${endpoint}`;
  const options = {
    method,
    headers: {
      'X-Figma-Token': token,
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Figma API error (${response.status}): ${error}`);
  }

  return response.json();
}

// Main function
async function setupFigmaVariables() {
  console.log('🚀 SOCI4L Figma Variables Setup\n');
  console.log(`📁 File Key: ${FIGMA_FILE_KEY}\n`);

  try {
    // Check if file is accessible
    console.log('📡 Checking file access...');
    const fileInfo = await figmaRequest(`/files/${FIGMA_FILE_KEY}`);
    console.log(`✅ File accessible: "${fileInfo.name}"\n`);

    // Note: Figma Variables API is still in beta and may not be fully available via REST API
    // The following is a template for when the API becomes available
    
    console.log('⚠️  Figma Variables API is currently in beta.');
    console.log('   Variables cannot be created programmatically via REST API yet.\n');
    console.log('📋 Please use one of these methods:\n');
    console.log('   1. Manual Setup:');
    console.log('      - Open Figma Desktop');
    console.log('      - Go to: Right sidebar → Variables');
    console.log('      - Follow: docs/FIGMA_VARIABLES_SETUP.md\n');
    console.log('   2. Figma Plugin:');
    console.log('      - Install a Variables plugin from Figma Community');
    console.log('      - Or create a custom plugin using Figma Plugin API\n');
    
    console.log('📊 Variables to create:\n');
    console.log('   Brand Colors:');
    Object.entries(BRAND_COLORS).forEach(([name, { hex }]) => {
      console.log(`     - ${name}: ${hex}`);
    });
    console.log('\n   Semantic Colors (Light):');
    Object.entries(SEMANTIC_COLORS_LIGHT).forEach(([name, { hex }]) => {
      console.log(`     - ${name}: ${hex}`);
    });
    console.log('\n   Semantic Colors (Dark):');
    Object.entries(SEMANTIC_COLORS_DARK).forEach(([name, { hex }]) => {
      console.log(`     - ${name}: ${hex}`);
    });
    console.log('\n   Spacing:');
    Object.entries(SPACING_VARIABLES).forEach(([name, value]) => {
      console.log(`     - ${name}: ${value}px`);
    });
    console.log('\n   Radius:');
    Object.entries(RADIUS_VARIABLES).forEach(([name, value]) => {
      console.log(`     - ${name}: ${value}px`);
    });

    console.log('\n✅ Setup guide ready! See docs/FIGMA_VARIABLES_SETUP.md for detailed instructions.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('FIGMA_ACCESS_TOKEN')) {
      console.log('\n💡 To get a Figma Access Token:');
      console.log('   1. Go to: https://www.figma.com/developers/api#access-tokens');
      console.log('   2. Click "Create a new personal access token"');
      console.log('   3. Copy the token');
      console.log('   4. Set it as environment variable:');
      console.log('      Windows: $env:FIGMA_ACCESS_TOKEN="your_token"');
      console.log('      Mac/Linux: export FIGMA_ACCESS_TOKEN="your_token"');
    }
    process.exit(1);
  }
}

// Run
setupFigmaVariables();
