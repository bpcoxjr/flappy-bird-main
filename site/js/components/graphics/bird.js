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
