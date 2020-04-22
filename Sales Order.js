cur_frm.add_fetch('customer', 'nit_del_cliente', 'nit_del_cliente');
cur_frm.add_fetch('customer', 'contacto_cobro', 'contacto_cobro');
cur_frm.add_fetch('customer', 'requisitos_para_presentar_factura', 'requisitos_para_presentar_factura');

function isEmpty(val){
    var test =  (val === undefined || val == null || val.length <= 0) ? true : false;
    return test;
}


let sinDiacriticos = (function() {
    let de = 'ÁÃÀÄÂÉËÈÊÍÏÌÎÓÖÒÔÚÜÙÛÑÇáãàäâéëèêíïìîóöòôúüùûñç',
        a = 'AAAAAEEEEIIIIOOOOUUUUNCaaaaaeeeeiiiioooouuuunc',
        re = new RegExp('['+de+']' , 'ug');

    return texto =>
        texto.replace(
            re,
            match => a.charAt(de.indexOf(match))
        );
})();


function eliminateDuplicates(arr) {
    var uniqs = arr.filter(function(item, index, array) {
        return array.indexOf(item) === index;
    });

    return uniqs;
}


cur_frm.cscript.project = function(doc) {

    checkEsModificacion();
};

function checkEsModificacion() {
    //si elige el proyecto, y no está vacío, debe marcar como activo el check de cambio
    if(!isEmpty(cur_frm.doc.project))
        cur_frm.set_value("es_modificacion", 1);
    else
        cur_frm.set_value("es_modificacion", 0);
}


cur_frm.cscript.customer = function(doc) {

    setMandatoryFields();
};

function setMandatoryFields() {
    cur_frm.set_df_property("po_no", "reqd", cur_frm.doc.purchase_order_required);
    cur_frm.set_df_property("po_date", "reqd", cur_frm.doc.purchase_order_required);
    cur_frm.set_df_property("shipping_address_name", "reqd", 1);
}

frappe.ui.form.on("Sales Order", {
    before_submit: function(frm) {
        if (frm.doc.signed_price_quote == null) {
            if(!(frm.doc.order_type == "Sales" && frm.doc.grand_total<15000))
                frappe.throw(__("Debe subir la imagen de la cotización firmada."));
        }
        if (frm.doc.signed_purchase_order == null && cur_frm.doc.purchase_order_required) {
            frappe.throw(__("Debe subir la imagen de la orden de compra firmada."));
        }


        checkDistribucionComision();
        checkDistribucionComisionAsesorComercial();
        checkDistribucionComisionDiseno();
    }

});


frappe.ui.form.on("Sales Order", {
        refresh: function(frm) {
            var me = this
            //frappe.msgprint("estado: "+cur_frm.doc.status);
            if(!frm.doc.islocal && cur_frm.doc.status != "Draft" && cur_frm.doc.status != "Cancelled") {

                cur_frm.add_custom_button(
                    ("Crear Proyecto"), function() {
                        crearProyectoButtonAction();
                    }
                );

                cur_frm.add_custom_button(
                    ("Crear Presupuesto Unicamente"), function() {
                        crearPresupuestoButtonAction();
                    }
                );

                cur_frm.add_custom_button(
                    ("Modificar Purchase Invoice"), function() {
                        modificarPurchaseInvoiceButtonAction();
                    }
                );

            }

            loadCompany();
        }
    }
);


var company;

function loadCompany() {
    frappe.model.with_doc("Company", cur_frm.doc.company, function() {
        company = frappe.model.get_doc("Company", cur_frm.doc.company);
        console.log(company.name,company.default_commission_account,company.default__viatics_account,company.default_unplanned_expenses_account,company.factor_get_budget_net_total);
    });
}

cur_frm.cscript.company = function(doc) {

    loadCompany();
};



