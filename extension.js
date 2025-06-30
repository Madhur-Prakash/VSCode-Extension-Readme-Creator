const vscode = require('vscode');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

// Load environment variables if .env file exists
try {
    require('dotenv').config();
} catch (error) {
    // dotenv is optional, continue without it
}

// Logging utility
class Logger {
    constructor() {
        this.outputChannel = vscode.window.createOutputChannel('README Generator');
    }

    info(message) {
        const timestamp = new Date().toISOString();
        this.outputChannel.appendLine(`[INFO ${timestamp}] ${message}`);
        console.log(`[README Generator] ${message}`);
    }

    error(message, error = null) {
        const timestamp = new Date().toISOString();
        const fullMessage = error ? `${message}: ${error.message || error}` : message;
        this.outputChannel.appendLine(`[ERROR ${timestamp}] ${fullMessage}`);
        console.error(`[README Generator] ${fullMessage}`);
        if (error && error.stack) {
            this.outputChannel.appendLine(error.stack);
        }
    }

    show() {
        this.outputChannel.show();
    }
}

// Configuration manager
class ConfigManager {
    static getConfig() {
        const config = vscode.workspace.getConfiguration('readmeGenerator');
        
        // Priority order: VS Code Settings > Environment Variables > Default
        const groqApiKey = config.get('groqApiKey', '') || 
                          process.env.GROQ_API_KEY || 
                          process.env.GROQ_API_TOKEN || '';
        
        const model = config.get('model', '') || 
                     process.env.DEFAULT_MODEL || 
                     'llama-3.3-70b-versatile';
        
        return {
            groqApiKey: groqApiKey.trim(),
            model: model.trim(),
            autoOpen: config.get('autoOpen', true)
        };
    }

    static async validateConfig() {
        const config = this.getConfig();
        if (!config.groqApiKey) {
            const result = await vscode.window.showErrorMessage(
                'Groq API Key is not configured. You can set it in VS Code settings or create a .env file.',
                'Configure in Settings',
                'Show .env Instructions',
                'Cancel'
            );
            
            if (result === 'Configure in Settings') {
                await vscode.commands.executeCommand('readmeGenerator.configure');
            } else if (result === 'Show .env Instructions') {
                await this.showEnvInstructions();
            }
            return false;
        }
        return true;
    }

    static async showEnvInstructions() {
        const message = `To use a .env file:

1. Create a .env file in your workspace root
2. Add: GROQ_API_KEY=your_api_key_here
3. Add: DEFAULT_MODEL=llama-3.3-70b-versatile (optional)
4. Restart VS Code or reload the window

The extension will automatically load these values.`;

        const result = await vscode.window.showInformationMessage(
            message,
            { modal: true },
            'Create .env Template',
            'Open Settings Instead'
        );

        if (result === 'Create .env Template') {
            await this.createEnvTemplate();
        } else if (result === 'Open Settings Instead') {
            await vscode.commands.executeCommand('readmeGenerator.configure');
        }
    }

    static async createEnvTemplate() {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder found. Please open a folder first.');
            return;
        }

        const envPath = path.join(workspaceFolder, '.env');
        const envTemplate = `# README Generator Configuration
GROQ_API_KEY=your_groq_api_key_here
DEFAULT_MODEL=llama-3.3-70b-versatile

# Get your API key from: https://console.groq.com/keys
# Available models: llama-3.3-70b-versatile, llama-3.1-70b-versatile, mixtral-8x7b-32768
`;

