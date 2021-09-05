sap.ui.define([
	"fiori/training/masterdetail/common/BaseController",
	"sap/ui/Device",
	"sap/ui/model/json/JSONModel"
], function(Controller, Device, JSONModel) {
	"use strict";

	return Controller.extend("fiori.training.masterdetail.controller.Master", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf fiori.training.masterdetail.view.Master
		 */
		onInit: function() {
			this.oDataModel = this.getOwnerComponent().getModel();
			this.oView.setModel(new JSONModel({
				"Employees": []
			}), "businessModel");
			this.oBusinessModel = this.oView.getModel("businessModel");
			this.getRouter().getRoute("master").attachPatternMatched(this._onRouteMatched, this);
		},

		_onRouteMatched: function(oEvent) {
			this._fetchEmployeeData();
			/*
			 * Navigate to the first item by default only on desktop and tablet (but not phone).
			 * Note that item selection is not handled as it is
			 * out of scope of this sample
			 */
			if (!Device.system.phone) {
				this.getRouter().navTo("detail", {
					employeeId: 0
				}, true);
			}
		},

		_fetchEmployeeData: function() {
			this.oBusinessModel.setProperty("/Employees", []);
			this.oDataModel.read("/ZEMPLOYEEINFOSet", {
				groupId: "employeeData",
				success: function(oData) {
					this.oBusinessModel.setProperty("/Employees", oData.results);
				}.bind(this),
				error: function() {
					sap.m.MessageBox.error("Load data failed.");
				}
			});
		}

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf fiori.training.masterdetail.view.Master
		 */
		//	onBeforeRendering: function() {
		//
		//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf fiori.training.masterdetail.view.Master
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf fiori.training.masterdetail.view.Master
		 */
		//	onExit: function() {
		//
		//	}

	});

});