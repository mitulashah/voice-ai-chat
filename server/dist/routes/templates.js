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
exports.default = router;
