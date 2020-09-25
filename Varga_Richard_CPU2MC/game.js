// mennyitol szamoljunk vissza
let time = 30;
// idozito azonositoja
let tc;
var newGame;

var Game = function() {

	this.init = function(size, base, ui) {
		this.base = base;
		this.ui = ui;
		this.originalSize = size;
		this.size = this.originalSize * this.originalSize;
		this.caseHeight = base.height() / this.originalSize;
		this.level = [];


		if(size===7) {
			this.typesOfCandies = 6;
		}else {
			this.typesOfCandies=5;
		}

		this.fillEnd = true; //kitoltes a vegeig
		this.switchEnd = true; //befejezodott a csere
		this.playerCanControl = false;
		this.populateLevel(); //random elemekkel valo feltoltes
		this.drawNewLevel(); //map generálása
		this.score = 0;
		this.combo = 0;
		this.bestCombo = 0;

		//Takes a function and returns a new one that will always have a particular context.
		//The function whose context will be changed.
		//The object to which the context (this) of the function should be set.
		setTimeout($.proxy(this.checkLines, this), 50);
	};
	//közzetenni
	this.releaseGameControl = function(play) {
		if (play) {
			this.playerCanControl = true;
		} else {
			this.playerCanControl = false;
		}
	};
	//milyen esemeny tortent(dragup,dragright stb)
	this.bindDraggableEvent = function() {
		var that = this;
		var position;
		//esemeny,mire,mit csinaljon
		this.base.hammer().on('dragleft dragright dragup dragdown', '.row', function(event) {

			//console.log('swipe', this, event);

			event.gesture.preventDefault();

			//amikor uj candyt generálunk megkapja az id-t, + jel mert kul csak balra,fel lehet huzni
			position = +$(this).attr('data-id');

			if (position !== undefined) {
				that.testMove(position, event.type); //event.type==='dragleft' pl
				event.gesture.stopDetect();  //hammerjs miatt, az ismeri fel a mozdulatokat,azzal lehet iranyitani(gesture)
				return;
			}
		});
	};
	//pozicio, milyen irányba, megadtuk a binddraggableeventnél
	this.testMove = function(position, direction) {
		switch(direction) {
			case "dragleft":
				//megnezzuk, hogy a szelen levot ha balra huzzuk ne tudjuk kicserelni az egyel fenteb sorvban levo uccsoval
				if (position % this.originalSize !== 0) {
					this.swipeCandy(this.base.find('.row[data-id='+position+']'), position, this.base.find('.row[data-id='+(position - 1)+']'), position - 1);
				}
				break;

			case "dragright":
				//megnezzuk, hogy a szelen levot ha jobbra huzzuk ne tudjuk kicserelni az egyel lentebb sorvban levo elsovel
				if (position % this.originalSize !== this.originalSize - 1) {
					this.swipeCandy(this.base.find('.row[data-id='+position+']'), position, this.base.find('.row[data-id='+(position + 1)+']'), position + 1);
				}
				break;

			case "dragup":
				this.swipeCandy(this.base.find('.row[data-id='+position+']'), position, this.base.find('.row[data-id='+(position - this.originalSize)+']'), position - this.originalSize);
				break;

			case "dragdown":
				this.swipeCandy(this.base.find('.row[data-id='+position+']'), position, this.base.find('.row[data-id='+(position + this.originalSize)+']'), position + this.originalSize);
				break;
		}
	};

	this.swipeCandy = function(one, oneID, two, twoID) {



		//console.log("switch: ", oneID, twoID);


		if (this.switchEnd && one !== undefined && two !== undefined && oneID >= 0 && twoID >= 0 && oneID <= this.size && twoID <= this.size) {


			var store = this.level[oneID];
			var that = this;
			var oneTop = one.css('top');
			var oneLeft = one.css('left');
			var twoTop = two.css('top');
			var twoLeft = two.css('left');
			var oneType = this.level[oneID];
			var twoType = this.level[twoID];

			//	console.log(this.level[oneID]);
			//	console.log(this.level[twoID]);


			this.switchEnd = false;

			//megtorteneik a csere
			this.level[oneID] = twoType;
			this.level[twoID] = oneType;

			this.comboUpdate(0);



			//console.log("a&two types: ", twoType, oneType);
			//masik azonostojat kapja meg a csere miatt, és annak a helyere kerul
			one.attr('data-id', twoID).animate({
				top: twoTop,
				left: twoLeft
			}, 250);

			two.attr('data-id', oneID).animate({
				top: oneTop,
				left: oneLeft
			}, 250, function() {


				that.switchEnd = true;
				//a csere utan megnezzuk hogy kigyult-e valamiol min 3
				//that azert kell mert pl this.swap nem mukodik, that.swap igen
			//	console.log(that.level);
				that.checkLines();
			//	megnézzük hogy lehet-e cserélni, ha van benne 0 akkor kigyult 3 -> lehet
				if(!that.level.includes(0)) {
					that.level[oneID] = oneType;
					that.level[twoID] = twoType;
					that.scoreUpdate(-100);
					that.comboUpdate(0);

					one.attr('data-id', oneID).animate({
						top: oneTop,
						left: oneLeft
					}, 250);
					two.attr('data-id', twoID).animate({
						top: twoTop,
						left: twoLeft
					}, 250, function() {
						that.switchEnd = true;
						//a csere utan megnezzuk hogy kigyult-e valamiol min 3
						that.checkLines();
					});
				}
			});

			if(oneType === 7 && twoType === 7) {
				for(let b = 0; b < this.level.length; b++) {
					this.removeClearedCandyToLevel([b]);
					this.releaseGameControl(true);
				}
			}


			if(oneType === 7 ) {

				//console.log("joker swiped");
				for(let b = 0; b < this.level.length; b++) {
					if (this.level[b] === twoType) {
						this.removeClearedCandyToLevel([one.attr('data-id')]);
						this.removeClearedCandyToLevel([b]);
						this.releaseGameControl(true);

					}
				}
				this.removeClearedCandyToLevel([store]);
			}

			/*
				this.base.find('.type-2').each(function () {
					if($(this).css('top')===a.css('top') && $(this).css('left')===a.css('left')) {
						console.log("MRGVAN");
					}
				});
			console.log(a.attr('data-id'));*/

		}
	};
	//random elemekkel feltoltes kezdetben
	this.populateLevel = function() {
		var i;
		for (i = 0; i < this.size; i++) {
			//nem használunk 0-t, azzal fogunk csekkolni
			this.level[i] = Math.round(Math.random() * this.typesOfCandies + 1);
		}
	};


	this.drawNewLevel = function() {
		var i;
		var row = $(document.createElement('div'));
		var lines = -1;

		//$('.row').remove();

		for (i = 0; i < this.size; i++) {
			//vegigertunk egy soron
			if (i % this.originalSize === 0) {
				lines++;
			}
			//mapon elhelyezes, random tipus-sal ellatni, (level[i] random elemekkel van, elotte populateLevel meg van hivva)
			row.css({
				top: lines * this.caseHeight,
				left: i % this.originalSize * this.caseHeight,
				height: this.caseHeight,
				width: this.caseHeight
			}).attr({
				"class": 'type-' + this.level[i] + ' row',
				"data-id": i
			});

			this.base.append(row.clone()); //row.clone(), ha nincs ott akkor nem fog a candiesés mukodni, lesznek lyukak
		}

		this.lines = lines+1;
		this.itemByLine = this.size / this.lines;

		//this.bindDraggableEvent();
		//this.releaseGameControl(true);
	};

	this.checkLines = function() {
		var k;
		var counter = 0;

		//reset
		//this.base.find('.row').removeClass('.glow');

		for (k = 0; k < this.size; k++) {
			counter = counter + this.checkCandyAround(this.level[k], k);
		}



		if (counter === this.size) {
			//ha vegigertunk akkor mehet tovabb a jatek

			this.releaseGameControl(true);
			return true;
		} else{
			this.releaseGameControl(false);
			return false;
		}
	};

	this.checkCandyAround = function(candyType, position) {
		//1 vagy 0 visszatérés, hogy hozza tudjuk adni a counterhez(checklines)
		var flag = false;
		var that = this;

		if ( (this.level[position-2] === candyType || this.level[position+2] === candyType) && this.level[position - 1] === candyType && this.level[position + 1] === candyType && (position + 1) % this.lines !== 0 && position % this.lines ){

			this.removeClearedCandyToLevel([position + 2, position, position - 1, position + 1]);


		}else if ( this.level[position - 1] === candyType && this.level[position + 1] === candyType && (position + 1) % this.lines !== 0 && position % this.lines ){

			this.removeClearedCandyToLevel([position, position - 1, position + 1]);

		}
		else {
			flag=true;

		}



		if( (this.level[position - 2*this.itemByLine] === candyType || this.level[position + 2*this.itemByLine] === candyType) && this.level[position - this.itemByLine] === candyType && this.level[position + this.itemByLine] === candyType ) {

			//console.log(position+2*this.itemByLine,position-this.itemByLine,position,position+this.itemByLine);
			this.removeClearedCandyToLevel([position + 2*this.itemByLine,position - this.itemByLine, position, position + this.itemByLine]);

		}else if ( this.level[position - this.itemByLine] === candyType && this.level[position + this.
			itemByLine] === candyType ){

			this.removeClearedCandyToLevel([position - this.itemByLine, position, position + this.itemByLine]);
		}else {
			flag = true;

		}



		if (flag) {
			return 1;
		} else {
			return 0;
		}
	};
	//megkeressuk amikbol kigyult,meghivjuk a torolest
	this.removeClearedCandyToLevel = function(candiesToRemove) {

		var that = this;


		var i;
		//mind3 eltuntese, ha i=1 akkor cask 2 tunik el, ez kellhet az extra elemhez pl bombba TODO:

		for (i = 0; i < candiesToRemove.length; i++) {
			this.level[candiesToRemove[i]] = 0; //ha kitrolom vegtelen ciklus,mert nem fog talalni 0-t
			this.animateRemoveCandies(candiesToRemove[i]);
		}

	};
	//ha kigyult a 3 candy eltuntetese
	this.animateRemoveCandies = function(position) {
		var that = this;

		var difference = this.caseHeight / 2; //amugy sregen tunik el,igy 1 pontban

		this.base.find('.row[data-id='+position+']')
			.attr('data-id', false)
			.addClass('glow').animate({
			marginTop: difference,
			marginLeft: difference,
			height: 0,
			width: 0
		}, 500, function() {

			$(this).remove();
			that.scoreUpdate(100);

		});
		//ha vegeztunk akkor lyukak kitoltese és frissites
		if (that.fillEnd) {
			that.comboUpdate(1);
			that.fillHoles();
		}
	};
	//honnan, sor, oszlop, hova
	this.moveCandies = function(position, line, colPosition, destination) {
		var that = this;

		this.base.find('.row[data-id='+position+']').animate({
			top: Math.abs(line * that.caseHeight)
		}, 100).attr('data-id', destination);	//easing ha van, akkor lehetett volna swing

		this.level[destination] = this.level[position];
		this.level[position] = 0;

		if (line === 1) {
			this.createNewRandomCandy(colPosition);
		}
	};
	//uj candy generálása, melyik oszlopba jelenjen meg
	this.createNewRandomCandy = function(colPosition) {
		var that = this;
		var candy = $(document.createElement('div'));

		this.level[colPosition] = Math.round(Math.random() * this.typesOfCandies + 1);
		//beállitjuk az uj candyt, milyen poziciore keruljon a felso sorban
		candy.addClass('type-' + this.level[colPosition] +' row').css({
			top: -this.caseHeight, //forditva jelennenek meg a andyik, lentrol felfele
			left: colPosition * this.caseHeight, //melyik oszlopba generálja
			height: this.caseHeight,
			width: this.caseHeight,
			opacity: 0
		}).attr({
			"data-id": colPosition
		});

		candy.appendTo(this.base);

		candy.animate({
			top: 0,
			opacity: 1
		},200);

		this.bindDraggableEvent();
	};
	//ha keletkezett lyuk, akkor toltsuk ki
	this.fillHoles = function(){
		var i;
		var counter = 0;
		//addig nem lehet jatszani
		this.releaseGameControl(false);

		this.fillEnd = false;

		for (i = 0; i < this.level.length; i++) {

			//pl 12x12-es esetén under=13
			var under = i + this.originalSize;
			//lineposition = 1
			var linePosition = Math.floor(under / this.originalSize);
			//colposition = 13 - 12 = 1
			var colPosition = under - Math.floor(linePosition * this.originalSize);

			//level[13]===0 and level[i] !==0


			if (this.level[under] === 0 && this.level[i] !== 0) {
				//candyzuhatag
				if (this.level[under] === 0 && this.level[under] !== undefined) {
					this.moveCandies(i, linePosition, colPosition, under);
				}

				break;
				//0-t pont azert nem vettuk bele a tombbe, hogy tudjuk ellenorozni most,0-ra allitjuk ha kigyult min 3
			} else if (this.level[i] === 0) {
				this.createNewRandomCandy(colPosition);
			} else if (this.level[i] !== 0) {
				counter++;
			}
		}

		//console.log(this.level.length, counter);

		if (this.level.length === counter) {
			//nem maradt tobb lyuk, egyebkent meghivjuk megint
			this.fillEnd = true;
			return setTimeout($.proxy(this.checkLines, this), 50);
		} else {
			return setTimeout($.proxy(this.fillHoles, this), 50);
		}
	};

	//pont frissitese
	this.scoreUpdate = function(score){
		this.score = Math.floor(this.score + score / 3);
		this.ui.find('.score').text(this.score); //megkeressuk a score mezot, beállítjuk az uj értéket
	};
	//kombo és legtobb kombo frissítése
	this.comboUpdate = function(combo){

		if (combo > 0) {
			this.combo = this.combo + combo;
			this.ui.find('.combo').text(this.combo);
		} else {
			this.combo = 0;
		}

		if (this.combo >= this.bestCombo) {
			this.bestCombo = this.combo;
			this.ui.find('.bestCombo').text(this.bestCombo);
		}
	};
};

