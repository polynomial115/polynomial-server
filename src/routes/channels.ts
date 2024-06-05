import type { Request } from 'partykit/server'
import { ChannelType, RouteBases, Routes, type RESTGetAPIGuildChannelsResult } from 'discord-api-types/v10'
import { error } from '../responses'

export async function channels(req: Request, guild: string, env: Record<string, string>) {
	const channels = (await (
		await fetch(RouteBases.api + Routes.guildChannels(guild), {
			headers: {
				Authorization: `Bot ${env.DISCORD_TOKEN}`
			}
		})
	).json()) as RESTGetAPIGuildChannelsResult

	if (!Array.isArray(channels)) return error('Failed to fetch channels')

	const filteredChannels = channels.filter(channel => channel.type === ChannelType.GuildText)

	return Response.json(filteredChannels)
}
