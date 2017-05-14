document.addEventListener("DOMContentLoaded", function() {

    var scalingMultiple = 0.75;

    var gameHeight = document.body.clientHeight * scalingMultiple;
    var gameWidth = document.body.clientWidth;

    // Create our 'main' state that will contain the game
    var mainState = {
        preload: function() {
            // This function will be executed at the beginning
            // That's where we load the images and sounds

            // Load the bird sprite
            // game.load.image('bird', 'assets/bird.png');

            // load plane spritesheet for animation
            game.load.spritesheet('plane', 'assets/planes.png', 87.35, 73.14, 21);

            game.load.image('background', 'assets/background.png');

            game.load.image('pipe', 'assets/pipe.png');

            // load the jump sound
            game.load.audio('jump', 'assets/jump.wav');
        },

        create: function() {
            // This function is called after the preload function
            // Here we set up the game, display sprites, etc.

            // Change the background color of the game to blue
            // game.stage.backgroundColor = '#71c5cf';

            // position background png at 0,0.
            // give dimensions you want background to cover, will tile if needed
            game.add.tileSprite(0, 0, gameWidth, gameHeight, 'background');

            // Set the physics system
            game.physics.startSystem(Phaser.Physics.ARCADE);

            // Display the plane at the position x=100 and y=245
            this.plane = game.add.sprite(100, 245, 'plane');

            var animationFPS = 15
            // plays all the frames, at 15 frame per second, looping.
            this.plane.animations.add('fly', [1,9,12], animationFPS, true);
            this.plane.play('fly');

            // Move the anchor for rotation to the left and downward
            this.plane.anchor.setTo(-0.2, 0.5);

            this.pipes = game.add.group();

            this.jumpSound = game.add.audio('jump');

            /*
            To actually add pipes in our game we need to call the
            addColumnOfPipes() function every 2 seconds. We can do
            this by adding a timer in the create() function.
            */
            this.timer = game.time.events.loop(2000, this.addColumnOfPipes, this);

            // add scoring to top left of window
            this.score = 0;
            this.labelScore = game.add.text(20, 20, "0",
                { font: "30px Arial", fill: "#000" });

            // Add physics to the plane
            // Needed for: movements, gravity, collisions, etc.
            game.physics.arcade.enable(this.plane);

            // Add gravity to the plane to make it fall
            this.plane.body.gravity.y = 1000;

            // Call the 'jump' function when the spacekey is hit
            var spaceKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
            spaceKey.onDown.add(this.jump, this);
        },

        update: function() {
            // This function is called 60 times per second
            // It contains the game's logic

            // The plane slowly rotates downward, up to a certain point
            if (this.plane.angle < 20) {
                this.plane.angle += 1;
            }

            /*
            call hitPipe() each time the plane collides
            with a pipe from the pipes group
            */
            game.physics.arcade.overlap(this.plane, this.pipes, this.hitPipe, null, this);

            // If the plane is out of the screen (too high or too low)
            // Call the 'restartGame' function
            if (this.plane.y < 0 || this.plane.y > gameHeight) {
                this.restartGame();
            }

            // forEachAlive lets us iterate through all active pipes in the game
            // if the pipe is offscreen, we kill it
            this.pipes.forEachAlive(function (pipe) {
                if (pipe.x + pipe.width < game.world.bounds.left) {
                    pipe.kill();
                }
            });
        },

        jump: function() {

            // plane can't jump if game is over
            if (this.plane.alive === false) return;

            // Create an animation on the plane to make his angle rotate up when jumping
            var animation = game.add.tween(this.plane);
            // Change the angle of the plane to -20° in 100 milliseconds
            animation.to({angle: -20}, 100);
            // And start the animation
            animation.start();

            // play the jump sound
            this.jumpSound.play();

            // Add a vertical velocity to the plane
            this.plane.body.velocity.y = -350;
        },

        restartGame: function() {
            // Start the 'main' state, which restarts the game
            game.state.start('main');
        },

        addOnePipe: function(x, y) {
            // Create a pipe at the position x and y
            var pipe = game.add.sprite(x, y, 'pipe');

            // Add the pipe to our previously created group
            this.pipes.add(pipe);

            // Enable physics on the pipe
            game.physics.arcade.enable(pipe);

            // Add velocity to the pipe to make it move left
            pipe.body.velocity.x = -200;

            // Automatically kill the pipe when it's no longer visible
            pipe.checkWorldBounds = true;
            pipe.outOfBoundsKill = true;
        },

        addColumnOfPipes: function() {

            // add 1 to score whenever new column of pipes is generated
            this.score += 1;
            this.labelScore.text = this.score;

            var blockHeight = this.cache.getImage('pipe').height;
            var numberOfPipes = Math.floor(gameHeight / blockHeight);


            var sizeOfGap = 4;

            // This will be the starting hole position/index
            // start {sizeOfGap} less than max blocks so hole wont overflow index range
            var startingHolePosition = Math.floor(Math.random() * (numberOfPipes - sizeOfGap)) + 1;

            var holeIndexes = this.generateHoleIndexes(startingHolePosition, sizeOfGap);

            /*
            Add # of pipes + 1 to account for any gap leftover if block height
            and screen height don't divide evenly.  But we make sure to do this addition
            after the gap has already been generated so we dont accidentally include this
            half brick in our gap creating calculations
            */
            for (var i = 0; i < numberOfPipes + 1; i++)
                // const indexIsNotPartOfGap = !holeIndexes.includes(i)
                if (!holeIndexes.includes(i)) {
                    this.addOnePipe(gameWidth, i * blockHeight);
                }
        },

        generateHoleIndexes: function(startingHolePosition, sizeOfGap) {
            var holeIndexes = [];
            for (var i = 0; i < sizeOfGap; i++) {
                holeIndexes = [...holeIndexes, startingHolePosition + i];
            }
            return holeIndexes;
        },

        hitPipe: function() {
            // If the plane has already hit a pipe, do nothing
            // It means the plane is already falling off the screen from losing
            if (this.plane.alive === false) return;

            // Set the alive property of the plane to false
            this.plane.alive = false;

            // Prevent new pipes from appearing
            game.time.events.remove(this.timer);

            // Go through all the pipes, and stop their movement
            this.pipes.forEach(function(p){
                p.body.velocity.x = 0;
            }, this);
        }
    };

    // Initialize Phaser, and create a 400px by 490px game
    var game = new Phaser.Game(gameWidth, gameHeight);

    // Add the 'mainState' and call it 'main'
    game.state.add('main', mainState);

    // Start the state to actually start the game
    game.state.start('main');
});