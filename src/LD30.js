var screenHeight = 560;
var screenWidth = 960;

var LD30 = function() {

    /**
     * Start stuff when the page loads.
     */
    this.onload = function() {
        if ( !me.video.init( 'canvas', screenWidth, screenHeight ) ) {
            alert ("Yer browser be not workin");
        }

        me.audio.init ("m4a,ogg" );

        // TODO: Delete thie garbage
        if (true) {
            window.onReady(function () {
                me.plugin.register.defer(this, debugPanel, "debug", me.input.KEY.V);
                me.debug.renderHitBox = true;
            });
        }
        // Sync up post loading stuff.
        me.loader.onload = this.loaded.bind( this );

        me.loader.preload( GameResources );

        me.state.change( me.state.LOADING );
        return;
    };

    /**
     * Do stuff post-resource-load.
     */
    this.loaded = function() {

        me.state.set( me.state.INTRO, new RadmarsScreen() );
        me.state.set( me.state.PLAY, new PlayScreen() );

        me.state.change( me.state.INTRO );

        me.pool.register( "player", Player );
        me.pool.register( "baddie", Baddie );
        me.pool.register( "pickup", Pickup );
        me.pool.register( "underworld", Underworld );
        me.pool.register( "levelchanger", LevelChanger );

    };
};

var LevelChanger = me.ObjectEntity.extend({
    init: function(x, y, settings) {
        // TODO: Just bake image or attach to obj?
        this.toLevel = settings.toLevel;
        this.parent( x, y, settings );
        this.gravity = 0;
        this.collidable = true;
    },
    update: function(dt) {
        // TODO: Just bake image or attach to obj?
        this.parent(dt);
        this.updateMovement();
        var col = me.game.world.collide(this);
        if(col && col.obj == me.state.current().player  ) {
            me.state.current().goToLevel(this.toLevel);
        }
    }
});


var Underworld = me.ObjectEntity.extend({
    init: function(x, y, settings) {
        this.parent( x, y, settings );
        this.gravity = 0;
        this.collidable = true;
    },
    update: function(dt) {
        this.parent(dt);
        this.updateMovement();
        var col = me.game.world.collide(this);
        if(col && col.obj == me.state.current().player ) {
            me.state.current().toUnderworld();
            me.state.current().player.toUnderworld();
        }
    }
});


var Baddie = me.ObjectEntity.extend({
    init: function(x, y, settings) {
        settings.image = 'robut';
        settings.spritewidth = 80;
        settings.spriteheight = 80;
        this.parent( x, y, settings );
        this.alwaysUpdate = true;
        this.baddie = true;
        this.setVelocity( 3, 15 );
        this.setFriction( 0.4, 0 );
        this.direction = 1;
        this.collidable = true;
        this.overworld = settings.overworld ? true : false;

        // Hack...
        me.state.current().baddies.push(this);

        this.renderable.animationspeed = 70;

        console.log("baddie added ");
    },

    update: function(dt) {
        this.parent(dt);
        this.updateMovement();
        var col = me.game.world.collide(this);
        if(col && col.obj.bullet && !this.overworld ) {
            //this.renderable.flicker(2000);
            //this.renderable.animationpause = true;

            col.obj.die();
            me.state.current().baddies.remove(this);

            //TODO: spawn death particle?
            this.collidable = false;
            me.game.world.removeChild(this);

            var p = new Pickup(this.pos.x, this.pos.y-50, {});
            me.game.world.addChild(p);

            var b = new Baddie(this.pos.x, this.pos.y, { overworld:1, width:80, height:80});
            b.z = 300;
            me.game.world.addChild(b);
            me.game.world.sort();

            me.state.current().updateLayerVisibility(me.state.current().overworld);

        }
        return true;
    }

});

