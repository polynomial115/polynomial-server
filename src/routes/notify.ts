import type { Request } from 'partykit/server'
import { RouteBases, Routes, type RESTPostAPIChannelMessageJSONBody } from 'discord-api-types/v10'
import firebase from '@/firebase.json'
import { error, forbidden } from '@/src/responses'
import type { TokenData } from '@/src/server'
import type { Document } from '@/src/types/firestore'
import { TaskStatus, taskStatusNames, type Task } from '../types/task'

const formatter = new Intl.ListFormat()

export async function notify(req: Request, path: string, tokenData: TokenData, env: Record<string, string>) {
	const [, , projectID, , taskID] = path.split('/')

	const body = await req.json<{ oldTask: Task | null }>()

	if (!(body && 'oldTask' in body)) return error('Invalid Body')
	const { oldTask } = body

	const firebaseToken = req.headers.get('Firebase-Token')
	const projectData = (await (
		await fetch(`https://firestore.googleapis.com/v1/projects/${firebase.project_id}/databases/(default)/documents/projects/${projectID}`, {
			headers: { Authorization: 'Bearer ' + firebaseToken }
		})
	).json()) as Document
	if (!projectData.fields) return error('Invalid Firebase Token', 403)

	const guildId = projectData.fields.guildId?.stringValue

	if (!tokenData || guildId !== tokenData.guild) return forbidden()

	const projectName = projectData.fields.name?.stringValue

	const notificationsChannel = projectData.fields.notificationsChannel?.stringValue
	if (!notificationsChannel) return error('No notifications channel')

	const task = projectData.fields.tasks?.arrayValue?.values?.find(v => v.mapValue?.fields?.id?.stringValue === taskID)
	if (!task?.mapValue?.fields) return error('Task not found')

	const taskName = task.mapValue.fields.name?.stringValue
	const taskStatus = Number(task.mapValue.fields.status?.integerValue) as TaskStatus
	const taskAssignees = task.mapValue.fields.assignees?.arrayValue?.values?.map(v => v.stringValue!) ?? []

	const sendMessage = async (content: string, mentionUsers: string[] = []) =>
		await fetch(RouteBases.api + Routes.channelMessages(notificationsChannel), {
			method: 'POST',
			headers: {
				Authorization: `Bot ${env.DISCORD_TOKEN}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				content,
				allowed_mentions: { users: mentionUsers }
			} satisfies RESTPostAPIChannelMessageJSONBody)
		})

	if (oldTask) {
		if (oldTask.status !== taskStatus) {
			if (taskStatus === TaskStatus.Completed) {
				await sendMessage(`<@${tokenData.user}> completed task **${taskName}** in ${projectName}  🎉`)
			} else if (taskStatus === TaskStatus.InProgress && oldTask.status !== TaskStatus.Completed) {
				await sendMessage(`<@${tokenData.user}> started task **${taskName}** in ${projectName}.`)
			} else {
				await sendMessage(
					`<@${tokenData.user}> moved task **${taskName}** from ${taskStatusNames[oldTask.status]} to ${taskStatusNames[taskStatus]} in ${projectName}.`
				)
			}
		}

		const serializeUser = (id: string) => (id === tokenData.user ? 'themself' : `<@${id}>`)

		const newAssignees = taskAssignees.filter(id => !oldTask.assignees.includes(id))
		const removedAssignees = oldTask.assignees.filter(id => !taskAssignees.includes(id))
		if (newAssignees.length) {
			await sendMessage(
				`<@${tokenData.user}> assigned ${formatter.format(newAssignees.map(serializeUser))} to task **${taskName}** in ${projectName}.`,
				newAssignees.filter(id => id !== tokenData.user)
			)
		}
		if (removedAssignees.length) {
			await sendMessage(
				`<@${tokenData.user}> removed ${formatter.format(removedAssignees.map(serializeUser))} from task **${taskName}** in ${projectName}.`,
				removedAssignees.filter(id => id !== tokenData.user)
			)
		}
	} else {
		await sendMessage(`<@${tokenData.user}> created task **${taskName}** in ${projectName}.`)
	}

	return new Response()
}
