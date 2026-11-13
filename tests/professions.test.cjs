const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'apps/professions.js'), 'utf8'), context);
const profiles = context.window.professionProfiles;
const html = fs.readFileSync(path.join(root, 'apps/QuePasara_Anime_Imagenes.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
let jobs;
vm.runInNewContext(script.split('const profiles=')[0]+';capture(jobs);', { capture: value => jobs = value });

test('cada una de las 193 profesiones conserva su identidad y tiene ficha completa', () => {
 assert.equal(jobs.length, 193);
 assert.equal(Object.keys(profiles).length, jobs.length);
 assert.equal(new Set(jobs.map(job => job.name)).size, jobs.length);
 for (const [index, job] of jobs.entries()) {
  assert.equal(job.id, index, 'Los resultados guardados dependen de estos identificadores');
  const profile = profiles[job.name];
  assert.ok(profile, job.name);
  for (const field of ['summary','where','skills','study','reward','challenge','tryIt']) {
   assert.equal(typeof profile[field], 'string', `${job.name}: ${field}`);
   assert.ok(profile[field].length >= 45, `${job.name}: ${field} demasiado escueto`);
  }
  assert.equal(profile.tasks.length, 3, `${job.name}: tareas`);
  assert.ok(profile.tasks.every(task => task.length > 15), job.name);
  assert.ok(profile.sources.length > 0, job.name);
  for (const source of profile.sources) {
   assert.ok(source.title && source.url.startsWith('https://'), job.name);
  }
 }
});

test('descripciones, habilidades, tareas, retos y actividades son propios de cada profesión', () => {
 for (const field of ['summary','skills','reward','challenge','tryIt','tasks']) {
  const texts = Object.values(profiles).map(profile => JSON.stringify(profile[field]));
  assert.equal(new Set(texts).size, jobs.length, `Hay texto repetido en ${field}`);
 }
 const content = Object.values(profiles).map(profile => JSON.stringify(profile)).join(' ');
 for (const phrase of ['Explora cómo trabajan los profesionales','No todos los días son iguales','poder usar lo aprendido para hacer tareas reales']) {
  assert.ok(!content.includes(phrase), phrase);
 }
});

test('las diferencias formativas importantes quedan explícitas', () => {
 assert.match(profiles['Matrona'].study, /Enfermería.*especialidad/);
 assert.match(profiles['Radiología'].study, /Medicina.*Radiodiagnóstico.*FP/);
 assert.match(profiles['Prótesis dentales'].study, /FP superior de Prótesis Dentales/);
 assert.match(profiles['Interpretación de lengua de signos'].study, /no está vigente.*funciones distintas/);
 assert.match(profiles['Auditoría'].study, /ROAC/);
 assert.match(profiles['Mecánica aeronáutica'].study, /Parte 66/);
 assert.match(profiles['Tripulación de cabina'].study, /certificado/);
});

test('los datos se cargan antes de la aplicación y el JavaScript es válido', () => {
 assert.ok(html.indexOf('src="professions.js"') < html.indexOf('<script>'));
 assert.doesNotThrow(() => new vm.Script(script));
 assert.ok(!html.includes('Explora cómo trabajan los profesionales'));
 assert.ok(!html.includes('const profileSkills'));
});
