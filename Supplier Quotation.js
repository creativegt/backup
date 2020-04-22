cur_frm.add_fetch('supplier', 'nit', 'nit');

cur_frm.add_fetch('supplier', 'supplier_type', 'supplier_type');

cur_frm.add_fetch('supplier', 'medio_de_pago', 'medio_de_pago');

cur_frm.add_fetch('supplier', 'banco_preferido_de_pago', 'banco_preferido_de_pago');

function isEmpty(val){
    var test =  (val === undefined || val == null || val.length <= 0) ? true : false;
    return test;
}



cur_frm.cscript.custom_onload = function(doc) {

    if(cur_frm.doc.status == "Draft") {
        console.log("project on load: "+cur_frm.doc.project);
        //cur_frm.set_value("project", "");
        cur_frm.doc.items = [];
        refresh_field("items");
    }

    cur_frm.set_query("project", function() {
        return {
            "filters": [["Project","workflow_state","in",["Adjudicación de compras","Ejecución"]],["Project","percent_completed_creative","<",75]]
        };
    });

    cur_frm.set_query("project", "items", function (frm) {
        return {
            "filters": [["Project","workflow_state","in",["Adjudicación de compras","Ejecución"]],["Project","percent_completed_creative","<",75]]
        }
    });


    cur_frm.set_query("change_expense_account", function() {
        return {
            // "filters": {
            //     "parent_account": "Gastos de ventas - GC"
            // }
        };
    });


}

cur_frm.cscript.project = function(doc) {

    setProjectToItems();

    cur_frm.call({
        method: "frappe.client.get_value",
        args: {
            doctype: "Project",
            fieldname: "cost_center",
            filters: { name: cur_frm.doc.project },
        },
        callback: function(r, rt) {
            //msgprint(r.message.cost_center);
            if(r.message) {
                $.each(doc.items, function(i, d) {
                    d.cost_center = r.message.cost_center;
                });

                var today = new Date();
                var year = today.getFullYear();
                //loadPurchaseInvoices(cur_frm.doc.project);//no tiene permiso asistente de compras
                loadPurchaseOrders(cur_frm.doc.project);
                loadBudgets(r.message.cost_center);
                calcExpenseAccountAmountsWait(3000);

            }
        }
    });

};

function setProjectToItems() {
    $.each(cur_frm.doc.items, function(i, d) {
        //msgprint("project: "+d.project+" parent: "+cur_frm.doc.project);
        d.project = cur_frm.doc.project;
    });
    cur_frm.refresh_field("items");
}

frappe.ui.form.on("Supplier Quotation Item", {
    items_remove: function(frm) {

    },
    items_add: function(frm, cdt, cdn) {
        setProjectToItems();
        console.log("Items updated");
    }
});



frappe.ui.form.on("Supplier Quotation", {
    validate: function(frm) {

        $.each(cur_frm.doc.items, function(i, d) {
            //msgprint("project: "+d.project+" parent: "+cur_frm.doc.project);
            d.project = cur_frm.doc.project;
        });

    },
    refresh: function(frm) {
        console.log("refresh",cur_frm.doc.status,"project",cur_frm.doc.project);
        var me = this
        //frappe.msgprint("estado: "+cur_frm.doc.status);
        if(cur_frm.doc.status == "Draft") {

        }

        changeWidth();
    },
    before_submit: function(frm) {
        if (
            !(
                (frm.doc.project_workflow_state == "Ejecución" || frm.doc.project_workflow_state == "Adjudicación de compras")
                && frm.doc.percent_completed_creative<=frm.doc.max_percent_to_accept_purchases
            )
        ) {
            frappe.throw(__("El proyecto debe estar en Adjudicar compras y con menos del "+frm.doc.max_percent_to_accept_purchases+"% de ejecución."));
        }

    }
});




