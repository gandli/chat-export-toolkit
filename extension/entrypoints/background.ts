import { registerBackgroundMessageListener } from '../src/background/main';

export default defineBackground(() => {
  registerBackgroundMessageListener();
});
