
var camera, scene, renderer;
var controls;

var acceptingInput = false;
var objects = [];

var chosenCard = null;
var found_count = 0;
var error_count = 0;
var flashInterval;

var startTime = null;
var start_interval = null;

var difficulties = {
    'easy' : {
        'name':'Easy difficulty',
        'table_size':12,
        'table_width':4,
        'cards_in_use':4
    },
    'medium' : {
        'name':'Medium difficulty',
        'table_size':18,
        'table_width':6,
        'cards_in_use':6
    },
    'hard' : {
        'name':'Hard difficulty',
        'table_size':32,
        'table_width':8,
        'cards_in_use':8
    },
    'impossible' : {
        'name':'Impossible difficulty',
        'table_size':50,
        'table_width':10,
        'cards_in_use':10
    }
};
var difficulty = difficulties.easy;

var number_icons = [
    'fa-1','fa-2','fa-3','fa-4','fa-5','fa-6','fa-7','fa-8'
    ,'fa-9'
    ,'fa-0'
];
var shape_icons = [
    'fa-star','fa-cube','fa-circle','fa-cloud','fa-hearts','fa-clubs','fa-spades','fa-diams'
    ,'fa-flag'
    ,'fa-flash'
];
var object_icons = [
    'fa-car','fa-plane','fa-bicycle','fa-soccer-ball-o','fa-coffee','fa-suitcase','fa-diamond','fa-key'
    ,'fa-male'
    ,'fa-tree'
];
var emoji_face_icons = [
    'em em-smile','em em-sob','em em-angry','em em-sleepy','em em-disappointed','em em-expressionless','em em-heart_eyes','em em-kissing_heart'
    ,'em em-blush'
    ,'em em-confused'
];
var emoji_animal_icons = [
    'em em-hatched_chick','em em-snake','em em-fish','em em-bee','em em-turtle','em em-octopus','em em-snail','em em-bug'
    ,'em em-dolphin'
    ,'em em-dragon'
];

var cards = number_icons;

init();
animate();



function shuffle(a) {
    var j, x, i;
    for (i = a.length; i; i--) {
        j = Math.floor(Math.random() * i);
        x = a[i - 1];
        a[i - 1] = a[j];
        a[j] = x;
    }
}

function clearTable() {

    for (var i in objects) {
        for (var j in objects[i].children) {
            objects[i].remove( objects[i].children[j] );    
        }
        scene.remove( objects[i] );
    }


    objects = [];
    animate();
}

