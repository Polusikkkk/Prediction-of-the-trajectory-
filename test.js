"use strict";

//This code tests the trained model against the test dataset and generates some illustration images

const brain = require("brain.js");


const fs = require("fs");

const { //canvas is required to draw the illustration images 
  createCanvas
} = require("canvas");

const WIDTH = 200; //image frame width and height are needed to generate illustration images
const HEIGHT = 200;
const DOT_RADIUS = 2;


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




  // now use the test dataset to visualize the predictions
  const test = fs.readFileSync("./dataset/data.csv", "UTF-8");
  let lines = test.split(/\r?\n/);

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

    dataset.push(rec);
  });



  for (let rec of dataset) {

    let drawPoint = function (p, offset) {
      offset = offset || {
        x: 0,
        y: 0
      };
      var ox = offset.x;
      var oy = offset.y;

      ctx.beginPath();
      ctx.arc(p.x + ox, p.y + oy, DOT_RADIUS, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    };


    const cvs = createCanvas(WIDTH, HEIGHT);
    const ctx = cvs.getContext("2d");


    ctx.fillStyle = "#000030";
    ctx.fillRect(0, 0, cvs.width, cvs.height);

    //previous coordinates
    for (let i = 0; i < rec.input.length; i = i + 2) {
      let dot = {
        x: 0,
        y: 0
      };
      dot.x = rec.input[i] * WIDTH;
      dot.y = rec.input[i + 1] * HEIGHT;
      ctx.strokeStyle = `rgb(0, ${parseInt(255 - (200 * (i / rec.input.length)))},0)`;
      drawPoint(dot);
    }

    let dot = {
      x: 0,
      y: 0
    };


    //draw the ground truth dot
    dot.x = rec.output[0] * WIDTH;
    dot.y = rec.output[1] * HEIGHT;
    ctx.strokeStyle = `#FF0000`;
    drawPoint(dot);



    //predict the future coordinates using the input only
    const output = net.run(rec.input);

    //draw the predited dot 
    dot.x = output[0] * WIDTH;
    dot.y = output[1] * HEIGHT;
    ctx.strokeStyle = `#FFFF00`;
    drawPoint(dot);


    let fileName = rec.outputfilename;

    const out = fs.createWriteStream(`./output/${fileName}.png`)
    const stream = cvs.createPNGStream()
    stream.pipe(out)


  }


} else {
  console.log("No brain file found. Most likely the neural network has not been trained yet.")
}