cur_frm.cscript.custom_onload = function(doc) {
    console.log("onload: "+cur_frm.doc.customer,cur_frm.doc.status);

    if(cur_frm.doc.status == "Draft") {
        var idqtn = "" + doc.from_quotation;

        var title = doc.customer;

        if(!isEmpty(doc.quotation_title))
            title = doc.quotation_title;

        cur_frm.set_value("title", idqtn.replace("QTN-","") + " - " + title);

        refresh_field("title");

        checkEsModificacion();
        setMandatoryFields();

    }


    cur_frm.call({
        method: "frappe.client.get_value",
        args: {
            doctype: "Customer",
            fieldname: "requisitos_para_presentar_factura",
            filters: { customer_name: cur_frm.doc.customer },
        },
        callback: function(r, rt) {
            console.log("requisitos_para_presentar_factura message: "+JSON.stringify(r.message));

            if(r.message) {
                console.log("cur_frm.doc.requisitos_para_presentar_factura: "+cur_frm.doc.requisitos_para_presentar_factura);
                if(r.message.requisitos_para_presentar_factura!=cur_frm.doc.requisitos_para_presentar_factura)
                    cur_frm.set_value("requisitos_para_presentar_factura", r.message.requisitos_para_presentar_factura);
            }
        }
    });

    cur_frm.call({
        method: "frappe.client.get_value",
        args: {
            doctype: "Customer",
            fieldname: "contacto_cobro",
            filters: { customer_name: cur_frm.doc.customer },
        },
        callback: function(r, rt) {
            console.log("contacto_cobro message: "+JSON.stringify(r.message));
            if(r.message) {
                console.log("cur_frm.doc.contacto_cobro: "+cur_frm.doc.contacto_cobro);

                if(r.message.contacto_cobro!=cur_frm.doc.contacto_cobro)
                    cur_frm.set_value("contacto_cobro", r.message.contacto_cobro);
            }
        }
    });



    filterSalesPerson();

    if(cur_frm.doc.delivery_status != "Fully Delivered")
        checkInventory();


}





frappe.ui.form.on("Sales Order Item", "qty", function(frm, cdt, cdn) {
    var p = locals[cdt][cdn];

    getInventarioProyectado(p, true);

});

frappe.ui.form.on("Sales Order Item", "item_code", function(frm, cdt, cdn) {
    var p = locals[cdt][cdn];

    getInventarioProyectado(p, true);

});




function filterSalesPerson() {
    cur_frm.set_query("asesor", "comisiones_asesor", function (frm) {
        return {
            "filters": {
                es_asesor: 1
            }
        }
    });

    cur_frm.set_query("asesor_comercial", "comisiones_asesores_comerciales", function (frm) {
        return {
            "filters": {
                es_asesor_comercial: 1
            }
        }
    });

    cur_frm.set_query("disenador", "comisiones_disenadores", function (frm) {
        return {
            "filters": {
                es_disenador: 1
            }
        }
    });

}







function crearProyectoButtonAction() {
    //frappe.msgprint("SO: "+cur_frm.doc.name);
    createCostCenter(cur_frm.doc.title, cur_frm.doc.customer, cur_frm.doc.name, cur_frm.doc.grand_total, cur_frm.doc.imprevistos);
}

function crearPresupuestoButtonAction() {
    loadExpenseAccounts(cur_frm.doc.project, cur_frm.doc.customer, cur_frm.doc.name, cur_frm.doc.grand_total, cur_frm.doc.imprevistos,true);
}

function modificarPurchaseInvoiceButtonAction() {
    let d = new frappe.ui.Dialog({
        title: 'Cambiar Sales Order',
        fields: [
            {
                label: 'Nueva Sales Order',
                fieldname: 'new_sales_order',
                fieldtype: 'Link',
                options: 'Sales Order'
            }
        ],
        primary_action_label: 'Cambiar Purchase Invoices',
        primary_action(values) {
            console.log(values);

            commissionPurchaseInvoices(values.new_sales_order);

            d.hide();
        }
    });

    d.show();
}

function createCostCenter(ccName, customer, salesOrderId, grand_total, imprevistos) {

    ccName = sinDiacriticos(ccName);

    frappe.call({
        "method": "erpnext.accounts.utils.add_cc",
        "args": {
            doctype: "Cost Center",
            company: cur_frm.doc.company,
            parent:  cur_frm.doc.default_cost_center,
            parent_cost_center: cur_frm.doc.default_cost_center,
            cost_center_name: ccName,
            is_group: 0,
            is_root: false
        },
        callback: function(r, rt) {
            if(r.message) {
                //frappe.msgprint("message: "+JSON.stringify(r.message));
                frappe.msgprint("Centro de costo creado: "+r.message);
                loadExpenseAccounts(r.message, customer, salesOrderId, grand_total, imprevistos, false);
            }
        }
    });
}

