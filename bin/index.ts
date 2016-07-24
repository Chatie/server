#!env ts-node
'use strict'

import * as http from 'http'
import * as url from 'url'
import * as express from 'express'

import log = require('npmlog') // https://github.com/Microsoft/TypeScript/issues/6751
log.level = 'verbose'
log.level = 'silly'


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

// const dbUri = process.env.MONGODB_URI

import { Listag } from 'listag'
const ltSocks = new Listag()



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
    , private auth: (token: string) => Promise<string>
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

    const token = this.getToken(req)

    if (!token) {
      return done(false, 400, 'Bad Request')
    }

    this.auth(token)
        .then(_ => {
          req['user'] = token
          done(true, 200, 'Ok')
        })
        .catch(e => {
          console.log('auth fail')
          return done(false, 401, 'Unauthorized')
        })
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


/**
 * Io Server
 */
class IoManager {
  constructor() {

  }

  connect(client: WebSocket): void {
    log.verbose('onConnect()')
    log.verbose('Io', 'clients.on event connection')
    // console.log(ws)
    // console.log(': ' + ws.upgradeReq.client.user)
  //  upgradeReq.socket/connection/client

    const user      = client.upgradeReq['user']
    const protocol  = client['protocol']

    console.log('user: ' + user)
    console.log('protocol: ' + protocol)

    const [module, version] = protocol.split('|')

    Object.assign(client, {
      user
      , module
    })

    ltSocks.add(client).tag({user, module})

    switch (module.toLowerCase()) {
      case 'web':
        this.onWebConnection(client)
        break
      case 'io':
        this.onIoConnection(client)
        break
      default:
        log.error('Io', 'protocol module [%s] not supported', module)
        break
    }
  }

  onWebConnection(client: WebSocket) {
    this.broadcast(client['user'], 'io', 'new visitor from web')
    var location = url.parse(client.upgradeReq.url, true);
    // you might use location.query.access_token to authenticate or share sessions
    // or client.upgradeReq.headers.cookie (see http://stackoverflow.com/a/16395220/151312)

    client.on('message', function incoming(message) {
      console.log('received: %s', message);
      console.log('send dong')
      const e = JSON.parse(message)
      client.send(JSON.stringify({
        name: 'dong'
        , data: e.data
      }))
    })
    client.on('error', gone.bind(client))
    client.on('close', gone.bind(client))

    function gone(e) {
      log.verbose('Io', 'onWebConnection() gone(%s)', e)

      ltSocks.del(this)
      this.close()

      this.broadcast(this.user, 'io', 'connect lost')
    }

    client.send('something from c9');
    client.send('welcome from zixia')
    client.send(JSON.stringify({
      name: 'zixia'
      , data: 'welcome from zixia 2'
    }))
  }

  onIoConnection(client: WebSocket) {
    log.verbose('Io', 'onIoConnection()')
    this.broadcast(client['user'], 'web', 'new visitor from io')

    client
    .on('message', function incoming(message) {
      log.verbose('onIo', '%s, %s, recv msg: %s', message.length, typeof message, message)

      this.broadcast(client['user'], 'web', message)

      console.log('reply roger')
      client.send('roger')
    })
    .on('error', e => {
      console.log('error:' + e)
      ltSocks.del(client)
      this.broadcast(client['user'], 'web', 'connection lost event[error]: ' + e)
    })
    .on('close', e => {
      console.log('srv on close:' + e)
      client.close()
      ltSocks.del(client)
      this.broadcast(client['user'], 'web', 'connection lost event[close]: ' + e)
    })

    client.send('something from srv')

  }

  broadcast(user, module, msg) {
    log.verbose('broadcast', '%s, %s, %s', user, module, msg)

    const tagMap = {user, module}
    console.log('tagMap')
    console.log(tagMap)
    const socks = ltSocks.get(tagMap)

    console.log('ltSocks length: ' + (ltSocks && ltSocks.length))
    // console.log('socks' + socks)
    console.log('socks length: ' + (socks && socks.length))

    ltSocks.forEach(v => {
      // console.log('user: ' + v.user)
      let tagMap = ltSocks.getTag(v)
      console.log(tagMap)
    })

    if (socks) {
      log.verbose('broadcast', 'found %d socks', socks.length)
      socks.forEach(s => {
        if (s.readyState === WebSocket.OPEN) {
          s.send(module + '[' + user + ']: ' + msg)
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

  auth(token: string): Promise<string | void> {
    if (token) {
      return Promise.resolve(token)
    }
    return Promise.reject(false)
  }

}

const ioManager = new IoManager()
const ioAuth = new IoAuth()

const ioSocket = new IoSocket(
  server
  , ioAuth.auth.bind(ioAuth)
  , ioManager.connect.bind(ioManager)
)
ioSocket.init()