#!env ts-node
'use strict'

import * as http from 'http'
import * as url from 'url'
import * as express from 'express'

import log = require('npmlog') // https://github.com/Microsoft/TypeScript/issues/6751
log.level = 'verbose'
log.level = 'silly'

// const dbUri = process.env.MONGODB_URI

type IoProtocol = 'io' | 'web'

interface ClientInfo {
  token: string
  protocol: IoProtocol
}

// type ServerEventName = 
// 	'sys'
//   | 'online'
//   | 'offline'

type WechatyEventName = 
  'scan'
  | 'login'
  | 'logout'
  | 'message'
  | 'ding'
  | 'dong'

type EventName =
  'raw'
  // | ServerEventName
  | WechatyEventName

interface IoEvent {
  name: EventName
  payload: string | Object
}

/**
 * 
 * IoSocket
 * 
 */
import * as WebSocket from 'ws'

class IoSocket {
  wss: WebSocket.Server

  constructor(
    private server: http.Server
    , private auth: (req: http.ServerRequest) => Promise<string>
    , private connect: (client: WebSocket) => void 
  ) {
  }

  init(): Promise<IoSocket> {
    // https://github.com/websockets/ws/blob/master/doc/ws.md
    const options = {
      handleProtocols: this.handleProtocols.bind(this)
      , verifyClient: this.verifyClient.bind(this)
      , server: this.server
      // , host: process.env.IP
      // , port: process.env.PORT
    }
    this.wss = new WebSocket.Server(options)
    this.wss.on('connection', this.connect)

    return Promise.resolve(this)
  }

  /**
   * https://bugs.chromium.org/p/chromium/issues/detail?id=398407#c2
   */
  private handleProtocols(protocols, done) {
    console.log('handleProtocols() protocols: ' + protocols)
    done(true, protocols[0])
  }

  /**
   * check token for websocket client
   * http://stackoverflow.com/a/19155613/1123955
   */
  private verifyClient(
    info: {
      origin: string
      secure: boolean
      req: http.ServerRequest
    }
    , done: (res: boolean, code?: number, message?: string) => void
  ): void {
    log.verbose('WebSocket', 'verifyClient()')

    const {origin, secure, req} = info
    log.verbose('verifyClient()', req.url)

    this.auth(req)
        .then(token => {
          log.verbose('IoSocket', 'verifyClient() auth succ for token: %s', token)
          req['user'] = token
          done(true, 200, 'Ok')
        })
        .catch(e => {
          log.verbose('IoSocket', 'verifyClient() auth fail: %s', e.message)
          return done(false, 401, 'Unauthorized: ' + e.message)
        })
  }

}


/**
 * Io Manager
 */
import { Listag } from 'listag'

class IoManager {
  ltSocks = new Listag()

  constructor() {
  }

  register(client: WebSocket): void {
    log.verbose('IoManager', 'register()')
    const user      = client.upgradeReq['user']
    const protocol  = client['protocol']
    const [location, version]] = protocol.split('|')

    // console.log(ws)
    // console.log(': ' + ws.upgradeReq.client.user)
    // upgradeReq.socket/connection/client

    log.verbose('IoManager', 'register from user[%s] at location[%s] with version[%s]'
                            , user
                            , location
                            , version
              )

    Object.assign(client, {
      user
      , location
    })

    this.ltSocks.add(client).tag({user, location})

    // var location = url.parse(client.upgradeReq.url, true);
    // you might use location.query.access_token to authenticate or share sessions
    // or client.upgradeReq.headers.cookie (see http://stackoverflow.com/a/16395220/151312)

    client.on('message', this.onMessage.bind(this, client))
    client.on('error', this.unRegister.bind(this, client))
    client.on('close', this.unRegister.bind(this, client))

    const onlineEvent: IoEvent = {
      name: 'online'
      , payload: 'protocol'
    }
    this.castBy(client, regEvent)

    // const registerEvent: IoEvent = {
    //   name: 'sys'
    //   , payload: 'registered'
    // }
    // this.send(client, registerEvent)

