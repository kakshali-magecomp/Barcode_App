import { NavMenu } from '@shopify/app-bridge-react';
import { AppProvider, Frame } from '@shopify/polaris';
import React, { StrictMode } from 'react';
import ReactDOM, { createRoot } from 'react-dom/client';
import enTranslations from '@shopify/polaris/locales/en.json';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoute from './route';
import '@shopify/polaris/build/esm/styles.css';


const App = () => {
	return (
		<AppProvider i18n={enTranslations}>
			<Frame>
			<Router>
				<NavMenu>
					<a href="/">Dashboard</a>
					<a href="/Templateslist">Templates</a>
					<a href="/Generateprint">Generate & Print</a>
					<a href="/ImportBarcode">Import Barcode & SKUs</a>
					<a href="/layout">Setting</a>
					<a href="/stockpo">Stocky PO</a>
					<a href="/Subscription">Subscription</a>
					<a href="/GetMoreLabel">Get More Labels</a>
					<a href="/UserPermission">User Permission</a>
				</NavMenu>
				<AppRoute />
			</Router>
			</Frame>
		</AppProvider>
	);
};

const appdiv = document.getElementById('app');
const root = createRoot(appdiv);
root.render(<App />);