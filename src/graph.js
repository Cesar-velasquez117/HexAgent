const  Graph  = require("node-dijkstra");
const Agent = require('ai-agents').Agent;
const transposeHex = require('./transposeHex');

// Ejemplo de matriz
const matrix = [
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 1, 0, 1, 0],
  [0, 0, 0, 1, 0, 0, 0],
  [0, 0, 0, 1, 0, 0, 0],
  [0, 0, 1, 1, 1, 0, 0],
  [0, 0, 0, 1, 0, 0, 0],
  [1, 0, 0, 0, 0, 0, 0]
];

const matrixTranspose = [
  [0, 0, 0, 0, 0, 0, 1],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 0, 1, 0, 0],
  [0, 1, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0]
  ]  ;
// console.log(Agent.getID())
// Función para convertir la matriz en un grafo
function matrixToGraph(matrix, id) {
  const graph = new Graph();

  // Obtener el número de filas y columnas de la matriz
  const rows = matrix.length;
  const columns = matrix[0].length;

  const leftEdges={}
  for (let i = 0; i<rows; i++){
     leftEdges[`${i},0`] = 1;
  }
  graph.addNode("leftPivot", leftEdges);

  const rightEdges={}
  for (let i = 0; i<rows; i++){
     rightEdges[`${i},${columns-1}`] = 1;
  }
  graph.addNode("rightPivot", rightEdges);
  // Agregar nodos al grafo
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < columns; j++) {
      const node = `${i},${j}`;
      const edges = {};

      // esquina inferior izquierda
      if (i==(rows - 1) && j==0) {
        edges[`${i -1},${j}`] = costs(i,j,id, matrix, i - 1, j);
        edges[`${i},${j + 1}`] = costs(i,j,id, matrix, i, j + 1);
        edges[`${i -1},${j + 1}`] = costs(i,j,id, matrix, i - 1, j + 1);
        edges['leftPivot']= costPivot(id, matrix, i, j) ;
      }
      //Esquina superior derecha
      if (i==0 && j==(rows - 1)) {
        edges[`${i},${j - 1}`] = costs(i,j,id, matrix, i, j - 1);
        edges[`${i+1},${j}`] = costs(i,j,id, matrix, i + 1, j);
        edges[`${i+1},${j - 1}`] = costs(i,j,id, matrix, i + 1, j - 1);
        edges['rightPivot']= costPivot(id, matrix, i, j );
      }
      //esquina superior izquierda
      if (i==0 && j==0) {
        edges[`${i},${j + 1}`] = costs(i,j,id, matrix, i , j + 1);
        edges[`${i+1},${j}`] = costs(i,j,id, matrix, i + 1, j);
        edges['leftPivot']= costPivot(id, matrix, i, j) ;
      }
      //esquina inferior derecha
      if (i==(rows - 1) && j==(rows - 1)) {
        edges[`${i - 1},${j}`] = costs(i,j,id, matrix, i - 1, j);
        edges[`${i},${j - 1}`] = costs(i,j,id, matrix, i , j - 1);
        edges['rightPivot']= costPivot(id, matrix, i, j) ;
      }

       //lateral izquierdo
      if (i > 0 && i < (rows - 1) && j == 0) {
        edges[`${i},${j + 1}`] = costs(i,j,id, matrix, i , j + 1);
        edges[`${i - 1},${j}`] = costs(i,j,id, matrix, i - 1, j);
        edges[`${i + 1},${j}`] = costs(i,j,id, matrix, i + 1, j);
        edges[`${i - 1},${j + 1}`] = costs(i,j,id, matrix, i - 1, j + 1);
        edges['leftPivot']=costPivot(id, matrix, i, j );
      }

       //lateral derecho
       if (i > 0 && i < (rows - 1) && j == (columns - 1)) {
        edges[`${i},${j - 1}`] = costs(i,j,id, matrix, i , j - 1);
        edges[`${i - 1},${j}`] = costs(i,j,id, matrix, i - 1, j);
        edges[`${i + 1},${j}`] = costs(i,j,id, matrix, i + 1, j);
        edges[`${i + 1},${j - 1}`] = costs(i,j,id, matrix, i + 1, j - 1);
        edges['rightPivot']=costPivot(id, matrix, i, j );
      }
      //lateral inefrior
       if (j > 0 && j < (columns - 1) && i == (rows - 1)) {
        edges[`${i},${j - 1}`] = costs(i,j,id, matrix, i , j - 1);
        edges[`${i},${j - 1}`] = costs(i,j,id, matrix, i , j - 1);
        edges[`${i - 1},${j}`] = costs(i,j,id, matrix, i - 1, j);
        edges[`${i - 1},${j + 1}`] = costs(i,j,id, matrix, i - 1, j + 1);
      }
      //lateral superior
       if (i == 0 && j > 0 &&  j < (columns - 1)) {
        edges[`${i},${j + 1}`] = costs(i,j,id, matrix, i , j + 1);
        edges[`${i},${j - 1}`] = costs(i,j,id, matrix, i , j - 1);
        edges[`${i + 1},${j}`] = costs(i,j,id, matrix, i + 1, j);
        edges[`${i + 1},${j - 1}`] = costs(i,j,id, matrix, i + 1, j - 1);
      }


      // Verificar si hay una conexión con el nodo vecino hacia abajo
      if ((i>0 && j>0) && (i < rows - 1 && j < columns - 1)) {
        edges[`${i + 1},${j}`] = costs(i,j,id, matrix, (i + 1), j);
        edges[`${i - 1},${j}`] = costs(i,j,id, matrix, (i - 1), j);
        edges[`${i},${j + 1}`] = costs(i,j,id, matrix, i , (j + 1));
        edges[`${i},${j - 1}`] = costs(i,j,id, matrix, i , (j - 1));
        edges[`${i - 1},${j + 1}`] = costs(i,j,id, matrix, (i - 1), (j + 1));
        edges[`${i + 1},${j - 1}`] = costs(i,j,id, matrix, (i + 1), (j - 1));
        
      }
      graph.addNode(node, edges);
    }
  }

  return graph;
}