function extractBudgetAccounts(items, viaticos, comisiones, grand_total, imprevistos) {
    var budgetMap = {};
    var precio_armado_silla = 20;

    console.log(company.name,company.default_commission_account,company.default__viatics_account,company.default_unplanned_expenses_account,company.factor_get_budget_net_total);


    $.each(items, function(i, d) {
        //frappe.msgprint("d.expense_account: "+d.expense_account+" d.net_amount: "+d.net_amount);

        //Solamente da presupuesto para armado a items de inventario
        if(d.is_stock_item == 1) {
            budgetMap[d.expense_account] = d.qty*precio_armado_silla / company.factor_get_budget_net_total ;
        } else if(isEmpty(budgetMap[d.expense_account]))
            budgetMap[d.expense_account] = d.qty*d.price_list_rate_buying / company.factor_get_budget_net_total ;
        else
            budgetMap[d.expense_account] += d.qty*d.price_list_rate_buying / company.factor_get_budget_net_total;

    });

    if(isEmpty(viaticos) || viaticos == 0) viaticos = 0.0112;



    //si incluye un producto de viaticos (visita) debe sumarlo
    if(!isEmpty(budgetMap[company.default__viatics_account]))
        budgetMap[company.default__viatics_account] += viaticos/company.factor_get_budget_net_total;
    else
        budgetMap[company.default__viatics_account] = viaticos/company.factor_get_budget_net_total;

    budgetMap[company.default_commission_account] = comisiones/company.factor_get_budget_net_total;

    //si incluye producto de imprevistos debe sumarlo
    if(!isEmpty(budgetMap[company.default_unplanned_expenses_account]))
        budgetMap[company.default_unplanned_expenses_account] += grand_total * imprevistos / 100 / company.factor_get_budget_net_total;
    else
        budgetMap[company.default_unplanned_expenses_account] = grand_total * imprevistos / 100 / company.factor_get_budget_net_total;

    return budgetMap;
}

function loadExpenseAccounts(ccName, customer, salesOrderId, grand_total, imprevistos, onlyBudget) {
    cur_frm.call({
        method: "frappe.desk.reportview.get",
        args: {
            start: 0,
            page_length: 500,
            doctype: "Account",
            fields: ["`tabAccount`.`name`"],
            filters: [["Account","is_group","=",0],["Account","root_type","=","Expense"],["Account","company","=",cur_frm.doc.company]],
            with_childnames: 1,
            user_settings: {"order_by":"`tabAccount`.`account_name` asc","last_view":"List","List":{"order_by":"`tabAccount`.`modified` desc","filters":[["Account","name","like","%servicios%"]]},"filters":[["Account","root_type","=","Expense"]],"fields":["`tabAccount`.`name`"],"updated_on":"Wed Aug 22 2018 12:42:41 GMT-0600"}
        },
        callback: function(r, rt) {
            if(r.message) {
                //frappe.msgprint("message: "+JSON.stringify(r.message));
                createBudget(ccName, r.message.values, customer, salesOrderId, grand_total, imprevistos, onlyBudget);

            }
        }
    });
}

function createBudget(ccName,expenseAccounts, customer, salesOrderId, grand_total, imprevistos, onlyBudget) {

    var today = new Date();
    var year = today.getFullYear().toString();
    var totalSinIva = 0;

    var budgetAccountsMap = extractBudgetAccounts(cur_frm.doc.items, cur_frm.doc.viaticos, cur_frm.doc.monto_comisiones, grand_total, imprevistos);
    var accounts = [];


    $.each(expenseAccounts, function(i, d) {
        var expenseName = d[0];
        var amount = budgetAccountsMap[expenseName];

        totalSinIva += amount;

        if(isEmpty(amount))
            amount = 0.01;

        //frappe.msgprint("expenseName: "+expenseName+" amount: "+amount);


        var row = {
            account:expenseName,
            doctype:"Budget Account",
            idx:i,
            parenttype:"Budget",
            docstatus:0,
            budget_amount: amount*cur_frm.doc.conversion_rate,
            parentfield:"accounts"
        }

        accounts.push(row);
    });

    frappe.call({
        "method": "frappe.desk.form.save.savedocs",
        "args": {
            doc: {
                fiscal_year:year,
                doctype:"Budget",
                budget_against:"Cost Center",
                accounts:accounts,
                total_sin_iva:totalSinIva,
                action_if_accumulated_monthly_budget_exceeded:"Warn",
                cost_center:ccName,
                action_if_annual_budget_exceeded:"Stop",
                amended_from:null,
                docstatus:0,
                parent:null,
                company:cur_frm.doc.company,
                monthly_distribution:null,
                project:null,
                parenttype:null,
                parentfield:null
            },
            action: "Submit"
        },
        callback: function(r, rt) {
            //frappe.msgprint("r: "+JSON.stringify(r));

            if(r) {
                //frappe.msgprint("message: "+JSON.stringify(r));
                frappe.msgprint("Presupuesto creado. ");
                console.log("Presupuesto creado: "+r.message);

                if(!onlyBudget)
                    createProject(ccName, ccName, customer, salesOrderId, grand_total*0.65, budgetAccountsMap);
            }
        }
    });
}


