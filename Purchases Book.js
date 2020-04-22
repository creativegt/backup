function isEmpty(val){
    var test =  (val === undefined || val == null || val.length <= 0) ? true : false;
    return test;
}



cur_frm.cscript.custom_onload = function(doc) {

}


function loadInvoices() {
    var from_date = "2019-01-01";
    var to_date = "2019-02-01";

    total_bienes = 0;
    total_servicios = 0;
    total_combustibles = 0;
    total_importaciones = 0;
    total_pequeno_contribuyente = 0;
    total_iva_exento = 0;

    total_iva_bienes = 0;
    total_iva_servicios = 0;
    total_iva_combustibles = 0;
    total_iva_importaciones = 0;


    var filters = [["Purchase Invoice","status","!=","Cancelled"],["Purchase Invoice","status","!=","Draft"],["Purchase Invoice","proveedor_no_da_factura","=",0]];

    //filters.push(["Purchase Invoice","name","like","%PINV-14264%"]);

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

    console.log(" filters: "+JSON.stringify(filters));


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
                console.log("message loadInvoices: "+JSON.stringify(r.message));

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
                    var pequeno_contribuyente_bienes = d[22];
                    var taxes_and_charges = d[23];
                    var iva_exento_servicios = d[27];
                    var tipo_de_transaccion = d[28];
                    var pequeno_contribuyente_servicios = d[29];
                    var iva_exento_bienes = d[34];
                    var is_return = d[37];


                    var isLastInvoice = (i+1)==r.message.values.length;

                    console.log(i+") pinv: "+pinv+" bienes: "+bienes+" servicios: "+servicios+" combustible: "+combustible+" importacion: "+importacion+" ivaBienes: "+ivaBienes+" ivaServicios: "+ivaServicios+" ivaCombustible: "+ivaCombustible+" ivaImportacion: "+ivaImportacion+" pequenoContribuyente: "+pequenoContribuyente+" purchaseBookProcessed: "+purchaseBookProcessed+" totalPurchasesBook: "+totalPurchasesBook+" sinIvaDescartada: "+sinIvaDescartada+" supplier: "+supplier+" invoice_date: "+invoice_date+" invoice_no: "+invoice_no+" invoice_serie: "+invoice_serie+" invoice_nit: "+invoice_nit+" pequeno_contribuyente_bienes: "+pequeno_contribuyente_bienes+
                        " pequeno_contribuyente_servicios: "+pequeno_contribuyente_servicios+" iva_exento_bienes: "+iva_exento_bienes+" iva_exento_servicios: "+iva_exento_servicios+
                        " isLastInvoice: "+isLastInvoice);


                    var actualizaTodas = false;


                    if (
                        (bienes==0 && servicios==0 && combustible == 0 && importacion == 0 && pequenoContribuyente == 0) ||
                        purchaseBookProcessed == 0 ||
                        actualizaTodas
                    ) {
                        frappe.model.with_doc("Purchase Invoice", pinv, function() {
                            var purchaseInvoice = frappe.model.get_doc("Purchase Invoice", pinv);

                            calcPurchasesBookData(purchaseInvoice, isLastInvoice);

                            /* //Descomentar si necesita actualizar NITS masivos
                            if(isEmpty(purchaseInvoice.nit))
                                loadSupplierTypeAndGroup(purchaseInvoice);*/
                        });
                    } else {
                        if(sinIvaDescartada==0)
                            addInvoice(bienes, ivaBienes, servicios, ivaServicios, combustible, ivaCombustible, importacion, ivaImportacion, pequenoContribuyente, pinv, invoice_date, invoice_serie,
                                invoice_no, invoice_nit, supplier, isLastInvoice, pequeno_contribuyente_bienes, pequeno_contribuyente_servicios, iva_exento_bienes, iva_exento_servicios);
                    }
                });



            } else {
                console.log("Sin facturas. ");
            }
        }
    });
}