var Player = me.ObjectEntity.extend({
    init: function(x, y, settings) {
        settings.image        = settings.image        || 'player';
        settings.spritewidth =  40*3;
        settings.spriteheight = 48*3;
        settings.height = 40*3;
        settings.width = 48*3;
        this.parent( x, y, settings );
        this.alwaysUpdate = true;
        this.player = true;
        this.hitTimer = 0;
        this.hitVelX = 0;
        this.image =  me.loader.getImage('player2');
        this.necroMode = true;


        var shape = this.getShape();
        shape.pos.x = 44;
        shape.pos.y = 0;
        shape.resize(70, 110);
        me.state.current().player = this;

        this.pickups = 0;
        this.collisionTimer = 0;
        this.doubleJumped = false;

        this.animationSuffix = "";

        this.setVelocity( 5, 15 );
        this.setFriction( 0.4, 0 );
        this.direction = 1;

        this.followPos = new me.Vector2d(
            this.pos.x + this.centerOffsetX,
            this.pos.y + this.centerOffsetY
        );

        me.game.viewport.follow( this.pos, me.game.viewport.AXIS.BOTH );
        me.game.viewport.setDeadzone( me.game.viewport.width / 10, 1 );

        this.renderable.animationspeed = 150;
        this.renderable.addAnimation( "idle", [ 0, 1, 2 ] );
        this.renderable.addAnimation( "double_jump", [ 10 , 9  ] );
        this.renderable.addAnimation( "jump", [ 9 ] );
        this.renderable.addAnimation( "jump_extra", [ 9 ] );
        this.renderable.addAnimation( "fall", [ 10 ] );
        this.renderable.addAnimation( "walk", [ 4, 5, 6, 7 ] );
        this.renderable.addAnimation( "shoot", [ 3 ] );
        this.renderable.addAnimation( "shoot_jump", [ 8 ] );
        this.renderable.addAnimation( "hit", [ 11 , 11, 11] );

        var offset = 12;
        this.renderable.addAnimation( "idle_normal", [ 0 + offset, 1 + offset, 2 + offset ] );
        this.renderable.addAnimation( "jump_normal", [ 9 + offset ] );
        this.renderable.addAnimation( "double_jump_normal", [ 10 + offset, 9 + offset ] );
        this.renderable.addAnimation( "jump_extra_normal", [ 9 + offset ] );
        this.renderable.addAnimation( "fall_normal", [ 10 + offset ] );
        this.renderable.addAnimation( "walk_normal", [ 4 + offset, 5 + offset, 6 + offset, 7 + offset ] );
        this.renderable.addAnimation( "shoot_normal", [ 3 + offset ] );
        this.renderable.addAnimation( "shoot_jump_normal", [ 8 + offset ] );
        this.renderable.addAnimation( "hit_normal", [ 11 + offset , 11 + offset, 11 + offset] );

        this.renderable.setCurrentAnimation("idle" + this.animationSuffix);

        me.input.bindKey(me.input.KEY.LEFT,  "left");
        me.input.bindKey(me.input.KEY.RIGHT, "right");
        me.input.bindKey(me.input.KEY.UP,   "up", true);
        me.input.bindKey(me.input.KEY.W,    "up", true);

        me.input.bindKey(me.input.KEY.A,    "left");
        me.input.bindKey(me.input.KEY.D,    "right");
    },

    toUnderworld: function(){

        this.necroMode = false;
        if(this.pickups > 0){
            for( var i=0; i<this.pickups; i++){
                var b = new EnterPortalParticle(this.pos.x, this.pos.y, {});
                me.game.world.addChild(b);
            }
            me.game.world.sort();
            this.pickups = 0;
        }
        this.animationSuffix = "_normal";
    },

    shoot: function(){
        if(this.necroMode){
            var b = new Bullet(this.pos.x, this.pos.y, { direction: this.direction });
            me.game.world.addChild(b);
            me.game.world.sort();
        }
    },

    update: function(dt) {
        var self = this;
        this.parent(dt);


        this.followPos.x = this.pos.x + this.centerOffsetX;
        this.followPos.y = this.pos.y + this.centerOffsetY;

        if(this.collisionTimer > 0){
            this.collisionTimer-=dt;
        }

        if(this.hitTimer > 0){
            this.hitTimer-=dt;
            this.vel.x = this.hitVelX;
            this.updateMovement();
            return true;
        }

        // TODO acceleration
        if (me.input.isKeyPressed('left'))  {
            this.vel.x = -55.5;
            this.flipX(true);
            this.direction = -1;
            if( ! this.renderable.isCurrentAnimation("walk" + this.animationSuffix) ){
                this.renderable.setCurrentAnimation("walk" + this.animationSuffix, function() {
                    self.renderable.setCurrentAnimation("idle" + self.animationSuffix);
                })
            }
        } else if (me.input.isKeyPressed('right')) {
            this.vel.x = 25.5;
            this.flipX(false);
            this.direction = 1;
            if( ! this.renderable.isCurrentAnimation("walk" + this.animationSuffix) ){
                this.renderable.setCurrentAnimation("walk" + this.animationSuffix, function() {
                    self.renderable.setCurrentAnimation("idle" + self.animationSuffix);
                })
            }
        }

        if(this.falling && this.vel.y > 0){
            this.renderable.setCurrentAnimation("fall" + this.animationSuffix);
        }

        if(!this.falling && this.vel.y == 0){
            this.doubleJumped = false;
            if(!me.input.isKeyPressed('right') && !me.input.isKeyPressed('left') && ! this.renderable.isCurrentAnimation("idle" + this.animationSuffix)){
                this.renderable.setCurrentAnimation("idle" + this.animationSuffix);
            }
        }

        if( me.input.isKeyPressed('up')) {
            if(!this.jumping && !this.falling){
                this.vel.y = -29;
                this.jumping = true;
                self.renderable.setCurrentAnimation("jump" + this.animationSuffix);
            }
            else if((this.jumping || this.falling) && !this.doubleJumped){
                this.doubleJumped = true;
                this.vel.y = -29;
                self.renderable.setCurrentAnimation("double_jump" + this.animationSuffix);
            }
        }

        var col = me.game.world.collide(this);
        //console.log(col);

        if(this.hitTimer <= 0 && this.collisionTimer <=0 && col && col.obj.baddie ) {

            //TODO: change character to normal texture here!
            //TODO: if pickups <= 0, die!
            this.necroMode = false;
            if(this.pickups > 0){
                for( var i=0; i<this.pickups; i++){
                    var b = new OnHitPickup(this.pos.x, this.pos.y, {});
                    me.game.world.addChild(b);
                }
                me.game.world.sort();
                this.pickups = 0;
            }
            this.animationSuffix = "_normal";

            this.hitTimer = 250;
            this.collisionTimer = 1000;
            this.renderable.flicker(1000);

            if(this.pos.x - col.obj.pos.x > 0){
                this.vel.x = this.hitVelX = 50;
            }else{
                this.vel.x = this.hitVelX = -50;
            }
            this.vel.y = -20;
            this.renderable.setCurrentAnimation("hit" + this.animationSuffix, function() {
                self.renderable.setCurrentAnimation("idle" + self.animationSuffix);
            });
        }

        this.updateMovement();
        return true;
    }
})

