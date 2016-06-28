const log = require('npmlog')
const test = require('tap').test

const SocketPool = require('../socket-pool')

test('SocketPool smoking test', t => {
  const sp = new SocketPool()

  t.equal(sp.count(), 0, 'should be zero after instanciated')

  const EXPECTED_SOCK1 = {s: 'dummy sock'}
  const EXPECTED_OWNER1 = 'dummy owner'
  const EXPECTED_CHANNEL1 = 'dummy CHANNEL'

  const EXPECTED_SOCK2 = {s: 'dummy sock 2'}
  const EXPECTED_OWNER2 = 'dummy owner 2'
  const EXPECTED_CHANNEL2 = 'dummy CHANNEL 2'

  sp.add({
    sock: EXPECTED_SOCK1
    , owner: EXPECTED_OWNER1
    , channel: EXPECTED_CHANNEL1
  })

  t.equal(sp.count(), 1, 'should be one after add')

  sp.add({
    sock: EXPECTED_SOCK2
    , owner: EXPECTED_OWNER2
    , channel: EXPECTED_CHANNEL2
  })

  t.equal(sp.count(), 2, 'should be two after add again')
  t.equal(sp.get().length, 2, 'should get all by empty params')

  let socks

  socks = sp.get({
    sock: EXPECTED_SOCK1
  })
  t.equal(socks.length, 1, 'should get one result')
  t.equal(socks[0], EXPECTED_SOCK1, 'should get sock1')

  socks = sp.get({
    sock: EXPECTED_SOCK2
  })
  t.equal(socks.length, 1, 'should get one result')
  t.equal(socks[0], EXPECTED_SOCK2, 'should get sock2')

  socks = sp.get({
    owner: EXPECTED_OWNER1
  })
  t.equal(socks.length, 1, 'should get one result')
  t.equal(socks[0], EXPECTED_SOCK1, 'should get sock1 by owner 1')

  socks = sp.get({
    owner: EXPECTED_OWNER2
  })
  t.equal(socks.length, 1, 'should get one result')
  t.equal(socks[0], EXPECTED_SOCK2, 'should get sock2 by owner 2')

  socks = sp.get({
    channel: EXPECTED_CHANNEL1
  })
  t.equal(socks.length, 1, 'should get one result')
  t.equal(socks[0], EXPECTED_SOCK1, 'should get sock1 by channel 1')

  socks = sp.get({
    channel: EXPECTED_CHANNEL2
  })
  t.equal(socks.length, 1, 'should get one result')
  t.equal(socks[0], EXPECTED_SOCK2, 'should get sock2 by channel 2')

  sp.del({
    sock: EXPECTED_SOCK1
  })
  t.equal(sp.count(), 1, 'should left 1 in pool')
  t.equal(sp.get().length, 1, 'should be one when get')
  t.equal(sp.get()[0], EXPECTED_SOCK2, 'should left with sock 2')
  t.equal(sp.get()[0].spMeta.owner, EXPECTED_OWNER2, 'should be owner 2 with sock 2')

  sp.del({
    sock: EXPECTED_SOCK1
  })
  t.equal(sp.count(), 1, 'should do nothing when del a non-exist sock')

  t.end()
})

test('SocketPool cross query test', t => {
  const sp = new SocketPool()

  const EXPECTED_SOCK1 = {s: 'dummy sock'}
  const EXPECTED_OWNER12 = 'dummy owner'
  const EXPECTED_CHANNEL1 = 'dummy CHANNEL'

  const EXPECTED_SOCK2 = {s: 'dummy sock 2'}
  const EXPECTED_CHANNEL23 = 'dummy CHANNEL 2'

  const EXPECTED_SOCK3 = {s: 'dummy sock 3'}
  const EXPECTED_OWNER3 = 'dummy owner 3'


  sp.add({
    sock: EXPECTED_SOCK1
    , owner: EXPECTED_OWNER12
    , channel: EXPECTED_CHANNEL1
  })
  sp.add({
    sock: EXPECTED_SOCK2
    , owner: EXPECTED_OWNER12
    , channel: EXPECTED_CHANNEL23
  })
  sp.add({
    sock: EXPECTED_SOCK3
    , owner: EXPECTED_OWNER3
    , channel: EXPECTED_CHANNEL23
  })

  let socks

  socks = sp.get({
    owner: EXPECTED_OWNER12
  })
  t.equal(socks.length, 2, 'should get 2 result for owner12')
  t.equal(socks[0], EXPECTED_SOCK1, 'should get sock1 by owner12')
  t.equal(socks[1], EXPECTED_SOCK2, 'should get sock2 by owner12')

  socks = sp.get({
    channel: EXPECTED_CHANNEL23
  })
  t.equal(socks.length, 2, 'should get 2 result for channel23')
  t.equal(socks[0], EXPECTED_SOCK2, 'should get sock2 by channel23')
  t.equal(socks[1], EXPECTED_SOCK3, 'should get sock3 by channel23')

  t.end()
})