function calcPurchasesBookData(purchaseInvoice, isLastInvoice) {

    var bienes = 0;
    var servicios = 0;
    var combustible = 0;
    var importacion = 0 ;
    var ivaBienes = 0;
    var ivaServicios = 0;
    var ivaCombustible = 0;
    var ivaImportacion = 0 ;
    var pequenoContribuyente = 0;
    var pequenoContribuyenteBienes = 0;
    var pequenoContribuyenteServicios = 0;
    var ivaExentoBienes = 0;
    var ivaExentoServicios = 0;

    console.log("purchaseInvoice.name: "+purchaseInvoice.name+" purchaseInvoice.bill_date: "+purchaseInvoice.bill_date+" purchaseInvoice.discount_amount: "+purchaseInvoice.discount_amount);

    var ivaRate = getIvaRate(purchaseInvoice);

    if(ivaRate<0) {
        console.log(purchaseInvoice.name+" descartada, no tiene IVA.");
        return false;
    }

    var isDiscount = false;
    var distributeDiscount = true;

    if(!isEmpty(purchaseInvoice.discount_amount)) {
        if(purchaseInvoice.discount_amount!=0)
            isDiscount = true;

        //if( (purchaseInvoice.discount_amount / purchaseInvoice.length) > 1)
        //	distributeDiscount = true;

    }



    var discountApplied = false;

    $.each(purchaseInvoice.items, function(i, item) {
        var itemType = item.item_type;

        if(isEmpty(itemType))
            itemType = purchaseInvoice.supplier_group;

        if(isEmpty(itemType)) {
            loadSupplierTypeAndGroup(purchaseInvoice);
            return false;
        }

        var newAmount = item.amount;
        var newAmountIva = 0;
        var newAmountNoIva = 0;

        if(distributeDiscount) {
            newAmount = item.amount - (item.amount / purchaseInvoice.total * purchaseInvoice.discount_amount);
        } else {
            if(discountApplied == false && item.amount>purchaseInvoice.discount_amount) {
                newAmount = item.amount - purchaseInvoice.discount_amount;
                discountApplied = true;
            }
        }

        newAmountNoIva = newAmount / 1.12;
        newAmountIva = newAmount - newAmountNoIva;

        if(purchaseInvoice.taxes_and_charges == "IVA Exento") {
            if(itemType == "Bienes" || itemType == "Bien" || itemType == "Bienes y Servicios")
                ivaExentoBienes += newAmountNoIva + newAmountIva;
            else if(itemType == "Servicios" || itemType == "Servicio")
                ivaExentoServicios += newAmountNoIva + newAmountIva;
        } else if(purchaseInvoice.taxes_and_charges.includes("IVA GT (pequeño contribuyente)") || ivaRate == 0  ) {

            pequenoContribuyente += newAmountNoIva + newAmountIva;

            if(itemType == "Bienes" || itemType == "Bien" || itemType == "Bienes y Servicios")
                pequenoContribuyenteBienes += newAmountNoIva + newAmountIva;
            else if(itemType == "Servicios" || itemType == "Servicio")
                pequenoContribuyenteServicios += newAmountNoIva + newAmountIva;

        } else {
            if(itemType == "Bienes" || itemType == "Bien" || itemType == "Bienes y Servicios") {
                bienes += newAmountNoIva;
                ivaBienes += newAmountIva;
            } else if(itemType == "Servicios" || itemType == "Servicio") {
                servicios += newAmountNoIva;
                ivaServicios += newAmountIva;
            } else if(itemType == "Combustible" || itemType == "Gasolina") {
                combustible += newAmountNoIva;
                ivaCombustible += newAmountIva;
            } else if(itemType == "Importación" || itemType == "Importaciones") {
                importacion += newAmountNoIva;
                ivaImportacion += newAmountIva;
            }
        }

        console.log("item.item_type: "+item.item_type+" itemType: "+itemType+" item.amount: "+item.amount+" newAmount: "+newAmount+" distributeDiscount: "+distributeDiscount+" discountApplied: "+discountApplied);

    });



    purchaseInvoice.bienes = bienes;
    purchaseInvoice.servicios = servicios;
    purchaseInvoice.combustibles = combustible;
    purchaseInvoice.importaciones = importacion;
    purchaseInvoice.pequeno_contribuyente = pequenoContribuyente;
    purchaseInvoice.pequeno_contribuyente_bienes = pequenoContribuyenteBienes;
    purchaseInvoice.pequeno_contribuyente_servicios = pequenoContribuyenteServicios;
    purchaseInvoice.iva_exento_bienes = ivaExentoBienes;
    purchaseInvoice.iva_exento_servicios = ivaExentoServicios;

    purchaseInvoice.total_purchases_book = bienes+ivaBienes+servicios+ivaServicios+combustible+ivaCombustible+importacion+ivaImportacion+pequenoContribuyente+ivaExentoBienes+ivaExentoServicios;
    purchaseInvoice.iva_bienes = ivaBienes;
    purchaseInvoice.iva_servicios = ivaServicios;
    purchaseInvoice.iva_combustibles = ivaCombustible;
    purchaseInvoice.iva_importaciones = ivaImportacion;
    purchaseInvoice.purchases_book_processed = 1;
    purchaseInvoice.sin_iva_descartada = 0;

    if (!(bienes==0 && servicios==0 && combustible == 0 && importacion == 0 && pequenoContribuyente == 0 )) {
        updateInvoice(purchaseInvoice);
    }

    addInvoice(bienes, ivaBienes, servicios, ivaServicios, combustible, ivaCombustible, importacion, ivaImportacion, pequenoContribuyente, purchaseInvoice.name, purchaseInvoice.bill_date,
        purchaseInvoice.serie_factura, purchaseInvoice.bill_no, purchaseInvoice.nit, purchaseInvoice.supplier, isLastInvoice, pequenoContribuyenteBienes, pequenoContribuyenteServicios,
        ivaExentoBienes, ivaExentoServicios
    );
}


