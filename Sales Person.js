function isEmpty(val){
    var test =  (val === undefined || val == null || val.length <= 0) ? true : false;
    return test;
}

function log(msg) {
    console.log(msg);

    var d = new Date();
    var dtext = d.getHours()+":"+d.getMinutes()+":"+d.getSeconds()+"."+d.getMilliseconds();

    cur_frm.set_value("log_de_calculo_de_comisiones", cur_frm.doc.log_de_calculo_de_comisiones+"\n\n"+dtext +" "+msg);
}

frappe.ui.form.on("Sales Person", {
        refresh: function(frm) {
            var me = this

            var isCoordinadoraAdministrativa = !isEmpty(frappe.user.has_role("Coordinadora administrativa"));

            //frappe.msgprint("estado: "+cur_frm.doc.status+" isCoordinadoraAdministrativa: "+isCoordinadoraAdministrativa+" cur_frm.doc.is_group: "+cur_frm.doc.is_group);

            /*if(isCoordinadoraAdministrativa && cur_frm.doc.is_group==1) {
                    cur_frm.add_custom_button(("Calcular comisiones"), function() {
                        calcularComisiones();
                    });

                    cur_frm.add_custom_button(("Calcular indicadores de proyectos"), function() {
                        calcularIndicadoresProyectos();
                    });
            }*/
        }
    }
);


function getAmountNoTaxes(tax, amount) {

    var sinIva = 0;
    var amountNoTaxes = 0;
    var isr = 0;

    if (tax == "Sin impuestos - GC")
        sinIva = amount;
    else
        sinIva = amount / 1.12;

    if (sinIva > 30000)
        isr = (sinIva-30000) * 0.07+1500;
    else
        isr = sinIva * 0.05;

    amountNoTaxes = sinIva - isr;

    return amountNoTaxes;
}



function calcularComisiones() {
    log("Inicia cálculo de comisiones.");
    comisionesMap = {};
    loadSalesPersons();
}



var salesPersonMap = {};
var gerenteMap = {};
var supplierMap = {};

function loadSalesPersons() {

    cur_frm.call({
        method: "frappe.desk.reportview.get",
        args: {
            start: 0,
            page_length: 500,
            doctype: "Sales Person",
            fields: ["`tabSales Person`.`name`","`tabSales Person`.`parent_sales_person`","`tabSales Person`.`is_group`","`tabSales Person Commisions details`.`type`","`tabSales Person Commisions details`.`percentage`","`tabSales Person`.`gerente`","`tabSales Person`.`supplier`"],
            filters: [["Sales Person","is_group","=",0],["Sales Person","enabled","=",1]],
            with_childnames: 1
        },
        callback: function(r, rt) {
            if(r.message) {
                console.log("message: "+JSON.stringify(r.message));
                salesPersonMap = {};
                gerenteMap = {};
                supplierMap = {};

                $.each(r.message.values, function(i, d) {
                    log("gerente d[0]: "+d[0]+" salesPersonName d[2]: "+d[2]+" d[3]: "+d[3]+" isGroup d[4]: "+d[4]+" percentage d[6]: "+d[6]+" type d[7]: "+d[7]+" supplier d[5]: "+d[5]);
                    var isGroup = d[4];
                    var salesPersonName = d[2];
                    var type = d[7];
                    var percentage = d[6];
                    var gerente = d[0];
                    var supplier = d[5];

                    gerenteMap[salesPersonName] = gerente;
                    supplierMap[salesPersonName] = supplier;

                    if(isEmpty(salesPersonMap[salesPersonName])) {
                        var comisionesMap = {};
                        comisionesMap[type] = percentage;
                        salesPersonMap[salesPersonName] = comisionesMap;
                    } else
                        salesPersonMap[salesPersonName][type] = percentage;

                });
                log("salesPersonMap: "+JSON.stringify(salesPersonMap));
                log("gerenteMap: "+JSON.stringify(gerenteMap));
                log("supplierMap: "+JSON.stringify(supplierMap));
                cargarOVs();

            }
        }
    });
}


var lastOvId = -999;
function cargarOVs() {
    log("cargarOVs");
    lastOvId = -999;

    cur_frm.call({
        method: "frappe.desk.reportview.get",
        args: {
            start: 0,
            page_length: 500,
            doctype: "Sales Order",
            fields: ["`tabSales Order`.`name`","`tabSales Order`.`transaction_date`","`tabSales Order`.`customer`","`tabSales Order`.`title`","`tabSales Order`.`status`","`tabSales Order`.`grand_total`","`tabSales Order`.`project`","`tabSales Order`.`from_lead`"],
            filters: [["Sales Order","reglas_cargadas","=",0],["Sales Order","transaction_date",">","2018-08-27"],["Sales Order","status","!=","Cancelled"],["Sales Order","status","!=","Draft"]],
            with_childnames: 1
        },
        callback: function(r, rt) {
            if(r.message) {
                //console.log("message: "+JSON.stringify(r.message));
                var currentOvId = -999;
                $.each(r.message.values, function(i, d) {
                    currentOvId = d[4];
                    cargarDistribucionAsesores(i, d);
                });
                lastOvId = currentOvId;
            } else {
                log("No existían órdenes de venta por procesar. Fin.");
                cargarOVsPagos();
            }
        }
    });

}


var comisionesMap = {};

function addComisiones(salesOrder, soName, salesPersonName, percentage, type) {

    var amountNoTaxes = getAmountNoTaxes(salesOrder.taxes_and_charges, salesOrder.grand_total);

    console.log("addComisiones - salesOrder.taxes_and_charges: "+salesOrder.taxes_and_charges+" salesOrder.grand_total: "+salesOrder.grand_total+" amountNoTaxes: "+amountNoTaxes);

    var row = {
        "parent":soName,
        "docstatus":0,
        "doctype":"Commissions details",
        "name":"New Commissions details 1",
        "__islocal":1,
        "__unsaved":1,
        "sales_person":salesPersonName,
        "percentage":percentage,
        "type":type,
        "parentfield":"commisions_details",
        "parenttype":"Sales Order",
        "total": amountNoTaxes * percentage/100
    };

    if(isEmpty(comisionesMap[soName]))
        comisionesMap[soName] = [];

    comisionesMap[soName].push(row);

}

