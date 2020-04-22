cur_frm.add_fetch('customer', 'nit_del_cliente', 'nit_del_cliente');

cur_frm.add_fetch('payment_terms_creative', 'terms', 'payment_terms_creative_editor');

var margenVentas =[
    {"margen_inferior":0, "margen_superior":14.99, "porcentaje_comision":0},
    {"margen_inferior":15, "margen_superior":19.99, "porcentaje_comision":50},
    {"margen_inferior":20, "margen_superior":24.99, "porcentaje_comision":70},
    {"margen_inferior":25, "margen_superior":29.99, "porcentaje_comision":90},
    {"margen_inferior":30, "margen_superior":39.99, "porcentaje_comision":100},
    {"margen_inferior":40, "margen_superior":44.99, "porcentaje_comision":110},
    {"margen_inferior":45, "margen_superior":9999, "porcentaje_comision":111}
];

var margenMantenimiento =[
    {"margen_inferior":0, "margen_superior":9.99, "porcentaje_comision":0},
    {"margen_inferior":10, "margen_superior":14.99, "porcentaje_comision":50},
    {"margen_inferior":15, "margen_superior":17.99, "porcentaje_comision":90},
    {"margen_inferior":18, "margen_superior":20.99, "porcentaje_comision":100},
    {"margen_inferior":21, "margen_superior":23.99, "porcentaje_comision":110},
    {"margen_inferior":24, "margen_superior":9999, "porcentaje_comision":111},
];
var arregloFinal = [];
var containerTable = ``;
var porcentajeUsuario = 0;
var frmGloblal;



function log(msg) {


    var d = new Date();
    var dtext = d.getHours()+":"+d.getMinutes()+":"+d.getSeconds()+"."+d.getMilliseconds();

    console.log(dtext,msg);
}

cur_frm.cscript.custom_onload = function(doc) {

    console.log("cur_frm.doc.status: "+cur_frm.doc.status);

    if(cur_frm.doc.status == "Draft") {
        //msgprint("status: "+cur_frm.doc.status);

        cargarCalidadOportunidad();
        changeTermsAndPayment();
    }
    checkPermissions();
    filterTermsSelect();

    filterItems();


    //frappe.msgprint("doc: "+JSON.stringify(cur_frm.doc));

    changeWidth();

    //selItemToUpd();
}


cur_frm.cscript.order_type = function(doc) {
    filterItems();

    changeTermsAndPayment();
};


var stockGlobal;
function filterItems() {
    var stock=0;

    if(cur_frm.doc.order_type == "Maintenance")
        stock=0;
    else
        stock=1;

    stockGlobal = stock
    console.log("stock: "+stock+" cur_frm.doc.order_type: "+cur_frm.doc.order_type);

    cur_frm.set_query("item_code", "items", function (frm) {
        return {
            "filters": {
                is_stock_item: stock
            }
        }
    });

    //cur_frm.refresh_field("items");
}


function changeTermsAndPayment() {
    if(cur_frm.doc.order_type == "Sales") {

        if(isEmpty(cur_frm.doc.tc_name) || cur_frm.doc.tc_name != "Creative TyC Venta MOBILIARIO" )
            cur_frm.set_value("tc_name", "Creative TyC Venta MOBILIARIO");

        if(isEmpty(cur_frm.doc.forma_de_pago))
            cur_frm.set_value("forma_de_pago", "Pago anticipado | Contado");

        if(isEmpty(cur_frm.doc.payment_terms_creative))
            cur_frm.set_value("payment_terms_creative", "100 contado");

        //01Ago2019.. :D
        //if(isEmpty(cur_frm.doc.descripcion_de_descuento))
        //	cur_frm.set_value("descripcion_de_descuento", "10% de descuento Expomueble. Entrega gratis en el perímetro de la Ciudad de Guatemala.");

        cur_frm.set_df_property("desde_oportunidad", "reqd", 0);


    } else {

        if(isEmpty(cur_frm.doc.tc_name))
            cur_frm.set_value("tc_name", "Creative TyC Venta PROYECTOS");

        //cur_frm.set_value("forma_de_pago", "");
        //cur_frm.set_value("payment_terms_creative", "");
        if(isEmpty(cur_frm.doc.descripcion_de_descuento))
            cur_frm.set_value("descripcion_de_descuento", "DESCUENTO");

        cur_frm.set_df_property("desde_oportunidad", "reqd", 1);
    }
}