    return
  }


  unRegister(client: WebSocket, e: any ) {
    log.verbose('IoManager', 'unregister(%s)', e)

    this.ltSocks.del(client)
    client.close()

    // const offlineEvent: IoEvent = {
    //   name: 'offline'
    //   , payload: 'protocol'
    // }
    // this.castBy(client, offlineEvent)
  }

  onMessage(client: WebSocket, message) {
    log.verbose('IoManager', 'onMessage() received: %s', message)

    let ioEvent: IoEvent = {
      name: 'raw'
      , payload: message
    }
    try {
      const obj = JSON.parse(message)
      ioEvent.name    = obj.name
      ioEvent.payload = obj.payload
    } catch (e) {
      log.warn('IoManager', 'onMessage() parse message fail. orig message: [%s]', message)
    }
    this.castBy(client, ioEvent)

    // const rogerEvent: IoEvent = {
    //   name: 'sys'
    //   , payload: 'roger'
    // }
    // this.send(client, rogerEvent)
  }

  send(client: WebSocket, ioEvent: IoEvent) {
    log.verbose('IoManager', 'send()')
    return client.send(ioEvent)
  }

  castBy(client: WebSocket, ioEvent: IoEvent): void {
    log.verbose('IoManager', 'cast(%s, %s, %s)', user, fromLocation, message)

    const user    = client['user']
    const location  = client['location']

    log.verbose('IoManager', 'unregister() user: %s location: %s', user, location)

    const tagMap = {user, fromLocation}
    console.log('tagMap')
    console.log(tagMap)
    const socks = this.ltSocks.get(tagMap)

    console.log('this.ltSocks length: ' + (this.ltSocks && this.ltSocks.length))
    // console.log('socks' + socks)
    console.log('socks length: ' + (socks && socks.length))

    this.ltSocks.forEach(v => {
      // console.log('user: ' + v.user)
      let tagMap = this.ltSocks.getTag(v)
      console.log(tagMap)
    })

    if (socks) {
      log.verbose('broadcast', 'found %d socks', socks.length)
      socks.forEach(s => {
        if (s.readyState === WebSocket.OPEN) {
          s.send(fromLocation + '[' + user + ']: ' + message)
        }
      })
    }
  }

}

/**
 * Auth Class
 */
class IoAuth {
  constructor() {

  }

  auth(req: http.ServerRequest): Promise<string | void> {

    const token = this.getToken(req)

    if (!token) {
      return done(false, 400, 'Bad Request')
    }

    if (token) {
      return Promise.resolve(token)
    }
    return Promise.reject(false)
  }

  private getToken(req: http.ServerRequest): string {
    const token = authToken(req.headers.authorization)
               || urlToken(req.url)
    return token

    /////////////////////////

    function urlToken(url) {
      const matches = String(url).match(/token\/(.+)$/i)
      return matches && matches[1]
    }

    function authToken(authorization) {
      // https://github.com/KevinPHughes/ws-basic-auth-express/blob/master/index.js
      if (!authorization) {
        console.log('no authorization')
        return null
      }
      const parts = authorization.split(' ')
      if (parts.length !== 2) {
        console.log('authorization part is not 2')
        return null
      }
      const scheme = parts[0]
      const token = parts[1]
      if (!/Token/i.test(scheme) || !token) {
        console.log('authorization schema is not Token')
        return null
      }
      return token
    }    
  }
}


const app = express()
app.use(function (req, res) {
  res.send(`<h1>Wechaty.io</h1>`)
})

const server = http.createServer()
const port = process.env.PORT || 8080 // process.env.PORT is set by Heroku/Cloud9

server.listen(port, _ => {
  console.log('Listening on ' + server.address().port)
})

server.on('request', app)

const ioManager = new IoManager()
const ioAuth = new IoAuth()

const ioSocket = new IoSocket(
  server
  , ioAuth.auth.bind(ioAuth)
  , ioManager.register.bind(ioManager)
)
ioSocket.init()