function delComisiones(soName, salesPersonName, type) {
    $.each(comisionesMap[soName], function(index, row) {
        if(row.type == type && row.sales_person == salesPersonName) {
            delete comisionesMap[soName][index];
            log("Elimina comision de "+type+" salesPersonName: "+salesPersonName+" SO: "+soName+" index: "+index);
        }
    });
}

function hasComisiones(soName, salesPersonName, type) {
    var res = false;
    $.each(comisionesMap[soName], function(index, row) {
        if(row.type == type && row.sales_person == salesPersonName) {
            res = true;
            log("Confirma que tiene comision de "+type+" salesPersonName: "+salesPersonName+" SO: "+soName+" index: "+index);
            return false;
        }
    });

    return res;
}

function cargarDistribucionAsesores(i, so) {
    var name = so[4];
    log("cargarDistribucionAsesores "+i+") "+name);



    frappe.model.with_doc("Sales Order", name, function() {
        var salesOrder = frappe.model.get_doc("Sales Order", name);

        var asignaComiGerente = false;

        $.each(salesOrder.comisiones_asesor, function(index, row) {
            var gerente = gerenteMap[row.asesor];

            var pctAsesor = salesPersonMap[row.asesor]["Asesor"];
            var pctRetail = salesPersonMap[row.asesor]["Retail"];


            log("so name: "+name+" row.asesor:"+row.asesor+" pctAsesor: "+pctAsesor+" pctRetail: "+pctRetail+" row.distribucion: "+row.distribucion+" gerente: "+gerente);


            if(!isEmpty(pctAsesor)) {
                addComisiones(salesOrder, name, row.asesor, row.distribucion*pctAsesor/100, "Asesor");
                //Elimina comisión de gerente si tiene, no puede comisionar como gerente y como asesor
                delComisiones(name, row.asesor, "Gerente de Diseño y Planificación");
            }
            if(!isEmpty(pctRetail))
                addComisiones(salesOrder, name, row.asesor, row.distribucion*pctRetail/100, "Retail");

            if(!isEmpty(gerente) && !asignaComiGerente) {
                var pctGerente = salesPersonMap[gerente]["Gerente de Diseño y Planificación"];
                if(!isEmpty(pctGerente)) {
                    //Aplica si no aparece como asesor en esta OV, no puede comisionar como gerente y como asesor
                    if (!hasComisiones(name, gerente, "Asesor")) {
                        addComisiones(salesOrder, name, gerente, pctGerente, "Gerente de Diseño y Planificación");// solo aplica para el primer asesor que encuentre
                        asignaComiGerente = true;
                    }
                }
            }


        });
        //console.log("comisionesMap: "+JSON.stringify(comisionesMap));
        cargarComisionSupervisor(i, so, salesOrder);
    });
}

function cargarComisionSupervisor(i, so, salesOrder) {
    var name = so[4];
    var projectName = so[6];


    console.log("salesOrder.order_type: "+salesOrder.order_type);
    if(salesOrder.order_type== "Sales") {
        updateSO(salesOrder, true, "CARGADAS_OK_IS_SALES");
        return;
    }
    if(salesOrder.no_aplica_comisiones_a_supervisor==1) {
        updateSO(salesOrder, true, "CARGADAS_OK_NA_SUPERVISOR");
        return;
    }



    if(isEmpty(projectName)) {
        updateSO(salesOrder, false, "FALTA PROJECT EN OV");
        return;
    }

    cur_frm.call({
        method: "frappe.client.get_value",
        args: {
            doctype: "Project",
            fieldname: "supervisor",
            filters: { name: projectName },
        },
        callback: function(r, rt) {
            if(r.message) {
                log("supervisor: "+JSON.stringify(r.message));
                cur_frm.call({
                    method: "frappe.client.get_value",
                    args: {
                        doctype: "Sales Person",
                        fieldname: "sales_person_name",
                        filters: { user_id: r.message.supervisor },
                    },
                    callback: function(r2, rt) {
                        if(r2.message) {
                            log("sales person supervisor: "+JSON.stringify(r2));

                            var spSupervisor = r2.message.sales_person_name;
                            var pctSupervisor = salesPersonMap[spSupervisor]["Operativa"];

                            var spGerente = gerenteMap[spSupervisor];
                            var pctGerente ;
                            if(!isEmpty(salesPersonMap[spGerente]))
                                pctGerente = salesPersonMap[spGerente]["Gerente de Proyectos"];// PARA TODOS LOS PROYECTOS

                            log("spSupervisor: "+spSupervisor+" pctSupervisor:"+pctSupervisor+" spGerente: "+spGerente+" pctGerente:"+pctGerente);

                            if(!isEmpty(pctSupervisor))
                                addComisiones(salesOrder, name, spSupervisor, pctSupervisor, "Operativa");
                            if(!isEmpty(pctGerente))
                                addComisiones(salesOrder, name, spGerente, pctGerente, "Gerente de Proyectos");

                            log("comisionesMap: "+JSON.stringify(comisionesMap));
                            cargarComisionProspecto(i, so, salesOrder);
                        } else {
                            updateSO(salesOrder, false, "SUPERVISOR NO ES SALES PERSON");
                        }
                    }
                });
            } else {
                updateSO(salesOrder, false, "PROJECT NO EXISTE");
            }
        }
    });
}