function createProject(ccName, projectName, customer, salesOrderId, estimatedCosting, budgetAccountsMap) {
    var planos = getJsonPlanos(budgetAccountsMap);

    projectName = sinDiacriticos(projectName);

    frappe.call({
        "method": "frappe.desk.form.save.savedocs",
        "args": {
            doc: {
                "docstatus":0,
                "doctype":"Project",
                "__islocal":1,
                "__unsaved":1,
                "status":"Open",
                "project_type":"External",
                "is_active":"Yes",
                "percent_complete_method":"Task Progress",
                "priority":"Medium",
                "company":cur_frm.doc.company,
                "notes":"",
                "percent_completed_creative":null,
                "percent_expected":null,
                "estado_de_avance":"EN TIEMPO",
                "project_name":projectName,
                "customer":customer,
                "sales_order":salesOrderId,
                "estimated_costing":estimatedCosting,
                "cost_center":ccName,
                "planos":planos,
                "items": cur_frm.doc.items
            },
            action: "Save"
        },
        callback: function(r, rt) {
            if(r) {
                //frappe.msgprint("message: "+JSON.stringify(r.message));
                frappe.msgprint("Proyecto creado.");
            }
        }
    });
}



function getJsonPlanos(budgetAccountsMap) {
    var planos = [];


    $.each(budgetAccountsMap, function(index, row){

        //console.log(" row: "+row+" index: "+index);

        var budget_amount = row;
        var account = index;

        if(budget_amount>1) {
            if(account == "Gastos de carpintería - GC" ||
                account == "Gastos de cielo falso - GC" ||
                account == "Gastos de demolición - GC" ||
                account == "Gastos de electricidad e iluminación - GC" ||
                account == "Gastos de herrería - GC" ||
                account == "Gastos de mobiliario - GC" ||
                account == "Gastos de Pintura - GC" ||
                account == "Gastos de pisos y azulejos - GC" ||
                account == "Gastos de Rotulos, viniles, sandblast, acrílicos - GC" ||
                account == "Gastos de Tablayeso - GC" ||
                account == "Gastos de vidriería - GC"
            ) {

                var row = {
                    "docstatus":0,
                    "doctype":"Project Plans",
                    "name":"New Project Plans 1",
                    "__islocal":1,
                    "__unsaved":1,
                    "tipo":account,
                    "parentfield":"planos",
                    "parenttype":"Project",
                    "requerido":1
                };
                //console.log("planos.push: "+account);
                planos.push(row);
            }
        }

    });
    return planos;
}
function checkDistribucionComisionAsesorComercial() {
    if (cur_frm.doc.includes_commercial_advisor_commission != 'Si')
        return;

    var distribucionTotal = 0;
    $.each(cur_frm.doc.comisiones_asesores_comerciales, function(i, d) {
        console.log("d.distribucion: "+d.distribucion+" d.asesor_comercial: "+d.asesor_comercial);
        distribucionTotal += d.distribucion;
    });
    if(distribucionTotal!=100)
        frappe.throw(__("La distribución de Comisiones Asesores Comerciales debe ser 100%."));

}

function checkDistribucionComisionDiseno() {
    if (cur_frm.doc.includes_designer_commission != 'Si')
        return;
    var distribucionTotal = 0;

    $.each(cur_frm.doc.comisiones_disenadores, function(i, d) {
        console.log("d.distribucion: "+d.distribucion+" d.disenador: "+d.disenador);
        distribucionTotal += d.distribucion;
    });

    if(distribucionTotal!=100)
        frappe.throw(__("La distribución de Comisiones Diseñador debe ser 100%."));

}

function checkDistribucionComision() {
    var distribucionTotal = 0;

    $.each(cur_frm.doc.comisiones_asesor, function(i, d) {
        console.log("d.distribucion: "+d.distribucion+" d.asesor: "+d.asesor);
        distribucionTotal += d.distribucion;
    });

    if(distribucionTotal!=100)
        frappe.throw(__("La distribución de comisiones debe ser 100%."));

}


cur_frm.cscript.on_submit = function(doc, cdt, cdn) {
    updOptyGanada();

    console.log("doc.name",doc.name,"doc.project",doc.project,"doc.es_modificacion",doc.es_modificacion);

    if(doc.order_type == "Maintenance")
        if(doc.es_modificacion == 0)
            crearProyectoButtonAction();
        else
            updateProject(doc.project, doc.name);
}

