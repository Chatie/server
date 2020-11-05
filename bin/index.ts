#!/usr/bin/env node -r ts-node/register

/**
 * TypeScript need to keep the file extension as `.ts`
 * https://github.com/TypeStrong/ts-node/issues/116#issuecomment-234995536
 */

import http             from 'http'
import path             from 'path'
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


    <style>

      html {
        margin: 0;
        padding: 0;
        background: url(/images/undraw_good_team_m7uu.svg) no-repeat center top fixed;
        background-size: cover;
      }

      .layer {
        background-color: rgba(0, 0, 0, 0.6);
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }

      body {
        margin: 0;
        padding: 0;
        color: #fff;
        text-align:center;
      }

      /* unvisited link */
      a:link {
        color: white;
      }

      /* visited link */
      a:visited {
        color: white;
      }

      /* mouse over link */
      a:hover {
        color: white;
      }

      /* selected link */
      a:active {
        color: white;
      }
    </style>

    </head>
    <body class="layer">
      <br /><br /><br />
      <br /><br /><br />
      <h1>Chatie - 茶贴</h1>
      <h2>Chatie.io - Chatie for Chat as a Service is open for business</h2>
      <h3>use Chatie APP to manage your chat bot</h3>
      <ul>
        <li><a href="https://app.chatie.io" target="_blank">Chatie Manager APP</a></li>
        <li><a href="https://wechaty.js.org" target="_blank">Wechaty Official Homepage</a></li>
        <li><a href="https://wechaty.github.io/wechaty/" target="_blank">Wechaty API Document</a></li>
      </ul>
    </body>
    <script src="https://tdjmtbwb9kmt.statuspage.io/embed/script.js"></script>
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

app.use('/images', express.static(path.join(
  __dirname,
  '../docs/images/'
)))

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
