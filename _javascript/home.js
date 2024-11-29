import { basic, initSidebar, initTopbar } from './modules/layouts';
import { initLocaleDatetime, loadImg, getClapCounts } from './modules/components';

loadImg();
initLocaleDatetime();
initSidebar();
initTopbar();
basic();
getClapCounts();
