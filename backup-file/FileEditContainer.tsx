import type { LanguageDescription } from '@codemirror/language';
import { languages } from '@codemirror/language-data';
import { dirname } from 'pathe';
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import tw from 'twin.macro';
import Editor from '@monaco-editor/react';

import { httpErrorToHuman } from '@/api/http';
import { getFileContents, saveFileContents } from '@/api/server/files';
import FlashMessageRender from '@/components/FlashMessageRender';
import { Button } from '@elements/button';
import Can from '@elements/Can';
import Select from '@elements/Select';
import PageContentBlock from '@elements/PageContentBlock';
import { ServerError } from '@elements/ScreenBlock';
import SpinnerOverlay from '@elements/SpinnerOverlay';
import FileManagerBreadcrumbs from '@/components/server/files/FileManagerBreadcrumbs';
import FileNameModal from '@/components/server/files/FileNameModal';
import ErrorBoundary from '@elements/ErrorBoundary';
import { Editor as CustomEditor } from '@elements/editor';
import useFlash from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';
import { encodePathSegments } from '@/helpers';

// Hook to detect if device is mobile
const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        checkIsMobile();
        window.addEventListener('resize', checkIsMobile);
        return () => window.removeEventListener('resize', checkIsMobile);
    }, []);

    return isMobile;
};

// Function to get Monaco language from file extension
const getMonacoLanguage = (filename: string): string => {
    const extension = filename.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
        js: 'javascript',
        jsx: 'javascript',
        ts: 'typescript',
        tsx: 'typescript',
        json: 'json',
        html: 'html',
        css: 'css',
        scss: 'scss',
        sass: 'scss',
        less: 'less',
        xml: 'xml',
        yml: 'yaml',
        yaml: 'yaml',
        md: 'markdown',
        py: 'python',
        java: 'java',
        c: 'c',
        cpp: 'cpp',
        cs: 'csharp',
        php: 'php',
        rb: 'ruby',
        go: 'go',
        rs: 'rust',
        sql: 'sql',
        sh: 'shell',
        bash: 'shell',
        dockerfile: 'dockerfile',
        ini: 'ini',
        conf: 'ini',
        log: 'plaintext',
        txt: 'plaintext',
    };

    return languageMap[extension || ''] || 'plaintext';
};