frappe.ui.form.on("Quotation",
    {
        refresh: function(frm) {
            frmGloblal = frm
            loadSalesPersonCommission(frm);

            var me = this;
            // cur_frm.add_custom_button(("Test Code"), function () {
            //
            // });
            if(!frm.doc.islocal && cur_frm.doc.status == "Draft") {

                cur_frm.add_custom_button(("Recargar precios de compra"), function() {
                        recargarPreciosCompra();
                    }
                );
                // cur_frm.add_custom_button(("TEST CODE"), function() {
                // });

                cur_frm.add_custom_button(("Recargar precios de compra y venta"), function() {
                        recargarPreciosCompraVenta();
                    }
                );

            }
        },
        validate: function(frm){
            generarListaValida(frm);
            clearAll()
        },
        before_submit: function(frm) {
            console.log('IMPRIMIR')
            checkIndividualMargin();

            if (frm.doc.margen > 100) {
                frappe.throw(__("Revisar el margen. Es muy alto."));
            }
            if (frm.doc.margen<14) {
                frappe.throw(__("Revisar el margen. Es muy bajo."));
            }

            checkCalidadOportunidad();
        }
    }
);

var is_stock_item;
var item_code;
var item_group;
// var itemsL = [];
var diferentes = [];

function generarListaValida(frm) {
    var line = 0;
    var codeName = '';

    var title = "Solo se permiten productos de stock. Eliminar:" ;

    if(cur_frm.doc.order_type == "Maintenance")
        title = "Solo se permiten productos de NO stock. Eliminar:" ;

    console.log('CONSOLE',frm.doc.items)
    // console.log('VALIDAR',stockGlobal)
    for (var listem in frm.doc.items){
        var idx = frm.doc.items[listem].idx;
        is_stock_item = frm.doc.items[listem].is_stock_item;
        item_code= frm.doc.items[listem].item_code;
        item_group= frm.doc.items[listem].item_group;
        // itemsL.push({idx,is_stock_item,item_code})
        // console.log('PRINT', is_stock_item)
        // console.log('Nueva lISTA', itemsL)
        validarStock(idx,is_stock_item,item_code,item_group);
    }
    for (var diferente in  diferentes){
        line = diferentes[diferente].idx
        codeName = diferentes[diferente].item_code
        frappe.update_msgprint({
            message: __("<hr>"
                + "<ul>"
                + "<li>Linea: <b>"+ line +"</b></li>"
                + "<li>Item Code: <b>"+codeName+"</b></li>"
                + "</ul>"
            ),
            title:title,
            indicator: "red"

        });
    }
}

function validarStock(idx,is_stock_item,item_code,item_group) {
    console.log('stockGlobal === ',stockGlobal,'is_stock_item === ',is_stock_item,'item_group === ',item_group);

    if(item_group=="Fletes")
        return;
    if(is_stock_item === stockGlobal)
        return;

    // console.log('IMPRIMIR LOS QUE NO SON IGUALES',is_stock_item,item_code)
    diferentes.push({idx,is_stock_item,item_code});
    console.log('IMPRIMIR LOS QUE NO SON IGUALES',diferentes)
    return frappe.validated = false;

}

function loadSalesPersonCommission(frm){
    console.log('PASO UNO')

    frappe.db.get_list('Sales Person', {
        fields: ['name','user_id',
            "`tabSales Person Commisions details`.`percentage`",
            "`tabSales Person Commisions details`.`type`",
        ],
        filters: {
            user_id: frappe.session.user
            // user_id: 'mgarcia@creative.com.gt'
        },
        limit: 1000
    }).then(records => {

        if(isEmpty(records)) records = [{type:"Maintenance", percentage: 0}, {type:"Sales", percentage: 0}];

        console.log("records",records);
        if (cur_frm.doc.order_type == "Maintenance"){
            var getRecords = records.find(records => records.type === 'Maintenance');
            console.log(getRecords)
            porcentajeUsuario = getRecords.percentage

            // console.log('PORCENTAJEUSUARIO', porcentajeUsuario)
        }else {
            var getRecords = records.find(records => records.type === 'Sales');
            console.log(getRecords)
            porcentajeUsuario = getRecords.percentage
        }
        generateCommission(frm)

    })
}
var template ;
function generateCommission(frm) {
    arregloFinal = [];

    console.log('PASO DOS')
    console.log('MARGEN DEL DOC',frm.doc.margen)
    if (stockGlobal === 1){
        for (var positionSalesMargin in margenVentas){
            calculateCommission(margenVentas,positionSalesMargin,frm.doc.margen,margenVentas[positionSalesMargin].margen_inferior,margenVentas[positionSalesMargin].margen_superior,margenVentas[positionSalesMargin].porcentaje_comision,frm.doc.grand_total);
        }
        generateTable(frm,arregloFinal)
    }else{
        for (var maintenanceMarginPosition in margenMantenimiento){
            // console.log('MARGEN',frm.doc.margen)
            calculateCommission(margenMantenimiento,maintenanceMarginPosition,frm.doc.margen,margenMantenimiento[maintenanceMarginPosition].margen_inferior,margenMantenimiento[maintenanceMarginPosition].margen_superior,margenMantenimiento[maintenanceMarginPosition].porcentaje_comision,frm.doc.grand_total);
        }
        generateTable(frm,arregloFinal)
        console.log('ARREGLO FINAL DESPUES DE GENERAR',arregloFinal)
    }
}

