'use strict';
const _ = require('lodash');
const axios = require('axios')
const qs = require('qs')
const defaultConfig = {
  browserMob: {
    host: 'localhost',
    port: 8080,
    protocol: 'http'
  },
};


class BrowserMobClient {
  constructor(config) {
    _.defaults(this, config || {}, defaultConfig);
    let bmp = this.browserMob;
    bmp.uri = `${ bmp.protocol }://${ bmp.host }:${ bmp.port }`;
  }


  static createClient(config) {
    return new this(config);
  }


  createHar(options) {
    return this._callProxy('har', 'put', options);
  }


  getHar() {
    return this._callProxy('har', 'get');
  }

  closeProxies() {
    var that = this;
    return this.listProxies()
      .then(ports => {
        return Promise.all(
          _.map(ports.proxyList, function (portData) {
            return that.end(portData.port);
          })
        );
      });
  }

  setLimits(options) {
    let that = this;
    return that._callProxy('limit', 'put', options)
      .then(() => that.limits = _.extend({}, that.limits, options));
  }

  start(options) {
    var that = this;

    return that.callRest('proxy', 'post', options )
    .then( res => {
      const proxyInfo = res.data
      that.proxy = proxyInfo;
      return proxyInfo;
    });
  }

  end(port) {
    var that = this;
    if (!port && !that.proxy) {
      return Promise.resolve();
    }
    return this._callProxy(null, 'delete', null, port)
      .then(data => {
        if (!port || that.proxy && that.proxy.port == port) {
          delete that.proxy;
        }
      });
  }

  listProxies() {
    return this.callRest('proxy', 'get');
  }

  callRest(url, method, data) {
    return axios({
      method: method,
      data: qs.stringify(data || {}),
      url: `${ this.browserMob.uri }/${ url }`
    });
  }

  _callProxy(ext, method, data, proxyPort) {
    let url = `proxy/${ proxyPort || this.proxy.port }/${ ext || ''}`;
    // console.log('[INFO] call proxy: ', method, data)
    return this.callRest(url, method, data);
  }

}

module.exports = BrowserMobClient;