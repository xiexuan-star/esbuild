import { createSSRApp } from 'vue';
import './index.css';

import App from './App.vue';

// @ts-ignore
const data = window.__SSR_DATA__;

const app = createSSRApp(App, data);

app.mount('#app');
