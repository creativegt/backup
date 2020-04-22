function isEmpty(val){
    var test =  (val === undefined || val == null || val.length <= 0) ? true : false;
    return test;
}



var total_bienes = 0;
var total_servicios
var total_iva_exento = 0;

var total_iva_bienes = 0;
var total_iva_servicios = 0;



function loadInvoices() {
    var from_date = "2019-07-01";
    var to_date = "2019-08-01";

    total_bienes = 0;
    total_servicios = 0;
    total_iva_exento = 0;

    total_iva_bienes = 0;
    total_iva_servicios = 0;

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


    cur_frm.doc.invoices = [];

    console.log(" filters: "+JSON.stringify(filters));


    cur_frm.call({
        method: "frappe.client.get_list",
        args: {
            doctype: "Sales Invoice",
            limit_page_length: 2000,
            fields: ["name","factura_anulada","serie_factura","numero_factura","customer","customer_name","nit_del_cliente","discount_amount","grand_total","taxes_and_charges"],
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


    addInvoice(bienes, ivaBienes, servicios, ivaServicios, invoice, isLastInvoice, ivaExentoBienes, ivaExentoServicios);
}




function addInvoice(bienes, ivaBienes, servicios, ivaServicios, invoice, isLastInvoice, ivaExentoBienes, ivaExentoServicios) {
    var d = cur_frm.add_child("invoices");
    d.sinv = invoice.name;
    d.invoice_date = frappe.datetime.str_to_obj(invoice.posting_date);
    d.invoice_serie = invoice.serie_factura;
    d.invoice_no = invoice.numero_factura;
    d.nit = invoice.nit_del_cliente;
    d.customer = invoice.customer;

    d.bienes = bienes;
    d.iva_bienes = ivaBienes;
    d.servicios = servicios;
    d.iva_servicios = ivaServicios;
    d.iva_exento = ivaExentoBienes + ivaExentoServicios;

    d.total = bienes+ivaBienes+servicios+ivaServicios+ivaExentoBienes+ivaExentoServicios;

    total_bienes += bienes;
    total_servicios += servicios;
    total_iva_exento += ivaExentoBienes+ivaExentoServicios;

    total_iva_bienes += ivaBienes;
    total_iva_servicios += ivaServicios;

    if(isLastInvoice) {
        cur_frm.refresh_field("invoices");

        cur_frm.set_value("total_bienes", total_bienes);
        cur_frm.set_value("total_servicios", total_servicios);
        cur_frm.set_value("total_iva_exento", total_iva_exento);


        cur_frm.set_value("total_iva_bienes", total_iva_bienes);
        cur_frm.set_value("total_iva_servicios", total_iva_servicios);

        cur_frm.set_value("grand_total", (total_bienes+total_servicios+total_iva_bienes+total_iva_servicios));

        cur_frm.set_value("iva_grand_total", (total_iva_bienes+total_iva_servicios));

        frappe.msgprint("El reporte se ha cargado.");
    }
}



cur_frm.cscript.generar_reporte = function(doc) {
    console.log("Generar reporte");
    loadInvoices();

};