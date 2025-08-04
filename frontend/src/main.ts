import './style.css';
import './components/App';

// Bootstrap the app
const appElement = document.querySelector<HTMLDivElement>('#app');
if (appElement) {
  appElement.innerHTML = '<app-root></app-root>';
} else {
  throw new Error('Could not find #app element in DOM');
}