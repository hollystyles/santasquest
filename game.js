
function initGame(){
	var canvas = document.getElementById('canvas1');	
	resizeCanvas(canvas);
	
	var context = canvas.getContext('2d');
	var game = new Game(context);
	
	bindKeys(game);
	bindTouches(game);
	bindEvent(window, 'resize', function(e){
		resizeCanvas(canvas);
		game.rescale();
	});
	
	setUpAssets(game);
	game.run();
}

function Game(context){
	
	var game = this;
	
	this.ctx = context;
	this.timer = null;
	this.loopInterval = 80;
	this.assets = [];
	this.events = [];
	this.paused = false;
	this.started = false;
	this.controls = {
		pause:80, left:37, up:38, right:39, down:40
	};
	
	this.run = function(){
		game.timer = setInterval(game.loop, game.loopInterval);
	};
	
	this.loop = function(){
		if(!game.paused){
			update(game)
			draw(game);
		}
	};
	
	this.rescale = function(){
		var initialState = this.paused;
		this.paused = true;
		for(var i = 0; i < game.assets.length; i++){
			game.assets[i].rescale(game);
		}
		draw(this);
		this.paused = initialState;
	};
	
	this.fps = function(){
		return (Math.floor(1000 / game.loopInterval));
	};
	
	function update(game){
		for(var i = 0; i < game.assets.length; i++){
			game.assets[i].update(game);
		}
	}
	
	function draw(game){
		game.ctx.clearRect(0, 0, game.ctx.canvas.width, game.ctx.canvas.height);
		for(var i = 0; i < game.assets.length; i++){
			game.assets[i].draw(game);
		}
	}
}

function setUpAssets(game){
	game.assets.push(new Sprite(game));
	game.assets.push(new Obstacles(game));
	game.assets.push(new Targets(game));
	game.assets.push(new Stats(game));
	game.assets.push(new GameEndBoard(game));
	//game.assets.push(new InfoScreen(game));
}

function Sprite(game){
		
	init(this, game);
	
	this.update = function(game){
	
		var targets = game.assets[2];
		var stats = game.assets[3];
		
		if(game.started){
			this.y += this.vy;
			this.vy++;
			
			this.x += this.vx;
			if(this.vx < 0){
				this.vx++;
			} else if(this.vx > 0){
				this.vx--;
			}
			
			if(this.y >= (game.ctx.canvas.height - this.h)){
				this.vy = 0;
				this.y = (game.ctx.canvas.height - this.h);
			} else if ( this.y < (0 - this.h)){
				this.vy = 0;
				this.y = 0 - this.h;
			}
			
			if(this.x < (0 - this.w)){
				this.vx = 0;
				this.x = 0 - this.w;
			} else if (this.x > (game.ctx.canvas.width)){
				this.vx = 0;
				this.x = game.ctx.canvas.width;
			}
			
			for(var i = this.gifts.length - 1; i >= 0; i--){
				var gift = this.gifts[i];
				
				if(!gift.scored && gift.y > (game.ctx.canvas.height - targets.h)){
					for(var j = 0; j < targets.targetArray.length; j++){
						var target = targets.targetArray[j];
						if(target.x < gift.x){
							var midpoint = (target.x + (targets.w / 2));
							if(gift.x < midpoint && (gift.x + gift.w) > midpoint){
								stats.score++;
								this.sound.play();
							}
						}
					}
					gift.scored = true;
				}
				
				if(gift.y >= game.ctx.canvas.height){
					this.gifts.splice(i, 1);
				} else {
					gift.x += gift.vx;
					gift.y += gift.vy;
					gift.vy++;
				}
			}
		}
	};
	
	this.draw = function(game){
		game.ctx.drawImage(this.imageFrames[this.frameIdx], this.x, this.y, this.w, this.h);
	
		for(var i = 0; i < this.gifts.length; i++){
			var gift = this.gifts[i];
			game.ctx.drawImage(this.imageFrames[1], gift.x, gift.y, gift.w, gift.h);
		}
	};
	
	this.receiveKey = function(keyCode, game){
		if(!this.dead){
			if(keyCode == game.controls.up){
				game.started = true;
				this.vy = -10;
			} else if (keyCode == game.controls.left){
				game.started = true;
				this.vx = -10;
			} else if (keyCode == game.controls.right){
				game.started = true;
				this.vx = 10;
			} else if (game.started && keyCode == game.controls.down){
				var gift = new Gift();
				gift.x = this.x;
				gift.y = this.y;
				gift.w = game.ctx.canvas.width * gift.ws;
				gift.h = game.ctx.canvas.height * gift.hs;
				this.gifts.push(gift);
			}
		} else {
			if(keyCode == game.controls.up){
				reset(this, game);				
			}
		}
	};
	
	this.rescale = function(game){
		scale(this, game);
	};
	
	this.hit = function(game){
		if(!this.dead){
			this.frameIdx = 2;
			switchAspect(this);
			this.dead = true;
			game.started = false;
		}
	};
	
	function reset(sprite, game){
		game.assets[3].score = 0;
		sprite.dead = false;
		sprite.frameIdx = 0;
		switchAspect(sprite);
		placeCentre(sprite, game);
	}
	
	function switchAspect(sprite){
		var temp = sprite.w;
		sprite.w = sprite.h;
		sprite.h = temp;
		temp = sprite.ws;
		sprite.ws = sprite.hs;
		sprite.hs = temp;
	}
	
	function init(sprite, game){		
		
		sprite.dead = false;
		sprite.ws = 0.1;
		sprite.hs = 0.06;
		sprite.gifts = [];
		sprite.imageFrames = [];
		sprite.imageNames = ["santa2.png", "gift.png", "santa3.png"];		
		scale(sprite, game);
		placeCentre(sprite, game);
		sprite.frameIdx = 0;
		sprite.vy = 0;
		sprite.vx = 0;
		
		for(var i = 0; i < sprite.imageNames.length; i++){	
			var img = new Image();			
			img.src = sprite.imageNames[i];
			sprite.imageFrames.push(img);
		}
		
		sprite.sound = document.createElement("audio");
		sprite.sound.type = "audio/wav";
		sprite.sound.src = "ding.wav";
		document.body.appendChild(sprite.sound);
	}
	
	function placeCentre(sprite, game){
		
		sprite.x = (game.ctx.canvas.width / 2) - (sprite.w / 2);	
		sprite.y = (game.ctx.canvas.height / 2) - (sprite.h / 2);
	}
	
	function scale(sprite, game){
		sprite.w = game.ctx.canvas.width * sprite.ws;
		sprite.h = game.ctx.canvas.height * sprite.hs;	
		
		for(var i = 0; i < sprite.gifts.length; i++){
			var gift = sprite.gifts[i];
			gift.w = game.ctx.canvas.width * gift.ws;
			gift.h = game.ctx.canvas.height * gift.hs;
		}
	}	
	
	function Gift(){
		this.w = 24;
		this.h = 24;
		this.x = 0;
		this.y = 0;
		this.vx = -5;
		this.vy = 0;
		this.ws = 0.025;
		this.hs = 0.025;
		this.scored = false;
	}
}

