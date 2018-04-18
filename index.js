const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5001

var app = require('express')();
var http = require('http').Server(app);
var mqtt = require('mqtt');

var options = {
    port: 10246,
    host: 'm14.cloudmqtt.com',
    clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8),
    username: 'xxjpxcmq',
    password: new Buffer('Bp48RyeHOmBc'),
    keepalive: 60,
    reconnectPeriod: 1000,
    protocolId: 'MQIsdp',
    protocolVersion: 3,
    clean: true,
    encoding: 'utf8'
};

/*var optiones = {

	port: 1883,
	host: "192.168.1.65",
	clientID: 'node_master',
	keepalive:60,
	reconnectPeriod:1000,
	protocolId: 'MQIsdp',
	protocolVersion:3,
	clean:true,
	encoding: 'utf8'
};*/

console.log("INTENTANDO CONECTAR");
//var client = mqtt.connect('http://m14.cloudmqtt.com',options);
var client = mqtt.connect('http://10.42.0.1');
//console.log(client);

var io = require('socket.io')(http);

var socketOn = false;

client.on('connect',function(){
	client.subscribe('presence');
	client.subscribe('node/register')
	client.publish('presence','Hello mqtt');
	client.subscribe('tugger');
	socketOn = true;
	console.log("******CONEXION MQTT REALIZADA ***** ");

});

// client.on('message',function(topic,message){
// 	//console.log(message.toString());
// 	if(socketOn)
// 	{
// 		if(topic === "tugger")
// 		{
// 			//HACER PARSE A OBJETO JSON
// 			var registro = JSON.parse(message);
// 			console.log("Objeto creado con exito: ",registro.chipid);

// 		}
// 		io.emit('chat message',message.toString());
// 	}
// 	console.log(topic,message);
// });

