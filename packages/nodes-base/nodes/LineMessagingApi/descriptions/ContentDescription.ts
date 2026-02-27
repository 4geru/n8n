import { INodeProperties } from 'n8n-workflow';

export const contentOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['content'] } },
		options: [
			{
				name: 'Download',
				value: 'download',
				description: 'バイナリデータとしてダウンロード',
				action: 'Download content',
			},
			{
				name: 'Get Preview',
				value: 'getPreview',
				description: 'プレビュー画像を取得',
				action: 'Get content preview',
			},
			{
				name: 'Get Transcoding Status',
				value: 'getTranscoding',
				description: '変換状況を確認',
				action: 'Get transcoding status',
			},
		],
		default: 'download',
	},
];

export const contentFields: INodeProperties[] = [
	{
		displayName: 'Message ID',
		name: 'messageId',
		type: 'string',
		required: true,
		default: '',
		description: 'Webhook イベントの message.id',
		displayOptions: { show: { resource: ['content'] } },
	},
];