function cargarComisionProspecto(i, so, salesOrder) {
    var name = so[4];
    var projectName = so[6];
    var fromLead = so[3];

    if(isEmpty(fromLead)) {
        updateSO(salesOrder, true, "CARGADAS_OK");
        return;
    }
    cur_frm.call({
        method: "frappe.client.get_value",
        args: {
            doctype: "Lead",
            fieldname: "lead_owner",
            filters: { name: fromLead },
        },
        callback: function(r, rt) {
            if(r.message) {
                //log("prospecto: "+JSON.stringify(r.message));
                cur_frm.call({
                    method: "frappe.client.get_value",
                    args: {
                        doctype: "Sales Person",
                        fieldname: "sales_person_name",
                        filters: { user_id: r.message.lead_owner },
                    },
                    callback: function(r2, rt) {
                        if(r2.message) {
                            log("sales person prospecto: "+JSON.stringify(r2));

                            var spProspecto = r2.message.sales_person_name;
                            var pctProspecto = salesPersonMap[spProspecto]["Prospecto"];

                            if(!isEmpty(pctProspecto))
                                addComisiones(salesOrder, name, spProspecto, pctProspecto, "Prospecto");

                            log("comisionesMap: "+JSON.stringify(comisionesMap));
                            updateSO(salesOrder, true, "CARGADAS_OK");
                        }
                    }
                });
            }

        }
    });
}





function updateSO(salesOrder, reglasCargadas, estado) {

    salesOrder.commisions_details = comisionesMap[salesOrder.name];
    salesOrder.reglas_cargadas = reglasCargadas?1:0;
    salesOrder.reglas_estado = estado;
    salesOrder.reglas_procesadas_el= frappe.datetime.now_datetime();

    log("updateSO: "+salesOrder.name);

    cur_frm.call({
        method: "frappe.desk.form.save.savedocs",
        args: {
            action: "Update",
            doc: salesOrder,
        },
        callback: function(r, rt) {
            if(r.message) {
                //no confirma;
            }
            if (lastOvId==salesOrder.name) {
                cargarOVsPagos();
                log("Ultima ov carga reglas: "+lastOvId);
            }
        }
    });
}




class PurchaseInvoiceItem {
    constructor(project, expenseHead, itemAmount) {
        this.project = project;
        this.expenseHead = expenseHead;
        this.itemAmount = itemAmount;
        this.mapped = false;//true si se asocio a un sales person
    }
}



class PurchaseInvoice {
    constructor(id, supplier) {
        this.id = id;
        this.items = [];
        this.supplier = supplier;
    }

    addItem(project, expenseHead, itemAmount) {
        var i = new PurchaseInvoiceItem(project, expenseHead, itemAmount);
        this.items.push(i);
    }

    getCommissionPaidAmount() {
        var res = 0;
        $.each(this.items, function(i, item) {
            if(!item.mapped)
                res += item.itemAmount;

            item.mapped = true;
        });

        return res;
    }

    getCommissionPaidNotMapped() {
        var res = "";
        $.each(this.items, function(i, item) {
            if(!item.mapped)
                res += "    "+item.itemAmount+"\n";

        });

        return res;
    }
}



class SalesOrder {
    constructor() {
        this.peReceiveTotal = 0;
        this.invoicePeReceiveTotal = 0;
        this.peReceiveDetails = "";
        this.invoicePeReceiveDetails = "";
        this.pInvs = [];
    }

    getReceiveTotal() {
        return this.peReceiveTotal + this.invoicePeReceiveTotal;
    }

    addPeReceiveTotal(val) {
        this.peReceiveTotal += val;
    }

    addInvoicePeReceiveTotal(val) {
        this.invoicePeReceiveTotal += val;
    }

    addPeReceiveDetails(peId, modeOfPayment, referenceDate , referenceNo, paidAmount) {
        this.peReceiveDetails += peId + "\t" + modeOfPayment + "\t" + referenceDate + "\t" + referenceNo + "\t" + paidAmount + "\n";
    }

    addInvoicePeReceiveDetails(salesInvoiceId, peId, modeOfPayment, referenceDate , referenceNo, paidAmount) {
        this.invoicePeReceiveDetails += salesInvoiceId + "\t" + peId + "\t" + modeOfPayment + "\t" + referenceDate + "\t" + referenceNo + "\t" + paidAmount + "\n";
    }

    getOrCreatePurchaseInvoice(id, supplier) {
        var res = new PurchaseInvoice(id, supplier);
        $.each(this.pInvs, function(i, d) {
            if(d.id == id) {
                res = d;
                return false;
            }
        });
        log("getOrCreatePurchaseInvoice: "+JSON.stringify(res));
        return res;
    }

    addPurchaseInvoice(pinv) {
        this.pInvs.push(pinv);
    }

    getCommissionPaidAmount(supplier, type) {
        var res = 0;
        $.each(this.pInvs, function(i, inv) {
            if(inv.supplier == supplier) {
                console.log(" getCommissionPaidAmount "+i+") "+inv.id);
                res += inv.getCommissionPaidAmount();
            }
        });
        return res;
    }

    getInvoiceDetails(supplier) {
        var res = "";
        $.each(this.pInvs, function(i, inv) {
            if(inv.supplier == supplier) {
                res += inv.id + "\n";
            }
        });
        return res;
    }


    getCommissionPaidNotMapped() {
        var res = "";
        $.each(this.pInvs, function(i, inv) {
            var pe = inv.getCommissionPaidNotMapped();
            if(!isEmpty(pe)) {
                res += inv.id + "\n";
                res += pe;
            }
        });
        return res;
    }
}





var salesOrderMap = {};

function cargarOVsPagos() {
    log("cargarOVsPagos");

    cur_frm.call({
        method: "frappe.desk.reportview.get",
        args: {
            start: 0,
            page_length: 500,
            doctype: "Sales Order",
            fields: ["`tabSales Order`.`name`","`tabSales Order`.`transaction_date`","`tabSales Order`.`customer`","`tabSales Order`.`title`","`tabSales Order`.`status`","`tabSales Order`.`grand_total`","`tabSales Order`.`project`","`tabSales Order`.`from_lead`"],
            filters: [["Sales Order","transaction_date",">","2018-05-01"],["Sales Order","status","!=","Cancelled"],["Sales Order","status","!=","Draft"],["Sales Order","reglas_cargadas","=",1],["Sales Order","calculo_comisiones_completado","=",0]
                //,["Sales Order","name","like","%499%"]
            ],
            with_childnames: 1
        },
        callback: function(r, rt) {
            if(r.message) {
                log("message: "+JSON.stringify(r.message));

                salesOrderMap = {};

                $.each(r.message.values, function(i, d) {

                    frappe.model.with_doc("Sales Order", d[4], function() {
                        var salesOrder = frappe.model.get_doc("Sales Order", d[4]);
                        loadPayInvoice(i, salesOrder);
                    });
                });
            } else
                log("No existían órdenes de venta por procesar para calcular comisiones. Fin.");
        }
    });

}




