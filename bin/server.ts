#!/usr/bin/env node -r ts-node/register

/**
 * TypeScript need to keep the file extension as `.ts`
 * https://github.com/TypeStrong/ts-node/issues/116#issuecomment-234995536
 */

import http             from 'http'
import { AddressInfo }  from 'net'

import { IoServer } from '@chatie/io'

import { log } from 'brolog'

import {
  getExpressApp,
}                   from '../src/express'

import { statusPageMetricSubmitter } from '../src/status-page/metric-submitter'

if (process.env.WECHATY_LOG) {
  log.level(process.env.WECHATY_LOG as any)
  log.info('set log.level(%s) from env.', log.level())
}

async function main () {

  const apiKey = process.env.STATUS_PAGE_API_KEY
  const metricId = process.env.STATUS_PAGE_METRIC_ID_CONCURRENCY
  const pageId = process.env.STATUS_PAGE_PAGE_ID

  if (!apiKey || !metricId || !pageId) {
    throw new Error('no status page api env variables!')
  }

  const metricSubmitter = statusPageMetricSubmitter({
    apiKey,
    metricId,
    pageId,
  })

  /**
   * Http Server
   */
  const httpServer = http.createServer()
  const ioServer = new IoServer({ httpServer })
  const app = getExpressApp(ioServer)

  httpServer.on('request', app)

  /**
   * Io Server
   */
  ioServer.start()
    .then(_ => {
      log.info('io-server', 'init succeed')
      setInterval(async () => {
        const num = ioServer.ioManager.getHostieCount()
        console.info('hostie concurrency num:', num)
        await metricSubmitter(num)
      }, 60 * 1000)
      return undefined
    })
    .catch(e => {
      log.error('io-server', 'init failed: %s', e)
    })

  /**
   * Listen Port
   */
  const listenPort = process.env.PORT || 8788 // process.env.PORT is set by Heroku/Cloud9
  httpServer.listen(listenPort, () => {
    const address = httpServer.address() as AddressInfo
    log.info('io-server', 'Listening on ' + address.port)
  })

}

main()
  .catch(console.error)