        try {
            if (await fs.pathExists(envPath)) {
                const result = await vscode.window.showWarningMessage(
                    '.env file already exists. Do you want to overwrite it?',
                    'Overwrite',
                    'Open Existing',
                    'Cancel'
                );
                
                if (result === 'Cancel') return;
                if (result === 'Open Existing') {
                    const envUri = vscode.Uri.file(envPath);
                    const document = await vscode.workspace.openTextDocument(envUri);
                    await vscode.window.showTextDocument(document);
                    return;
                }
            }

            await fs.writeFile(envPath, envTemplate, 'utf8');
            vscode.window.showInformationMessage('.env template created successfully!');
            
            // Open the .env file for editing
            const envUri = vscode.Uri.file(envPath);
            const document = await vscode.workspace.openTextDocument(envUri);
            await vscode.window.showTextDocument(document);
            
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to create .env file: ${error.message}`);
        }
    }
}

// Folder structure generator
class FolderStructureGenerator {
    constructor(logger, customIgnores = []) {
        this.logger = logger;
        this.customIgnores = customIgnores.map(name => name.trim()).filter(Boolean);

        this.fileComments = {
            "app.py": "main FastAPI app",
            "README.md": "Project documentation",
            ".gitignore": "gitignore file for GitHub",
            "__init__.py": "initializes package",
            "log.py": "main logic",
            "models.py": "models"
        };

        this.defaultIgnores = [
            ".git", "__pycache__", ".DS_Store", ".vscode", "node_modules", 
            ".pytest_cache", "logs", "venv", "env", "FOLDER_STRUCTURE.md",
            "dist", "build", ".env", ".next", "target", "out", ".idea", 
            ".vs", "bin", "obj", ".nyc_output", "coverage", ".cache", "tmp", "temp"
        ];
    }

    getIgnoredFiles() {
        // Combine custom ignores with default ignores
        const ignoredFiles = [...this.customIgnores, ...this.defaultIgnores];
        return [...new Set(ignoredFiles)]; // Remove duplicates
    }

    async drawTreeToMd(dirPath, prefix = "", output = [], ignoredFiles = null) {
        try {
            const files = await fs.readdir(dirPath);
            const sortedFiles = files.sort();
            
            // Use provided ignored files or get default ones
            const filesToIgnore = ignoredFiles || this.getIgnoredFiles();
            
            // Filter out ignored files
            const filteredFiles = sortedFiles.filter(file => !filesToIgnore.includes(file));
            
            for (let index = 0; index < filteredFiles.length; index++) {
                const file = filteredFiles[index];
                const filePath = path.join(dirPath, file);
                
                try {
                    const stats = await fs.stat(filePath);
                    const isLastFile = index === filteredFiles.length - 1;
                    const connector = isLastFile ? "└── " : "├── ";
                    const comment = this.fileComments[file] || "";
                    const commentStr = comment ? `  # ${comment}` : "";
                    
                    output.push(`${prefix}${connector}${file}${commentStr}`);

                    if (stats.isDirectory()) {
                        const extension = isLastFile ? "    " : "│   ";
                        await this.drawTreeToMd(filePath, prefix + extension, output, filesToIgnore);
                    }
                } catch (error) {
                    // Skip files/directories that can't be accessed
                    this.logger.error(`Cannot access: ${filePath}`, error);
                    continue;
                }
            }
        } catch (error) {
            this.logger.error(`Cannot read directory: ${dirPath}`, error);
        }

        return output;
    }

    async generate(rootPath) {
        try {
            const folderName = path.basename(rootPath.replace(/[/\\]+$/, ""));
            const ignoredFiles = this.getIgnoredFiles();
            
            this.logger.info(`Generating folder structure for: ${rootPath}`);
            
            const lines = [`${folderName}/`];
            const treeLines = await this.drawTreeToMd(rootPath, "", [], ignoredFiles);
            lines.push(...treeLines);

            const mdOutput = "```\n" + lines.join("\n") + "\n```";
            
            this.logger.info("✅ Folder structure generated successfully");
            return mdOutput;
            
        } catch (error) {
            this.logger.error("Failed to generate folder structure", error);
            throw error;
        }
    }
}

// README generator service
class ReadmeGeneratorService {
    constructor(logger) {
        this.logger = logger;
		this.sampleReadme = fs.readFileSync(path.join(__dirname, 'templates', 'prompt.md'), 'utf8');
        this.samplePrompt = this.getSamplePrompt();
    }