function loadPayInvoice(i, salesOrder) {
    log("loadPayInvoice "+i+") "+salesOrder.name+" salesOrder.project: "+salesOrder.project);

    cur_frm.call({
        method: "frappe.desk.reportview.get",
        args: {
            start: 0,
            page_length: 500,
            doctype: "Purchase Invoice",
            fields: ["`tabPurchase Invoice`.`name`","`tabPurchase Invoice Item`.`project`","`tabPurchase Invoice Item`.`expense_account`","`tabPurchase Invoice Item`.`amount`","`tabPurchase Invoice`.`supplier`"],
            filters: [["Purchase Invoice","docstatus","=","1"],["Purchase Invoice Item","project","=",salesOrder.project],["Purchase Invoice Item","expense_account","=","Gasto de Comisiones Sobre Ventas - GC"]],
            with_childnames: 1
        },
        callback: function(r, rt) {
            if(r.message) {
                log("message: "+JSON.stringify(r.message));

                if(isEmpty(salesOrderMap[salesOrder.name]))
                    salesOrderMap[salesOrder.name] = new SalesOrder();

                $.each(r.message.values, function(i, d) {
                    log("name d[0]: "+d[0]+" expense_account d[1]: "+d[1]+" project d[2]: "+d[2]+" itemAmount d[3]: "+d[3]+" supplier d[4]: "+d[4]);

                    var name = d[0];
                    var expenseHead = d[1];
                    var project = d[2];
                    var itemAmount = d[3];
                    var supplier = d[4];

                    var pinv = salesOrderMap[salesOrder.name].getOrCreatePurchaseInvoice(name, supplier);
                    pinv.addItem(project, expenseHead, itemAmount);
                    salesOrderMap[salesOrder.name].addPurchaseInvoice(pinv);

                });
                //log("salesOrderMap: "+JSON.stringify(salesOrderMap));
            }
            loadPEfromOV(i, salesOrder);
        }
    });
}




function loadPEfromOV(i, salesOrder) {
    log("loadPEfromOV "+i+") "+salesOrder.name);

    cur_frm.call({
        method: "frappe.desk.reportview.get",
        args: {
            start: 0,
            page_length: 500,
            doctype: "Payment Entry",
            fields: ["`tabPayment Entry`.`name`","`tabPayment Entry`.`paid_amount`","`tabPayment Entry Reference`.`reference_name`","`tabPayment Entry Reference`.`reference_doctype`","`tabPayment Entry`.`posting_date`","`tabPayment Entry`.`mode_of_payment`","`tabPayment Entry`.`reference_date`","`tabPayment Entry`.`reference_no`","`tabPayment Entry`.`paid_amount`","`tabPayment Entry`.`project`","`tabPayment Entry`.`party_type`","`tabPayment Entry`.`party_name`"],
            filters: [["Payment Entry","docstatus","=","1"],["Payment Entry Reference","reference_doctype","=","Sales Order"],["Payment Entry Reference","reference_name","=",salesOrder.name]],
            with_childnames: 1
        },
        callback: function(r, rt) {
            if(r.message) {
                log("message: "+JSON.stringify(r.message));

                if(isEmpty(salesOrderMap[salesOrder.name]))
                    salesOrderMap[salesOrder.name] = new SalesOrder();

                $.each(r.message.values, function(i, d) {
                    log("name d[2]: "+d[2]+" paidAmount d[3]: "+d[3]+" referenceNo d[1]: "+d[1]+" referenceDate d[10]: "+d[10]+" modeOfPayment d[5]: "+d[5]);

                    var peId = d[2];
                    var paidAmount = d[3];
                    var referenceNo = d[1];
                    var referenceDate = d[10];
                    var modeOfPayment = d[5];

                    salesOrderMap[salesOrder.name].addPeReceiveTotal(paidAmount);
                    salesOrderMap[salesOrder.name].addPeReceiveDetails(peId, modeOfPayment, referenceDate, referenceNo, paidAmount);

                });
                //log("salesOrderMap: "+JSON.stringify(salesOrderMap));
            }

            loadInvoicefromOV(i, salesOrder);
        }
    });
}



function loadInvoicefromOV(i, salesOrder) {
    log("loadInvoicefromOV "+i+") "+salesOrder.name);

    cur_frm.call({
        method: "frappe.desk.form.linked_with.get_linked_docs",
        args: {
            name: salesOrder.name,
            doctype: "Sales Order",
            linkinfo: {"Sales Invoice":{"child_doctype":"Sales Invoice Item","fieldname":"sales_order"}}
        },
        callback: function(r, rt) {
            if(r.message) {
                log("message: "+JSON.stringify(r.message));

                if(isEmpty(salesOrderMap[salesOrder.name]))
                    salesOrderMap[salesOrder.name] = new SalesOrder();

                log("r.message[Sales Invoice].length: "+r.message["Sales Invoice"].length);

                if(r.message["Sales Invoice"].length == 0)
                    updateSOCalculoComisiones(salesOrder);
                else
                    loadPEfromInvoice(0, salesOrder, r.message["Sales Invoice"]);

                /*$.each(r.message["Sales Invoice"], function(i, d) {
                    log("d[name]: "+d["name"]+" i: "+i);

                    var isLastInvoice = (i+1)==r.message["Sales Invoice"].length;

                    loadPEfromInvoice(i, salesOrder,d["name"], isLastInvoice);
                });*/



            } else
                updateSOCalculoComisiones(salesOrder);
        }
    });
}



