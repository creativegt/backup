//cur_frm.add_fetch('supplier', 'nit', 'nit');

function isEmpty(val){
    var test =  (val === undefined || val == null || val.length <= 0) ? true : false;
    return test;
}

cur_frm.add_fetch('supplier', 'supplier_type', 'supplier_type');

cur_frm.add_fetch('supplier', 'banco_preferido_de_pago', 'banco_preferido_de_pago');
cur_frm.add_fetch('supplier', 'codigo_provenet_gyt', 'codigo_provenet_gyt');
cur_frm.add_fetch('supplier', 'numero_de_cuenta_bi', 'numero_de_cuenta_bi');
cur_frm.add_fetch('supplier', 'tipo_de_cuenta_bi', 'tipo_de_cuenta_bi');


cur_frm.cscript.custom_onload = function(doc) {
    console.log("cur_frm.doc.status: "+cur_frm.doc.status+" cur_frm.doc.is_return: "+cur_frm.doc.is_return);
    if(cur_frm.doc.status == "Draft" ||
        (cur_frm.doc.status == "Paid" && cur_frm.doc.is_return == 1)
    ) {
        loadTaxesAndCharges();
        calcPurchasesBookDataWait(1000, cur_frm.doc);

        calcTipoDeDocumento(1000);
    }


    changeWidth();

    filterProject();

    setMandatoryFields()
}

frappe.ui.form.on("Purchase Invoice", {
    before_save: function(frm) {
        console.log("Before save");

        checkSalesOrderForCommissionProducts();
    },
    before_submit: function(frm) {
        console.log("Before submit. frm.doc.purchases_book_processed: "+frm.doc.purchases_book_processed);

        if (frm.doc.purchases_book_processed == null || frm.doc.purchases_book_processed==0) {
            frappe.throw(__("Aún no se había calculado la información para el libro de compras, espere unos segundos y vuelva a intentar Validar."));
        }


    },
    validate:  function(frm) {
        console.log("Validate");

    }
});


cur_frm.cscript.proveedor_no_da_factura = function(doc) {
    doc.bill_no = "Sin Factura";
    doc.serie_factura = "-";
    doc.due_date = get_today();
    doc.credit_to = "Cuentas por Pagar - GC";
    doc.taxes_and_charges = "Sin impuestos";

    doc.taxes = [];

    refresh_field("bill_no");
    refresh_field("serie_factura");
    refresh_field("due_date");
    refresh_field("credit_to");
    refresh_field("taxes_and_charges");
    refresh_field("taxes");

};



cur_frm.cscript.project = function(doc) {

    //por pago de comisiones y gasolina, se puede cambiar de proyecto en cada linea de la factura
    //$.each(doc.items, function(i, d) {
    //	//msgprint("project: "+d.project+" parent: "+cur_frm.doc.project);
    //	d.project = cur_frm.doc.project;
    //});

};





cur_frm.cscript.supplier = function(doc) {
    //msgprint("supplier "+cur_frm.doc.supplier);

    loadTaxesAndCharges();


};

function loadTaxesAndCharges() {
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
                } else if(r.message.regimen_pago_de_iva == "PA ITBMS 7%") {
                    cur_frm.set_value("taxes_and_charges", "ITBMS PA (Compra) - CPA");
                }
            }
        }
    });
}



frappe.ui.form.on("Purchase Invoice Item", "item_code", function(frm, cdt, cdn) {
    calcPurchasesBookDataWait(3000, cur_frm.doc);
});

frappe.ui.form.on("Purchase Invoice Item", "rate", function(frm, cdt, cdn) {
    calcPurchasesBookDataWait(3000, cur_frm.doc);
});

frappe.ui.form.on("Purchase Invoice Item", "qty", function(frm, cdt, cdn) {
    calcPurchasesBookDataWait(3000, cur_frm.doc);
});

cur_frm.cscript.taxes_and_charges = function(doc) {
    calcPurchasesBookDataWait(3000, cur_frm.doc)

    old_taxes_and_charges(doc);

    calcTipoDeDocumento(1000);
};

cur_frm.cscript.serie_factura = function(doc) {
    calcTipoDeDocumento(1);
};

cur_frm.cscript.is_return = function(doc) {
    calcTipoDeDocumento(1);
};

cur_frm.cscript.discount_amount = function(doc) {
    calcPurchasesBookDataWait(1000, cur_frm.doc);
};

frappe.ui.form.on("Purchase Invoice Item", {
    items_remove: function(frm) {
        console.log("Item removed");
        calcPurchasesBookDataWait(3000, cur_frm.doc);
    }
});

frappe.ui.form.on("Purchase Taxes and Charges", {
    taxes_remove: function(frm) {
        console.log("Taxes removed");
        calcPurchasesBookDataWait(3000, cur_frm.doc);
    }
});


function old_taxes_and_charges(doc) {
    var me = this;
    if (doc.taxes_and_charges) {
        return frappe.call({
            method: "erpnext.controllers.accounts_controller.get_taxes_and_charges",
            args: {
                "master_doctype": frappe.meta.get_docfield(doc.doctype, "taxes_and_charges", doc.name).options,
                "master_name": doc.taxes_and_charges
            },
            callback: function callback(r) {
                if (!r.exc) {
                    cur_frm.set_value("taxes", r.message);
                    cur_frm.cscript.calculate_taxes_and_totals();
                }
            }
        });
    }
}



function calcPurchasesBookDataWait(wait, purchaseInvoice) {
    setTimeout(function(){
        calcPurchasesBookData(purchaseInvoice);
    }, wait);
}


