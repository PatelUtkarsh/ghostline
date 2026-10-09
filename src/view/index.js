import { cancelTimeline, seekTimeline } from './animate';
import { applyOptionStyles, readOptions } from './options';
import { prefersReducedMotion } from './reduced-motion';
import { RUNTIME_MOTIONS } from './registry';
import { getLayoutTop, getScrollProgress, stepProgress } from './scroll';
import { getStartTime } from './timing';
import '../style.scss';

const SELECTOR = '.ghostline[data-ghostline-motion]';

// Longest frame gap that counts as motion time, so a background tab does
// not jump the motion.
const MAX_FRAME = 64;

function isSupported() {
	return (
		'ResizeObserver' in window &&
		typeof window.Element.prototype.animate === 'function'
	);
}

function setState( element, progress ) {
	let state = 'playing';
	if ( progress <= 0 ) {
		state = 'ready';
	} else if ( progress >= 1 ) {
		state = 'done';
	}

	if ( element.dataset.ghostlineState !== state ) {
		element.dataset.ghostlineState = state;
	}
}

function collectItems() {
	const items = [];

	for ( const element of document.querySelectorAll( SELECTOR ) ) {
		const name = element.dataset.ghostlineMotion;
		if (
			! Object.hasOwn( RUNTIME_MOTIONS, name ) ||
			element.dataset.ghostlineState
		) {
			continue;
		}

		const options = readOptions( element );
		applyOptionStyles( element, options );
		items.push( {
			element,
			name,
			motion: null,
			options,
			context: null,
			timeline: null,
			progress: 0,
			startAt: null,
		} );
	}

	return items;
}

/**
 * Shows the final state for reduced motion, and keeps it correct when the
 * layout changes.
 *
 * @param {Object[]} items Instances.
 */
function initReducedMotion( items ) {
	const show = () => {
		for ( const { element, motion } of items ) {
			motion.showFinal( element );
			setState( element, 1 );
		}
	};

	show();
	new window.ResizeObserver( show ).observe( document.body );
	document.fonts?.ready.then( show );
}

/**
 * Links each motion to the scroll position.
 *
 * @param {Object[]} items Instances.
 */
function initScrollMotion( items ) {
	let frame = 0;
	let lastFrameTime = 0;
	let lastStart = -Infinity;

	const build = ( item ) => {
		cancelTimeline( item.timeline );
		item.timeline = item.motion.build( item.element, item.context );
		seekTimeline( item.timeline, item.progress );
	};

	/**
	 * Moves one instance toward its scroll target.
	 *
	 * @param {Object} item           Instance.
	 * @param {number} now            Frame time in ms.
	 * @param {number} elapsed        Time since the last frame in ms.
	 * @param {number} viewportHeight Viewport height in px.
	 * @return {boolean} Whether the instance needs more frames.
	 */
	const update = ( item, now, elapsed, viewportHeight ) => {
		const { element, options, timeline } = item;
		const scrollTarget = getScrollProgress(
			getLayoutTop( element ),
			viewportHeight
		);

		// The delay and the stagger hold the start after the text begins to
		// enter the view.
		if ( scrollTarget <= 0 ) {
			item.startAt = null;
		} else if ( item.startAt === null ) {
			item.startAt = getStartTime( now, options.delay, lastStart );
			lastStart = item.startAt;
		}

		const waiting = item.startAt !== null && now < item.startAt;
		const target = waiting ? 0 : scrollTarget;

		const rect = element.getBoundingClientRect();
		const inView = rect.bottom > 0 && rect.top < viewportHeight;

		// Out of view, nothing shows the motion, so jump to the target.
		const next = inView
			? stepProgress( item.progress, target, elapsed, timeline.duration )
			: target;

		if ( next !== item.progress ) {
			item.progress = next;
			seekTimeline( timeline, next );
			setState( element, next );
		}

		return waiting || item.progress !== target;
	};

	const tick = ( now ) => {
		frame = 0;
		const elapsed = lastFrameTime
			? Math.min( now - lastFrameTime, MAX_FRAME )
			: 16;
		const viewportHeight = window.innerHeight;
		const active = items
			.map( ( item ) => update( item, now, elapsed, viewportHeight ) )
			.includes( true );

		if ( active ) {
			lastFrameTime = now;
			frame = window.requestAnimationFrame( tick );
		} else {
			lastFrameTime = 0;
		}
	};

	const schedule = () => {
		if ( ! frame ) {
			frame = window.requestAnimationFrame( tick );
		}
	};

	const rebuildAll = () => {
		items.forEach( build );
		schedule();
	};

	for ( const item of items ) {
		item.context = item.motion.prepare( item.element, item.options );
		build( item );
		setState( item.element, 0 );
	}

	window.addEventListener( 'scroll', schedule, { passive: true } );

	// Text wraps again when its block changes width.
	const widths = new WeakMap();
	const resizeObserver = new window.ResizeObserver( ( entries ) => {
		const changed = entries.some( ( entry ) => {
			const previous = widths.get( entry.target );
			widths.set( entry.target, entry.contentRect.width );
			return (
				previous !== undefined && previous !== entry.contentRect.width
			);
		} );
		if ( changed ) {
			rebuildAll();
		} else {
			schedule();
		}
	} );
	for ( const { element } of items ) {
		resizeObserver.observe( element.parentElement ?? element );
	}

	document.fonts?.ready.then( rebuildAll );

	// Wait one frame, so text that is in view at load shows its start state
	// before the motion plays.
	window.requestAnimationFrame( schedule );
}

function init() {
	if ( ! isSupported() ) {
		return;
	}

	// An instance whose motion script is not on the page keeps its plain
	// text, which is the final state.
	const items = collectItems().filter( ( item ) => {
		item.motion = RUNTIME_MOTIONS[ item.name ]();
		return !! item.motion;
	} );

	if ( ! items.length ) {
		return;
	}

	if ( prefersReducedMotion() ) {
		initReducedMotion( items );
	} else {
		initScrollMotion( items );
	}
}

// Start after DOMContentLoaded: all deferred scripts, including the
// separate motion scripts, have run by then.
const navigation = window.performance.getEntriesByType?.( 'navigation' )[ 0 ];
if (
	document.readyState === 'loading' ||
	( navigation && ! navigation.domContentLoadedEventStart )
) {
	document.addEventListener( 'DOMContentLoaded', init, { once: true } );
} else {
	init();
}
