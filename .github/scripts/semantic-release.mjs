import { execSync } from 'child_process';
import fs from 'fs';

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf-8' }).trim();
  } catch {
    return '';
  }
}

function parseSemVer(versionStr) {
  const match = versionStr.match(/(\d+)\.(\d+)\.(\d+)/);
  if (!match) return [1, 4, 0];
  return [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10)];
}

function main() {
  console.log('=== CrypticMechanic Semantic Release Evaluator ===');

  // 1. Discover latest release tag
  const allTags = run('git tag --list "community-edition-v*" --sort=-v:refname')
    .split('\n')
    .map(t => t.trim())
    .filter(Boolean);

  const latestTag = allTags[0] || '';
  console.log(`Latest detected tag: ${latestTag || 'None'}`);

  // 2. Fetch commits since latest tag (filtering merge commits to avoid changelog pollution)
  const gitRange = latestTag ? `${latestTag}..HEAD` : 'HEAD';
  const rawCommits = run(`git log ${gitRange} --no-merges --pretty=format:"%h%x1f%s%x1f%b%x1e"`);

  if (!rawCommits) {
    console.log('No commits found in range. Skipping release.');
    setOutput('should_release', 'false');
    return;
  }

  const commits = rawCommits
    .split('\x1e')
    .map(chunk => {
      const parts = chunk.split('\x1f');
      return {
        hash: (parts[0] || '').trim(),
        subject: (parts[1] || '').trim(),
        body: (parts[2] || '').trim(),
      };
    })
    .filter(c => c.subject.length > 0 && !/^Merge (pull request|branch)/i.test(c.subject));

  console.log(`Analyzed ${commits.length} commit(s) since last tag.`);

  // 3. Classify commits
  const breaking = [];
  const features = [];
  const fixes = [];
  const chores = [];

  for (const c of commits) {
    const fullText = `${c.subject}\n${c.body}`;
    const isBreaking = /BREAKING CHANGE:/i.test(fullText) || /^[a-z]+(\([^\)]+\))?!:/i.test(c.subject);

    if (isBreaking) {
      breaking.push(c);
    } else if (/^feat(\([^\)]+\))?:/i.test(c.subject)) {
      features.push(c);
    } else if (/^(fix|perf)(\([^\)]+\))?:/i.test(c.subject)) {
      fixes.push(c);
    } else {
      chores.push(c);
    }
  }

  console.log(`- Breaking changes: ${breaking.length}`);
  console.log(`- Features: ${features.length}`);
  console.log(`- Fixes / Performance: ${fixes.length}`);
  console.log(`- Maintenance / Chores / Docs: ${chores.length}`);

  // 4. Determine bump
  let bumpType = null;
  if (breaking.length > 0) {
    bumpType = 'major';
  } else if (features.length > 0) {
    bumpType = 'minor';
  } else if (fixes.length > 0) {
    bumpType = 'patch';
  }

  if (!bumpType) {
    console.log('Result: Only maintenance/docs/ci commits detected. NO tag or release needed.');
    setOutput('should_release', 'false');
    setOutput('reason', 'no_release_worthy_commits');
    return;
  }

  // 5. Determine base version
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  const baseVersion = latestTag ? latestTag.replace(/^community-edition-v/, '') : pkg.version;
  const [major, minor, patch] = parseSemVer(baseVersion);

  let nextVersion = '';
  if (bumpType === 'major') {
    nextVersion = `${major + 1}.0.0`;
  } else if (bumpType === 'minor') {
    nextVersion = `${major}.${minor + 1}.0`;
  } else if (bumpType === 'patch') {
    nextVersion = `${major}.${minor}.${patch + 1}`;
  }

  const nextTag = `community-edition-v${nextVersion}`;
  console.log(`Evaluated bump: [${bumpType.toUpperCase()}] -> ${baseVersion} => ${nextVersion} (${nextTag})`);

  // 6. Generate Release Notes Markdown
  let releaseNotes = `## What's Changed in ${nextTag}\n\n`;

  if (breaking.length > 0) {
    releaseNotes += `### ⚠️ Breaking Changes\n`;
    for (const c of breaking) {
      releaseNotes += `- ${c.subject} (${c.hash})\n`;
    }
    releaseNotes += '\n';
  }

  if (features.length > 0) {
    releaseNotes += `### 🚀 New Features\n`;
    for (const c of features) {
      releaseNotes += `- ${c.subject} (${c.hash})\n`;
    }
    releaseNotes += '\n';
  }

  if (fixes.length > 0) {
    releaseNotes += `### 🐛 Bug Fixes & Performance\n`;
    for (const c of fixes) {
      releaseNotes += `- ${c.subject} (${c.hash})\n`;
    }
    releaseNotes += '\n';
  }

  if (chores.length > 0) {
    releaseNotes += `### 🛠️ Maintenance & Refactoring\n`;
    for (const c of chores) {
      releaseNotes += `- ${c.subject} (${c.hash})\n`;
    }
    releaseNotes += '\n';
  }

  releaseNotes += `\n**Full Changelog**: https://github.com/MaskirovkaOtdel/CrypticMechanic/compare/${latestTag}...${nextTag}\n`;

  fs.writeFileSync('RELEASE_CHANGELOG.md', releaseNotes);
  console.log('Generated RELEASE_CHANGELOG.md');

  // 7. Prepend release section to RELEASE_NOTES.md
  if (fs.existsSync('RELEASE_NOTES.md')) {
    let notesContent = fs.readFileSync('RELEASE_NOTES.md', 'utf-8');
    const versionHeader = `## CrypticMechanic v${nextVersion}`;
    if (!notesContent.includes(versionHeader)) {
      const headerPattern = /^# Release Notes — CrypticMechanic\s*\n\s*---\s*\n/m;
      const bodyContent = releaseNotes.replace(/^## What's Changed in [^\n]+\n\n/, '');
      const newSection = `## CrypticMechanic v${nextVersion}\n\n${bodyContent}\n---\n\n`;

      if (headerPattern.test(notesContent)) {
        notesContent = notesContent.replace(headerPattern, `$&${newSection}`);
      } else {
        notesContent = `# Release Notes — CrypticMechanic\n\n---\n\n${newSection}${notesContent}`;
      }
      fs.writeFileSync('RELEASE_NOTES.md', notesContent);
      console.log('Successfully updated RELEASE_NOTES.md with new release section');
    }
  }

  setOutput('should_release', 'true');
  setOutput('bump_type', bumpType);
  setOutput('new_version', nextVersion);
  setOutput('new_tag', nextTag);
}

function setOutput(key, value) {
  const outputFile = process.env.GITHUB_OUTPUT;
  if (outputFile) {
    fs.appendFileSync(outputFile, `${key}=${value}\n`);
  } else {
    console.log(`[OUTPUT] ${key}=${value}`);
  }
}

main();
