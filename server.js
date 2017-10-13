const http = require('http');
const https = require('https');
const httpProxy = require('http-proxy');
const fs = require('fs')
const ipfsAPI = require('ipfs-api')

const ipfs = ipfsAPI('/ip4/127.0.0.1/tcp/5001')
const proxy = httpProxy.createProxyServer();

const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

https.createServer(options, function (req, res) {
  console.log('Request', req.url)
  debugger
  if (req.headers.host.match(/^ipfs.io$/)) {
    console.log('Ipfs filter:', req.url);
    proxy.web(req, res, {
      target: 'http://localhost:9008'
    });
  } else {
    console.log('Pass through:', req.url);
    proxy.web(req, res, {
      target: 'https://' + req.headers.host
    });
  }
}).listen(8008, function () {
  console.log('Done')
});

http.createServer(function (req, res) {
  console.log('Fetching ipfs file...', req.url)

  ipfs.files.get(req.url, function (err, stream) {
    if (!stream) {
      res.writeHead(404,{"Content-type":"text/plain"});
      res.end("IPFS file was not found");
      return;
    } else {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
    }

    stream.on('data', (file) => {
      file.content.pipe(res)
    })

    stream.on('end', (file) => {
      console.log('Done!')
      res.end();
    })
  })
}).listen(9008);