function loadPEfromInvoice(i, salesOrder, listSinv) {
    if(isEmpty(listSinv[i])) {
        updateSOCalculoComisiones(salesOrder);
        return;
    }

    var salesInvoiceId = listSinv[i]["name"];

    log("loadPEfromInvoice "+i+") "+salesOrder.name+" salesInvoiceId: "+salesInvoiceId);

    cur_frm.call({
        method: "frappe.desk.reportview.get",
        args: {
            start: 0,
            page_length: 500,
            doctype: "Payment Entry",
            fields: ["`tabPayment Entry`.`name`","`tabPayment Entry`.`paid_amount`","`tabPayment Entry Reference`.`reference_name`","`tabPayment Entry Reference`.`reference_doctype`","`tabPayment Entry`.`posting_date`","`tabPayment Entry`.`mode_of_payment`","`tabPayment Entry`.`reference_date`","`tabPayment Entry`.`reference_no`","`tabPayment Entry`.`paid_amount`","`tabPayment Entry`.`project`","`tabPayment Entry`.`party_type`","`tabPayment Entry`.`party_name`"],
            filters: [["Payment Entry","docstatus","=","1"],["Payment Entry Reference","reference_doctype","=","Sales Invoice"],["Payment Entry Reference","reference_name","=",salesInvoiceId]],
            with_childnames: 1
        },
        callback: function(r, rt) {
            if(r.message) {
                log("message loadPEfromInvoice: "+JSON.stringify(r.message));

                if(isEmpty(salesOrderMap[salesOrder.name]))
                    salesOrderMap[salesOrder.name] = new SalesOrder();

                $.each(r.message.values, function(i, d) {
                    log("name d[2]: "+d[2]+" paidAmount d[3]: "+d[3]+" referenceNo d[1]: "+d[1]+" referenceDate d[10]: "+d[10]+" modeOfPayment d[5]: "+d[5]);

                    var peId = d[2];
                    var paidAmount = d[3];
                    var referenceNo = d[1];
                    var referenceDate = d[10];
                    var modeOfPayment = d[5];

                    salesOrderMap[salesOrder.name].addInvoicePeReceiveTotal(paidAmount);
                    salesOrderMap[salesOrder.name].addInvoicePeReceiveDetails(salesInvoiceId,peId, modeOfPayment, referenceDate, referenceNo, paidAmount);

                });
                //log("salesOrderMap: "+JSON.stringify(salesOrderMap));
            }

            var j = i+1;
            loadPEfromInvoice(j, salesOrder, listSinv);

        }
    });
}


var OK_PAGADAS_TOTALMENTE = "OK PAGADAS TOTALMENTE";

var CALCULO_O_PAGOS_EN_PROCESO = "CALCULO O PAGOS EN PROCESO";

function updateSOCalculoComisiones(salesOrder) {
    console.log("inicia updateSOCalculoComisiones: "+salesOrder.name);


    var soNew = salesOrderMap[salesOrder.name];

    salesOrder.caculo_comisiones_procesado_el = frappe.datetime.now_datetime();

    if(!isEmpty(soNew)) {

        salesOrder.total_pagos_recibidos = soNew.peReceiveTotal + soNew.invoicePeReceiveTotal;
        salesOrder.detalle_pagos_recibidos = "Anticipos\n\n"+soNew.peReceiveDetails+
            "\n\nFacturado\n\n"+soNew.invoicePeReceiveDetails;



        $.each(salesOrder.commisions_details, function(i, sp) {

            //recalc total, se recalcula por si el % fue modificado a mano
            var amountNoTaxes = getAmountNoTaxes(salesOrder.taxes_and_charges, salesOrder.grand_total);
            sp.total = amountNoTaxes * sp.percentage / 100;
            sp.total = Math.round(sp.total * 100) / 100;


            var supplier = supplierMap[sp.sales_person];
            sp.total_facturadas = soNew.getCommissionPaidAmount(supplier);
            sp.detalle_de_pagos = soNew.getInvoiceDetails(supplier);


            sp.total_permitido_facturar = sp.total * salesOrder.total_pagos_recibidos/salesOrder.grand_total;

            sp.monto_factura_a_solicitar = sp.total_permitido_facturar - sp.total_facturadas;
            sp.monto_factura_a_solicitar = Math.round(sp.monto_factura_a_solicitar * 100) / 100;

            if(isEmpty(sp.total_facturadas)) sp.total_facturadas=0;
            if(isEmpty(sp.total_permitido_facturar)) sp.total_permitido_facturar=0;

            sp.total_facturadas = Math.round(sp.total_facturadas * 100) / 100;
            sp.total_permitido_facturar = Math.round(sp.total_permitido_facturar * 100) / 100;

            if(sp.total == sp.total_facturadas)
                sp.estado_calculo_de_comisiones = OK_PAGADAS_TOTALMENTE;
            else if(sp.total_facturadas < sp.total_permitido_facturar)
                sp.estado_calculo_de_comisiones = "FALTAN FACTURAS POR PRESENTAR";
            else if (sp.total_facturadas > sp.total_permitido_facturar)
                sp.estado_calculo_de_comisiones = "RECIBIO COMISIONES DE MAS";
            else if(sp.total_facturadas>0)
                sp.estado_calculo_de_comisiones = "PAGADAS PARCIALMENTE";
            else
                sp.estado_calculo_de_comisiones = "PENDIENTE RECIBIR PAGOS DE CLIENTE";
        });

        salesOrder.pinv_no_asociadas = soNew.getCommissionPaidNotMapped();

        if(!isEmpty(salesOrder.pinv_no_asociadas)) {
            salesOrder.calculo_comisiones_estado = "PINV DE COMISIONES NO ASOCIADOS";
            salesOrder.calculo_comisiones_completado = false;
        } else {
            var enProceso = false;
            $.each(salesOrder.commisions_details, function(i, sp) {
                if(sp.estado_calculo_de_comisiones != OK_PAGADAS_TOTALMENTE) {
                    salesOrder.calculo_comisiones_estado = CALCULO_O_PAGOS_EN_PROCESO;
                    salesOrder.calculo_comisiones_completado = false;
                    enProceso = true;

                    return false;
                }
            });

            if(!enProceso) {
                salesOrder.calculo_comisiones_estado = "CALCULO_COMPLETADO_OK";
                salesOrder.calculo_comisiones_completado = true;
            }
        }
    } else {
        salesOrder.calculo_comisiones_estado = CALCULO_O_PAGOS_EN_PROCESO;
        salesOrder.calculo_comisiones_completado = false;
    }

    log("updateSOCalculoComisiones: "+salesOrder.name);

    cur_frm.call({
        method: "frappe.desk.form.save.savedocs",
        args: {
            action: "Update",
            doc: salesOrder,
        },
        callback: function(r, rt) {
            if(r.message) {
                //no confirma;
            }

        }
    });
}