function calcPurchasesBookData(purchaseInvoice) {

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
        addInvoice(purchaseInvoice, bienes, ivaBienes, servicios, ivaServicios, combustible, ivaCombustible, importacion, ivaImportacion,
            pequenoContribuyente, 1, pequenoContribuyenteBienes, pequenoContribuyenteServicios, ivaExentoBienes, ivaExentoServicios);
        return false;
    }


    var isDiscount = false;
    var distributeDiscount = false;

    if(!isEmpty(purchaseInvoice.discount_amount)) {
        if(purchaseInvoice.discount_amount!=0)
            isDiscount = true;

        if( (purchaseInvoice.discount_amount / purchaseInvoice.length) > 1)
            distributeDiscount = true;

    }




    var discountApplied = false;

    $.each(purchaseInvoice.items, function(i, item) {
        var itemType = item.item_type;

        if(isEmpty(itemType))
            itemType = purchaseInvoice.supplier_group;

        var newAmount = item.amount;
        var newAmountIva = 0;
        var newAmountNoIva = 0;

        if(distributeDiscount) {
            newRate = item.amount - (item.amount / purchaseInvoice.grand_total * purchaseInvoice.discount_amount);
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



    addInvoice(purchaseInvoice, bienes, ivaBienes, servicios, ivaServicios, combustible, ivaCombustible, importacion, ivaImportacion,
        pequenoContribuyente, 0, pequenoContribuyenteBienes, pequenoContribuyenteServicios, ivaExentoBienes, ivaExentoServicios);
    //cur_frm.refresh_field("invoices");

}


function addInvoice(purchaseInvoice, bienes, ivaBienes, servicios, ivaServicios, combustible, ivaCombustible, importacion, ivaImportacion,
                    pequenoContribuyente, sinIvaDescartada, pequenoContribuyenteBienes, pequenoContribuyenteServicios, ivaExentoBienes, ivaExentoServicios) {

    console.log("addInvoice");

    cur_frm.set_value("bienes", bienes);
    cur_frm.set_value("iva_bienes", ivaBienes);
    cur_frm.set_value("servicios", servicios);
    cur_frm.set_value("iva_servicios", ivaServicios);
    cur_frm.set_value("combustibles", combustible);
    cur_frm.set_value("iva_combustibles", ivaCombustible);
    cur_frm.set_value("importaciones", importacion);
    cur_frm.set_value("iva_importaciones", ivaImportacion);
    cur_frm.set_value("pequeno_contribuyente", pequenoContribuyente);
    cur_frm.set_value("pequeno_contribuyente_bienes", pequenoContribuyenteBienes);
    cur_frm.set_value("pequeno_contribuyente_servicios", pequenoContribuyenteServicios);
    cur_frm.set_value("iva_exento_bienes", ivaExentoBienes);
    cur_frm.set_value("iva_exento_servicios", ivaExentoServicios);
    cur_frm.set_value("total_purchases_book", (bienes+ivaBienes+servicios+ivaServicios+combustible+ivaCombustible+importacion+ivaImportacion+pequenoContribuyente+ivaExentoBienes+ivaExentoServicios));

    cur_frm.set_value("purchases_book_processed", 1 );
    cur_frm.set_value("sin_iva_descartada", sinIvaDescartada );

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




function changeWidth() {

    $.each(document.getElementsByClassName("container page-body"), function(i, d) {
        if(!isEmpty(d))
            d.style.width="100%";
    });
}


function calcTipoDeDocumento(wait) {
    setTimeout(function(){
        console.log("cur_frm.doc.is_return: "+cur_frm.doc.is_return
            +" cur_frm.doc.taxes_and_charges: "+cur_frm.doc.taxes_and_charges
            +" cur_frm.doc.serie_factura: "+cur_frm.doc.serie_factura);
        if(cur_frm.doc.is_return == 1 )
            cur_frm.set_value("tipo_de_documento", "NC");
        else if(cur_frm.doc.taxes_and_charges == "IVA GT (pequeño contribuyente)")
            cur_frm.set_value("tipo_de_documento", "FPC");
        else if(!isEmpty(cur_frm.doc.serie_factura) && cur_frm.doc.serie_factura.includes("FACE"))
            cur_frm.set_value("tipo_de_documento", "FCE");
        else
            cur_frm.set_value("tipo_de_documento", "FC");
    }, wait);
}




function filterProject() {
    cur_frm.set_query("project", "items", function (frm) {
        return {
            filters: [["Project","workflow_state","!=","Completado"],["Project","workflow_state","!=","Cancelado"]]
        }
    });
}











function checkSalesOrderForCommissionProducts() {
    var error = false;

    console.log("checkSalesOrderForCommissionProducts");

    $.each(cur_frm.doc.items, function(i, item) {
        console.log("checkSalesOrderForCommissionProducts",item.expense_account,item.sales_order);

        if(item.expense_account.includes("Gasto de Comisiones Sobre Ventas - GC") && isEmpty(item.sales_order) ) {

            frappe.msgprint("Fila "+(i+1)+" | Producto: "+item.item_code+" colocar valor para Sales Order" );
            error = true;
        }
    });

    if (error)
        frappe.throw(__("Corregir productos de pago de comisiones sin orden de venta especificada."));
}


cur_frm.cscript.company = function(doc) {
    setMandatoryFields();
};

function setMandatoryFields() {
    console.log("company",cur_frm.doc.company);

    cur_frm.set_df_property("serie_factura", "reqd", cur_frm.doc.company != "CREAMEX, DISEÑO Y CONSTRUCCION, S.A. de C.V.");
}