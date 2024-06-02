import type * as Party from 'partykit/server'
import jwt from '@tsndr/cloudflare-worker-jwt'
import { ProjectView, PayloadType, payloadIsType, type Payload } from './payload'
import { login } from './routes/login'
import { roles } from './routes/roles'
import { channels } from './routes/channels'
import { members } from './routes/members'
import { notifyCreate } from './routes/notify/create'
import { unauthorized } from './responses'

export type TokenData =
	| {
			user: string
			guild: string
	  }
	| undefined

export default class Server implements Party.Server {
	constructor(readonly room: Party.Room) {}

	project = ''
	projectView = ProjectView.Overview

	onMessage(message: string, sender: Party.Connection) {
		try {
			const payload = JSON.parse(message) as Payload

			if (payloadIsType(payload, PayloadType.PageUpdate)) {
				this.project = payload.data.project
				this.projectView = payload.data.projectView
				this.room.broadcast(message, [sender.id])
			} else if (payloadIsType(payload, PayloadType.GetPage)) {
				sender.send(
					JSON.stringify({
						type: PayloadType.PageUpdate,
						data: {
							project: this.project,
							projectView: this.projectView
						}
					} satisfies Payload)
				)
			}
		} catch {
			console.log('Error processing message', message)
		}
	}

	static async onFetch(req: Party.Request, lobby: Party.FetchLobby, ctx: Party.ExecutionContext) {
		const path = new URL(req.url).pathname
		const env = lobby.env as Record<string, string>

		if (path === '/login' && req.method === 'POST') return await login(req, env)

		const token = req.headers.get('Authorization')
		if (!token || !(await jwt.verify(token, env.JWT_SECRET))) return unauthorized()

		const { payload: tokenData } = jwt.decode<TokenData>(token)

		if (path.startsWith('/roles/') && req.method === 'GET') return await roles(req, path, tokenData, env)

		if (path.startsWith('/channels/') && req.method === 'GET') return await channels(req, path, tokenData, env)

		if (path.startsWith('/members/') && req.method === 'GET') return await members(req, path, tokenData, env)

		if (/\/projects\/.+\/tasks\/.+\/notify\/create/.test(path) && req.method === 'POST') return await notifyCreate(req, path, tokenData, env)
	}
}

Server satisfies Party.Worker
