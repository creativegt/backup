function isEmpty(val){
    var test =  (val === undefined || val == null || val.length <= 0) ? true : false;
    return test;
}



cur_frm.cscript.custom_onload = function(doc) {

}

function loadPurchaseInvoices() {
    var from_date = "2019-01-01";
    var to_date = "2019-02-01";

    var filters = [["Purchase Invoice","status","!=","Cancelled"],["Purchase Invoice","status","!=","Draft"],["Purchase Invoice","proveedor_no_da_factura","=",0]];

    //filters.push(["Purchase Invoice","name","like","%13419%"]);

    if(!isEmpty(cur_frm.doc.from_date))
        filters.push(["Purchase Invoice","bill_date",">=",cur_frm.doc.from_date]);
    else
        filters.push(["Purchase Invoice","bill_date",">=",from_date]);

    if(!isEmpty(cur_frm.doc.to_date))
        filters.push(["Purchase Invoice","bill_date","<=",cur_frm.doc.to_date]);
    else
        filters.push(["Purchase Invoice","bill_date","<=",to_date]);

    if(!isEmpty(cur_frm.doc.company))
        filters.push(["Purchase Invoice","company","=",cur_frm.doc.company]);

    cur_frm.doc.invoices = [];

    console.log(" filters loadPurchaseInvoices: "+JSON.stringify(filters));


    cur_frm.call({
        method: "frappe.desk.reportview.get",
        args: {
            start: 0,
            page_length: 1000,
            doctype: "Purchase Invoice",
            fields: ["`tabPurchase Invoice`.`name`","`tabPurchase Invoice`.`supplier`","`tabPurchase Invoice`.`supplier_name`","`tabPurchase Invoice`.`nit`","`tabPurchase Invoice`.`tax_id`","`tabPurchase Invoice`.`project`","`tabPurchase Invoice`.`due_date`","`tabPurchase Invoice`.`is_return`","`tabPurchase Invoice`.`establecimiento`","`tabPurchase Invoice`.`serie_factura`","`tabPurchase Invoice`.`bill_no`","`tabPurchase Invoice`.`bill_date`","`tabPurchase Invoice`.`tipo_de_documento`","`tabPurchase Invoice`.`tipo_de_transaccion`","`tabPurchase Invoice`.`currency`","`tabPurchase Invoice`.`total`","`tabPurchase Invoice`.`taxes_and_charges`","`tabPurchase Invoice`.`taxes_and_charges_added`","`tabPurchase Invoice`.`taxes_and_charges_deducted`","`tabPurchase Invoice`.`total_taxes_and_charges`","`tabPurchase Invoice`.`base_grand_total`","`tabPurchase Invoice`.`grand_total`","`tabPurchase Invoice`.`outstanding_amount`","`tabPurchase Invoice`.`bienes`","`tabPurchase Invoice`.`servicios`","`tabPurchase Invoice`.`combustibles`","`tabPurchase Invoice`.`importaciones`","`tabPurchase Invoice`.`pequeno_contribuyente`","`tabPurchase Invoice`.`total_purchases_book`","`tabPurchase Invoice`.`iva_bienes`","`tabPurchase Invoice`.`iva_servicios`","`tabPurchase Invoice`.`iva_combustibles`","`tabPurchase Invoice`.`iva_importaciones`","`tabPurchase Invoice`.`purchases_book_processed`","`tabPurchase Invoice`.`sin_iva_descartada`","`tabPurchase Invoice`.`status`","`tabPurchase Invoice`.`creation`","`tabPurchase Invoice`.`docstatus`","`tabPurchase Invoice`.`pequeno_contribuyente_servicios`","`tabPurchase Invoice`.`pequeno_contribuyente_bienes`","`tabPurchase Invoice`.`iva_exento_bienes`","`tabPurchase Invoice`.`iva_exento_servicios`","`tabPurchase Invoice`.`party_account_currency`"],
            with_childnames: 1,
            filters: filters,
            order_by: "`tabPurchase Invoice`.`bill_date` asc"
        },
        callback: function(r, rt) {
            if(r.message) {
                console.log("message loadPurchaseInvoices: "+JSON.stringify(r.message));

                $.each(r.message.values, function(i, d) {

                    var pinv = d[35];
                    var bienes = d[32];
                    var servicios = d[0];
                    var combustible = d[42];
                    var importacion = d[11] ;

                    var ivaBienes = d[6];
                    var ivaServicios = d[10];
                    var ivaCombustible = d[14];
                    var ivaImportacion = d[26] ;

                    var pequenoContribuyente = d[40];
                    var pequeno_contribuyente_bienes = d[22];
                    var pequeno_contribuyente_servicios = d[29];

                    var iva_exento_servicios = d[27];
                    var iva_exento_bienes = d[34];

                    var purchaseBookProcessed = d[1];
                    var totalPurchasesBook = d[41];
                    var sinIvaDescartada = d[12];
                    var supplier = d[15];
                    var invoice_date = d[19];
                    var invoice_no = d[9];
                    var invoice_serie = d[18];
                    var invoice_nit = d[30];

                    var tipo_de_documento = d[2];
                    var establecimiento = d[8];
                    var taxes_and_charges = d[23];
                    var tipo_de_transaccion = d[28];
                    var is_return = d[37];


                    var compras_ventas = "C";
                    var estado_del_documento = "";
                    var tipo_constancia ="";
                    var no_constancia = "";
                    var valor_constancia = "";


                    console.log(i+") pinv: "+pinv+" bienes: "+bienes+" servicios: "+servicios+" combustible: "+combustible+" importacion: "+importacion+" ivaBienes: "+ivaBienes+" ivaServicios: "+ivaServicios+" ivaCombustible: "+ivaCombustible+" ivaImportacion: "+ivaImportacion+" pequenoContribuyente: "+pequenoContribuyente+" purchaseBookProcessed: "+purchaseBookProcessed+" totalPurchasesBook: "+totalPurchasesBook+" sinIvaDescartada: "+sinIvaDescartada+" supplier: "+supplier+" invoice_date: "+invoice_date+" invoice_no: "+invoice_no+" invoice_serie: "+invoice_serie+" invoice_nit: "+invoice_nit+
                        " tipo_de_documento: "+tipo_de_documento+" establecimiento: "+establecimiento+" taxes_and_charges: "+taxes_and_charges+
                        " tipo_de_transaccion: "+tipo_de_transaccion+" is_return: "+is_return+" pequeno_contribuyente_bienes: "+pequeno_contribuyente_bienes+" pequeno_contribuyente_servicios: "+pequeno_contribuyente_servicios+
                        " iva_exento_servicios: "+iva_exento_servicios+" iva_exento_bienes: "+iva_exento_bienes
                    );

                    if(sinIvaDescartada == 0) {
                        addInvoice(bienes, ivaBienes, servicios, ivaServicios, combustible, ivaCombustible, importacion,
                            ivaImportacion, pequenoContribuyente, pinv, invoice_date, invoice_serie, invoice_no, invoice_nit,
                            supplier, tipo_de_documento, establecimiento, taxes_and_charges, tipo_de_transaccion, is_return,
                            compras_ventas, estado_del_documento, tipo_constancia, no_constancia, valor_constancia,
                            pequeno_contribuyente_bienes, pequeno_contribuyente_servicios, iva_exento_servicios, iva_exento_bienes
                        );
                    }

                });



            } else {
                console.log("Sin facturas de compra. ");
            }

            cur_frm.refresh_field("invoices");
            frappe.msgprint("COMPRAS cargado OK.");
            loadSalesInvoices();

        }
    });
}






