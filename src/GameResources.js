function _Image( name, path ) {
    return { name: name, type: "image", src: "data/" + name + ".png" };
}

function _Audio( name ) {
    return { name: name, type: "audio", src: "data/audio/" , channels: 2 };
}

function _Level( name ) {
    return { name: name, type: "tmx", src: "data/" + name + ".tmx" };
}


var GameResources = [
    /* Radmars Logo */
    _Image( "intro_bg" ),
    _Image( "intro_glasses1" ),
    _Image( "intro_glasses2" ),
    _Image( "intro_glasses3" ),
    _Image( "intro_glasses4" ),
    _Image( "intro_mars" ),
    _Image( "intro_radmars1" ),
    _Image( "intro_radmars2" ),

    // ui
    _Image("16x16_font"),
    _Image("32x32_font"),

    _Image("soulcharge"),

    _Image("ui_pickup"),
    _Image("ui_pickup2"),
    _Image("summon_gauge_bg"),
    _Image("summon_gauge_fill"),
    _Image("find_gate"),
    _Image("harvest_souls"),

    // Player
    _Image( "zap" ),
    _Image( "player" ),

    _Image( "cat" ),
    _Image( "cat_skel" ),

    _Image( "wasp" ),
    _Image( "wasp_skel" ),

    _Image( "fish" ),
    _Image( "fish_skel" ),

    _Image( "crab" ),
    _Image( "crab_skel" ),

    _Image( "pickup" ),
    _Image( "baddieBullet" ),
    _Image( "waspBullet" ),
    _Image( "doublejump" ),
    _Image( "dembones" ),
    _Image( "explode" ),

    _Image( "win" ),
    _Image( "lose" ),
    _Image( "splash" ),
    _Image( "introcta" ),

    _Image( "paralax_normal1" ),
    _Image( "paralax_underworld1" ),
    _Image( "gateway" ),
    _Image( "map_gateways" ),
    _Image( "map_altar" ),

    _Image( "mapshit1"),
    _Image( "map_normal1"),
    _Image( "map_underworld1"),
    _Image( "collision_tiles" ),

    _Image( "ending_bad" ),
    _Image( "ending_good" ),

    _Level( "level1" ),
    _Level( "level2" ),
    _Level( "level3" ),
    _Level( "level4" ),
    _Level( "level5" ),

    _Audio( "radmarslogo" ),
    _Audio( "death" ),
    _Audio( "doublejump" ),
    _Audio( "enemydeath1" ),
    _Audio( "enemydeath2" ),
    _Audio( "enemydeath3" ),
    _Audio( "enemydeath4" ),
    _Audio( "enemyshoot" ),
    _Audio( "hit" ),
    _Audio( "jump" ),
    _Audio( "ld30-real" ),
    _Audio( "ld30-spirit" ),
    _Audio( "ld30-title" ),
    _Audio( "lostsouls" ),
    _Audio( "pickup" ),
    _Audio( "portal" ),
    _Audio( "portalrev" ),
    _Audio( "radmarslogo" ),
    _Audio( "shoot" )
];
