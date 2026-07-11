import mysql from "mysql2/promise";

declare global {
  // eslint-disable-next-line no-var
  var _mysqlPool: mysql.Pool | undefined;
}

function createPool(): mysql.Pool {
  return mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "filepress",
    charset: "utf8mb4",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: "+08:00",
  });
}

// 开发环境复用连接池，避免热重载时重复创建
const pool = globalThis._mysqlPool ?? createPool();
if (process.env.NODE_ENV !== "production") {
  globalThis._mysqlPool = pool;
}

export default pool;

/** 表名前缀，对应 PHP 的 fp_ */
export const TABLE_PREFIX = process.env.DB_TABLE_PREFIX || "fp_";

/** 快捷查询 */
export async function query<T = mysql.RowDataPacket[]>(
  sql: string,
  values?: unknown[]
): Promise<T> {
  const [rows] = await pool.execute(sql, values);
  return rows as T;
}

/** 分页查询 */
export async function queryPage<T = mysql.RowDataPacket>(
  sql: string,
  values: unknown[],
  page: number,
  pageSize: number
): Promise<{ list: T[]; total: number }> {
  const countSql = `SELECT COUNT(*) as total FROM (${sql}) AS _count_query`;
  const [[countRow]] = await pool.execute<mysql.RowDataPacket[]>(countSql, values);
  const total = (countRow as mysql.RowDataPacket).total as number;

  const pageSql = `${sql} LIMIT ? OFFSET ?`;
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(pageSql, [
    ...values,
    pageSize,
    (page - 1) * pageSize,
  ]);

  return { list: rows as T[], total };
}

/** 单行查询 */
export async function queryOne<T = mysql.RowDataPacket>(
  sql: string,
  values?: unknown[]
): Promise<T | null> {
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(sql, values);
  return (rows[0] as T) ?? null;
}
