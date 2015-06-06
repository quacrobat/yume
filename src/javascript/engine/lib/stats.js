"use strict";
/**
 * see https://github.com/mrdoob/stats.js
 */
function Stats() {
	
	var now = ( global.performance && global.performance.now ) ? global.performance.now.bind( global.performance ) : Date.now;

	var startTime = now(), prevTime = startTime;
	var ms = 0, msMin = Infinity, msMax = 0;
	var fps = 0, fpsMin = Infinity, fpsMax = 0;
	var frames = 0, mode = 0;
	var bar = null;
	
	function createElement( tag, id, css ) {
		var element = global.document.createElement( tag );
		element.id = id;
		element.style.cssText = css;
		return element;
	}

	var container = createElement( 'section', 'stats', 'width:80px;cursor:pointer;position:absolute;top:0px;left:0px;' );
	container.addEventListener( 'mousedown', function ( event ) { event.preventDefault(); setMode( ++ mode % 2 ); }, false );

	var fpsDiv = createElement( 'div', 'fps', 'padding:0 0 3px 3px;text-align:left;background-color:#20252f;border-radius: 5px;' );
	container.appendChild( fpsDiv );

	var fpsText = createElement( 'div', 'fpsText', 'color:#ffffff;font-size:10px;' );
	fpsText.innerHTML = 'FPS';
	fpsDiv.appendChild( fpsText );

	var fpsGraph = createElement( 'div', 'fpsGraph', 'position:relative;width:74px;height:30px;background-color:#6083c2' );
	fpsDiv.appendChild( fpsGraph );

	while ( fpsGraph.children.length < 74 ) {

		bar = createElement( 'span', '', 'width:1px;height:30px;float:left;background-color:#20252f' );
		fpsGraph.appendChild( bar );
	}

	var msDiv = createElement( 'div', 'ms', 'padding:0 0 3px 3px;text-align:left;background-color:#20252f;display:none;border-radius: 5px;' );
	container.appendChild( msDiv );
	
	var msText = createElement( 'div', 'msText', 'color:#ffffff;font-size:10px;' );
	msText.innerHTML = 'MS';
	msDiv.appendChild( msText );

	var msGraph = createElement( 'div', 'msGraph', 'position:relative;width:74px;height:30px;background-color:#f3f4f6' );
	msDiv.appendChild( msGraph );

	while ( msGraph.children.length < 74 ) {

		bar = createElement( 'span', '', 'width:1px;height:30px;float:left;background-color:#20252f' );
		msGraph.appendChild( bar );

	}

	var setMode = function ( value ) {

		mode = value;

		switch ( mode ) {

			case 0:
				fpsDiv.style.display = 'block';
				msDiv.style.display = 'none';
				break;
			case 1:
				fpsDiv.style.display = 'none';
				msDiv.style.display = 'block';
				break;
		}

	};

	var updateGraph = function ( dom, value ) {

		var child = dom.appendChild( dom.firstChild );
		child.style.height = value + 'px';

	};

	return {

		REVISION: 13,

		domElement: container,

		setMode: setMode,

		begin: function () {

			startTime = now();

		},

		end: function () {

			var time = now();

			ms = time - startTime;
			msMin = Math.min( msMin, ms );
			msMax = Math.max( msMax, ms );

			/*jslint bitwise: true */msText.textContent = ( ms | 0 ) + ' MS (' + ( msMin | 0 ) + '-' + ( msMax | 0 ) + ')';
			updateGraph( msGraph, Math.min( 30, 30 - ( ms / 200 ) * 30 ) );

			frames ++;

			if ( time > prevTime + 1000 ) {

				fps = Math.round( ( frames * 1000 ) / ( time - prevTime ) );
				fpsMin = Math.min( fpsMin, fps );
				fpsMax = Math.max( fpsMax, fps );

				fpsText.textContent = fps + ' FPS (' + fpsMin + '-' + fpsMax + ')';
				updateGraph( fpsGraph, Math.min( 30, 30 - ( fps / 100 ) * 30 ) );

				prevTime = time;
				frames = 0;

			}

			return time;

		},

		update: function () {

			startTime = this.end();

		}

	};
}

module.exports = Stats;