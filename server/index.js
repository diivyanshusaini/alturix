// ALTURIX backend — Express + SQLite (node:sqlite) + local media storage.
// Originals are stored under random names and are never overwritten or deleted by publishing actions.
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_DATA = path.join(__dirname, 'data');
const DATA = process.env.ALTURIX_DATA || SEED_DATA;
const UPLOADS = path.join(DATA, 'uploads');
fs.mkdirSync(UPLOADS, { recursive: true });

// If mounted volume (e.g. /data) is empty or missing seed files, copy initial DB, admin credentials, and bundled uploads
if (path.resolve(DATA) !== path.resolve(SEED_DATA) && fs.existsSync(SEED_DATA)) {
  for (const metaFile of ['alturix.db', 'admin.json']) {
    const src = path.join(SEED_DATA, metaFile);
    const dst = path.join(DATA, metaFile);
    if (fs.existsSync(src) && !fs.existsSync(dst)) {
      fs.copyFileSync(src, dst);
    }
  }
  const seedUploads = path.join(SEED_DATA, 'uploads');
  if (fs.existsSync(seedUploads)) {
    for (const f of fs.readdirSync(seedUploads)) {
      const src = path.join(seedUploads, f);
      const dst = path.join(UPLOADS, f);
      if (!fs.existsSync(dst) && fs.statSync(src).isFile()) {
        fs.copyFileSync(src, dst);
      }
    }
  }
}

const db = new DatabaseSync(path.join(DATA, 'alturix.db'));
db.exec(`
PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS folders(id INTEGER PRIMARY KEY, name TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS assets(
  id INTEGER PRIMARY KEY, original_name TEXT, stored_name TEXT UNIQUE, mime TEXT, kind TEXT, size INTEGER,
  folder_id INTEGER REFERENCES folders(id) ON DELETE SET NULL, title TEXT DEFAULT '', description TEXT DEFAULT '',
  category TEXT DEFAULT '', poster_asset_id INTEGER, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS projects(
  id INTEGER PRIMARY KEY, slug TEXT UNIQUE, title TEXT NOT NULL, section TEXT DEFAULT 'graphic',
  category TEXT DEFAULT '', project_type TEXT DEFAULT '', contribution TEXT DEFAULT 'individual',
  status TEXT DEFAULT 'draft', featured INTEGER DEFAULT 0, sort_order INTEGER DEFAULT 0,
  cover_asset_id INTEGER, summary TEXT DEFAULT '', case_study TEXT DEFAULT '{}', tools TEXT DEFAULT '[]',
  credits TEXT DEFAULT '', year TEXT DEFAULT '', created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP, published_at TEXT);
CREATE TABLE IF NOT EXISTS project_assets(
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE, asset_id INTEGER REFERENCES assets(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0, role TEXT DEFAULT 'gallery', caption TEXT DEFAULT '', PRIMARY KEY(project_id, asset_id));
CREATE TABLE IF NOT EXISTS messages(id INTEGER PRIMARY KEY, name TEXT, email TEXT, body TEXT, is_read INTEGER DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, expires INTEGER);
`);

