import { DB as SQLiteDataBase } from "https://deno.land/x/sqlite@v2.4.2/mod.ts";
import { ColumnName } from "https://deno.land/x/sqlite@v2.4.2/src/rows.ts";

export const db = new SQLiteDataBase("./data.sql");

/**
 * performs a sql query and returns an array of JSON objects like `[ { "column_name": "value" } ]`
 * @param query sql query
 * @returns Array of JSON Objects
 */
export function getJSONFromSQLQuery(
  query: string,
): Record<string, string | number>[] {
  const queryResponse = db.query(query);

  let columns: ColumnName[];
  try {
    columns = queryResponse.columns().filter((column) =>
      column.tableName === "votes"
    );
  } catch {
    columns = [];
  }

  const res: Record<string, string | number>[] = [];

  for (const column of queryResponse) {
    res.push({});
    for (const index in column) {
      res[res.length - 1][columns[index].name] = column[index];
    }
  }
  return res;
}
