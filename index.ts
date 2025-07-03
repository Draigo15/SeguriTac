import { registerRootComponent } from 'expo';
import App from './App';

// 👉 Agrega esto:
import { loadWebStyles } from './src/utils/loadWebStyles';
loadWebStyles();

// 👉 Luego registra el componente como siempre:
registerRootComponent(App);