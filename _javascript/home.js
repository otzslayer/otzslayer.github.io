import { basic, initSidebar, initTopbar } from './modules/layouts';
import { initLocaleDatetime, loadImg, getClapCounts } from './modules/plugins';

loadImg();
initLocaleDatetime();
initSidebar();
initTopbar();
basic();
getClapCounts();