function Targets(game){
	
	var NUM_TARGETS = 5;
	var TARGET_INTERVAL = 150;
	
	init(this, game);
	
	this.update = function(game){
		
		if(this.vx != 0 && !game.started){
			reset(this, game);
			return;
		}
		
		var sprite = game.assets[0];
		
		for(var i = 0; i < NUM_TARGETS; i++){
			var target = this.targetArray[i];
			
			if(!sprite.dead && sprite.y >= this.y){
				if(collisionDetected(sprite.x, sprite.y, sprite.w, sprite.h, target.x, this.y, this.w, this.h)){
					sprite.hit(game);
					this.vx = 0;
				}
			}
			
			target.x += this.vx;
			
			if(target.x <= (this.w * -1)){
				target.x = (this.vx + this.w + TARGET_INTERVAL) * NUM_TARGETS;
			}
		}
	};
	
	this.draw = function(game){
		for(var i = 0; i < NUM_TARGETS; i++){
			var target = this.targetArray[i];
			game.ctx.drawImage(this.targetImage, target.x, this.y, this.w, this.h);
		}
	};
	
	this.rescale = function(game){
		scale(this, game);
	};
	
	this.receiveKey = function(keyCode, game){
		if(this.vx == 0 && keyCode == game.controls.up){
			this.vx = -5;
		}
	};
	
	function init(targets, game){
		
		targets.targetArray = [];
		targets.targetImage = new Image();
		targets.targetImage.src = "chim.png";
		targets.y = 0;
		targets.w = 200;
		targets.h = 600;		
		targets.ws = 0.1;
		targets.hs = 0.2;
		targets.vx = -5;
		
		scale(targets, game);
		
		for(var i = 0; i < NUM_TARGETS; i++){
			var target = new Target();
			target.x = game.ctx.canvas.width + (i * (targets.w + TARGET_INTERVAL));
			targets.targetArray.push(target);
		}
		
	}
	
	function scale(targets, game){
		targets.w = game.ctx.canvas.width * targets.ws;
		targets.h = game.ctx.canvas.height * targets.hs;	
		targets.y = game.ctx.canvas.height - targets.h;
	}
	
	function reset(targets, game){
		targets.vx = 0;
		for(var i = 0; i < NUM_TARGETS; i++){
			var target = targets[i];
			target.x = game.ctx.canvas.width + (i * (targets.w + TARGET_INTERVAL));
		}
	}
	
	function Target(){
		this.x = 0;
	}
}

