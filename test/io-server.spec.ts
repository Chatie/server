import * as http from 'http'

import { test } from 'tape'

import { IoServer } from '../lib/wechaty-io'

test('Wechaty.io Website smoking test', t => {
  const server = http.createServer()
  const ioServer = new IoServer(server)
  t.ok(ioServer, 'should instanciated an IoServer')

  t.end()
})