const DEFAULT_SETTINGS = {
  hero_wordmark: 'ALTURIX',
  hero_badge: 'EDITOR & VISUAL DESIGNER',
  hero_title: 'A Creative Universe.',
  hero_intro: 'Video editor, visual designer and creative explorer. Make. Adapt. Discover.',
  hero_location: 'JAIPUR, INDIA · AVAILABLE FOR SELECT PROJECTS WORLDWIDE',
  hero_portrait_url: '/divyanshu.jpg',
  hero_ethos_quote: '“Every frame. A different feeling.”',
  hero_stats: [
    { value: '04.', label: 'CURATED MAD EDITIONS LIVE' },
    { value: '03.', label: 'CORE DISCIPLINES · VIDEO · DESIGN · CASE' },
    { value: '100%', label: 'STORY-FIRST VISUAL CRAFT' },
  ],
  marquee_words: ['Make', 'Adapt', 'Discover', 'Video Editing', 'Visual Identity', 'Typography', 'Motion Design', 'Editorial'],
  work_heading_1: 'WORKS THAT',
  work_heading_2: 'SPEAK.',
  ecosystem_title: 'BUILT WITH INDUSTRY-STANDARD TOOLS // PART OF THE BIGGER PICTURE',
  ecosystem_tools: [
    { code: 'Pr', name: 'Premiere Pro', sub: 'Narrative & Rhythm Cutting' },
    { code: 'Ae', name: 'After Effects', sub: 'Motion & Visual VFX' },
    { code: 'Dv', name: 'DaVinci Resolve', sub: 'Color Grading & Look Dev' },
    { code: 'Ps', name: 'Photoshop', sub: 'Visual Manipulation & Art' },
    { code: 'Ai', name: 'Illustrator', sub: 'Vector & Type Systems' },
    { code: 'Fg', name: 'Figma', sub: 'Editorial & Carousel Design' },
  ],
  raw_heading_1: 'FROM RAW.',
  raw_heading_2: 'TO REAL.',
  raw_description: 'One concept. Layered execution. See how rough wireframes, ungraded frames, and raw scripts transform into a finished ALTURIX visual edition.',
  raw_before_image: '',
  raw_after_image: '',
  reel_heading_1: 'Cut to',
  reel_heading_2: 'rhythm.',
  reel_tracks: [
    { code: 'V1 // RHYTHM CUT', name: 'High-Retention Reels & Short-Form Storytelling', fps: '60 FPS', dur: '00:45:12', tag: 'Pacing · Hook Architecture · Sound Sync' },
    { code: 'V2 // MOTION & TYPE', name: 'Kinetic Typography & Visual Explainer Edits', fps: '24 FPS', dur: '01:18:04', tag: 'Motion Graphics · Keyframe Curves · Visual Hierarchy' },
    { code: 'V3 // PROMO & EVENT', name: 'Brand Launches, Event Aftermovies & Narrative Cuts', fps: '24 FPS', dur: '02:05:19', tag: 'Colour Grade · Audio Design · Story Arc' },
  ],
  behind_heading_1: 'NOT JUST VISUALS.',
  behind_heading_2: 'HOW WE TELL THE STORY.',
  behind_intro: 'I work across video editing, visual design, and narrative case studies—combining creative instinct with structured pacing to build work that feels alive.',
  capabilities: ['Video Editing', 'Motion Graphics', 'Graphic Design', 'Carousel Architecture', 'Brand Identity', 'Color Grading', 'Storytelling'],
  process_steps: [
    { num: '01', title: 'THE IDEA', desc: 'Uncovering the core hook, audience tension, and emotional direction before a single frame is cut.' },
    { num: '02', title: 'THE BLUEPRINT', desc: 'Scripting the pacing architecture, visual references, and typography hierarchy across every slide or scene.' },
    { num: '03', title: 'THE CRAFT', desc: 'Precision video editing, expressive layout design, and kinetic motion built to hold attention.' },
    { num: '04', title: 'THE POLISH', desc: 'Unifying color grade, sound design, texture, and micro-transitions so every beat feels intentional.' },
    { num: '05', title: 'THE FINAL FRAME', desc: 'Final review and multi-format delivery ready to publish and perform.' },
  ],
  director_quote: 'From raw concept and storytelling to visuals that feel cinematic, intentional, and impossible to scroll past.',
  director_name: 'Divyanshu Saini',
  director_sub: 'THE NEXT FRAME COUNTS // ALTURIX',
  journey_heading_1: 'KEEP MOVING.',
  journey_heading_2: 'KEEP CREATING.',
  journey_items: [
    {
      period: '2025 — PRESENT',
      role: 'Founder & Creative Director',
      org: 'ALTURIX // A Creative Universe',
      desc: 'Building high-retention video edits, visual essays, startup carousels, and experimental brand storytelling under the MAD philosophy.',
    },
    {
      period: '2024 — 2025',
      role: 'Visual Designer & Editorial Storyteller',
      org: 'MAD Edition Series',
      desc: 'Designed multi-slide business & technology breakdowns (Zerodha, Startup Lexicon, AI Systems) combining bold typography with clean data storytelling.',
    },
    {
      period: '2023 — 2024',
      role: 'Video Editor & Motion Explorer',
      org: 'Independent Studio & Creator Collaborations',
      desc: 'Crafted short-form narrative cuts, kinetic typography reels, and visual experiments focused on pacing and audience retention.',
    },
  ],
  milestones_heading_1: 'LITTLE WINS.',
  milestones_heading_2: 'BIG MEANING.',
  milestones_desc: 'Selected creative editions, deep-dive business case studies, and visual experiments published under ALTURIX.',
  cta_heading_1: "LET'S WORK",
  cta_heading_2: 'TOGETHER.',
  cta_intro: "Have a story, brand, or video project ready to bring to life? Let's build something worth watching.",
  cta_card_title_1: 'MAKE IT',
  cta_card_title_2: 'FEEL REAL.',
  cta_card_sub: "Pitch your project brief and let's craft the next edition together.",
  location_text: 'Jaipur, India · Available Worldwide',
  about: 'I am Divyanshu Saini — a video editor and visual designer. Edit this text from the admin dashboard.',
  instagram: '',
  email: 'hello@alturix.studio',
};
for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) {
  db.prepare('INSERT OR IGNORE INTO settings(key,value) VALUES(?,?)').run(k, JSON.stringify(v));
}