//ido csokkentése, ha letelik beletesszuk localba eredményt
function time_count() {

	time--;
	// kijelezzuk az aktualis idot
	$('#time').text(time);
	// amennyiben lejart az ido, akkor nem hivjuk meg tovabbra is az idozitest
	if (time === 0) {
		clearInterval(tc);
		// bekerjuk a jatekos nevet a toplistahoz
		var person = prompt("Adja meg a nevét:", "anonymus");
		// eltaroljuk localStorage-ben az aktualis jatekos klikkeleseinek szamat
		let eredmeny = this.score.innerText.split(":"); //objektum, innerhtml-je "Score:245"
		console.log(eredmeny[1]);
		localStorage.setItem(person, Number(eredmeny[1]));




		// feltoltjuk a toplistat
		fill_toplist();
	}
}
//ha már letelt az ido akkor ranglista megjelenitese
function fill_toplist() {
	// vegigmegyunk a localStorage mentett elemein es egy uj tombbe pakoljuk. asszociativ tomb
	var data = [];
	for (var i = 0; i < localStorage.length; i++) {
		data[i] = [localStorage.key(i), parseInt(localStorage.getItem(localStorage.key(i)))];
		console.log(data[i][1]);
	}
	// csokkeno sorrendbe rendezzuk az elemeket az elert pontszam alapjan
	data.sort(function (a, b) {
		return b[1] - a[1];
	});
	// a 10 legtobb pontot elert jatekost jelezzuk ki a listan
	for (let act_data of data.keys()) {
		if (act_data < 10) {
			$('#list').append(data[act_data][0] + ' - ' + data[act_data][1] + '<br><hr>');
		}
	}

}