function addInvoice(bienes, ivaBienes, servicios, ivaServicios, combustible, ivaCombustible, importacion,
                    ivaImportacion, pequenoContribuyente, pinv, invoice_date, invoice_serie, invoice_no, invoice_nit,
                    supplier, tipo_de_documento, establecimiento, taxes_and_charges, tipo_de_transaccion, is_return,
                    compras_ventas, estado_del_documento, tipo_constancia, no_constancia, valor_constancia,
                    pequeno_contribuyente_bienes, pequeno_contribuyente_servicios, iva_exento_servicios, iva_exento_bienes) {

    var d = cur_frm.add_child("invoices");
    d.establecimiento = establecimiento;
    d.compras_ventas = compras_ventas;
    d.pinv = pinv;
    d.documento = tipo_de_documento;
    d.serie_del_documento = invoice_serie;
    d.numero_del_documento = invoice_no;
    d.fecha_del_documento = frappe.datetime.str_to_obj(invoice_date);
    d.nit = invoice_nit;
    d.nombre_cliente_proveedor = supplier;
    d.tipo_de_transaccion = tipo_de_transaccion;
    d.exportacion_bien_servicio = "";
    d.estado_del_documento = estado_del_documento;
    d.iva = ivaBienes + ivaServicios + ivaCombustible + ivaImportacion;
    d.total = bienes+ivaBienes+servicios+ivaServicios+combustible+ivaCombustible+importacion+ivaImportacion+pequenoContribuyente+iva_exento_bienes+iva_exento_servicios;

    if(taxes_and_charges == "IVA Exento" || taxes_and_charges == "IVA Exento - GC") {
        if(tipo_de_transaccion == "L") {
            d.total_valor_exento_bienes_operacion_local = iva_exento_bienes;
            d.total_valor_exento_servicios_operacion_local = iva_exento_servicios;
        } else {
            d.total_valor_exento_bienes_operacion_exterior = iva_exento_bienes;
            d.total_valor_exento_servicios_operacion_exterior = iva_exento_servicios;
        }
    } else if(taxes_and_charges == "IVA GT (pequeño contribuyente)" || pequenoContribuyente>0) {
        if(tipo_de_transaccion == "L") {
            d.pequeno_contribuyente_operacion_local_bienes = pequeno_contribuyente_bienes;
            d.pequeno_contribuyente_operacion_local_servicios = pequeno_contribuyente_servicios;
        } else {
            d.pequeno_contribuyente_operacion_exterior_bienes = pequeno_contribuyente_bienes;
            d.pequeno_contribuyente_operacion_exterior_servicios = pequeno_contribuyente_servicios;
        }
    } else {
        if(tipo_de_transaccion == "L") {
            d.total_valor_gravado_bienes_operacion_local = bienes + ivaBienes + combustible + ivaCombustible;
            d.total_valor_gravado_servicios_operacion_local = servicios + ivaServicios;
        } else {
            d.total_valor_gravado_bienes_operacion_exterior = bienes + ivaBienes + combustible + ivaCombustible + importacion + ivaImportacion;
            d.total_valor_gravado_servicios_operacion_exterior = servicios + ivaServicios;
        }

    }


}







