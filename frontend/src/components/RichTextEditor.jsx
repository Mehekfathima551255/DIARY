import React, { useRef, useEffect, useCallback } from 'react';

// Toolbar button definitions
const TOOLS = [
    { cmd: 'bold',          icon: 'bx-bold',           title: 'Bold (Ctrl+B)' },
    { cmd: 'italic',        icon: 'bx-italic',         title: 'Italic (Ctrl+I)' },
    { cmd: 'underline',     icon: 'bx-underline',      title: 'Underline (Ctrl+U)' },
    { cmd: 'strikeThrough', icon: 'bx-strikethrough',  title: 'Strikethrough' },
    { type: 'sep' },
    { cmd: 'insertUnorderedList', icon: 'bx-list-ul',  title: 'Bullet list' },
    { cmd: 'insertOrderedList',   icon: 'bx-list-ol',  title: 'Numbered list' },
    { type: 'sep' },
    { cmd: 'justifyLeft',   icon: 'bx-align-left',     title: 'Align left' },
    { cmd: 'justifyCenter', icon: 'bx-align-middle',   title: 'Center' },
    { cmd: 'justifyRight',  icon: 'bx-align-right',    title: 'Align right' },
    { type: 'sep' },
    { cmd: 'removeFormat',  icon: 'bx-eraser',         title: 'Clear formatting' },
];

const HEADINGS = [
    { value: 'p',  label: 'Paragraph' },
    { value: 'h1', label: 'Heading 1' },
    { value: 'h2', label: 'Heading 2' },
    { value: 'h3', label: 'Heading 3' },
];

export default function RichTextEditor({ value, onChange, placeholder = 'Start writing…' }) {
    const editorRef = useRef(null);
    // Track whether the last change came from outside (prop) or inside (user typing)
    const isInternalChange = useRef(false);

    // Sync external value → DOM only when it differs (e.g. AI tools updating content)
    useEffect(() => {
        if (!editorRef.current) return;
        if (isInternalChange.current) { isInternalChange.current = false; return; }
        if (editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value || '';
        }
    }, [value]);

    const handleInput = useCallback(() => {
        isInternalChange.current = true;
        onChange(editorRef.current?.innerHTML || '');
    }, [onChange]);

    const exec = (cmd, val = null) => {
        editorRef.current?.focus();
        document.execCommand(cmd, false, val);
        // Trigger onChange so state reflects formatting
        handleInput();
    };

    const applyHeading = (tag) => {
        editorRef.current?.focus();
        document.execCommand('formatBlock', false, tag);
        handleInput();
    };

    const isActive = (cmd) => {
        try { return document.queryCommandState(cmd); } catch { return false; }
    };

    // Paste as plain text to avoid pasting foreign HTML styles
    const handlePaste = (e) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
    };

    return (
        <div className="rte-wrap">
            {/* Toolbar */}
            <div className="rte-toolbar">
                {/* Heading selector */}
                <select
                    className="rte-heading-sel"
                    defaultValue="p"
                    onChange={(e) => applyHeading(e.target.value)}
                    title="Text style"
                >
                    {HEADINGS.map((h) => (
                        <option key={h.value} value={h.value}>{h.label}</option>
                    ))}
                </select>

                {/* Separator */}
                <div className="rte-sep" />

                {TOOLS.map((t, i) => {
                    if (t.type === 'sep') return <div key={`sep-${i}`} className="rte-sep" />;
                    return (
                        <button
                            key={t.cmd}
                            type="button"
                            className={`rte-btn${isActive(t.cmd) ? ' active' : ''}`}
                            title={t.title}
                            onMouseDown={(e) => {
                                e.preventDefault(); // keep focus in editor
                                exec(t.cmd);
                            }}
                        >
                            <i className={`bx ${t.icon}`} />
                        </button>
                    );
                })}
            </div>

            {/* Editable area */}
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                className="rte-body"
                onInput={handleInput}
                onPaste={handlePaste}
                data-placeholder={placeholder}
                spellCheck
            />
        </div>
    );
}