    getSamplePrompt() {
		// const sampleReadme = fs.readFileSync(path.join(__dirname, 'templates', 'prompt.md'), 'utf8');
		// this.logger.info('Sample README prompt loaded successfully');
		// this.logger.info(sampleReadme.slice(0, 100));  // Show first 100 characters
        return  `You are a GitHub README generator that creates clear, professional, and visually engaging README files using markdown formatting. 
		Your README should follow best practices in terms of structure, content, and presentation. You will be provided with project details, 
		including title, description, features, usage instructions, technologies used, folder structure, GitHub repository link, and other relevant information.

		Here is your task:
		- Generate a complete README using markdown.
		- Use sections in the following order: Title, Overview, Features, Technology Stack, Installation, Usage, API Endpoints (if applicable), Project Structure (include this section *only* if the folder structure is provided), Future Enhancements, Contribution Guidelines, License, Author.
		- Make sure section headers are formatted using markdown syntax (e.g., \`##\`, \`###\`).
		- Use bullet points, code blocks, and section dividers (\`---\`) where appropriate for clarity and aesthetics.
		- Avoid any commentary, explanation, or meta-text — return *only* the final README content in markdown.

		Give only markdown output, do not include any other text or explanation.

		As for author use username from the repo link, if not available use "Your Name".

		And as for license use MIT License.

		Give the folder structure in the Project Structure section only if it is provided, otherwise skip this section.

		Follow these rules strictly:
		Give the installation steps exaxtly as provided in the ${this.sampleReadme} file. Do not modify the installation steps.
		Give the usage instructions exactly as provided in the ${this.sampleReadme} file. Do not modify the usage instructions.
		
		Don't give lines like (\`here's the output:\`) or "Here's the generated README:" or "Here is the README:"
		
		Just give the output in markdown, no other text.
		Use the following sample README as a reference for structure and formatting:
		
		Here is a sample README structure to use as reference:
		${this.sampleReadme}

		Ensure the output closely follows this format. Be concise, complete, and clear.`;
    }

