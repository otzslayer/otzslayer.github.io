import { basic, initSidebar, initTopbar } from './modules/layouts';
import { categoryCollapse, getClapCountsForCats} from './modules/plugins';

basic();
initSidebar();
initTopbar();
categoryCollapse();
getClapCountsForCats();