function updOptyGanada() {

    frappe.call({
        "method": "frappe.client.set_value",
        "args": {
            "doctype": "Opportunity",
            "name": cur_frm.doc.from_opportunity,
            "fieldname": {
                "embudo_state":"Ganada",
                "embudo_state_v2":"Ganada"
            }
        }
    });
}




function checkInventory() {
    $.each(cur_frm.doc.items, function(i, d) {
        var isLastItem =     (i+1) == cur_frm.doc.items.length;
        getInventarioProyectado(d, isLastItem);
    });
}



class Report {
    constructor() {
        this.items = [];
        this.itemsGrouped = [];
    }

    addItem(i) {
        this.items.push(i);
    }

    groupByItemCode() {
        this.itemsGrouped = this.items.reduce(function (r, a) {
            r[a.item_code] = r[a.item_code] || [];
            r[a.item_code].push(a);
            return r;
        }, Object.create(null));

    }

    getDisponible(item_code) {
        var disponible = 0;
        var actual_qty = 0;
        var reserved_qty = 0;

        $.each(this.itemsGrouped[item_code], function(i, d) {
            actual_qty += d.actual_qty;
            reserved_qty += d.reserved_qty;
        });

        disponible = actual_qty - reserved_qty;

        return disponible;

    }


}



function getInventarioProyectado(p, isLast) {
    console.log("p.item_code: "+p.item_code+" p.is_stock_item: "+p.is_stock_item);

    if(!isEmpty(p.is_stock_item) && p.is_stock_item!=1) return;

    cur_frm.call({
        method: "erpnext.stock.dashboard.item_dashboard.get_data",
        args: {
            item_code: p.item_code,
            start: 0,
            cmd: "erpnext.stock.dashboard.item_dashboard.get_data"
        },
        callback: function(r, rt) {

            var disponibles = 0;

            if(r.message && !isEmpty(r.message)) {

                console.log("r.message getInventarioProyectado: "+JSON.stringify(r.message));

                var report = new Report();

                $.each(r.message, function(i, d) {

                    report.addItem(d);
                    console.log("d.item_code: "+d.item_code+" d.projected_qty: "+d.projected_qty);
                });

                report.groupByItemCode();
                disponibles = report.getDisponible(p.item_code);

            } else {
                console.log("No tiene inventario. ");
            }

            console.log("p.item_code: p.item_code: "+p.item_code+" disponibles: "+disponibles+" p.qty: "+p.qty);

            var qty = p.qty;
            if(isEmpty(qty) || qty == "undefined") qty = 1;

            if(qty>disponibles)
                frappe.msgprint({
                    title: __('Notification'),
                    indicator: 'red',
                    message: __(p.item_code+'<img width="50px" src="https://creativegt.erpnext.com'+p.image+'" /> *** Disponibles: <b>'+disponibles+'</b> Faltan: <b><font color="red" >'+(qty-disponibles)+'</font></b>')
                });


        }
    });
}


function updateProject(projectId, salesOrderId) {

    frappe.db.set_value('Project', projectId, {
        sales_order: salesOrderId
    }).then(r => {
        let doc = r.message;
        console.log(doc);


    });

}











function commissionPurchaseInvoices(newSalesOrderId) {
    var filters =
        [["Purchase Invoice Item","sales_order","=", cur_frm.doc.name ]]
    ;

    frappe.db.get_list('Purchase Invoice', {
        fields: ['name'],
        filters: filters,
        limit: 1000
    }).then(records => {
        const recordsND = Array.from(new Set(records.map(s => s.name))).map(name => { return { name: name	}; });

        console.log(eliminateDuplicates(recordsND));

        $.each(recordsND, function(i, d) {
            frappe.model.with_doc("Purchase Invoice", d.name, function() {
                var pinv = frappe.model.get_doc("Purchase Invoice", d.name);

                $.each(pinv.items, function(i, item) {

                    //Solamente modificar la fila con la misma OV
                    if(item.sales_order == cur_frm.doc.name)
                        item.sales_order = newSalesOrderId;
                });

                updatePurchaseInvoice(pinv);
            });
        });



    });
}

function updatePurchaseInvoice(pinv) {
    cur_frm.call({
        method: "frappe.desk.form.save.savedocs",
        args: {
            action: "Update",
            doc: pinv,
        },
        callback: function(r, rt) {
            if(r.message) {
                //no confirma;
            }
            frappe.msgprint(pinv.name+" actualizada");
        }
    });
}