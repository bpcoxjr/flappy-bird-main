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
