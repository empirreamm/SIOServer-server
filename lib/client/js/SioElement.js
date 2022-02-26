import { html, render, svg } from '/lit/lit-html'
import { classMap } from '/lit/directives/class-map'
import { styleMap } from '/lit/directives/style-map'
function SioProxy (element) {
  if (element instanceof HTMLElement) {
    return element
  }
  if (element instanceof SVGElement) {
    return element
  }
  if (element instanceof Node) {
    return element
  }
  if (element instanceof NodeList) {
    return element
  }
  if (element instanceof HTMLCollection) {
    return element
  }
  if (element instanceof Date) {
    return element
  }
  if (element.isProxy) {
    return element
  }
  if (typeof element !== 'object') {
    return element
  }
  let prox = new Proxy(element, {
    get: (target, prop) => {
      if (prop == 'isProxy') {
        return true
      }
      let value = target[prop]
      if (value && typeof value === 'object') {
        let keys = Object.keys(target)
        if (!keys.includes(prop)) {
          return Reflect.get(target, prop)
        }
        if (value.isProxy) {
          return Reflect.get(target, prop)
        }
        target[prop] = SioProxy(value)
        if (target[prop].isProxy) {
          target[prop].on('change', async data => {
            data.prop = prop + '.' + data.prop
            target.emit('change', data)
          })
        }
        return target[prop]
      }
      return Reflect.get(target, prop)
    },
    set: (target, prop, value) => {
      let oldValue = target[prop]
      target.emit('change', {
        oldValue,
        newValue: value,
        prop
      })
      return Reflect.set(target, prop, value)
    },
    deleteProperty: (target, prop) => {
      target.emit('change', {
        oldValue: target[prop],
        newValue: undefined,
        prop
      })
      return Reflect.deleteProperty(target, prop)
    }
  })
  if (!element.emit) {
    Object.defineProperties(prox, {
      _listeners: {
        value: {},
        writable: true
      },
      emit: {
        value: function (event, data) {
          if (this._listeners[event]) {
            for (let listener of this._listeners[event]) {
              listener(data)
            }
          }
        }
      },
      on: {
        value: function (event, listener) {
          if (!this._listeners[event]) {
            this._listeners[event] = []
          }
          this._listeners[event].push(listener)
        },
        writable: true
      },
      object: {
        value: function () {
          return JSON.parse(JSON.stringify(this))
        }
      }
    })
  }
  return prox
}
class SioElement extends HTMLElement {
  /**Statics */
  static define (name = null) {
    if (!name) {
      name = this.name[0].toLowerCase() + this.name.slice(1)
      name = name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)
    }
    let parts = name.split('-')
    if (parts.length < 2) {
      parts.unshift('sio')
    }
    // if (parts.length != 2) {
    //   parts = ['sio', name.replace('-', '')]
    // }
    name = parts.join('-')
    if (name == 'sio-element') {
      throw new Error('sio-element cannot be used as an element name')
    }
    if (!customElements.get(name)) {
      customElements.define(name, this)
    }
    return name
  }
  static get observedAttributes () {
    let props = []
    if (this.constructor.attributes) {
      for (let att of this.constructor.attributes) {
        props.push(att)
      }
    }
    if (this.props && Object.keys(this.props).length > 0) {
      for (let key in this.props) {
        if (['array', 'object'].includes(this.props[key].type)) {
          continue
        }
        if (this.props[key].attribute !== false) {
          props.push(key)
        }
      }
    }
    return props
  }
  static get props () {
    return {}
  }
  static get defaultProps () {
    let defaults = {}
    for (let key in this.props) {
      if (this.props[key].default) {
        defaults[key] = this.props[key].default
      } else {
        defaults[key] = null
      }
    }
    return defaults
  }
  static propName (name) {
    for (let key in this.props) {
      if (key.toLocaleLowerCase() == name.toLocaleLowerCase()) {
        return key
      }
    }
  }
  static get useShadow () {
    return true
  }
  /**HTML Element Functions */
  connectedCallback () {
    this._state.connected = true
    this.requestUpdate()
  }
  disconnectedCallback () {
    this._state.connected = false
  }
  attributeChangedCallback (name, oldValue, newValue) {
    if (!this._state.listenAttributes) {
      return
    }
    let propName = this.constructor.propName(name)

    if (propName) {
      this.setProp(propName, newValue)
    } else {
      this[name] = newValue
    }
  }
  /**Usefull functions */
  emit (eventName, data) {
    let ret = this.dispatchEvent(new CustomEvent(eventName, { detail: data }))
    return ret
  }
  on (eventName, listener) {
    this.addEventListener(eventName, event => {
      event.stopPropagation()
      listener(event.detail)
    })
  }
  setProp (name, value) {
    let prop = this.constructor.props[name]
    if (prop.converter) {
      if (typeof prop.converter === 'function') {
        let temp = prop.converter(value)
        console.log(temp)
        if (temp === undefined) {
          return
        }
        value = temp
      } else if (typeof prop.converter === 'object') {
        if (typeof prop.converter.fromAttribute == 'function') {
          let temp = prop.converter.fromAttribute(value)
          if (temp === undefined) {
            return
          }
          value = temp
        }
      }
    } else {
      if (prop.type == 'boolean') {
        if (value == 'false' || value == '0') {
          value = false
        } else {
          value = !!value
        }
      }
      if (prop.type == 'number') {
        let temp = Number(value)
        if (isNaN(temp)) {
          return
        }
        value = temp
      }
      if (prop.type == 'array') {
        if (!Array.isArray(value)) {
          value = [value]
        }
      }
      if (prop.type == 'object') {
        if (!(value instanceof Object)) {
          value = {}
        }
      }
      if (prop.type == 'string') {
        value = String(value)
      }
    }
    if (
      prop.attribute !== false &&
      !['array', 'object'].includes(prop.type) &&
      !(this[name] instanceof HTMLElement)
    ) {
      let attVal = null
      if (
        prop.converter &&
        typeof prop.converter == 'object' &&
        typeof prop.converter.toAttribute == 'function'
      ) {
        attVal = prop.converter.toAttribute(value)
      } else {
        attVal = String(value)
      }
      this._state.listenAttributes = false
      if (attVal === 'false') {
        this.removeAttribute(name)
      } else {
        this.setAttribute(name, attVal)
      }
      this._state.listenAttributes = true
    }
    if (this._state.canUpdateProps) {
      this._state.canUpdateProps = false
      this.emit('propUpdate', {
        name,
        value,
        oldValue: this[name]
      })
      this._state.canUpdateProps = true
    }
    this._props[name] = value
    if (this._state.canUpdateProps) {
      this._state.propsUpdates++
      this._state.newProps[name] = value
      this.emit('prop', {
        prop: name,
        value
      })
      this.requestUpdate()
    }
  }
  /**Logic*/
  constructor (...args) {
    super()
    Object.defineProperty(this, '_state', {
      value: {
        connected: false,
        status: 'disconnected',
        updates: 0,
        renders: 0,
        propsUpdates: 0,
        newProps: {},
        canUpdateProps: false,
        listenAttributes: true
      },
      writable: true
    })
    Object.defineProperty(this, '_props', {
      value: SioProxy(this.constructor.defaultProps)
    })
    /**Lit html elements */
    Object.defineProperties(this, {
      html: {
        value: html
      },
      renderer: {
        value: render
      },
      svg: {
        value: svg
      },
      classMap: {
        value: classMap
      },
      styleMap: {
        value: styleMap
      }
    })
    Object.defineProperty(this, '_styles', {
      value: null,
      writable: true
    })
    this._props.on('change', data => {
      if (this._state.canUpdateProps) {
        this._state.propsUpdates++
        this._state.newProps[data.prop] = data.newValue
        this.requestUpdate()
      }
    })
    for (let prop in this.constructor.props) {
      Object.defineProperty(this, prop, {
        get: () => {
          return this._props[prop]
        },
        set: value => {
          this.setProp(prop, value)
        }
      })
    }
    for (let att of this.constructor.observedAttributes) {
      if (this.getAttribute(att)) {
        this.setProp(att, this.getAttribute(att))
      }
    }
    if (this.constructor.styles) {
      let styles = this.constructor.styles
      if (Array.isArray(styles)) {
        styles = styles.join('\n')
      }
      this._styles = this.html`<style>${styles}</style>`
    }
    this.host = this
    this._init(...args)
  }
  async _init (...args) {
    this._state.status = 'init'
    this._state.canUpdateProps = false
    if (this.constructor.useShadow) {
      if (this.shadowRoot) {
        this.host = this.shadowRoot
      } else {
        this.attachShadow({ mode: 'open' })
        this.host = this.shadowRoot
      }
    }
    if (typeof this.init == 'function') {
      await this.init(...args)
    }
    this._state.status = 'ready'
    this._state.canUpdateProps = true
    this.requestUpdate()
  }
  requestUpdate () {
    if (!this._state.connected) {
      return
    }
    if (['init', 'updating'].includes(this._state.status)) {
      return
    }
    this._state.status = 'updating'
    queueMicrotask(this._update.bind(this))
  }
  draw (html = []) {
    if (!Array.isArray(html)) {
      html = [html]
    }
    html.unshift(this._styles)
    this.renderer(html, this.host)
  }
  _render () {
    this._state.renders++
    this._state.status = 'rendering'
    let renderHTML = []
    if (typeof this.render == 'function') {
      let html = this.render()
      if (Array.isArray(html)) {
        renderHTML.push(...html)
      } else {
        renderHTML.push(html)
      }
    }
    this.draw(renderHTML)
    this._state.status = 'idle'
    this.emit('render')
  }
  async _update () {
    this._state.canUpdateProps = false
    let canUpdate = true
    if (typeof this.canUpdate == 'function') {
      canUpdate = await this.canUpdate(this._state.newProps)
    }
    this._state.propsUpdates = 0
    this._state.newProps = {}
    this._state.canUpdateProps = true
    if (canUpdate === false) {
      this._state.canUpdateProps = true
      this._state.status = 'idle'
      return
    }
    if (typeof this.update == 'function') {
      await this.update()
    }
    this._state.status = 'updated'
    this._state.updates++
    this.emit('update')
    this._render()
  }
  setPropsActive (active = true) {
    this._state.canUpdateProps = active
  }
}
export default SioElement
