import { useState, useEffect } from 'react';
import { Bold, Italic, List, ListOrdered, Code, Heading1, Heading2, Link as LinkIcon, Quote, Save } from 'lucide-react';
import { Note } from '../types';

interface MarkdownEditorProps {
  note: Note;
  onUpdate: (id: string, title: string, content: string) => void;
}

export default function MarkdownEditor({ note, onUpdate }: MarkdownEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [showPreview, setShowPreview] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
    setHasChanges(false);
  }, [note.id]);

  useEffect(() => {
    if (title !== note.title || content !== note.content) {
      setHasChanges(true);
    } else {
      setHasChanges(false);
    }
  }, [title, content, note]);

  const handleSave = () => {
    onUpdate(note.id, title, content);
    setHasChanges(false);
  };

  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = document.getElementById('markdown-content') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText = content.substring(0, start) + before + selectedText + after + content.substring(end);

    setContent(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const renderMarkdown = (text: string): string => {
    let html = text;

    html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mb-2 mt-4">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mb-3 mt-5">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-4 mt-6">$1</h1>');

    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    html = html.replace(/`(.+?)`/g, '<code class="bg-gray-800 px-2 py-1 rounded text-sm text-blue-300">$1</code>');

    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');

    const lines = html.split('\n');
    const processedLines: string[] = [];
    let inUnorderedList = false;
    let inOrderedList = false;
    let inBlockquote = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.match(/^\* (.+)/)) {
        if (!inUnorderedList) {
          processedLines.push('<ul class="list-disc my-2 ml-6">');
          inUnorderedList = true;
        }
        processedLines.push(`<li>${line.substring(2)}</li>`);
      } else if (line.match(/^\d+\. (.+)/)) {
        if (!inOrderedList) {
          processedLines.push('<ol class="list-decimal my-2 ml-6">');
          inOrderedList = true;
        }
        processedLines.push(`<li>${line.replace(/^\d+\.\s/, '')}</li>`);
      } else if (line.match(/^\> (.+)/)) {
        const content = line.substring(2);
        processedLines.push(`<blockquote class="border-l-4 border-blue-500 pl-4 py-2 my-2 italic text-gray-300">${content}</blockquote>`);
      } else {
        if (inUnorderedList) {
          processedLines.push('</ul>');
          inUnorderedList = false;
        }
        if (inOrderedList) {
          processedLines.push('</ol>');
          inOrderedList = false;
        }
        processedLines.push(line);
      }
    }

    if (inUnorderedList) processedLines.push('</ul>');
    if (inOrderedList) processedLines.push('</ol>');

    html = processedLines.join('\n');

    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    html = html.replace(/\n\n/g, '</p><p class="mb-3">');
    html = '<p class="mb-3">' + html + '</p>';

    html = html.replace(/\n/g, '<br>');

    return html;
  };

  const markdownButtons = [
    { icon: Bold, label: 'Bold', action: () => insertMarkdown('**', '**') },
    { icon: Italic, label: 'Italic', action: () => insertMarkdown('*', '*') },
    { icon: Code, label: 'Code', action: () => insertMarkdown('`', '`') },
    { icon: Heading1, label: 'Heading 1', action: () => insertMarkdown('# ', '') },
    { icon: Heading2, label: 'Heading 2', action: () => insertMarkdown('## ', '') },
    { icon: List, label: 'Bullet List', action: () => insertMarkdown('* ', '') },
    { icon: ListOrdered, label: 'Numbered List', action: () => insertMarkdown('1. ', '') },
    { icon: LinkIcon, label: 'Link', action: () => insertMarkdown('[', '](url)') },
    { icon: Quote, label: 'Quote', action: () => insertMarkdown('> ', '') },
  ];

  return (
    <div className="h-full flex flex-col bg-[rgb(var(--background))]">
      <div className="p-4 border-b border-[rgb(var(--border))] bg-[rgb(var(--card))]">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-2xl font-bold bg-transparent border-none focus:outline-none mb-2"
          placeholder="Note title..."
        />
        <div className="flex items-center justify-between">
          <div className="flex gap-1 flex-wrap">
            {markdownButtons.map((btn) => {
              const Icon = btn.icon;
              return (
                <button
                  key={btn.label}
                  onClick={btn.action}
                  className="p-2 hover:bg-[rgb(var(--background))] rounded-lg transition-colors"
                  title={btn.label}
                >
                  <Icon className="w-5 h-5" />
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                showPreview
                  ? 'bg-blue-500 text-white'
                  : 'bg-[rgb(var(--background))] hover:bg-gray-700'
              }`}
            >
              {showPreview ? 'Edit' : 'Preview'}
            </button>
            {hasChanges && (
              <button
                onClick={handleSave}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-4 py-2 rounded-lg transition-all text-sm font-medium"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {showPreview ? (
          <div
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
          />
        ) : (
          <textarea
            id="markdown-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full bg-transparent border-none focus:outline-none resize-none font-mono text-sm"
            placeholder="Start writing your note... (Markdown supported)"
          />
        )}
      </div>

      {!showPreview && (
        <div className="p-4 border-t border-[rgb(var(--border))] bg-[rgb(var(--card))]">
          <div className="text-xs text-gray-500">
            <p className="mb-1">Markdown Quick Reference:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <span><code>**bold**</code></span>
              <span><code>*italic*</code></span>
              <span><code>`code`</code></span>
              <span><code># Heading</code></span>
              <span><code>* List item</code></span>
              <span><code>1. Numbered</code></span>
              <span><code>[link](url)</code></span>
              <span><code>&gt; Quote</code></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
