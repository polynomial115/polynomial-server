import type { Request } from 'partykit/server'
import { RouteBases, Routes, type RESTGetAPIGuildMembersResult } from 'discord-api-types/v10'
import { error, forbidden } from '../responses'
import type { TokenData } from '../server'

export async function members(req: Request, path: string, tokenData: TokenData, env: Record<string, string>) {
	const guildId = path.split('/')[2]

	if (guildId !== tokenData?.guild)
		return forbidden()

	const members = await (await fetch(RouteBases.api + Routes.guildMembers(guildId) + '?limit=1000', {
		headers: {
			Authorization: `Bot ${env.DISCORD_TOKEN}`
		}
	})).json() as RESTGetAPIGuildMembersResult

	if (!Array.isArray(members)) return error('Failed to fetch members')

	const filteredMembers = members.filter(member => member.user && !member.user.bot)

	return new Response(JSON.stringify(filteredMembers))
}
