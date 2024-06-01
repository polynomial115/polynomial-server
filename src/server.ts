import type * as Party from "partykit/server";
import jwt from '@tsndr/cloudflare-worker-jwt'
import firebase from '../firebase.json'
import { ChannelType, RouteBases, Routes, type RESTGetAPIGuildChannelsResult, type RESTGetAPIGuildMembersResult, type RESTGetCurrentUserGuildMemberResult, type RESTPostAPIChannelMessageJSONBody, type RESTPostOAuth2AccessTokenResult } from 'discord-api-types/v10'
import { ProjectView, PayloadType, payloadIsType, type Payload } from './payload';

export default class Server implements Party.Server {
  constructor(readonly room: Party.Room) {}

  project = ''
  projectView = ProjectView.Overview

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
        this.projectView = payload.data.projectView
        this.room.broadcast(message, [sender.id])

      } else if (payloadIsType(payload, PayloadType.GetPage)) {
        sender.send(JSON.stringify({
          type: PayloadType.PageUpdate,
          data: {
            project: this.project,
            projectView: this.projectView
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
    const jwtSecret = lobby.env.JWT_SECRET as string

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

      const serverToken = await jwt.sign({
        user: guildMember.user.id,
        guild: body.guild,
        exp: Math.floor(Date.now() / 1000) + 604800,
      }, jwtSecret)

      return new Response(JSON.stringify({
        discordToken: discordTokenResponse.access_token,
        firebaseToken,
        serverToken
      }))

    } else if (path.startsWith('/roles')) {
      const guildId = path.split('/')[2]

      const token = req.headers.get('Authorization')
      if (!token || !await jwt.verify(token, jwtSecret))
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

      const tokenData = jwt.decode<{ guild: string }>(token)
      if (guildId !== tokenData.payload?.guild)
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })

      return fetch(RouteBases.api + Routes.guildRoles(guildId), {
        headers: {
          Authorization: `Bot ${lobby.env.DISCORD_TOKEN}`
        }
      })

    } else if (path.startsWith('/channels')) {
      const guildId = path.split('/')[2]

      const token = req.headers.get('Authorization')
      if (!token || !await jwt.verify(token, jwtSecret))
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

      const tokenData = jwt.decode<{ guild: string }>(token)
      if (guildId !== tokenData.payload?.guild)
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })

      const channels = await (await fetch(RouteBases.api + Routes.guildChannels(guildId), {
        headers: {
          Authorization: `Bot ${lobby.env.DISCORD_TOKEN}`
        }
      })).json() as RESTGetAPIGuildChannelsResult
      if (!Array.isArray(channels)) return new Response(JSON.stringify({ error: 'Failed to fetch channels' }), { status: 400 })
      const filteredChannels = channels.filter(channel => channel.type === ChannelType.GuildText)
      return new Response(JSON.stringify(filteredChannels))

    } else if (path.startsWith('/members')) {
      const guildId = path.split('/')[2]

      const token = req.headers.get('Authorization')
      if (!token || !await jwt.verify(token, jwtSecret))
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

      const tokenData = jwt.decode<{ guild: string }>(token)
      if (guildId !== tokenData.payload?.guild)
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })

      const members = await (await fetch(RouteBases.api + Routes.guildMembers(guildId) + '?limit=1000', {
        headers: {
          Authorization: `Bot ${lobby.env.DISCORD_TOKEN}`
        }
      })).json() as RESTGetAPIGuildMembersResult
      if (!Array.isArray(members)) return new Response(JSON.stringify({ error: 'Failed to fetch members' }), { status: 400 })
      const filteredMembers = members.filter(member => member.user && !member.user.bot)
      return new Response(JSON.stringify(filteredMembers))

    } else if (/\/projects\/.+\/tasks\/.+\/notify\/create/.test(path) && req.method === 'POST') {
      const [,, projectID ,, taskID] = path.split('/')

      const token = req.headers.get('Authorization')
      if (!token || !await jwt.verify(token, jwtSecret))
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

      const firebaseToken = req.headers.get('Firebase-Token')
      const projectData = await (await fetch(`https://firestore.googleapis.com/v1/projects/${firebase.project_id}/databases/(default)/documents/projects/${projectID}`, {
        headers: { Authorization: 'Bearer ' + firebaseToken }
      })).json() as any
      if (!projectData.fields) return new Response(JSON.stringify({ error: 'Invalid Firebase Token' }), { status: 403 })

      const guildId = projectData.fields.guildId?.stringValue
      const tokenData = jwt.decode<{ user: String, guild: string }>(token)
      if (!tokenData.payload || guildId !== tokenData.payload.guild)
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })

      const projectName = projectData.fields.name?.stringValue

      const notificationsChannel = projectData.fields.notificationsChannel?.stringValue
      if (!notificationsChannel)
        return new Response(JSON.stringify({ error: 'No notifications channel' }), { status: 400 })

      const task = projectData.fields.tasks?.arrayValue?.values?.find((v: any) => v.mapValue?.fields?.id?.stringValue === taskID)
      if (!task)
        return new Response(JSON.stringify({ error: 'Task not found' }), { status: 400 })

      const taskName = task.mapValue.fields.name?.stringValue

      await fetch(RouteBases.api + Routes.channelMessages(notificationsChannel), {
        method: 'POST',
        headers: {
          Authorization: `Bot ${lobby.env.DISCORD_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: `<@${tokenData.payload.user}> created task **${taskName}** in ${projectName}.`,
          allowed_mentions: { parse: [] }
        } satisfies RESTPostAPIChannelMessageJSONBody)
      })

      return new Response('Sent notification', { status: 200 })
    }

  }
}

Server satisfies Party.Worker;
