import type { Request } from 'partykit/server'
import { RouteBases, Routes, type RESTGetAPIGuildMembersResult } from 'discord-api-types/v10'
import { error } from '../responses'

export async function members(req: Request, guild: string, env: Record<string, string>) {
	const members = (await (
		await fetch(RouteBases.api + Routes.guildMembers(guild) + '?limit=1000', {
			headers: {
				Authorization: `Bot ${env.DISCORD_TOKEN}`
			}
		})
	).json()) as RESTGetAPIGuildMembersResult

	if (!Array.isArray(members)) return error('Failed to fetch members')

	const filteredMembers = members.filter(member => member.user && !member.user.bot)

	return Response.json(filteredMembers)
}
