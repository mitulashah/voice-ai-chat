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
const personaService_1 = require("../services/personaService");
console.log('Personas router loaded');
const router = (0, express_1.Router)();
// TEST route
router.get('/test', (_req, res) => {
    res.json({ success: true, message: 'Personas router test route hit' });
});
// GET /api/personas - List all personas
router.get('/', (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const personas = (0, personaService_1.getAllPersonas)();
        res.json({ success: true, personas, count: personas.length });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to load personas', details: error instanceof Error ? error.message : 'Unknown error' });
    }
}));
// GET /api/personas/search - Search personas by query parameter (?q=term)
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
        const personas = (0, personaService_1.searchPersonas)(searchTerm);
        res.json({
            success: true,
            personas,
            count: personas.length,
            searchTerm,
            searchMethod: 'query'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to search personas',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// GET /api/personas/search/:term - Search personas by path parameter
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
        const personas = (0, personaService_1.searchPersonas)(searchTerm);
        res.json({
            success: true,
            personas,
            count: personas.length,
            searchTerm,
            searchMethod: 'path'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to search personas',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// GET /api/personas/age-group/:ageGroup - Filter personas by age group (new database feature)
router.get('/age-group/:ageGroup', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const ageGroup = req.params.ageGroup;
        const personas = (0, personaService_1.getPersonasByAgeGroup)(ageGroup);
        res.json({
            success: true,
            personas,
            count: personas.length,
            ageGroup
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to filter personas by age group',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}));
// GET /api/personas/:id - Get a single persona by id (must come after specific routes)
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Skip if this looks like a search or other special route that wasn't caught above
        const id = req.params.id;
        if (id === 'search' || id === 'age-group') {
            res.status(400).json({
                success: false,
                error: `Invalid persona ID: ${id}. Use /search?q=term for searching or /age-group/:group for filtering.`
            });
            return;
        }
        const persona = (0, personaService_1.getPersonaById)(id);
        if (!persona) {
            res.status(404).json({ success: false, error: 'Persona not found' });
            return;
        }
        res.json({ success: true, persona });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to load persona', details: error instanceof Error ? error.message : 'Unknown error' });
    }
}));
exports.default = router;
