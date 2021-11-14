/**
 * @property poll_type 0: normal, 1:vote amount only visible after poll is closed
 */
export type Poll = {
	poll_id: number;
	poll_type: 0 | 1;
	title: string;
	creator_name: string;
	creator_id: string;
	option_count: number;
	channel_id: string;
	message_id: string;
	last_updated: number;
};

export type PollOption = {
	poll_id: number;
	option_id: number;
	value: string;
};

export type Vote = {
	poll_id: string;
	user_id: string;
	chosen_option: number;
};
