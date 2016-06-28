const EventEmitter = require('events')

class ListagItem {
  constructor(item, tagMap = {}) {
    this.item = item
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
      this.list = []
      this.add(items, tagMap)
    }

    get length() { return this.list.length }

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

      this.list.push(item)
      return item
    }

    get(tagMap) {
      const items = this.list.filter(i => i.hasTag(tagMap))
      return new Listag(items)
    }

    del(items) {
      let counter = 0
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_Operators#Bitwise_NOT
      this.list = this.list.filter(i => {
        if (~items.indexOf(i)) {
          this.emit('del', i)
          counter++
          return false
        } else {
          return true
        }
      })
      return counter
    }

    tag(tagMap) {
      this.list.forEach(i => i.tag(tagMap))
      return this
    }
  }

  const handler = {
    get(target, propKey, receiver) {
      // console.log('##############' + propKey)
      try {
        const i = parseInt(propKey, 10)
        if (Number.isInteger(i) && i >= 0 && i < target.length) {
          return target.list[i].item
        }
      } catch (e) {}

      if (propKey in target) {
        return target[propKey]
      }
    }
  }

  return new Proxy(
    new _Listag(items, tagMap)
    , handler
  )

}

module.exports = Listag.default = Listag.Listag = Listag