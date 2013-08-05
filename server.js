var restify = require('restify'),
    follow = require('follow'),
    fs = require('fs'),
    coax = require('coax'),
    server = restify.createServer(),
    io = require('socket.io').listen(server);

var argv = require('optimist')
  .usage('node server.js --listen [addr] --port [num] --db [url]')
  .default('listen', '127.0.0.1')
  .default('port', '80')
  .default('db', 'http://localhost:5984/stats')
  .argv;

var db = argv.db


io.sockets.on('connection', function(socket){

  var feed = new follow.Feed({
    db : db,
    filter : function(doc, req){
      /* filter non testid docs */
      if('testid' in doc){
          return true
      }
      return false
    }

  })

  feed.follow()

  feed.on('change', function(change){
    coax([db, change.id], function(err, json){
      if(!err){
        socket.emit('stats', json)
      }
    })
  })


  socket.on('end', function(){
    feed.emit('stop')
  })

});


function home(req, res, next) {
  fs.readFile('site/index.html', function (err, html) {
    if (err) {
      throw err;
    }
    res.writeHeader(200, {"Content-Type": "text/html"});
    res.write(html);
    res.end();
  });
}

function script(req, res, next) {
  var file = req.params.file
  fs.readFile('site/js/'+file, function (err, js) {
    if (err) {
      throw err;
    }
    res.writeHeader(200, {"Content-Type": "text/javascript"});
    res.write(js);
    res.end();
  });
}

server.get('/', home)
server.get('/js/:file', script)

/* start server */
server.listen(argv.port, argv.listen, function(){
  var listener = argv.listen+":"+argv.port
  console.log("Server started on: http://"+listener)
  fs.writeFile('site/js/config.js', "listener=\""+listener+"\"", function (err) {
    if (err) throw err;
  })

})