// ---- Admin credential: bcrypt hash in data/admin.json; random password printed once on first run.
const ADMIN_FILE = path.join(DATA, 'admin.json');
if (!fs.existsSync(ADMIN_FILE)) {
  const pw = process.env.ADMIN_PASSWORD || crypto.randomBytes(9).toString('base64url');
  fs.writeFileSync(ADMIN_FILE, JSON.stringify({ hash: bcrypt.hashSync(pw, 12) }), { mode: 0o600 });
  if (!process.env.ADMIN_PASSWORD) console.log(`\n  ALTURIX admin password (shown once): ${pw}\n  Change it from Admin → Settings.\n`);
}
const getHash = () => JSON.parse(fs.readFileSync(ADMIN_FILE, 'utf8')).hash;

const app = express();
app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-origin' }, contentSecurityPolicy: false }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

const parse = (s, f) => { try { return JSON.parse(s); } catch { return f; } };
const isAdmin = (req) => {
  const t = req.cookies?.alturix_session;
  if (!t) return false;
  const r = db.prepare('SELECT expires FROM sessions WHERE token=?').get(t);
  return !!r && r.expires > Date.now();
};
const requireAdmin = (req, res, next) => {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
  // CSRF defence in depth (cookie is SameSite=Strict): mutating calls need a custom header.
  if (req.method !== 'GET' && req.headers['x-requested-with'] !== 'alturix') return res.status(403).json({ error: 'Bad request origin' });
  next();
};

// ---------- Auth ----------
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true });
app.post('/api/auth/login', loginLimiter, (req, res) => {
  const pw = String(req.body?.password || '');
  if (!bcrypt.compareSync(pw, getHash())) return res.status(401).json({ error: 'Wrong password' });
  const token = crypto.randomBytes(32).toString('hex');
  db.prepare('DELETE FROM sessions WHERE expires < ?').run(Date.now());
  db.prepare('INSERT INTO sessions VALUES(?,?)').run(token, Date.now() + 7 * 864e5);
  res.cookie('alturix_session', token, { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', maxAge: 7 * 864e5 });
  res.json({ ok: true });
});
app.post('/api/auth/logout', (req, res) => {
  db.prepare('DELETE FROM sessions WHERE token=?').run(req.cookies?.alturix_session || '');
  res.clearCookie('alturix_session');
  res.json({ ok: true });
});
app.get('/api/auth/me', (req, res) => res.json({ admin: isAdmin(req) }));
app.post('/api/admin/password', requireAdmin, (req, res) => {
  const { current, next } = req.body || {};
  if (!bcrypt.compareSync(String(current || ''), getHash())) return res.status(400).json({ error: 'Current password is wrong' });
  if (String(next || '').length < 10) return res.status(400).json({ error: 'Use at least 10 characters' });
  fs.writeFileSync(ADMIN_FILE, JSON.stringify({ hash: bcrypt.hashSync(next, 12) }), { mode: 0o600 });
  res.json({ ok: true });
});

// ---------- Media ----------
const kindOf = (mime) => mime.startsWith('video/') ? 'video' : mime.startsWith('image/') ? 'image' : mime === 'application/pdf' ? 'pdf' : 'other';
const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOADS,
    filename: (_r, f, cb) => cb(null, crypto.randomUUID() + path.extname(f.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '')),
  }),
  limits: { fileSize: 4 * 1024 ** 3 },
  fileFilter: (_r, f, cb) => cb(null, kindOf(f.mimetype) !== 'other'),
});