export default () => {
    const [error, setError] = useState('');
    const { action, '*': rawFilename } = useParams<{ action: 'edit' | 'new'; '*': string }>();
    const [loading, setLoading] = useState(action === 'edit');
    const [content, setContent] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [language, setLanguage] = useState<LanguageDescription>();
    const [filename, setFilename] = useState<string>('');

    const isMobile = useIsMobile();

    useEffect(() => {
        setFilename(decodeURIComponent(rawFilename ?? ''));
    }, [rawFilename]);

    const navigate = useNavigate();

    const id = ServerContext.useStoreState(state => state.server.data!.id);
    const uuid = ServerContext.useStoreState(state => state.server.data!.uuid);
    const setDirectory = ServerContext.useStoreActions(actions => actions.files.setDirectory);
    const { addError, clearFlashes } = useFlash();

    let fetchFileContent: null | (() => Promise<string>) = null;

    useEffect(() => {
        if (action === 'new') {
            return;
        }

        if (filename === '') {
            return;
        }

        setError('');
        setLoading(true);
        setDirectory(dirname(filename));
        getFileContents(uuid, filename)
            .then(setContent)
            .catch(error => {
                console.error(error);
                setError(httpErrorToHuman(error));
            })
            .then(() => setLoading(false));
    }, [action, uuid, filename]);

    const save = (name?: string) => {
        const contentToSave = isMobile
            ? fetchFileContent
                ? fetchFileContent()
                : Promise.resolve(content)
            : Promise.resolve(content);

        setLoading(true);
        clearFlashes('files:view');

        contentToSave
            .then(content => saveFileContents(uuid, name ?? filename, content))
            .then(() => {
                if (name) {
                    navigate(`/server/${id}/files/edit/${encodePathSegments(name)}`);
                    return;
                }
                return Promise.resolve();
            })
            .catch(error => {
                console.error(error);
                addError({ message: httpErrorToHuman(error), key: 'files:view' });
            })
            .then(() => setLoading(false));
    };

    const handleSave = () => {
        if (action !== 'edit') {
            setModalVisible(true);
        } else {
            save();
        }
    };

    // Monaco Editor event handlers
    const handleEditorDidMount = (editor: any, monaco: any) => {
        editor.focus();
        editor.trigger('', 'editor.action.triggerSuggest', {});
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space, () => {
            editor.trigger('', 'editor.action.triggerSuggest', {});
        });
        monaco.editor.defineTheme('dark-theme', {
            base: 'vs-dark',
            inherit: true,
            rules: [],
            colors: {
                'editor.background': '#1a202c',
                'editor.lineHighlightBackground': '#2d3748',
            },
        });

        // Set the theme
        monaco.editor.setTheme('dark-theme');

        // Add save command (Ctrl+S / Cmd+S)
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            handleSave();
        });
    };

    const handleEditorChange = (value: string | undefined) => {
        setContent(value || '');
    };

    if (error) {
        return <ServerError message={error} />;
    }

    return (
        <PageContentBlock>
            <FlashMessageRender byKey={'files:view'} css={tw`mb-4`} />

            <ErrorBoundary>
                <div css={tw`mb-4`}>
                    <FileManagerBreadcrumbs withinFileEditor isNewFile={action !== 'edit'} />
                </div>
            </ErrorBoundary>

            {filename === '.pteroignore' ? (
                <div css={tw`mb-4 p-4 border-l-4 bg-neutral-900 rounded border-cyan-400`}>
                    <p css={tw`text-neutral-300 text-sm`}>
                        You&apos;re editing a <code css={tw`font-mono bg-black rounded py-px px-1`}>.pteroignore</code>{' '}
                        file. Any files or directories listed in here will be excluded from backups. Wildcards are
                        supported by using an asterisk (<code css={tw`font-mono bg-black rounded py-px px-1`}>*</code>).
                        You can negate a prior rule by prepending an exclamation point (
                        <code css={tw`font-mono bg-black rounded py-px px-1`}>!</code>).
                    </p>
                </div>
            ) : null}

            <FileNameModal
                visible={modalVisible}
                onDismissed={() => setModalVisible(false)}
                onFileNamed={name => {
                    setModalVisible(false);
                    save(name);
                }}
            />

            <div css={tw`relative`}>
                <SpinnerOverlay visible={loading} />

                {/* 電腦版使用 Monaco Editor */}
                {!isMobile ? (
                    <div css={tw`rounded-md border border-neutral-700 overflow-hidden`}>
                        <Editor
                            height="calc(100vh - 20rem)"
                            language={getMonacoLanguage(filename)}
                            theme="vscode-dark"
                            value={content}
                            onMount={handleEditorDidMount}
                            onChange={handleEditorChange}
                            options={{
                                automaticLayout: true,
                                minimap: {
                                    enabled: true,
                                    side: 'right',
                                    size: 'proportional',
                                    maxColumn: 120,
                                },

                                scrollBeyondLastLine: false,
                                wordWrap: 'on',
                                fontSize: 14,
                                fontFamily:
                                    '"Cascadia Code", "Fira Code", "Source Code Pro", Monaco, Menlo, "Ubuntu Mono", Consolas, monospace',
                                fontWeight: '400',
                                lineHeight: 1.5,
                                letterSpacing: 0.5,
                                lineNumbers: 'on',
                                lineNumbersMinChars: 3,
                                renderLineHighlight: 'all',
                                renderLineHighlightOnlyWhenFocus: false,
                                selectOnLineNumbers: true,
                                smoothScrolling: true,
                                cursorBlinking: 'smooth',
                                cursorSmoothCaretAnimation: 'on',
                                cursorStyle: 'line',
                                cursorWidth: 2,

                                // Indentation
                                tabSize: 2,
                                insertSpaces: true,
                                detectIndentation: true,
                                trimAutoWhitespace: true,
                                autoIndent: 'full',

                                // Code folding
                                folding: true,
                                foldingHighlight: true,
                                foldingStrategy: 'auto',
                                showFoldingControls: 'mouseover',
                                foldingMaximumRegions: 5000,

                                // Bracket matching
                                matchBrackets: 'always',
                                autoClosingBrackets: 'always',
                                autoClosingQuotes: 'always',
                                autoClosingOvertype: 'always',
                                autoSurround: 'languageDefined',

                                // Formatting
                                formatOnType: true,
                                formatOnPaste: true,

                                // Suggestions
                                quickSuggestions: {
                                    other: true,
                                    comments: true, // 改为 true
                                    strings: true, // 改为 true
                                },
                                suggestOnTriggerCharacters: true,
                                acceptSuggestionOnCommitCharacter: true,
                                acceptSuggestionOnEnter: 'on',
                                wordBasedSuggestions: 'allDocuments', // 添加这行
                                suggest: {
                                    // 添加整个 suggest 配置块
                                    insertMode: 'insert',
                                    filterGraceful: true,
                                    localityBonus: true,
                                    shareSuggestSelections: true,
                                    snippetsPreventQuickSuggestions: false,
                                    showIcons: true,
                                    showMethods: true,
                                    showFunctions: true,
                                    showConstructors: true,
                                    showFields: true,
                                    showVariables: true,
                                    showClasses: true,
                                    showStructs: true,
                                    showInterfaces: true,
                                    showModules: true,
                                    showProperties: true,
                                    showEvents: true,
                                    showOperators: true,
                                    showUnits: true,
                                    showValues: true,
                                    showConstants: true,
                                    showEnums: true,
                                    showEnumMembers: true,
                                    showKeywords: true,
                                    showWords: true,
                                    showColors: true,
                                    showFiles: true,
                                    showReferences: true,
                                    showFolders: true,
                                    showTypeParameters: true,
                                    showSnippets: true,
                                },

                                // Advanced features
                                occurrencesHighlight: 'singleFile',
                                codeLens: true,
                                colorDecorators: true,
                                contextmenu: true,
                                mouseWheelZoom: true,
                                multiCursorModifier: 'ctrlCmd',
                                selectionHighlight: true,
                                find: {
                                    addExtraSpaceOnTop: true,
                                    autoFindInSelection: 'never',
                                    seedSearchStringFromSelection: 'always',
                                },

                                // Accessibility
                                accessibilitySupport: 'auto',

                                // Performance
                                disableLayerHinting: false,
                                disableMonospaceOptimizations: false,

                                // Scrolling
                                scrollbar: {
                                    useShadows: false,
                                    verticalHasArrows: false,
                                    horizontalHasArrows: false,
                                    vertical: 'auto',
                                    horizontal: 'auto',
                                    verticalScrollbarSize: 14,
                                    horizontalScrollbarSize: 14,
                                },

                                // Hover
                                hover: {
                                    enabled: true,
                                    delay: 300,
                                    sticky: true,
                                },

                                // Parameter hints
                                parameterHints: {
                                    enabled: true,
                                    cycle: false,
                                },
                            }}
                            loading={
                                <div css={tw`flex items-center justify-center h-full text-neutral-400 bg-[#1E1E1E]`}>
                                    <div css={tw`text-center`}>
                                        <div
                                            css={tw`animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2`}
                                        ></div>
                                        <div>Loading editor...</div>
                                    </div>
                                </div>
                            }
                        />
                    </div>
                ) : (
                    /* 手機版使用原本的 Editor */
                    <CustomEditor
                        style={{ height: 'calc(100vh - 20rem)' }}
                        childClassName={tw`rounded-md h-full`}
                        filename={filename}
                        initialContent={content}
                        language={language}
                        onLanguageChanged={l => {
                            setLanguage(l);
                        }}
                        fetchContent={value => {
                            fetchFileContent = value;
                        }}
                        onContentSaved={handleSave}
                    />
                )}
            </div>

            <div css={tw`flex justify-end mt-4`}>
                {/* 只在手機版顯示語言選擇器 */}
                {isMobile && (
                    <div css={tw`flex-1 sm:flex-none rounded bg-neutral-900 mr-4`}>
                        <Select
                            value={language?.name ?? ''}
                            onChange={e => {
                                setLanguage(languages.find(l => l.name === e.target.value));
                            }}
                        >
                            {languages.map(language => (
                                <option key={language.name} value={language.name}>
                                    {language.name}
                                </option>
                            ))}
                        </Select>
                    </div>
                )}

                {action === 'edit' ? (
                    <Can action={'file.update'}>
                        <Button css={tw`flex-1 sm:flex-none`} onClick={() => save()}>
                            Save Content
                        </Button>
                    </Can>
                ) : (
                    <Can action={'file.create'}>
                        <Button css={tw`flex-1 sm:flex-none`} onClick={() => setModalVisible(true)}>
                            Create File
                        </Button>
                    </Can>
                )}
            </div>
        </PageContentBlock>
    );
};
