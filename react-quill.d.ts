declare module 'react-quill' {
    import React from 'react';

    export interface ReactQuillProps {
        theme?: string;
        value?: string;
        defaultValue?: string;
        readOnly?: boolean;
        placeholder?: string;
        modules?: any;
        formats?: string[];
        onChange?: (value: string, delta: any, source: string, editor: any) => void;
        className?: string;
        style?: React.CSSProperties;
    }

    export default class ReactQuill extends React.Component<ReactQuillProps> { }
}
