"use strict";

/**
 * version: v0.0.1, main, staging/new_feature
 * offline: if no webserver, direct file://
 * theme: dark/light
 * content_root: relative path to reach the current doc root page
 * metadata: fetched by fetch.js
 * sub_hosted: hosted alongside other docs
 * path: "v0.0.1", "", "prs/staging/new_feature"
 * reloaded: page was reloaded
 * metadata: tags.json, fetched later by fetch.js, if state allows
 */
const state = {
  repository: undefined,
  version: undefined,
  offline: undefined,
  theme: undefined,
  content_root: undefined,
  sub_hosted: undefined,
  path: undefined,
  reloaded: undefined,
  metadata: undefined
}

/**
 * Creates the common state of the documentation.
 */
export class State {
  constructor (app) {
    this.init_state(state)

    this.parent = app
    app.state = state
  }
  /**
   * Get repository name, e.g.
   * doctools, hdl, pyadi-iio
   */
  repository () {
    let dom = document.querySelector('meta[name="repository"]')
    return dom ? dom.content : ''
  }
  /**
   * Get meta[name="version"] of doc, e.g.
   * main, v0.2.2, staging/new_feature
   * This is the hard-coded value and may be outdated,
   * so inhering from path has higher precedence.
   * Should only be used as a fallback.
   */
  version () {
    let dom = document.querySelector('meta[name="version"]')
    if (dom === null)
      return ""

    return dom.content
  }
  /**
   * Get relative path to the root.
   * Dual fallback to support multiple Sphinx versions.
   */
  content_root () {
    let content_root
    let dom = document.querySelector('script#documentation_options')
    if (dom !== null)
      content_root = dom.dataset['url_root'];
    if (content_root == undefined)
      content_root = document.documentElement.dataset["content_root"]
    if (content_root == undefined) {
      dom =  document.querySelector('.repotoc-tree .current')
      if (dom !== null)
        content_root = dom.getAttribute('href').replace('index.html', '')
    }
    if (content_root == undefined) {
      console.warn("Failed to get content root.")
      content_root = ''
    }
    return content_root
  }
  /**
   * Checks if doc is in a path beyond the server root,
   * e.g.
   * true: doctools, doctools/v0.2.2
   * false: / , /v0.2.2
   * For correctness, the html meta repository tag must match the url repository.
   */
  sub_hosted (content_root, repository) {
    let url = new URL(content_root, location).href,
        org = new URL(repository, location.origin).href
    return url.startsWith(org)
  }
  /**
   * Extract path of versioned version, without repository name
   * /doctools -> ""
   * / -> ""
   * /doctools/v1.1.1 -> "v1.1.1"
   * /v1.1.1 -> "v1.1.1"
   */
  path (content_root, repository, sub_hosted) {
    if (!sub_hosted)
      repository = ""

    let url = new URL(content_root, location).href,
        org = new URL(repository, location.origin).href
    if (!url.startsWith(org))
      return ""
    else
      return url.replace(org, "").replace(/^\/|\/$/g, "")
  }
  /**
   * Detects if the page was reloaded by the user.
   * This information is to use to force reload of cached content.
   */
  reloaded () {
    if (!window.performance)
      return false

    return performance.navigation.type === performance.navigation.TYPE_RELOAD
  }
  /**
   * Init app state object.
   */
  init_state (state) {
    state.repository = this.repository()
    state.version = this.version()
    state.offline = 'file:' == window.location.protocol
    state.theme = localStorage.getItem('theme')
    state.content_root = this.content_root()
    if (!state.offline) {
      state.sub_hosted = this.sub_hosted(state.content_root, state.repository)
      state.path = this.path(state.content_root, state.repository, state.sub_hosted)
    }
    state.reloaded = this.reloaded()
  }
}
