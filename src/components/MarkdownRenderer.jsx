import { useState, createContext, useContext, Children, isValidElement, cloneElement } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';
import { copyTextToClipboard } from '../lib/clipboard';

const PreContext = createContext(false);

const LANG_MAP = {
  bash: 'BASH',
  sh: 'BASH',
  zsh: 'ZSH',
  shell: 'SHELL',
  powershell: 'POWERSHELL',
  ps1: 'POWERSHELL',
  javascript: 'JAVASCRIPT',
  js: 'JAVASCRIPT',
  jsx: 'REACT JSX',
  typescript: 'TYPESCRIPT',
  ts: 'TYPESCRIPT',
  tsx: 'REACT TSX',
  dockerfile: 'DOCKERFILE',
  docker: 'DOCKERFILE',
  python: 'PYTHON',
  py: 'PYTHON',
  json: 'JSON',
  jsonc: 'JSON',
  yaml: 'YAML',
  yml: 'YAML',
  xml: 'XML',
  html: 'HTML',
  css: 'CSS',
  sql: 'SQL',
  rust: 'RUST',
  go: 'GO',
  java: 'JAVA',
  c: 'C',
  cpp: 'C++',
  diff: 'DIFF',
  markdown: 'MARKDOWN',
  md: 'MARKDOWN',
};

function getLanguageLabel(lang) {
  if (!lang) return 'CODE';
  const lower = lang.toLowerCase();
  return LANG_MAP[lower] || lang.toUpperCase();
}

function getNodeText(node) {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(getNodeText).join('');
  if (isValidElement(node) && node.props?.children) {
    return getNodeText(node.props.children);
  }
  return '';
}

function getCodeString(children) {
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) {
    return children
      .map((c) => {
        if (typeof c === 'string') return c;
        if (typeof c === 'number') return String(c);
        if (isValidElement(c) && c.props?.children) {
          return getCodeString(c.props.children);
        }
        return '';
      })
      .join('');
  }
  if (isValidElement(children) && children.props?.children) {
    return getCodeString(children.props.children);
  }
  return String(children || '');
}

function parseTaskItem(children) {
  const childArray = Children.toArray(children);

  for (let i = 0; i < childArray.length; i++) {
    const child = childArray[i];

    if (typeof child === 'string') {
      const match = /^\s*\[([ xX])\]\s*(.*)/s.exec(child);
      if (match) {
        const isChecked = match[1].toLowerCase() === 'x';
        const remainder = match[2];
        const newChildren = [
          ...childArray.slice(0, i),
          remainder,
          ...childArray.slice(i + 1),
        ];
        return { isTask: true, initialChecked: isChecked, content: newChildren };
      }
      if (child.trim() !== '') {
        break;
      }
    } else if (isValidElement(child) && child.type === 'p') {
      const pChildArray = Children.toArray(child.props.children);
      for (let j = 0; j < pChildArray.length; j++) {
        const pChild = pChildArray[j];
        if (typeof pChild === 'string') {
          const match = /^\s*\[([ xX])\]\s*(.*)/s.exec(pChild);
          if (match) {
            const isChecked = match[1].toLowerCase() === 'x';
            const remainder = match[2];
            const newPChildren = [
              ...pChildArray.slice(0, j),
              remainder,
              ...pChildArray.slice(j + 1),
            ];
            const newP = cloneElement(child, {}, ...newPChildren);
            const newChildren = [
              ...childArray.slice(0, i),
              newP,
              ...childArray.slice(i + 1),
            ];
            return { isTask: true, initialChecked: isChecked, content: newChildren };
          }
          if (pChild.trim() !== '') break;
        }
      }
      break;
    } else if (isValidElement(child)) {
      break;
    }
  }

  return { isTask: false };
}