function calcularIndicadoresProyectos() {
    cargarProyectos();
}

class Budget {
    constructor(expense_account) {
        this.expense_account = expense_account;
        this.budget_amount = 0;
        this.pinv_amount = 0;
        this.po_amount = 0;
        this.unpaid_amount = 0;
    }

    addAmount(amount) {
        amount = Math.round(amount * 100) / 100;

        if(amount>0.01)
            this.budget_amount += amount * 1.12;
        else
            this.budget_amount += 0;


    }

    addPinvAmount(amount, status) {
        amount = Math.round(amount * 100) / 100;


        this.pinv_amount += amount;

        if(status == "Unpaid")
            this.unpaid_amount += amount;


    }

    addPOAmount(amount, per_billed, advance_paid, grand_total) {
        amount = Math.round(amount * 100) / 100;

        this.po_amount += amount-(amount*per_billed)/100;
        this.po_amount = Math.round(this.po_amount * 100) / 100;

        var monto_facturado = grand_total * per_billed / 100;

        var pct = amount / grand_total;
        var advance_paid_nobilled = advance_paid - monto_facturado;

        if(monto_facturado > advance_paid)
            this.unpaid_amount += (grand_total-monto_facturado)*pct;
        else
            this.unpaid_amount += (grand_total-monto_facturado-advance_paid_nobilled)*pct;

    }

    getBalance() {
        return this.budget_amount - this.pinv_amount - this.po_amount;
    }

    getVariation() {
        if(this.budget_amount<=0)
            return 0;
        else
            return this.getBalance() / this.budget_amount * 100;
    }
}

class Project {
    constructor(name, supervisor, tasks) {
        this.name = name;
        this.budget = {};
        this.estado = "";
        this.supervisor = supervisor;
        this.percent_completed_creative;
        this.percent_expected;
        this.expected_start_date;
        this.expected_end_date;

        this.total_budget_amount = 0;
        this.total_pinv_amount = 0;
        this.total_po_amount = 0;
        this.total_unpaid_amount = 0;

        this.tasks = tasks;

        this.setStartEndDates();
    }

    addBudgetAmount(expense_account, budget_amount) {
        if(isEmpty(this.budget[expense_account]))
            this.budget[expense_account] = new Budget(expense_account);

        this.budget[expense_account].addAmount(budget_amount);
    }

    addPInvAmount(expense_account, pinv_amount, status) {
        if(isEmpty(this.budget[expense_account]))
            this.budget[expense_account] = new Budget(expense_account);

        this.budget[expense_account].addPinvAmount(pinv_amount, status);
    }

    addPOAmount(expense_account, po_amount, per_billed, advance_paid, grand_total) {
        if(isEmpty(this.budget[expense_account]))
            this.budget[expense_account] = new Budget(expense_account);

        this.budget[expense_account].addPOAmount(po_amount, per_billed, advance_paid, grand_total);
    }

    setStartEndDates() {
        var tasks = this.tasks;
        var duracionTotal = 0;
        var duracionCompletada = 0;
        var duracionCompletadaEsperada = 0;
        var percent_completed_creative;
        var percent_expected;
        var hoy = new Date();
        var estado_de_avance;
        var expected_start_date;
        var expected_end_date;

        if(isEmpty(this.supervisor)) {
            this.estado = "FALTA ASIGNAR SUPERVISOR";
            return;
        }

        if(isEmpty(tasks)) {
            this.estado = "FALTA AGREGAR TAREAS";
            return;
        }

        var projectthis = this;
        $.each(tasks, function(i, d) {
            var duracionTarea = frappe.datetime.get_diff(d.end_date, d.start_date) + 1;

            duracionTotal += duracionTarea;
            duracionCompletada += duracionTarea * d.progress / 100;

            if(frappe.datetime.get_diff(d.end_date, hoy)<0) {
                duracionCompletadaEsperada += duracionTarea;
                //msgprint("esperada duracionTarea: "+d.title+" - "+duracionTarea);
            } else {
                var duracionTareaExpected = frappe.datetime.get_diff(hoy, d.start_date) + 1;
                if(duracionTareaExpected>0) {
                    duracionCompletadaEsperada += duracionTareaExpected;
                }
                //msgprint("esperada duracionTareaExpected: "+d.title+" - "+duracionTareaExpected);

            }


            if(isEmpty(expected_start_date) || frappe.datetime.get_diff(d.start_date, expected_start_date)<0)
                expected_start_date = d.start_date;

            if(isEmpty(expected_end_date))
                expected_end_date = d.end_date;

            if(frappe.datetime.get_diff(expected_end_date, d.end_date)<0)
                expected_end_date = d.end_date;

            projectthis.obtenerAvanceEsperado(d);

        });

        percent_completed_creative = duracionCompletada / duracionTotal * 100;
        percent_completed_creative = Math.round(percent_completed_creative * 100) / 100;

        percent_expected = duracionCompletadaEsperada / duracionTotal * 100;
        percent_expected = Math.round(percent_expected * 100) / 100;

        if(percent_completed_creative < percent_expected ) {
            this.estado = "ATRASADO";
        } else {
            this.estado = "EN TIEMPO";
        }

        this.percent_completed_creative = percent_completed_creative;
        this.percent_expected = percent_expected;
        this.expected_start_date = expected_start_date;
        this.expected_end_date = expected_end_date;
    }



