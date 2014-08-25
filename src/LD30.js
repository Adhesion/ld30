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

        me.state.change( me.state.PLAY);

        me.pool.register( "player", Player );
        me.pool.register( "baddie", Baddie );

        me.pool.register( "fish", Fish );
        me.pool.register( "wasp", Wasp );
        me.pool.register( "crab", Crab );
        me.pool.register( "cat", Cat );

        me.pool.register( "pickup", Pickup );
        me.pool.register( "underworld", Underworld );
        me.pool.register( "levelchanger", LevelChanger );

    };
};

LD30.data = {souls:10, collectedSouls:0, collectedSoulsMax:10};

LD30.HUD = LD30.HUD || {};

LD30.HUD.Container = me.ObjectContainer.extend({
    init: function() {
        // call the constructor
        this.parent();


        this.isPersistent = true;
        this.collidable = false;

        // make sure our object is always draw first
        this.z = Infinity;
        this.name = "HUD";
        this.soulDisplay = new LD30.HUD.SoulDisplay(25, 25);
        this.addChild(this.soulDisplay);
    },

    toUnderworld: function() {
        this.soulDisplay.toUnderworld();
    }
});

LD30.HUD.SoulDisplay = me.Renderable.extend( {
    /**
     * constructor
     */
    init: function(x, y) {

        // call the parent constructor
        // (size does not matter here)
        this.parent(new me.Vector2d(x, y), 10, 10);

        // create a font
        this.font = new me.BitmapFont("32x32_font", 32);
        this.font.set("right");

        this.pickupTimer = 0;
        this.pickup1 = me.loader.getImage("ui_pickup");
        this.pickup2 = me.loader.getImage("ui_pickup2");
        this.gaugebg = me.loader.getImage("summon_gauge_bg");
        this.gauge  = me.loader.getImage("summon_gauge_fill");

        // local copy of the global score
        this.souls = -1;

        this.gaugePos = {x:800, y:0};
        this.gaugeHeight = 147;
        this.gaugeRenderHeight = 1;
        this.gaugeOffset = 0

        // make sure we use screen coordinates
        this.floating = true;
    },

    toUnderworld: function() {
        var self = this;
        new me.Tween(self.gaugePos).to({x:700, y: 200}, 250).easing(me.Tween.Easing.Quintic.Out).onComplete(function(){
            new me.Tween(self.gaugePos).to({x:800, y: 0}, 500).easing(me.Tween.Easing.Quintic.InOut).delay(2000).start();
        }).start();
    },



    update : function () {
        this.souls =  LD30.data.souls;

        var collected = LD30.data.collectedSouls;
        var max = LD30.data.collectedSoulsMax;
        var h = Math.round((collected/max) * this.gaugeHeight);
        if(h < 0) h=0;
        if(h > this.gaugeHeight) h = this.gaugeHeight;

        //TODO: animate this?
        this.gaugeRenderHeight= h;
        this.gaugeOffset = this.gaugeHeight - this.gaugeRenderHeight;

        return true;
    },

    draw : function (context) {
        this.pickupTimer ++;
        if(this.pickupTimer > 50){
            this.pickupTimer = 0;
        }

        this.font.draw (context, this.souls, this.pos.x + 70, this.pos.y + 30);

        if(this.pickupTimer > 25){
            context.drawImage( this.pickup2, this.pos.x, this.pos.y );
        }else{
            context.drawImage( this.pickup1, this.pos.x, this.pos.y );
        }



        context.drawImage( this.gaugebg, this.pos.x + this.gaugePos.x, this.pos.y+ this.gaugePos.y );
        context.drawImage( this.gauge, this.pos.x + this.gaugePos.x + 15, this.pos.y+ this.gaugePos.y + 54 + this.gaugeOffset, 21, this.gaugeRenderHeight );
        //(img_elem,dx_or_sx,dy_or_sy,dw_or_sw,dh_or_sh,dx,dy,dw,dh)
    }

});



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

        me.game.world.collide(this, true).forEach(function(col) {
            if(col && col.obj == me.state.current().player  ) {
                me.state.current().goToLevel(this.toLevel);
            }
        }, this);
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
        me.game.world.collide(this, true).forEach(function(col) {
            if(col && col.obj == me.state.current().player ) {
                me.state.current().toUnderworld();
                me.state.current().player.toUnderworld();
            }
        }, true);
    }
});