function calculateCommission(arrayUpdate,arrayPosition, documentMargin, lowerMargin, topMargin, commissionPercentage, grandTotal) {
    /*
        arrayUpdate = La tabla de porcentajes (Ventas/Mantenimiento)
        arrayPosition = La posicion del arreglo que se realiza en el for
        documentMargin = El margen de la cotizacion
        lowerMargin = margen_inferior del arreglo que se calculara
        topMargin = margen_superior del arreglo que se calculara
        commissionPercentage = porcentaje_comision del arreglo que se calculara
        grandTotal =  Total (GTQ) Final de la Cotizacion

    */
    var amountToCommission = round(grandTotal * documentMargin/100,2);
    var commissionAmountReceive = round(amountToCommission * porcentajeUsuario/100 * commissionPercentage/100,2)

    var coloreame = "";

    if (documentMargin >= lowerMargin && documentMargin <= topMargin){

        if (commissionPercentage <= 50)
            coloreame = "error";
        else if (commissionPercentage <= 90)
            coloreame = "warn";
        else if (commissionPercentage <= 100)
            coloreame = "succ";
        else
            coloreame = "succx2";

    } else {
        documentMargin = 0;
    }

    arregloFinal.push({
        "margen_inferior":lowerMargin, "margen_superior":topMargin,
        "porcentaje_comision":commissionPercentage,"micomi":formatQ(commissionAmountReceive),"marge":documentMargin,
        "backid":coloreame
    });

}

function generateTable(frm,finalArray) {
    console.log('PASO TRES')
    containerTable = `
        <style>
            .tooltup{position: relative} 
            .comentario{
                display: none; position: absolute; z-index: 100; border: 1px; background-color: white; border-style: solid; 
                border-width: 1px; border-color: lightseagreen; padding: 3px; color: lightseagreen; 
                top: 20px; left: 20px; font-weight: bold;border-radius: 9px;
            } 
            .tooltup:hover span.comentario{display: block} 
            thead {color:green;} td#myd{border: 1px solid Transparent!important;} th#removeBorder{border: 1px solid Transparent!important;}
			table tr#error {background-color: #EF9A9A ; color:white;} 
			table tr#warn {background-color:  #FFE082; color:white;}
			table tr#succ {background-color: #A5D6A7 ; color:white;}
			table tr#succx2 {background-color: #90CAF9 ; color:white;}
        </style>
        <table class="table table-bordered" style="width:0px">
            <thead>
            <tr>
                <th>Margen Inferior</th><th>Margen Superior</th><th>% Comision</th><th id="removeBorder"></th>
            </tr>
            </thead>
            <tbody>
            {% for (var row in rows) { %}
            <tr id={{rows[row].backid}} >
                <td>{{rows[row].margen_inferior}} </td>
                <td>{{rows[row].margen_superior}} </td>
                <td class=tooltup >{{rows[row].porcentaje_comision}} <span class=comentario>Mi Comision {{rows[row].micomi}}</span> </td>
                <td id=myd>{{rows[row].marge}}</td>
            </tr>{% } %}
            </tbody>
        </table>`;
    frm.set_df_property('tabla_de_porcentajes', 'options', frappe.render(containerTable, {rows: finalArray}));
    frm.refresh_field('tabla_de_porcentajes');


}

function round(value, decimals) {
    return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}

function formatQ(numero){
    var formQ = new Intl.NumberFormat('es-GT', {
        style: 'currency',
        currency: 'GTQ',
        minimumFractionDigits: 2
    }).format(numero);
    return formQ
}

function clearAll() {
    console.log('PASO CUATRO')
    console.log('')

    diferentes = [];
}



function isEmpty(val){
    var test =  (val === undefined || val == null || val.length <= 0) ? true : false;
    return test;
}

function checkPermissions() {
    var tienePermiso = false;

    if(!isEmpty(frappe.user.has_role("Asesor de proyectos senior")) || frappe.user.has_role("System Manager"))
        tienePermiso = true;

    //msgprint("tiene: " + frappe.user.has_role("System Manager"));
    cur_frm.toggle_display("comisiones", tienePermiso);
    cur_frm.toggle_display("monto_comisiones", tienePermiso);

}

function setDesdeOptyOnItems(doc) {

    cur_frm.set_value("opportunity", cur_frm.doc.desde_oportunidad);

    $.each(doc.items, function(i, d) {
        //msgprint("prevdoc_doctype: "+d.prevdoc_doctype+" parent: "+cur_frm.doc.desde_oportunidad);
        d.prevdoc_doctype = "Opportunity";
        d.prevdoc_docname = cur_frm.doc.desde_oportunidad;

    });
}


frappe.ui.form.on("Quotation Item", "item_code", function(frm, cdt, cdn) {
    //setDesdeOptyOnItems(frm.doc);


    var d = locals[cdt][cdn];
    if(isEmpty(d)) return;

    frappe.model.set_value(d.doctype, d.name, "bulk_is_last", true);
    getPriceListRateBuying(frm, cdt, cdn, true);

});


