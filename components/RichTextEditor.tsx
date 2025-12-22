import React from 'react';
// @ts-ignore
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { useTheme } from '../hooks/useTheme';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
    value,
    onChange,
    placeholder,
    className = ""
}) => {
    const theme = useTheme();

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link', 'clean']
        ],
    };

    const formats = [
        'header',
        'bold', 'italic', 'underline', 'strike',
        'list', 'bullet',
        'link'
    ];

    return (
        <div className={`rich-text-editor-wrapper ${className}`}>
            <style>{`
                .ql-toolbar {
                    border-top-left-radius: 0.75rem;
                    border-top-right-radius: 0.75rem;
                    border-color: #e2e8f0 !important;
                    background-color: #f8fafc;
                }
                .dark .ql-toolbar {
                    background-color: #1e293b;
                    border-color: #334155 !important;
                }
                .dark .ql-stroke {
                    stroke: #94a3b8 !important;
                }
                .dark .ql-fill {
                    fill: #94a3b8 !important;
                }
                .dark .ql-picker {
                    color: #94a3b8 !important;
                }
                .ql-container {
                    border-bottom-left-radius: 0.75rem;
                    border-bottom-right-radius: 0.75rem;
                    border-color: #e2e8f0 !important;
                    background-color: white;
                    font-family: inherit !important;
                    font-size: 1rem !important;
                }
                .dark .ql-container {
                    background-color: #0f172a; /* slate-900 */
                    border-color: #334155 !important;
                    color: white;
                }
                .ql-editor {
                    min-height: 150px;
                }
                .ql-editor.ql-blank::before {
                    color: #94a3b8;
                    font-style: normal;
                }
            `}</style>
            <ReactQuill
                theme="snow"
                value={value}
                onChange={onChange}
                modules={modules}
                formats={formats}
                placeholder={placeholder}
                className="rounded-xl overflow-hidden"
            />
        </div>
    );
};
