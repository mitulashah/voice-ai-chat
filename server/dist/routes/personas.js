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
// GET /api/personas/:id - Get a single persona by id
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const persona = (0, personaService_1.getPersonaById)(req.params.id);
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