function Obstacles(game) {	
		
	var NUM_OBSTACLES = 6;
	
	init(this, game);

	this.update = function(game){					
			
		var sprite = game.assets[0];
		
		for(var i = 0; i < NUM_OBSTACLES; i++){
		
			var obstacle = this.obstacleArray[i];
			
			if(game.started){	
				if(!sprite.dead){
					if(collisionDetected(sprite.x, sprite.y, sprite.w, sprite.h, obstacle.x, obstacle.y, this.w, this.h)){
						sprite.hit(game);
					}
				}
			}
							
			obstacle.y += obstacle.vy;
			obstacle.x -= obstacle.vx;
			
			if(obstacle.y > game.ctx.canvas.height || obstacle.x < -24){
				randomizeObstacle(obstacle, game.ctx);
			}
		}
	};
		
	this.draw = function(game){
		for(var i = 0; i < NUM_OBSTACLES; i++){
			var obstacle = this.obstacleArray[i];
			game.ctx.drawImage(this.obstacleImage, obstacle.x, obstacle.y, this.w, this.h);
		}
	};	
	
	this.rescale = function(game){
		scale(this, game);
	};
	
	this.receiveKey = function(keyCode, game){
		 
	};
	
	function init(obstacles, game){
		obstacles.obstacleArray = [];
		obstacles.obstacleImage = new Image();
		obstacles.obstacleImage.src = "flake.png";
		obstacles.w = 24;
		obstacles.h = 24;
		obstacles.ws = 0.05;
		obstacles.hs = 0.05;
		
		for(var i = 0; i < NUM_OBSTACLES; i++){
			var obstacle = new Obstacle();
			randomizeObstacle(obstacle, game.ctx);
			obstacles.obstacleArray.push(obstacle);				
		}	
		
		scale(obstacles, game);
	}
	
	function scale(obstacles, game){
		obstacles.w = game.ctx.canvas.width * obstacles.ws;
		obstacles.h = game.ctx.canvas.height * obstacles.hs;		
	}
	
	function randomizeObstacle(obstacle, ctx){
		var half = (ctx.canvas.width / 2);
		var max = ctx.canvas.width + half;
		var min = half + 20;
		obstacle.x = Math.floor((Math.random() * (max-min+1))+min);
		obstacle.y = Math.floor((Math.random() * (240-25))+24) * -1;
		obstacle.vy = Math.floor((Math.random() * 6)+1);
	}
	
	function Obstacle(){	
		this.x = 0;				
		this.y = -24;	
		this.vy = 0;
		this.vx = 5;
	}
}

function Stats(game){
	
	this.score = 0;
	this.x = 0;
	this.y = 10;
	
	this.update = function(game){
	
	};
	
	this.draw = function(game){
		game.ctx.font = '36px arial';
		game.ctx.strokeStyle = '#000';
		game.ctx.fillStyle = '#FFF';
		game.ctx.textBaseline = "top";
		var text = this.score;
		var width = game.ctx.measureText(text).width;
		this.x = (game.ctx.canvas.width / 2) - Math.floor(width / 2);
		game.ctx.fillText(text, this.x, this.y);	
		game.ctx.strokeText(text, this.x, this.y);	
	};
	
	this.receiveKey = function(game){
	
	};
	
	this.rescale = function(game){
	
	};
}

function InfoScreen(game){
	
	var startText = "GO";
	
	this.text = startText;
	this.visible = false;
	this.countdown = -1;
	
	this.update = function(game){
		if (this.countdown > 0){
			this.countdown--;
		} else if (this.countdown == 0){
			this.countdown = -1;
			this.visible = false;
		}
	};
	
	this.draw = function(game){
		if(this.visible){
			game.ctx.font = '36px arial';			
			game.ctx.strokeStyle = '#000';			
			game.ctx.fillStyle = 'red';				
			var width = game.ctx.measureText(this.text).width;
			this.x = (game.ctx.canvas.width / 2) - Math.floor(width / 2);
			game.ctx.fillText(this.text, this.x, this.y);
			game.ctx.strokeText(this.text, this.x, this.y);
		}
	};
	
	this.receiveKey = function(keyCode, game){
	
	};
	
	this.rescale = function(game){
	
	};
	
	this.flash = function(msg, duration){
		this.countdown = (duration * game.fps());
		this.text = msg;
		this.visible = true;
	};
	
}