    obtenerAvanceEsperado(task) {
        var hoy = new Date();
        var duracionCompletadaEsperada = 0;

        var duracionTarea = frappe.datetime.get_diff(task.end_date, task.start_date) + 1;
        console.log("duracionTarea: "+duracionTarea + " task.end_date: "+task.end_date + " task.start_date: "+task.start_date+" hoy: "+hoy);

        if(frappe.datetime.get_diff(task.end_date, hoy)<0) {
            duracionCompletadaEsperada += duracionTarea;
            console.log("esperada duracionTarea: "+task.title+" - "+duracionTarea);
        } else {
            var duracionTareaExpected = frappe.datetime.get_diff(hoy, task.start_date);
            if(duracionTareaExpected>0) {
                duracionCompletadaEsperada += duracionTareaExpected;
            }
            console.log("esperada duracionTareaExpected: "+task.title+" - "+duracionTareaExpected);

        }
        console.log("duracionCompletadaEsperada: "+duracionCompletadaEsperada);

        var percent_expected = duracionCompletadaEsperada / duracionTarea * 100;
        percent_expected = Math.round(percent_expected * 100) / 100;

        console.log("percent_expected: "+percent_expected);

        task.percent_expected = percent_expected;
    }


    getBudgetFormatted() {
        var res = [];
        var total_budget_amount = 0;
        var total_pinv_amount = 0;
        var total_po_amount = 0;
        var total_unpaid_amount = 0;

        $.each(this.budget, function(i, d) {

            if(d.budget_amount<1 && d.pinv_amount<1 && d.po_amount<1)
                return;

            if(d.pinv_amount == 0 && d.po_amount ==0)
                d.unpaid_amount = d.budget_amount;

            if(  (d.pinv_amount > 0 || d.po_amount >0)  && d.unpaid_amount==0 )
                d.unpaid_amount = d.budget_amount - d.pinv_amount - d.po_amount;

            if(d.unpaid_amount<0)
                d.unpaid_amount = 0;

            var row = {
                "balance":d.getBalance(),
                "account":d.expense_account,
                "purchase_invoice_amount":d.pinv_amount,
                "name":"New Project Budget 1",
                "parent":this.name,
                "variation":d.getVariation(),
                "doctype":"Project Budget",
                "parenttype":"Project",
                "docstatus":0,
                "purchase_order_amount":d.po_amount,
                "budget_amount":d.budget_amount,
                "unpaid_amount":d.unpaid_amount,
                "parentfield":"budget",
                "__islocal":1,
                "__unsaved":1
            };

            res.push(row);

            total_budget_amount += d.budget_amount;
            total_po_amount += d.po_amount;
            total_pinv_amount += d.pinv_amount;
            total_unpaid_amount += d.unpaid_amount;
        });

        this.total_budget_amount = total_budget_amount;
        this.total_po_amount = total_po_amount;
        this.total_pinv_amount = total_pinv_amount;
        this.total_unpaid_amount = total_unpaid_amount;

        return res;
    }

}

















var projectsMap = {};

var lastProjectId = "";

function cargarProyectos() {
    log("cargarProyectos");
    lastProjectId = "";

    cur_frm.call({
        method: "frappe.desk.reportview.get",
        args: {
            start: 0,
            page_length: 500,
            doctype: "Project",
            fields: ["`tabProject`.`customer`","`tabProject`.`name`","`tabProject`.`is_active`","`tabProject`.`status`"],
            filters: [
                ["Project","creation",">","2018-06-01"],["Project","status","=","Open"]
                //,["Project","name","=","02753-5 - Smart Fit Próceres - GC"]
            ],
            with_childnames: 1
        },
        callback: function(r, rt) {
            if(r.message) {
                log("message: "+JSON.stringify(r.message));

                projectsMap = {};


                $.each(r.message.values, function(i, d) {

                    frappe.model.with_doc("Project", d[3], function() {
                        var project = frappe.model.get_doc("Project", d[3]);

                        log("get_doc "+i+") project.name: "+project.name);
                        lastProjectId = project.name;

                        projectsMap[project.name] = new Project(project.name, project.supervisor, project.tasks);
                        //log("project: "+JSON.stringify(projectsMap[project.name]));
                        loadBudgets(project);
                    });
                });
            } else
                log("No existían proyectos por procesar. Fin.");
        }
    });

}


function loadBudgets(project) {
    log("loadBudgets "+project.name);
    cur_frm.call({
        method: "frappe.desk.reportview.get",
        args: {
            start: 0,
            page_length: 500,
            doctype: "Budget",
            fields: ["`tabBudget`.`name`","`tabBudget`.`project`","`tabBudget`.`cost_center`","`tabBudget Account`.`account`","`tabBudget Account`.`budget_amount`"],
            filters: [["Budget","docstatus","=","1"],["Budget","cost_center","=",project.cost_center],["Budget","budget_amount",">",1]],
            with_childnames: 1
        },
        callback: function(r, rt) {
            if(r.message) {
                console.log("loadBudgets message: "+JSON.stringify(r.message));
                budgetGroupByExpAcc(project, r.message);
                //console.log("loadBudgets projectsMap: "+JSON.stringify(projectsMap));
            }
            loadPurchaseInvoices(project);
        }
    });
}



function budgetGroupByExpAcc(project, report) {

    $.each(report.values, function(i, d) {
        log("budgetGroupByExpAcc d.expense_account: "+d[0]+" d.budget_amount: "+d[5]);

        if("Gasto de Comisiones Sobre Ventas - GC" == d[0])
            return;

        projectsMap[project.name].addBudgetAmount(d[0], d[5]);

    });
}