var Baddie = me.ObjectEntity.extend({
    init: function(x, y, settings) {
        settings = settings || {}
        settings.image = settings.image || 'robut';
        settings.spritewidth = settings.spritewidth || 141;
        settings.spriteheight = settings.spriteheight || 139;

        this.type = settings.type;
        this.skel = settings.skel;
        if( settings.skel ) {
            settings.image = settings.image + '_skel';
        }

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
    },

    checkBulletCollision: function(){
        me.game.world.collide(this, true).forEach(function(col) {
            if(col && col.obj.bullet && !this.overworld ) {
                col.obj.die();
                me.state.current().baddies.remove(this);

                //TODO: spawn death particle?
                this.collidable = false;
                me.game.world.removeChild(this);

                var p = new Pickup(this.pos.x, this.pos.y-150, {});
                me.game.world.addChild(p);

                // #ProHacks
                var b = new window[this.type](this.pos.x, this.pos.y, {
                    skel: 1,
                    x: this.pos.x,
                    y: this.pos.y,
                    overworld:1,
                    width: 80, // TODO This controls patrol???
                    height: 80,
                });
                b.z = 300;
                me.game.world.addChild(b);
                me.game.world.sort();

                me.state.current().updateLayerVisibility(me.state.current().overworld);
            }
        }, this);
    },
    update: function(dt) {
        this.parent(dt);
        this.updateMovement();
        this.checkBulletCollision();
        return true;
    }
});

var Fish = Baddie.extend({
    init: function(x, y, settings) {
        settings.image = 'fish';
        settings.spritewidth = 141;
        settings.spriteheight = 141;
        settings.type = 'Fish';

        this.patrolWidth = settings.width;
        settings.height = 50;
        settings.width = 70;
        this.parent( x, y, settings );


        var shape = this.getShape();
        if( !shape ) {
            this.addShape(new me.Rect(-14, 10, 100, 64 ));
            shape = this.getShape();
        }
        shape.pos.x = 0;
        shape.pos.y = 20;
        shape.resize(70, 50);

        this.renderable.addAnimation( "walk", [ 0, 1 ] );
        this.renderable.setCurrentAnimation("walk");

        this.startX = this.pos.x;
        this.baseSpeed = this.speed = 2.0;
        this.setVelocity( 5, 15 );
        this.flipX(true);
        this.direction = 1;
        this.renderable.animationspeed = 70;
    },

    update: function(dt) {
        this.parent(dt);

        this.vel.x = this.speed;

        if(this.pos.x > this.startX + this.patrolWidth){
            this.pos.x = this.startX + this.patrolWidth;
            this.speed = this.baseSpeed* -1;
            this.flipX(false);
            this.direction = -1;
        }
        if(this.pos.x < this.startX ){
            this.pos.x = this.startX;
            this.speed = this.baseSpeed;
            this.flipX(true);
            this.direction = 1;
        }

        return true;
    }
});

