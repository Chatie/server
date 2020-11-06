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

require('dotenv').config()

if (process.env.WECHATY_LOG) {
  log.level(process.env.WECHATY_LOG as any)
  log.info('set log.level(%s) from env.', log.level())
}

function metricSubmitter () {
  const apiKey = process.env.STATUS_PAGE_API_KEY
  const metricId = process.env.STATUS_PAGE_METRIC_ID_CONCURRENCY
  const pageId = process.env.STATUS_PAGE_PAGE_ID

  if (!apiKey || !metricId || !pageId) {
    throw new Error('no status page api env variables!')
  }

  const submit = statusPageMetricSubmitter({
    apiKey,
    metricId,
    pageId,
  })

  return submit
}

async function main () {

  const metricSubmit = metricSubmitter()

  /**
   * Http Server
   */
  const httpServer = http.createServer()
  const ioServer = new IoServer({ httpServer })
  const app = await getExpressApp(ioServer)

  httpServer.on('request', app)

  async function updateConcurrency () {
    const num = ioServer.ioManager.getHostieCount()
    log.info('io-server', 'status page concurrency: %s', num)
    await metricSubmit(num)
  }

  /**
   * Io Server
   */
  ioServer.start()
    .then(_ => {
      log.info('io-server', 'init succeed')
      setTimeout(
        () => {
          log.info('io-server', 'start submit status page concurrency')
          setInterval(updateConcurrency, 60 * 1000)
        },
        60 * 1000,
      )
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
