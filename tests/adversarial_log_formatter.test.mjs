/**
 * adversarial_log_formatter.test.mjs
 *
 * Empirical Adversarial Test Suite for Terminal Log Formatter:
 * - 7-bit and 8-bit ANSI/VT100 escape sequence stripping (colors, bold, cursor controls, OSC)
 * - Noise reduction (ISO-8601 timestamps, syslog timestamps, container hashes, duplicate stack frame collapsing)
 * - Log runtime heuristic signature detection (Python, Node.js, Go, Rust, Java / JVM, Docker, Kubernetes)
 * - Edge cases (empty strings, null, undefined, ReDoS-resistant matching, mixed text)
 */

import {
  stripAnsiCodes,
  countAnsiCodes,
  cleanTerminalNoise,
  detectLogRuntime,
} from '../src/lib/logFormatter.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  if (actual === expected) {
    passed++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message} (expected "${expected}", got "${actual}")`);
  }
}

console.log('================================================================');
console.log('SUITE 1: ANSI Control Sequence Stripping & Counting');
console.log('================================================================');

{
  // 1. Basic 16-color SGR codes
  const colored = '\x1b[31mError: Connection failed\x1b[0m';
  assertEqual(stripAnsiCodes(colored), 'Error: Connection failed', 'Strips standard 16-color SGR codes');
  assertEqual(countAnsiCodes(colored), 2, 'Counts 2 ANSI codes in standard string');

  // 2. 256-color and 24-bit TrueColor sequences
  const trueColor = '\x1b[38;2;255;85;85mCritical failure\x1b[0m in \x1b[38;5;196mworker-thread\x1b[m';
  assertEqual(stripAnsiCodes(trueColor), 'Critical failure in worker-thread', 'Strips 256-color and 24-bit TrueColor codes');
  assertEqual(countAnsiCodes(trueColor), 4, 'Counts 4 ANSI codes in TrueColor string');

  // 3. 8-bit C1 escape sequences (\x9b...)
  const c1Text = '\x9b31m8-bit red error\x9b0m';
  assertEqual(stripAnsiCodes(c1Text), '8-bit red error', 'Strips 8-bit C1 ANSI sequences');

  // 4. Cursor movement and terminal control sequences (\x1b[2K, \x1b[?25h, etc.)
  const cursorText = '\x1b[2K\x1b[1A\x1b[?25lLoading...\x1b[?25h\x1b[2KDone!';
  assertEqual(stripAnsiCodes(cursorText), 'Loading...Done!', 'Strips cursor and terminal manipulation sequences');

  // 5. Operating System Command (OSC) window title sequences
  const oscText = '\x1b]0;npm install\x07Installing dependencies...';
  assertEqual(stripAnsiCodes(oscText), 'Installing dependencies...', 'Strips OSC title escape sequence');

  // 6. Text with zero ANSI codes returned unaltered
  const plain = 'Normal plain text error message without any escapes';
  assertEqual(stripAnsiCodes(plain), plain, 'Preserves text without ANSI codes unchanged');
  assertEqual(countAnsiCodes(plain), 0, 'Zero ANSI codes in plain text');

  // 7. Edge cases: empty string, null, undefined, numbers
  assertEqual(stripAnsiCodes(''), '', 'Handles empty string');
  assertEqual(stripAnsiCodes(null), '', 'Handles null gracefully');
  assertEqual(stripAnsiCodes(undefined), '', 'Handles undefined gracefully');
  assertEqual(stripAnsiCodes(12345), '', 'Handles non-string input safely');
}

console.log('================================================================');
console.log('SUITE 2: Terminal Noise Reduction & Stack Frame Collapsing');
console.log('================================================================');

{
  // 1. ISO-8601 timestamps stripping
  const isoLog = '2026-09-24T12:00:00.123Z [ERROR] Failed to query database';
  assertEqual(cleanTerminalNoise(isoLog), '[ERROR] Failed to query database', 'Strips ISO-8601 UTC timestamp');

  const isoOffsetLog = '[2026-09-24 14:30:15+02:00] [WARN] Cache miss';
  assertEqual(cleanTerminalNoise(isoOffsetLog), '[WARN] Cache miss', 'Strips bracketed ISO timestamp with timezone offset');

  // 2. Syslog timestamps stripping
  const syslog = 'Sep 24 15:42:01 server-01 kernel: Out of memory';
  assertEqual(cleanTerminalNoise(syslog), 'server-01 kernel: Out of memory', 'Strips syslog format timestamp');

  // 3. Container hash stripping (64-char hex SHA256 and docker:// prefixes)
  const dockerContainerLog = 'docker://4b9f2e81d7a602c31e4f8b9a2c1d0e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d worker process exited';
  assertEqual(cleanTerminalNoise(dockerContainerLog).trim(), 'worker process exited', 'Strips docker:// 64-char container hash');

  const containerIdLog = 'container_id=7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d service crash';
  assertEqual(cleanTerminalNoise(containerIdLog).trim(), 'service crash', 'Strips container_id parameter');

  const bracketCidLog = '[a1b2c3d4e5f6] Starting healthcheck probe';
  assertEqual(cleanTerminalNoise(bracketCidLog).trim(), 'Starting healthcheck probe', 'Strips leading 12-char bracketed container ID');

  // 4. Duplicate sequential stack frames collapsing
  const repeatingFrames = [
    'Error: Maximum call stack size exceeded',
    '    at recursiveWorker (/app/worker.js:42:15)',
    '    at recursiveWorker (/app/worker.js:42:15)',
    '    at recursiveWorker (/app/worker.js:42:15)',
    '    at recursiveWorker (/app/worker.js:42:15)',
    '    at main (/app/index.js:10:3)',
  ].join('\n');

  const cleanedFrames = cleanTerminalNoise(repeatingFrames);
  assert(cleanedFrames.includes('... [repeated 3 times]'), 'Collapses 4 identical frames into 1 frame + [repeated 3 times]');
  assert(cleanedFrames.includes('at main (/app/index.js:10:3)'), 'Preserves subsequent non-duplicate frame');

  // 5. Preserves empty lines cleanly without repeating summaries
  const textWithEmptyLines = 'Line 1\n\n\nLine 2';
  const cleanedEmpty = cleanTerminalNoise(textWithEmptyLines);
  assert(!cleanedEmpty.includes('repeated'), 'Does not collapse blank lines into [repeated]');
  assertEqual(cleanedEmpty, 'Line 1\n\nLine 2', 'Normalizes consecutive blank lines');

  // 6. Options toggles
  const timestampOnly = cleanTerminalNoise(isoLog, { stripTimestamps: false });
  assert(timestampOnly.includes('2026-09-24T12:00:00.123Z'), 'Respects stripTimestamps=false');
}

console.log('================================================================');
console.log('SUITE 3: Log Runtime Heuristic Detection');
console.log('================================================================');

{
  // 1. Python Traceback
  const pythonLog = `
    Traceback (most recent call last):
      File "/app/backend/server.py", line 45, in handle_request
        result = compute_metrics(payload)
      File "/app/backend/metrics.py", line 12, in compute_metrics
        return total / count
    ZeroDivisionError: division by zero
  `;
  const pyMatch = detectLogRuntime(pythonLog);
  assert(pyMatch !== null, 'Detected Python error log');
  assertEqual(pyMatch.runtime, 'Python', 'Runtime identifier is Python');
  assertEqual(pyMatch.label, 'Python Traceback', 'Label is Python Traceback');
  assertEqual(String(pyMatch), 'Python', 'String coercion yields Python');

  // 2. Node.js Stack Trace
  const nodeLog = `
    TypeError: Cannot read properties of undefined (reading 'map')
        at renderItems (/app/src/components/List.jsx:14:22)
        at App (/app/src/App.jsx:55:12)
        at node:internal/main/run_main_module:28:49
  `;
  const nodeMatch = detectLogRuntime(nodeLog);
  assert(nodeMatch !== null, 'Detected Node.js error log');
  assertEqual(nodeMatch.runtime, 'Node.js', 'Runtime identifier is Node.js');

  // 3. Go Panic
  const goLog = `
    panic: runtime error: index out of range [3] with length 2
    goroutine 1 [running]:
    main.processOrders(0xc0000a4000, 0x2, 0x2)
        /workspace/cmd/server/main.go:88 +0x14c
    main.main()
        /workspace/cmd/server/main.go:24 +0x48
  `;
  const goMatch = detectLogRuntime(goLog);
  assert(goMatch !== null, 'Detected Go panic log');
  assertEqual(goMatch.runtime, 'Go', 'Runtime identifier is Go');
  assertEqual(goMatch.label, 'Go Panic', 'Label is Go Panic');

  // 4. Rust Panic
  const rustLog = `
    thread 'main' panicked at 'called \`Option::unwrap()\` on a \`None\` value', src/parser.rs:52:18
    stack backtrace:
       0: rust_begin_unwind
       1: core::panicking::panic_fmt
       2: core::panicking::panic
  `;
  const rustMatch = detectLogRuntime(rustLog);
  assert(rustMatch !== null, 'Detected Rust panic log');
  assertEqual(rustMatch.runtime, 'Rust', 'Runtime identifier is Rust');
  assertEqual(rustMatch.label, 'Rust Panic', 'Label is Rust Panic');

  // 5. Java / JVM Exception
  const javaLog = `
    Exception in thread "main" java.lang.NullPointerException: Cannot invoke "java.util.List.size()" because "list" is null
        at com.example.service.OrderManager.process(OrderManager.java:34)
        at com.example.Application.main(Application.java:12)
  `;
  const javaMatch = detectLogRuntime(javaLog);
  assert(javaMatch !== null, 'Detected Java / JVM error log');
  assertEqual(javaMatch.runtime, 'Java / JVM', 'Runtime identifier is Java / JVM');
  assertEqual(javaMatch.label, 'Java / JVM Exception', 'Label is Java / JVM Exception');

  // 6. Kubernetes Orchestrator Error
  const k8sLog = `
    0/3 nodes are available: 1 Insufficient cpu, 2 node(s) had volume node affinity conflict.
    Back-off restarting failed container web-worker in pod frontend-api-7c859d57fb-9x2jk_production
    Events:
      Type     Reason             Age   From               Message
      Warning  CrashLoopBackOff   15s   kubelet            Back-off restarting failed container
  `;
  const k8sMatch = detectLogRuntime(k8sLog);
  assert(k8sMatch !== null, 'Detected Kubernetes orchestrator log');
  assertEqual(k8sMatch.runtime, 'Kubernetes', 'Runtime identifier is Kubernetes');

  // 7. Docker Engine Error
  const dockerLog = `
    docker: Error response from daemon: Cannot connect to the Docker daemon at unix:///var/run/docker.sock. Is the docker daemon running?.
    See 'docker run --help'.
  `;
  const dockerMatch = detectLogRuntime(dockerLog);
  assert(dockerMatch !== null, 'Detected Docker error log');
  assertEqual(dockerMatch.runtime, 'Docker', 'Runtime identifier is Docker');

  // 8. Arbitrary / unrecognized text returns null
  const randomText = 'Hello world, meeting is scheduled at 3pm today.';
  assertEqual(detectLogRuntime(randomText), null, 'Unrecognized plain text returns null');
  assertEqual(detectLogRuntime(''), null, 'Empty string returns null');
  assertEqual(detectLogRuntime(null), null, 'Null returns null');
}

console.log('================================================================');
console.log(`TOTAL TESTS: ${passed + failed}`);
console.log(`PASSED:      ${passed}`);
console.log(`FAILED:      ${failed}`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('\nALL LOG FORMATTER ADVERSARIAL TESTS PASSED SUCCESSFULLY!\n');
}
