const https = require('https');
const http = require('http');
const fs = require('fs');

const JS_VER = 10
const MAX_RETRY = 1

const options = {
  // key: fs.readFileSync('test/fixtures/keys/agent2-key.pem'),
  // cert: fs.readFileSync('test/fixtures/keys/agent2-cert.pem')
};

function newUrl(urlStr) {
  try {
    return new URL(urlStr)
  } catch (err) {
    return null
  }
}

function makeRes(res, body, status = 200, headers = {}) {

  res.statusCode = status;
  for (const [k, v] of Object.entries(headers)) {
    res.setHeader(k, v);
  }

  res.end(body);
  return;
}

function formatName(name) {
  var parts = name.split('-');
  var retval = "";

  for (const part of parts) {
    if (retval !== "") retval += "-";
    retval += part.substr(0, 1).toUpperCase() + part.substr(1);
  }

  return retval;
}

function fetchAssets(res, path) {
    const fsPath = path.substr(1);

    if (fsPath === "" ||  !fs.existsSync(fsPath)) {
	try {
	    var data = fs.readFileSync("404.html", 'utf8');
	    res.statusCode = 404;
	    res.end(data); 
	} catch(e) {
	    console.log('XError:', e.stack);
	    res.end(); 
	}
	return;
    }

    const suffixes = path.substr(path.lastIndexOf('.'));

    console.log(suffixes);
    var mimeType = "application/octect-stream";
    switch(suffixes) {
	case ".js":
	    mimeType = "text/javascript";
	    break;
	case ".png":
	    mimeType = "image/png";
	    break;
	case ".txt":
	    mimeType = "text/plain";
	    break;
	case ".html":
	    mimeType = "text/html";
	    break;
    }

    res.setHeader("Content-Type", mimeType);

    try {
        var stats = fs.statSync(fsPath);
        res.setHeader("Content-Length", stats.size);
        fs.createReadStream(fsPath).pipe(res);
    } catch(e) {
	console.log('XError:', e.stack);
	res.statusCode = 404;
	res.end(); 
    }
}

function urlRequest(url, options) {

  const reqInit = {
    method: options.method,
    headers: options.headers
  }

  console.log("request(" + url + ")");
  const handler = url.startsWith("http://")? http: https;

  return new Promise((resolv, reject) => {
    try {
	const cReq = handler.request(url, reqInit, (nRes) => resolv(nRes));
        cReq.on('error', reject);
	if (options.method === 'POST') {
	  options.body.pipe(cReq);
	} else {
	  cReq.end();
	}
    } catch (e) {
      reject(e);
    }
  });
}

async function request(aRes, url, options) {

  const reqInit = {
    method: options.method,
    headers: options.headers
  }

  const handler = url.startsWith("http://")? http: https;

  console.log("request(" + url + ")");
  const cReq = handler.request(url, reqInit,
    (nRes) => {

      for (const [k, v] of Object.entries(nRes.headers)) {
	console.log("key: " + k + " value: " + v);
	aRes.setHeader(k, v);
      }

      return nRes.pipe(aRes);
    }
  );

  if (options.method === 'POST') {
    options.body.pipe(cReq);
  } else {
    cReq.end();
  }
}

/**
 *
 * @param {URL} urlObj
 * @param {RequestInit} reqInit
 * @param {number} retryTimes
 */
async function proxy(urlObj, reqInit, acehOld, rawLen, retryTimes) {
  const res = await urlRequest(urlObj.href, reqInit)
  const resHdrNew = {};
  const resHdrOld = res.headers;

  let expose = '*'

  console.log("URL " + urlObj.href);
  for (const [k, v] of Object.entries(resHdrOld)) {
    if (k === 'access-control-allow-origin' ||
        k === 'access-control-expose-headers' ||
        k === 'location' ||
        k === 'set-cookie'
    ) {
      const x = '--' + k
      resHdrNew[x]=v
      if (acehOld) {
        expose = expose + ',' + x
      }
      // delete resHdrNew[k]
    }
    else if (acehOld &&
      k !== 'cache-control' &&
      k !== 'content-language' &&
      k !== 'content-type' &&
      k !== 'expires' &&
      k !== 'last-modified' &&
      k !== 'pragma'
    ) {
      expose = expose + ',' + k
      resHdrNew[k]=v
    } else {
      resHdrNew[k]=v
    }
  }

  if (acehOld) {
    expose = expose + ',--s'
    resHdrNew['--t']='1'
  }

  // verify
  if (rawLen) {
    const newLen = resHdrOld['content-length'] || ''
    const badLen = (rawLen !== newLen)

    if (badLen) {
      if (retryTimes < MAX_RETRY) {
        urlObj = await parseYtVideoRedir(urlObj, newLen, res)
        if (urlObj) {
          return proxy(urlObj, reqInit, acehOld, rawLen, retryTimes + 1)
        }
      }

      var props = {
	'--error': `bad len: ${newLen}, except: ${rawLen}`,
	'access-control-expose-headers': '--error',
      };

      res.statusCode = 400;

      for (const [k, v] of Object.entries(props)) {
	res.setHeader(k, v);
      }

      return res;
    }

    if (retryTimes > 1) {
      resHdrNew.set('--retry', retryTimes)
    }
  }

  let status = res.statusCode;

  resHdrNew['access-control-expose-headers'] = expose
  resHdrNew['access-control-allow-origin'] = '*'
  resHdrNew['--s'] = status
  resHdrNew['--ver'] = JS_VER

  delete resHdrNew['content-security-policy']
  delete resHdrNew['content-security-policy-report-only']
  delete resHdrNew['clear-site-data']

  if (status === 301 ||
      status === 302 ||
      status === 303 ||
      status === 307 ||
      status === 308
  ) {
    status = status + 10
  }

  res.statusCode = status;
  res.headers = resHdrNew;

	/*
  for (const [k, v] of Object.entries(resHdrNew)) {
    res.setHeader(k, v);
  }
  */

  return res;
}

