 import { Route, Routes } from "react-router-dom";
	import React from "react";
	import TamplateCreate from "./pages/Template/create";
	import TemplateList from "./pages/Template/List";
	import Settingindex from "./pages/Settings/index";
	import BarcodeSkuPanel from "./pages/Settings/BarcodeSkuPanel";
	import SkuSettingsIndex from "./pages/Settings/SkuSettingsIndex";
	import ProductsList from "./pages/ProductsList";
	import Dashboard from "./pages/Dashboard";
	import EditTemplate from "./pages/Template/Edit";
	import DesignCanvas from "./pages/Template/DesignCanvas";
	import LabelHistory from "./pages/LabelHistory/index";


	const AppRoute = () => {
	    return (
		<Routes>
			<Route path="/" element={<Dashboard/>} />
			<Route path='/TemplateList' element={<TemplateList/>} />
		    <Route path="/TamplateCreate" element={<TamplateCreate/>} />
			<Route path="/templates/edit/:id" element={<EditTemplate/>} />
            <Route path="/templates/design/:id" element={<DesignCanvas />} />
		    <Route path="/Settingindex" element={<Settingindex/>} />
			<Route path="/BarcodeSkuPanel" element={<BarcodeSkuPanel/>} />
			<Route path="/SkuSettingsIndex" element={<SkuSettingsIndex/>} />
			<Route path="/ProductsList" element={<ProductsList/>} />
			<Route path="/LabelHistory" element={<LabelHistory/>} />
		</Routes>
	    );
	};

	export default AppRoute;