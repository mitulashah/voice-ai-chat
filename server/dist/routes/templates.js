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
const express_1 = require("express");
const templateService_1 = require("../services/templateService");
const router = (0, express_1.Router)();
// GET /api/templates - List all templates
router.get('/', (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const templates = (0, templateService_1.getAllTemplates)();
        res.json({ success: true, templates, count: templates.length });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to load available templates', details: error instanceof Error ? error.message : 'Unknown error' });
    }
}));
// GET /api/templates/search - Search templates by query parameter (?q=term)
router.get('/search', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const searchTerm = req.query.q;
        if (!searchTerm) {
            res.status(400).json({
                success: false,
                error: 'Search term is required. Use /search?q=term.'
            });
            return;
        }
        const templates = (0, templateService_1.searchTemplates)(searchTerm);
        res.json({
            success: true,
            templates,
            count: templates.length,
            searchTerm,
            searchMethod: 'query'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to search templates',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// GET /api/templates/search/:term - Search templates by path parameter
router.get('/search/:term', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const searchTerm = req.params.term;
        if (!searchTerm) {
            res.status(400).json({
                success: false,
                error: 'Search term is required. Use /search/:term.'
            });
            return;
        }
        const templates = (0, templateService_1.searchTemplates)(searchTerm);
        res.json({
            success: true,
            templates,
            count: templates.length,
            searchTerm,
            searchMethod: 'path'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to search templates',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// GET /api/templates/model/:modelType - Filter templates by model type (new database feature)
router.get('/model/:modelType', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const modelType = req.params.modelType;
        const templates = (0, templateService_1.getTemplatesByModel)(modelType);
        res.json({
            success: true,
            templates,
            count: templates.length,
            modelType
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to filter templates by model type',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// GET /api/templates/debug-names - List all template IDs and names in the database
router.get('/debug-names', (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const names = yield (0, templateService_1.getAllTemplateNames)();
        if (names) {
            res.json({ success: true, templates: names });
            return;
        }
        res.status(404).json({ success: false, error: 'Database not in use or debug method missing.' });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to get template names', details: error instanceof Error ? error.message : 'Unknown error' });
    }
}));
// GET /api/templates/:id - Get a single template by id (must come after specific routes)
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Skip if this looks like a search or other special route that wasn't caught above
        const id = req.params.id;
        if (id === 'search' || id === 'model') {
            res.status(400).json({
                success: false,
                error: `Invalid template ID: ${id}. Use /search?q=term for searching or /model/:type for filtering.`
            });
            return;
        }
        const template = (0, templateService_1.getTemplateById)(id);
        if (!template) {
            res.status(404).json({ success: false, error: 'Template not found' });
            return;
        }
        res.json({ success: true, template });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to load template', details: error instanceof Error ? error.message : 'Unknown error' });
    }
}));
exports.default = router;
