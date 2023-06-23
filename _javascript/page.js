import { basic, initSidebar, initTopbar } from './modules/layouts';
import { imgLazy, imgPopup, initClipboard, getClapCounts } from './modules/plugins';

basic();
initSidebar();
initTopbar();
imgLazy();
imgPopup();
initClipboard();
getClapCounts();