cur_frm.cscript.desde_oportunidad = function(doc) {
    setDesdeOptyOnItems(doc);
};

function getPriceListRateBuying(frm, cdt, cdn, isLast) {
    var p = locals[cdt][cdn];
    getPriceListRateBuying2(p, isLast);
}

function getPriceListRateBuying2(p, isLast) {

    cur_frm.call({
        method: "frappe.client.get_value",
        args: {
            doctype: "Item Price",
            fieldname: "price_list_rate",
            filters: { item_code: p.item_code, buying: true, price_list: cur_frm.doc.buying_price_list },
        },
        callback: function(r, rt) {

            if(r.message) {
                frappe.model.set_value(p.doctype, p.name, "price_list_rate_buying", (r.message.price_list_rate * cur_frm.doc.buying_plc_conversion_rate));

                console.log("getPriceListRateBuying2: p.item_code: "+p.item_code+" doc.currency: "+cur_frm.doc.currency+" r.message.price_list_rate: "+r.message.price_list_rate+" doc.buying_plc_conversion_rate: "+cur_frm.doc.buying_plc_conversion_rate+" isLast:" +isLast);

            } else {
                frappe.msgprint("Falta configuración de precio de compra para este producto: "+p.item_code);
                frappe.model.set_value(p.doctype, p.name, "price_list_rate_buying", -9999999);
            }

            frappe.model.set_value(p.doctype, p.name, "bulk_is_last", isLast);

            getInventarioProyectado(p, isLast);

            calcGrossMarginWait(cur_frm.doc, p, 100, isLast);
        }
    });

}


function getPriceListRateBuyingFromItem(p, isLast) {

    cur_frm.call({
        method: "frappe.client.get_value",
        args: {
            doctype: "Item",
            fieldname: ["name","item_code","standard_purchasing_rate","standard_rate"],
            filters: { item_code: p.item_code },
        },
        callback: function(r, rt) {
            if(r.message) {

                p.price_list_rate_buying = r.message.standard_purchasing_rate / cur_frm.doc.conversion_rate;

                var rate = r.message.standard_rate  / cur_frm.doc.conversion_rate;
                rate = rate - rate*p.discount_percentage/100;
                p.rate = rate;


                console.log("getPriceListRateBuying2: doc.currency: "+cur_frm.doc.currency+" doc.conversion_rate: "+cur_frm.doc.conversion_rate+" r.message.standard_purchasing_rate: "+r.message.standard_purchasing_rate+" r.message.standard_rate: "+r.message.standard_rate+" p.discount_percentage: "+p.discount_percentage);

            } else {
                frappe.msgprint("Falta configuración de precio de compra para este producto: "+p.item_code);
                p.price_list_rate_buying = -9999999;
            }

            getInventarioProyectado(p, isLast);

            setTimeout(function(){
                calcGrossMargin(cur_frm.doc, p, isLast);
            }, 3000);
        }
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
    console.log("getInventarioProyectado p.item_code: "+p.item_code+" p.is_stock_item: "+p.is_stock_item);

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

            if(!isEmpty(p.item_code) && !isEmpty(disponibles) && qty>disponibles)
                frappe.msgprint({
                    title: __('Notification'),
                    indicator: 'red',
                    message: __(p.item_code+'<img width="50px" src="https://creativegt.erpnext.com'+p.image+'" /> *** Disponibles: <b>'+disponibles+'</b> Faltan: <b><font color="red" >'+(qty-disponibles)+'</font></b>')
                });


        }
    });
}


frappe.ui.form.on("Quotation Item", "qty", function(frm, cdt, cdn) {
    var p = locals[cdt][cdn];
    calcGrossMargin(frm.doc, p, true);

    getInventarioProyectado(p, true);

});

frappe.ui.form.on("Quotation Item", "rate", function(frm, cdt, cdn) {
    console.log("CAMBIO EL RATE");

    var p = locals[cdt][cdn];
    calcGrossMargin(frm.doc, p, true);
});

frappe.ui.form.on("Quotation Item", "price_list_rate", function(frm, cdt, cdn) {
    var p = locals[cdt][cdn];

    log("CAMBIO EL PRICE LIST RATE "+p.price_list_rate+" "+p.rate+" "+p.price_list_rate_buying+" "+cur_frm.doc.factor_global);

    frappe.model.set_value(p.doctype, p.name, "discount_percentage", cur_frm.doc.factor_global); //dispara el cálculo
    frappe.model.set_value(p.doctype, p.name, "prevdoc_doctype", "Opportunity");
    frappe.model.set_value(p.doctype, p.name, "prevdoc_docname", cur_frm.doc.desde_oportunidad);

    if(isEmpty(cur_frm.doc.factor_global) || cur_frm.doc.factor_global==0)
        calcGrossMarginWait(frm.doc, p, 100, p.bulk_is_last);

});






