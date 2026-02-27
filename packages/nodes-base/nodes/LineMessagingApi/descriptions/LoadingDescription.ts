import { INodeProperties } from 'n8n-workflow';

export const loadingFields: INodeProperties[] = [
	{
		displayName: 'Chat ID',
		name: 'chatId',
		type: 'string',
		required: true,
		default: '',
		description: 'ローディングを表示するチャットの userId',
		displayOptions: { show: { resource: ['loading'] } },
	},
	{
		displayName: 'Loading Seconds',
		name: 'loadingSeconds',
		type: 'number',
		default: 5,
		description: 'ローディング表示秒数（5〜60秒）',
		typeOptions: { minValue: 5, maxValue: 60 },
		displayOptions: { show: { resource: ['loading'] } },
	},
];