var EnterPortalParticle = me.ObjectEntity.extend({
    /**
     * constructor
     */
    init: function (x, y, settings) {
        settings.image = settings.image || 'pickup';
        settings.spritewidth =  64;
        settings.spriteheight = 64;
        settings.height = 64;
        settings.width = 64;
        // call the parent constructor
        this.parent(x, y , settings);

        this.pickup = true;
        this.vel.x = Math.random() * 20-10;
        this.vel.y = -10 - Math.random()*10;
        this.setFriction( 0.1, 0 );
        this.life = 2000;
        //
        this.z = 300;
        this.collidable = false;

        // set the renderable position to center
        this.anchorPoint.set(0.5, 0.5);
    },

    update: function(dt) {
        this.parent(dt);
        this.updateMovement();

        this.life -=dt;

        if(this.life <=0){
            this.collidable = false;
            me.game.world.removeChild(this);
            return true;
        }

        return true;
    }
});


var OnHitPickup = me.ObjectEntity.extend({
    /**
     * constructor
     */
    init: function (x, y, settings) {
        settings.collidable = true;
        settings.image = settings.image || 'pickup';
        settings.spritewidth =  64;
        settings.spriteheight = 64;
        settings.height = 64;
        settings.width = 64;
        // call the parent constructor
        this.parent(x, y , settings);

        this.pickup = true;
        this.vel.x = Math.random() * 20-10;
        this.vel.y = -10 - Math.random()*10;
        this.pickupDelayTimer = 250;
        this.flickering = false;
        this.setFriction( 0.1, 0 );
        this.life = 2000;
        //
        this.z = 300;


        // set the renderable position to center
        this.anchorPoint.set(0.5, 0.5);
    },

    update: function(dt) {
        this.parent(dt);
        this.updateMovement();

        this.life -=dt;
        if(this.life <= 500 && !this.flickering){
            this.renderable.flicker(500);
            this.flickering = true;
        }
        if(this.life <=0){
            this.collidable = false;
            me.game.world.removeChild(this);
            return true;
        }

        if(this.pickupDelayTimer >0){
            this.pickupDelayTimer -=dt;
            return;
        }

        var col = me.game.world.collide(this);
        //console.log(col);
        if(this.pickupDelayTimer<=0 && col && col.obj.player ) {
            this.collidable = false;
            me.game.world.removeChild(this);
            me.state.current().player.pickups++;
            console.log("collectable collide " + me.state.current().player.pickups);
        }

        return true;
    }

});