function GameEndBoard(game){
	
	init(this, game);
	
	this.update = function(game){
	
	};
	
	this.draw = function(game){
		
		var sprite = game.assets[0];
		
		if(sprite.dead){
			game.ctx.rect(this.x, this.y, this.w, this.h);
			game.ctx.fillStyle = '#CCC';
			game.ctx.fill();
			
			game.ctx.font = '36px arial';
			game.ctx.strokeStyle = '#000';
			game.ctx.fillStyle = '#F00';
			game.ctx.textBaseline = "top";
			var text = "Game Over";
			var width = game.ctx.measureText(text).width;
			
			game.ctx.fillText(text, this.x + ((this.w - width) / 2), this.y + 10);
			game.ctx.strokeText(text, this.x + ((this.w - width) / 2), this.y + 10);	
		}
	};
	
	this.receiveKey = function(game){
		
	};
	
	this.rescale = function(game){
		scale(this, game);
	};
	
	function init(board, game){
		scale(board, game);
	}
	
	function scale(board, game){	
		board.ws = 0.7;
		board.hs = 0.7;
		board.w = game.ctx.canvas.width * board.ws;
		board.h = game.ctx.canvas.height * board.hs;
		board.x = ((game.ctx.canvas.width - board.w) / 2);
		board.y = ((game.ctx.canvas.height - board.h) / 2);
	}
}

function resizeCanvas(gameCanvas) {
    var gameArea = document.getElementById('gameArea');
    var widthToHeight = 4 / 3;
    var newWidth = window.innerWidth;
    var newHeight = window.innerHeight;
    var newWidthToHeight = newWidth / newHeight;
    
    if (newWidthToHeight > widthToHeight) {
        newWidth = newHeight * widthToHeight;
        gameArea.style.height = newHeight + 'px';
        gameArea.style.width = newWidth + 'px';
    } else {
        newHeight = newWidth / widthToHeight;
        gameArea.style.width = newWidth + 'px';
        gameArea.style.height = newHeight + 'px';
    }
    
    gameArea.style.marginTop = (-newHeight / 2) + 'px';
    gameArea.style.marginLeft = (-newWidth / 2) + 'px';
    
    gameCanvas.width = newWidth;
    gameCanvas.height = newHeight;
	gameCanvas.style.backgroundSize = newWidth + 'px';
}

function bindKeys(game){
	bindEvent(window, 'keydown', function(e){
	
		if(e.keyCode == game.controls.pause){ 	
			game.paused = !game.paused;	
		}
		
		for(var i = 0; i < game.assets.length; i++){
			game.assets[i].receiveKey(e.keyCode, game);
		}
	});
}

function bindTouches(game){
	this.minSwipe = 20;
	this.startX = 0;
	this.startY = 0;
	this.direction = 0;

	bindEvent(window, 'touchstart', function(e){
		var touchobj = e.changedTouches[0];
		this.startX = parseInt(touchobj.clientX);
		this.startY = parseInt(touchobj.clientY);
		this.direction = game.controls.up;
	});
	
	bindEvent(window, 'touchmove', function(e){
		var touchobj = e.changedTouches[0];
		var currentX = touchobj.clientX;
		var currentY = touchobj.clientY;
		
		if(currentX > this.startX && (currentX - this.startX) > this.minSwipe){
			this.direction = game.controls.right;
		} else if (currentX < this.startX && (this.startX - currentX > this.minSwipe)){
			this.direction = game.controls.left;
		} else if(currentY > this.startY && (currentY - this.startY) > this.minSwipe){
			this.direction = game.controls.down;
		} else {
			this.direction = game.controls.up;
		}	
		e.preventDefault();
	});

	bindEvent(window, 'touchend', function(e){
		var keyCode = this.direction;
		
		for(var i = 0; i < game.assets.length; i++){
			game.assets[i].receiveKey(keyCode, game);
		}
	});
}
	
function bindEvent(e, typ, handler) {
   if(e.addEventListener) {							//Not IE browser
      e.addEventListener(typ, handler, false);		//Listen for keyDown events.
   }else{
      e.attachEvent('on'+typ, handler);				//Must be IE browser.
   }
}

function collisionDetected(x1, y1, w1, h1, x2, y2, w2, h2){

	return !(
		((y1 + h1) < (y2)) || 
		(y1 > (y2 + h2)) || 
		((x1 + w1) < (x2)) || 
		(x1 > (x2 + w2))
	);
}