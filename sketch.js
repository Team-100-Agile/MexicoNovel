var player;
var blocks = [];
var score = 0;
var blockCount = 0;
var pokeBearText = "";
var blueBlockCount = 0;
var greenBlockCount = 0;
var maxBlockCount = 10;
var wallActive = false;

function setup() {
  const canvas = createCanvas(1300, 720);
  canvas.parent('game-container');
  player = new Player();
}

function draw() {
  background(222, 184, 135);

  if (blockCount < maxBlockCount && frameCount % 60 === 0) {
    var block;
    if (random() < 0.7) {
      block = new Block(1, color(0, 0, 255));
    } else {
      block = new SnakeLine(-1, color(0, 255, 0));
    }

    blocks.push(block);
    blockCount++;
  }

  player.update();
  player.display();

  for (var i = blocks.length - 1; i >= 0; i--) {
    blocks[i].update();
    blocks[i].display();

    if (player.hits(blocks[i])) {
       if (blocks[i] instanceof SnakeLine) {
        score = Math.max(score - 1, 0);
           greenBlockCount++;
        pokeBearText = "Run from the snek";
        blocks.splice(i, 1);
      } else {
        score += blocks[i].points;
        blueBlockCount++;
        blocks[i].x += blocks[i].speed2;
      }
    }

    if (blocks[i].offscreen()) {
      blocks.splice(i, 1);
    }
  }

  fill(0);
  textSize(20);
  text("Score: " + score, 10, 30);

  fill(255, 0, 0);
  textAlign(RIGHT);
  textSize(18);
  text(pokeBearText, width - 10, 30);

  if (blockCount >= maxBlockCount && blocks.length === 0) {
    gameOver();
  }

  if (wallActive) {
    fill(255, 255, 0);
    rect(player.x, player.y - 40, player.width, 40);
  }
}

function keyPressed() {
  if (keyCode === LEFT_ARROW) {
    player.moveLeft();
  } else if (keyCode === RIGHT_ARROW) {
    player.moveRight();
  } else if (keyCode === 32) {
    // Spacebar pressed
    createWall();
  }
}

function keyReleased() {
  if (keyCode === LEFT_ARROW || keyCode === RIGHT_ARROW) {
    player.stopMove();
  }
}

function createWall() {
  if (!wallActive) {
    wallActive = true;
    setTimeout(function() {
      wallActive = false;
    }, 1000);
    for (var i = 0; i < blocks.length; i++) {
      if (blocks[i] instanceof SnakeLine) {
        blocks[i].collected = true;
      }
    }
  }
}
function gameOver() {
  noLoop();
  fill(0);
  textSize(40);
  textAlign(CENTER, CENTER);
  text("Game Over", width / 2, height / 2);
  textSize(20);
  text("Final Score: " + score + "/10", width / 2, height / 2 + 40);
  text("Blue Blocks Collected: " + blueBlockCount, width / 2, height / 2 + 80);
  text("Green Blocks Collected: " + greenBlockCount, width / 2, height / 2 + 120);
  if (score >= 5) {
    fill(0, 255, 0);
    text("You Passed!", width / 2, height / 2 + 160);
  } else {
    fill(255, 0, 0);
    text("You Failed!", width / 2, height / 2 + 160);
  }
}

class Player {
  constructor() {
    this.width = 40;
    this.height = 40;
    this.x = width / 2 - this.width / 2;
    this.y = height - this.height;
    this.velocityX = 0;
    this.velocityY = 0;
    this.gravity = 0.6;
    this.lift = -15;

  }

  update() {
    this.velocityY += this.gravity;
    this.y += this.velocityY;
    this.y = constrain(this.y, 0, height - this.height);

    this.x += this.velocityX;
    this.x = constrain(this.x, 0, width - this.width);
  }

  display() {
     fill(255, 0, 0);

    // Draw the person
    fill(0);
    // Head
    ellipse(this.x + this.width/2, this.y + this.height/4, this.width/2);
    // Body
    rect(this.x + this.width/4, this.y + this.height/2, this.width/2, this.height/2);
    // Legs
    rect(this.x + this.width/4, this.y + this.height/2 + this.height/2, this.width/8, this.height/2);
    rect(this.x + this.width/2, this.y + this.height/2 + this.height/2, this.width/8, this.height/2);
  }

  jump() {
    this.velocityY += this.lift;
  }

  moveLeft() {
    this.velocityX = -5;
  }

  moveRight() {
    this.velocityX = 5;
  }

  stopMove() {
    this.velocityX = 0;
  }

  hits(block) {
    var playerLeft = this.x;
    var playerRight = this.x + this.width;
    var playerTop = this.y;
    var playerBottom = this.y + this.height;

    var blockLeft = block.x;
    var blockRight = block.x + block.width;
    var blockTop = block.y;
    var blockBottom = block.y + block.height;

    return (
      playerRight >= blockLeft &&
      playerLeft <= blockRight &&
      playerBottom >= blockTop &&
      playerTop <= blockBottom
    );
  }
}

class Block {
   constructor(points, color) {
    this.width = 30;
    this.height = 30;
    this.x = random(width - this.width);
    this.y = -this.height;
    this.speed = 5;
    this.speed2 = 95;
    this.points = points;
    this.color = color;
    this.collected = false;
  }

  update() {
    if (!this.collected) {
      this.y += this.speed;
    } else {
      this.x += this.speed2;
    }
  }

  display() {
    fill(this.color);
    rect(this.x, this.y, this.width, this.height);
  }

  offscreen() {
    return this.y > height || (this.collected && this.x > width);
  }
}

class SnakeLine extends Block {
  constructor(points, color) {
    super(points, color);
    this.segmentCount = 20;
    this.segmentLength = this.height / this.segmentCount;
    this.segmentYPositions = [];

    for (let i = 0; i < this.segmentCount; i++) {
      this.segmentYPositions.push(this.y + this.segmentLength * i);
    }

    this.slitherSpeed = 0.1;
    this.slitherOffset = 15;
    this.curvature = 20;
    this.lineThickness = 3; // Adjust the line thickness as desired
  }

  update() {
    if (!this.collected) {
      this.y += this.speed;
      this.segmentYPositions.unshift(this.y);
      this.segmentYPositions.pop();

      this.slither();
    } else {
      this.x += this.speed2;
    }
  }

  display() {
    push(); // Save the current drawing settings
    stroke(this.color); // Set the stroke color
    strokeWeight(this.lineThickness); // Set the line thickness
    noFill();

    beginShape();
    curveVertex(
      this.x + this.width / 2 + this.slitherOffset,
      this.segmentYPositions[0]
    ); // Starting point

    for (let i = 0; i < this.segmentCount; i++) {
      let curveX = this.x + this.width / 2 + this.slitherOffset;
      let curveY = this.segmentYPositions[i];
      let curvature = sin(frameCount * this.slitherSpeed + i / this.curvature) * this.curvature;
      curveVertex(curveX + curvature, curveY);
    }

    curveVertex(
      this.x + this.width / 2 + this.slitherOffset,
      this.segmentYPositions[this.segmentCount - 1]
    ); // Ending point
    endShape();

    pop(); // Restore the previous drawing settings
  }

  slither() {
    this.slitherOffset = sin(frameCount * this.slitherSpeed) * 10;
  }
}