frappe.ui.form.on("Quotation Item", "bulk_is_last", function(frm, cdt, cdn) {
    var p = locals[cdt][cdn];

    log("CAMBIO EL bulk_is_last"+" "+p.price_list_rate+" "+p.rate+" "+p.price_list_rate_buying+" p.bulk_is_last: "+p.bulk_is_last);


});

frappe.ui.form.on("Quotation Item", "price_list_rate_buying", function(frm, cdt, cdn) {
    var p = locals[cdt][cdn];

    log("CAMBIO EL PRICE LIST RATE BUYING"+" "+p.price_list_rate+" "+p.rate+" "+p.price_list_rate_buying+" p.bulk_is_last: "+p.bulk_is_last);


});






frappe.ui.form.on("Quotation Item", "margin_rate_or_amount", function(frm, cdt, cdn) {
    console.log("margin_rate_or_amount");

    var p = locals[cdt][cdn];
    calcGrossMarginWait(frm.doc, p, 500, true);

});


frappe.ui.form.on("Quotation Item", "discount_percentage", function(frm, cdt, cdn) {
    var p = locals[cdt][cdn];

    log("p.bulk_is_last: "+p.bulk_is_last);

    calcGrossMarginWait(frm.doc, p, 100, p.bulk_is_last);

    //set default true, cuando se edite individual siempre estara a true.
    p.bulk_is_last = true;

});








function calcGrossMarginWait(frmdoc, p, wait, isLast) {
    setTimeout(
        function(){ calcGrossMargin(frmdoc, p, isLast); }, wait
    );
}

function calcGrossMargin(doc, p, isLast) {

    var costoVenta;
    var costoCompra;
    var margenUnitario;
    var qty;

    costoVenta = p.rate; // rate ya incluye descuento.   price_list_rate
    costoCompra = p.price_list_rate_buying;
    qty = p.qty;

    if(isEmpty(qty) || qty==0) qty = 1;

    margenUnitario = (costoVenta - costoCompra)*qty;

    var pctMarginUnitario = Math.round( (costoVenta - costoCompra) / costoVenta  * 100) ;

    if(pctMarginUnitario > 75)
        frappe.msgprint("Revisar precios de: "+p.item_code+" Venta: "+costoVenta+" Compra: "+costoCompra+" Margen: "+ pctMarginUnitario  +"%");

    log("calcGrossMargin p.item_code: "+p.item_code+" isLast: "+isLast+" costoVenta: "+costoVenta+" costoCompra: "+costoCompra+" margenUnitario: "+margenUnitario+" qty: "+qty);

    frappe.model.set_value(p.doctype, p.name, "gross_margin", margenUnitario );
    frappe.model.set_value(p.doctype, p.name, "purchase_amount", (costoCompra*qty) );

    if(isLast) {
        calcMargin(500);
        //refresh_field("items");
    }
}


function getTotalGrossMargin() {
    var grossMargin = 0;

    $.each(cur_frm.doc.items, function(i, d) {
        //console.log("gross_margin: "+d.gross_margin+" d.item_code: "+d.item_code);

        //si es imprevisto sumar el 40% de su valor como margen
        if(d.item_code != "22-00001")
            grossMargin += d.gross_margin;
        else
            grossMargin += d.amount * 0.625;

    });

    return grossMargin;
}


function getTotalPurchaseAmount() {
    var purchaseAmount = 0;

    $.each(cur_frm.doc.items, function(i, d) {
        //msgprint("purchase_amount: "+d.purchase_amount+" d.item_code: "+d.item_code);

        //si es imprevisto restar el 60% de su valor como costo de compra
        if(d.item_code != "22-00001")
            purchaseAmount += d.purchase_amount;
        else
            purchaseAmount+=  d.amount * 0.625;

    });

    return purchaseAmount;
}

function getImprevistos () {
    var imprevistos = 0;

    $.each(cur_frm.doc.items, function(i, d) {
        if(d.item_code == "22-00001")
            imprevistos += d.amount;

    });

    return imprevistos ;
}

