import '@fontsource/cinzel/700.css';
import '@fontsource/cinzel/900.css';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import './styles/app.css';
import { render } from 'preact';
import { App } from './ui/App';

render(<App />, document.getElementById('app')!);