    async generateSummary(inputPrompt, repoLink, folderStructure, config) {
        try {
            const userPrompt = `Project information to include in the README: ${inputPrompt || 'No specific project description provided.'}
GitHub repository link: ${repoLink}
Folder structure: ${folderStructure || 'No folder structure provided.'}`;

            const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
                model: config.model,
                messages: [
                    { role: 'system', content: this.samplePrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7,
                max_tokens: 4000,
                top_p: 1,
                stream: false
            }, {
                headers: {
                    'Authorization': `Bearer ${config.groqApiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });

            if (!response.data || !response.data.choices || !response.data.choices[0]) {
                throw new Error('Invalid response from Groq API');
            }

            const content = response.data.choices[0].message.content;
            this.logger.info('README generated successfully');
            return content.trim();

        } catch (error) {
            this.logger.error('Error generating README', error);
            
            if (error.response) {
                const status = error.response.status;
                const message = error.response.data?.error?.message || 'Unknown API error';
                throw new Error(`API Error (${status}): ${message}`);
            } else if (error.code === 'ENOTFOUND') {
                throw new Error('Network error: Unable to connect to Groq API');
            } else {
                throw new Error(`Generation failed: ${error.message}`);
            }
        }
    }
}

// Input collector
class InputCollector {
    static async collectProjectInfo(uri) {
        // Determine workspace folder
        let workspaceFolder;
        if (uri && uri.fsPath) {
            const stat = await fs.stat(uri.fsPath);
            workspaceFolder = stat.isDirectory() ? uri.fsPath : path.dirname(uri.fsPath);
        } else if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
        } else {
            throw new Error('No workspace folder found. Please open a folder first.');
        }

        // Multi-step input collection
        const projectOverview = await vscode.window.showInputBox({
            prompt: 'Step 1/3: Enter project overview (optional)',
            placeHolder: 'e.g., This project is a web application for managing tasks...',
            ignoreFocusOut: true
        });

        if (projectOverview === undefined) {
            return null; // User cancelled
        }

        const repoLink = await vscode.window.showInputBox({
            prompt: 'Step 2/3: Enter GitHub repository link',
            placeHolder: 'e.g., https://github.com/username/project-name',
            ignoreFocusOut: true,
            validateInput: (value) => {
                if (!value || !value.trim()) {
                    return 'Repository link is required';
                }
                if (!value.includes('github.com')) {
                    return 'Please enter a valid GitHub URL';
                }
                return null;
            }
        });

		const extraIgnores = await vscode.window.showInputBox({
			prompt: 'Step 3/3: Enter additional folders/files to ignore (comma-separated, optional)',
			placeHolder: 'e.g., coverage,temp,.cache',
			ignoreFocusOut: true
		});


        if (!repoLink) {
            return null; // User cancelled or invalid input
        }

        return {
            projectOverview: projectOverview.trim(),
            repoLink: repoLink.trim(),
            workspaceFolder,
			extraIgnores: extraIgnores? extraIgnores.split(',').map(x => x.trim()).filter(Boolean) : []
        };
    }
}

// File manager
class FileManager {
    static async saveReadme(content, workspacePath, autoOpen = true) {
        const readmePath = path.join(workspacePath, 'README.md');
        
        // Check if README already exists
        if (await fs.pathExists(readmePath)) {
            const result = await vscode.window.showWarningMessage(
                'README.md already exists. What would you like to do?',
                { modal: true },
                'Overwrite',
                'Create Backup',
                'Cancel'
            );
            
            if (result === 'Cancel' || !result) {
                throw new Error('Operation cancelled by user');
            }
            
            if (result === 'Create Backup') {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const backupPath = path.join(workspacePath, `README.backup.${timestamp}.md`);
                await fs.copy(readmePath, backupPath);
                vscode.window.showInformationMessage(`Backup created: ${path.basename(backupPath)}`);
            }
        }
        
        await fs.writeFile(readmePath, content, 'utf8');
        
        if (autoOpen) {
            const readmeUri = vscode.Uri.file(readmePath);
            const document = await vscode.workspace.openTextDocument(readmeUri);
            await vscode.window.showTextDocument(document, { preview: false });
        }
        
        return readmePath;
    }
}

// Main extension class
class ReadmeGeneratorExtension {
    constructor(context) {
        this.context = context;
        this.logger = new Logger();
        this.generatorService = new ReadmeGeneratorService(this.logger);
        this.registerCommands();
    }

    registerCommands() {
        const commands = [
            vscode.commands.registerCommand('readmeGenerator.generate', this.generateReadme.bind(this)),
            vscode.commands.registerCommand('readmeGenerator.configure', this.configure.bind(this)),
            vscode.commands.registerCommand('readmeGenerator.preview', this.previewReadme.bind(this)),
            vscode.commands.registerCommand('readmeGenerator.createEnvTemplate', this.createEnvTemplate.bind(this))
        ];

        commands.forEach(command => this.context.subscriptions.push(command));
    }

    async generateReadme(uri) {
        try {
            // Validate configuration
            if (!await ConfigManager.validateConfig()) {
                return;
            }

            const config = ConfigManager.getConfig();
            
            // Collect project information
            const projectInfo = await InputCollector.collectProjectInfo(uri);
            if (!projectInfo) {
                return; // User cancelled
            }

            // Generate folder structure
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Analyzing project structure...",
                cancellable: false
            }, async (progress) => {
                const structureGenerator = new FolderStructureGenerator(this.logger, projectInfo.extraIgnores);
                projectInfo.folderStructure = await structureGenerator.generate(projectInfo.workspaceFolder);
            });

            // Generate README content
            let readmeContent;
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Generating README with AI...",
                cancellable: false
            }, async (progress) => {
                readmeContent = await this.generatorService.generateSummary(
                    projectInfo.projectOverview,
                    projectInfo.repoLink,
                    projectInfo.folderStructure,
                    config
                );
            });

            // Save README file
            const readmePath = await FileManager.saveReadme(
                readmeContent, 
                projectInfo.workspaceFolder, 
                config.autoOpen
            );

            // Show success message with actions
            const result = await vscode.window.showInformationMessage(
                'README.md generated successfully!',
                'Open File',
                'Show in Explorer',
                'View Logs'
            );

            switch (result) {
                case 'Open File':
                    const readmeUri = vscode.Uri.file(readmePath);
                    const document = await vscode.workspace.openTextDocument(readmeUri);
                    await vscode.window.showTextDocument(document);
                    break;
                case 'Show in Explorer':
                    await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(readmePath));
                    break;
                case 'View Logs':
                    this.logger.show();
                    break;
            }

        } catch (error) {
            this.logger.error('README generation failed', error);
            const result = await vscode.window.showErrorMessage(
                `Failed to generate README: ${error.message}`,
                'View Logs',
                'Try Again'
            );
            
            if (result === 'View Logs') {
                this.logger.show();
            } else if (result === 'Try Again') {
                await this.generateReadme(uri);
            }
        }
    }

    async configure() {
        const config = ConfigManager.getConfig();
        
        // Show current source of API key
        let currentSource = 'Not configured';
        if (config.groqApiKey) {
            const vsCodeSetting = vscode.workspace.getConfiguration('readmeGenerator').get('groqApiKey', '');
            if (vsCodeSetting) {
                currentSource = 'VS Code Settings';
            } else if (process.env.GROQ_API_KEY || process.env.GROQ_API_TOKEN) {
                currentSource = 'Environment Variable';
            }
        }

        const options = [
            'Configure in VS Code Settings',
            'Create/Edit .env File',
            'Show Current Configuration'
        ];

        const choice = await vscode.window.showQuickPick(options, {
            placeHolder: `Current API Key Source: ${currentSource}`
        });

        switch (choice) {
            case 'Configure in VS Code Settings':
                await this.configureInSettings();
                break;
            case 'Create/Edit .env File':
                await ConfigManager.showEnvInstructions();
                break;
            case 'Show Current Configuration':
                await this.showCurrentConfig();
                break;
        }
    }

    async configureInSettings() {
        const config = ConfigManager.getConfig();
        
        const apiKey = await vscode.window.showInputBox({
            prompt: 'Enter your Groq API Key',
            value: vscode.workspace.getConfiguration('readmeGenerator').get('groqApiKey', ''),
            password: true,
            ignoreFocusOut: true,
            placeHolder: 'gsk_...'
        });

        if (apiKey !== undefined) {
            await vscode.workspace.getConfiguration('readmeGenerator').update(
                'groqApiKey', 
                apiKey, 
                vscode.ConfigurationTarget.Global
            );
            
            if (apiKey.trim()) {
                vscode.window.showInformationMessage('API Key configured in VS Code settings successfully!');
            } else {
                vscode.window.showWarningMessage('API Key cleared from VS Code settings.');
            }
        }
    }

    async showCurrentConfig() {
        const config = ConfigManager.getConfig();
        const vsCodeSetting = vscode.workspace.getConfiguration('readmeGenerator').get('groqApiKey', '');
        
        let details = '**README Generator Configuration**\n\n';
        details += `**API Key Source:**\n`;
        
        if (vsCodeSetting) {
            details += `✅ VS Code Settings: ${vsCodeSetting.substring(0, 8)}...\n`;
        } else {
            details += `❌ VS Code Settings: Not set\n`;
        }
        
        if (process.env.GROQ_API_KEY) {
            details += `✅ GROQ_API_KEY: ${process.env.GROQ_API_KEY.substring(0, 8)}...\n`;
        } else {
            details += `❌ GROQ_API_KEY: Not set\n`;
        }
        
        if (process.env.GROQ_API_TOKEN) {
            details += `✅ GROQ_API_TOKEN: ${process.env.GROQ_API_TOKEN.substring(0, 8)}...\n`;
        } else {
            details += `❌ GROQ_API_TOKEN: Not set\n`;
        }
        
        details += `\n**Current Effective Values:**\n`;
        details += `• API Key: ${config.groqApiKey ? `${config.groqApiKey.substring(0, 8)}...` : 'Not configured'}\n`;
        details += `• Model: ${config.model}\n`;
        details += `• Max Depth: ${config.maxDepth}\n`;
        details += `• Auto Open: ${config.autoOpen}\n`;

        const panel = vscode.window.createWebviewPanel(
            'readmeConfig',
            'README Generator Configuration',
            vscode.ViewColumn.One,
            {}
        );

        panel.webview.html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Configuration</title>
                <style>
                    body { font-family: var(--vscode-font-family); padding: 20px; }
                    .config-item { margin-bottom: 10px; }
                    .success { color: var(--vscode-charts-green); }
                    .error { color: var(--vscode-charts-red); }
                </style>
            </head>
            <body>
                <div style="white-space: pre-line;">${details}</div>
            </body>
            </html>
        `;
    }

    async createEnvTemplate() {
        await ConfigManager.createEnvTemplate();
    }

    async previewReadme() {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            vscode.window.showErrorMessage('No active editor found.');
            return;
        }

        const document = activeEditor.document;
        if (path.basename(document.fileName) !== 'README.md') {
            vscode.window.showErrorMessage('Please open a README.md file first.');
            return;
        }

        await vscode.commands.executeCommand('markdown.showPreviewToSide', document.uri);
    }
}

// Extension activation
function activate(context) {
    console.log('README Generator extension is now active!');
    new ReadmeGeneratorExtension(context);
}

function deactivate() {
    console.log('README Generator extension is now deactivated!');
}

module.exports = {
    activate,
    deactivate
};