$(document).ready(function() {
	var $game = $('#game');
	var $ui = $('#ui');

	$('.message button').on('click', function(event) {
		event.preventDefault(); //If this method is called, the default action of the event will not be triggered.(indít)
		var value = +$(this).val(); //Get the current value of the first element in the set of matched elements.
		$('.message').hide();
		//console.log(value);
		newGame = new Game();
		newGame.init(value, $game, $ui); //size,base,ui, ha nincs ott a $ és + akkor végtelen elemgenerálás,azért mert objektumokat tárol

	});


	//zenehez tartozik


	var audioElement = document.createElement('audio');
	audioElement.setAttribute('src', 'http://www.soundjay.com/misc/sounds/bell-ringing-01.mp3');

	audioElement.addEventListener('ended', function() {
		this.play();
	}, false);

	audioElement.addEventListener("canplay",function(){
		$("#length").text("Duration:" + audioElement.duration + " seconds");
		$("#source").text("Source:" + audioElement.src);
		$("#status").text("Status: Ready to play").css("color","green");
	});

	audioElement.addEventListener("timeupdate",function(){
		$("#currentTime").text("Current second:" + audioElement.currentTime);
	});

	$('#play').click(function() {
		audioElement.play();
		$("#status").text("Status: Playing");
	});

	$('#pause').click(function() {
		audioElement.pause();
		$("#status").text("Status: Paused");
	});

	$('#restart').click(function() {
		audioElement.currentTime = 0;
	});

	//eddig zene

	//ranglista
	$('#time').text(time);
	tc = setInterval(time_count, 1000);





});