// An asset is public only if it is in a published project (as cover, gallery item, or poster of one).
const PUBLIC_ASSET_SQL = `
SELECT 1 FROM assets a WHERE a.stored_name=? AND (
  a.id IN (SELECT cover_asset_id FROM projects WHERE status='published')
  OR a.id IN (SELECT asset_id FROM project_assets pa JOIN projects p ON p.id=pa.project_id WHERE p.status='published')
  OR a.id IN (SELECT a2.poster_asset_id FROM assets a2 WHERE a2.id IN (SELECT asset_id FROM project_assets pa JOIN projects p ON p.id=pa.project_id WHERE p.status='published')
     OR a2.id IN (SELECT cover_asset_id FROM projects WHERE status='published')))`;
app.get('/media/:name', (req, res) => {
  const name = path.basename(req.params.name);
  if (!isAdmin(req) && !db.prepare(PUBLIC_ASSET_SQL).get(name)) return res.status(404).end();
  const file = path.join(UPLOADS, name);
  if (!fs.existsSync(file)) return res.status(404).end();
  res.setHeader('Cache-Control', isAdmin(req) ? 'no-store' : 'public, max-age=86400');
  res.sendFile(file); // supports HTTP range requests for video seeking
});

const assetOut = (a) => a && ({ ...a, url: `/media/${a.stored_name}`, poster_url: a.poster_asset_id ? posterUrl(a.poster_asset_id) : null });
const posterUrl = (id) => { const p = db.prepare('SELECT stored_name FROM assets WHERE id=?').get(id); return p ? `/media/${p.stored_name}` : null; };

function generateAutoPoster(storedName, origTitle) {
  try {
    const filePath = path.join(UPLOADS, storedName);
    execFileSync('qlmanage', ['-t', '-s', '1280', '-o', UPLOADS, filePath], { stdio: 'ignore', timeout: 8000 });
    const genPath = path.join(UPLOADS, `${storedName}.png`);
    if (fs.existsSync(genPath)) {
      const posterName = `poster-${crypto.randomUUID()}.png`;
      const finalPath = path.join(UPLOADS, posterName);
      fs.renameSync(genPath, finalPath);
      const sz = fs.statSync(finalPath).size;
      const r = db.prepare('INSERT INTO assets(original_name,stored_name,mime,kind,size,title) VALUES(?,?,?,?,?,?)')
        .run(`poster-${origTitle}.png`, posterName, 'image/png', 'image', sz, `${origTitle} (Cover)`);
      return Number(r.lastInsertRowid);
    }
  } catch {}
  return null;
}

