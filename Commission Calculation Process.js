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


var escaleraMargenVentas =[
    {"margen_inferior":0, "margen_superior":14.99, "porcentaje_comision":0},
    {"margen_inferior":15, "margen_superior":19.99, "porcentaje_comision":50},
    {"margen_inferior":20, "margen_superior":24.99, "porcentaje_comision":70},
    {"margen_inferior":25, "margen_superior":29.99, "porcentaje_comision":90},
    {"margen_inferior":30, "margen_superior":39.99, "porcentaje_comision":100},
    {"margen_inferior":40, "margen_superior":44.99, "porcentaje_comision":110},
    {"margen_inferior":45, "margen_superior":9999, "porcentaje_comision":111}
];

var escaleraMargenMantenimiento =[
    {"margen_inferior":0, "margen_superior":9.99, "porcentaje_comision":0},
    {"margen_inferior":10, "margen_superior":14.99, "porcentaje_comision":50},
    {"margen_inferior":15, "margen_superior":17.99, "porcentaje_comision":90},
    {"margen_inferior":18, "margen_superior":20.99, "porcentaje_comision":100},
    {"margen_inferior":21, "margen_superior":23.99, "porcentaje_comision":110},
    {"margen_inferior":24, "margen_superior":9999, "porcentaje_comision":111},
];


