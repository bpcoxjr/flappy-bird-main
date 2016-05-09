var GroundGraphicsComponent = function(entity) {
    this.entity = entity;
};

GroundGraphicsComponent.prototype.draw = function(context){}

var width = canvas.width;
var height = canvas.height;

var image = document.getElementById("ground");

context.drawImage(image, 0, 0);
                
ground.tileW = groundImg.width;
ground.y = h-groundImg.height;
};

exports.GroundGraphicsComponent = GroundGraphicsComponent;