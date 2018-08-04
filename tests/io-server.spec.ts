#!/usr/bin/env ts-node

import http from 'http'

import test from 'blue-tape'

import { IoServer } from '@chatie/io'

test('Wechaty.io Website smoking test', async t => {
  const httpServer = http.createServer()
  const ioServer = new IoServer({ httpServer })
  t.ok(ioServer, 'should instanciated an IoServer')
})