function getOpExpenses() {
    var viaticos = cur_frm.doc.viaticos;
    var costoContratos = cur_frm.doc.costo_de_contratos;
    var fianzas = cur_frm.doc.fianzas;

    var costoComisiones = cur_frm.doc.grand_total / 1.19 * cur_frm.doc.comisiones / 100;

    if(cur_frm.doctype=="Quotation") {
        cur_frm.set_value("monto_comisiones", costoComisiones );

        /*if(cur_frm.doc.grand_total>30000)
            cur_frm.set_value("isr", 7 );
        else
            cur_frm.set_value("isr", 5 );
        */
        //cur_frm.set_value("isr", 4 );

    }

    var costoInteresesCredito = cur_frm.doc.grand_total * cur_frm.doc.meses_de_credito * 1.16 / 100;

    var interesesVC = 0;
    if(cur_frm.doc.visa_cuotas == 3)
        interesesVC = 7;
    else if(cur_frm.doc.visa_cuotas == 6)
        interesesVC = 8;
    else if(cur_frm.doc.visa_cuotas == 12)
        interesesVC = 9;
    else if(cur_frm.doc.visa_cuotas == 15)
        interesesVC = 12;
    else if(cur_frm.doc.visa_cuotas == 18)
        interesesVC = 13;

    var costoInteresesVisaCuotas = cur_frm.doc.grand_total * interesesVC / 100;

    var costoRenders = cur_frm.doc.cantidad_de_vistas_en_renders * 350 / cur_frm.doc.conversion_rate;

    var isr = cur_frm.doc.grand_total / 1.12 * cur_frm.doc.isr / 100;
    console.log("isr: "+isr);

    var diferenciaIva = cur_frm.doc.grand_total * 0.12 * cur_frm.doc.diferencia_de_iva / 100;
    console.log("diferenciaIva :"+diferenciaIva);

    var totalPuchaseAmount = getTotalPurchaseAmount();
    console.log("totalPuchaseAmount : "+totalPuchaseAmount );

    var imprevistos = cur_frm.doc.grand_total * cur_frm.doc.imprevistos / 100;
    console.log("imprevistos :"+imprevistos);

    console.log("viaticos: "+viaticos+" costoContratos: "+costoContratos+" fianzas: "+fianzas+" costoComisiones: "+costoComisiones+" costoInteresesCredito: "+costoInteresesCredito+" costoInteresesVisaCuotas: "+costoInteresesVisaCuotas+" costoRenders: "+costoRenders+" isr: "+isr+" diferenciaIva: "+diferenciaIva+" imprevistos: "+imprevistos);

    return viaticos + costoContratos + fianzas + costoComisiones + costoInteresesCredito + costoInteresesVisaCuotas + costoRenders + isr + diferenciaIva + imprevistos;
}


function calcMargin(wait) {
    var version="20181129";

    setTimeout(function(){
        var grossMargin = getTotalGrossMargin();
        var opExpenses = getOpExpenses();
        var additionalDiscount = cur_frm.doc.discount_amount;


        var margin =  (grossMargin - opExpenses - additionalDiscount) / ( cur_frm.doc.grand_total ) * 100;
        margin = Math.round(margin * 100) / 100;

        console.log("cur_frm.doc.grand_total: "+cur_frm.doc.grand_total+" grossMargin: "+grossMargin + " opExpenses: "+opExpenses+" margin: "+margin+" additionalDiscount: "+additionalDiscount );

        //msgprint("cur_frm: "+cur_frm.doctype);
        if(cur_frm.doctype=="Quotation") {
            cur_frm.set_value("margen", margin);
            frappe.show_alert("Margen general actualizado: <b>"+margin+"%</b>");
            cur_frm.set_value("margen_actualizado_el", ""+ new Date());
            cur_frm.set_value("version", version);

            generateCommission(frmGloblal);
        }

        calcMargin2(wait);
    }, wait);

}

function calcMargin2(wait) {
    var version="20200303";

    //Rates
    var costo_x_render = 350;
    var rate_nomina = 0.047;
    var rate_gasto_ventas = 0.05;
    var rate_gasto_administracion = 0.08;
    var rate_financiamiento = 9 / 100;
    var rate_impuestos = 0.025;



    setTimeout(function() {
        var materialesInsumos = getTotalPurchaseAmount();

        //DIRECTO
        var viaticos = cur_frm.doc.viaticos;
        var costoContratos = cur_frm.doc.costo_de_contratos;
        var fianzas = cur_frm.doc.fianzas;
        var costoRenders = cur_frm.doc.cantidad_de_vistas_en_renders * costo_x_render / cur_frm.doc.conversion_rate;
        var imprevistos = materialesInsumos * cur_frm.doc.imprevistos / 100;
        var costoDirecto = materialesInsumos + viaticos + costoContratos + fianzas + costoRenders + imprevistos;
        console.log("DIRECTO","materialesInsumos",materialesInsumos,"viaticos",viaticos,"costoContratos",costoContratos,"fianzas",fianzas,"costoRenders",costoRenders,
            "imprevistos",imprevistos,"costoDirecto",costoDirecto);

        //INDIRECTO
        var costoComisiones = cur_frm.doc.grand_total / 1.19 * cur_frm.doc.comisiones / 100;
        var nomina = materialesInsumos * rate_nomina;
        var costoIndirecto = costoComisiones + nomina;
        console.log("INDIRECTO","costoComisiones",costoComisiones,"nomina",nomina,"costoIndirecto",costoIndirecto);


        //ADMIN y ventas
        var gastoVentas = materialesInsumos * rate_gasto_ventas;
        var gastoAdministracion = materialesInsumos * rate_gasto_administracion;
        var gastoFinanciamiento = materialesInsumos * cur_frm.doc.meses_de_credito * rate_financiamiento / 12;
        var gastosAdministracionVentas = gastoVentas + gastoAdministracion + gastoFinanciamiento;
        console.log("ADMIN y VENTAS","gastoVentas",gastoVentas,"gastoAdministracion",gastoAdministracion,"gastoFinanciamiento",gastoFinanciamiento);


        var totalCostosDirectosIndirectos = gastosAdministracionVentas + costoIndirecto + costoDirecto;
        var impuestos = totalCostosDirectosIndirectos * rate_impuestos;

        var totalCostos = totalCostosDirectosIndirectos + impuestos;


        var margenNeto = cur_frm.doc.grand_total - totalCostos;

        var pct_margen = margenNeto / cur_frm.doc.grand_total * 100;
        pct_margen = Math.round(pct_margen * 100) / 100;


        console.log("Margen Neto", pct_margen);

        if(cur_frm.doctype=="Quotation") {
            cur_frm.set_value("margen_neto_total", pct_margen);
            cur_frm.set_value("version_margen_neto", version);

            generateCommission(frmGloblal);
        }

    }, wait);

}

