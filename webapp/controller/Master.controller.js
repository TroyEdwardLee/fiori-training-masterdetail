sap.ui.define([
	"fiori/training/masterdetail/common/BaseController",
	"sap/ui/Device",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/Fragment"
], function(Controller, Device, JSONModel, Filter, FilterOperator, Fragment) {
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
				"sQueryStr": "",
				"maintainEmployee": {
					"Id": "",
					"Name": "",
					"Age": null,
					"Birthdate": null,
					"Address": ""
				}
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
			this.oView.byId("masterListId").setBusy(true);
			this.oDataModel.read("/ZEMPLOYEEINFOSet", {
				groupId: "employeeData",
				filters: aFilter,
				success: function(oData) {
					this.oView.byId("masterListId").setBusy(false);
					this.oBusinessModel.setProperty("/Employees", oData.results);
				}.bind(this),
				error: function() {
					this.oView.byId("masterListId").setBusy(false);
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
		},
		
		handleAddPress: function() {
			var oView = this.oView;
			// create dialog lazily
			if (!this._oAddDialog) {
				Fragment.load({
					id: oView.getId(),
					name: "fiori.training.masterdetail.fragment.AddDialog",
					controller: this
				}).then(function(oDialog) {
					this._oAddDialog = oDialog;
					// connect dialog to the root view of this component (models, lifecycle)
					oView.addDependent(oDialog);
					oDialog.open();
				}.bind(this));
			} else {
				this._oAddDialog.open();
			}
		},
		
		handleConfirmAdd: function() {
			var oEmployee = this.oViewModel.getProperty("/maintainEmployee");
			this._oAddDialog.setBusy(true);
			this.oDataModel.create("/ZEMPLOYEEINFOSet", oEmployee, {
				groupId: "addEmployee",
				success: function(oRes) {
					this._oAddDialog.setBusy(false);
					this._oAddDialog.close();
					sap.m.MessageToast.show("Add Employee info successfully.");
					this._fetchEmployeeData();
				}.bind(this),
				error: function(error) {
					this._oAddDialog.setBusy(false);
					sap.m.MessageBox.error("Add Employee info failed.");
				}.bind(this)
			});
		},
		
		handleCancelOpreation: function(oEvent) {
			var oSource = oEvent.getSource();
			oSource.getParent().close();
		},
		
		handleAddDialogAfterOpen: function() {
			this.oViewModel.setProperty("/maintainEmployee/Id", this.generateGuid());
		},
		
		handleAddDialogAfterClose: function() {
			this.oViewModel.setProperty("/maintainEmployee", {
				"Id": "",
				"Name": "",
				"Age": null,
				"Birthdate": "",
				"Address": ""
			});
		},
		
		handleEditPress: function() {
			var oView = this.oView,
				oMasterList = oView.byId("masterListId"),
				oItem = oMasterList.getSelectedItem();
			if  (!oItem) {
				sap.m.MessageBox.error("Please selected a item at least.");
				return;
			}
			var oSelectedData = oItem.getBindingContext("businessModel").getProperty();
			delete oSelectedData.__metadata;
			this.oViewModel.setProperty("/maintainEmployee", oSelectedData);
			// create dialog lazily
			if (!this._oEditDialog) {
				Fragment.load({
					id: oView.getId(),
					name: "fiori.training.masterdetail.fragment.EditDialog",
					controller: this
				}).then(function(oDialog) {
					this._oEditDialog = oDialog;
					// connect dialog to the root view of this component (models, lifecycle)
					oView.addDependent(oDialog);
					oDialog.open();
				}.bind(this));
			} else {
				this._oEditDialog.open();
			}
		},
		
		handleConfirmEdit: function() {
			var oEmployee = this.oViewModel.getProperty("/maintainEmployee");
			this._oEditDialog.setBusy(true);
			this.oDataModel.update("/ZEMPLOYEEINFOSet('" + oEmployee.Id + "')", oEmployee, {
				groupId: "updateEmployee",
				success: function(oRes) {
					this._oEditDialog.setBusy(false);
					this._oEditDialog.close();
					sap.m.MessageToast.show("Update Employee info successfully.");
					this._fetchEmployeeData();
				}.bind(this),
				error: function(error) {
					this._oEditDialog.setBusy(false);
					sap.m.MessageBox.error("Update Employee info failed.");
				}
			});
		},
		
		handleDelPress: function() {
			var oSelectedItem = this.oView.byId("masterListId").getSelectedItem();
			if (oSelectedItem) {
				sap.m.MessageBox.confirm("Confirm delete employee?", {
					onClose: function(sAction) {
						if (sAction === "OK") {
							this._removeEmployee();
						}
					}.bind(this)
				});
			} else {
				sap.m.MessageBox.error("Please selected a item at least.");
			}
		},
		
		_removeEmployee: function() {
			var oMasterList = this.oView.byId("masterListId"),
				oSelectedItemData = oMasterList.getSelectedItem().getBindingContext("businessModel").getProperty();
			var sSelectedId = oSelectedItemData.Id;
			this.oView.byId("masterPageId").setBusy(true);
			this.oDataModel.remove("/ZEMPLOYEEINFOSet('" + sSelectedId + "')", {
				groupId: "removeEmployee",
				success: function(oRes) {
					this.oView.byId("masterPageId").setBusy(false);
					sap.m.MessageToast.show("Delete Employee info successfully.");
					this.oViewModel.setProperty("/sQueryStr", "");
					this._fetchEmployeeData();
				}.bind(this),
				error: function(error) {
					this.oView.byId("masterPageId").setBusy(false);
					sap.m.MessageBox.error("Delete Employee info failed.");
				}.bind(this)
			});
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