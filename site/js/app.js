(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var BirdGraphicsComponent = function(entity) {
    this.entity = entity;
};

BirdGraphicsComponent.prototype.draw = function(context) {
    //console.log("Drawing a bird");

    var position = this.entity.components.physics.position;

    //Save a snapshot of the current transformation state.
    context.save();

    //Move the canvas to the x & y cordinates defined in position variable.
    context.translate(position.x, position.y);

    //Start drawing a new path by calling the beginPath function.
    context.beginPath();

    //Use the context.arc function to draw an arc centered 0px from the left of the canvas
    //and 0px from the top of the canvas, w/ radius of 0.02, and covering an angle between 0
    //and 2 x pi (is a whole circle).
    //context.arc(0, 0, 0.02, 0, 2 * Math.PI);

    //Use the context.fill function to fill in the arc with whatever the current
    //context.fillStyle is (this defaults to black unless changed).
    //context.fill();

    var image = document.getElementById("bird");
    context.scale(-1, 1);
    context.rotate(Math.PI);
    context.drawImage(image, 0, 0, 0.1, 0.1);

    //Stop drawing.
    context.closePath();

    //Restore transformation state back to what it was last time context.save was called.
    context.restore();
};

exports.BirdGraphicsComponent = BirdGraphicsComponent;

},{}],2:[function(require,module,exports){
var PipeGraphicsComponent = function(entity) {
    this.entity = entity;
};

PipeGraphicsComponent.prototype.draw = function(context) {
    var position = this.entity.components.physics.position;
    var flip = this.entity.flip;

    //Save a snapshot of the current transformation state.
    context.save();

    //Move the canvas to the x & y cordinates defined in position variable.
    context.translate(position.x, position.y);


    if(flip) {
      context.scale(1,-1);
    }

    var image = document.getElementById("pipe");

    context.drawImage(image, 0, 0, 0.2, 1);

    context.restore();

    //Move the canvas to the x & y cordinates defined in position variable.
    //context.translate(position.x, position.y);

    //Start drawing a new path by calling the beginPath function.
    //context.beginPath();

    //use fillStyle to tell the computer what color the pipe should be
    //context.fillStyle = "green";

    //Use fillRect function to tell computer where to draw the pipe & what size
    //first number is how far from left, second is how far from top right,
    //third and fourth are width and height of pipe
    //context.fillRect(1, .5, .2, 1.5);
};

exports.PipeGraphicsComponent = PipeGraphicsComponent;

},{}],3:[function(require,module,exports){
var PhysicsComponent = function(entity) {
    this.entity = entity;

    this.position = {
        x: 0,
        y: 0
    };
    this.velocity = {
        x: 0,
        y: 0
    };
    this.acceleration = {
        x: 0,
        y: 0
    };
};

PhysicsComponent.prototype.update = function(delta) {
    this.velocity.x += this.acceleration.x * delta;
    this.velocity.y += this.acceleration.y * delta;

    this.position.x += this.velocity.x * delta;
    this.position.y += this.velocity.y * delta;
};

exports.PhysicsComponent = PhysicsComponent;
},{}],4:[function(require,module,exports){
var graphicsComponent = require("../components/graphics/bird");
var physicsComponent = require("../components/physics/physics");

var Bird = function() {
    var physics = new physicsComponent.PhysicsComponent(this);
    physics.position.y = 0.5;
    physics.acceleration.y = -0.75;

    var graphics = new graphicsComponent.BirdGraphicsComponent(this);

    this.components = {
    	physics: physics,
    	graphics: graphics

    };
};

exports.Bird = Bird;

},{"../components/graphics/bird":1,"../components/physics/physics":3}],5:[function(require,module,exports){
var graphicsComponent = require("../components/graphics/pipe");
var physicsComponent = require("../components/physics/physics");

var Pipe = function(position,flip) {
	this.flip = (typeof(flip) == 'undefined') ? false : flip;

	var physics = new physicsComponent.PhysicsComponent(this);
    physics.position.x = position.x;
		physics.position.y = position.y;
    physics.acceleration.x = -0.07;


	var graphics = new graphicsComponent.PipeGraphicsComponent(this);

	this.components = {
		physics: physics,
		graphics: graphics
	};
};

exports.Pipe = Pipe;

},{"../components/graphics/pipe":2,"../components/physics/physics":3}],6:[function(require,module,exports){
Math.randomRange = function(min,max) {
  	  return min + (Math.random() * (max-min));
};

var graphicsSystem = require('./systems/graphics');
var physicsSystem = require('./systems/physics');
var inputSystem = require('./systems/input');
var pipeSystem = require('./systems/pipe_system');

var bird = require('./entities/bird');



var FlappyBird = function() {

    this.entities = [new bird.Bird()];
    this.graphics = new graphicsSystem.GraphicsSystem(this.entities);
    this.physics = new physicsSystem.PhysicsSystem(this.entities);
    this.input = new inputSystem.InputSystem(this.entities);
    this.pipes = new pipeSystem.PipeSystem(this.entities);


};

FlappyBird.prototype.run = function() {
    this.graphics.run();
    this.physics.run();
    this.input.run();
    this.pipes.run();
};

exports.FlappyBird = FlappyBird;

},{"./entities/bird":4,"./systems/graphics":8,"./systems/input":9,"./systems/physics":10,"./systems/pipe_system":11}],7:[function(require,module,exports){
var flappyBird = require('./flappy_bird');

document.addEventListener('DOMContentLoaded', function() {
    var app = new flappyBird.FlappyBird();
    app.run();
});
},{"./flappy_bird":6}],8:[function(require,module,exports){
var GraphicsSystem = function(entities) {
    this.entities = entities;
    //Canvas is WHERE we draw to. This part fetches the canvas element.
    this.canvas = document.getElementById('main-canvas');
    this.offcanvas = document.getElementById('offcanvas');
    //Context is WHAT we draw to
    this.context = this.canvas.getContext('2d');

    this.showBoundingBox = false;

    var canvas = this.canvas,
    offcanvas = this.offcanvas;

    handleResize();
    window.onresize = function() {
        handleResize();
    }
    function handleResize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
};

GraphicsSystem.prototype.run = function() {
    //Run the graphics rendering loop. requestAnimationFrame runs ever 1/60th of a second.
    window.requestAnimationFrame(this.tick.bind(this));
};

GraphicsSystem.prototype.tick = function() {
    var that = this; // so we can reference "this" from nested namespaces

    var canvas = this.canvas,
    offcanvas = this.offcanvas,
    offcanvasContext = offcanvas.getContext('2d');

    // start fresh for our visual canvas and our hidden hit detection offcanvas
    this.clearContext(canvas);
    this.clearContext(offcanvas);

    var bird = this.entities[0],
    cut = { // the section of the stage we are cutting out. we only take the bounding box of the bird for both our subjects (the bird and the pipes)
      x:(canvas.width/2),
      y:(1-bird.components.physics.position.y)*canvas.height,
      width:120,
      height:120
    };

    // set the hidden canvas to be the same size as the area we cut out for bitmap detection
    offcanvas.width = cut.width;
    offcanvas.height = cut.height;

    // save our contexts before we apply custom transformation coordinates
    this.context.save();
    offcanvasContext.save();

    if(this.showBoundingBox) { // optionally show the bouding box we cut out for collision detection
      this.context.fillStyle = '#649fd9';
      this.context.fillRect(cut.x,cut.y,cut.width,cut.height);
    }

    // use our custom transformation and coordinates system (remember that getImageData ignores this)
    this.context.translate(this.canvas.width/2, this.canvas.height);
    this.context.scale(this.canvas.height, -this.canvas.height);

    var birdData = (function(bird,canvas){ // accepts the bird entity and a canvas to draw onto for collision detection
      if ((!'graphics' in bird.components) || (!'physics' in bird.components)) return false; // if the bird can't be rendered don't even try

      // set our collision detection canvas to the same size as the source canvas
      canvas.width = that.canvas.width;
      canvas.height = that.canvas.height;

      var context = canvas.getContext('2d'),
      position = bird.components.physics.position;

      context.save(); // save the context before applying custom transfomration coordinates

      // apply custom transformation coordinates
      context.translate(that.canvas.width/2, that.canvas.height);
      context.scale(that.canvas.height, -that.canvas.height);

      // draw the bird onto the hidden canvas
      bird.components.graphics.draw(context);

      // cut the image data (just the bouding box of the bird) out and colorize the pixels to solid green
      var imgData = context.getImageData(cut.x, cut.y, cut.width, cut.height);
      imgData = that.colorizeImageData(imgData,[0,255,0,255]);

      return imgData; // return the green birdy

    })(bird, document.createElement('canvas')); // pass in our bird entity and a temporary canvas to draw it onto

    var pipeData = (function(entities,canvas){ // accepts the pipe entities
      canvas.width = that.canvas.width;
      canvas.height = that.canvas.height;

      var context = canvas.getContext('2d');

      // apply custom transformation coordinates
      context.translate(that.canvas.width/2, that.canvas.height);
      context.scale(that.canvas.height, -that.canvas.height);

      for (var i=0; i<entities.length; i++) { // for each pipe
        var entity = entities[i];
        // draw the pipe the the hidden canvas
        if ('graphics' in entity.components) entity.components.graphics.draw(context);

      }

      // cut the image data (just the bouding box of the bird) out and colorize the pixels to solid red
      var imgData = context.getImageData(cut.x, cut.y, cut.width, cut.height);
      imgData = that.colorizeImageData(imgData,[255,0,0,255]);

      return imgData;

    })(this.entities.slice(1),document.createElement('canvas')); // pass in the pipe entities and a temporary canvas to them onto

    offcanvasContext.restore(); // back to the normal coordinates
    offcanvasContext.clearRect(0,0,offcanvas.width,offcanvas.height); // clear the canvas

    offcanvasContext.globalCompositeOperation = "multiply"; // set the blend mode to multiply so when pixels overlap they change color

    // add our bird and pipe graphics as undestructive layers on top of each other
    // REMEMBER: the bird is solid green and the pipe are solid red
    offcanvasContext.drawImage(that.dataURLtoImg(that.imgDataToDataURL(pipeData)),0,0);
    offcanvasContext.drawImage(that.dataURLtoImg(that.imgDataToDataURL(birdData)),0,0);

    var isCollision = (function(){ // does the bird hit the pipes?
      var imgData = offcanvasContext.getImageData(0,0,offcanvas.width,offcanvas.height);
      var data = imgData.data; // the pixel data of our hidden canvas
      for(var i = 0; i <= data.length - 4; i+=4) { // loop through each pixel (4 at a time because it takes four indexes to repesent one pixel (r,g,b,a))
        var isRed = (data[i] == 255 && !data[i+1] && !data[i+2]), // is the pixel solid red?
        isGreen = (!data[i] && data[i+1] == 255 && !data[i+2]), // is the pixel solid green?
        isNothing = (data[i] == 0 && data[i+1] == 0 && data[i+2] == 0 && data[i+3] == 0); // is the pixel nothing?

         // if it ain't red, and it ain't green, and it ain't nothing we got ourselves a hit!
         if(!isRed && !isGreen && !isNothing) return true;
      }
      return false; // go birdy, it's your birthday!
    })();

    if(isCollision) console.log('collision!');

    //Rendering of graphics goes here
    for (var i=0; i<this.entities.length; i++) {
        var entity = this.entities[i];
        if ('graphics' in entity.components) entity.components.graphics.draw(this.context);
    }

    this.context.restore();

    //Continue the graphics rendering loop.
    window.requestAnimationFrame(this.tick.bind(this));

};

GraphicsSystem.prototype.colorizeImageData = function(imgData,color) {
  var data = imgData.data;
  for(var i = 0; i <= data.length-4; i+=4) {
    if(!(!data[i] && !data[i+1] && !data[i+2] && !data[i+3])) {

      data[i] = color[0];
      data[i+1] = color[1];
      data[i+2] = color[2];
      data[i+3] = color[3];
    }
  }
  return imgData;
}

GraphicsSystem.prototype.imgDataToDataURL = function(imgData) {
  var c = document.createElement('canvas');

  c.width = imgData.width;
  c.height = imgData.height;

  c.getContext('2d').putImageData(imgData,0,0);
  return c.toDataURL();
}

GraphicsSystem.prototype.dataURLtoImg = function(dataURL) {
    var img = new Image();

    img.src = dataURL;
    return img;
}

GraphicsSystem.prototype.clearContext = function(canvas,x,y,width,height) {
  x = (typeof(x) == 'undefined') ? 0 : x;
  y = (typeof(y) == 'undefined') ? 0 : y;
  width = (typeof(width) == 'undefined') ? canvas.width : width;
  height = (typeof(height) == 'undefined') ? canvas.height : height;
  canvas.getContext('2d').clearRect(x,y,width,height);
}

exports.GraphicsSystem = GraphicsSystem;

},{}],9:[function(require,module,exports){
var InputSystem = function(entities) {
    this.entities = entities;

    // Canvas is where we get input from
    this.canvas = document.getElementById('main-canvas');
};

InputSystem.prototype.run = function() {
    document.body.addEventListener('click', this.onClick.bind(this));
    document.body.addEventListener('keydown', this.onkeydown.bind(this));
};

InputSystem.prototype.onClick = function() {
    var bird = this.entities[0];
    bird.components.physics.velocity.y = 0.4;
};

InputSystem.prototype.onkeydown = function(e) {

	if (e.keyCode ==32) {
		var bird = this.entities[0];
		bird.components.physics.velocity.y = 0.4;
	}
};

exports.InputSystem = InputSystem;

},{}],10:[function(require,module,exports){


var PhysicsSystem = function(entities) {
    this.entities = entities;
    //this.collisionSystem = new collisionSystem.CollisionSystem(entities);
};

PhysicsSystem.prototype.run = function() {
    // Run the update loop
    window.setInterval(this.tick.bind(this), 1000 /60);
};

PhysicsSystem.prototype.tick = function() {
    for (var i=0; i<this.entities.length; i++) {
        var entity = this.entities[i];
        if (!'physics' in entity.components) {
            continue;
        }

        entity.components.physics.update(1/60);
    }
    //this.collisionSystem.tick();
};

exports.PhysicsSystem = PhysicsSystem;

},{}],11:[function(require,module,exports){
var pipe = require('../entities/pipe');

var PipeSystem = function(entities) {
  this.entities = entities;
  this.canvas = document.getElementById('main-canvas');
  this.interval = null;
}

PipeSystem.prototype.run = function() {
  this.tick();
  this.interval = window.setInterval(this.tick.bind(this),2000);
};

PipeSystem.prototype.pause = function() {
  if(this.interval != null) {
    window.clearInterval(this.interval);
    this.interval = null;
  }
}

PipeSystem.prototype.tick = function() {

  var position = {
    x:1.5,
    y:Math.randomRange(0.25,0.65)
  };

  this.entities.push(new pipe.Pipe(position, true));
            
  position.y += .25;                                                              

  this.entities.push(new pipe.Pipe(position, false));
  
};

exports.PipeSystem = PipeSystem;

},{"../entities/pipe":5}]},{},[7]);
