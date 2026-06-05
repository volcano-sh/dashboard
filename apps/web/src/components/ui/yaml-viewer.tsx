import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import yamlLang from 'react-syntax-highlighter/dist/esm/languages/hljs/yaml';
import { vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs';

SyntaxHighlighter.registerLanguage('yaml', yamlLang);

export function YamlViewer({ yaml }: { yaml: string | undefined }) {
    if (!yaml) return null;
    
    return (
        <div className="rounded-lg overflow-hidden text-sm border border-gray-800">
            <SyntaxHighlighter language="yaml" style={vs2015} customStyle={{ margin: 0, padding: '1rem', backgroundColor: '#111827' }}>
                {yaml}
            </SyntaxHighlighter>
        </div>
    );
}
