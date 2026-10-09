/**
 * Creates a paused animation that the scroll position seeks.
 *
 * @param {Element}  target    Animated element.
 * @param {Object[]} keyframes Keyframes with offsets.
 * @param {number}   duration  Duration of the timeline in ms.
 * @return {Animation} Paused animation at its start.
 */
export function createPausedAnimation( target, keyframes, duration ) {
	const animation = target.animate( keyframes, {
		duration,
		fill: 'both',
		easing: 'linear',
	} );
	animation.pause();
	animation.currentTime = 0;
	return animation;
}

/**
 * Sets the progress of all animations of a timeline.
 *
 * @param {{duration: number, animations: Animation[]}} timeline Timeline.
 * @param {number}                                      progress Progress from 0 to 1.
 */
export function seekTimeline( timeline, progress ) {
	const time = progress * timeline.duration;
	for ( const animation of timeline.animations ) {
		animation.currentTime = time;
	}
}

/**
 * Cancels all animations of a timeline.
 *
 * @param {{animations: Animation[]}|null} timeline Timeline.
 */
export function cancelTimeline( timeline ) {
	timeline?.animations.forEach( ( animation ) => animation.cancel() );
}
