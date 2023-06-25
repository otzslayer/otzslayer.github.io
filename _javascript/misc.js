import { basic, initSidebar, initTopbar } from './modules/layouts';
import { initLocaleDatetime, getClapCountsForCats } from './modules/plugins';

basic();
initSidebar();
initTopbar();
initLocaleDatetime();
getClapCountsForCats();
