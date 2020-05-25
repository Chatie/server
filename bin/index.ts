/**
 * TypeScript need to keep the file extention as `.ts`
 * https://github.com/TypeStrong/ts-node/issues/116#issuecomment-234995536
 */

import http             from 'http'
import { AddressInfo }  from 'net'

import express from 'express'

import { log } from 'brolog'
if (process.env.WECHATY_LOG) {
  log.level(process.env.WECHATY_LOG as any)
  log.info('set log.level(%s) from env.', log.level())
}

import { IoServer } from '@chatie/io'

/**
 * Express
 */
const app = express()
app.get('/', (req, res) => {
  res.send(`
    <html>
    <head>
      <title>Chatie - 茶贴 - Chat as a Service(CaaS)</title>
      <meta name="google-site-verification" content="wKskGJRPWsvXCaKn9bVVMGrvo6uRZ0p7zF3Hv--t9Fo" />
      <meta name="description" content="Chatie - 茶贴 - WeChat Bot as a Service">
      <meta name="keywords" content="Chatie,茶贴,ChatBot,ChatOps,Wechaty">
      <meta name="author" content="Huan <dev@chatie.io>">
    </head>
    <body>
      <h1>Chatie - 茶贴</h1>
      <h2>Chatie.io - Chatie for Chat as a Service is open for business</h2>
      <h2>Chatie.io - 茶贴聊天机器人服务正常运行中</h2>
      <h3>use Chatie APP to manage your chat bot</h3>
      <ul>
        <li><a href="https://blog.chatie.io" target="_blank">Chatie Blog</a></li>
        <li><a href="https://app.chatie.io" target="_blank">Chatie Manager APP</a></li>
        <li><a href="https://docs.chatie.io" target="_blank">Chatie Docs</a></li>
        <li><a href="https://chatie.io/wechaty/" target="_blank">Wechaty API Document</a></li>
      </ul>
    </body>
    </html>
  `)
})

app.get('/v0/hosties/:token', async (req, res) => {
  const token: string = req.params.token
  const { ip, port } = await ioServer.ioManager.discoverHostie(token)
  res.json({
    ip,
    port,
  })
})

/**
 * Http Server
 */
const httpServer = http.createServer()
httpServer.on('request', app)

/**
 * Io Server
 */
const ioServer = new IoServer({ httpServer })
ioServer.start()
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
httpServer.listen(port, () => {
  const address = httpServer.address() as AddressInfo
  log.info('io-server', 'Listening on ' + address.port)
})
