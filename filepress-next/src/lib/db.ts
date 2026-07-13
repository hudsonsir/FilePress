/**
 * SQLite 数据库层（better-sqlite3）
 * 单例复用，数据持久化到 data/filepress.db
 */
import path from "path";
import fs from "fs";
import Database from "better-sqlite3";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "filepress.db");

declare global {
  // eslint-disable-next-line no-var
  var _sqliteDb: Database.Database | undefined;
}

function getDb(): Database.Database {
  if (globalThis._sqliteDb) return globalThis._sqliteDb;

  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("synchronous = NORMAL");

  initSchema(db);

  globalThis._sqliteDb = db;
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS fp_user (
      uid       INTEGER PRIMARY KEY AUTOINCREMENT,
      email     TEXT    NOT NULL DEFAULT '' UNIQUE,
      username  TEXT    NOT NULL DEFAULT '',
      password  TEXT    NOT NULL DEFAULT '',
      nickname  TEXT    NOT NULL DEFAULT '',
      avatar    TEXT    NOT NULL DEFAULT '',
      adminid   INTEGER NOT NULL DEFAULT 0,
      groupid   INTEGER NOT NULL DEFAULT 9,
      status    INTEGER NOT NULL DEFAULT 0,
      regip     TEXT    NOT NULL DEFAULT '',
      regdate   INTEGER NOT NULL DEFAULT 0,
      language  TEXT    NOT NULL DEFAULT 'zh-cn',
      uploads   INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_user_username ON fp_user(username);

    CREATE TABLE IF NOT EXISTS fp_vapp (
      appid     TEXT    PRIMARY KEY,
      uid       INTEGER NOT NULL DEFAULT 0,
      username  TEXT    NOT NULL DEFAULT '',
      appname   TEXT    NOT NULL DEFAULT '',
      personal  INTEGER NOT NULL DEFAULT 1,
      path      TEXT    NOT NULL DEFAULT '',
      dateline  INTEGER NOT NULL DEFAULT 0,
      extra     TEXT,
      filenum   INTEGER NOT NULL DEFAULT 0,
      state     INTEGER NOT NULL DEFAULT 0,
      type      INTEGER NOT NULL DEFAULT 0,
      isdelete  INTEGER NOT NULL DEFAULT 0,
      sort      INTEGER NOT NULL DEFAULT 0,
      disp      INTEGER NOT NULL DEFAULT 0,
      charset   TEXT    NOT NULL DEFAULT '',
      perm      INTEGER NOT NULL DEFAULT 0,
      fileds    TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_vapp_uid ON fp_vapp(uid, isdelete);

    CREATE TABLE IF NOT EXISTS fp_vappmember (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      uid      INTEGER NOT NULL DEFAULT 0,
      appid    TEXT    NOT NULL DEFAULT '',
      dateline INTEGER NOT NULL DEFAULT 0,
      perm     INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_vappmember_appid ON fp_vappmember(appid);

    CREATE TABLE IF NOT EXISTS fp_resources (
      rid        TEXT    PRIMARY KEY,
      uid        INTEGER NOT NULL DEFAULT 0,
      username   TEXT    NOT NULL DEFAULT '',
      appid      TEXT    NOT NULL DEFAULT '',
      name       TEXT    NOT NULL DEFAULT '',
      type       TEXT    NOT NULL DEFAULT '',
      ext        TEXT    NOT NULL DEFAULT '',
      height     INTEGER NOT NULL DEFAULT 0,
      width      INTEGER NOT NULL DEFAULT 0,
      dateline   INTEGER NOT NULL DEFAULT 0,
      hasthumb   INTEGER NOT NULL DEFAULT 0,
      grade      INTEGER NOT NULL DEFAULT 0,
      size       INTEGER NOT NULL DEFAULT 0,
      mtime      INTEGER NOT NULL DEFAULT 0,
      isdelete   INTEGER NOT NULL DEFAULT 0,
      btime      INTEGER NOT NULL DEFAULT 0,
      md5        TEXT    NOT NULL DEFAULT '',
      apptype    INTEGER NOT NULL DEFAULT 0,
      fids       TEXT,
      lang       TEXT    NOT NULL DEFAULT 'all'
    );
    CREATE INDEX IF NOT EXISTS idx_res_appid ON fp_resources(appid, isdelete);
    CREATE INDEX IF NOT EXISTS idx_res_btime ON fp_resources(btime);
    CREATE INDEX IF NOT EXISTS idx_res_ext   ON fp_resources(ext);
    CREATE INDEX IF NOT EXISTS idx_res_name  ON fp_resources(name);

    CREATE TABLE IF NOT EXISTS fp_resources_attr (
      rid       TEXT    PRIMARY KEY,
      appid     TEXT    NOT NULL DEFAULT '',
      shape     TEXT    NOT NULL DEFAULT '',
      gray      INTEGER NOT NULL DEFAULT 0,
      colors    TEXT,
      duration  REAL    NOT NULL DEFAULT 0,
      desc_text TEXT,
      link      TEXT    NOT NULL DEFAULT '',
      tag       TEXT,
      file_path TEXT,
      searchval TEXT,
      smallthumb INTEGER NOT NULL DEFAULT 0,
      largethumb INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS fp_folder (
      fid       TEXT    PRIMARY KEY,
      pfid      TEXT    NOT NULL DEFAULT '',
      fname     TEXT    NOT NULL DEFAULT '',
      desc_text TEXT    NOT NULL DEFAULT '',
      appid     TEXT    NOT NULL DEFAULT '',
      pathkey   TEXT    NOT NULL DEFAULT '',
      dateline  INTEGER NOT NULL DEFAULT 0,
      cover     TEXT    NOT NULL DEFAULT '',
      filenum   INTEGER NOT NULL DEFAULT 0,
      disp      INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_folder_appid ON fp_folder(appid);
    CREATE INDEX IF NOT EXISTS idx_folder_pfid  ON fp_folder(pfid);

    CREATE TABLE IF NOT EXISTS fp_folderresources (
      id      INTEGER PRIMARY KEY AUTOINCREMENT,
      rid     TEXT    NOT NULL DEFAULT '',
      fid     TEXT    NOT NULL DEFAULT '',
      appid   TEXT    NOT NULL DEFAULT '',
      pathkey TEXT    NOT NULL DEFAULT ''
    );
    CREATE INDEX IF NOT EXISTS idx_folderres_rid ON fp_folderresources(rid);
    CREATE INDEX IF NOT EXISTS idx_folderres_fid ON fp_folderresources(fid);

    CREATE TABLE IF NOT EXISTS fp_tag (
      tid     INTEGER PRIMARY KEY AUTOINCREMENT,
      tagname TEXT    NOT NULL DEFAULT '',
      hots    INTEGER NOT NULL DEFAULT 0,
      initial TEXT    NOT NULL DEFAULT '',
      lang    TEXT    NOT NULL DEFAULT 'zh-CN'
    );

    CREATE TABLE IF NOT EXISTS fp_taggroup (
      cid      TEXT    PRIMARY KEY,
      catname  TEXT    NOT NULL DEFAULT '',
      pcid     TEXT    NOT NULL DEFAULT '0',
      appid    TEXT    NOT NULL DEFAULT '',
      dateline TEXT    NOT NULL DEFAULT '0',
      disp     INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_taggroup_appid ON fp_taggroup(appid);

    CREATE TABLE IF NOT EXISTS fp_tagrelation (
      id    INTEGER PRIMARY KEY AUTOINCREMENT,
      tid   INTEGER NOT NULL DEFAULT 0,
      cid   TEXT    NOT NULL DEFAULT '',
      appid TEXT    NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS fp_resourcestag (
      id    INTEGER PRIMARY KEY AUTOINCREMENT,
      tid   INTEGER NOT NULL DEFAULT 0,
      rid   TEXT    NOT NULL DEFAULT '',
      appid TEXT    NOT NULL DEFAULT ''
    );
    CREATE INDEX IF NOT EXISTS idx_restag_rid ON fp_resourcestag(rid);
    CREATE INDEX IF NOT EXISTS idx_restag_tid ON fp_resourcestag(tid);

    CREATE TABLE IF NOT EXISTS fp_resourcestab (
      id    INTEGER PRIMARY KEY AUTOINCREMENT,
      rid   TEXT    NOT NULL DEFAULT '',
      tid   INTEGER NOT NULL DEFAULT 0,
      gid   INTEGER NOT NULL DEFAULT 0,
      appid TEXT    NOT NULL DEFAULT ''
    );
    CREATE INDEX IF NOT EXISTS idx_restab_rid ON fp_resourcestab(rid);

    CREATE TABLE IF NOT EXISTS fp_share (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      title     TEXT    NOT NULL DEFAULT '',
      filepath  TEXT    NOT NULL DEFAULT '',
      appid     TEXT    NOT NULL DEFAULT '',
      dateline  INTEGER NOT NULL DEFAULT 0,
      times     INTEGER NOT NULL DEFAULT 0,
      endtime   INTEGER NOT NULL DEFAULT 0,
      username  TEXT    NOT NULL DEFAULT '',
      uid       INTEGER NOT NULL DEFAULT 0,
      password  TEXT    NOT NULL DEFAULT '',
      status    INTEGER NOT NULL DEFAULT 0,
      count     INTEGER NOT NULL DEFAULT 0,
      downloads INTEGER NOT NULL DEFAULT 0,
      views     INTEGER NOT NULL DEFAULT 0,
      stype     INTEGER NOT NULL DEFAULT 0,
      perm      INTEGER NOT NULL DEFAULT 1
    );
    CREATE INDEX IF NOT EXISTS idx_share_uid ON fp_share(uid);

    CREATE TABLE IF NOT EXISTS fp_palette (
      id     INTEGER PRIMARY KEY AUTOINCREMENT,
      color  INTEGER NOT NULL DEFAULT 0,
      r      INTEGER NOT NULL DEFAULT 0,
      g      INTEGER NOT NULL DEFAULT 0,
      b      INTEGER NOT NULL DEFAULT 0,
      rid    TEXT    NOT NULL DEFAULT '',
      weight REAL    NOT NULL DEFAULT 0,
      p      INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_palette_rid ON fp_palette(rid);
  `);
}

// ─── 查询助手（better-sqlite3 是同步 API）────────────────────────────────────

/** 返回多行 */
export function query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): T[] {
  return getDb().prepare(sql).all(...params) as T[];
}

/** 返回单行，不存在时返回 null */
export function queryOne<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): T | null {
  return (getDb().prepare(sql).get(...params) as T) ?? null;
}

/** 执行 INSERT / UPDATE / DELETE */
export function execute(
  sql: string,
  params: unknown[] = []
): { insertId: number | bigint; affectedRows: number } {
  const r = getDb().prepare(sql).run(...params);
  return { insertId: r.lastInsertRowid, affectedRows: r.changes };
}

/** 事务 */
export function transaction<T>(fn: () => T): T {
  return getDb().transaction(fn)();
}

/** 分页查询 */
export function queryPage<T = Record<string, unknown>>(
  baseSql: string,
  params: unknown[],
  page: number,
  pageSize: number
): { list: T[]; total: number } {
  const db = getDb();
  const countRow = db
    .prepare(`SELECT COUNT(*) AS total FROM (${baseSql})`)
    .get(...params) as { total: number };
  const total = countRow?.total ?? 0;
  const list = db
    .prepare(`${baseSql} LIMIT ? OFFSET ?`)
    .all(...params, pageSize, (page - 1) * pageSize) as T[];
  return { list, total };
}