function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyTextToClipboard(code);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const displayLang = getLanguageLabel(language);

  return (
    <div className="code-block-container">
      <div className="code-block-header">
        <span className="code-block-badge">{displayLang}</span>
        <button
          className="code-copy-btn"
          onClick={handleCopy}
          type="button"
          aria-label={`Copy ${displayLang} code`}
        >
          {copied ? (
            <>
              <Check size={12} style={{ color: 'var(--success)' }} />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        style={oneDark}
        language={language || 'text'}
        PreTag="div"
        customStyle={{
          background: 'transparent',
          margin: 0,
          padding: '14px 16px',
          fontSize: '13px',
          lineHeight: '1.6',
          fontFamily: "'JetBrains Mono', 'Consolas', monospace",
        }}
        codeTagProps={{
          style: {
            background: 'transparent',
            fontFamily: "'JetBrains Mono', 'Consolas', monospace",
          },
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

function TaskListItem({ initialChecked, children }) {
  const [checked, setChecked] = useState(Boolean(initialChecked));
  const [prevInitialChecked, setPrevInitialChecked] = useState(Boolean(initialChecked));

  if (Boolean(initialChecked) !== prevInitialChecked) {
    setPrevInitialChecked(Boolean(initialChecked));
    setChecked(Boolean(initialChecked));
  }

  return (
    <li className={`task-list-item ${checked ? 'completed' : ''}`}>
      <input
        type="checkbox"
        className="task-checkbox"
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
        aria-label="Toggle task completion"
      />
      <span className="task-content">{children}</span>
    </li>
  );
}

function InteractiveCheckbox({ defaultChecked, ...props }) {
  const [checked, setChecked] = useState(Boolean(defaultChecked));
  const inputProps = { ...props };
  delete inputProps.disabled;

  return (
    <input
      type="checkbox"
      className="task-checkbox"
      checked={checked}
      onChange={(e) => setChecked(e.target.checked)}
      {...inputProps}
    />
  );
}

function MarkdownPre({ children, ...props }) {
  const childArray = Children.toArray(children);
  const hasCodeChild = childArray.some(
    (c) => isValidElement(c) && (c.type === MarkdownCode || c.type === 'code')
  );

  if (hasCodeChild) {
    return (
      <PreContext.Provider value={true}>
        {children}
      </PreContext.Provider>
    );
  }

  return <pre {...props}>{children}</pre>;
}

function MarkdownCode({ className, children, ...props }) {
  const isInsidePre = useContext(PreContext);
  const match = /language-(\w+)/.exec(className || '');

  if (isInsidePre || match) {
    const rawCode = getCodeString(children).replace(/\n$/, '');
    return <CodeBlock language={match ? match[1] : ''} code={rawCode} />;
  }

  return (
    <code className={className} {...props}>
      {children}
    </code>
  );
}

function MarkdownLi({ children, ...props }) {
  const task = parseTaskItem(children);
  if (task.isTask) {
    return (
      <TaskListItem initialChecked={task.initialChecked}>
        {task.content}
      </TaskListItem>
    );
  }
  return <li {...props}>{children}</li>;
}

function MarkdownInput({ type, checked, defaultChecked, ...props }) {
  if (type === 'checkbox') {
    return (
      <InteractiveCheckbox
        defaultChecked={checked !== undefined ? checked : defaultChecked}
        {...props}
      />
    );
  }
  return <input type={type} {...props} />;
}

function createHeading(Level) {
  return function MarkdownHeading({ children, className = '', ...props }) {
    const text = getNodeText(children).toLowerCase();
    let headerClass = className;

    if (text.includes('diagnosis') || text.includes('root cause')) {
      headerClass = `${headerClass} diagnosis-header diagnosis-section`.trim();
    } else if (
      text.includes('fix') ||
      text.includes('actionable') ||
      text.includes('resolution') ||
      text.includes('prevention')
    ) {
      headerClass = `${headerClass} fixes-header fixes-section`.trim();
    }

    return (
      <Level className={headerClass} {...props}>
        {children}
      </Level>
    );
  };
}

const MarkdownH2 = createHeading('h2');
const MarkdownH3 = createHeading('h3');

export default function MarkdownRenderer({ content }) {
  if (!content) return null;

  return (
    <div className="markdown-container fade-in">
      <ReactMarkdown
        components={{
          pre: MarkdownPre,
          code: MarkdownCode,
          li: MarkdownLi,
          input: MarkdownInput,
          h2: MarkdownH2,
          h3: MarkdownH3,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