var Wasp = Baddie.extend({
    init: function(x, y, settings) {
        settings.image = 'wasp';
        settings.spritewidth = 141;
        settings.spriteheight = 141;
        settings.type = 'Wasp';

        this.patrolWidth = settings.width;
        settings.height = 80;
        settings.width = 80;
        this.parent( x, y, settings );

        this.renderable.addAnimation( "walk", [ 0, 1, 0, 2 ] );
        this.renderable.addAnimation( "shoot", [ 4 ] );
        this.renderable.setCurrentAnimation("walk");

        if( settings.skel == null || !settings.skel ) {
            this.renderable.addAnimation( "walk", [ 0, 1, 0, 2 ] );
            this.renderable.setCurrentAnimation("walk");
        }else{
            this.renderable.addAnimation( "walk", [ 0, 1] );
            this.renderable.setCurrentAnimation("walk");
        }

        this.startX = this.pos.x;
        this.baseSpeed = this.speed = 3.0;
        this.setVelocity( 5, 15 );
        this.gravity = 0;
        this.shootCooldown = 0;
        this.renderable.animationspeed = 70;
        this.pausePatrol = 0;

        this.flipX(true);
        this.direction = 1;
    },

    update: function(dt) {
        this.parent(dt);


        if(this.shootCooldown > 0) this.shootCooldown-=dt;

        if(this.shootCooldown <= 0 && !me.state.current().player.overworld && !this.overworld){
            var d = me.state.current().player.pos.x - this.pos.x;
            if( (Math.abs(d) < 350 && Math.abs(d) > 150) && ((d > 0 && this.direction > 0)||(d < 0 && this.direction < 0))){
                this.pausePatrol = 500;
                this.shootCooldown = 2000;
                var b = new  WaspBullet(this.pos.x, this.pos.y, {direction:this.direction });
                me.game.world.addChild(b);
                me.game.world.sort();
            }
        }

        if(this.pausePatrol > 0){
            this.pausePatrol-=dt;
            return true;
        }

        this.vel.x = this.speed;
        if(this.pos.x > this.startX + this.patrolWidth){
            this.pos.x = this.startX + this.patrolWidth;
            this.speed = this.baseSpeed* -1;
            this.pausePatrol = 500;
            this.flipX(false);
            this.direction = -1;
        }
        if(this.pos.x < this.startX ){
            this.pos.x = this.startX;
            this.speed = this.baseSpeed;
            this.pausePatrol = 500;
            this.flipX(true);
            this.direction = 1;
        }

        return true;
    }
});

var Crab = Baddie.extend({
    init: function(x, y, settings) {
        settings.image = 'crab';
        settings.spritewidth = 141;
        settings.spriteheight = 141;
        settings.type = 'Crab';

        this.patrolWidth = settings.width;
        settings.height = 30;
        settings.width = 50;
        this.parent( x, y, settings );

        var shape = this.getShape();
        if( !shape ) {
            this.addShape(new me.Rect(-14, 10, 100, 64 ));
            shape = this.getShape();
        }
        shape.pos.x = 0;
        shape.pos.y = 0;
        shape.resize(60, 60);

        this.renderable.addAnimation( "walk", [ 0, 1, 0, 2 ] );
        this.renderable.setCurrentAnimation("walk");

        this.startX = this.pos.x;
        this.baseSpeed = this.speed = 1.5;
        this.sprintTime = 0;
        this.setVelocity( 5, 15 );


        this.renderable.animationspeed = 70;
    },

    update: function(dt) {
        this.parent(dt);

        var d = me.state.current().player.pos.x - this.pos.x;
        if( (Math.abs(d) < 300) && ((d > 0 && this.direction > 0)||(d < 0 && this.direction < 0))){
            this.sprintTime = 100;
        }

        if(this.sprintTime > 0){
            this.sprintTime -=dt;
            this.vel.x = this.speed*3;
        }else{
            this.vel.x = this.speed;
        }



        if(this.pos.x > this.startX + this.patrolWidth){
            this.pos.x = this.startX + this.patrolWidth;
            this.speed = this.baseSpeed* -1;
            this.sprintTime = 0;
            this.flipX(true);
            this.direction = -1;
        }
        if(this.pos.x < this.startX ){
            this.pos.x = this.startX;
            this.speed = this.baseSpeed;
            this.sprintTime = 0;
            this.flipX(false);
            this.direction = 1;
        }

        return true;
    }
});