function loadPurchaseInvoices(project) {
    log("loadPurchaseInvoices "+project.name);
    cur_frm.call({
        method: "frappe.desk.reportview.get",
        args: {
            start: 0,
            page_length: 1000,
            doctype: "Purchase Invoice",
            fields: ["`tabPurchase Invoice`.`name`","`tabPurchase Invoice Item`.`project`","`tabPurchase Invoice Item`.`expense_account`","`tabPurchase Invoice Item`.`amount`","`tabPurchase Invoice`.`status`"],
            filters: [["Purchase Invoice","docstatus","!=","2"],["Purchase Invoice Item","project","=",project.name],["Purchase Invoice","docstatus","!=","0"]],
            with_childnames: 1
        },
        callback: function(r, rt) {
            if(r.message) {
                console.log("loadPurchaseInvoices message: "+JSON.stringify(r.message));
                purchaseInvoicesGroupByExpAcc(project, r.message);
                //console.log("loadBudgets projectsMap: "+JSON.stringify(projectsMap));
            }
            loadPurchaseOrders(project);
        }
    });
}




function purchaseInvoicesGroupByExpAcc(project, report) {

    $.each(report.values, function(i, d) {
        var expenseHead = d[2];
        var amount = d[4];
        var status = d[0];

        log("purchaseInvoicesGroupByExpAcc d.expense_account: "+expenseHead+" d.amount: "+amount+" status: "+status);

        if("Gasto de Comisiones Sobre Ventas - GC" == expenseHead)
            return;

        if(expenseHead=="Inventario recibido pero no cobrado - GC")
            expenseHead = "Gastos de mobiliario - GC";


        projectsMap[project.name].addPInvAmount(expenseHead, amount, status);

    });
}





function loadPurchaseOrders(project) {
    cur_frm.call({
        method: "frappe.desk.reportview.get",
        args: {
            start: 0,
            page_length: 1000,
            doctype: "Purchase Order",
            fields: ["`tabPurchase Order`.`grand_total`","`tabPurchase Order`.`advance_paid`", "`tabPurchase Order`.`name`","`tabPurchase Order`.`status`","`tabPurchase Order Item`.`item_code`","`tabPurchase Order Item`.`cost_center`","`tabPurchase Order Item`.`expense_account`","`tabPurchase Order Item`.`amount`","`tabPurchase Order`.`per_received`","`tabPurchase Order`.`per_billed`"],
            filters: [["Purchase Order","docstatus","=","1"],["Purchase Order Item","project","=",project.name],["Purchase Order","status","like","%bill%"]],
            with_childnames: 1
        },
        callback: function(r, rt) {
            if(r.message) {
                console.log("loadPurchaseOrders message: "+JSON.stringify(r.message));
                purchaseOrdersGroupByExpAcc(project, r.message);
                //console.log("loadBudgets projectsMap: "+JSON.stringify(projectsMap));
            }
            getProjectSO(project);
        }
    });
}


function purchaseOrdersGroupByExpAcc(project, report) {

    $.each(report.values, function(i, d) {
        var expense_account = d[5];
        var amount = d[7];
        var per_billed = d[8];
        var advance_paid = d[3];
        var grand_total = d[1];

        log("purchaseOrdersGroupByExpAcc d.expense_account: "+expense_account+" d.amount: "+amount+" d.per_billed: "+per_billed+" advance_paid: "+advance_paid+" grand_total: "+grand_total);

        projectsMap[project.name].addPOAmount(expense_account, amount, per_billed, advance_paid, grand_total);
    });
}




function getProjectSO(project) {
    log("getProjectSO: "+project.sales_order);

    frappe.model.with_doc("Sales Order", project.sales_order, function() {
        var salesOrder = frappe.model.get_doc("Sales Order", project.sales_order);

        log("get_doc project.name: "+salesOrder.name+" perBilled: "+salesOrder.per_billed+" advance_paid: "+salesOrder.advance_paid);

        updateProject(project, salesOrder);
    });

}



function updateProject(project, salesOrder) {
    console.log("updateProject: "+project.name);


    var projectNew = projectsMap[project.name];

    project.percent_expected_updated_on = frappe.datetime.now_datetime();
    project.budget_info_updated_on = frappe.datetime.now_datetime();
    project.percent_expected = projectNew.percent_expected;
    project.estado_de_avance = projectNew.estado;
    project.expected_start_date = projectNew.expected_start_date;
    project.expected_end_date = projectNew.expected_end_date;
    project.budget = projectNew.getBudgetFormatted();

    project.total_budget_amount = projectNew.total_budget_amount;
    project.total_pinv_amount = projectNew.total_pinv_amount;
    project.total_po_amount = projectNew.total_po_amount;
    project.total_unpaid_amount= projectNew.total_unpaid_amount;
    project.balance = project.total_budget_amount - project.total_pinv_amount - project.total_po_amount;

    project.tasks = projectNew.tasks;

    if(project.total_budget_amount<=0)
        project.variation = 0;
    else
        project.variation = project.balance / project.total_budget_amount*100;

    if((100-project.variation)<=project.percent_expected)
        project.purchase_status = "FALTAN PROVEEDORES POR ADJUDICAR";
    else
        project.purchase_status = "PRESUPUESTO SOBREPASADO";


    //sales order info
    var per_advance_payment = salesOrder.advance_paid / salesOrder.grand_total;

    project.payment_terms = salesOrder.payment_terms_template;
    project.per_advance_payment = per_advance_payment*100;
    project.per_billed = salesOrder.per_billed;

    if(isEmpty(project.payment_terms) || project.payment_terms=="Default Payment Term - N0") {
        if(project.per_advance_payment<=project.percent_completed_creative) {
            if(project.per_billed<project.percent_completed_creative)
                project.billing_status = "La obra avanzó más. Debe pedirse anticipo";
            else
                project.billing_status = "OK Anticipo facturado";
        } else
            project.billing_status = "OK Anticipo";

    } else {
        if(project.per_billed<project.percent_completed_creative)
            project.billing_status = "La obra avanzó mas. Debe facturarse";
        else
            project.billing_status = "OK Facturación";
    }



    cur_frm.call({
        method: "frappe.desk.form.save.savedocs",
        args: {
            action: "Save",
            doc: project,
        },
        callback: function(r, rt) {
            log("updatedProject: "+project.name);

            if(project.name == lastProjectId)
                frappe.msgprint("FINALIZA CALCULO INDICADORES DE PROYECTOS.");

            if(r.message) {
                //no confirma;
            }

        }
    });
}