cur_frm.cscript.supplier = function(doc) {
    //msgprint("supplier "+cur_frm.doc.supplier);

    cur_frm.call({
        method: "frappe.client.get_value",
        args: {
            doctype: "Supplier",
            fieldname: "regimen_pago_de_iva",
            filters: { name: cur_frm.doc.supplier },
        },
        callback: function(r, rt) {
            //msgprint(r.message.regimen_pago_de_iva);
            if(r.message) {
                if(r.message.regimen_pago_de_iva == "IVA 5%") {
                    cur_frm.set_value("taxes_and_charges", "IVA GT (pequeño contribuyente)");
                } else if(r.message.regimen_pago_de_iva == "IVA 12%") {
                    cur_frm.set_value("taxes_and_charges", "IVA GT (Compra)");
                } else if(r.message.regimen_pago_de_iva == "MX IVA 16%") {
                    cur_frm.set_value("taxes_and_charges", "IVA MX (Compra) - CMX");
                }
            }
        }
    });


    loadAccountsPayable();

};




frappe.ui.form.on("Supplier Quotation Item", "item_code", function(frm, cdt, cdn) {
    calcExpenseAccountAmountsWait(3000);
});

frappe.ui.form.on("Supplier Quotation Item", "qty", function(frm, cdt, cdn) {
    calcExpenseAccountAmountsWait(1);
});

frappe.ui.form.on("Supplier Quotation Item", "rate", function(frm, cdt, cdn) {
    calcExpenseAccountAmountsWait(1);
});

frappe.ui.form.on("Supplier Quotation Item", "expense_account", function(frm, cdt, cdn) {
    calcExpenseAccountAmountsWait(1);
});

frappe.ui.form.on("Supplier Quotation Item", {
    items_remove: function(frm) {
        calcExpenseAccountAmountsWait(500);
    }
});


function calcExpenseAccountAmountsWait(wait) {
    setTimeout(
        function(){
            calcExpenseAccountAmounts();
        }, wait);
}

function calcExpenseAccountAmounts() {
    cur_frm.set_value("expense_accounts", []);

    var map = {};
    $.each(cur_frm.doc.items, function(i, d) {
        //frappe.msgprint("d.expense_account: "+d.expense_account+" d.amount: "+d.amount);

        if(isEmpty(d.expense_account))
            return;//next iteration

        if(isEmpty(map[d.expense_account]))
            map[d.expense_account] = d.amount;
        else
            map[d.expense_account] += d.amount;

    });

    for (var i in map) {
        var e = cur_frm.add_child("expense_accounts");
        e.expense_account = i;
        e.amount_in_this_qtn = map[i];

        var presupuesto = budgetMap[i];
        var gastadoFacturas = pinvMap[i];
        var gastadoPo = poMap[i];
        var gastadoEstaQtn = map[i];

        if(isEmpty(presupuesto)) presupuesto=0;
        if(isEmpty(gastadoPo)) gastadoPo=0;
        if(isEmpty(gastadoFacturas)) gastadoFacturas=0;
        if(isEmpty(gastadoEstaQtn)) gastadoEstaQtn=0;

        if(!isEmpty(budgetMap[i]))
            e.outstanding_amount = presupuesto*1.12-gastadoFacturas-gastadoPo-gastadoEstaQtn;//variance, outstanding amount.
        else
            e.outstanding_amount = 0;

    }

    cur_frm.refresh_field("expense_accounts");

}





function loadPurchaseOrders(project) {
    cur_frm.call({
        method: "frappe.desk.reportview.get",
        args: {
            start: 0,
            page_length: 500,
            doctype: "Purchase Order",
            fields: ["`tabPurchase Order`.`name`","`tabPurchase Order`.`status`","`tabPurchase Order Item`.`item_code`","`tabPurchase Order Item`.`cost_center`","`tabPurchase Order Item`.`expense_account`","`tabPurchase Order Item`.`amount`","`tabPurchase Order`.`per_received`","`tabPurchase Order`.`per_billed`"],
            filters: [["Purchase Order","docstatus","!=","2"],["Purchase Order Item","project","=",project]],
            with_childnames: 1
        },
        callback: function(r, rt) {
            if(r.message) {
                //frappe.msgprint("message: "+JSON.stringify(r.message));
                purchaseOrdersGroupByExpAcc(r.message);
            }
        }
    });
}



