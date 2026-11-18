// Teacher John class site: serves the website and handles POST /api.
// Needs: D1 database bound as "DB" (see wrangler.jsonc) and a secret "TEACHER_KEY".

const COURSES = /^[a-z0-9_-]{1,20}$/;
const ACTS = /^A\d{1,2}$/;
let ready = false;

async function setup(db) {
  if (ready) return;
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS responses (
      course TEXT, sid TEXT, act TEXT, name TEXT, score REAL, n INTEGER,
      done INTEGER, tries INTEGER, rec TEXT, updated INTEGER,
      PRIMARY KEY (course, sid, act))`),
    db.prepare(`CREATE TABLE IF NOT EXISTS live (course TEXT PRIMARY KEY, state TEXT)`)
  ]);
  ready = true;
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }
  });
}

async function api(request, env) {
  if (!env.DB) return json({ error: "database not connected (add a D1 binding named DB)" });
  let o;
  try { o = await request.json(); } catch (e) { return json({ error: "bad request" }, 400); }
  const course = String(o.course || "");
  if (!COURSES.test(course)) return json({ error: "bad course" }, 400);
  const db = env.DB;
  await setup(db);

  if (o.action === "live") {
    const r = await db.prepare("SELECT state FROM live WHERE course = ?").bind(course).first();
    return json({ live: r ? JSON.parse(r.state) : null });
  }

  if (o.action === "save") {
    const sid = String(o.sid || "").slice(0, 40);
    const act = String(o.act || "");
    const recText = String(o.rec || "");
    if (!sid || !ACTS.test(act) || recText.length > 30000) return json({ error: "bad data" }, 400);
    let rec;
    try { rec = JSON.parse(recText); } catch (e) { return json({ error: "bad record" }, 400); }
    let score = 0;
    (rec.s || []).forEach(v => { if (typeof v === "number") score += v; });
    await db.prepare(`INSERT INTO responses (course, sid, act, name, score, n, done, tries, rec, updated)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (course, sid, act) DO UPDATE SET name = excluded.name, score = excluded.score,
      n = excluded.n, done = excluded.done, tries = excluded.tries, rec = excluded.rec, updated = excluded.updated`)
      .bind(course, sid, act, String(o.name || "").slice(0, 40), Math.round(score * 10) / 10,
            Number(o.n) || 0, rec.done ? 1 : 0, Number(rec.t) || 1, recText, Date.now())
      .run();
    return json({ ok: true });
  }

  // everything below needs the teacher key
  if (!env.TEACHER_KEY) return json({ error: "TEACHER_KEY is not set in Cloudflare" });
  if (String(o.key || "") !== env.TEACHER_KEY) return json({ error: "wrong teacher key" });

  if (o.action === "setlive") {
    await db.prepare(`INSERT INTO live (course, state) VALUES (?, ?)
      ON CONFLICT (course) DO UPDATE SET state = excluded.state`)
      .bind(course, JSON.stringify(o.live || null)).run();
    return json({ ok: true });
  }

  if (o.action === "results") {
    const live = await db.prepare("SELECT state FROM live WHERE course = ?").bind(course).first();
    const { results } = await db.prepare("SELECT sid, name, act, rec FROM responses WHERE course = ?").bind(course).all();
    return json({ ok: true, live: live ? JSON.parse(live.state) : null, rows: results || [] });
  }

  if (o.action === "clear") {
    await db.prepare("DELETE FROM responses WHERE course = ?").bind(course).run();
    await db.prepare("DELETE FROM live WHERE course = ?").bind(course).run();
    return json({ ok: true });
  }

  return json({ error: "unknown action" }, 400);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api") {
      if (request.method !== "POST") return json({ error: "use POST" }, 405);
      try { return await api(request, env); }
      catch (e) { return json({ error: "server error: " + (e && e.message || e) }, 500); }
    }
    return env.ASSETS.fetch(request);
  }
};
