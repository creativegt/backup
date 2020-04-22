function isEmpty(val){
    var test =  (val === undefined || val == null || val.length <= 0) ? true : false;
    return test;
}

frappe.ui.form.on("Sales Invoice", "refresh", function(frm) {
    if(frm.doc.enviar_correo_recordatorio_fecha_de_vencimiento==1 &&
        isEmpty(frm.doc.email_contacto_de_cobro) ) {
        msgprint("El cliente NO tiene contacto de cobro definido. Debe agregarlo primero.");
    }
});

//cur_frm.add_fetch('customer', 'nit_del_cliente', 'nit_del_cliente');
//cur_frm.add_fetch('customer', 'direccion', 'direccion');

cur_frm.cscript.factura_anulada = function(doc) {


    doc.due_date = get_today();
    doc.debit_to = "Cuentas por Cobrar - GC";
    doc.customer = "Factura anulada";
    doc.customer_name = "Factura anulada";
    doc.nit_del_cliente = "-";
    doc.direccion = "-";

    refresh_field("due_date");
    refresh_field("debit_to");
    refresh_field("customer");
    refresh_field("customer_name");
    refresh_field("nit_del_cliente");
    refresh_field("direccion");


};

function calcularInteres(doc) {
    var PCT_INTERES_DIARIO = 0.02;
    var hoy = frappe.datetime.nowdate();
    var montoDebe = doc.outstanding_amount;
    var dueDate = doc.due_date;
    var dueDateNueva = doc.fecha_de_pago;
    var status = doc.status;

    if(!isEmpty(dueDateNueva)) {
        dueDate = dueDateNueva;
    } else
        cur_frm.set_value("fecha_de_pago", doc.due_date );

    var diasAtraso = frappe.datetime.get_day_diff(hoy, dueDate);

    //msgprint("hoy "+hoy+" debe: "+montoDebe +" dueDate : "+dueDate+" diasAtraso "+diasAtraso+" status: "+status+ " base_in_words: "+doc.base_in_words);


    if (status == 'Overdue') {
        var interes = diasAtraso * (PCT_INTERES_DIARIO/30) * montoDebe;
        if(interes != doc.intereses_por_mora) {
            if(interes < 0)
                interes = 0;

            cur_frm.set_value("intereses_por_mora", interes );

            //cur_frm.save();
        }
    }
}

cur_frm.cscript.custom_onload = function(doc) {
    calcularInteres(doc);
    obtenerContactoCobro();
    setMandatoryFields();

    changeWidth();
}

cur_frm.cscript.fecha_de_pago= function(doc) {
    calcularInteres(doc);
}

cur_frm.cscript.enviar_correo_recordatorio_fecha_de_vencimiento = function(doc) {
    var hoy = frappe.datetime.nowdate();
    //msgprint("a: " + doc.enviar_correo_recordatorio_fecha_de_vencimiento);
    if(doc.enviar_correo_recordatorio_fecha_de_vencimiento==1) {
        cur_frm.set_value("fecha_ultimo_recordatorio", hoy);
        obtenerContactoCobro();
    }
}

cur_frm.cscript.enviar_correo_factura_vencida = function(doc) {
    var hoy = frappe.datetime.nowdate();
    //msgprint("a: " + doc.enviar_correo_factura_vencida);
    if(doc.enviar_correo_factura_vencida==1) {
        cur_frm.set_value("fecha_envio_factura_vencida", hoy);
        obtenerContactoCobro();
    }
}

function obtenerContactoCobro() {
    cur_frm.call({
        method: "frappe.client.get_value",
        args: {
            doctype: "Customer",
            fieldname: "contacto_cobro",
            filters: { customer_name: cur_frm.doc.customer },
        },
        callback: function(r, rt) {
            if(r.message && !isEmpty(r.message.contacto_cobro)) {
                //msgprint("r.message.contacto_cobro : "+r.message.contacto_cobro);

                cur_frm.call({
                    method: "frappe.client.get_value",
                    args: {
                        doctype: "Contact",
                        fieldname: "email_id",
                        filters: { name: r.message.contacto_cobro },
                    },
                    callback: function(r, rt) {
                        if(r.message) {
                            if (isEmpty(r.message)||isEmpty(r.message.email_id)) {
                                msgprint("El cliente NO tiene contacto de cobro definido. Debe agregarlo primero.");
                                cur_frm.set_value("email_contacto_de_cobro", "");
                            } else {
                                //msgprint("cur_frm.doc.email_contacto_de_cobro: " + cur_frm.doc.email_contacto_de_cobro+" r.message.email_id> "+r.message.email_id);

                                if(cur_frm.doc.email_contacto_de_cobro!=r.message.email_id) {
                                    cur_frm.set_value("email_contacto_de_cobro", r.message.email_id);
                                }

                            }
                        }
                    }
                });
            } else {
                msgprint("El cliente NO tiene contacto de cobro definido. Debe agregarlo primero.");
                cur_frm.set_value("email_contacto_de_cobro", "");
            }
        }
    });
}






function Unidades(num){

    switch(num)
    {
        case 1: return "UN";
        case 2: return "DOS";
        case 3: return "TRES";
        case 4: return "CUATRO";
        case 5: return "CINCO";
        case 6: return "SEIS";
        case 7: return "SIETE";
        case 8: return "OCHO";
        case 9: return "NUEVE";
    }

    return "";
}//Unidades()