cur_frm.cscript.viaticos= function(doc) {
    calcMargin(1);
};

cur_frm.cscript.cantidad_de_vistas_en_renders= function(doc) {
    calcMargin(1);
};

cur_frm.cscript.meses_de_credito= function(doc) {
    calcMargin(1);
};

cur_frm.cscript.visa_cuotas= function(doc) {
    calcMargin(1);
};

cur_frm.cscript.imprevistos= function(doc) {
    calcMargin(1);
};

cur_frm.cscript.comisiones= function(doc) {
    calcMargin(1);
};

cur_frm.cscript.costo_de_contratos= function(doc) {
    calcMargin(1);
};

cur_frm.cscript.fianzas= function(doc) {
    calcMargin(1);
};

cur_frm.cscript.isr= function(doc) {
    calcMargin(1);
};

cur_frm.cscript.diferencia_de_iva= function(doc) {
    calcMargin(1);
};

cur_frm.cscript.apply_discount_on= function(doc) {
    //calcMargin(3000);//se dispara con additional_discount_percentage
    //frappe.msgprint("apply discount on");
};

cur_frm.cscript.discount_amount= function(doc) {
    //frappe.msgprint("discount_amount");
    //base_discount_amount tiene el valor del descuento independientemente si es por % o por valor exacto

    calcMargin(3000);
};

cur_frm.cscript.additional_discount_percentage= function(doc) {
    //frappe.msgprint("additional_discount_percentage");

    calcMargin(3000);
};


frappe.ui.form.on("Quotation Item", {
    items_remove: function(frm) {
        //frappe.msgprint("items remove");
        calcMargin(3000);
    }
});

cur_frm.cscript.factor_global = function(doc) {

    aplicarFactorGlobal();


};


function aplicarFactorGlobal() {

    var factorGlobal = cur_frm.doc.factor_global;


    $.each(cur_frm.doc.items, function(i, d) {
        //is last
        var isLastItem =     (i+1) == cur_frm.doc.items.length;
        frappe.model.set_value(d.doctype, d.name, "bulk_is_last", isLastItem );
        frappe.model.set_value(d.doctype, d.name, "discount_percentage", factorGlobal);
    });

    //cur_frm.refresh_field("items"); //se esta actualizando al detectar el cambio en discount_percentage
    //cur_frm.refresh();
}



function filterTermsSelect() {

    cur_frm.set_query("payment_terms_creative", function() {
        return {
            "filters": {
                "is_payment_term": true
            }
        };
    });

    cur_frm.set_query("tc_name", function() {
        return {
            "filters": {
                "is_payment_term": false
            }
        };
    });

}


function recargarPreciosCompra() {
    $.each(cur_frm.doc.items, function(i, d) {

        var isLastItem =     (i+1) == cur_frm.doc.items.length;

//console.log("cur_frm.doc.items.length: "+cur_frm.doc.items.length + " i: "+i+" isLastItem "+isLastItem );

        getPriceListRateBuying2(d, isLastItem);


    });
    frappe.msgprint("Inicio a recargar precios de compra. Espere la confirmación de margen actualizado.");

}

function recargarPreciosCompraVenta() {
    $.each(cur_frm.doc.items, function(i, d) {

        var isLastItem =     (i+1) == cur_frm.doc.items.length;

//console.log("cur_frm.doc.items.length: "+cur_frm.doc.items.length + " i: "+i+" isLastItem "+isLastItem );

        getPriceListRateBuyingFromItem(d, isLastItem);


    });
    frappe.msgprint("Inicio a recargar precios de compra. Espere la confirmación de margen actualizado.");

}








cur_frm.cscript.on_submit = function(doc, cdt, cdn) {
    updOptyCotizada();
}

