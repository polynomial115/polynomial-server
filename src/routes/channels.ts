import type { Request } from 'partykit/server'
import { ChannelType, RouteBases, Routes, type RESTGetAPIGuildChannelsResult } from 'discord-api-types/v10'
import { error, forbidden } from '../responses'
import type { TokenData } from '../server'

export async function channels(req: Request, path: string, tokenData: TokenData, env: Record<string, string>) {
	const guildId = path.split('/')[2]

	if (guildId !== tokenData?.guild)
		return forbidden()

	const channels = await (await fetch(RouteBases.api + Routes.guildChannels(guildId), {
		headers: {
			Authorization: `Bot ${env.DISCORD_TOKEN}`
		}
	})).json() as RESTGetAPIGuildChannelsResult

	if (!Array.isArray(channels)) return error('Failed to fetch channels')

	const filteredChannels = channels.filter(channel => channel.type === ChannelType.GuildText)

	return new Response(JSON.stringify(filteredChannels))
}
