import { basic, initSidebar, initTopbar } from './modules/layouts';
import { initLocaleDatetime, imgLazy, getClapCounts } from './modules/plugins';

basic();
initSidebar();
initTopbar();
initLocaleDatetime();
imgLazy();
getClapCounts();