function updOptyCotizada() {
    console.log("cur_frm.doc.desde_oportunidad: "+cur_frm.doc.desde_oportunidad);

    if(isEmpty(cur_frm.doc.desde_oportunidad))
        return;

    frappe.call({
        "method": "frappe.client.set_value",
        "args": {
            "doctype": "Opportunity",
            "name": cur_frm.doc.desde_oportunidad,
            "fieldname": {
                "embudo_state":"Cotizada",
                "presupuesto_declarado_por_el_cliente":cur_frm.doc.grand_total,
                "embudo_state_v2":"Presentar cotización"
            }
        }
    });
}




cur_frm.cscript.taxes_and_charges = function(doc) {
    if(doc.taxes_and_charges=="IVA GT (venta)")
        cur_frm.set_value("diferencia_de_iva", 10 );
    else if(doc.taxes_and_charges=="Sin impuestos - GC")
        cur_frm.set_value("diferencia_de_iva", -60.0);//iva credito calculado al 60% de gasto
    //frappe.msgprint("taxes and charges");
    calcMargin(1);

    old_taxes_and_charges(doc);
};

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

function checkIndividualMargin() {

    var maxMarginUnitario = 55;

    var res = false;
    $.each(cur_frm.doc.items, function(i, d) {

        var costoVenta;
        var costoCompra;
        var margenUnitario;
        var qty;

        costoVenta = d.rate; // rate ya incluye descuento.   price_list_rate
        costoCompra = d.price_list_rate_buying;
        qty = d.qty;
        margenUnitario = (costoVenta - costoCompra)*qty;

        var pctMarginUnitario = Math.round( (costoVenta - costoCompra) / costoVenta  * 100) ;

        //msgprint("costoVenta: "+costoVenta+" costoCompra: "+costoCompra+" margenUnitario: "+margenUnitario+" qty: "+qty);

        if(cur_frm.doc.order_type=="Sales")
            maxMarginUnitario = 85;
        else
            maxMarginUnitario = 55;


        if(d.item_code!="22-00001" && pctMarginUnitario > maxMarginUnitario ) {
            frappe.msgprint("Revisar precios de: "+d.item_code+" Venta: "+costoVenta+" Compra: "+costoCompra+" Margen: "+ pctMarginUnitario  +"%");
            res = true;
        }

    });

    console.log("cur_frm.doc.permitir_margen_alto_unitario: "+cur_frm.doc.permitir_margen_alto_unitario);
    if(res && !cur_frm.doc.permitir_margen_alto_unitario)
        frappe.throw(__("Revisar margen unitario. Es muy alto."));

    return res;
}



function cargarCalidadOportunidad() {
    console.log("cargarCalidadOportunidad");

    if(cur_frm.doc.order_type!="Sales" && cur_frm.doc.pct_calidad_de_oportunidad<50) {
        frappe.show_alert("RECORDATORIO. La calidad de oportunidad es muy baja. Analizar e ingresar la información de calidad en el CRM para decidir si debe cotizar o no.");
    }
}

function checkCalidadOportunidad() {
    if(cur_frm.doc.order_type!="Sales" && cur_frm.doc.pct_calidad_de_oportunidad<50)
        frappe.msgprint("RECORDATORIO. La calidad de oportunidad es muy baja.");
}



function changeWidth() {
    setTimeout(
        function(){

            console.log("changeWidth");

            $.each(document.getElementsByClassName("container page-body"), function(i, d) {
                if(!isEmpty(d))
                    d.style.width="100%";
            });

            $.each(document.getElementsByClassName("static-area ellipsis"), function(i, d) {
                if(!isEmpty(d))
                    d.className = "static-area";
            });

            $.each(document.getElementsByClassName("grid-static-col"), function(i, d) {
                if(!isEmpty(d))
                    d.style.height="60px";
            });

            $.each(document.getElementsByClassName("row-index"), function(i, d) {
                if(!isEmpty(d))
                    d.style.height="60px";
            });




        }, 2000	);
}











/*
  function selItemToUpd() {
    cur_frm.call({
      method: "frappe.client.get_list",
      args: {
        doctype: "Item",
        limit_page_length: 1000,
        fields: ["name","item_code","standard_purchasing_rate","standard_rate"],
        filters: [["Item","item_name","like","%panama%"]]
      },
      callback: function(r, rt) {
        if(r.message) {

          //console.log("r.message: "+JSON.stringify(r.message));
          $.each(r.message, function(i, d) {
            console.log(i,"d.item_code",d.item_code,"d.standard_purchasing_rate",d.standard_purchasing_rate,"standard_rate",d.standard_rate);
            uItem(d.item_code, (d.standard_purchasing_rate*1.6));
          });
        }


      }
    });
  }

  function uItem(item_code, standard_rate) {
    frappe.call(
      {
        "method": "frappe.client.set_value",
        "args": {
          "doctype": "Item",
          "name": item_code,
          "fieldname": {
            standard_rate: standard_rate
          }
        }
    });
    console.log("actualizado item_code: "+item_code);
  }*/