var total_bienes = 0;
var total_servicios
var total_combustibles = 0;
var total_importaciones = 0;
var total_pequeno_contribuyente = 0;
var total_iva_exento = 0;

var total_iva_bienes = 0;
var total_iva_servicios = 0;
var total_iva_combustibles = 0;
var total_iva_importaciones = 0;




function addInvoice(bienes, ivaBienes, servicios, ivaServicios, combustible, ivaCombustible, importacion, ivaImportacion, pequenoContribuyente, pinv, supplier_invoice_date,
                    invoice_serie, invoice_no, nit, supplier, isLastInvoice, pequenoContribuyenteBienes, pequenoContribuyenteServicios, ivaExentoBienes, ivaExentoServicios) {
    var d = cur_frm.add_child("invoices");
    d.pinv = pinv;
    d.supplier_invoice_date = frappe.datetime.str_to_obj(supplier_invoice_date);
    d.invoice_serie = invoice_serie;
    d.invoice_no = invoice_no;
    d.nit = nit;
    d.supplier = supplier;

    d.bienes = bienes;
    d.iva_bienes = ivaBienes;
    d.servicios = servicios;
    d.iva_servicios = ivaServicios;
    d.combustibles = combustible;
    d.iva_combustibles = ivaCombustible;
    d.importaciones = importacion;
    d.iva_importaciones = ivaImportacion;
    d.pequeno_contribuyente = pequenoContribuyente;
    //d.pequeno_contribuyente_bienes = pequenoContribuyenteBienes;
    //d.pequeno_contribuyente_servicios = pequenoContribuyenteServicios;
    d.iva_exento = ivaExentoBienes + ivaExentoServicios;

    d.total = bienes+ivaBienes+servicios+ivaServicios+combustible+ivaCombustible+importacion+ivaImportacion+pequenoContribuyente+ivaExentoBienes+ivaExentoServicios;



    total_bienes += bienes;
    total_servicios += servicios;
    total_combustibles += combustible;
    total_importaciones += importacion;
    total_pequeno_contribuyente += pequenoContribuyente;
    total_iva_exento += ivaExentoBienes+ivaExentoServicios;

    total_iva_bienes += ivaBienes;
    total_iva_servicios += ivaServicios;
    total_iva_combustibles += ivaCombustible;
    total_iva_importaciones += ivaImportacion;


    if(isLastInvoice) {
        cur_frm.refresh_field("invoices");

        cur_frm.set_value("total_bienes", total_bienes);
        cur_frm.set_value("total_servicios", total_servicios);
        cur_frm.set_value("total_combustibles", total_combustibles);
        cur_frm.set_value("total_importaciones", total_importaciones);
        cur_frm.set_value("total_pequeno_contribuyente", total_pequeno_contribuyente);
        cur_frm.set_value("total_iva_exento", total_iva_exento);


        cur_frm.set_value("total_iva_bienes", total_iva_bienes);
        cur_frm.set_value("total_iva_servicios", total_iva_servicios);
        cur_frm.set_value("total_iva_combustibles", total_iva_combustibles);
        cur_frm.set_value("total_iva_importaciones", total_iva_importaciones);

        cur_frm.set_value("grand_total", (total_bienes+total_servicios+total_combustibles+total_importaciones+total_pequeno_contribuyente+total_iva_bienes+total_iva_servicios+total_iva_combustibles+total_iva_importaciones));

        cur_frm.set_value("iva_grand_total", (total_iva_bienes+total_iva_servicios+total_iva_combustibles+total_iva_importaciones));

        frappe.msgprint("El reporte se ha cargado.");
    }
}



