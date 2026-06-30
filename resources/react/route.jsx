 import { Route, Routes } from "react-router-dom";
	import ListPage from "./pages/list";
	import React from "react";
	import IndexPage from "./pages";
	import TamplateCreate from "./pages/Template/create";
	import Settingindex from "./pages/Settings/index";
	import BarcodeSkuPanel from "./pages/Settings/BarcodeSkuPanel";
	import SkuSettingsIndex from "./pages/Settings/SkuSettingsIndex";


	const AppRoute = () => {
	    return (
		<Routes>
		    <Route path="/" element={<TamplateCreate/>} />
		    <Route path="/Settingindex" element={<Settingindex/>} />
			<Route path="/BarcodeSkuPanel" element={<BarcodeSkuPanel/>} />
			<Route path="/SkuSettingsIndex" element={<SkuSettingsIndex/>} />
		</Routes>
	    );
	};

	export default AppRoute;