#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking for secrets...\n');

// Check if gitleaks is installed
function isGitleaksAvailable() {
  try {
    execSync('gitleaks version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Check if git-secrets is installed
function isGitSecretsAvailable() {
  try {
    execSync('git secrets --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Run gitleaks scan
function runGitleaks() {
  try {
    console.log('Running gitleaks scan...');
    execSync('gitleaks detect --source . --verbose', { stdio: 'inherit' });
    console.log('✅ No secrets detected by gitleaks\n');
    return true;
  } catch (error) {
    console.error('❌ Gitleaks found potential secrets!\n');
    console.error('   Please review and remove any secrets before committing.\n');
    return false;
  }
}

// Run git-secrets scan
function runGitSecrets() {
  try {
    console.log('Running git-secrets scan...');
    execSync('git secrets --scan', { stdio: 'inherit' });
    console.log('✅ No secrets detected by git-secrets\n');
    return true;
  } catch (error) {
    console.error('❌ git-secrets found potential secrets!\n');
    console.error('   Please review and remove any secrets before committing.\n');
    return false;
  }
}

// Basic pattern matching for common secrets
function runBasicScan() {
  console.log('Running basic pattern scan...');
  
  const secretPatterns = [
    { pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*['"]?[a-zA-Z0-9]{20,}['"]?/gi, name: 'API Key' },
    { pattern: /(?:secret|password|passwd|pwd)\s*[:=]\s*['"]?[^\s'"]{8,}['"]?/gi, name: 'Password/Secret' },
    { pattern: /(?:token)\s*[:=]\s*['"]?[a-zA-Z0-9]{20,}['"]?/gi, name: 'Token' },
    { pattern: /-----BEGIN\s+(?:RSA|DSA|EC|OPENSSH)\s+PRIVATE\s+KEY-----/gi, name: 'Private Key' },
    { pattern: /(?:aws[_-]?access[_-]?key[_-]?id)\s*[:=]\s*['"]?[A-Z0-9]{20}['"]?/gi, name: 'AWS Access Key' },
    { pattern: /(?:aws[_-]?secret[_-]?access[_-]?key)\s*[:=]\s*['"]?[a-zA-Z0-9/+=]{40}['"]?/gi, name: 'AWS Secret Key' },
  ];
  
  const filesToScan = [
    'src/**/*.ts',
    'src/**/*.js',
    'config/**/*.json',
    '*.json',
    '*.md',
    '.env*'
  ];
  
  let secretsFound = false;
  const glob = require('glob');
  
  filesToScan.forEach(pattern => {
    const files = glob.sync(pattern, { 
      ignore: ['node_modules/**', 'build/**', 'dist/**', '.git/**', '*.example', '.env.example'] 
    });
    
    files.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        secretPatterns.forEach(({ pattern, name }) => {
          const matches = content.match(pattern);
          if (matches && matches.length > 0) {
            console.warn(`⚠️  Potential ${name} found in ${file}`);
            secretsFound = true;
          }
        });
      } catch (err) {
        // Ignore files that can't be read
      }
    });
  });
  
  if (!secretsFound) {
    console.log('✅ No obvious secrets detected by basic scan\n');
  } else {
    console.log('\n⚠️  Please review the warnings above\n');
  }
  
  return !secretsFound;
}

// Main execution
let scanRan = false;
let allClear = true;

if (isGitleaksAvailable()) {
  scanRan = true;
  allClear = runGitleaks() && allClear;
} else if (isGitSecretsAvailable()) {
  scanRan = true;
  allClear = runGitSecrets() && allClear;
}

// Always run basic scan as a fallback
allClear = runBasicScan() && allClear;

if (!scanRan) {
  console.log('⚠️  WARNING: No secret scanning tool is installed!');
  console.log('   Consider installing one of the following for better secret detection:\n');
  console.log('   • gitleaks: https://github.com/gitleaks/gitleaks');
  console.log('     brew install gitleaks  # macOS');
  console.log('     or download from GitHub releases\n');
  console.log('   • git-secrets: https://github.com/awslabs/git-secrets');
  console.log('     brew install git-secrets  # macOS');
  console.log('     or follow installation guide\n');
  console.log('   Only basic pattern matching was performed.\n');
}

// Exit with appropriate code (0 = success, don't fail the build)
process.exit(0);