async function httpHandler(aRes, req, pathname) {
  const url = "https://ssx.hh1488.com/http/" + pathname;
  console.log("httpURL " + url + "HEADER: " + JSON.stringify(req.rawHeaders));
  var headers = {};

  for (const [k, v] of Object.entries(req.headers)) {
    console.log("|key: " + k + " value: " + v);
    if (k !== "host") headers[k] = v;
  }

  if (headers.hasOwnProperty('x-jsproxy')) {
    return makeRes(aRes, "internal error", 500);
  }

  let acehOld = false
  let rawSvr = ''
  let rawLen = ''
  let rawEtag = ''

  // preflight
  if (req.method === 'OPTIONS' &&
      headers.hasOwnProperty('access-control-request-headers')
  ) {
    return makeRes(res, "", 204, PREFLIGHT_INIT.headers);
  }

  const refer = headers.referer;
  const query = refer.substr(refer.indexOf('?') + 1)
  if (!query) {
    return makeRes(res, 'missing params', 403)
  }
  const param = new URLSearchParams(query)

  for (const [k, v] of param.entries()) {
    if (k.substr(0, 2) === '--') {
      // 系统信息
      switch (k.substr(2)) {
      case 'aceh':
        acehOld = true
        break
      case 'raw-info':
        [rawSvr, rawLen, rawEtag] = v.split('|')
        console.log("raw-info: " + v);
        break
      }
    } else {
      // 还原 HTTP 请求头
      if (v) {
	console.log("SET " + k + ":" + v);
        headers[k]=v
      } else {
        delete headers[k]
      }
    }
  }

  if (!param.has('referer')) {
    delete headers.referer
  }

  // cfworker 会把路径中的 `//` 合并成 `/`
  const urlStr = pathname.replace(/^(https?):\/+/, '$1://')
  const urlObj = newUrl(urlStr)
  if (!urlObj) {
    return makeRes(res, 'invalid proxy url: ' + urlStr, 403)
  }

  const reqInit0 = {
    method: req.method,
    headers: headers,
    body: req
  }

  const nRes = await proxy(urlObj, reqInit0, acehOld, rawLen, 0);

  for (const [k, v] of Object.entries(nRes.headers)) {
    console.log("key: " + k + " value: " + v);
    if (k !== "alt-svc") aRes.setHeader(k, v);
  }

  aRes.statusCode = nRes.statusCode;
  return nRes.pipe(aRes);
}

wrapURL = (url) => {

  if (url.startsWith("https://")) {
    return "https://ssx.hh1488.com/surfing.https" + url.substr(7);
  } else if (url.startsWith("http://")) {
    return "https://ssx.hh1488.com/surfing.http" + url.substr(6);
  }

  return url;
}

async function forwardHelper(aRes, req, url) {

  var headers = {};
  var urlObj = newUrl(url);

  for (const [k, v] of Object.entries(req.headers)) {
    console.log("|key: " + k + " value: " + v);
         if (k === "host") headers[k] = urlObj.host;
    else if (k === "Host") headers[k] = urlObj.host;
    else headers[k] = v;
  }

  const reqInit0 = {
    method: req.method,
    headers: headers,
    body: req
  }

  const nRes = await urlRequest(url, reqInit0);
  aRes.statusCode = nRes.statusCode;

  var redirect = nRes.statusCode === 302 || nRes.statusCode === 301;

  for (const [k, v] of Object.entries(nRes.headers)) {
    console.log("key: " + k + " value: " + v);
         if (k === "location" && redirect) aRes.setHeader(k, wrapURL(v));
    else if (k === "Location" && redirect) aRes.setHeader(k, wrapURL(v));
    else if (k === "alt-svc") { console.log("ignore alt-svc" + v); }
    else  aRes.setHeader(k, v);
  }

  return nRes.pipe(aRes);
}

async function fetchHandler(req, res) {
  const path = req.url;

  console.log("HELLO WORLD");
  if (path.startsWith('/http/https://www.google.com/')) {
    // https://shy-unit-c0d5.cachefiles.workers.dev/
    return forwardHelper(res, req, "https://shy-unit-c0d5.cachefiles.workers.dev/" + path);
  }

  if (path.startsWith('/http/')) {
    return httpHandler(res, req, path.substr(6))
  }

  if (path.length > 15 && path.startsWith('/surfing.http/')) {
    return forwardHelper(res, req, "http://" + path.substr(14));
  }

  if (path.length > 15 && path.startsWith('/surfing.https/')) {
    return forwardHelper(res, req, "https://" + path.substr(15));
  }

  if (path.startsWith('/-----http')) {
    return fetchAssets(res, "/404.html");
  }

  switch (path) {
  case '/http':
    return makeRes(res, '请更新 cfworker 到最新版本!')
  case '/ws':
    return makeRes(res, 'not support', 400)
  case '/works':
    return makeRes(res, 'it works')
  default:
    // static files
    // if (path.indexOf(".") === -1)
	// return makeRes(res, "not support", 400);
    return fetchAssets(res, path);
  }
}

var server = http.createServer(options, (req, res) => {
	console.log("JEO\n");
	// console.log(JSON.stringify(req.url));
	// console.log(JSON.stringify(req.headers));
	fetchHandler(req, res).catch(e => makeRes(res, "", 500));
});

server.listen(9876);

