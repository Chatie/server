/**
 * TypeScript need to keep the file extention as `.ts`
 * https://github.com/TypeStrong/ts-node/issues/116#issuecomment-234995536
 */

import * as http from 'http'
import * as express from 'express'

import log = require('npmlog') // https://github.com/Microsoft/TypeScript/issues/6751
if (process.env.WECHATY_LOG) {
  log.level = String(process.env.WECHATY_LOG).toLowerCase()
  console.log('set log.level =', log.level, 'from env')
}

import { IoServer } from '../lib/wechaty-io'

/**
 * Express
 */
const app = express()
app.use(function (req, res) {
  res.send(`<h1>Wechaty.io is open for business</h1>`)
})

/**
 * Http Server
 */
const server = http.createServer()
server.on('request', app)

/**
 * Io Server
 */
const ioServer = new IoServer(server)
ioServer.init()
.then(_ => {
  log.info('io-server', 'init succeed')
})
.catch(e => {
  log.error('io-server', 'init failed')
})

/**
 * Listen Port
 */
const port = process.env.PORT || 8080 // process.env.PORT is set by Heroku/Cloud9
server.listen(port, _ => {
  log.info('io-server', 'Listening on ' + server.address().port)
})