var poMap = {};

function purchaseOrdersGroupByExpAcc(report) {
    poMap = {};

    $.each(report.values, function(i, d) {
        //frappe.msgprint("d.expense_account: "+d[3]+" d.amount: "+d[5]+" d.per_billed: "+d[6]);

        if(isEmpty(poMap[d[3]]))
            poMap[d[3]] = d[5];//antes d[5]-(d[5]*d[6])/100
        else
            poMap[d[3]] += d[5];//antes d[5]-(d[5]*d[6])/100

    });
}



function loadPurchaseInvoices(project) {
    cur_frm.call({
        method: "frappe.desk.reportview.get",
        args: {
            start: 0,
            page_length: 500,
            doctype: "Purchase Invoice",
            fields: ["`tabPurchase Invoice`.`name`","`tabPurchase Invoice Item`.`project`","`tabPurchase Invoice Item`.`expense_account`","`tabPurchase Invoice Item`.`amount`"],
            filters: [["Purchase Invoice","docstatus","!=","2"],["Purchase Invoice Item","project","=",project],["Purchase Invoice","docstatus","!=","0"]],
            with_childnames: 1,
            user_settings: {"order_by":"`tabPurchase Invoice`.`modified` desc","last_view":"List","List":{"order_by":"`tabPurchase Invoice`.`modified` desc","filters":[["Purchase Invoice","docstatus","!=","2"]]},"filters":[["Purchase Invoice","docstatus","!=","2"],["Purchase Invoice Item","project","=",project],["Purchase Invoice","docstatus","!=","0"]],"fields":["`tabPurchase Invoice`.`name`","`tabPurchase Invoice Item`.`project`","`tabPurchase Invoice Item`.`expense_account`","`tabPurchase Invoice Item`.`amount`"],"updated_on":"Tue Aug 14 2018 16:08:19 GMT-0600"}
        },
        callback: function(r, rt) {
            if(r.message) {
                //frappe.msgprint("message: "+JSON.stringify(r.message));
                purchaseInvoicesGroupByExpAcc(r.message);
            }
        }
    });
}


var pinvMap = {};


function purchaseInvoicesGroupByExpAcc(report) {
    pinvMap = {};

    $.each(report.values, function(i, d) {
        //frappe.msgprint("d.expense_account: "+d[4]+" d.amount: "+d[1]);

        if("Gasto de Comisiones Sobre Ventas - GC" == d[1])
            return;

        var expenseHead = d[4];
        if(expenseHead=="Inventario recibido pero no cobrado - GC")
            expenseHead = "Gastos de mobiliario - GC";


        if(isEmpty(pinvMap[expenseHead]))
            pinvMap[expenseHead] = d[1];
        else
            pinvMap[expenseHead] += d[1];

    });
}




function loadBudgets(costCenter) {
    cur_frm.call({
        method: "frappe.desk.reportview.get",
        args: {
            start: 0,
            page_length: 500,
            doctype: "Budget",
            fields: ["`tabBudget`.`name`","`tabBudget`.`project`","`tabBudget`.`cost_center`","`tabBudget Account`.`account`","`tabBudget Account`.`budget_amount`"],
            filters: [["Budget","docstatus","=","1"],["Budget","cost_center","=",costCenter]],
            with_childnames: 1,
            user_settings: {"order_by":"`tabBudget`.`modified` desc","fields":["`tabBudget`.`name`","`tabBudget`.`project`","`tabBudget`.`cost_center`","`tabBudget Account`.`account`","`tabBudget Account`.`budget_amount`"],"List":{"order_by":"`tabBudget`.`modified` desc","filters":[["Budget","cost_center","=",costCenter]]},"filters":[["Budget","docstatus","=","1"],["Budget","cost_center","=",costCenter]],"last_view":"List","updated_on":"Tue Aug 14 2018 16:29:39 GMT-0600"}
        },
        callback: function(r, rt) {
            if(r.message) {
                //frappe.msgprint("message: "+JSON.stringify(r.message));
                budgetGroupByExpAcc(r.message);
            }
        }
    });
}