function costs(i,j,id, world, iEvaluate, jEvaluate){

  //Estoy evaluando un nodo tomado por el adversario
 if ((world[i][j] != id) && (world[i][j] != 0)) {
   console.log("Entre en el primer if de que estoy en un nodo adversario")
    return 1000
 //Voy a un nodo tomado por el adversario
 }else if((world[iEvaluate][jEvaluate] != id) && (world[iEvaluate][jEvaluate] != 0)){
   console.log("Entre en el segundo if de que estoy evaluando un nodo adversario")
  return 1000
 }else if ((world[i][j] == 0) && (world[iEvaluate][jEvaluate]) == 0){ // Estoy en una posicion vacia y voy a una posicion vacia
  return 3
 }
 else{// Estoy en una posicion propia y voy a una posicion propia
  return 1
  // //Evaluo un nodo que no esta tomado y ademas el que voy a escoger tampoco esta tomado por ningun jugador
  // if((world[i,j] == "0") && (world[iEvaluate, jEvaluate]) == "0"){
  //   return 3
  // }// Estoy en una posicion vacia y voy a un nodo propio o Estoy en una posicion propia y voy a una posicion vacia
  // else if (((world[i,j] == "0") && (world[iEvaluate, jEvaluate]) == id) || 
  //         ((world[i,j] == id) && (world[iEvaluate, jEvaluate]) == "0" ))
  // { 
  //   return 3
  // }
}
}
function costPivot(id,world,iEvaluate,jEvaluate){
    //Estoy evaluando un nodo tomado por el adversario
    if ((world[iEvaluate][jEvaluate] != id) && (world[iEvaluate][jEvaluate] != 0)) {
      console.log("Entre en el if pivote de que estoy evaluando un nodo tomado por el adversario")
        return 1000
    } else if (world[iEvaluate][jEvaluate] == id){ // Evaluo si mi vecino es un aliado
        return 1
    } else {
        return 3
    }
}
// Convertir la matriz en un grafo
const graph = matrixToGraph(transposeHex(matrixTranspose), 1);
console.log(graph)

// Encontrar la ruta más corta entre dos nodos
const shortestPath = graph.path('leftPivot', 'rightPivot', { cost:true});
console.log(shortestPath); // ['0-0', '0-1', '1-1', '2-1', '3-1', '3-2', '3-3']
// cost
// console.log(transposeHex(matrix))