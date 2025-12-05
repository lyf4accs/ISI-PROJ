const express = require('express');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = 3000;

// ─── Paths ─────────────────────────────────────────────────
const PROJECT_ROOT = path.join(__dirname, '..', '..'); // -> isi-project
const STATIC_DIR = PROJECT_ROOT;                       // index.html, src, styles
const DB_PATH = path.join(PROJECT_ROOT, 'data', 'db.json');

// ─── Middleware ───────────────────────────────────────────
app.use(express.json());

// CORS (so UI from 127.0.0.1:8080 can call localhost:3000)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Static files (if you open http://localhost:3000 directly)
app.use(express.static(STATIC_DIR));

// ─── DB helpers ───────────────────────────────────────────
async function readDb() {
  try {
    const raw = await fs.readFile(DB_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.warn('db.json not found, creating empty structure.');
    } else {
      console.error('Error reading db.json:', err);
    }
    return {
  meta: {},
  detectives: [],
  applications: [],
  levels: [],
  courts: [],
  reports: [],
  purchase_slips: []
};

  }
}

async function writeDb(db) {
  const formatted = JSON.stringify(db, null, 2);
  await fs.writeFile(DB_PATH, formatted, 'utf8');
}

// ─── API endpoints ────────────────────────────────────────

// Get full DB
app.get('/api/db', async (req, res) => {
  try {
    const db = await readDb();
    res.json(db);
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Error reading database' });
  }
});

// Get detective by DNI
app.get('/api/detectives/:dni', async (req, res) => {
  try {
    const dni = req.params.dni.toUpperCase();
    const db = await readDb();
    const detective = db.detectives.find((d) => d.national_id === dni);

    if (!detective) {
      return res.status(404).json({ ok: false, error: 'Detective not found' });
    }

    res.json({ ok: true, detective });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Error reading detective' });
  }
});

app.get('/api/applications', async (req, res) => {
  const db = await readDb();
  res.json(db.applications);
});

app.get('/api/applications/approved', async (req, res) => {
  const db = await readDb();
  const approved = db.applications.filter(a => a.status === 'approved');
  res.json(approved);
});

app.post('/api/applications/:id/approve', async (req, res) => {
  const { level } = req.body;
  const id = Number(req.params.id);

  const db = await readDb();
  const appIndex = db.applications.findIndex(a => a.application_id === id);

  if (appIndex === -1) {
    return res.status(404).json({ ok: false, error: 'Application not found' });
  }

  db.applications[appIndex].status = 'approved';

  const detective = db.detectives.find(
    d => d.national_id === db.applications[appIndex].detectiveId
  );

  detective.level = level;

  await writeDb(db);
  res.json({ ok: true });
});

app.get('/api/levels', async (req, res) => {
  const db = await readDb();
  res.json(db.levels);
});

app.post('/api/levels/:level/price', async (req, res) => {
  const { price } = req.body;
  const level = Number(req.params.level);

  const db = await readDb();

  const levelObj = db.levels.find(l => l.level === level);
  if (!levelObj) {
    return res.status(404).json({ ok: false, error: 'Level not found' });
  }

  levelObj.price_per_photo = price;

  await writeDb(db);
  res.json({ ok: true });
});

app.post('/api/detectives/:dni/promote', async (req, res) => {
  const { newLevel } = req.body;
  const dni = req.params.dni;

  const db = await readDb();
  const detective = db.detectives.find(d => d.national_id === dni);

  if (!detective) {
    return res.status(404).json({ ok: false, error: 'Detective not found' });
  }

  if (newLevel <= detective.level) {
    return res.status(400).json({
      ok: false,
      error: 'Downgrades are not allowed'
    });
  }

  detective.promotion_history.push({
    from: detective.level,
    to: newLevel,
    date: new Date().toISOString().slice(0, 10)
  });

  detective.level = newLevel;

  await writeDb(db);
  res.json({ ok: true });
});

app.post('/api/applications/:id/reject', async (req, res) => {
  const id = Number(req.params.id);

  const db = await readDb();
  const appIndex = db.applications.findIndex(a => a.application_id === id);

  if (appIndex === -1) {
    return res.status(404).json({ ok: false, error: 'Application not found' });
  }

  const application = db.applications[appIndex];

  if (application.status !== 'pending') {
    return res.status(400).json({
      ok: false,
      error: 'Only pending applications can be rejected.'
    });
  }

  application.status = 'rejected';

  await writeDb(db);
  res.json({ ok: true });
});