var Cat = Baddie.extend({
    init: function(x, y, settings) {
        settings.image = 'cat';
        settings.spritewidth = 141;
        settings.spriteheight = 139;
        settings.type = 'Cat';

        this.patrolWidth = settings.width;
        settings.height = 80;
        settings.width = 80;
        this.parent( x, y, settings );

        var shape = this.getShape();
        if( !shape ) {
            // Seems like the rect args make no difference. Nice.
            this.addShape(new me.Rect(-14, 10, 100, 64 ));
            shape = this.getShape();
        }
        shape.pos.x = -14;
        // TODO Mess with shapes!
        shape.pos.y = 22;
        shape.resize(110, 74);

        if( settings.skel == null || !settings.skel ) {
            this.renderable.addAnimation( "walk", [ 0, 1, 0, 2 ] );
            this.renderable.setCurrentAnimation("walk");
        }else{
            this.renderable.addAnimation( "walk", [ 0, 1] );
            this.renderable.setCurrentAnimation("walk");
        }

        this.startX = this.pos.x;
        this.baseSpeed = this.speed = 1.0;
        this.setVelocity( 5, 15 );
        this.shootCooldown = 0;
        this.renderable.animationspeed = 70;
        this.pausePatrol = 0;
        this.flipX(true);
    },

    update: function(dt) {
        this.parent(dt);


        if(this.shootCooldown > 0) this.shootCooldown-=dt;

        if(this.shootCooldown <= 0&& !me.state.current().player.overworld){
            var d = me.state.current().player.pos.x - this.pos.x;
            if( (Math.abs(d) < 350 && Math.abs(d) > 150) && ((d > 0 && this.direction > 0)||(d < 0 && this.direction < 0))){
                this.pausePatrol = 500;
                this.shootCooldown = 2000;
                var b = new  CatBullet(this.pos.x, this.pos.y, {direction:this.direction });
                me.game.world.addChild(b);
                me.game.world.sort();
            }
        }

        if(this.pausePatrol > 0){
            this.pausePatrol-=dt;
            return true;
        }

        this.vel.x = this.speed;
        if(this.pos.x > this.startX + this.patrolWidth){
            this.pos.x = this.startX + this.patrolWidth;
            this.speed = this.baseSpeed* -1;
            this.pausePatrol = 500;
            this.flipX(false);
            this.direction = -1;
        }
        if(this.pos.x < this.startX ){
            this.pos.x = this.startX;
            this.speed = this.baseSpeed;
            this.pausePatrol = 500;
            this.flipX(true);
            this.direction = 1;
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
        this.overworld = false;

        this.z = 100;
        this.shootDelay = 0;
        this.disableInputTimer = 0;

        var shape = this.getShape();
        shape.pos.x = 44;
        shape.pos.y = 0;
        shape.resize(70, 110);
        me.state.current().player = this;

        this.pickups = LD30.data.souls;
        this.collisionTimer = 0;
        this.doubleJumped = false;

        this.animationSuffix = "";

        this.setVelocity( 5, 16 );
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
        if(this.overworld == true) return;

        this.overworld = true;
        this.necroMode = false;
        this.setVelocity( 7, 20 );
        this.setFriction( 0.7, 0 );

        this.disableInputTimer = 1500;

        LD30.data.collectedSouls += this.pickups;
        this.renderable.animationspeed = 165;
        if(this.pickups > 0){
            for( var i=0; i<this.pickups; i++){
                var b = new EnterPortalParticle(this.pos.x, this.pos.y, {delay:i*50});
                me.game.world.addChild(b);
            }
            me.game.world.sort();
            this.pickups = 0;
        }
        this.animationSuffix = "_normal";
    },

    shoot: function(){
        if(this.necroMode && this.shootDelay <= 0){
            var b = new Bullet(this.pos.x + 30*this.direction, this.pos.y+40, { direction: this.direction });
            me.game.world.addChild(b);
            me.game.world.sort();
            this.shootDelay = 200;
            var self = this;
            if(this.jumping || this.falling){
                this.renderable.setCurrentAnimation("shoot_jump" + this.animationSuffix, function() {
                    self.renderable.setCurrentAnimation("fall" + self.animationSuffix);
                });
            }else{
                this.renderable.setCurrentAnimation("shoot" + this.animationSuffix, function() {
                    self.renderable.setCurrentAnimation("idle" + self.animationSuffix);
                })
            }


        }
    },

    update: function(dt) {
        var self = this;
        this.parent(dt);

        LD30.data.souls = this.pickups;

        if(this.shootDelay >0){
            this.shootDelay-=dt;
        }

        if(this.disableInputTimer > 0){
            this.disableInputTimer-=dt;
            this.gravity = 0;
            this.vel.x = 0;
            this.vel.y = 0;
            this.updateMovement();
            return true;
        }else{
            this.gravity = 1;
        }

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
            this.vel.x = -25.5;
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
            if( ! this.renderable.isCurrentAnimation("shoot_jump" + this.animationSuffix) ){
                this.renderable.setCurrentAnimation("fall" + this.animationSuffix);
            }
        }

        if(!this.falling && !this.jumping){
            console.log("doblejump reset");
            this.doubleJumped = false;
            if(!me.input.isKeyPressed('right') && !me.input.isKeyPressed('left') && ! this.renderable.isCurrentAnimation("idle" + this.animationSuffix)&& ! this.renderable.isCurrentAnimation("shoot" + this.animationSuffix)){
                this.renderable.setCurrentAnimation("idle" + this.animationSuffix);
            }
        }

        if( me.input.isKeyPressed('up')) {
            if(!this.jumping && !this.falling){
                this.vel.y = -40;
                this.jumping = true;
                self.renderable.setCurrentAnimation("jump" + this.animationSuffix);
            }
            else if((this.jumping || this.falling) && !this.doubleJumped){
                this.doubleJumped = true;
                this.vel.y = -40;
                self.renderable.setCurrentAnimation("double_jump" + this.animationSuffix);
            }
        }

        me.game.world.collide(this, true).forEach(function(col) {
            if(this.hitTimer <= 0 && this.collisionTimer <=0 && col && col.obj.baddie && (this.overworld == col.obj.overworld) ) {

                //TODO: change character to normal texture here!
                //TODO: if pickups <= 0, die!
                //this.necroMode = false;
                if(this.pickups > 0){
                    for( var i=0; i<this.pickups; i++){
                        var b = new OnHitPickup(this.pos.x, this.pos.y, {});
                        me.game.world.addChild(b);
                    }
                    me.game.world.sort();
                    this.pickups = 0;
                }
                //this.animationSuffix = "_normal";

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
        }, this);

        this.updateMovement();
        return true;
    }
})

var EnterPortalParticle = me.ObjectEntity.extend({
    /**
     * constructor
     */
    init: function (x, y, settings) {
        settings.image = settings.image || 'soulcharge';
        settings.spritewidth =  36;
        settings.spriteheight = 36;
        settings.width = 60;
        settings.height = 60;
        // call the parent constructor
        this.parent(x, y , settings);
        this.gravity = 0;
        this.pickup = true;
        //this.vel.x = Math.random() * 20-10;
        //this.vel.y = -10 - Math.random()*10;
        //this.setFriction( 0.1, 0 );
        var d = settings.delay || 0;
        this.life = 2000;

        var self = this;
        new me.Tween(this.pos).to({x:this.pos.x +Math.random()*100-50, y: this.pos.y+Math.random()*100-50}, d).easing(me.Tween.Easing.Quintic.InOut).onComplete(function(){
            new me.Tween(self.pos).to({x:self.pos.x +225, y: self.pos.y-25}, self.life).easing(me.Tween.Easing.Elastic.InOut).start();
            new me.Tween(self.renderable).to({alpha:0}, self.life*0.25).delay(self.life*0.75).start();
        }).start();


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
        settings.spritewidth =  69;
        settings.spriteheight = 117;
        settings.width = 60;
        settings.height = 60;
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

        me.game.world.collide(this, true).forEach(function(col) {
            if(this.pickupDelayTimer<=0 && col && col.obj.player ) {
                this.collidable = false;
                me.game.world.removeChild(this);
                me.state.current().player.pickups++;
            }
        }, this );

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
        settings.spritewidth =  69;
        settings.spriteheight = 117;
        settings.width = 60;
        settings.height = 100;
        // call the parent constructor
        this.parent(x, y , settings);

        //var shape = this.getShape();
        //shape.pos.x = 0;
        //shape.pos.y = 40;

        this.gravity = 0;
        this.pickup = true;
        this.z = 300;
        this.overworld = true;

        // Hack...
        me.state.current().pickups.push(this);

        // set the renderable position to center
        this.anchorPoint.set(0.5, 0.5);
    },

    update: function(dt) {
        this.parent(dt);
        this.updateMovement();

        if(me.state.current().player.overworld){
            me.game.world.collide(this, true).forEach(function(col) {
                if(col && col.obj.player ) {
                    me.state.current().pickups.remove(this);
                    me.state.current().player.pickups++;
                    this.collidable = false;
                    me.game.world.removeChild(this);
                }
            }, this);
        }

        return true;
    }

});

var WaspBullet = me.ObjectEntity.extend({
    init: function(x, y, settings) {
        settings = settings || {};
        settings.image = "waspBullet";
        settings.spritewidth =  78;
        settings.spriteheight = 78;
        settings.height = 30;
        settings.width = 30;
        direction = settings.direction;

        this.parent( x, y, settings );
        this.baddie = true;
        this.overworld = false;
        this.collidable = true;
        this.z = 300;
        this.gravity = 0;
        this.vel.x = direction * 5.0;
        this.vel.y = 5.0;
        this.flipX( direction > 0 );

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
            this.die();
        }
        if( this.vel.x == 0 || this.vel.y ==0 ) {
            // we hit a wall?
            this.die();
        }

        return true;
    }

});