var Pickup = me.ObjectEntity.extend({
    /**
     * constructor
     */
    init: function (x, y, settings) {
        settings.collidable = true;
        settings.image = settings.image || 'pickup';
        settings.spritewidth =  64;
        settings.spriteheight = 64;
        settings.height = 64;
        settings.width = 64;
        // call the parent constructor
        this.parent(x, y , settings);

        this.gravity = 0;
        this.pickup = true;
        this.z = 300;

        // set the renderable position to center
        this.anchorPoint.set(0.5, 0.5);
    },

    update: function(dt) {
        this.parent(dt);
        this.updateMovement();

        var col = me.game.world.collide(this);
        //console.log(col);
        if(col && col.obj.player ) {
            me.state.current().player.pickups++;
            this.collidable = false;
            me.game.world.removeChild(this);
            console.log("collectable collide " + me.state.current().player.pickups);
        }

        return true;
    }

});

var Bullet = me.ObjectEntity.extend({
    init: function(x, y, settings) {
        settings = settings || {};
        settings.image = settings.image || "zap";
        settings.spritewidth =  96;
        settings.spriteheight = 48;
        settings.height = 48;
        settings.width = 96;
        direction = settings.direction;
        this.parent( x, y, settings );
        this.bullet = true;
        this.collidable = true;
        this.z = 300;
        this.gravity = 0;
        this.vel.x = direction * 9.0;
        this.flipX( direction > 0 );
    },

    onCollision: function() {

    },

    die: function(){
        this.collidable = false;
        me.game.world.removeChild(this);
    },

    update: function( dt ) {
        this.parent( dt );
        this.updateMovement();
        if (!this.inViewport && (this.pos.y > me.video.getHeight())) {
            // if yes reset the game
            me.game.world.removeChild(this);
        }
        if( this.vel.x == 0 ) {
            // we hit a wall?
            me.game.world.removeChild(this);
        }

        return true;
    }

});

/** The game play state... */
var PlayScreen = me.ScreenObject.extend({
    init: function() {
        this.parent( true );
        me.input.bindKey(me.input.KEY.SPACE, "shoot");
        this.baddies = [];
        this.pickups = [];
        this.overworld = true;
        this.subscription = me.event.subscribe(me.event.KEYDOWN, this.keyDown.bind(this));

    },

    toUnderworld: function() {
        console.log("to underworld: " +  this.overworld );
        if( this.overworld ) {
            this.overworld = false;
            this.updateLayerVisibility(this.overworld);
        }
    },

    goToLevel: function( level ) {
        if( !this.overworld ) {
            this.baddies = [];
            this.overworld = true;
            me.levelDirector.loadLevel( level );
            me.state.current().changeLevel( level );
        }
    },


    updateLayerVisibility: function(overworld) {
        var level = me.game.currentLevel;
        level.getLayers().forEach(function(layer){
            if( layer.name.match( /overworld/ ) ) {
                layer.alpha = overworld ? 1 : 0;
            }
            else if( layer.name.match( /underworld/ ) ) {
                layer.alpha = overworld ? 0 : 1;
            }
        }, this);

        this.baddies.forEach(function(baddie) {
            var m = baddie.overworld && overworld || (!baddie.overworld && !overworld);
            if(m) {
                baddie.renderable.alpha = .5;
                baddie.collidable = false;
                baddie.gravity = 0;
                baddie.renderable.animationpause = true;
            }
            else {
                baddie.renderable.alpha = 1;
                baddie.collidable = true;
                baddie.gravity = 1;
                baddie.renderable.animationpause = false;
            }
        });

        me.game.repaint();
    },

    keyDown: function( action ) {
        if(action == "shoot") {
            this.player.shoot();
        }
    },

    getLevel: function() {
        return this.parseLevel( me.levelDirector.getCurrentLevelId() );
    },

    parseLevel: function( input ) {
        var re = /level(\d+)/;
        var results = re.exec( input );
        return results[1];
    },

    /** Update the level display & music. Called on all level changes. */
    changeLevel: function( level ) {
        // TODO: Makethis track the real variable...
        this.updateLayerVisibility(this.overworld);
        // this only gets called on start?
        me.game.world.sort();
        me.game.viewport.fadeOut( '#000000', 1000, function() {
        });
    },

    // this will be called on state change -> this
    onResetEvent: function() {
        var level =  location.hash.substr(1) || "level1" ;
        me.levelDirector.loadLevel( level );
        this.changeLevel( level );
    },

    onDestroyEvent: function() {
    },

    update: function() {
        me.game.frameCounter++;
    }
});

