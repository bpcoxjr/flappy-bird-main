var GroundGraphics = require("../components/graphics/ground");
var physicsComponent = require("../components/physics/physics");

var Ground = function() {
    var physics = new physicsComponent.PhysicsComponent(this);
    physics.position.y = 0;
    physics.acceleration.y = -0.75;

    var graphics = new graphicsComponent.GroundGraphicsComponent(this);
    this.components = {
    	physics: physics,
    	graphics: graphics
    };
};

exports.Ground = Ground;
