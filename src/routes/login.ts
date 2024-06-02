import {
	RouteBases,
	Routes,
	type RESTGetCurrentUserGuildMemberResult,
	type RESTPostOAuth2AccessTokenResult,
	type RESTPostOAuth2AccessTokenURLEncodedData
} from 'discord-api-types/v10'
import type { Request } from 'partykit/server'
import jwt from '@tsndr/cloudflare-worker-jwt'
import firebase from '@/firebase.json'
import { error } from '../responses'

export async function login(req: Request, env: Record<string, string>) {
	const body: { code: string; guild: string } = await req.json()

	const discordTokenResponse = (await (
		await fetch(RouteBases.api + Routes.oauth2TokenExchange(), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: new URLSearchParams({
				client_id: env.CLIENT_ID,
				client_secret: env.CLIENT_SECRET,
				grant_type: 'authorization_code',
				code: body.code
			} satisfies RESTPostOAuth2AccessTokenURLEncodedData)
		})
	).json()) as RESTPostOAuth2AccessTokenResult

	const guildMember = (await (
		await fetch(RouteBases.api + Routes.userGuildMember(body.guild), {
			headers: {
				Authorization: `Bearer ${discordTokenResponse.access_token}`
			}
		})
	).json()) as RESTGetCurrentUserGuildMemberResult

	if (!guildMember.user) return error('failed to log in')

	const firebaseToken = await jwt.sign(
		{
			iss: firebase.client_email,
			sub: firebase.client_email,
			aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
			exp: Math.floor(Date.now() / 1000) + 60,
			uid: guildMember.user!.id,
			claims: {
				guild: body.guild,
				roles: guildMember.roles
			}
		},
		firebase.private_key,
		'RS256'
	)

	const serverToken = await jwt.sign(
		{
			user: guildMember.user.id,
			guild: body.guild,
			exp: Math.floor(Date.now() / 1000) + 604800
		},
		env.JWT_SECRET
	)

	return new Response(
		JSON.stringify({
			discordToken: discordTokenResponse.access_token,
			firebaseToken,
			serverToken
		})
	)
}
