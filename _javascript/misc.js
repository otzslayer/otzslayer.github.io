import { basic, initSidebar, initTopbar } from './modules/layouts';
import { initLocaleDatetime, getClapCountsForCats } from './modules/plugins';

initSidebar();
initTopbar();
initLocaleDatetime();
getClapCountsForCats();
basic();