var CatBullet = me.ObjectEntity.extend({
    init: function(x, y, settings) {
        settings = settings || {};
        settings.image = "baddieBullet";
        settings.spritewidth =  64;
        settings.spriteheight = 60;
        settings.height = 30;
        settings.width = 30;
        direction = settings.direction;

        this.parent( x, y, settings );
        this.baddie = true;
        this.overworld = false;
        this.collidable = true;
        this.z = 300;
        this.gravity = 1;
        this.vel.x = direction * 5.0;
        this.vel.y = -10.0;
        this.onthewayDown=false;
        this.flipX( direction > 0 );

    },

    die: function(){
        this.collidable = false;
        me.game.world.removeChild(this);
    },

    update: function( dt ) {
        this.parent( dt );
        this.updateMovement();

        if(this.vel.y > 0){
            this.onthewayDown=true;
        }

        if (!this.inViewport && (this.pos.y > me.video.getHeight())) {
            // if yes reset the game
            this.die();
        }
        if( this.onthewayDown && (this.vel.x == 0 || this.vel.y ==0) ) {
            // we hit a wall?
            this.die();
        }

        return true;
    }

});


var Bullet = me.ObjectEntity.extend({
    init: function(x, y, settings) {
        settings = settings || {};
        settings.image = settings.image || "zap";
        settings.spritewidth =  111;
        settings.spriteheight = 42;
        settings.width = 111;
        settings.height = 42;
        direction = settings.direction;
        this.parent( x, y, settings );
        this.bullet = true;
        this.collidable = true;
        this.z = 300;
        this.gravity = 0;
        this.vel.x = direction * 15.0;
        this.flipX( direction < 0 );

        this.renderable.animationspeed = 10;
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

        this.HUD = new LD30.HUD.Container();
        me.game.world.addChild(this.HUD);
    },

    toUnderworld: function() {
        if( this.overworld ) {
            this.overworld = false;
            this.updateLayerVisibility(this.overworld);
            this.HUD.toUnderworld();
        }
    },

    goToLevel: function( level ) {
        if( !this.overworld ) {
            this.baddies = [];
            this.pickups = [];
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
               // baddie.collidable = false;
            }
            else {
                baddie.renderable.alpha = 1;
                //baddie.collidable = true;
            }
        });

        this.pickups.forEach(function(pickup) {
            var m = pickup.overworld && overworld || (!pickup.overworld && !overworld);
            if(m) {
                pickup.renderable.alpha = .5;
                //pickup.collidable = false;
            }
            else {
                pickup.renderable.alpha = 1;
                //pickup.collidable = true;
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
