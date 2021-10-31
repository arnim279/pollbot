import {
	DB,
	ColumnName,
	QueryParam,
} from 'https://deno.land/x/sqlite@v2.4.2/mod.ts';

export const db = new DB('./data/data.sql');

export function initDatabase() {
	db.query(`
    CREATE TABLE IF NOT EXISTS polls (
      poll_id INTEGER PRIMARY KEY AUTOINCREMENT,
      poll_type INTEGER
      creator_id TEXT,
      option_count INTEGER,
      channel_id TEXT,
      message_id TEXT,
      last_updated INTEGER
    );
  `);

	db.query(`
    CREATE TABLE IF NOT EXISTS votes (
      poll_id INTEGER,
      user_id TEXT,
      chosen_option INTEGER,
      UNIQUE(user_id, poll_id)
    );
	`);
}

export function query(query: string) {
	db.query(query);
}

export function getJSONFromSQLQuery<type>(
	query: string,
	values: QueryParam[] = []
) {
	const queryResponse = db.query(query, values);

	let columns: ColumnName[];
	try {
		columns = queryResponse.columns();
	} catch {
		columns = [];
	}

	const res: Record<string, number>[] = [];

	for (const column of queryResponse) {
		res.push({});
		for (const index in column) {
			res[res.length - 1][columns[index].name] = column[index];
		}
	}
	return res as unknown[] as type[];
}

export function addRole(server_id: string, role_id: string, role_name: string) {
	return db.query(
		'INSERT OR IGNORE INTO roles (server_id, role_id, role_name) VALUES (?, ?, ?);',
		[server_id, role_id, role_name]
	);
}

/**
 * removes a role.
 * @param server_id
 * @param role_id if not given, all roles from this server will be removed
 * @returns
 */
export function removeRole(server_id: string, role_id?: string) {
	return role_id
		? db.query('DELETE FROM roles WHERE server_id = ? AND role_id = ?;', [
				server_id,
				role_id,
		  ])
		: db.query('DELETE FROM roles WHERE server_id = ?;', [server_id]);
}