// Register new application (and detective if first time)
app.post('/api/applications', async (req, res) => {
  try {
    const {
      national_id,
      date,
      equipment,
      cv,
      first_name,
      last_name,
      address,
      city,
      postal_code,
      telephone,
    } = req.body;

    // ─────────────────────────────────────────────
    // VALIDATORS
    // ─────────────────────────────────────────────

    const dniRegex = /^[0-9]{8}[A-Z]$/; // Spanish DNI
    const postalRegex = /^(0[1-9]|[1-4][0-9]|5[0-2])[0-9]{3}$/; // Spanish CP
    const phoneRegex = /^[0-9]{6,15}$/; // Only numbers
    const nameRegex = /^[A-Za-zÀ-ÿ\s'-]+$/; // No numbers

    if (!dniRegex.test(national_id)) {
      return res.status(400).json({ ok: false, error: 'Invalid Spanish National ID (DNI).' });
    }

    if (!nameRegex.test(first_name)) {
      return res.status(400).json({ ok: false, error: 'First name cannot contain numbers.' });
    }

    if (!nameRegex.test(last_name)) {
      return res.status(400).json({ ok: false, error: 'Last name cannot contain numbers.' });
    }

    if (!postalRegex.test(postal_code)) {
      return res.status(400).json({ ok: false, error: 'Invalid Spanish postal code.' });
    }

    if (!phoneRegex.test(telephone)) {
      return res.status(400).json({ ok: false, error: 'Phone number must contain only digits.' });
    }

    if (!equipment || equipment.length < 20) {
      return res.status(400).json({
        ok: false,
        error: 'Equipment must contain at least 20 characters.',
      });
    }

    if (!cv || cv.length < 20) {
      return res.status(400).json({
        ok: false,
        error: 'CV must contain at least 20 characters.',
      });
    }

    const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;

if (!dateRegex.test(date)) {
  return res.status(400).json({ 
    ok: false, 
    error: 'Date must be in format DD/MM/YYYY.' 
  });
}

const [day, month, year] = date.split('/').map(Number);
const inputDate = new Date(year, month - 1, day);
const today = new Date();
today.setHours(0, 0, 0, 0);

if (inputDate > today) {
  return res.status(400).json({
    ok: false,
    error: 'Date cannot be in the future.'
  });
}



    if (!address || !city) {
      return res.status(400).json({ ok: false, error: 'Address and city are required.' });
    }

    const db = await readDb();

    // ─────────────────────────────────────────────
    // 1 APPLICATION PER MONTH RULE
    // ─────────────────────────────────────────────

const [, appMonthCheck, appYearCheck] = date.split('/'); // DD/MM/YYYY
const currentMonthKey = `${appMonthCheck}/${appYearCheck}`;



const alreadySubmittedThisMonth = db.applications.some(app => {
  if (app.detectiveId !== national_id) return false;

  const [, appMonth, appYear] = app.date.split('/'); // DD/MM/YYYY
  return `${appMonth}/${appYear}` === currentMonthKey;
});


    if (alreadySubmittedThisMonth) {
      return res.status(400).json({
        ok: false,
        error: 'This detective already submitted an application this month.',
      });
    }

    // ─────────────────────────────────────────────
    // CREATE DETECTIVE IF FIRST TIME
    // ─────────────────────────────────────────────

    let existingDetective = db.detectives.find(
      (d) => d.national_id === national_id
    );

    if (!existingDetective) {
  db.detectives.push({
    national_id,
    first_name,
    last_name,
    address,
    city,
    postal_code,
    telephone,
    level: null,
    promotion_history: [],
  });
}


    // ─────────────────────────────────────────────
    // CREATE APPLICATION
    // ─────────────────────────────────────────────

    const existingIds = db.applications.map((a) =>
      Number(a.application_id || 0)
    );
    const nextId =
      existingIds.length === 0 ? 1 : Math.max(...existingIds) + 1;

    const newApplication = {
      application_id: nextId,
      detectiveId: national_id,
      date,
      equipment,
      cv,
      status: 'pending'
    };


    db.applications.push(newApplication);
    await writeDb(db);

    return res.status(201).json({ ok: true, application: newApplication });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});

// SPA fallback (if you open http://localhost:3000 directly)
app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) {
    return res.sendFile(path.join(STATIC_DIR, 'index.html'));
  }
  next();
});