function Decenas(num){

    var decena = Math.floor(num/10);
    var unidad = num - decena * 10;

    switch(decena)
    {
        case 1:
            switch(unidad)
            {
                case 0: return "DIEZ";
                case 1: return "ONCE";
                case 2: return "DOCE";
                case 3: return "TRECE";
                case 4: return "CATORCE";
                case 5: return "QUINCE";
                default: return "DIECI" + Unidades(unidad);
            }
        case 2:
            switch(unidad)
            {
                case 0: return "VEINTE";
                default: return "VEINTI" + Unidades(unidad);
            }
        case 3: return DecenasY("TREINTA", unidad);
        case 4: return DecenasY("CUARENTA", unidad);
        case 5: return DecenasY("CINCUENTA", unidad);
        case 6: return DecenasY("SESENTA", unidad);
        case 7: return DecenasY("SETENTA", unidad);
        case 8: return DecenasY("OCHENTA", unidad);
        case 9: return DecenasY("NOVENTA", unidad);
        case 0: return Unidades(unidad);
    }
}//Unidades()

function DecenasY(strSin, numUnidades) {
    if (numUnidades > 0)
        return strSin + " Y " + Unidades(numUnidades);

    return strSin;
}//DecenasY()


function Centenas(num) {
    var centenas = Math.floor(num / 100);
    var decenas = num - centenas * 100;

    switch(centenas)
    {
        case 1:
            if (decenas > 0)
                return "CIENTO " + Decenas(decenas);
            return "CIEN";
        case 2: return "DOSCIENTOS " + Decenas(decenas);
        case 3: return "TRESCIENTOS " + Decenas(decenas);
        case 4: return "CUATROCIENTOS " + Decenas(decenas);
        case 5: return "QUINIENTOS " + Decenas(decenas);
        case 6: return "SEISCIENTOS " + Decenas(decenas);
        case 7: return "SETECIENTOS " + Decenas(decenas);
        case 8: return "OCHOCIENTOS " + Decenas(decenas);
        case 9: return "NOVECIENTOS " + Decenas(decenas);
    }

    return Decenas(decenas);
}//Centenas()


function Seccion(num, divisor, strSingular, strPlural) {
    var cientos = Math.floor(num / divisor);
    var resto = num - cientos * divisor;

    var letras = "";

    if (cientos > 0)
        if (cientos > 1)
            letras = Centenas(cientos) + " " + strPlural;
        else
            letras = strSingular;

    if (resto > 0)
        letras += "";

    return letras;
}//Seccion()

function Miles(num) {
    var divisor = 1000;
    var cientos = Math.floor(num / divisor);
    var resto = num - cientos * divisor;

    var strMiles = Seccion(num, divisor, "UN MIL", "MIL");
    var strCentenas = Centenas(resto);

    if(strMiles == "")
        return strCentenas;

    return strMiles + " " + strCentenas;
}//Miles()


function Millones(num) {
    var divisor = 1000000;
    var cientos = Math.floor(num / divisor);
    var resto = num - cientos * divisor;

    var strMillones = Seccion(num, divisor, "UN MILLON", "MILLONES");
    var strMiles = Miles(resto);

    if(strMillones == "")
        return strMiles;

    return strMillones + " " + strMiles;
}//Millones()

function NumeroALetras(num) {
    var data = {
        numero: num,
        enteros: Math.floor(num),
        centavos: (((Math.round(num * 100)) - (Math.floor(num) * 100))),
        letrasCentavos: "",
        letrasMonedaPlural: 'Quetzales',//"PESOS", 'Dólares', 'Bolívares', 'etcs'
        letrasMonedaSingular: 'Quetzal', //"PESO", 'Dólar', 'Bolivar', 'etc'

        letrasMonedaCentavoPlural: "CENTAVOS",
        letrasMonedaCentavoSingular: "CENTAVO"
    };

    if (data.centavos > 0) {
        data.letrasCentavos = "CON " + (function (){
            if (data.centavos == 1)
                return Millones(data.centavos) + " " + data.letrasMonedaCentavoSingular;
            else
                return Millones(data.centavos) + " " + data.letrasMonedaCentavoPlural;
        })();
    };

    if(data.enteros == 0)
        return "CERO " + data.letrasMonedaPlural + " " + data.letrasCentavos;
    if (data.enteros == 1)
        return Millones(data.enteros) + " " + data.letrasMonedaSingular + " " + data.letrasCentavos;
    else
        return Millones(data.enteros) + " " + data.letrasMonedaPlural + " " + data.letrasCentavos;
}//NumeroALetras()


frappe.ui.form.on("Sales Invoice", {
    before_save: function(frm) {
        //msgprint("num2: "+NumeroALetras(cur_frm.doc.grand_total) );
        cur_frm.set_value("in_words_custom", NumeroALetras(cur_frm.doc.grand_total) );

    }
});

function changeWidth() {

    $.each(document.getElementsByClassName("container page-body"), function(i, d) {
        if(!isEmpty(d))
            d.style.width="100%";
    });
}




cur_frm.cscript.qty_parcial = function(doc) {
    console.log("QTY Parcial");

    var selected = cur_frm.fields_dict["items"].grid.get_selected();

    if(isEmpty(selected)) {
        frappe.msgprint("Debe seleccionar al menos una fila.");
        return;
    }

    $.each(selected, function(i, rowName) {
        var item = cur_frm.fields_dict["items"].grid.get_grid_row(rowName).doc;

        frappe.model.set_value("Sales Invoice Item", rowName, "qty", item.qty*cur_frm.doc.pct_qty_parcial/100);

        console.log(item);
    });

    frappe.msgprint("Se aplicó el parcial");
};

cur_frm.cscript.company = function(doc) {
    setMandatoryFields();
};


function setMandatoryFields() {
    console.log("company",cur_frm.doc.company);

    cur_frm.set_df_property("serie_factura", "reqd", cur_frm.doc.company != "CREAMEX, DISEÑO Y CONSTRUCCION, S.A. de C.V.");
}