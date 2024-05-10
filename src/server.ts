import type * as Party from "partykit/server";
import jwt from '@tsndr/cloudflare-worker-jwt'
import firebase from '../firebase.json'
import { RouteBases, Routes, type RESTGetAPIGuildMembersResult, type RESTGetCurrentUserGuildMemberResult, type RESTPostOAuth2AccessTokenResult } from 'discord-api-types/v10'
import { PayloadType, payloadIsType, type Payload } from './payload';

export default class Server implements Party.Server {
  constructor(readonly room: Party.Room) {}

  project = ''

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    // A websocket just connected!
    console.log(
      `Connected:
  id: ${conn.id}
  room: ${this.room.id}
  url: ${new URL(ctx.request.url).pathname}`
    );
  }

  onMessage(message: string, sender: Party.Connection) {
    // let's log the message
    console.log(`connection ${sender.id} sent message: ${message}`);
    try {
      const payload = JSON.parse(message) as Payload

      if (payloadIsType(payload, PayloadType.PageUpdate)) {
        this.project = payload.data.project
        this.room.broadcast(message, [sender.id])

      } else if (payloadIsType(payload, PayloadType.GetPage)) {
        sender.send(JSON.stringify({
          type: PayloadType.PageUpdate,
          data: {
            project: this.project
          }
        } satisfies Payload))
      }

    } catch {
      console.log('Error processing message', message)
    }
  }

  static async onFetch(
    req: Party.Request,
    lobby: Party.FetchLobby,
    ctx: Party.ExecutionContext
  ) {
    const path = new URL(req.url).pathname
    if (path === '/login') {
      const body: { code: string, guild: string } = await req.json()
      const discordTokenResponse = await (await fetch(RouteBases.api + Routes.oauth2TokenExchange(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: lobby.env.CLIENT_ID as string,
          client_secret: lobby.env.CLIENT_SECRET as string,
          grant_type: 'authorization_code',
          code: body.code
        }),
      })).json() as RESTPostOAuth2AccessTokenResult

      console.log(discordTokenResponse)

      const guildMember = await (await fetch(RouteBases.api + Routes.userGuildMember(body.guild), {
        headers: {
          Authorization: `Bearer ${discordTokenResponse.access_token}`
        }
      })).json() as RESTGetCurrentUserGuildMemberResult
      console.log(guildMember)
      console.log('logging in')

      if (!guildMember.user) return new Response('failed to log in', { status: 400 })

      const firebaseToken = await jwt.sign({
        iss: firebase.client_email,
        sub: firebase.client_email,
        aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
        exp: Math.floor(Date.now() / 1000) + 60,
        uid: guildMember.user!.id,
        claims: {
          guild: body.guild,
          roles: guildMember.roles
        }
      }, firebase.private_key, 'RS256')
    
      return new Response(JSON.stringify({
        discordToken: discordTokenResponse.access_token,
        firebaseToken
      }))
    } else if (path.startsWith('/roles')) {
      const guildId = path.split('/')[2]
      return fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
        headers: {
          Authorization: `Bot ${lobby.env.DISCORD_TOKEN}`
        }
      })
    } else if (path.startsWith('/members')) {
      const guildId = path.split('/')[2]
      const members = await (await fetch(`https://discord.com/api/v10/guilds/${guildId}/members?limit=1000`, {
        headers: {
          Authorization: `Bot ${lobby.env.DISCORD_TOKEN}`
        }
      })).json() as RESTGetAPIGuildMembersResult
      if (!Array.isArray(members)) return new Response(JSON.stringify({ error: 'Failed to fetch members' }))
      const filteredMembers = members.filter(member => member.user && !member.user.bot)
      return new Response(JSON.stringify(filteredMembers))
    }
  }
}

Server satisfies Party.Worker;
