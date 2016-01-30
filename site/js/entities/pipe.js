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
