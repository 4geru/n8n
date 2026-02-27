import { INodeProperties } from 'n8n-workflow';

export const profileOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['profile'] } },
		options: [
			{
				name: 'Get Bot Info',
				value: 'getBotInfo',
				description: 'ボット情報を取得',
				action: 'Get bot info',
			},
			{
				name: 'Get User Profile',
				value: 'getUser',
				description: 'ユーザーのプロフィールを取得',
				action: 'Get user profile',
			},
		],
		default: 'getUser',
	},
];

export const profileFields: INodeProperties[] = [
	{
		displayName: 'User ID',
		name: 'userId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { resource: ['profile'], operation: ['getUser'] } },
	},
];
