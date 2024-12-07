"use strict";

//This code generates a training dataset

//generates a csv file with coordinates of an object following a bezier curve
//generates images for the illustration purposes


const WIDTH = 200;
const HEIGHT = 200;
const PADLEFT = 100;
const PADRIGHT = 20;
const QH = WIDTH / 3;
const QV = HEIGHT / 2;
const NUM_OF_DOTS = 5;
const DRAW_VECTORS = false;
const ACTIVE_MANEUVERING = false; //if false, the dot will follow a balistic trajectory. If true, it will have a random thrust vector. 
const DOT_RADIUS = 1;
const NUMBER_OF_FILES_TO_GENERATE = 100;
const IS_FLIP_HORIZONTALLY_AT_RANDOM = true;
const PRECISION = 6;


const fs = require("fs")
const { Bezier } = require('bezier-js');
const PNG = require("pngjs").PNG;

const {
  createCanvas
} = require("canvas");




for (let ii = 0; ii < NUMBER_OF_FILES_TO_GENERATE; ii++) {

  let cvs = createCanvas(WIDTH, HEIGHT);
  let ctx = cvs.getContext("2d");

  let isFlipped = IS_FLIP_HORIZONTALLY_AT_RANDOM && Math.random() > 0.5;

  if (isFlipped) {
    ctx.translate(cvs.width, 0);
    ctx.scale(-1, 1);
  }



  let curve;

  if (ACTIVE_MANEUVERING) {
    let S = [PADLEFT, HEIGHT / 2];
    let SF = [PADLEFT, HEIGHT / 2];

    SF[0] = SF[0] + Math.random() * QH - (QH / 2);
    SF[1] = SF[1] + Math.random() * QV - (QV / 2);


    let E = [WIDTH - PADRIGHT, HEIGHT / 2];
    E[0] = E[0] + Math.random() * QH - (QH / 2);
    E[1] = E[1] + Math.random() * QV - (QV / 2);

    let EF = [WIDTH - PADRIGHT, HEIGHT / 2];
    EF[0] = EF[0] + Math.random() * QH - (QH / 2);
    EF[1] = EF[1] + Math.random() * QV - (QV / 2);

    curve = new Bezier([...S, ...SF, ...EF, ...E]);

  } else {
    let S = [PADLEFT, HEIGHT / 2]; //starting point
    let E = [WIDTH - PADRIGHT, HEIGHT / 2]; //ending point
    E[0] = E[0] + Math.random() * QH - (QH / 2);
    E[1] = E[1] + Math.random() * QV - (QV / 2);
    curve = new Bezier(S[0], S[1], Math.random() * 200, Math.random() * 200, E[0], E[1]);
  }



  let drawCurve = function (curve, offset) {
    offset = offset || {
      x: 0,
      y: 0
    };
    let ox = offset.x;
    let oy = offset.y;
    ctx.beginPath();
    let p = curve.points,
      i;
    ctx.moveTo(p[0].x + ox, p[0].y + oy);
    if (p.length === 3) {
      ctx.quadraticCurveTo(
        p[1].x + ox, p[1].y + oy,
        p[2].x + ox, p[2].y + oy
      );
    }
    if (p.length === 4) {
      ctx.bezierCurveTo(
        p[1].x + ox, p[1].y + oy,
        p[2].x + ox, p[2].y + oy,
        p[3].x + ox, p[3].y + oy
      );
    }
    ctx.stroke();
    ctx.closePath();
  }


  let drawLine = function (p1, p2, offset) {
    offset = offset || {
      x: 0,
      y: 0
    };
    let ox = offset.x;
    let oy = offset.y;
    ctx.beginPath();
    ctx.moveTo(p1.x + ox, p1.y + oy);
    ctx.lineTo(p2.x + ox, p2.y + oy);
    ctx.stroke();
  };


  let drawPoint = function (p, offset, ctx1) {
    offset = offset || {
      x: 0,
      y: 0
    };
    let ox = offset.x;
    let oy = offset.y;

    ctx1.beginPath();
    ctx1.arc(p.x + ox, p.y + oy, DOT_RADIUS, 0, 2 * Math.PI);
    ctx1.fill();
    ctx1.stroke();
  };


  ctx.fillStyle = "#000030";
  ctx.fillRect(0, 0, cvs.width, cvs.height);

  let centerPoint = curve.get((NUM_OF_DOTS - 1) / NUM_OF_DOTS);

  let offset = {
    x: WIDTH / 2 - centerPoint.x,
    y: HEIGHT / 2 - centerPoint.y
  };


  ctx.strokeStyle = "#003300";
  drawCurve(curve, offset);


  if (DRAW_VECTORS) {
    ctx.strokeStyle = "#0000AA";
    let pts = curve.points;
    drawLine(pts[0], pts[1], offset);
    if (pts.length === 3) {
      drawLine(pts[1], pts[2], offset);
    } else {
      drawLine(pts[2], pts[3], offset);
    }
  }



  for (let i = 0; i < NUM_OF_DOTS; i++) {
    ctx.strokeStyle = `rgb(0, ${parseInt(200 * (i / NUM_OF_DOTS) + 55)},55)`;
    drawPoint(curve.get((i !== 0 ? i / NUM_OF_DOTS : 0)), offset, ctx);
  }

  ctx.fillStyle = "#FF0000";
  ctx.strokeStyle = `#FF0000`;
  drawPoint(curve.get(1), offset, ctx);



  let fileName = (new Date()).valueOf().toString(36) + (ii + "").padStart(3, "0");

  let out = fs.createWriteStream(__dirname + `/dataset/${fileName}.png`)
  let stream = cvs.createPNGStream()
  stream.pipe(out)
  out.on("finish", () => console.log("The PNG file has been created."))





  //recalculate to coordinates relative to T-0

  //first take coordinates as-is
  let coor = [];
  for (let i = 0; i < NUM_OF_DOTS + 1; i++) {
    let dot = curve.get((i !== 0 ? i / NUM_OF_DOTS : 0));
    coor.push({
      x: dot.x,
      y: dot.y
    });
  }


  //now apply the offset
  for (let i = 0; i < NUM_OF_DOTS + 1; i++) {
    coor[i].x += offset.x;
    coor[i].y += offset.y;
  }

  //now center up
  for (let i = 0; i < NUM_OF_DOTS + 1; i++) {
    coor[i].x -= WIDTH / 2;
    coor[i].y -= HEIGHT / 2;
  }


  //now mirror if needed
  if (isFlipped) {
    for (let i = 0; i < NUM_OF_DOTS + 1; i++) {
      coor[i].x = -coor[i].x;
    }
  }


  //now divide by weight-height
  for (let i = 0; i < NUM_OF_DOTS + 1; i++) {
    coor[i].x = coor[i].x / (WIDTH / 2);
    coor[i].y = coor[i].y / (HEIGHT / 2);
  }


  let data = "";
  data += fileName;

  for (let i = NUM_OF_DOTS + 1; i--;) {
    data += ", " + coor[i].x.toFixed(PRECISION).padStart(PRECISION + 3, " ");
    data += ", " + coor[i].y.toFixed(PRECISION).padStart(PRECISION + 3, " ");
  }

  data += "\n";

  fs.appendFileSync("./dataset/data.csv", data);
  console.log(ii);

}