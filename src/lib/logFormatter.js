/**
 * logFormatter.js
 *
 * Terminal log cleaning, ANSI code removal, noise reduction, and runtime detection.
 * Designed to reduce token bloat before sending logs to AI models.
 */

// Comprehensive ANSI/VT100 escape sequence regex (7-bit and 8-bit C1, OSC, CSI, SGR)
// eslint-disable-next-line no-control-regex
const ANSI_REGEX = /(?:\x1B\][^\x07\x1B]*(?:\x07|\x1B\\)|[\x1B\x9B][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-OR-Zcf-nqry=><~])/g;

/**
 * Strips all 7-bit and 8-bit ANSI/VT100 control sequences, cursor commands, and SGR color codes.
 *
 * @param {string} text - Raw log text containing terminal escape codes.
 * @returns {string} Clean plain-text string.
 */
export function stripAnsiCodes(text) {
  if (!text || typeof text !== 'string') return '';
  return text.replace(ANSI_REGEX, '');
}

/**
 * Counts the number of ANSI escape sequences present in the text.
 *
 * @param {string} text - Raw log text.
 * @returns {number} Count of ANSI sequences.
 */
export function countAnsiCodes(text) {
  if (!text || typeof text !== 'string') return 0;
  const matches = text.match(ANSI_REGEX);
  return matches ? matches.length : 0;
}

/**
 * Collapses sequential identical lines with an annotated count summary.
 *
 * @param {string[]} lines - Array of log lines.
 * @returns {string[]} Array of lines with sequential duplicates collapsed.
 */
function collapseSequentialDuplicates(lines) {
  const result = [];
  let i = 0;

  while (i < lines.length) {
    const currentLine = lines[i];
    const trimmed = currentLine.trim();

    // Preserve blank lines without collapsing into repetition summaries
    if (!trimmed) {
      // Collapse multiple consecutive empty lines to a single empty line
      if (result.length === 0 || result[result.length - 1].trim() !== '') {
        result.push(currentLine);
      }
      i++;
      continue;
    }

    let j = i + 1;
    while (j < lines.length && lines[j].trim() === trimmed) {
      j++;
    }

    const duplicateCount = j - i - 1;
    result.push(currentLine);

    if (duplicateCount > 0) {
      const matchIndent = currentLine.match(/^\s*/);
      const indent = matchIndent ? matchIndent[0] : '';
      result.push(`${indent}... [repeated ${duplicateCount} time${duplicateCount === 1 ? '' : 's'}]`);
    }

    i = j;
  }

  return result;
}

/**
 * Cleans terminal noise from logs:
 * - Strips ANSI escape codes
 * - Strips verbose ISO-8601 & syslog timestamps at line prefixes
 * - Strips container hashes and IDs (e.g., 64-char SHA256 or docker:// prefixes)
 * - Collapses duplicate sequential stack frames with a count summary
 *
 * @param {string} text - Raw log text.
 * @param {object} [options] - Configuration options.
 * @param {boolean} [options.stripAnsi=true] - Remove ANSI escape sequences.
 * @param {boolean} [options.stripTimestamps=true] - Remove leading timestamps.
 * @param {boolean} [options.stripContainerHashes=true] - Remove container hashes/prefixes.
 * @param {boolean} [options.collapseDuplicates=true] - Collapse sequential duplicate stack frames.
 * @returns {string} Cleaned log text.
 */
export function cleanTerminalNoise(text, options = {}) {
  if (!text || typeof text !== 'string') return '';

  const {
    stripAnsi = true,
    stripTimestamps = true,
    stripContainerHashes = true,
    collapseDuplicates = true,
  } = options;

  let cleaned = stripAnsi ? stripAnsiCodes(text) : text;
  let lines = cleaned.split(/\r?\n/);

  // Process line-by-line for timestamps and container hashes
  lines = lines.map((line) => {
    let l = line;

    if (stripTimestamps) {
      // 1. ISO-8601 timestamps: e.g. [2026-09-24T12:34:56.789Z] or 2026-09-24 12:34:56,789
      l = l.replace(/^(\s*)\[?\d{4}[-/]\d{2}[-/]\d{2}[T ]\d{2}:\d{2}:\d{2}(?:[.,]\d+)?(?:Z|[+-]\d{2}:?\d{2})?\]?\s*[:-]?\s*/, '$1');

      // 2. Syslog timestamps: e.g. Sep 24 12:34:56 or [Sep 24 12:34:56.789]
      l = l.replace(/^(\s*)\[?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}(?:\.\d+)?\]?\s*[:-]?\s*/i, '$1');

      // 3. Simple time-only brackets: e.g. [12:34:56] or [12:34:56.789]
      l = l.replace(/^(\s*)\[\d{2}:\d{2}:\d{2}(?:\.\d+)?\]\s*[:-]?\s*/, '$1');
    }

    if (stripContainerHashes) {
      // Strip docker:// or containerd:// prefixes with 12-64 char hashes
      l = l.replace(/\b(?:docker|containerd):\/\/[0-9a-fA-F]{12,64}\b/g, '');

      // Strip container_id=... or cid=...
      l = l.replace(/\b(?:container(?:_id)?|cid)[:=]\s*[0-9a-fA-F]{12,64}\b/gi, '');

      // Strip sha256:... hashes
      l = l.replace(/\bsha256:[0-9a-fA-F]{64}\b/gi, '');

      // Strip standalone 64-char hexadecimal hashes
      l = l.replace(/\b[0-9a-fA-F]{64}\b/g, '');

      // Strip 12-char hex container IDs in brackets at start of lines: e.g. [a1b2c3d4e5f6]
      l = l.replace(/^(\s*)\[[0-9a-fA-F]{12}\]\s*/, '$1');
    }

    return l;
  });

  if (collapseDuplicates) {
    lines = collapseSequentialDuplicates(lines);
  }

  return lines.join('\n');
}

