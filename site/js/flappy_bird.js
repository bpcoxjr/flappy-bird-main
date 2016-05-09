Math.randomRange = function(min,max) {
      return min + (Math.random() * (max-min));
};

Math.degreesToRadians = function(degrees) {
  return degrees * Math.PI / 180;
}

Math.radiansToDegrees = function(radians) {
  return radians * 180 / Math.PI;
}

var graphicsSystem = require('./systems/graphics');
var physicsSystem = require('./systems/physics');
var inputSystem = require('./systems/input');
var pipeSystem = require('./systems/pipe_system');

var bird = require('./entities/bird');
var settings = require('./settings');

var FlappyBird = function() {
  var that = this;

  this.gameOver = false;
  this.score = 0;
  this.paused = false;

  var flappy = new bird.Bird();


  this.entities = [flappy];
  this.graphics = new graphicsSystem.GraphicsSystem(this);
  this.physics = new physicsSystem.PhysicsSystem(this.entities);
  this.input = new inputSystem.InputSystem(this.entities);
  this.pipes = new pipeSystem.PipeSystem(this.entities);

  //Display game instructions when "How to Play" button is clicked
  $('#howtoplay').click(function(){
    $('#instructions').fadeIn(500);
  });

  //Close game instructions when "Got it!" button is clicked
  $('#gotit').click(function(){
    $('#instructions').fadeOut(500);
  });

  this.pipes.on('passed',function(score){
    that.score += 1;
    if(!that.gameOver) console.log(score);
  });

  this.graphics.on('collision',function(id, visible, hidden){
    if(!that.gameOver) {
      that.gameOver = true;
    }
    
    //function to display player's score on the overlay after game over
    var writeScore = function(){
      if (that.gameOver = true){
        return('Score: ' + that.score);
      }
    };

    var htmlScore = document.getElementById('score');
    htmlScore.innerHTML = writeScore();

    if(that.gameOver) {
      that.graphics.pause();
      that.physics.pause();
      that.pipes.pause();
      $("#game-over").fadeIn(100);
    }
  });

  var replaybutton = document.getElementById('replay');
  replaybutton.onclick = function(){
    location.reload(true);
  };

  this.input.on('visibilitychange',function(visible){
    if(visible) {
      that.graphics.paused = false;
      that.physics.run();
      that.pipes.run();
    } else {
      that.graphics.pause();
      that.physics.pause();
      that.pipes.pause();
    }
  });

  this.pipes.on('pipeadded',function(){ // whenever a pipe is added
    var entities = that.entities;
    entities = entities.filter(function(entity){ //
      return (entity.components.physics.position.x > -(that.graphics.canvas.width / that.graphics.canvas.height)) ? true : false;
    });

    // update all the references to our entities
    that.entities = that.graphics.entities = that.physics.entities = that.input.entities = that.pipes.entities = entities;
  });

  this.input.on('Paused', this.handlePaused.bind(this));

  this.input.on('Started', function(){
    that.entities[0].stopHovering();

    that.physics.justBird = false;
    that.pipes.run();

    setTimeout(function(){
      flappy.freakOutOver(0);
    },200);
  });

  //Listen for the 'f' key being pressed, do a backflip and add 1 to the score
  this.input.on('FlappyFreakout', function(){
    flappy.freakOut();
    if (that.score >= 1) {
    that.score += 1;
    }
  });
};

FlappyBird.prototype.handlePaused = function() {
    this.paused = !this.paused;
    if (this.paused){
      this.graphics.pause();
      this.physics.pause();
      this.pipes.pause();
    }
    else {
      this.graphics.run();
      this.physics.run();
      this.pipes.run();
    }
  };

FlappyBird.prototype.run = function() {
    this.graphics.run();
    this.input.run();
    this.physics.run();
};

exports.FlappyBird = FlappyBird;
