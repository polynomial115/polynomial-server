import type { Request } from 'partykit/server'
import { RouteBases, Routes } from 'discord-api-types/v10'

export async function roles(req: Request, guild: string, env: Record<string, string>) {
	return fetch(RouteBases.api + Routes.guildRoles(guild), {
		headers: {
			Authorization: `Bot ${env.DISCORD_TOKEN}`
		}
	})
}