mqttCallback = function(topic,message)
{

	var MongoClient = require('mongodb').MongoClient;

	//var url = 'mongodb+srv://b08walls:53285329@cluster0-oo4wz.mongodb.net/test'

	var url = 'mongodb://localhost:27017/';

	var registroNode = function(m)
	{
		var registerBeacon = function(chipid, mode, x, y, marj, mino)
		{
			MongoClient.connect(url, function(err, db) {
				if (err) throw err;
				//var dbo = db.db("Tugger");
				var dbo = db.db("mydb");
				//var myobj = {"_id":"5ab194b0c38a9d343cc61ad7","marj":"123","mino":"456","x":2,"y":2,"mode":false,"chipid":"123456789"};

				var objeto = {};

				if(chipid != undefined)
				{
					objeto.chipid = chipid;
				}

				if(mode!= undefined)
				{
					objeto.mode = mode;
				}

				if(x!=undefined)
				{
					objeto.x = x;
				}

				if(y != undefined)
				{
					objeto.y = y;
				}

				if(marj!= undefined)
				{
					objeto.marj = marj;
				}

				if(mino != undefined)
				{
					objeto.mino = mino;
				}

				var query = {chipid:objeto.chipid};

				// dbo.collection("BeaconsInPlay").deleteOne(query,function(err,obj){
				// 	if(err) throw err;
				// 	console.log("BEACON ELIMINADO!");
				// 	dbo.collection("BeaconsInPlay").insertOne(objeto,function(err,res){
				// 		if(err)throw err;
				// 		console.log("BEACON REGISTRADO O ACTUALIZADO!");
				// 		db.close();
				// 	})
				// })

				dbo.collection("BeaconsInPlay").find(query).toArray(function(err,result){
					if(err) throw err;
					console.log(result);


					if(result.length<=0){
						dbo.collection("BeaconsInPlay").insertOne(objeto, function(err, res) {
							if (err) throw err;
							console.log("BEACON REGISTRADO CON EXITO");
							db.close();
						});
					}
					else
					{
						console.log("EL OBJETO QUE SE VA A ACOMODAR COMO $SET ES:",objeto);
						var newValues = {$set:objeto};
						dbo.collection("BeaconsInPlay").updateOne(query,newValues,function(err,res){
							if(err) throw err;
							console.log("BEACON ACTUALIZADO CON EXITO!");
							db.close();
						})
						console.log("BEACON ACTUALIZADO");
					}
				});




			});
		}


		var o;
		try
		{
			console.log(typeof(m));
			var str = ""+m;
			str = str.replace(/'/g,"\"");
			str = str.replace(":",":\"");
			str = str.replace("}","\"}");
			// console.log(str,"primer reemplazo");
			o = JSON.parse(str);
			console.log("REGISTRO");
		}catch(e)
		{
			console.log("error: pero haha lo cacche",e.toString());
		}

		if(o!= undefined)
		{
			registerBeacon(o.chipid, o.mode, o.x, o.y, o.marj, o.mino);
		}
	}

	var tuggerTracking = function(m)
	{
		var o;
		try
		{
			console.log(typeof(m));
			var str = ""+m;

			console.log("STRING ORIGINAL",str);

			str = str.replace(/'/g,"\"");
			//str = str.replace(/:[^"]/,":\"");
			//str = str.replace("}","\"}");
			var correcciones = str.match(/:[^"]*.?[,}]/g,str)

			correcciones.forEach(function(x){
				var __temp = x.replace(/:/g,':"');
				__temp = __temp.replace(/}/g,'"}');
				__temp = __temp.replace(/,/g,'",');
				str = str.replace(x,__temp);
				// console.log(x,__temp);
			})
			console.log("STRING CORREGIDO: ",str);
			o = JSON.parse(str);
			console.log("REGISTRO");
		}catch(e)
		{
			console.log("error: pero haha lo cacche",e.toString());
		}

		if(o!= undefined)
		{

			// if(parseInt(o.minLoad,16) == parseInt("CACA",16) && parseInt(o.maxLoad,16) == parseInt("BEBE",16)){
			if(parseInt(o.minLoad,16) == 6081 && parseInt(o.maxLoad,16) == 15){
				io.emit('updates',o);
				console.log(o);
			}

		}
	}

	if(socketOn)
	{
		switch(topic)
		{
			case "tugger":
				tuggerTracking(message);
			break;
			case "node/register":
				registroNode(message);
				break;
			case "presence":
			break;
			default:
			break;
		}
	}
}

client.on('message',mqttCallback);

client.on('error', function(err) {
    console.log(err);
});

app.get('/',function(req,res)
{
	//res.send('<h1>Hello world</h1>');
	res.sendFile(__dirname+'/Table.html');
});

app.get('/jquery.js',function(req,res)
{
	//res.send('<h1>Hello world</h1>');
	res.sendFile(__dirname+'/node_modules/jquery/dist/jquery.js');
});

app.get('/d3.js',function(req,res)
{
	//res.send('<h1>Hello world</h1>');
	res.sendFile(__dirname+'/d3.v3.min.js');
});

app.get('/script.js',function(req,res)
{
	//res.send('<h1>Hello world</h1>');
	res.sendFile(__dirname+'/script.js');
});

app.get('/demoMongo',function(req,res)
{

	var MongoClient = require('mongodb').MongoClient;
	var url = 'mongodb://localhost:27017/';

	MongoClient.connect(url,function(err,db){
		if(err){
			console.log("error en conexion");
			throw err;
		}

		var dbo = db.db("mydb");
		dbo.collection("BeaconsInPlay").find({}).toArray(function(err,result){
			if(err){
				console.log("error en query");
				throw err;
			}

			console.log(result);
			cargarDatos(result);
			db.close();
		});
	})


	var cargarDatos = function(valores)
	{
		if(valores != undefined){
			console.log("el resultado esta definido");

			var respuesta = "";

			valores.forEach(function(item){
				respuesta += JSON.stringify(item);
			})

			res.send(respuesta);
		}
		else{
			console.log("el resultado no esta definido");
		}	
	}
	//res.sendFile(__dirname+'/app.js');
});


app.get('/tunner.js',function(req,res)
{
	//res.send('<h1>Hello world</h1>');
	res.sendFile(__dirname+'/tunner.js');
});

app.get('/bcwContent2.html',function(req,res)
{
	res.sendFile(__dirname+'/bcwContent2.html');
});

app.get('/socket',function(req,res)
{
	res.sendFile(__dirname+'/node_modules/socket.io-client/dist/socket.io.js');
});

app.use(express.static(__dirname+'/public'))

io.on('connection',function(socket)
{
	console.log('a user connected');
	io.on('connection',function(socket){
		socket.broadcast.emit("hi");
	});

	socket.on('disconnect',function(){
		console.log('user disconnected')
	});

	socket.on('chat message',function(msg){
		console.log('message: '+msg);
		io.emit('chat message',msg);
		socketOn = true;
	});
});
/*
http.listen(3000,function()
{
	console.log('listening on *:3000');
});*/

http.listen(PORT,function(){console.log("INIT OK!")})


// express()
//   .use(express.static(path.join(__dirname, 'public')))
//   .set('views', path.join(__dirname, 'views'))
//   .set('view engine', 'ejs')
//   .get('/', (req, res) => res.render('pages/index'))
//   .listen(PORT, () => console.log(`Listening on ${ PORT }`))




