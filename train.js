"use strict";

const brain = require("brain.js");


const DATASET_LIMIT = 0;


const fs = require("fs");

const config = {
  binaryThresh: 0.5,
  hiddenLayers: [3], // array of ints for the sizes of the hidden layers in the network
  activation: "sigmoid", // supported activation types: ["sigmoid", "relu", "leaky-relu", "tanh"],
  leakyReluAlpha: 0.01, // supported for activation type "leaky-relu"
  learningRate: 0.000003, // scales with delta to effect training rate --> number between 0 and 1
  momentum: 0.01,
  log: true,
  logPeriod: 1,
  iterations: 1000,
  errorThresh: 0.0000005,
};



const net = new brain.NeuralNetwork(config);



if (fs.existsSync("brain")) {
  let json = JSON.parse(fs.readFileSync("brain"));
  net.fromJSON(json);
  console.log("Restored brain ");
}


//read the training dataset
const data = fs.readFileSync("./dataset/data.csv", "UTF-8");

// split the contents by new line
let lines = data.split(/\r?\n/);

const dataset = [];


lines.forEach((line) => {
  let raw = line.split(",");
  let rec = {
    input: [],
    output: []
  };

  rec.outputfilename = raw[0];

  for (let i = 1; i < raw.length; i++)
    raw[i] = (parseFloat(raw[i]) + 1) / 2;

  rec.input.push(raw[3]); //past coordinates
  rec.input.push(raw[4]);
  rec.input.push(raw[5]);
  rec.input.push(raw[6]);
  rec.input.push(raw[7]);
  rec.input.push(raw[8]);
  rec.input.push(raw[9]);
  rec.input.push(raw[10]);
  rec.input.push(raw[11]);
  rec.input.push(raw[12]);

  rec.output.push(raw[1]); //future coordinates, ground truth
  rec.output.push(raw[2]);

  if (raw[5])
    dataset.push(rec);
});

//truncate the dataset if it is too large
if (DATASET_LIMIT) dataset.length = DATASET_LIMIT;

console.time("training");
net.train(dataset);
console.timeEnd("training");
//save the weights
fs.writeFileSync("brain", JSON.stringify(net.toJSON()));






