import { basic, initSidebar, initTopbar } from './modules/layouts';
import { initLocaleDatetime, loadImg, getClapCounts } from './modules/plugins';

basic();
initSidebar();
initTopbar();
initLocaleDatetime();
loadImg();
getClapCounts();