var budgetMap = {};


function budgetGroupByExpAcc(report) {
    budgetMap = {};

    $.each(report.values, function(i, d) {
        //frappe.msgprint("d.expense_account: "+d[0]+" d.amount: "+d[5]);

        if("Gasto de Comisiones Sobre Ventas - GC" == d[0])
            return;

        if(isEmpty(budgetMap[d[0]]))
            budgetMap[d[0]] = d[5];
        else
            budgetMap[d[0]] += d[5];

    });
}


cur_frm.cscript.change_expense_account = function(doc) {
    $.each(cur_frm.doc.items, function(i, d) {
        //frappe.msgprint("d.item_code: "+d.item_code+" d.checked: "+d.__checked);
        if(d.__checked==1) {
            frappe.msgprint(d.item_code+" | "+d.expense_account+" >> "+doc.change_expense_account);
            frappe.model.set_value(d.doctype, d.name, "expense_account", doc.change_expense_account);
        }
    });

    calcExpenseAccountAmountsWait(1);
}



function changeWidth() {
    var elements = document.getElementsByClassName("container page-body");
    var container = elements[0];
    container.style.width="90%";
}





function checkCreditLimitForSupplier(total_outstanding_amount) {
    console.log("payment_terms: "+cur_frm.doc.payment_terms+" monto_autorizado_de_credito: "+cur_frm.doc.monto_autorizado_de_credito);

    if(cur_frm.doc.payment_terms != "Pago de contado") {

        if(isEmpty(cur_frm.doc.monto_autorizado_de_credito) || cur_frm.doc.monto_autorizado_de_credito==0) {
            frappe.msgprint("Debe ingresar el límite de crédito autorizado para este proveedor.");
            return false;
        }

        var pct_used = total_outstanding_amount / cur_frm.doc.monto_autorizado_de_credito;

        if(pct_used>0.6)
            frappe.msgprint("El crédito ha superado ya el 60% "+
                frappe.format(total_outstanding_amount, {"fieldtype":"Currency"})
            );
    }

}

function loadAccountsPayable() {

    cur_frm.call({
        method: "frappe.desk.reportview.get",
        args: {
            start: 0,
            page_length: 500,
            doctype: "Purchase Invoice",
            fields: ["`tabPurchase Invoice`.`name`","`tabPurchase Invoice`.`supplier`","`tabPurchase Invoice`.`bill_no`","`tabPurchase Invoice`.`currency`",
                "`tabPurchase Invoice`.`grand_total`","`tabPurchase Invoice`.`outstanding_amount`","`tabPurchase Invoice`.`docstatus`","`tabPurchase Invoice`.`party_account_currency`"],
            filters: [["Purchase Invoice","status","in",["Unpaid","Overdue"]],["Purchase Invoice","supplier","=",cur_frm.doc.supplier]],
            with_childnames: 1
        },
        callback: function(r, rt) {
            if(r.message) {

                console.log("message: "+JSON.stringify(r.message));
                var total_outstanding_amount = 0;
                $.each(r.message.values, function(i, d) {
                    var outstanding_amount = d[4];
                    console.log("outstanding_amount: "+outstanding_amount);


                    total_outstanding_amount += outstanding_amount;

                });
                cur_frm.set_value("total_outstanding_amount", total_outstanding_amount);

                checkCreditLimitForSupplier(total_outstanding_amount);
            }
        }
    });
}
