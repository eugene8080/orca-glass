// Dev-only stand-in for the Even Hub SDK so the phone page can be reviewed in an
// ordinary browser (scripts/phone-preview.mjs). Glasses calls succeed and draw
// nothing; storage uses the browser's localStorage. Never bundled into the app.
class Property { constructor(value: object) { Object.assign(this, value); } }
export const CreateStartUpPageContainer = Property, ListContainerProperty = Property, ListItemContainerProperty = Property,
  MenuContainerProperty = Property, MenuItemProperty = Property, ImageContainerProperty = Property, ImageRawDataUpdate = Property,
  RebuildPageContainer = Property, TextContainerProperty = Property, TextContainerUpgrade = Property;
export const ImageRawDataUpdateResult = { success: 'success' };
export const AudioInputSource = { Glasses: 0 };
export const OsEventTypeList = { CLICK_EVENT: 0, SCROLL_TOP_EVENT: 1, SCROLL_BOTTOM_EVENT: 2, DOUBLE_CLICK_EVENT: 3,
  FOREGROUND_ENTER_EVENT: 4, FOREGROUND_EXIT_EVENT: 5, ABNORMAL_EXIT_EVENT: 6, SYSTEM_EXIT_EVENT: 7, LONG_PRESS_EVENT: 9, LONG_PRESS_RELEASE_EVENT: 10 };
export type EvenAppBridge = typeof bridge;
export type EvenHubEvent = Record<string, unknown>;
const bridge = {
  getLocalStorage: async (key: string) => localStorage.getItem(`orca-glass-preview:${key}`) ?? '',
  setLocalStorage: async (key: string, value: string) => { localStorage.setItem(`orca-glass-preview:${key}`, value); return true; },
  createStartUpPageContainer: async () => 0,
  rebuildPageContainer: async () => true,
  textContainerUpgrade: async () => true,
  updateImageRawData: async () => 'success',
  audioControl: async () => false,
  onEvenHubEvent: () => () => {},
};
export const waitForEvenAppBridge = async () => bridge;
