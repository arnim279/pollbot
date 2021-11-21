import {
	DB,
	ColumnName,
	QueryParam,
} from 'https://deno.land/x/sqlite@v2.4.2/mod.ts';
import { Poll, Vote, PollOption } from '../types.ts';

export const db = new DB('./data/data.sql');

export function initDatabase() {
	db.query(`
    CREATE TABLE IF NOT EXISTS polls (
      poll_id INTEGER PRIMARY KEY AUTOINCREMENT,
      poll_type INTEGER,
			title TEXT,
      creator_id TEXT,
			creator_name TEXT,
      option_count INTEGER,
      channel_id TEXT,
      message_id TEXT,
      last_updated INTEGER
    );
  `);

	db.query(`
    CREATE TABLE IF NOT EXISTS polloptions (
      poll_id INTEGER,
			option_id INTEGER,
			value TEXT
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

export function query(query: string, values: QueryParam[] = []) {
	db.query(query, values);
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

export function createPoll(poll: Poll) {
	query(
		'INSERT INTO polls (poll_type, title, creator_name, creator_id, option_count, channel_id, message_id, last_updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?);',
		[
			poll.poll_type,
			poll.title,
			poll.creator_name,
			poll.creator_id,
			poll.option_count,
			poll.channel_id,
			poll.message_id,
			poll.last_updated,
		]
	);
}

export function deletePoll(poll_id: number) {
	query('DELETE FROM polls WHERE poll_id = ?;', [poll_id]);
	query('DELETE FROM polloptions WHERE poll_id = ?;', [poll_id]);
}

export function addVote(vote: Vote) {
	query(
		'INSERT OR IGNORE INTO votes (poll_id, user_id, chosen_option) VALUES (?, ?, ?);',
		[vote.poll_id, vote.user_id, vote.chosen_option]
	);
	query(
		'UPDATE votes SET chosen_option = ? WHERE poll_id = ? AND user_id = ?;',
		[vote.chosen_option, vote.poll_id, vote.user_id]
	);
}

export function deleteVote(vote: Vote) {
	query('DELETE FROM votes WHERE poll_id = ? AND user_id = ?;', [
		vote.poll_id,
		vote.user_id,
	]);
}

export function addPollOption(option: PollOption) {
	query(
		'INSERT OR IGNORE INTO polloptions (poll_id, option_id, value) VALUES (?, ?, ?);',
		[option.poll_id, option.option_id, option.value]
	);
}