function loadSalesInvoices() {
    var from_date = "2019-07-01";
    var to_date = "2019-08-01";

    var filters = [
        ["Sales Invoice","status","!=","Cancelled"],["Sales Invoice","status","!=","Draft"]
    ];

    //filters.push(["Sales Invoice","name","like","%SINV-01258-1%"]);

    if(!isEmpty(cur_frm.doc.from_date))
        filters.push(["Sales Invoice","posting_date",">=",cur_frm.doc.from_date]);
    else
        filters.push(["Sales Invoice","posting_date",">=",from_date]);

    if(!isEmpty(cur_frm.doc.to_date))
        filters.push(["Sales Invoice","posting_date","<=",cur_frm.doc.to_date]);
    else
        filters.push(["Sales Invoice","posting_date","<=",to_date]);

    if(!isEmpty(cur_frm.doc.company))
        filters.push(["Sales Invoice","company","=",cur_frm.doc.company]);



    console.log(" filters: "+JSON.stringify(filters));


    cur_frm.call({
        method: "frappe.client.get_list",
        args: {
            doctype: "Sales Invoice",
            limit_page_length: 2000,
            fields: ["name","serie_factura","numero_factura","customer","customer_name","nit_del_cliente","discount_amount","grand_total", "factura_anulada","establecimiento","tipo_de_documento","tipo_de_transaccion","taxes_and_charges"],
            filters:filters
        },
        callback: function(r, rt) {
            if(r.message) {
                console.log("r.message: ",r.message);

                $.each(r.message, function(i, d) {
                    var isLastInvoice = (i+1)==r.message.length;

                    frappe.model.with_doc("Sales Invoice", d.name, function() {
                        var salesInvoice = frappe.model.get_doc("Sales Invoice", d.name);

                        calcSalesBookData(salesInvoice, isLastInvoice);
                    });

                });
            }


        }
    });

}


