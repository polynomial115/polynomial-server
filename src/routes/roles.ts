import type { Request } from 'partykit/server'
import { RouteBases, Routes } from 'discord-api-types/v10'
import { forbidden } from '../responses'
import type { TokenData } from '../server'

export async function roles(req: Request, path: string, tokenData: TokenData, env: Record<string, string>) {
	const guildId = path.split('/')[2]

	if (guildId !== tokenData?.guild)
		return forbidden()

	return fetch(RouteBases.api + Routes.guildRoles(guildId), {
		headers: {
			Authorization: `Bot ${env.DISCORD_TOKEN}`
		}
	})
}
