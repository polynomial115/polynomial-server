import type { Request } from 'partykit/server'
import { RouteBases, Routes, type RESTPostAPIChannelMessageJSONBody } from 'discord-api-types/v10'
import firebase from '@/firebase.json'
import { error, forbidden } from '@/src/responses'
import type { TokenData } from '@/src/server'

export async function notifyCreate(req: Request, path: string, tokenData: TokenData, env: Record<string, string>) {
	const [, , projectID, , taskID] = path.split('/')

	const firebaseToken = req.headers.get('Firebase-Token')
	const projectData = (await (
		await fetch(`https://firestore.googleapis.com/v1/projects/${firebase.project_id}/databases/(default)/documents/projects/${projectID}`, {
			headers: { Authorization: 'Bearer ' + firebaseToken }
		})
	).json()) as any
	if (!projectData.fields) return error('Invalid Firebase Token', 403)

	const guildId = projectData.fields.guildId?.stringValue

	if (!tokenData || guildId !== tokenData.guild) return forbidden()

	const projectName = projectData.fields.name?.stringValue as string

	const notificationsChannel = projectData.fields.notificationsChannel?.stringValue as string
	if (!notificationsChannel) return error('No notifications channel')

	const task = projectData.fields.tasks?.arrayValue?.values?.find((v: any) => v.mapValue?.fields?.id?.stringValue === taskID)
	if (!task) return error('Task not found')

	const taskName = task.mapValue.fields.name?.stringValue

	await fetch(RouteBases.api + Routes.channelMessages(notificationsChannel), {
		method: 'POST',
		headers: {
			Authorization: `Bot ${env.DISCORD_TOKEN}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			content: `<@${tokenData.user}> created task **${taskName}** in ${projectName}.`,
			allowed_mentions: { parse: [] }
		} satisfies RESTPostAPIChannelMessageJSONBody)
	})

	return new Response('Sent notification')
}