var RadmarsScreen = me.ScreenObject.extend({
    onResetEvent: function() {
        this.radmars = new RadmarsRenderable();
        me.game.world.addChild( this.radmars );

        this.subscription = me.event.subscribe( me.event.KEYDOWN, function (action, keyCode, edge) {
            if( keyCode === me.input.KEY.ENTER ) {
                me.state.change( me.state.PLAY );
            }
        });

        me.audio.playTrack( "radmarslogo" );
    },

    onDestroyEvent: function() {
        me.input.unbindKey(me.input.KEY.ENTER);
        me.audio.stopTrack();
        me.game.world.removeChild( this.radmars );
        me.event.unsubscribe( this.subscription );
    }
});

var RadmarsRenderable = me.Renderable.extend({
    init: function() {
        this.parent( 0, screenHeight, screenWidth );
        this.counter = 0;

        this.floating = true;

        if( !this.title ) {
            this.bg= me.loader.getImage("intro_bg");
            this.glasses1 = me.loader.getImage("intro_glasses1"); // 249 229
            this.glasses2 = me.loader.getImage("intro_glasses2"); // 249 229
            this.glasses3 = me.loader.getImage("intro_glasses3"); // 249 229
            this.glasses4 = me.loader.getImage("intro_glasses4"); // 249 229
            this.text_mars = me.loader.getImage("intro_mars"); // 266 317
            this.text_radmars1 = me.loader.getImage("intro_radmars1"); // 224 317
            this.text_radmars2 = me.loader.getImage("intro_radmars2");
        }

        me.input.bindKey( me.input.KEY.ENTER, "enter", true );
    },

    draw: function(context) {
        context.drawImage( this.bg, 0, 0 );
        if( this.counter < 130) context.drawImage( this.text_mars, 266+80, 317+60 );
        else if( this.counter < 135) context.drawImage( this.text_radmars2, 224+80, 317+60 );
        else if( this.counter < 140) context.drawImage( this.text_radmars1, 224+80, 317+60 );
        else if( this.counter < 145) context.drawImage( this.text_radmars2, 224+80, 317+60 );
        else if( this.counter < 150) context.drawImage( this.text_radmars1, 224+80, 317+60 );
        else if( this.counter < 155) context.drawImage( this.text_radmars2, 224+80, 317+60 );
        else if( this.counter < 160) context.drawImage( this.text_radmars1, 224+80, 317+60 );
        else if( this.counter < 165) context.drawImage( this.text_radmars2, 224+80, 317+60 );
        else context.drawImage( this.text_radmars1, 224+80, 317+60 );

        if( this.counter < 100) context.drawImage( this.glasses1, 249+80, 229*(this.counter/100)+60 );
        else if( this.counter < 105) context.drawImage( this.glasses2, 249+80, 229+60 );
        else if( this.counter < 110) context.drawImage( this.glasses3, 249+80, 229+60 );
        else if( this.counter < 115) context.drawImage( this.glasses4, 249+80, 229+60 );
        else context.drawImage( this.glasses1, 249+80, 229+60 );
    },

    update: function( dt ) {
        if ( this.counter < 350 ) {
            this.counter++;
        }
        else{
            me.state.change(me.state.MENU);
        }
        // have to force redraw :(
        me.game.repaint();
    }
});

window.onReady(function() {
    window.app = new LD30();
    window.app.onload();
});
