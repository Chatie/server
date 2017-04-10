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
  res.send(`
           <html>
           <head><title>Chatie - Chat as a Service(CaaS)</title>
          <meta name="google-site-verification" content="wKskGJRPWsvXCaKn9bVVMGrvo6uRZ0p7zF3Hv--t9Fo" />
           </head>
           <body>
           <h1>Chatie.io - <b>Chat as a Service</b> is open for business</h1>
           <h3>use Chatie APP to manage your chat bot</h3>
           <ul>
             <li><a href="https://app.chatie.io" target="_blank">Chatie Manager APP</a></li>
             <li><a href="https://blog.chatie.io" target="_blank">Chatie Blog</a></li>
           </ul>
           </body>
           </html>
           `)
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