function setupTable(difficulty) {

    $('#description').html('<div class="header">'+difficulty.name+'</div><div>deck size: '+difficulty.table_size+'</div><div>cards in use: '+difficulty.cards_in_use+'</div>');

    var deck_size = difficulty.table_size;
    var table_width = difficulty.table_width;
    var cards_in_use = difficulty.cards_in_use;

    clearTable();

    if (cards_in_use > cards.length) {
        cards_in_use = cards.length;
    }

    // build deck
    var deck = [];
    for ( var i = 0; i < deck_size; i += 1 ) {

        //var card_index = Math.floor(Math.random() * cards.length); random is bad
        var card_index = (i/2) % cards_in_use;
        deck[i] = cards[card_index];
        if (i+1 < deck_size) {
            deck[i+1] = cards[card_index];
            i+=1;
        }

    }

    // shuffle deck
    shuffle(deck);

    var vertical_padding = 200;
    var horizontal_padding = 200;

    var card_class = 'element';
    if (deck_size > 40) {
        card_class = 'element smaller_card';
        vertical_padding = 160;
        horizontal_padding = 160;
    }

    // place cards on table
    for ( var i = 0; i < deck_size; i += 1 ) {

        var char = deck[i];

        var element = document.createElement( 'div' );
        element.className = card_class;
        element.style.backgroundColor = 'rgba(0,127,127,' + ( Math.random() * 0.25 + 0.25 ) + ')';

        var symbol = document.createElement( 'div' );
        symbol.className = 'symbol fa ' + char;
        //symbol.textContent = str[i];
        element.appendChild( symbol );

        var object = new THREE.CSS3DObject( element );
        object.id = i;
        object.position.x = ( (i % table_width) * horizontal_padding ) - (horizontal_padding * ((table_width-1) / 2 )) + 1; // the +1 here actually fixes a bug in Safari where rotations won't work on cards with y position of 0
        object.position.y = ( - ( Math.floor( i / table_width ) ) * vertical_padding ) + Math.ceil(deck_size/table_width) * (vertical_padding*0.5);
        object.position.z = 1;

        //
        // add opaque back to card
        var element = document.createElement( 'div' );
        element.className = card_class;
        element.id = i;
        element.type = char;
        element.style.backgroundColor = 'rgba(20,20,20,1)';

        var back = new THREE.CSS3DObject( element );
        back.position.x = 0;
        back.position.y = 0;
        back.position.z = -2.5;

        element.addEventListener( 'click', function ( event ) {
            if (!acceptingInput) return;

            showCard(this.id);
            var currentCard = this;
            if (chosenCard == null) {
                chosenCard = this;
            } else {
                if (chosenCard.type == this.type) {
                    found_count+=2;

                    $(chosenCard).addClass('green-border');
                    $(currentCard).addClass('green-border');
                    chosenCard = null;
                } else {
                    error_count++;
                    $('#error_count').text(error_count);

                    flashInterval = setInterval(function() {
                        $(chosenCard).toggleClass('orange-border');
                        $(currentCard).toggleClass('orange-border');
                    }, 200);

                    acceptingInput = false;
                    setTimeout(function() {
                        hideCard(chosenCard.id);
                        hideCard(currentCard.id);

                        window.clearInterval(flashInterval);
                        $(chosenCard).removeClass('orange-border');
                        $(currentCard).removeClass('orange-border');

                        chosenCard = null;    
                        acceptingInput = true;
                    }, 2000);
                }
            }
            
            if (found_count >= difficulty.table_size) {
                var endTime = new Date().getTime();
                var time = (endTime - startTime)/1000;
                $('#success_text').text('Congratualtions! You beat ' + difficulty.name + '! You made ' + error_count + ' errors and it took you ' + time + ' seconds.');
                $('#success').removeClass('hidden');
                $('#score').addClass('hidden');
            }
        }, false );

        object.add(back);

        object.rotation.y = Math.PI;
        scene.add( object );
        objects.push( object );
        
    }

}

function reset() {
    found_count = 0;
    error_count = 0;
    $('#error_count').text(error_count);
    acceptingInput = false;

    clearTimeout(gameOn_timeout);
    clearInterval(start_interval);

    $('#success').addClass('hidden');
    $('#score').addClass('hidden');
    $('#menu').removeClass('hidden');

    setupTable(difficulty);
}

