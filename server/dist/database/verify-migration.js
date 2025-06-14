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
Object.defineProperty(exports, "__esModule", { value: true });
const document_database_1 = require("./document-database");
function verifyMigration() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Verifying migration results...\n');
        const db = new document_database_1.DocumentDatabase();
        // Wait for initialization
        yield new Promise(resolve => setTimeout(resolve, 500));
        if (!db.isReady()) {
            console.error('Database not ready');
            return;
        }
        try {
            // Check statistics
            const stats = db.getDocumentStats();
            console.log('📊 Database Statistics:');
            console.log(`- Personas: ${stats.personas}`);
            console.log(`- Templates: ${stats.templates}`);
            console.log(`- Total: ${stats.total}\n`);
            // Show sample personas
            const personas = db.getAllPersonas();
            console.log('👥 Sample Personas:');
            personas.slice(0, 3).forEach((persona, index) => {
                console.log(`${index + 1}. ${persona.name} (${persona.id})`);
                if (persona.demographics) {
                    console.log(`   Age Group: ${persona.demographics.ageGroup || 'Unknown'}`);
                }
            });
            console.log(`   ... and ${personas.length - 3} more\n`);
            // Show sample templates
            const templates = db.getAllTemplates();
            console.log('📝 Sample Templates:');
            templates.forEach((template, index) => {
                console.log(`${index + 1}. ${template.name} (${template.id})`);
                if (template.description) {
                    console.log(`   Description: ${template.description}`);
                }
            });
            console.log('\n✅ Migration verification completed successfully!');
        }
        catch (error) {
            console.error('❌ Migration verification failed:', error);
        }
        finally {
            db.close();
        }
    });
}
// Run verification if this file is executed directly
if (require.main === module) {
    verifyMigration().catch(console.error);
}
