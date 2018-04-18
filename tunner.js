
// alert("hello!!");


var tunningTugger = angular.module('tunningTugger',['ngAria','ngMaterial']);

tunningTugger.controller('myController',["$scope","$timeout","$mdDialog",function($scope,$timeout,$mdDialog){

	$scope.datos = {};


	var xmlHttp = new XMLHttpRequest();

	xmlHttp.open("GET","http://localhost:5001/demoMongo",false);

	xmlHttp.send(null);

	console.log(xmlHttp.responseText);

	var arregloDemo = xmlHttp.responseText.match(/{.+?}/g);

	$scope.valoresDialogo = []

	$scope.arregloDeDatos = []

	arregloDemo.forEach(function(item){
		$scope.valoresDialogo.push(JSON.parse(item));
	});

	console.log("valoresDialogo: ", $scope.valoresDialogo);

	for(var i = 0;i<$scope.valoresDialogo.length;i++)
	{
		$scope.datos[$scope.valoresDialogo[i].chipid] = $scope.valoresDialogo[i];
		$scope.datos[$scope.valoresDialogo[i].chipid].distancia = 1000;
		$scope.datos[$scope.valoresDialogo[i].chipid].latency = 0;
		$scope.datos[$scope.valoresDialogo[i].chipid].past = 0;
		//$scope.datos[$scope.valoresDialogo[i].chipid].lugar = $scope.valoresDialogo[];
	}

	console.log("$scope.datos",$scope.datos);

	$(function (){
		var socket = io();
		socket.on('updates',function(msg){
			$scope.$apply(function(){
				$scope.datos[msg.chipid].distancia = parseFloat(msg.distancia);
				var lastTime = new Date();

				var dateTime = ""+ lastTime.getHours() + ":" + lastTime.getMinutes() + ":" + lastTime.getSeconds();
				$scope.datos[msg.chipid].time = dateTime;

				var newPast = Date.now()
				console.log("NOW: ",newPast);
				var actual = newPast - $scope.datos[msg.chipid].past;
				$scope.datos[msg.chipid].latency = actual;
				$scope.datos[msg.chipid].past = newPast;
				console.log("OBJETO DATOS: ",$scope.datos);
				$scope.arregloDeDatos = Object.keys($scope.datos).map(i => $scope.datos[i]);

				//console.log("arregloDeDatos",$scope.arregloDeDatos);
				$scope.arregloDeDatos.sort(function(a,b){
					return parseFloat(a.distancia)-parseFloat(b.distancia);
				});
			});

			// alert("LLEGO UN MENSAJE");

			console.log("DATOS: ",$scope.arregloDeDatos)
			//console.log($scope.valoresDialogo);
		});

		return false;
	});


}])