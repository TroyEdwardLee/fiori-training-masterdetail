sap.ui.define([
	"fiori/training/masterdetail/common/BaseController",
	"sap/ui/Device",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function(Controller, Device, JSONModel, Filter, FilterOperator) {
	"use strict";

	return Controller.extend("fiori.training.masterdetail.controller.Master", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf fiori.training.masterdetail.view.Master
		 */
		onInit: function() {
			this.oDataModel = this.getOwnerComponent().getModel();
			var oEventBus = this.getOwnerComponent().getEventBus();
			oEventBus.subscribe("fetchEmployeeData", this._fetchEmployeeData, this);
			this.oView.setModel(new JSONModel({
				"sQueryStr": ""
			}), "viewModel");
			this.oViewModel = this.oView.getModel("viewModel");
			this.oView.setModel(new JSONModel({
				"Employees": []
			}), "businessModel");
			this.oBusinessModel = this.oView.getModel("businessModel");
			this.getRouter().getRoute("master").attachPatternMatched(this._onRouteMatched, this);
		},

		_onRouteMatched: function(oEvent) {},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf fiori.training.masterdetail.view.Master
		 */
		onAfterRendering: function() {
			this._fetchEmployeeData();
		},
		
		onSearch: function() {
			this._fetchEmployeeData();
		},
		
		handleRefreshPress: function() {
			// this.oViewModel.setProperty("/sQueryStr", "");
			this._fetchEmployeeData();
		},
		
		_fetchEmployeeData: function() {
			var aFilter = [];
			var sQueryStr = this.oViewModel.getProperty("/sQueryStr").trim();
			if (sQueryStr && sQueryStr.length) {
				var	oFilter = new Filter({
					filters: [
						new Filter({
							path: "Id",
							operator: FilterOperator.EQ,
							value1: sQueryStr
						}),
						new Filter({
							path: "Name",
							operator: FilterOperator.EQ,
							value1: sQueryStr
						})
					],
					and: false
				});
				aFilter.push(oFilter);
			}
			this.oBusinessModel.setProperty("/Employees", []);
			if (!Device.support.touch) {
				this.oView.byId("masterListId").setBusy(true);
			}
			this.oDataModel.read("/ZEMPLOYEEINFOSet", {
				groupId: "employeeData",
				filters: aFilter,
				success: function(oData) {
					this.oView.byId("masterListId").setBusy(false);
					this.oView.byId("pullToRefresh").hide();
					this.oBusinessModel.setProperty("/Employees", oData.results);
				}.bind(this),
				error: function() {
					this.oView.byId("masterListId").setBusy(false);
					this.oView.byId("pullToRefresh").hide();
					sap.m.MessageBox.error("Load data failed.");
				}.bind(this)
			});
		},

		handleListUpdateFinished: function(oEvent) {
			this.oView.byId("masterListId").removeSelections(true);
			if (!Device.system.phone) {
				this._selectFirstItem();
			}
		},
		
		_selectFirstItem: function() {
			var oList = this.oView.byId("masterListId"),
				aItem = oList.getItems() ? oList.getItems() : [];
			if (aItem && aItem.length > 0) {
				oList.setSelectedItem(aItem[0]);
				oList.fireSelectionChange({
					listItem: aItem[0],
					listItems: [aItem[0]],
					selected: true,
					selectAll: false
				});
			} else if (!Device.system.phone && !aItem.length) {
				this.getRouter().navTo("notFound", {}, true);
			}
		},
		
		handleListSelectionChange: function(oEvent) {
			var oSelectedItem = oEvent.getParameter("listItem"),
				oSelectedItemData = oSelectedItem.getBindingContext("businessModel").getProperty();
			this.getRouter().navTo("detail", {
				EmployeeID: oSelectedItemData.Id
			}, Device.system.desktop);
		}

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf fiori.training.masterdetail.view.Master
		 */
		//	onExit: function() {
		//
		//	}

	});

});