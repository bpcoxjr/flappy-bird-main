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
