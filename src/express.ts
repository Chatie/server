import { IoServer } from '@chatie/io'
import express      from 'express'
import path         from 'path'
import pkgDir       from 'pkg-dir'

async function getExpressApp (
  ioServer: IoServer,
): Promise<express.Express> {
  const app = express()

  app.get('/', (_req, res) => {
    const hostieNum = ioServer.ioManager.getHostieCount()

    res.send(`
    <html>
    <head>
      <title>Chatie - 茶贴 - Chatbot as a Service(CaaS)</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
      <meta name="google-site-verification" content="wKskGJRPWsvXCaKn9bVVMGrvo6uRZ0p7zF3Hv--t9Fo" />
      <meta name="description" content="Chatie - 茶贴 - Chatbot as a Service">
      <meta name="keywords" content="Chatie,茶贴,ChatBot,ChatOps,Wechaty,WeChat,Whatsapp">
      <meta name="author" content="huan@chatie.io">

      <style type="text/css">
        html {
          margin: 0;
          padding: 0;
          height: 100%;
          overflow: hidden;
        }

        iframe {
          position: absolute;
          border: 0;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
        }
        #footer {
          position: fixed;
          text-align: center;
          left: 0;
          bottom: 76px;
          padding: 20px;
          width: 100%;
        }
        ul {
          display: inline-table;
          margin: 0 auto;
        }
        li {
          display: inline;
          margin: 5px;
        }
      </style>
    </head>

    <body>
      <iframe id="typeform-full" width="100%" height="100%" frameborder="0"
        allow="camera; microphone; autoplay; encrypted-media;" src="https://form.typeform.com/to/ud7sc8sg">
      </iframe>
      <script type="text/javascript" src="https://embed.typeform.com/embed.js"></script>
      <div id="footer">
        <ul>
          <li><a href="https://app.chatie.io" target="_blank">Chatie App</a></li>
          <li>Online: ${hostieNum}</li>
          <li><a href="https://chatie.statuspage.io/" target="_blank">Status</a></li>
        </ul>
      </div>
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

  app.use('/images', express.static(
    await getImageDir()
  ))

  return app
}

async function getImageDir () {
  const projectDir = await pkgDir(__dirname)
  if (!projectDir) {
    throw new Error('can not find project root dir')
  }

  const imageDir = path.join(
    projectDir,
    'docs/images/'
  )
  // console.info('image dir', imageDir)
  return imageDir
}

export {
  getExpressApp,
}
