"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileSyncDatabase = void 0;
const document_database_1 = require("./document-database");
const sync_utils_1 = require("./sync-utils");
const chokidar_1 = __importDefault(require("chokidar"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
class FileSyncDatabase extends document_database_1.DocumentDatabase {
    constructor(dbPath, options) {
        var _a, _b;
        super(dbPath);
        this.watchers = [];
        this.personasDir = (options === null || options === void 0 ? void 0 : options.personasDir) || path_1.default.join(process.cwd(), 'src', 'personas');
        this.templatesDir = (options === null || options === void 0 ? void 0 : options.templatesDir) || path_1.default.join(process.cwd(), 'src', 'prompts');
        this.watchFiles = (_a = options === null || options === void 0 ? void 0 : options.watchFiles) !== null && _a !== void 0 ? _a : true;
        this.syncOnStartup = (_b = options === null || options === void 0 ? void 0 : options.syncOnStartup) !== null && _b !== void 0 ? _b : true;
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.syncOnStartup) {
                console.log('🔄 Starting initial file sync...');
                yield this.syncAllFiles();
                console.log('✅ Initial file sync completed');
            }
            if (this.watchFiles) {
                console.log('👁️  Starting file watchers...');
                this.startFileWatchers();
                console.log('✅ File watchers started');
            }
        });
    }
    close() {
        const _super = Object.create(null, {
            close: { get: () => super.close }
        });
        return __awaiter(this, void 0, void 0, function* () {
            for (const watcher of this.watchers) {
                yield watcher.close();
            }
            this.watchers = [];
            yield _super.close.call(this);
        });
    }
    syncAllFiles() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.syncPersonas();
                yield this.syncTemplates();
            }
            catch (error) {
                console.error('❌ Error during file sync:', error);
                throw error;
            }
        });
    }
    syncPersonas() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const files = yield promises_1.default.readdir(this.personasDir);
                const jsonFiles = files.filter(f => f.endsWith('.json'));
                console.log(`📂 Found ${jsonFiles.length} persona files to sync`);
                for (const file of jsonFiles) {
                    yield this.syncPersonaFile(path_1.default.join(this.personasDir, file));
                }
            }
            catch (error) {
                console.error('❌ Error syncing personas:', error);
                throw error;
            }
        });
    }
    syncTemplates() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const files = yield promises_1.default.readdir(this.templatesDir);
                const promptyFiles = files.filter(f => f.endsWith('.prompty'));
                console.log(`📂 Found ${promptyFiles.length} template files to sync`);
                for (const file of promptyFiles) {
                    yield this.syncTemplateFile(path_1.default.join(this.templatesDir, file));
                }
            }
            catch (error) {
                console.error('❌ Error syncing templates:', error);
                throw error;
            }
        });
    }
    syncPersonaFile(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const content = yield promises_1.default.readFile(filePath, 'utf-8');
                const persona = JSON.parse(content);
                if (!sync_utils_1.SyncUtils.validatePersonaStructure(persona)) {
                    console.warn(`⚠️  Invalid persona file: ${filePath}`);
                    return;
                }
                const fileName = path_1.default.basename(filePath, '.json');
                const stats = yield promises_1.default.stat(filePath);
                this.upsertDocument(fileName, 'persona', persona.name || fileName, persona, filePath, stats.mtime);
                console.log(`🔄 Synced persona: ${fileName}`);
            }
            catch (error) {
                console.error(`❌ Error syncing persona file ${filePath}:`, error);
                throw error;
            }
        });
    }
    syncTemplateFile(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const content = yield promises_1.default.readFile(filePath, 'utf-8');
                const parsedFile = sync_utils_1.SyncUtils.parsePromptyFile(content);
                if (!parsedFile || !sync_utils_1.SyncUtils.validatePromptStructure(parsedFile)) {
                    console.warn(`⚠️  Invalid template file: ${filePath}`);
                    return;
                }
                const fileName = path_1.default.basename(filePath, '.prompty');
                const stats = yield promises_1.default.stat(filePath);
                this.upsertDocument(fileName, 'prompt_template', parsedFile.name || fileName, parsedFile, filePath, stats.mtime);
                console.log(`🔄 Synced template: ${fileName}`);
            }
            catch (error) {
                console.error(`❌ Error syncing template file ${filePath}:`, error);
                throw error;
            }
        });
    }
    startFileWatchers() {
        // Watch personas directory
        const personaWatcher = chokidar_1.default.watch(path_1.default.join(this.personasDir, '*.json'), {
            persistent: true,
            ignoreInitial: true,
            awaitWriteFinish: {
                stabilityThreshold: 300,
                pollInterval: 100
            },
            usePolling: false,
            alwaysStat: true,
            depth: 0
        });
        personaWatcher
            .on('add', (filePath) => {
            console.log(`📁 New persona file detected: ${filePath}`);
            this.syncPersonaFile(filePath).catch(console.error);
        })
            .on('change', (filePath) => {
            console.log(`📝 Persona file changed: ${filePath}`);
            this.syncPersonaFile(filePath).catch(console.error);
        })
            .on('unlink', (filePath) => {
            console.log(`🗑️  Persona file deleted: ${filePath}`);
            const fileName = path_1.default.basename(filePath, '.json');
            this.deleteDocument(fileName, 'persona');
        })
            .on('error', (error) => {
            console.error('❌ Persona watcher error:', error);
        })
            .on('ready', () => {
            console.log('👁️  Persona file watcher ready');
        });
        this.watchers.push(personaWatcher);
        // Watch templates directory
        const templateWatcher = chokidar_1.default.watch(path_1.default.join(this.templatesDir, '*.prompty'), {
            persistent: true,
            ignoreInitial: true,
            awaitWriteFinish: {
                stabilityThreshold: 300,
                pollInterval: 100
            },
            usePolling: false,
            alwaysStat: true,
            depth: 0
        });
        templateWatcher
            .on('add', (filePath) => {
            console.log(`📁 New template file detected: ${filePath}`);
            this.syncTemplateFile(filePath).catch(console.error);
        })
            .on('change', (filePath) => {
            console.log(`📝 Template file changed: ${filePath}`);
            this.syncTemplateFile(filePath).catch(console.error);
        })
            .on('unlink', (filePath) => {
            console.log(`🗑️  Template file deleted: ${filePath}`);
            const fileName = path_1.default.basename(filePath, '.prompty');
            this.deleteDocument(fileName, 'prompt_template');
        })
            .on('error', (error) => {
            console.error('❌ Template watcher error:', error);
        })
            .on('ready', () => {
            console.log('👁️  Template file watcher ready');
        });
        this.watchers.push(templateWatcher);
    }
    // Manual sync methods for testing
    forceSyncPersonas() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('🔄 Force syncing personas...');
            yield this.syncPersonas();
        });
    }
    forceSyncTemplates() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('🔄 Force syncing templates...');
            yield this.syncTemplates();
        });
    }
    forceSyncAll() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('🔄 Force syncing all files...');
            yield this.syncAllFiles();
        });
    }
}
exports.FileSyncDatabase = FileSyncDatabase;
