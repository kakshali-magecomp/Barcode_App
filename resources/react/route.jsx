import { Route, Routes } from "react-router-dom";
import React from "react";
import IndexPage from "./pages/Dashboard/index";
import Templateslist from "./pages/Templates/list";
import GeneratePrint from "./pages/GeneratePrint/index";
import ImportBarcode from './pages/ImportBarcode/index';
import Layout from "./pages/Settings/layout";
import StockPO from "./pages/StockPO/index";
import Subscription from "./pages/Subscription/index"
import GetMoreLabel from "./pages/GetMoreLabel/index";
import UserPermission from "./pages/UserPermission/index";
import CreateTemplate from "./pages/Templates/create";

const AppRoute = () => {
	return (
		<Routes>
			<Route path="/" element={<IndexPage />} />
			<Route path="/Templateslist" element={<Templateslist />} />
			<Route path="/CreateTemplate" element={< CreateTemplate />}/>
			<Route path="/Generateprint" element={<GeneratePrint />} />
			<Route path="/ImportBarcode" element={<ImportBarcode />} />
			<Route path="/layout" element={<Layout />} />
			<Route path="/stockpo" element={<StockPO />} />
			<Route path="/Subscription" element={<Subscription />} />
			<Route path="/GetMoreLabel" element={<GetMoreLabel />} />		
			<Route path="/UserPermission" element={<UserPermission />} />
		</Routes>
	);
};

export default AppRoute;