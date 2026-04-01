import { parse } from "csv-parse/sync";
import { readFileSync } from "fs";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: npm run import-csv <path-to-csv>");
    process.exit(1);
  }

  const raw = readFileSync(filePath, "utf-8");
  const records = parse(raw, { columns: true, skip_empty_lines: true, trim: true });

  const migrations = ["001_create_chapters.sql", "002_create_submissions.sql", "003_create_routine_days.sql"];
  for (const m of migrations) {
    const sql = readFileSync(`migrations/${m}`, "utf-8");
    await pool.query(sql);
  }

  await pool.query("DELETE FROM chapters");

  let imported = 0;
  for (const rawRow of records) {
    const row = rawRow as Record<string, string>;
    await pool.query(
      `INSERT INTO chapters (section, subject, chapter_number, chapter_name_bn, chapter_name_en, question_type, cq_importance, mcq_importance, math_importance, time_cq_min, time_mcq_min, time_math_min, time_revision_min)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       ON CONFLICT (section, subject, chapter_number) DO UPDATE SET
         chapter_name_bn = EXCLUDED.chapter_name_bn,
         question_type = EXCLUDED.question_type,
         cq_importance = EXCLUDED.cq_importance,
         mcq_importance = EXCLUDED.mcq_importance,
         math_importance = EXCLUDED.math_importance,
         time_cq_min = EXCLUDED.time_cq_min,
         time_mcq_min = EXCLUDED.time_mcq_min,
         time_math_min = EXCLUDED.time_math_min,
         time_revision_min = EXCLUDED.time_revision_min`,
      [
        row.section, row.subject, parseInt(row.chapter_number),
        row.chapter_name_bn, row.chapter_name_en || null, row.question_type,
        parseInt(row.cq_importance), parseInt(row.mcq_importance), parseInt(row.math_importance),
        parseInt(row.time_cq_min), parseInt(row.time_mcq_min), parseInt(row.time_math_min),
        parseInt(row.time_revision_min),
      ]
    );
    imported++;
  }

  console.log(`Imported ${imported} chapters.`);
  await pool.end();
}

main().catch((err) => { console.error(err); process.exit(1); });
