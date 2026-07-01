import { NavMenu } from '@shopify/app-bridge-react';
	import { AppProvider } from '@shopify/polaris';
	import React, { StrictMode } from 'react';
	import ReactDOM, { createRoot } from 'react-dom/client';
	import enTranslations from '@shopify/polaris/locales/en.json';
	import { BrowserRouter as Router } from 'react-router-dom';
	import AppRoute from './route';
	import ProductsList from './pages/ProductsList';

	import '@shopify/polaris/build/esm/styles.css';


	const App = () => {
	    return (
		<AppProvider i18n={enTranslations}>
		    <Router>
		        <NavMenu>
					<a href='/Settingindex'>Setting</a>
					<a href='/ProductsList'>Products List</a>
		        </NavMenu>
		        <AppRoute />
		    </Router>
		</AppProvider>

	    );
	};

	const appdiv = document.getElementById('app');
	const root = createRoot(appdiv);
	root.render(<App />);