frappe.ui.form.on("Commission Calculation Process", {
        refresh: function(frm) {
            var me = this

            var isCoordinadoraAdministrativa = !isEmpty(frappe.user.has_role("Coordinadora administrativa"));

            console.log("estado: "+cur_frm.doc.status+" isCoordinadoraAdministrativa: "+isCoordinadoraAdministrativa);

            if(isCoordinadoraAdministrativa) {
                cur_frm.add_custom_button(("Calcular comisiones"), function() {
                    calcularComisiones();
                });

                cur_frm.add_custom_button(("Calcular indicadores de proyectos"), function() {
                    calcularIndicadoresProyectos();
                });
            }
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


function getMontoComisionable(salesOrder) {

    console.log("salesOrder.version_modelo_comisiones",salesOrder.version_modelo_comisiones);



    if(salesOrder.version_modelo_comisiones == 2019)
        return getAmountNoTaxes(salesOrder.taxes_and_charges, salesOrder.grand_total);



    var escalera = [];
    var montoComisionable = 0;

    if(salesOrder.order_type == "Sales")
        escalera = escaleraMargenVentas;
    else
        escalera = escaleraMargenMantenimiento;


    for (var i in escalera) {
        if(escalera[i].margen_inferior<salesOrder.margen && salesOrder.margen <= escalera[i].margen_superior) {
            montoComisionable = salesOrder.grand_total * salesOrder.margen / 100 * escalera[i].porcentaje_comision / 100;

            break;
        }
    }

    return montoComisionable;
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

    frappe.db.get_list('Sales Person',{
        fields: ["`tabSales Person`.`name`","`tabSales Person`.`parent_sales_person`","`tabSales Person`.`is_group`","`tabSales Person Commisions details`.`type`","`tabSales Person Commisions details`.`percentage`","`tabSales Person`.`gerente`","`tabSales Person`.`supplier`"],
        filters: [["Sales Person","is_group","=",0],["Sales Person","enabled","=",1]],
        limit:500,
    }).then(records => {
        if(!isEmpty(records)) {
            console.log('SALES PERSON', records);
            salesPersonMap = {};
            gerenteMap = {};
            supplierMap = {};

            $.each(records, function(i, d) {
                var isGroup = d.is_group;
                var salesPersonName = d.name;
                var type = d.type;
                var percentage = d.percentage;
                var gerente = d.gerente;
                var supplier = d.supplier;

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
    })

    // cur_frm.call({ // TODO 1 Call para Cambiar
    //     method: "frappe.desk.reportview.get",
    //     args: {
    //         start: 0,
    //         page_length: 500,
    //         doctype: "Sales Person",
    //         fields: ["`tabSales Person`.`name`","`tabSales Person`.`parent_sales_person`","`tabSales Person`.`is_group`","`tabSales Person Commisions details`.`type`","`tabSales Person Commisions details`.`percentage`","`tabSales Person`.`gerente`","`tabSales Person`.`supplier`"],
    //         filters: [["Sales Person","is_group","=",0],["Sales Person","enabled","=",1]],
    //         with_childnames: 1
    //     },
    //     callback: function(r, rt) {
    //         if(r.message) {
    //             console.log("message loadSalesPersons: "+JSON.stringify(r.message));
    //             salesPersonMap = {};
    //             gerenteMap = {};
    //             supplierMap = {};
    //
    //             $.each(r.message.values, function(i, d) {
    //                 log("gerente d[0]: "+d[0]+" salesPersonName d[2]: "+d[2]+" d[3]: "+d[3]+" isGroup d[4]: "+d[4]+" percentage d[6]: "+d[6]+" type d[7]: "+d[7]+" supplier d[5]: "+d[5]);
    //                 var isGroup = d[4];
    //                 var salesPersonName = d[2];
    //                 var type = d[7];
    //                 var percentage = d[6];
    //                 var gerente = d[0];
    //                 var supplier = d[5];
    //
    //                 gerenteMap[salesPersonName] = gerente;
    //                 supplierMap[salesPersonName] = supplier;
    //
    //                 if(isEmpty(salesPersonMap[salesPersonName])) {
    //                     var comisionesMap = {};
    //                     comisionesMap[type] = percentage;
    //                     salesPersonMap[salesPersonName] = comisionesMap;
    //                 } else
    //                     salesPersonMap[salesPersonName][type] = percentage;
    //
    //             });
    //             log("salesPersonMap: "+JSON.stringify(salesPersonMap));
    //             log("gerenteMap: "+JSON.stringify(gerenteMap));
    //             log("supplierMap: "+JSON.stringify(supplierMap));
    //             cargarOVs();
    //
    //         }
    //     }
    // });
}


var lastOvId = -999;
function cargarOVs() {
    log("cargarOVs");
    lastOvId = -999;


    var filters = [["Sales Order","reglas_cargadas","=",0],["Sales Order","transaction_date",">","2018-08-27"],["Sales Order","status","!=","Cancelled"],["Sales Order","status","!=","Draft"]
    ];

    if( !isEmpty(cur_frm.doc.sales_order))
        filters.push(["Sales Order","name","like",cur_frm.doc.sales_order]);


    frappe.db.get_list('Sales Order', {
        fields: ['name',
            'transaction_date',
            'customer',
            'title',
            'status',
            'grand_total',
            'project',
            'from_lead',
            'order_type',
            'version_modelo_comisiones'
        ],
        filters: filters,
        limit: 1000
    }).then(records => {
        console.log("cargarOVs reglas",records);

        if(records && !isEmpty(records)) {

            var currentOvId = -999;
            $.each(records, function(i, d) {
                currentOvId = d.name;
                cargarDistribucionAsesores(i, d);
            });
            lastOvId = currentOvId;
        } else {
            log("No existían órdenes de venta por procesar. Fin.");
            frappe.update_msgprint('No habían reglas para cargar.');
            cargarOVsPagos();
        }
    });


}


var comisionesMap = {};

function addComisiones(salesOrder, soName, salesPersonName, percentage, type) {

    //var amountNoTaxes = getAmountNoTaxes(salesOrder.taxes_and_charges, salesOrder.grand_total);
    var montoComisionable = getMontoComisionable(salesOrder);

    console.log("addComisiones - salesOrder.taxes_and_charges: "+salesOrder.taxes_and_charges+" salesOrder.grand_total: "+salesOrder.grand_total+" montoComisionable: "+montoComisionable+" salesOrder.order_type: "+salesOrder.order_type+"  salesOrder.margen: "+salesOrder.margen);

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
        "total": montoComisionable * percentage/100
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
    var name = so.name;
    var comissionType = "Sales";
    var comissionTypeGerente = "Gerente Sales";

    if (so.order_type == "Sales") {
        comissionType = "Sales";
        comissionTypeGerente = "Gerente Sales";
    } else {
        comissionType = "Maintenance";
        comissionTypeGerente = "Gerente Maintenance";
    }

    if(so.version_modelo_comisiones == 2019) {
        comissionType = "Asesor";
        comissionTypeGerente = "Gerente de Diseño y Planificación";
    }


    log("cargarDistribucionAsesores "+i+") "+name);



    frappe.model.with_doc("Sales Order", name, function() {
        var salesOrder = frappe.model.get_doc("Sales Order", name);

        var asignaComiGerente = false;

        $.each(salesOrder.comisiones_asesor, function(index, row) {
            var gerente = gerenteMap[row.asesor];

            var pctAsesor = salesPersonMap[row.asesor][comissionType];


            log("so name: "+name+" row.asesor:"+row.asesor+" pctAsesor: "+pctAsesor+" comissionType: "+comissionType+" row.distribucion: "+row.distribucion+" gerente: "+gerente);


            if(!isEmpty(pctAsesor)) {
                addComisiones(salesOrder, name, row.asesor, row.distribucion*pctAsesor/100, comissionType);
                //Elimina comisión de gerente si tiene, no puede comisionar como gerente y como asesor
                delComisiones(name, row.asesor, comissionTypeGerente);
            }



            if(!isEmpty(gerente) && !asignaComiGerente) {
                var pctGerente = salesPersonMap[gerente][comissionTypeGerente];
                if(!isEmpty(pctGerente)) {
                    //Aplica si no aparece como asesor en esta OV, no puede comisionar como gerente y como asesor
                    if (!hasComisiones(name, gerente, comissionType)) {
                        addComisiones(salesOrder, name, gerente, pctGerente, comissionTypeGerente);// solo aplica para el primer asesor que encuentre
                        asignaComiGerente = true;
                    }
                }
            }


        });
        //console.log("comisionesMap: "+JSON.stringify(comisionesMap));
        cargarDistribucionAsesoresComerciales(i, so, salesOrder);
    });
}

function cargarDistribucionAsesoresComerciales(i, so, salesOrder) {
    var name = so.name;
    var comissionType = "Comercial Sales";

    if (so.order_type == "Sales") {
        comissionType = "Comercial Sales";
    } else {
        comissionType = "Comercial Maintenance";
    }

    if(so.version_modelo_comisiones == 2019) {
        comissionType = "";
    }

    log("cargarDistribucionAsesoresComerciales "+i+") "+name+" cur_frm.doc.includes_commercial_advisor_commission: "+salesOrder.includes_commercial_advisor_commission);

    if(salesOrder.includes_commercial_advisor_commission == "Si") {
        $.each(salesOrder.comisiones_asesores_comerciales, function(index, row) {

            var pctAsesor = salesPersonMap[row.asesor_comercial][comissionType];

            log("so name: "+name+" row.asesor_comercial:"+row.asesor_comercial+" pctAsesor: "+pctAsesor+" comissionType: "+comissionType+" row.distribucion: "+row.distribucion);

            addComisiones(salesOrder, name, row.asesor_comercial, row.distribucion*pctAsesor/100, comissionType);

        });
    }
    //console.log("comisionesMap: "+JSON.stringify(comisionesMap));
    cargarDistribucionDisenadores(i, so, salesOrder);

}

function cargarDistribucionDisenadores(i, so, salesOrder) {
    var name = so.name;
    var comissionType = "Diseñador Sales";

    if (so.order_type == "Sales") {
        comissionType = "Diseñador Sales";
    } else {
        comissionType = "Diseñador Maintenance";
    }

    if(so.version_modelo_comisiones == 2019) {
        comissionType = "Asesor";
    }

    log("cargarDistribucionDisenadores "+i+") "+name+" cur_frm.doc.includes_designer_commission: "+salesOrder.includes_designer_commission);

    if(salesOrder.includes_designer_commission == "Si") {
        $.each(salesOrder.comisiones_disenadores, function(index, row) {

            var pctAsesor = salesPersonMap[row.disenador][comissionType];

            log("so name: "+name+" row.disenador:"+row.disenador+" pctAsesor: "+pctAsesor+" comissionType: "+comissionType+" row.distribucion: "+row.distribucion);

            addComisiones(salesOrder, name, row.disenador, row.distribucion*pctAsesor/100, comissionType);

        });
    }
    //console.log("comisionesMap: "+JSON.stringify(comisionesMap));
    cargarComisionSupervisor(i, so, salesOrder);

}

function cargarComisionSupervisor(i, so, salesOrder) {
    var name = so.name;
    var projectName = so.project;
    var comissionType = "Sales";
    var comissionTypeGerente = "Gerente Sales";

    if (so.order_type == "Sales") {
        comissionType = "Sales";
        comissionTypeGerente = "Gerente Sales";
    } else {
        comissionType = "Maintenance";
        comissionTypeGerente = "Gerente Maintenance";
    }

    if(so.version_modelo_comisiones == 2019) {
        comissionType = "Operativa";
        comissionTypeGerente = "Gerente de Proyectos";
    }

    console.log("salesOrder.order_type: "+salesOrder.order_type);
    if(salesOrder.order_type== "Sales") {
        updateSO(salesOrder, true, "CARGADAS_OK_IS_SALES");
        return;
    }
    if(salesOrder.no_aplica_comisiones_a_supervisor==1) {
        updateSO(salesOrder, true, "CARGADAS_OK_NA_SUPERVISOR");
        return;
    }



    /*
    //2019Sep23 Busca en proyectos, a partir del SO NAME
    if(isEmpty(projectName)) {
        updateSO(salesOrder, false, "FALTA PROJECT EN OV");
        return;
    }*/

    frappe.db.get_value('Project',
        {sales_order: name},
        ['status', 'supervisor'])
        .then(r => {

            let values = r.message;

            if( isEmpty(values) || isEmpty(values.supervisor) || values.supervisor=="null" || values.status=="Cancelled" ) {
                updateSO(salesOrder, false, "FALTA PROJECT A OV");
                return;
            }

            console.log("SUPERVISOR",values.supervisor, "status",values.status);

            frappe.db.get_value('Sales Person',
                {user_id: values.supervisor },
                'sales_person_name')
                .then(r => {

                    let valuesSP = r.message;

                    console.log("valuesSP",valuesSP);

                    if( isEmpty(valuesSP) || isEmpty(valuesSP.sales_person_name) ) {
                        updateSO(salesOrder, false, "SUPERVISOR NO ES SALES PERSON");
                        return false;
                    }

                    log("sales person supervisor: "+valuesSP.sales_person_name);

                    var spSupervisor = valuesSP.sales_person_name;
                    var pctSupervisor = salesPersonMap[spSupervisor][comissionType];

                    var spGerente = gerenteMap[spSupervisor];
                    var pctGerente ;
                    if(!isEmpty(salesPersonMap[spGerente]))
                        pctGerente = salesPersonMap[spGerente][comissionTypeGerente];// PARA TODOS LOS PROYECTOS

                    log("spSupervisor: "+spSupervisor+" pctSupervisor:"+pctSupervisor+" spGerente: "+spGerente+" pctGerente:"+pctGerente+" comissionType: "+comissionType+" comissionTypeGerente: "+comissionTypeGerente);

                    if(!isEmpty(pctSupervisor))
                        addComisiones(salesOrder, name, spSupervisor, pctSupervisor, comissionType);
                    if(!isEmpty(pctGerente))
                        addComisiones(salesOrder, name, spGerente, pctGerente, comissionTypeGerente);

                    log("comisionesMap: "+JSON.stringify(comisionesMap));
                    cargarComisionProspecto(i, so, salesOrder);


                });

        });

}



function cargarComisionProspecto(i, so, salesOrder) {
    var name = so.name;
    var projectName = so.project;
    var fromLead = so.from_lead;

    var comissionType = "Prospecto Sales";

    if (so.order_type == "Sales") {
        comissionType = "Prospecto Sales";
    } else {
        comissionType = "Prospecto Maintenance";
    }

    if(so.version_modelo_comisiones == 2019) {
        comissionType = "Prospecto";
    }

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
                            var pctProspecto = salesPersonMap[spProspecto][comissionType];

                            if(!isEmpty(pctProspecto))
                                addComisiones(salesOrder, name, spProspecto, pctProspecto, comissionType);

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
    frappe.update_msgprint('Carga reglas ' +salesOrder.name);

    if(!isEmpty(cur_frm.doc.sales_order))
        console.log("updateSO: ",salesOrder.name,"salesOrder",salesOrder);

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
                frappe.update_msgprint('100% Reglas Cargadas ');
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

    var filters = [["Sales Order","transaction_date",">","2018-05-01"],["Sales Order","status","!=","Cancelled"],["Sales Order","status","!=","Draft"],["Sales Order","reglas_cargadas","=",1],["Sales Order","calculo_comisiones_completado","=",0]
    ];

    if( !isEmpty(cur_frm.doc.sales_order))
        filters.push(["Sales Order","name","like",cur_frm.doc.sales_order]);

    frappe.db.get_list('Sales Order',{
        fields: ["`tabSales Order`.`name`","`tabSales Order`.`transaction_date`","`tabSales Order`.`customer`","`tabSales Order`.`title`","`tabSales Order`.`status`","`tabSales Order`.`grand_total`","`tabSales Order`.`project`","`tabSales Order`.`from_lead`"],
        filters: filters,
        limit:500,
    }).then(records =>{
        if (!isEmpty(records)){
            salesOrderMap = {};
            console.log('cargarOVsPagos', records)

            $.each(records, function(i, d) {

                frappe.model.with_doc("Sales Order", d.name, function() {
                    var salesOrder = frappe.model.get_doc("Sales Order", d.name);
                    loadPayInvoiceFromSO(i, salesOrder);
                });
            });
        } else
            log("No existían órdenes de venta por procesar para calcular comisiones. Fin.");
    })

    // cur_frm.call({ // TODO 5 Call para Cambiar
    //     method: "frappe.desk.reportview.get",
    //     args: {
    //         start: 0,
    //         page_length: 500,
    //         doctype: "Sales Order",
    //         fields: ["`tabSales Order`.`name`","`tabSales Order`.`transaction_date`","`tabSales Order`.`customer`","`tabSales Order`.`title`","`tabSales Order`.`status`","`tabSales Order`.`grand_total`","`tabSales Order`.`project`","`tabSales Order`.`from_lead`"],
    //         filters: filters,
    //         with_childnames: 1
    //     },
    //     callback: function(r, rt) {
    //         if(r.message) {
    //             log("message cargarOVsPagos: "+JSON.stringify(r.message));
    //
    //             salesOrderMap = {};
    //
    //             $.each(r.message.values, function(i, d) {
    //
    //                 frappe.model.with_doc("Sales Order", d[4], function() {
    //                     var salesOrder = frappe.model.get_doc("Sales Order", d[4]);
    //                     loadPayInvoiceFromSO(i, salesOrder);
    //                 });
    //             });
    //         } else
    //             log("No existían órdenes de venta por procesar para calcular comisiones. Fin.");
    //     }
    // });

}


function loadPayInvoiceFromSO(i, salesOrder) {
    log("loadPayInvoiceFromSO "+i+") "+salesOrder.name+" salesOrder.project: "+salesOrder.project);

    var filters = [["Purchase Invoice","docstatus","=","1"],["Purchase Invoice Item","expense_account","=","Gasto de Comisiones Sobre Ventas - GC"]];

    var soName = "asdfasdf-99999";
    if (!isEmpty(salesOrder.name))
        soName = salesOrder.name;

    filters.push(["Purchase Invoice Item","sales_order","=",soName]);

    cur_frm.call({
        method: "frappe.desk.reportview.get",
        args: {
            start: 0,
            page_length: 500,
            doctype: "Purchase Invoice",
            fields: ["`tabPurchase Invoice`.`name`","`tabPurchase Invoice Item`.`project`","`tabPurchase Invoice Item`.`expense_account`","`tabPurchase Invoice Item`.`amount`","`tabPurchase Invoice`.`supplier`"],
            filters: filters,
            with_childnames: 1
        },
        callback: function(r, rt) {
            if(r.message && !isEmpty(r.message)) {
                log("message loadPayInvoiceFromSO: "+JSON.stringify(r.message));

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

                /*EN 2019 cambió la modalidad a solamente pagar sobre facturas, no sobre anticipos*/
                //loadPEfromOV(i, salesOrder);
                loadInvoicefromOV(i, salesOrder);

            } else {
                loadPayInvoice(i, salesOrder);
            }


        }
    });
}


function loadPayInvoice(i, salesOrder) {
    log("loadPayInvoice "+i+") "+salesOrder.name+" salesOrder.project: "+salesOrder.project);

    var filters = [["Purchase Invoice","docstatus","=","1"],["Purchase Invoice Item","expense_account","=","Gasto de Comisiones Sobre Ventas - GC"]];

    var soProject = "asdfasdf-99999";
    if (!isEmpty(salesOrder.project))
        soProject = salesOrder.project;


    filters.push(["Purchase Invoice Item","project","=",soProject]);

    cur_frm.call({
        method: "frappe.desk.reportview.get",
        args: {
            start: 0,
            page_length: 500,
            doctype: "Purchase Invoice",
            fields: ["`tabPurchase Invoice`.`name`","`tabPurchase Invoice Item`.`project`","`tabPurchase Invoice Item`.`expense_account`","`tabPurchase Invoice Item`.`amount`","`tabPurchase Invoice`.`supplier`"],
            filters: filters,
            with_childnames: 1
        },
        callback: function(r, rt) {
            if(r.message && !isEmpty(r.message)) {
                log("message loadPayInvoice: "+JSON.stringify(r.message));

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


            }

            /*EN 2019 cambió la modalidad a solamente pagar sobre facturas, no sobre anticipos*/
            //loadPEfromOV(i, salesOrder);
            loadInvoicefromOV(i, salesOrder);

        }
    });
}







/*CARGA LOS ANTICIPOS ASOCIADOS A UNA OV

2019 la modalidad es pagar solamente sobre lo facturado, no sobre anticipos.

*/
function loadPEfromOV(i, salesOrder) {
    log("loadPEfromOV "+i+") "+salesOrder.name);

    cur_frm.call({
        method: "frappe.desk.reportview.get",
        args: {
            start: 0,
            page_length: 500,
            doctype: "Payment Entry",
            fields: ["`tabPayment Entry`.`name`","`tabPayment Entry`.`paid_amount`","`tabPayment Entry Reference`.`reference_name`","`tabPayment Entry Reference`.`reference_doctype`","`tabPayment Entry`.`posting_date`","`tabPayment Entry`.`mode_of_payment`","`tabPayment Entry`.`reference_date`","`tabPayment Entry`.`reference_no`","`tabPayment Entry`.`paid_amount`","`tabPayment Entry`.`project`","`tabPayment Entry`.`party_type`","`tabPayment Entry`.`party_name`","`tabPayment Entry Reference`.`allocated_amount` as 'Payment Entry Reference:allocated_amount'"],
            filters: [["Payment Entry","docstatus","=","1"],["Payment Entry Reference","reference_doctype","=","Sales Order"],["Payment Entry Reference","reference_name","=",salesOrder.name]],
            with_childnames: 1
        },
        callback: function(r, rt) {
            if(r.message) {
                log("message loadPEfromOV: "+JSON.stringify(r.message));

                if(isEmpty(salesOrderMap[salesOrder.name]))
                    salesOrderMap[salesOrder.name] = new SalesOrder();

                $.each(r.message.values, function(i, d) {
                    log("name d[2]: "+d[2]+" paidAmount d[3]: "+d[3]+" referenceNo d[1]: "+d[1]+" referenceDate d[11]: "+d[11]+" modeOfPayment d[5]: "+d[5]+" allocated_amount d[7]: "+d[7]);

                    var peId = d[2];
                    var paidAmount = d[3];
                    var referenceNo = d[1];
                    var referenceDate = d[11];
                    var modeOfPayment = d[5];
                    var allocated_amount = d[7];

                    salesOrderMap[salesOrder.name].addPeReceiveTotal(allocated_amount);
                    salesOrderMap[salesOrder.name].addPeReceiveDetails(peId, modeOfPayment, referenceDate, referenceNo,
                        frappe.format(allocated_amount, {"fieldtype":"Currency"}));

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
            linkinfo: {"Sales Invoice":{"child_doctype":"Sales Invoice Item","fieldname":["sales_order"]}}
        },
        callback: function(r, rt) {
            if(r.message && !isEmpty(r.message) && !isEmpty(r.message["Sales Invoice"])) {
                log("message loadInvoicefromOV: "+JSON.stringify(r.message));

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

    frappe.db.get_value('Sales Invoice', salesInvoiceId, 'conversion_rate')
        .then(r => {
            console.log("conversion_rate",r.message.conversion_rate);

            var conversionRate = 1;
            if(!isEmpty(r.message.conversion_rate))
                conversionRate = r.message.conversion_rate;


            log("loadPEfromInvoice "+i+") "+salesOrder.name+" salesInvoiceId: "+salesInvoiceId);

            cur_frm.call({
                method: "frappe.desk.reportview.get",
                args: {
                    start: 0,
                    page_length: 500,
                    doctype: "Payment Entry",
                    fields: ["`tabPayment Entry`.`name`","`tabPayment Entry`.`paid_amount`","`tabPayment Entry Reference`.`reference_name`","`tabPayment Entry Reference`.`reference_doctype`","`tabPayment Entry`.`posting_date`","`tabPayment Entry`.`mode_of_payment`","`tabPayment Entry`.`reference_date`","`tabPayment Entry`.`reference_no`","`tabPayment Entry`.`paid_amount`","`tabPayment Entry`.`project`","`tabPayment Entry`.`party_type`","`tabPayment Entry`.`party_name`", "`tabPayment Entry Reference`.`allocated_amount` as 'Payment Entry Reference:allocated_amount'"],

                    filters: [["Payment Entry","docstatus","=","1"],["Payment Entry Reference","reference_doctype","=","Sales Invoice"],["Payment Entry Reference","reference_name","=",salesInvoiceId]],
                    with_childnames: 1
                },
                callback: function(r, rt) {
                    if(r.message) {
                        log("message loadPEfromInvoice: "+JSON.stringify(r.message));

                        if(isEmpty(salesOrderMap[salesOrder.name]))
                            salesOrderMap[salesOrder.name] = new SalesOrder();

                        $.each(r.message.values, function(i, d) {
                            log("name d[2]: "+d[2]+" paidAmount d[3]: "+d[3]+" referenceNo d[1]: "+d[1]+" referenceDate d[11]: "+d[11]+" modeOfPayment d[5]: "+d[5]+" allocated_amount d[7]: "+d[7]);

                            var peId = d[2];
                            var paidAmount = d[3];
                            var referenceNo = d[1];
                            var referenceDate = d[11];
                            var modeOfPayment = d[5];
                            var allocated_amount = d[7] / conversionRate;

                            salesOrderMap[salesOrder.name].addInvoicePeReceiveTotal(allocated_amount);
                            salesOrderMap[salesOrder.name].addInvoicePeReceiveDetails(salesInvoiceId,peId, modeOfPayment, referenceDate, referenceNo, frappe.format(allocated_amount, {"fieldtype":"Currency"}));

                        });
                        //log("salesOrderMap: "+JSON.stringify(salesOrderMap));
                    }

                    var j = i+1;
                    loadPEfromInvoice(j, salesOrder, listSinv);

                }
            });

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
            //var amountNoTaxes = getAmountNoTaxes(salesOrder.taxes_and_charges, salesOrder.grand_total);
            var montoComisionable = getMontoComisionable(salesOrder);
            sp.total = montoComisionable * sp.percentage / 100;
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
    frappe.update_msgprint('Procesa pagos ' +salesOrder.name);

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











/*
***************************************************************************************************
***************************************************************************************************
CALCULAR INDICADORES DE PROYECTOS
*/


function callTasks(projectNew) { // TODO 2
    console.log('LOG2',projectNew)

    cur_frm.call({
        method: "frappe.client.get_list",
        args: {
            doctype: "Task",
            limit_page_length: 1000,
            fields: ["subject","comentario_avance_supervisor","exp_start_date","exp_end_date","progress","percent_expected","imagenes_avance","name"],
            filters:{"project":projectNew.name }
        },
        callback: function(r, rt) {
            if(r.message) {
                console.log("r.message: "+JSON.stringify(r.message));
                projectNew.setStartEndDates(r.message);
            }

        }
    });

}


function updTask(task) {
    frappe.call({
        "method": "frappe.client.set_value",
        "args": {
            "doctype": "Task",
            "name": task.name,
            "fieldname": "percent_expected",
            "value": task.percent_expected
        }
    });
    log("     updTask "+task.subject+" task.percent_expected: "+task.percent_expected);
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



    obtenerAvanceEsperado(task) {
        var hoy = new Date();
        var duracionCompletadaEsperada = 0;

        var duracionTarea = frappe.datetime.get_diff(task.exp_end_date, task.exp_start_date) + 1;
        console.log("duracionTarea: "+duracionTarea + " task.exp_end_date: "+task.exp_end_date + " task.exp_start_date: "+task.exp_start_date+" hoy: "+hoy);

        if(frappe.datetime.get_diff(task.exp_end_date, hoy)<0) {
            duracionCompletadaEsperada += duracionTarea;
            console.log("esperada duracionTarea: "+task.subject+" - "+duracionTarea);
        } else {
            var duracionTareaExpected = frappe.datetime.get_diff(hoy, task.exp_start_date);
            if(duracionTareaExpected>0) {
                duracionCompletadaEsperada += duracionTareaExpected;
            }
            console.log("esperada duracionTareaExpected: "+task.subject+" - "+duracionTareaExpected);

        }
        console.log("duracionCompletadaEsperada: "+duracionCompletadaEsperada);

        var percent_expected = duracionCompletadaEsperada / duracionTarea * 100;
        percent_expected = Math.round(percent_expected * 100) / 100;

        console.log("percent_expected: "+percent_expected);

        task.percent_expected = percent_expected;
        updTask(task);
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


    setStartEndDates(tasks) {

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

        console.log('LOG2.1', tasks)
        $.each(tasks, function(i, d) {

            var duracionTarea = frappe.datetime.get_diff(d.exp_end_date, d.exp_start_date) + 1;

            duracionTotal += duracionTarea;
            duracionCompletada += duracionTarea * d.progress / 100;

            if(frappe.datetime.get_diff(d.exp_end_date, hoy)<0) {
                duracionCompletadaEsperada += duracionTarea;
                //msgprint("esperada duracionTarea: "+d.title+" - "+duracionTarea);
            } else {
                var duracionTareaExpected = frappe.datetime.get_diff(hoy, d.exp_start_date);
                if(duracionTareaExpected>0) {
                    duracionCompletadaEsperada += duracionTareaExpected;
                }
                //msgprint("esperada duracionTareaExpected: "+d.title+" - "+duracionTareaExpected);

            }


            if(isEmpty(expected_start_date) || frappe.datetime.get_diff(d.exp_start_date, expected_start_date)<0)
                expected_start_date = d.exp_start_date;

            if(isEmpty(expected_end_date))
                expected_end_date = d.exp_end_date;

            if(frappe.datetime.get_diff(expected_end_date, d.exp_end_date)<0)
                expected_end_date = d.exp_end_date;

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


}




















var projectsMap = {};

var lastProjectId = "";

function cargarProyectos() { // TODO 1
    log("cargarProyectos");
    lastProjectId = "";

    frappe.db.get_list('Project',{
        fields: ["`tabProject`.`customer`","`tabProject`.`name`","`tabProject`.`is_active`","`tabProject`.`status`"],
        filters: [
            ["Project","creation",">","2019-01-01"]
            ,["Project","workflow_state","!=","Cancelado",false]
            ,["Project","workflow_state","!=","Completado",false]
            // ,["Project","name","=","04208-1 - Registros de tablayeso adicionales - GC"]
        ],
        limit:500,
    }).then(records =>{
        if (!isEmpty(records)){
            projectsMap = {};

            $.each(records, function(i, d) {
                frappe.model.with_doc("Project", d.name, function() {
                    var project = frappe.model.get_doc("Project", d.name);

                    log("get_doc "+i+") project.name: "+project.name);
                    lastProjectId = project.name;

                    projectsMap[project.name] = new Project(project.name, project.supervisor, project.tasks);
                    //log("project: "+JSON.stringify(projectsMap[project.name]));
                    callTasks(projectsMap[project.name]);
                    loadBudgets(project);
                });
            });
        }else{
            log("No existían proyectos por procesar. Fin.");
        }

    })

    // cur_frm.call({ // TODO 2 Call para Cambiar
    //     method: "frappe.desk.reportview.get",
    //     args: {
    //         start: 0,
    //         page_length: 500,
    //         doctype: "Project",
    //         fields: ["`tabProject`.`customer`","`tabProject`.`name`","`tabProject`.`is_active`","`tabProject`.`status`"],
    //         filters: [
    //             ["Project","creation",">","2019-01-01"]
    //             ,["Project","workflow_state","!=","Cancelado",false]
    //             ,["Project","workflow_state","!=","Completado",false]
    //             //,["Project","name","=","04158 - Mobiliario Edificio Bonin - GC"]
    //         ],
    //         with_childnames: 1
    //     },
    //     callback: function(r, rt) {
    //         if(r.message) {
    //             //log("message cargarProyectos: "+JSON.stringify(r.message));
    //
    //             projectsMap = {};
    //
    //
    //             $.each(r.message.values, function(i, d) {
    //                 console.log('mensaje', r.message.values)
    //                 frappe.model.with_doc("Project", d[3], function() {
    //                     var project = frappe.model.get_doc("Project", d[3]);
    //
    //                     log("get_doc "+i+") project.name: "+project.name);
    //                     lastProjectId = project.name;
    //
    //                     projectsMap[project.name] = new Project(project.name, project.supervisor, project.tasks);
    //                     //log("project: "+JSON.stringify(projectsMap[project.name]));
    //                     callTasks(projectsMap[project.name]);
    //                     loadBudgets(project);
    //                 });
    //             });
    //         } else
    //             log("No existían proyectos por procesar. Fin.");
    //     }
    // });

}


function loadBudgets(project) {
    log("loadBudgets "+project.name);

    if(isEmpty(project.cost_center)) {
        frappe.msgprint("Proyecto no tiene centro de costo: "+project.name);
        return false;
    }

    frappe.db.get_list('Budget',{
        fields: ["`tabBudget`.`name`","`tabBudget`.`project`","`tabBudget`.`cost_center`","`tabBudget Account`.`account`","`tabBudget Account`.`budget_amount`"],
        filters: [["Budget","docstatus","=","1"],["Budget","cost_center","=",project.cost_center],["Budget","budget_amount",">",1]],
        limit:500,
    }).then(records =>{
        if (!isEmpty(records)){
            budgetGroupByExpAcc(project, records);
        }
        loadPurchaseInvoices(project);

    });

    // cur_frm.call({ // TODO 3 Call para Cambiar
    //     method: "frappe.desk.reportview.get",
    //     args: {
    //         start: 0,
    //         page_length: 500,
    //         doctype: "Budget",
    //         fields: ["`tabBudget`.`name`","`tabBudget`.`project`","`tabBudget`.`cost_center`","`tabBudget Account`.`account`","`tabBudget Account`.`budget_amount`"],
    //         filters: [["Budget","docstatus","=","1"],["Budget","cost_center","=",project.cost_center],["Budget","budget_amount",">",1]],
    //         with_childnames: 1
    //     },
    //     callback: function(r, rt) {
    //         if(r.message) {
    //             console.log("loadBudgets message: "+JSON.stringify(r.message));
    //             budgetGroupByExpAcc(project, r.message);
    //             //console.log("loadBudgets projectsMap: "+JSON.stringify(projectsMap));
    //         }
    //         loadPurchaseInvoices(project);
    //     }
    // });
}



function budgetGroupByExpAcc(project, report) {
    $.each(report, function(i, d) {
        log("budgetGroupByExpAcc d.expense_account: "+d.account+" d.budget_amount: "+d.budget_amount);

        if("Gasto de Comisiones Sobre Ventas - GC" === d.account)
            return;

        projectsMap[project.name].addBudgetAmount(d.account, d.budget_amount);

    });

    // $.each(report.values, function(i, d) { // TODO 3.1 Se Modifico la funcion budgetGroupByExpAcc
    //     log("budgetGroupByExpAcc d.expense_account: "+d[0]+" d.budget_amount: "+d[5]);
    //
    //     if("Gasto de Comisiones Sobre Ventas - GC" == d[0])
    //         return;
    //
    //     projectsMap[project.name].addBudgetAmount(d[0], d[5]);
    //
    // });
}






function loadPurchaseInvoices(project) {
    log("loadPurchaseInvoices "+project.name);

    frappe.db.get_list('Purchase Invoice',{
        fields: ["`tabPurchase Invoice`.`name`","`tabPurchase Invoice Item`.`project`","`tabPurchase Invoice Item`.`expense_account`","`tabPurchase Invoice Item`.`amount`","`tabPurchase Invoice`.`status`"],
        filters: [["Purchase Invoice","docstatus","!=","2"],["Purchase Invoice Item","project","=",project.name],["Purchase Invoice","docstatus","!=","0"]],
        limit:1000,
    }).then(records =>{
        if (!isEmpty(records)){
            console.log("loadPurchaseInvoices message: "+JSON.stringify(records));
            purchaseInvoicesGroupByExpAcc(project, records);
        }
        loadPurchaseOrders(project);

    });

    // cur_frm.call({ // TODO 4 Call para Cambiar
    //     method: "frappe.desk.reportview.get",
    //     args: {
    //         start: 0,
    //         page_length: 1000,
    //         doctype: "Purchase Invoice",
    //         fields: ["`tabPurchase Invoice`.`name`","`tabPurchase Invoice Item`.`project`","`tabPurchase Invoice Item`.`expense_account`","`tabPurchase Invoice Item`.`amount`","`tabPurchase Invoice`.`status`"],
    //         filters: [["Purchase Invoice","docstatus","!=","2"],["Purchase Invoice Item","project","=",project.name],["Purchase Invoice","docstatus","!=","0"]],
    //         with_childnames: 1
    //     },
    //     callback: function(r, rt) {
    //         if(r.message) {
    //             console.log("loadPurchaseInvoices message: "+JSON.stringify(r.message));
    //             purchaseInvoicesGroupByExpAcc(project, r.message);
    //             //console.log("loadBudgets projectsMap: "+JSON.stringify(projectsMap));
    //         }
    //         loadPurchaseOrders(project);
    //     }
    // });
}




function purchaseInvoicesGroupByExpAcc(project, report) {

    $.each(report.values, function(i, d) {
        var expenseHead = d.expense_account;
        var amount = d.amount;
        var status = d.status;

        log("purchaseInvoicesGroupByExpAcc d.expense_account: "+expenseHead+" d.amount: "+amount+" status: "+status);

        if("Gasto de Comisiones Sobre Ventas - GC" == expenseHead)
            return;

        if(expenseHead=="Inventario recibido pero no cobrado - GC")
            expenseHead = "Gastos de mobiliario - GC";


        projectsMap[project.name].addPInvAmount(expenseHead, amount, status);

    });

    // $.each(report.values, function(i, d) { // TODO 4.1 Se Modifico la funcion  purchaseInvoicesGroupByExpAcc
    //     var expenseHead = d[2];
    //     var amount = d[4];
    //     var status = d[0];
    //
    //     log("purchaseInvoicesGroupByExpAcc d.expense_account: "+expenseHead+" d.amount: "+amount+" status: "+status);
    //
    //     if("Gasto de Comisiones Sobre Ventas - GC" == expenseHead)
    //         return;
    //
    //     if(expenseHead=="Inventario recibido pero no cobrado - GC")
    //         expenseHead = "Gastos de mobiliario - GC";
    //
    //
    //     projectsMap[project.name].addPInvAmount(expenseHead, amount, status);
    //
    // });
}





function loadPurchaseOrders(project) {
    frappe.db.get_list('Purchase Order',{
        fields: ["`tabPurchase Order`.`grand_total`","`tabPurchase Order`.`advance_paid`", "`tabPurchase Order`.`name`","`tabPurchase Order`.`status`","`tabPurchase Order Item`.`item_code`","`tabPurchase Order Item`.`cost_center`","`tabPurchase Order Item`.`expense_account`","`tabPurchase Order Item`.`amount`","`tabPurchase Order`.`per_received`","`tabPurchase Order`.`per_billed`"],
        filters: [["Purchase Order","docstatus","=","1"],["Purchase Order Item","cost_center","=",project.cost_center],["Purchase Order","status","like","%bill%"]],
        limit:1000,
    }).then(records =>{
        console.log('LOG4', records)
        if (!isEmpty(records)){
            purchaseOrdersGroupByExpAcc(project, records);

        }
        getProjectSO(project);

    });
    // cur_frm.call({ // TODO 6 Call para Cambiar
    //     method: "frappe.desk.reportview.get",
    //     args: {
    //         start: 0,
    //         page_length: 1000,
    //         doctype: "Purchase Order",
    //         fields: ["`tabPurchase Order`.`grand_total`","`tabPurchase Order`.`advance_paid`", "`tabPurchase Order`.`name`","`tabPurchase Order`.`status`","`tabPurchase Order Item`.`item_code`","`tabPurchase Order Item`.`cost_center`","`tabPurchase Order Item`.`expense_account`","`tabPurchase Order Item`.`amount`","`tabPurchase Order`.`per_received`","`tabPurchase Order`.`per_billed`"],
    //         filters: [["Purchase Order","docstatus","=","1"],["Purchase Order Item","cost_center","=",project.cost_center],["Purchase Order","status","like","%bill%"]],
    //         with_childnames: 1
    //     },
    //     callback: function(r, rt) {
    //         if(r.message) {
    //             console.log("loadPurchaseOrders message: "+JSON.stringify(r.message));
    //             purchaseOrdersGroupByExpAcc(project, r.message);
    //             //console.log("loadBudgets projectsMap: "+JSON.stringify(projectsMap));
    //         }
    //         getProjectSO(project);
    //         //xxxx uxpdateProject(project/*, salesOrder*/);
    //     }
    // });
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

    if(isEmpty(project.sales_order)) {
        updateProject(project, null);
        return;
    }

    frappe.model.with_doc("Sales Order", project.sales_order, function() {
        var salesOrder = frappe.model.get_doc("Sales Order", project.sales_order);

        log("get_doc project.name: "+salesOrder.name+" perBilled: "+salesOrder.per_billed+" advance_paid: "+salesOrder.advance_paid);

        updateProject(project, salesOrder);
    });

}



function updateProject(project, salesOrder) {
    log("updateProject: "+project.name);


    var projectNew = projectsMap[project.name];

    project.percent_expected_updated_on = frappe.datetime.now_datetime();
    project.budget_info_updated_on = frappe.datetime.now_datetime();
    project.percent_expected = projectNew.percent_expected;
    project.estado_de_avance = projectNew.estado;

    log("project.estado_de_avance: "+project.estado_de_avance+" project.percent_expected: "+project.percent_expected+
        " projectNew.percent_completed_creative: "+projectNew.percent_completed_creative);

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
    if (!isEmpty(salesOrder) ) {
        var per_advance_payment = salesOrder.advance_paid / salesOrder.grand_total;

        project.payment_terms = salesOrder.payment_terms_template;
        project.per_advance_payment = per_advance_payment*100;
        project.per_billed = salesOrder.per_billed;
    }

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




    //Change from Calidad to Completed
    if(project.workflow_state == "Control de calidad" || project.workflow_state == "Análisis financiero")
        project.workflow_state = "Completado";

    //Change Ejecucion to Control de Calidad
    if(
        project.workflow_state == "Ejecución" &&
        !isEmpty(project.hoja_de_aceptacion_firmada_por_cliente) &&
        !isEmpty(project.supervisor_imagen) &&
        !isEmpty(project.so_contact_person)
    )
        project.workflow_state = "Control de calidad";


    frappe.db.set_value('Project', project.name, {
        workflow_state: project.workflow_state,
        per_advance_payment: project.per_advance_payment,
        per_billed: project.per_billed ,
        billing_status: project.billing_status,
        payment_terms: project.payment_terms
    }).then(r => {
        let doc = r.message;
        console.log("project_workflow_state updated",project.name);
    })






    frappe.model.with_doc("Project Financial Analysis", project.name, function() {
        var pfa = frappe.model.get_doc("Project Financial Analysis", project.name);

        console.log("with_doc: project.name: "+project.name+" pfa: "+pfa);
        console.log('PFA',pfa)
        console.log('PFA2',project)
        if (!isEmpty(pfa)) {
            console.log('PFA NO VIENE NULLO')
            pfa.budget_info_updated_on = project.budget_info_updated_on;
            pfa.budget = project.budget;

            pfa.total_budget_amount = project.total_budget_amount;
            pfa.total_pinv_amount = project.total_pinv_amount;
            pfa.total_po_amount = project.total_po_amount;
            pfa.total_unpaid_amount = project.total_unpaid_amount;
            pfa.balance = project.balance;
            pfa.variation = project.variation;
            pfa.billing_status = project.billing_status;
            pfa.project_name = project.name;
            pfa.is_active = project.is_active;
            pfa.workflow_state = project.workflow_state;
            pfa.project_principal = project.project_principal;
            pfa.customer = project.customer;

            actualizarProjectFinancialAnalysis(pfa);
        } else {
            console.log('PFA VIENE NULLO')
            project.doctype = "Project Financial Analysis";
            project.creation = "";
            project.owner = "";
            project.modified = frappe.datetime.now_datetime();
            project.__last_sync_on ="";
            project.__unsaved ="";
            project.modified_by ="";
            project.project_name = project.name;

            crearProjectFinancialAnalysis(project);

        }
    });



}

function actualizarProjectFinancialAnalysis(pfa) {
    console.log('PFA actualizarProjectFinancialAnalysis',pfa)
    cur_frm.call({
        method: "frappe.desk.form.save.savedocs",
        silent: true,
        args: {
            action: "Save",
            doc: pfa
        },
        callback: function(r, rt) {
            log("actualizarProjectFinancialAnalysis: "+pfa.name);
            frappe.update_msgprint(pfa.name);

            if(pfa.project_name == lastProjectId)
                frappe.update_msgprint("FINALIZA CALCULO INDICADORES DE PROYECTOS.");

        },
        error: function (r) {

        }
    });
}

function crearProjectFinancialAnalysis(pfa) {

    cur_frm.call({
        method: "frappe.client.insert",
        silent: true,
        args: {
            action: "Save",
            doc: pfa
        },
        callback: function(r, rt) {
            log("crearProjectFinancialAnalysis: "+pfa.name);
            frappe.update_msgprint(pfa.name);

            if(pfa.project_name == lastProjectId)
                frappe.update_msgprint("FINALIZA CALCULO INDICADORES DE PROYECTOS.");

        },
        error: function (r) {

        }
    });
}
