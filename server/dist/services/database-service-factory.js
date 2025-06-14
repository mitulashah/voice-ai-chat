"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseServiceFactory = exports.DatabaseServiceFactory = void 0;
const file_sync_database_1 = require("../database/file-sync-database");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
/**
 * Factory class for creating database-backed or file-backed services
 * based on environment and configuration
 */
class DatabaseServiceFactory {
    constructor() {
        this.database = null;
        this.initializationPromise = null;
        this.initializationError = null;
        this.config = {
            useDatabaseByDefault: process.env.NODE_ENV !== 'development',
            fallbackToFiles: true,
            dbPath: process.env.DATABASE_PATH,
            personasDir: path.join(process.cwd(), 'src', 'personas'),
            templatesDir: path.join(process.cwd(), 'src', 'prompts')
        };
    }
    static getInstance() {
        if (!DatabaseServiceFactory.instance) {
            DatabaseServiceFactory.instance = new DatabaseServiceFactory();
        }
        return DatabaseServiceFactory.instance;
    }
    configure(config) {
        this.config = Object.assign(Object.assign({}, this.config), config);
    }
    initializeDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.initializationPromise) {
                return this.initializationPromise;
            }
            this.initializationPromise = this._initializeDatabase();
            return this.initializationPromise;
        });
    }
    _initializeDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('🔧 Initializing database service...');
                if (this.config.useDatabaseByDefault) {
                    // Production: Use FileSyncDatabase for live file watching
                    const dbPath = this.config.dbPath || path.join(process.cwd(), 'data', 'voice-ai-documents.db');
                    this.database = new file_sync_database_1.FileSyncDatabase(dbPath, {
                        personasDir: this.config.personasDir,
                        templatesDir: this.config.templatesDir,
                        watchFiles: true,
                        syncOnStartup: true
                    });
                    console.log('📊 Using FileSyncDatabase (production mode)');
                }
                else {
                    // Development: Use FileSyncDatabase for hot reloading
                    const dbPath = this.config.dbPath || path.join(process.cwd(), 'data', 'voice-ai-documents.db');
                    this.database = new file_sync_database_1.FileSyncDatabase(dbPath, {
                        personasDir: this.config.personasDir,
                        templatesDir: this.config.templatesDir,
                        watchFiles: true,
                        syncOnStartup: true
                    });
                    console.log('🔥 Using FileSyncDatabase (development mode)');
                }
                // Wait for database to be ready
                let retries = 0;
                while (!this.database.isReady() && retries < 100) {
                    yield new Promise(resolve => setTimeout(resolve, 100));
                    retries++;
                }
                if (!this.database.isReady()) {
                    throw new Error('Database failed to initialize within timeout');
                }
                console.log('✅ Database service initialized successfully');
            }
            catch (error) {
                console.error('❌ Failed to initialize database service:', error);
                this.initializationError = error;
                if (this.config.fallbackToFiles) {
                    console.log('🔄 Falling back to file-based services');
                    this.database = null;
                }
                else {
                    throw error;
                }
            }
        });
    }
    getDatabase() {
        return this.database;
    }
    isDatabaseReady() {
        var _a, _b;
        return (_b = (_a = this.database) === null || _a === void 0 ? void 0 : _a.isReady()) !== null && _b !== void 0 ? _b : false;
    }
    shouldUseDatabase() {
        return this.isDatabaseReady();
    }
    getInitializationError() {
        return this.initializationError;
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.database) {
                console.log('🛑 Closing database service...');
                this.database.close();
                this.database = null;
            }
            this.initializationPromise = null;
            this.initializationError = null;
        });
    }
    // File-based fallback utilities
    resolvePersonasDir() {
        const distPath = path.join(__dirname, '..', 'personas');
        if (fs.existsSync(distPath))
            return distPath;
        const srcPath = path.join(__dirname, '..', '..', 'src', 'personas');
        if (fs.existsSync(srcPath))
            return srcPath;
        throw new Error('Personas directory not found');
    }
    resolvePromptsDir() {
        const distPath = path.join(__dirname, '..', 'prompts');
        if (fs.existsSync(distPath))
            return distPath;
        const srcPath = path.join(__dirname, '..', '..', 'src', 'prompts');
        if (fs.existsSync(srcPath))
            return srcPath;
        throw new Error('Prompts directory not found');
    }
}
exports.DatabaseServiceFactory = DatabaseServiceFactory;
// Singleton instance
exports.databaseServiceFactory = DatabaseServiceFactory.getInstance();
