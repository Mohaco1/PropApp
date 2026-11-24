import css from './styles.css';
import { start } from './app.js';
import './views/welcome.js';
import './views/today.js';
import './views/actions.js';
import './views/visit.js';
const st = document.createElement('style'); st.textContent = css; document.head.append(st);
start(document.getElementById('app'));