// ─── Start server ─────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`SIGED running at http://localhost:${PORT}`);
});


app.get('/api/reports', async (req, res) => {
  const db = await readDb();
  res.json(db.reports || []);
});

app.post('/api/reports', async (req, res) => {
  try {
    const { detectiveId, num_photos, description } = req.body;

    if (!detectiveId) {
      return res.status(400).json({ ok: false, error: "Detective is required." });
    }

    if (!Number.isInteger(num_photos) || num_photos <= 0) {
      return res.status(400).json({ ok: false, error: "Number of photos must be a positive integer." });
    }

    if (!description || description.trim().length < 10) {
      return res.status(400).json({ ok: false, error: "Description must have at least 10 characters." });
    }

    const db = await readDb();
    const detective = db.detectives.find(d => d.national_id === detectiveId);

    if (!detective) {
      return res.status(404).json({ ok: false, error: "Detective not found." });
    }

    const ids = db.reports.map(r => r.report_id);
    const nextId = ids.length ? Math.max(...ids) + 1 : 1;

    const newReport = {
      report_id: nextId,
      detectiveId,
      num_photos,
      description
    };

    db.reports.push(newReport);
    await writeDb(db);

    res.status(201).json({ ok: true, report: newReport });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Error creating report." });
  }
});

app.get('/api/courts', async (req, res) => {
  const db = await readDb();
  res.json(db.courts || []);
});


app.post('/api/courts', async (req, res) => {
  const { cif, name, address } = req.body;

  if (!cif || !name || !address) {
    return res.status(400).json({ ok: false, error: "All fields are required." });
  }

  const db = await readDb();
  if (db.courts.find(c => c.cif === cif)) {
    return res.status(400).json({ ok: false, error: "A court with this CIF already exists." });
  }

  db.courts.push({ cif, name, address });
  await writeDb(db);

  res.json({ ok: true });
});


app.put('/api/courts/:cif', async (req, res) => {
  const cif = req.params.cif;
  const { name, address } = req.body;

  const db = await readDb();
  const court = db.courts.find(c => c.cif === cif);

  if (!court) {
    return res.status(404).json({ ok: false, error: "Court not found." });
  }

  court.name = name;
  court.address = address;

  await writeDb(db);
  res.json({ ok: true });
});


app.delete('/api/courts/:cif', async (req, res) => {
  const cif = req.params.cif;

  const db = await readDb();
  const index = db.courts.findIndex(c => c.cif === cif);

  if (index === -1) {
    return res.status(404).json({ ok: false, error: "Court not found." });
  }

  db.courts.splice(index, 1);
  await writeDb(db);

  res.json({ ok: true });
});

app.get('/api/slips', async (req, res) => {
  const db = await readDb();
  res.json(db.purchase_slips || []);
});


app.post('/api/slips', async (req, res) => {
  try {
    const { report_id, court_cif, amount_paid_by_court, date } = req.body;

    const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;

    if (!dateRegex.test(date)) {
      return res.status(400).json({ ok: false, error: "Invalid date format. Use DD/MM/YYYY." });
    }

    const [day, month, year] = date.split('/').map(Number);
    const slipDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (slipDate > today) {
      return res.status(400).json({ ok: false, error: "Date cannot be in the future." });
    }

    const db = await readDb();
    const report = db.reports.find(r => r.report_id === report_id);
    const court = db.courts.find(c => c.cif === court_cif);

    if (!report) return res.status(404).json({ ok: false, error: "Report not found." });
    if (!court) return res.status(404).json({ ok: false, error: "Court not found." });

    const detective = db.detectives.find(d => d.national_id === report.detectiveId);
    const level = db.levels.find(l => l.level === detective.level);

    const detectivePayment = level.price_per_photo * report.num_photos;

    if (amount_paid_by_court < detectivePayment) {
      return res.status(400).json({ ok: false, error: "Court payment must be >= detective payment." });
    }

    const ids = db.purchase_slips.map(s => s.slip_id);
    const nextId = ids.length ? Math.max(...ids) + 1 : 1;

    const slip = {
      slip_id: nextId,
      report_id,
      court_cif,
      amount_paid_by_court,
      amount_paid_to_detective: detectivePayment,
      date
    };

    db.purchase_slips.push(slip);
    await writeDb(db);

    res.json({ ok: true, slip });

  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Error creating purchase slip." });
  }
});
