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
        this.scenarioIdMap = new Map();
        // Resolve paths relative to server/src directory
        const baseDir = path_1.default.resolve(__dirname, '..');
        this.personasDir = (options === null || options === void 0 ? void 0 : options.personasDir) || path_1.default.join(baseDir, 'personas');
        this.templatesDir = (options === null || options === void 0 ? void 0 : options.templatesDir) || path_1.default.join(baseDir, 'prompts');
        this.scenariosDir = path_1.default.join(baseDir, 'scenarios');
        this.moodsFile = path_1.default.join(baseDir, 'util', 'moods.json');
        this.watchFiles = (_a = options === null || options === void 0 ? void 0 : options.watchFiles) !== null && _a !== void 0 ? _a : true;
        this.syncOnStartup = (_b = options === null || options === void 0 ? void 0 : options.syncOnStartup) !== null && _b !== void 0 ? _b : true;
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            // Ensure the base DocumentDatabase is fully initialized before syncing files
            if (!this.isInitialized) {
                // Wait until the base class async initialization is done
                while (!this.isInitialized) {
                    yield new Promise(resolve => setTimeout(resolve, 50));
                }
            }
            if (this.syncOnStartup) {
                console.log('🔄 Starting initial file sync...');
                yield this.syncAllFiles();
                console.log('✅ Initial file sync completed');
            }
            if (this.watchFiles) {
                console.log('👀  Starting file watchers...');
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
                yield this.syncScenarios();
                yield this.syncMoods();
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
                const fileIds = new Set(jsonFiles.map(f => path_1.default.basename(f, '.json')));
                console.log(`📂 Found ${jsonFiles.length} persona files to sync`);
                for (const file of jsonFiles) {
                    yield this.syncPersonaFile(path_1.default.join(this.personasDir, file));
                }
                // Remove personas from DB that no longer exist on disk
                const dbPersonas = this.getAllPersonas();
                for (const persona of dbPersonas) {
                    if (!fileIds.has(persona.id)) {
                        this.deleteDocument(persona.id, 'persona');
                        console.log(`🗑️  Removed stale persona from DB: ${persona.id}`);
                    }
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
                const fileIds = new Set(promptyFiles.map(f => path_1.default.basename(f, '.prompty')));
                console.log(`📂 Found ${promptyFiles.length} template files to sync`);
                for (const file of promptyFiles) {
                    yield this.syncTemplateFile(path_1.default.join(this.templatesDir, file));
                }
                // Remove templates from DB that no longer exist on disk
                const dbTemplates = this.getAllTemplates();
                for (const template of dbTemplates) {
                    if (!fileIds.has(template.id)) {
                        this.deleteDocument(template.id, 'prompt_template');
                        console.log(`🗑️  Removed stale template from DB: ${template.id}`);
                    }
                }
            }
            catch (error) {
                console.error('❌ Error syncing templates:', error);
                throw error;
            }
        });
    }
    syncScenarios() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Wipe all existing scenarios to ensure a clean sync
                if (this.db) {
                    this.db.run("DELETE FROM documents WHERE type = 'scenario'");
                    console.log('🗑️  Cleared existing scenarios from DB');
                }
                const files = yield promises_1.default.readdir(this.scenariosDir);
                const jsonFiles = files.filter(f => f.endsWith('.json'));
                console.log(`📂 Found ${jsonFiles.length} scenario files to sync`);
                for (const file of jsonFiles) {
                    const filePath = path_1.default.join(this.scenariosDir, file);
                    yield this.syncScenarioFile(filePath);
                }
            }
            catch (error) {
                console.error('❌ Error syncing scenarios:', error);
                throw error;
            }
        });
    }
    syncMoods() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const content = yield promises_1.default.readFile(this.moodsFile, 'utf-8');
                const moods = JSON.parse(content);
                // Remove all existing moods
                if (this.db)
                    this.db.run('DELETE FROM moods');
                // Insert all moods from file
                if (this.db) {
                    const stmt = this.db.prepare('INSERT INTO moods (mood, description) VALUES (?, ?)');
                    for (const entry of moods) {
                        stmt.run([entry.mood, entry.description]);
                    }
                    stmt.free();
                    // Log row count after insert
                    const countResult = this.db.exec('SELECT COUNT(*) as count FROM moods');
                    const count = (_c = (_b = (_a = countResult[0]) === null || _a === void 0 ? void 0 : _a.values[0]) === null || _b === void 0 ? void 0 : _b[0]) !== null && _c !== void 0 ? _c : 0;
                    console.log(`[syncMoods] Inserted moods, row count now: ${count}`);
                }
                console.log(`🔄 Synced moods from moods.json (${moods.length} moods)`);
            }
            catch (error) {
                console.error('❌ Error syncing moods:', error);
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
    syncScenarioFile(filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const content = yield promises_1.default.readFile(filePath, 'utf-8');
                const scenario = JSON.parse(content);
                const id = typeof scenario.id === 'string' ? scenario.id : path_1.default.basename(filePath, '.json');
                const key = path_1.default.basename(filePath, '.json');
                this.scenarioIdMap.set(key, id);
                const stats = yield promises_1.default.stat(filePath);
                this.upsertDocument(id, 'scenario', scenario.title || id, scenario, filePath, stats.mtime);
                console.log(`🔄 Synced scenario: ${id}`);
            }
            catch (error) {
                console.error(`❌ Error syncing scenario file ${filePath}:`, error);
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
        // Watch scenarios directory
        const scenarioWatcher = chokidar_1.default.watch(path_1.default.join(this.scenariosDir, '*.json'), {
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
        scenarioWatcher
            .on('add', (filePath) => {
            console.log(`📁 New scenario file detected: ${filePath}`);
            this.syncScenarioFile(filePath).catch(console.error);
        })
            .on('change', (filePath) => {
            console.log(`📝 Scenario file changed: ${filePath}`);
            this.syncScenarioFile(filePath).catch(console.error);
        })
            .on('unlink', (filePath) => {
            var _a;
            console.log(`🗑️  Scenario file deleted: ${filePath}`);
            const key = path_1.default.basename(filePath, '.json');
            const id = (_a = this.scenarioIdMap.get(key)) !== null && _a !== void 0 ? _a : key;
            if (this.deleteDocument(id, 'scenario')) {
                console.log(`🗑️  Removed scenario from DB: ${id}`);
            }
        })
            .on('error', (error) => {
            console.error('❌ Scenario watcher error:', error);
        })
            .on('ready', () => {
            console.log('👁️  Scenario file watcher ready');
        });
        this.watchers.push(scenarioWatcher);
        // Watch moods file
        const moodsWatcher = chokidar_1.default.watch(this.moodsFile, {
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
        moodsWatcher
            .on('change', (filePath) => {
            console.log(`📝 Moods file changed: ${filePath}`);
            this.syncMoods().catch(console.error);
        })
            .on('error', (error) => {
            console.error('❌ Moods watcher error:', error);
        })
            .on('ready', () => {
            console.log('👁️  Moods file watcher ready');
        });
        this.watchers.push(moodsWatcher);
    }
    // Public method to get all moods from the database
    getAllMoods() {
        if (!this.db) {
            console.log('[getAllMoods] No db instance');
            return [];
        }
        const result = this.db.exec('SELECT mood, description FROM moods');
        console.log('[getAllMoods] Query result:', JSON.stringify(result, null, 2));
        if (!result[0]) {
            console.log('[getAllMoods] No result[0]');
            return [];
        }
        const moods = result[0].values.map(([mood, description]) => ({
            mood: mood ? String(mood) : '',
            description: description ? String(description) : ''
        }));
        console.log('[getAllMoods] Returning moods:', moods);
        return moods;
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