app.post('/api/admin/assets', requireAdmin, upload.array('files', 50), (req, res) => {
  const folder = req.body.folder_id ? Number(req.body.folder_id) : null;
  const out = (req.files || []).map((f) => {
    const mime = f.mimetype;
    const kind = kindOf(mime);
    const origName = Buffer.from(f.originalname, 'latin1').toString('utf8');
    const title = path.parse(origName).name;
    const posterId = (kind === 'pdf' || kind === 'video') ? generateAutoPoster(f.filename, title) : null;
    const r = db.prepare('INSERT INTO assets(original_name,stored_name,mime,kind,size,folder_id,title,poster_asset_id) VALUES(?,?,?,?,?,?,?,?)')
      .run(origName, f.filename, mime, kind, f.size, folder, title, posterId);
    return assetOut(db.prepare('SELECT * FROM assets WHERE id=?').get(r.lastInsertRowid));
  });
  res.json(out);
});
app.get('/api/admin/assets', requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT * FROM assets ORDER BY id DESC').all().map(assetOut);
  const used = db.prepare('SELECT asset_id, COUNT(*) c FROM project_assets GROUP BY asset_id').all();
  const m = Object.fromEntries(used.map((u) => [u.asset_id, u.c]));
  res.json(rows.map((r) => ({ ...r, used_in: m[r.id] || 0 })));
});
app.patch('/api/admin/assets/:id', requireAdmin, (req, res) => {
  const b = req.body || {};
  const cur = db.prepare('SELECT * FROM assets WHERE id=?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'Not found' });
  db.prepare('UPDATE assets SET title=?, description=?, category=?, folder_id=?, poster_asset_id=? WHERE id=?').run(
    b.title ?? cur.title, b.description ?? cur.description, b.category ?? cur.category,
    'folder_id' in b ? b.folder_id : cur.folder_id, 'poster_asset_id' in b ? b.poster_asset_id : cur.poster_asset_id, cur.id);
  res.json(assetOut(db.prepare('SELECT * FROM assets WHERE id=?').get(cur.id)));
});
// Deleting only removes the library record + file when the asset is unused by any project.
app.delete('/api/admin/assets/:id', requireAdmin, (req, res) => {
  const a = db.prepare('SELECT * FROM assets WHERE id=?').get(req.params.id);
  if (!a) return res.status(404).json({ error: 'Not found' });
  const inUse = db.prepare('SELECT COUNT(*) c FROM project_assets WHERE asset_id=?').get(a.id).c
    + db.prepare('SELECT COUNT(*) c FROM projects WHERE cover_asset_id=?').get(a.id).c;
  if (inUse) return res.status(409).json({ error: 'Asset is used by a project. Remove it from the project first.' });
  db.prepare('DELETE FROM assets WHERE id=?').run(a.id);
  fs.rmSync(path.join(UPLOADS, a.stored_name), { force: true });
  res.json({ ok: true });
});

app.get('/api/admin/folders', requireAdmin, (_q, res) => res.json(db.prepare('SELECT * FROM folders ORDER BY name').all()));
app.post('/api/admin/folders', requireAdmin, (req, res) => {
  const name = String(req.body?.name || '').trim().slice(0, 80);
  if (!name) return res.status(400).json({ error: 'Name required' });
  const r = db.prepare('INSERT INTO folders(name) VALUES(?)').run(name);
  res.json({ id: Number(r.lastInsertRowid), name });
});
app.delete('/api/admin/folders/:id', requireAdmin, (req, res) => { db.prepare('DELETE FROM folders WHERE id=?').run(req.params.id); res.json({ ok: true }); });

// Chunked binary upload into UPLOADS for large media migration onto persistent volume
app.post('/api/admin/seed-chunk/:filename', express.raw({ type: 'application/octet-stream', limit: '30mb' }), (req, res) => {
  const token = req.headers['x-seed-key'];
  if (!process.env.SEED_KEY || token !== process.env.SEED_KEY) return res.status(401).json({ error: 'Unauthorized' });
  const safeName = path.basename(req.params.filename);
  const dst = path.join(UPLOADS, safeName);
  const append = req.query.append === '1';
  if (!append) fs.writeFileSync(dst, req.body);
  else fs.appendFileSync(dst, req.body);
  res.json({ ok: true, size: fs.statSync(dst).size });
});

// ---------- Projects ----------
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'project';
const uniqueSlug = (base, id) => { let s = base, i = 2; while (db.prepare('SELECT id FROM projects WHERE slug=? AND id<>?').get(s, id ?? -1)) s = `${base}-${i++}`; return s; };

function projectFull(p, { admin }) {
  if (!p) return null;
  const items = db.prepare(`SELECT a.*, pa.sort_order ps, pa.role, pa.caption FROM project_assets pa JOIN assets a ON a.id=pa.asset_id
    WHERE pa.project_id=? ORDER BY pa.sort_order, a.id`).all(p.id).map((a) => ({ ...assetOut(a), role: a.role, caption: a.caption }));
  const cover = p.cover_asset_id ? assetOut(db.prepare('SELECT * FROM assets WHERE id=?').get(p.cover_asset_id)) : null;
  const out = { ...p, featured: !!p.featured, case_study: parse(p.case_study, {}), tools: parse(p.tools, []), cover, assets: items };
  if (!admin) { delete out.created_at; }
  return out;
}

app.get('/api/admin/projects', requireAdmin, (_q, res) =>
  res.json(db.prepare('SELECT * FROM projects ORDER BY sort_order, id DESC').all().map((p) => projectFull(p, { admin: true }))));
app.get('/api/admin/projects/:id', requireAdmin, (req, res) => {
  const p = db.prepare('SELECT * FROM projects WHERE id=?').get(req.params.id);
  p ? res.json(projectFull(p, { admin: true })) : res.status(404).json({ error: 'Not found' });
});
app.post('/api/admin/projects', requireAdmin, (req, res) => {
  const title = String(req.body?.title || 'Untitled project').slice(0, 140);
  const section = ['video', 'graphic', 'experiment'].includes(req.body?.section) ? req.body.section : 'graphic';
  const r = db.prepare('INSERT INTO projects(slug,title,section,sort_order) VALUES(?,?,?,(SELECT COALESCE(MAX(sort_order),0)+1 FROM projects))')
    .run(uniqueSlug(slugify(title)), title, section);
  res.json(projectFull(db.prepare('SELECT * FROM projects WHERE id=?').get(r.lastInsertRowid), { admin: true }));
});

const SECTIONS = ['video', 'graphic', 'experiment'];
const CONTRIB = ['individual', 'collaborative', 'client', 'speculative'];
app.put('/api/admin/projects/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const cur = db.prepare('SELECT * FROM projects WHERE id=?').get(id);
  if (!cur) return res.status(404).json({ error: 'Not found' });
  const b = req.body || {};
  const section = SECTIONS.includes(b.section) ? b.section : cur.section;
  const contribution = CONTRIB.includes(b.contribution) ? b.contribution : cur.contribution;
  const title = String(b.title ?? cur.title).slice(0, 140);
  const slug = b.slug ? uniqueSlug(slugify(b.slug), id) : cur.slug;
  db.prepare(`UPDATE projects SET title=?, slug=?, section=?, category=?, project_type=?, contribution=?, featured=?, cover_asset_id=?,
    summary=?, case_study=?, tools=?, credits=?, year=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(
    title, slug, section, String(b.category ?? cur.category), String(b.project_type ?? cur.project_type), contribution,
    b.featured === undefined ? cur.featured : b.featured ? 1 : 0, 'cover_asset_id' in b ? b.cover_asset_id : cur.cover_asset_id,
    String(b.summary ?? cur.summary), JSON.stringify(b.case_study ?? parse(cur.case_study, {})),
    JSON.stringify(b.tools ?? parse(cur.tools, [])), String(b.credits ?? cur.credits), String(b.year ?? cur.year), id);
  if (Array.isArray(b.assets)) {
    db.prepare('DELETE FROM project_assets WHERE project_id=?').run(id);
    const ins = db.prepare('INSERT OR IGNORE INTO project_assets(project_id,asset_id,sort_order,role,caption) VALUES(?,?,?,?,?)');
    b.assets.forEach((a, i) => ins.run(id, Number(a.id), i, ['gallery', 'final', 'alt'].includes(a.role) ? a.role : 'gallery', String(a.caption || '')));
    const after = db.prepare('SELECT cover_asset_id FROM projects WHERE id=?').get(id);
    if (!after.cover_asset_id && b.assets.length > 0) {
      db.prepare('UPDATE projects SET cover_asset_id=? WHERE id=?').run(Number(b.assets[0].id), id);
    }
  }
  res.json(projectFull(db.prepare('SELECT * FROM projects WHERE id=?').get(id), { admin: true }));
});
// Status transitions. Publishing is an explicit action and supports image, video, and PDF/carousel projects.
app.post('/api/admin/projects/:id/status', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const status = req.body?.status;
  if (!['draft', 'review', 'published', 'unpublished'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  let p = db.prepare('SELECT * FROM projects WHERE id=?').get(id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  if (status === 'published') {
    const firstAsset = db.prepare('SELECT asset_id FROM project_assets WHERE project_id=? ORDER BY sort_order, asset_id LIMIT 1').get(id);
    if (!p.cover_asset_id && firstAsset) {
      db.prepare('UPDATE projects SET cover_asset_id=? WHERE id=?').run(firstAsset.asset_id, id);
      p = db.prepare('SELECT * FROM projects WHERE id=?').get(id);
    }
    if (!p.summary.trim() && (p.cover_asset_id || firstAsset)) {
      const autoSummary = p.category ? `${p.title} — ${p.category}.` : `${p.title} — curated project by Divyanshu Saini.`;
      db.prepare('UPDATE projects SET summary=? WHERE id=?').run(autoSummary, id);
      p = db.prepare('SELECT * FROM projects WHERE id=?').get(id);
    }
    const problems = [];
    if (!p.title.trim() || p.title === 'Untitled project') problems.push('Add a real title');
    if (!p.cover_asset_id) problems.push('Attach at least one image, video, or PDF');
    if (!p.summary.trim()) problems.push('Write a summary');
    if (problems.length) return res.status(422).json({ error: problems.join(' · ') });
  }
  db.prepare('UPDATE projects SET status=?, published_at=CASE WHEN ?=\'published\' THEN CURRENT_TIMESTAMP ELSE published_at END, updated_at=CURRENT_TIMESTAMP WHERE id=?').run(status, status, id);
  res.json(projectFull(db.prepare('SELECT * FROM projects WHERE id=?').get(id), { admin: true }));
});
app.post('/api/admin/projects/reorder', requireAdmin, (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
  const up = db.prepare('UPDATE projects SET sort_order=? WHERE id=?');
  ids.forEach((id, i) => up.run(i, Number(id)));
  res.json({ ok: true });
});
// Deleting a project never deletes its uploaded files.
app.delete('/api/admin/projects/:id', requireAdmin, (req, res) => { db.prepare('DELETE FROM projects WHERE id=?').run(req.params.id); res.json({ ok: true }); });

// ---------- Messages & settings ----------
app.get('/api/admin/messages', requireAdmin, (_q, res) => res.json(db.prepare('SELECT * FROM messages ORDER BY id DESC').all()));
app.patch('/api/admin/messages/:id', requireAdmin, (req, res) => { db.prepare('UPDATE messages SET is_read=? WHERE id=?').run(req.body?.is_read ? 1 : 0, req.params.id); res.json({ ok: true }); });
app.delete('/api/admin/messages/:id', requireAdmin, (req, res) => { db.prepare('DELETE FROM messages WHERE id=?').run(req.params.id); res.json({ ok: true }); });
const readSettings = () => ({
  ...DEFAULT_SETTINGS,
  ...Object.fromEntries(db.prepare('SELECT * FROM settings').all().map((r) => [r.key, parse(r.value, null)])),
});
app.put('/api/admin/settings', requireAdmin, (req, res) => {
  const up = db.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value');
  for (const [k, v] of Object.entries(req.body || {})) if (k in DEFAULT_SETTINGS) up.run(k, JSON.stringify(v));
  res.json(readSettings());
});

// ---------- Public API (published content only) ----------
app.get('/api/public/settings', (_q, res) => res.json(readSettings()));
// Admin-only preview: a logged-in admin may add ?preview=1 to also see non-published projects.
const statusClause = (req) => (isAdmin(req) && req.query.preview === '1' ? "status IN ('published','review','draft')" : "status='published'");
app.get('/api/public/projects', (req, res) => {
  const { section } = req.query;
  const rows = db.prepare(`SELECT * FROM projects WHERE ${statusClause(req)} ${section ? 'AND section=?' : ''} ORDER BY featured DESC, sort_order, id DESC`)
    .all(...(section ? [section] : []));
  res.json(rows.map((p) => projectFull(p, { admin: false })));
});
app.get('/api/public/projects/:slug', (req, res) => {
  const s = req.params.slug;
  let p = db.prepare(`SELECT * FROM projects WHERE slug=? AND ${statusClause(req)}`).get(s);
  if (!p && (s === 'songscape9' || s === 'songscape9-cinematic-edits')) {
    p = db.prepare(`SELECT * FROM projects WHERE slug IN ('songscape9','songscape9-cinematic-edits') AND ${statusClause(req)}`).get();
  }
  if (!p && (s === 'bitmela' || s === 'bitmela-2026' || s === 'bitmela-2026-media-team-chronicles')) {
    p = db.prepare(`SELECT * FROM projects WHERE (slug LIKE '%bitmela%' OR title LIKE '%BITMELA%') AND ${statusClause(req)}`).get();
  }
  p ? res.json(projectFull(p, { admin: false })) : res.status(404).json({ error: 'Not found' });
});
const contactLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5 });
app.post('/api/public/contact', contactLimiter, (req, res) => {
  const { name, email, body, website } = req.body || {};
  if (website) return res.json({ ok: true }); // honeypot
  if (!name || !/^\S+@\S+\.\S+$/.test(String(email)) || String(body || '').trim().length < 5) return res.status(400).json({ error: 'Please fill all fields correctly.' });
  db.prepare('INSERT INTO messages(name,email,body) VALUES(?,?,?)').run(String(name).slice(0, 100), String(email).slice(0, 160), String(body).slice(0, 4000));
  res.json({ ok: true });
});

// ---------- Static frontend in production ----------
const DIST = path.join(__dirname, '..', 'dist');
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST, { maxAge: '1h' }));
  app.get(/^\/(?!api|media).*/, (_q, res) => res.sendFile(path.join(DIST, 'index.html')));
}
app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ error: 'Server error' }); });

const PORT = process.env.PORT || 4000;
if (!process.env.ALTURIX_NO_LISTEN) app.listen(PORT, () => console.log(`ALTURIX API on http://localhost:${PORT}`));
export default app;
