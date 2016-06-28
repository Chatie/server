const EventEmitter = require('events')

class SocketPool extends EventEmitter {
  constructor() {
    super()
    this.pool = []
  }

  count() { return this.pool.length }

  add({
    sock
    , owner
    , channel
  }) {
    sock.spMeta = {
      owner
      , channel
    }
    this.pool.push(sock)
    this.emit('add', sock)
  }

  get({
    sock
    , owner
    , channel
  } = {}) {

    if (!sock && !owner && !channel) {
      return this.pool
    }

    else if (sock && !owner && !channel) {
      return this.pool.filter(s => s === sock)
    } else if (channel && !sock && !owner) {
      return this.pool.filter(s => s.spMeta.channel === channel)
    } else if (owner && !sock && !channel) {
      return this.pool.filter(s => s.spMeta.owner === owner)
    }

    else if (owner && channel && !sock) {
      return this.pool.filter(
        s =>
          s.spMeta.owner === owner
          && s.spMeta.channel === channel
      )
    }

    else {
      throw new Error('unsupported get call')
    }
  }

  del({
    sock
    , owner
    , channel
  }) {
    const delList = this.get({sock, owner, channel})
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_Operators#Bitwise_NOT
    this.pool = this.pool.filter(s => {
      if (~delList.indexOf(s)) {
        this.emit('del', s)
        return false
      } else {
        return true
      }
    })
  }
}

module.exports = SocketPool.default = SocketPool.SocketPool = SocketPool