function init() {

    camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.z = 2000;

    scene = new THREE.Scene();

    var deck_size = 16;
    var table_width = 4;
    //setupTable(deck_size, table_width);

    //

    renderer = new THREE.CSS3DRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.domElement.style.position = 'absolute';
    document.getElementById( 'container' ).appendChild( renderer.domElement );

    var button = document.getElementById( 'begin' );
    button.addEventListener( 'click', function ( event ) {
        $('#menu').addClass('hidden');
        begin();
    }, false );

    var button = document.getElementById( 'reset' );
    button.addEventListener( 'click', function ( event ) {
        reset();
    }, false );

    var button = document.getElementById( 'quit' );
    button.addEventListener( 'click', function ( event ) {
        reset();
    }, false );

    var button = document.getElementById( 'ready' );
    button.addEventListener( 'click', function ( event ) {
        ready();
    }, false );

    //
    $( "#difficulty" )
      .change(function () {
        var str = "";
        $( "#difficulty option:selected" ).each(function() {
          str += $( this ).text();
        });

        difficulty = difficulties.easy;
        switch (str) {
            case 'Easy':
                difficulty = difficulties.easy;
                break;
            case 'Medium':
                difficulty = difficulties.medium;
                break;
            case 'Hard':
                difficulty = difficulties.hard;
                break;
            case 'Impossible':
                difficulty = difficulties.impossible;
                break;
        }

        setupTable(difficulty);
      })
      .change();

    $( "#deck_type" )
        .change(function () {
            var str = "";
            $( "#deck_type option:selected" ).each(function() {
                str += $( this ).text();
            });
            switch (str) {
                case 'Numbers':
                    cards = number_icons;
                    break;
                case 'Shapes':
                    cards = shape_icons;
                    break;
                case 'Objects':
                    cards = object_icons;
                    break;
                case 'Emoji Faces':
                    cards = emoji_face_icons;
                    break;
                case 'Emoji Animals':
                    cards = emoji_animal_icons;
                    break;
            }

            setupTable(difficulty);
        })
        .change();



    window.addEventListener( 'resize', onWindowResize, false );
    render();
}

function showCard(id) {
    var duration = 1000;
    var variance = 0.25;

    for ( var i = 0; i < objects.length; i ++ ) {
        var object = objects[i];
        if (i == id) {
            new TWEEN.Tween( object.rotation )
                .to( { x: 0, y: 0, z: 0 }, Math.random() * variance * duration + duration )
                .easing( TWEEN.Easing.Quadratic.Out )
                .start();
        }
    }
}

function hideCard(id) {
    var duration = 1000;
    var variance = 0.25;

    for ( var i = 0; i < objects.length; i ++ ) {
        var object = objects[i];
        if (i == id) {
            new TWEEN.Tween( object.rotation )
                .to( { x: 0, y: Math.PI, z: 0 }, Math.random() * variance * duration + duration )
                .easing( TWEEN.Easing.Quadratic.Out )
                .start();
        }
    }
}

// rotate cards to show face
function showCards(el) {
    var duration = 1000;
    TWEEN.removeAll();

    for ( var i = 0; i < objects.length; i ++ ) {

        var object = objects[ i ];

        new TWEEN.Tween( object.rotation )
            .to( { x: 0, y: 0, z: 0 }, duration + i * 50 )
            .easing( TWEEN.Easing.Quadratic.In )
            .start();
    }
}

// rotate cards to show back
function hideCards() {
    var duration = 1000;
    var variance = 0.25;
    TWEEN.removeAll();

    for ( var i = 0; i < objects.length; i ++ ) {

        var object = objects[ i ];

        new TWEEN.Tween( object.rotation )
            .to( { x: 0, y: Math.PI, z: 0 }, duration + i * 50)
            .easing( TWEEN.Easing.Quadratic.Out )
            .start();
    }
}

function startTimer() {
    var seconds_left = 20;
    document.getElementById('ready_timer').innerHTML = --seconds_left;
    start_interval = setInterval(function() {
        document.getElementById('ready_timer').innerHTML = --seconds_left;

        if (seconds_left <= 0)
        {
            document.getElementById('ready_timer').innerHTML = 'Begin..';
            clearInterval(start_interval);
        }
    }, 1000);
}

var gameOn_timeout = null;
function gameOn() {
    
    hideCards();

    $('#timeout').addClass('hidden');
    $('#score').removeClass('hidden');
    acceptingInput = true;
    startTime = new Date().getTime();
}

function ready() {
    clearTimeout(gameOn_timeout);
    gameOn();
}

function begin() {
    showCards();
    $('#timeout').removeClass('hidden');

    startTimer();
    gameOn_timeout = setTimeout(gameOn, 20000);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

    render();
}

function animate() {
    requestAnimationFrame( animate );
    TWEEN.update();
    render();
}

function render() {
    renderer.render( scene, camera );
}