function calcSalesBookData(invoice, isLastInvoice) {

    var bienes = 0;
    var servicios = 0;
    var ivaBienes = 0;
    var ivaServicios = 0;
    var ivaExentoBienes = 0;
    var ivaExentoServicios = 0;

    console.log("invoice.name: "+invoice.name+" invoice.posting_date: "+invoice.posting_date+" invoice.discount_amount: "+invoice.discount_amount+" invoice.length: "+invoice.length);

    var isDiscount = false;
    var distributeDiscount = true;

    if(!isEmpty(invoice.discount_amount)) {
        if(invoice.discount_amount!=0)
            isDiscount = true;

        //if( (invoice.discount_amount / invoice.length) > 1)
        //	distributeDiscount = true;
    }

    var discountApplied = false;

    $.each(invoice.items, function(i, item) {
        var itemType = item.item_type;

        var newAmount = item.amount;
        var newAmountIva = 0;
        var newAmountNoIva = 0;

        if(distributeDiscount) {
            newAmount = item.amount - (item.amount / invoice.total * invoice.discount_amount);
        } else {
            if(discountApplied == false && item.amount>invoice.discount_amount) {
                newAmount = item.amount - invoice.discount_amount;
                discountApplied = true;
            }
        }

        newAmountNoIva = newAmount / 1.12;
        newAmountIva = newAmount - newAmountNoIva;

        if(invoice.taxes_and_charges == "IVA Exento - GC") {
            if(itemType == "Bienes" || itemType == "Bien" || itemType == "Bienes y Servicios" || itemType == "Importación")
                ivaExentoBienes += newAmountNoIva + newAmountIva;
            else if(itemType == "Servicios" || itemType == "Servicio")
                ivaExentoServicios += newAmountNoIva + newAmountIva;
        } else if(itemType == "Bienes" || itemType == "Bien" || itemType == "Bienes y Servicios" || itemType == "Importación") {
            bienes += newAmountNoIva;
            ivaBienes += newAmountIva;
        } else if(itemType == "Servicios" || itemType == "Servicio") {
            servicios += newAmountNoIva;
            ivaServicios += newAmountIva;
        }


        console.log("item.item_type: "+item.item_type+" itemType: "+itemType+" item.amount: "+item.amount+" newAmount: "+newAmount+" distributeDiscount: "+distributeDiscount+" discountApplied: "+discountApplied+" isLastInvoice: "+isLastInvoice);

    });

    var combustible = 0;
    var ivaCombustible = 0;
    var importacion = 0;
    var ivaImportacion = 0;
    var pequenoContribuyente = 0;
    var pinv = "";
    var invoice_date = invoice.posting_date;
    var invoice_serie = invoice.serie_factura;
    var invoice_no = invoice.numero_factura;
    var invoice_nit = invoice.nit_del_cliente;
    var supplier = invoice.customer;
    var tipo_de_documento = invoice.tipo_de_documento;
    var establecimiento = invoice.establecimiento;
    var taxes_and_charges = invoice.taxes_and_charges;
    var tipo_de_transaccion = invoice.tipo_de_transaccion;
    var is_return = "";
    var compras_ventas = "V";
    var estado_del_documento = "";
    if(invoice.factura_anulada == 1)
        estado_del_documento = "A";
    else
        estado_del_documento = "E";
    var tipo_constancia ="";
    var no_constancia = "";
    var valor_constancia = "";
    var pequeno_contribuyente_bienes = 0;
    var pequeno_contribuyente_servicios = 0;
    var iva_exento_servicios = ivaExentoServicios;
    var iva_exento_bienes = ivaExentoBienes;

    addInvoice(bienes, ivaBienes, servicios, ivaServicios, combustible, ivaCombustible, importacion,
        ivaImportacion, pequenoContribuyente, pinv, invoice_date, invoice_serie, invoice_no, invoice_nit,
        supplier, tipo_de_documento, establecimiento, taxes_and_charges, tipo_de_transaccion, is_return,
        compras_ventas, estado_del_documento, tipo_constancia, no_constancia, valor_constancia,
        pequeno_contribuyente_bienes, pequeno_contribuyente_servicios, iva_exento_servicios, iva_exento_bienes
    );


    if(isLastInvoice) {
        cur_frm.refresh_field("invoices");
        frappe.msgprint("VENTAS cargado OK.");
    }

}






cur_frm.cscript.generar_reporte = function(doc) {
    console.log("Generar reporte");
    loadPurchaseInvoices();

};
