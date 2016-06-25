const server = require('http').createServer()
  , url = require('url')
  , WebSocketServer = require('ws').Server
  , wss = new WebSocketServer({ server: server })
  , express = require('express')
  , app = express()
  , port = process.env.PORT || 8080

app.use(function (req, res) {
  res.send(`
 <!DOCTYPE html>
  <meta charset="utf-8" />
  <title>WebSocket Test</title>
  <script language="javascript" type="text/javascript">

  var wsUri = "wss://echo.websocket.org/";
  wsUri = document.location.href.replace(/^http(.?):/, 'ws$1:') + 'websocket/TOKEN_XXX'

  var output;

  function init()
  {
    output = document.getElementById("output");
    testWebSocket();
  }

  function testWebSocket()
  {
    websocket = new WebSocket(wsUri);
    websocket.onopen = function(evt) { onOpen(evt) };
    websocket.onclose = function(evt) { onClose(evt) };
    websocket.onmessage = function(evt) { onMessage(evt) };
    websocket.onerror = function(evt) { onError(evt) };
  }

  function onOpen(evt)
  {
    console.log(evt)
    writeToScreen("CONNECTED");
    doSend("WebSocket rocks");
  }

  function onClose(evt)
  {
    console.log(evt)
    writeToScreen("DISCONNECTED");
  }

  function onMessage(evt)
  {
    console.log(evt)
    writeToScreen('<span style="color: blue;">RESPONSE: ' + evt.data+'</span>');
    websocket.close();
  }

  function onError(evt)
  {
    writeToScreen('<span style="color: red;">ERROR:</span> ' + evt.data);
  }

  function doSend(message)
  {
    writeToScreen("SENT: " + message);
    websocket.send(message);
  }

  function writeToScreen(message)
  {
    var pre = document.createElement("p");
    pre.style.wordWrap = "break-word";
    pre.innerHTML = message;
    output.appendChild(pre);
  }

  window.addEventListener("load", init, false);

  </script>

  <h2>WebSocket Test</h2>

  <div id="output"></div>

  `)
});

wss.on('connection', function connection(ws) {
  var location = url.parse(ws.upgradeReq.url, true);
  // you might use location.query.access_token to authenticate or share sessions
  // or ws.upgradeReq.headers.cookie (see http://stackoverflow.com/a/16395220/151312)

  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
  });

  ws.send('something from c9');
});

server.on('request', app);
server.listen(port, function () { console.log('Listening on ' + server.address().port) });


/*


var WebSocketServer = require('ws').Server
// https://github.com/websockets/ws/issues/326

// http://stackoverflow.com/a/19155613/1123955
const verifyClient = function(info, cb) {
  const {origin, secure, req} = info
//  console.log(origin)
//  console.log(secure)
  console.log(req.url)
  req.zixia = 1

//  console.log(req.socket)
// console.log(req.connection)

  cb(true)
}

const handleProtocols = function(protocols, cb) {
  console.log('protocols: ' + protocols)
  cb(true, protocols[0])
}

// https://github.com/websockets/ws/blob/master/doc/ws.md
const wss = new WebSocketServer({
  host: process.env.IP
  , port: process.env.PORT
  , handleProtocols
  , verifyClient
})

wss.on('connection', function connection(ws) {
  //console.log(ws)
  //console.log('zixia: ' + ws.upgradeReq.client.zixia)
  console.log('zixia: ' + ws.upgradeReq.zixia)
//  upgradeReq.socket/connection/client

  ws
  .on('message', function incoming(message) {
    console.log('srv received: %s', message);
    ws.send('roger')
  })
  .on('error', e => {
    console.log('error:' + e)
  })
  .on('close', e => {
    console.log('srv on close:' + e)
  })

  ws.send('something from srv');
});

*/