function getIvaRate(purchaseInvoice) {
    var ret = -999;

    $.each(purchaseInvoice.taxes, function(i, t) {
        if(t.account_head.includes("IVA por Cobrar - GC")) {
            ret = t.rate;
            return false;
        }

    });
    console.log("ivaRate: "+ret);
    return ret;
}


cur_frm.cscript.generar_reporte = function(doc) {
    console.log("Generar reporte");
    loadInvoices();

};




function loadSupplierTypeAndGroup(purchaseInvoice) {

    cur_frm.call({
        method: "frappe.client.get_value",
        args: {
            doctype: "Supplier",
            fieldname: ["supplier_group", "nit"],
            filters: { supplier_name: purchaseInvoice.supplier_name },
        },
        callback: function(r, rt) {
            console.log("message: "+JSON.stringify(r.message)+" purchaseInvoice.supplier: "+purchaseInvoice.supplier_name);

            if(!isEmpty(r.message)) {

                purchaseInvoice.supplier_group = r.message.supplier_group;
                purchaseInvoice.nit = r.message.nit;

                updateInvoice(purchaseInvoice);

                frappe.msgprint("Se actualizó el proveedor "+purchaseInvoice.supplier+". Genere el reporte nuevamente.");
            } else
                loadSupplierTypeAndGroupV2(purchaseInvoice);
        }
    });

}

function loadSupplierTypeAndGroupV2(purchaseInvoice) {

    cur_frm.call({
        method: "frappe.client.get_value",
        args: {
            doctype: "Supplier",
            fieldname: ["supplier_group", "nit"],
            filters: { supplier_name: purchaseInvoice.supplier },
        },
        callback: function(r, rt) {
            console.log("message: "+JSON.stringify(r.message)+" purchaseInvoice.supplier: "+purchaseInvoice.supplier);

            if(!isEmpty(r.message)) {

                purchaseInvoice.supplier_group = r.message.supplier_group;
                purchaseInvoice.nit = r.message.nit;

                updateInvoice(purchaseInvoice);

                frappe.msgprint("Se actualizó el proveedor "+purchaseInvoice.supplier+". Genere el reporte nuevamente.");
            }
        }
    });

}



function updateInvoice(purchaseInvoice) {
    console.log("updateInvoice: "+purchaseInvoice.name);

    cur_frm.call({
        method: "frappe.desk.form.save.savedocs",
        args: {
            action: "Update",
            doc: purchaseInvoice,
        },
        callback: function(r, rt) {
            if(r.message) {
                //no confirma;
            }

        }
    });
}
