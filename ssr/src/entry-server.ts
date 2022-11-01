import { createVNode } from 'vue';
import App from './App.vue';

import './index.css';

function ServerEntry(data:Record<string, any>) {
  return createVNode(App,data);
}

export { ServerEntry };
