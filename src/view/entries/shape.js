import { registerMotion } from '../global-registry';
import { boxMotion, circleMotion } from '../shape';

registerMotion( 'circle', circleMotion );
registerMotion( 'box', boxMotion );
