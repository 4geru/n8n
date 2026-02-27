import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import { lineApiRequest } from './GenericFunctions';
import { contentOperations, contentFields } from './descriptions/ContentDescription';
import { loadingFields } from './descriptions/LoadingDescription';
import { messageOperations, messageFields } from './descriptions/MessageDescription';
import { profileOperations, profileFields } from './descriptions/ProfileDescription';

export class LineMessagingApi implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'LINE Messaging API',
		name: 'lineMessagingApi',
		icon: 'file:line.png',
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["resource"] + ($parameter["operation"] ? " · " + $parameter["operation"] : "")}}',
		description: 'LINE Messaging API を使ってメッセージ送信・コンテンツ取得・プロフィール取得などを行う',
		codex: {
			categories: ['Communication'],
			subcategories: {
				Communication: ['LINE Messaging API'],
				'LINE Messaging API': ['Actions'],
			},
		},
		defaults: { name: 'LINE Messaging API' },
		usableAsTool: true,
		inputs: ['main'],
		outputs: ['main'],
		credentials: [{ name: 'lineApi', required: true }],
		properties: [
			// ─── Resource ────────────────────────────────────────────────
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Content', value: 'content', description: 'ユーザーが送信したファイルを取得' },
					{ name: 'Loading', value: 'loading', description: 'ローディングアニメーションを表示' },
					{ name: 'Message', value: 'message', description: 'メッセージを送信' },
					{ name: 'Profile', value: 'profile', description: 'プロフィールを取得' },
				],
				default: 'message',
			},
			// ─── Operations & Fields (per resource) ──────────────────────
			...contentOperations,
			...contentFields,
			...loadingFields,
			...messageOperations,
			...messageFields,
			...profileOperations,
			...profileFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i, '') as string;

				// ── Message ───────────────────────────────────────────────
				if (resource === 'message') {
					const messagesRaw = this.getNodeParameter('messages', i);
					const messages =
						typeof messagesRaw === 'string'
							? (JSON.parse(messagesRaw) as IDataObject[])
							: (messagesRaw as IDataObject[]);
					let endpoint: string;
					let body: IDataObject;

					if (operation === 'reply') {
						const replyToken = this.getNodeParameter('replyToken', i) as string;
						endpoint = '/v2/bot/message/reply';
						body = { replyToken, messages };
					} else if (operation === 'push') {
						const userId = this.getNodeParameter('userId', i) as string;
						endpoint = '/v2/bot/message/push';
						body = { to: userId, messages };
					} else if (operation === 'multicast') {
						const to = (this.getNodeParameter('userIds', i) as string)
							.split(',')
							.map((s) => s.trim())
							.filter(Boolean);
						endpoint = '/v2/bot/message/multicast';
						body = { to, messages };
					} else {
						endpoint = '/v2/bot/message/broadcast';
						body = { messages };
					}

					const res = await lineApiRequest.call(this, 'POST', endpoint, body);
					returnData.push({ json: res ?? {}, pairedItem: { item: i } });
				}

				// ── Profile ───────────────────────────────────────────────
				else if (resource === 'profile') {
					let endpoint: string;
					if (operation === 'getUser') {
						endpoint = `/v2/bot/profile/${this.getNodeParameter('userId', i) as string}`;
					} else {
						endpoint = '/v2/bot/info';
					}
					const res = await lineApiRequest.call(this, 'GET', endpoint);
					returnData.push({ json: res, pairedItem: { item: i } });
				}

				// ── Content ───────────────────────────────────────────────
				else if (resource === 'content') {
					const messageId = this.getNodeParameter('messageId', i) as string;

					if (operation === 'getTranscoding') {
						const res = await lineApiRequest.call(
							this,
							'GET',
							`/v2/bot/message/${messageId}/content/transcoding`,
						);
						returnData.push({ json: res, pairedItem: { item: i } });
					} else {
						const endpoint =
							operation === 'download'
								? `/v2/bot/message/${messageId}/content`
								: `/v2/bot/message/${messageId}/content/preview`;
						const res = (await this.helpers.httpRequestWithAuthentication.call(this, 'lineApi', {
							method: 'GET',
							url: `https://api.line.me${endpoint}`,
							encoding: 'arraybuffer',
							returnFullResponse: true,
						})) as unknown as { body: Buffer; headers: Record<string, string> };
						const contentType = res.headers['content-type'] ?? 'application/octet-stream';
						const binaryData = await this.helpers.prepareBinaryData(
							Buffer.from(res.body),
							`line_content_${messageId}`,
							contentType,
						);
						returnData.push({
							json: { messageId, contentType },
							binary: { data: binaryData },
							pairedItem: { item: i },
						});
					}
				}

				// ── Loading ───────────────────────────────────────────────
				else if (resource === 'loading') {
					const chatId = this.getNodeParameter('chatId', i) as string;
					const loadingSeconds = this.getNodeParameter('loadingSeconds', i) as number;
					const res = await lineApiRequest.call(this, 'POST', '/v2/bot/chat/loading/start', {
						chatId,
						loadingSeconds,
					});
					returnData.push({ json: res ?? {}, pairedItem: { item: i } });
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