/**
 * Heuristically detects runtime signatures in error logs.
 * Supports: Python, Node.js, Go, Rust, Java / JVM, Docker, Kubernetes.
 *
 * @param {string} text - Error log or stack trace.
 * @returns {{ runtime: string, label: string, name: string } | null}
 */
export function detectLogRuntime(text) {
  if (!text || typeof text !== 'string' || !text.trim()) return null;

  const raw = stripAnsiCodes(text);

  // 1. Python Tracebacks & File line references
  if (
    /Traceback \(most recent call last\):/i.test(raw) ||
    /File\s+"[^"]+",\s+line\s+\d+,\s+in\s+/i.test(raw)
  ) {
    return createRuntimeMatch('Python', 'Python Traceback');
  }

  // 2. Node.js & JavaScript V8 Stack Traces
  if (
    /\bat\s+(?:async\s+)?[a-zA-Z0-9_$.<>\s]+\s*\(?(?:node:|\/|[A-Za-z]:\\|[./]).*:\d+:\d+\)?/i.test(raw) ||
    /\b(?:npm\s+ERR!|yarn\s+error|pnpm\s+ERR!)/i.test(raw) ||
    /UnhandledPromiseRejection/i.test(raw) ||
    /\b(?:ECONNREFUSED|MODULE_NOT_FOUND|ERR_MODULE_NOT_FOUND)\b/i.test(raw) ||
    /node:internal\//i.test(raw)
  ) {
    return createRuntimeMatch('Node.js', 'Node.js');
  }

  // 3. Go Panics & Goroutines
  if (
    /\bpanic:\s+/i.test(raw) ||
    /goroutine\s+\d+\s+\[[^\]]+\]:/i.test(raw) ||
    /\.go:\d+\s+\+0x[0-9a-fA-F]+/i.test(raw) ||
    /fatal error:\s+/i.test(raw)
  ) {
    const isPanic = /panic:/i.test(raw) || /fatal error:/i.test(raw);
    return createRuntimeMatch('Go', isPanic ? 'Go Panic' : 'Go');
  }

  // 4. Rust Panics & Stack Backtraces
  if (
    /thread\s+'[^']+'\s+panicked\s+at/i.test(raw) ||
    /stack backtrace:/i.test(raw) ||
    /panicked at '[^']+',\s+[^:]+\.rs:\d+/i.test(raw) ||
    /rust_begin_unwind/i.test(raw) ||
    /core::result::Result::unwrap/i.test(raw)
  ) {
    return createRuntimeMatch('Rust', 'Rust Panic');
  }

  // 5. Java / JVM Exceptions & Stack Traces
  if (
    /Exception in thread\s+"[^"]+"/i.test(raw) ||
    /Caused by:\s+[a-zA-Z0-9_.]*(?:Exception|Error):/i.test(raw) ||
    /\tat\s+[a-zA-Z0-9_.$]+\([a-zA-Z0-9_]+\.java:\d+\)/i.test(raw) ||
    /\b(?:NullPointerException|ClassNotFoundException|IllegalArgumentException|OutOfMemoryError|StackOverflowError|IllegalStateException|NoClassDefFoundError)\s*:/i.test(raw)
  ) {
    return createRuntimeMatch('Java / JVM', 'Java / JVM Exception');
  }

  // 6. Python Single-line Errors (e.g. ZeroDivisionError, NameError, etc. without explicit traceback)
  if (
    /\b(?:ZeroDivisionError|IndentationError|ModuleNotFoundError|UnboundLocalError|NameError|AttributeError|KeyError|ValueError)\s*:/i.test(raw)
  ) {
    return createRuntimeMatch('Python', 'Python');
  }

  // 7. Kubernetes Orchestrator Errors
  if (
    /\b(?:CrashLoopBackOff|ImagePullBackOff|ErrImagePull|CreateContainerConfigError|OOMKilled)\b/i.test(raw) ||
    /Back-off restarting failed container/i.test(raw) ||
    /\b(?:pod\/[a-z0-9-]+|deployment\.apps\/|k8s\.io\/|kube-system)\b/i.test(raw)
  ) {
    return createRuntimeMatch('Kubernetes', 'Kubernetes');
  }

  // 8. Docker Engine Errors
  if (
    /docker:\s+Error response from daemon:/i.test(raw) ||
    /Cannot connect to the Docker daemon/i.test(raw) ||
    /failed to solve with frontend dockerfile/i.test(raw) ||
    /\bunable to find image '[^']+' locally/i.test(raw) ||
    /\b(?:dockerd|containerd):/i.test(raw)
  ) {
    return createRuntimeMatch('Docker', 'Docker');
  }

  return null;
}

/**
 * Creates a runtime match object that works seamlessly with string comparisons and properties.
 */
function createRuntimeMatch(runtime, label) {
  return {
    runtime,
    label,
    name: runtime,
    toString() {
      return this.runtime;
    },
    valueOf() {
      return this.runtime;
    },
  };
}
