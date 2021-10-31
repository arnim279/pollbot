/**
 * @property poll_type 0: normal, 1:vote amount only visible after poll is closed
 */
export type Poll = {
	poll_id: string;
	poll_type: 0 | 1;
	creator_id: string;
	option_count: number;
	channel_id: string;
	message_id: string;
	last_updated: number;
};
