import * as path from 'path';
import * as fs from 'fs';

function resolvePersonasDir() {
  // Prefer dist/personas if it exists (production), else src/personas (dev)
  const distPath = path.join(__dirname, '..', 'personas');
  if (fs.existsSync(distPath)) return distPath;
  const srcPath = path.join(__dirname, '..', 'src', 'personas');
  if (fs.existsSync(srcPath)) return srcPath;
  throw new Error('Personas directory not found');
}

export function getAllPersonas() {
  const personasDir = resolvePersonasDir();
  const files = fs.readdirSync(personasDir).filter(f => f.endsWith('.json'));
  const personas = [];
  for (const file of files) {
    try {
      const personaPath = path.join(personasDir, file);
      const persona = JSON.parse(fs.readFileSync(personaPath, 'utf-8'));
      personas.push(persona);
    } catch (err) {
      // Optionally log or handle error
    }
  }
  return personas;
}

export function getPersonaById(id: string) {
  const personasDir = resolvePersonasDir();
  const files = fs.readdirSync(personasDir).filter(f => f.endsWith('.json'));
  const personaFile = files.find(f => f.replace(/\.json$/, '') === id);
  if (!personaFile) return null;
  const personaPath = path.join(personasDir, personaFile);
  return JSON.parse(fs.readFileSync(personaPath, 'utf-8'));
}
