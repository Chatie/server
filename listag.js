const EventEmitter = require('events')

class ListagItem {
  constructor(data, tagMap = {}) {
    this.data = data
    this.tagMap = Object.assign({}, tagMap)
  }

  tag(tagMap) {
    Object.assign(this.tagMap, tagMap)
    return this
  }

  hasTag(tagMap) {
    let exist = true
    Object.keys(tagMap).forEach(t => {
      if (this.tagMap[t] !== tagMap[t]) {
        exist = false
        return
      }
    })
    return exist
  }
}

function Listag(items, tagMap) {

  class _Listag extends EventEmitter {

    constructor(items = [], tagMap = {}) {
      super()
      this.items = []
      this.add(items, tagMap)
    }

    get length() { return this.items.length }

    /**
     *
     * return ListagItem for single add
     * return Listag for multi add
     *
     */
    add(items, tagMap) {
      const firstTime = !this.length

      if (items.map) {
        const newItems = items.map(item => this.add(item, tagMap))
        if (firstTime) {  // for new Listag, we just return this to stop dead-loop
          return this
        } else {          // if we add some items to a exist Listag, add should return a new Listag that contains batch items of this add
          return new Listag(newItems)
        }
      }

      let item = items  // below items is confirmed not a array

      if (item instanceof ListagItem) {
        item.tag(tagMap)
      } else {
        item = new ListagItem(item, tagMap)
      }

      this.items.push(item)
      this.emit('add', item.data)
      return item
    }

    get(tagMap) {
      const items = this.items.filter(i => i.hasTag(tagMap))
      if (items && items.length) {
        return new Listag(items)
      } else {
        return null
      }
    }

    del(items) {
      if (!items) {
        return 0
      }

      if (items.map) {
        return items.map(i => this.del(i))
                    .reduce((a, b) => a+b)
      }

      const item = items
      let data
      if (item instanceof ListagItem) {
        data = item.data
      } else {
        data = item
      }

      let counter = 0
      this.items = this.items.filter(i => {
        if (i.data === data) {
          counter++
          this.emit('del', data)
          return false
        } else {
          return true
        }
      })
      return counter
    }

    tag(tagMap) {
      this.items.forEach(i => i.tag(tagMap))
      return this
    }

    getTag(items) {
      if (items.map) {
        return items.map(i => this.tagMap(i))
      }
      const item = items

      if (item instanceof ListagItem) {
        return item.tagMap
      }

      const ret = this.items.filter(i => i.data === item)
      if (ret && ret.length) {
        return ret[0].tagMap
      }
       return {} // XXX or return null?
    }

    forEach(cb) {
      return this.items.forEach(i => {
        return cb(i.data)
      })
    }

    map(cb) {
      return this.items.map(i => {
        return cb(i.data)
      })
    }

    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/Reduce
    reduce(callback, initialValue) {
      return this.items.reduce((previousValue, currentValue, currentIndex, array) => {
        return callback(previousValue, currentValue.data, currentIndex, array)
      }, initialValue)

    }
  }

  const handler = {
    get(listag, propKey, receiver) {
      // console.log('##############' + propKey)
      try {
        const i = parseInt(propKey, 10)
        if (Number.isInteger(i) && i >= 0 && i < listag.length) {
          return listag.items[i].data
        }
      } catch (e) {}

      if (propKey in listag) {
        return listag[propKey]
      }
    }
  }

  return new Proxy(
    new _Listag(items, tagMap)
    , handler
  )

}

module.exports = Listag.default = Listag.Listag = Listag