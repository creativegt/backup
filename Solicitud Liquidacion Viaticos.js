function isEmpty(val){
    var test =  (val === undefined || val == null || val.length <= 0) ? true : false;
    return test;
}

cur_frm.cscript.custom_onload = function(doc) {

    if(isEmpty(cur_frm.doc.semana))
        getWeekOfYear();

    if(isEmpty(cur_frm.doc.employee))
        getEmployee();


    filterProject();
}








cur_frm.cscript.year = function(doc) {

    if(!isEmpty(cur_frm.doc.semana) && !isEmpty(cur_frm.doc.year)) {
        var mon = getDateOfWeek(cur_frm.doc.semana, cur_frm.doc.year);

        setFromTo(mon);
    }
}

cur_frm.cscript.semana = function(doc) {

    if(!isEmpty(cur_frm.doc.semana) && !isEmpty(cur_frm.doc.year)) {
        var mon = getDateOfWeek(cur_frm.doc.semana, cur_frm.doc.year);

        setFromTo(mon);
    }
}


frappe.ui.form.on("Solicitud Liquidacion Viaticos",
    {
        validate: function(frm) {

            if(cur_frm.doc.total_viajes > 250)
                frappe.msgprint(" Se enviará para autorización.");


            if(cur_frm.doc.grand_total <= 0) {
                frappe.throw(__("El monto de solicitud no puede ser cero."));
            }


        },
        before_submit: function(frm) {

        }
    }
);



frappe.ui.form.on("Solicitud Liquidacion Viaticos Gasolina", "project", function(frm, cdt, cdn) {
    calcularTotalGasolinaUberItem(frm, cdt, cdn);
});

frappe.ui.form.on("Solicitud Liquidacion Viaticos Gasolina", "ingreso_km", function(frm, cdt, cdn) {
    var item = locals[cdt][cdn];

    console.log("item.ingreso_km: "+item.ingreso_km);

    if(item.ingreso_km == 0) {
        item.project = "";
        cur_frm.refresh_field("viajes");
    } else
        validarDistanciaManual(frm, cdt, cdn);
});




frappe.ui.form.on("Solicitud Liquidacion Viaticos Gasolina", "km_inicial", function(frm, cdt, cdn) {
    validarDistanciaManual(frm, cdt, cdn);
});

frappe.ui.form.on("Solicitud Liquidacion Viaticos Gasolina", "km_final", function(frm, cdt, cdn) {
    validarDistanciaManual(frm, cdt, cdn);
});

frappe.ui.form.on("Solicitud Liquidacion Viaticos Gasolina", "hora_llegada", function(frm, cdt, cdn) {
    var item = locals[cdt][cdn];
    validarHoraEnSemana(frm, cdt, cdn, item.hora_llegada, "viajes");
});


function validarHoraEnSemana(frm, cdt, cdn, fecha, contenedor) {
    var item = locals[cdt][cdn];

    var date_llegada = new Date(fecha.replace(/-/g,"/").split(' ')[0] );

    //desde
    var diferencia_desde = frappe.datetime.get_diff(date_llegada, cur_frm.doc.desde);

    if(diferencia_desde < 0) {
        frappe.msgprint("La fecha debe estar dentro de la semana que se reporta: "+fecha);
        item.hora_llegada = "";
        item.desde = "";
        item.hasta = "";
    }

    //hasta
    var diferencia_hasta = frappe.datetime.get_diff(date_llegada, cur_frm.doc.hasta);

    if(diferencia_hasta >= 1) {
        frappe.msgprint("La fecha debe estar dentro de la semana que se reporta: "+fecha);
        item.hora_llegada = "";
        item.desde = "";
        item.hasta = "";
    }

    console.log("date_llegada: "+date_llegada+" cur_frm.doc.desde: "+cur_frm.doc.desde+" cur_frm.doc.hasta: "+cur_frm.doc.hasta+" diferencia_desde: "+diferencia_desde+" diferencia_hasta: "+diferencia_hasta);

    cur_frm.refresh_field(contenedor);
}


function validarFechaDesdeHasta(frm, cdt, cdn) {
    var item = locals[cdt][cdn];

    if(isEmpty(item.hasta) || isEmpty(item.desde)) return;

    var desde = new Date(item.desde.replace(/-/g,"/") );
    var hasta = new Date(item.hasta.replace(/-/g,"/") );

    var mayor = desde>hasta;

    if(mayor) {
        frappe.msgprint("La fecha hasta debe ser mayor. ");
        item.hasta = "";
        cur_frm.refresh_field("parqueos");

    }

    console.log("validarFechaDesdeHasta mayor: "+mayor+" desde: "+desde);
}


frappe.ui.form.on("Solicitud Liquidacion Viaticos Parqueo", "monto_factura", function(frm, cdt, cdn) {
    calcularTotalParqueo();
});

frappe.ui.form.on("Solicitud Liquidacion Viaticos Parqueo", "project", function(frm, cdt, cdn) {
    calcularTotalParqueo();
});

frappe.ui.form.on("Solicitud Liquidacion Viaticos Parqueo", "desde", function(frm, cdt, cdn) {
    var item = locals[cdt][cdn];
    validarHoraEnSemana(frm, cdt, cdn, item.desde, "parqueos");

    validarFechaDesdeHasta(frm, cdt, cdn);
});

frappe.ui.form.on("Solicitud Liquidacion Viaticos Parqueo", "hasta", function(frm, cdt, cdn) {
    var item = locals[cdt][cdn];
    validarHoraEnSemana(frm, cdt, cdn, item.hasta, "parqueos");

    validarFechaDesdeHasta(frm, cdt, cdn);
});



frappe.ui.form.on("Solicitud Liquidacion Viaticos Gasolina", {
    viajes_remove: function(frm) {
        calcularTotalGasolinaUber();
        console.log("item removed");
    },
    fields_add: function(frm, cdt, cdn) {

    }
});

frappe.ui.form.on("Solicitud Liquidacion Viaticos Parqueo", {
    parqueos_remove: function(frm) {
        calcularTotalParqueo();
        console.log("item removed");
    },
    fields_add: function(frm, cdt, cdn) {

    }
});

frappe.ui.form.on("Solicitud Liquidacion Viaticos Uber", {
    ubers_remove: function(frm) {
        calcularTotalUber();
        console.log("item removed");
    },
    fields_add: function(frm, cdt, cdn) {

    }
});


var CONST_CXKM = 1.5;
var CONST_CXKM_UBER = 1;

function calcularTotalGasolinaUberItem(frm, cdt, cdn) {
    var item = locals[cdt][cdn];
    console.log("item.distancia: "+item.distancia);

    var cxkm = CONST_CXKM;

    var total = item.distancia * 2 * cxkm;
    item.total = total;

    if(total <= 0) {
        frappe.msgprint("Solicitar a administración establecer una distancia hacia este proyecto: "+item.project);
        item.project = "";
        item.estado_de_avance = "";
    }

    if (!isEmpty(item.estado_de_avance) &&  item.estado_de_avance != "EN TIEMPO") {
        frappe.msgprint('Debe estar EN TIEMPO para permitir solicitud. Proyecto: <a href= "#Form/Project/'+item.project+'">'+item.project+'</a>');
        item.project = "";
        item.estado_de_avance = "";
        item.distancia =0;
        item.project_workflow_state = "";
    }

    if(!isEmpty(item.project_workflow_state) && item.project_workflow_state!="Ejecución") {
        frappe.msgprint('Debe estar En Ejecución para permitir solicitud. Proyecto: <a href= "#Form/Project/'+item.project+'">'+item.project+'</a>');
        item.project = "";
        item.estado_de_avance = "";
        item.distancia =0;
        item.project_workflow_state = "";
    }

    cur_frm.refresh_field("viajes");
    calcularTotalGasolinaUber();
}

function calcularTotalGasolinaUber() {
    var total = 0;
    $.each(cur_frm.doc.viajes, function(i, d) {
        if(!isNaN(d.total))
            total += d.total;

    });

    cur_frm.set_value("total_viajes", total);

    calcularGrandTotal();
}


function calcularTotalParqueo() {
    var total = 0;
    $.each(cur_frm.doc.parqueos, function(i, d) {

        if(!isNaN(d.monto_factura))
            total += d.monto_factura;

        if (d.estado_de_avance != "EN TIEMPO") {
            frappe.msgprint('Debe estar EN TIEMPO para permitir solicitud. Proyecto: <a href= "#Form/Project/'+d.project+'">'+d.project+'</a>');
            d.project = "";
            d.estado_de_avance = "";
            d.distancia =0;
            d.project_workflow_state = "";
        }

        if(d.project_workflow_state!="Ejecución") {
            frappe.msgprint('Debe estar En Ejecución para permitir solicitud. Proyecto: <a href= "#Form/Project/'+d.project+'">'+d.project+'</a>');
            d.project = "";
            d.estado_de_avance = "";
            d.distancia =0;
            d.project_workflow_state = "";
        }



    });
    cur_frm.refresh_field("parqueos");

    if(isNaN(total))
        total = 0;

    cur_frm.set_value("total_parqueos", total);

    calcularGrandTotal();
}


function calcularGrandTotal() {
    var total_parqueos = cur_frm.doc.total_parqueos;
    var total_viajes = cur_frm.doc.total_viajes;
    var total_ubers = cur_frm.doc.total_ubers;

    if(isNaN(total_parqueos))
        total_parqueos = 0;

    if(isNaN(total_viajes))
        total_viajes = 0;

    if(isNaN(total_viajes))
        total_ubers = 0;

    cur_frm.set_value("grand_total", total_parqueos + total_viajes + total_ubers);
}



Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

Date.prototype.getWeek = function() {
    var onejan = new Date(this.getFullYear(),0,1);
    return Math.ceil((((this - onejan) / 86400000) + onejan.getDay()+1)/7);
}

function getWeekOfYear() {
    var today = new Date();
    var weekNumber = today.getWeek();
    console.log(weekNumber);

    cur_frm.set_value("semana", weekNumber);
    cur_frm.set_value("year", today.getFullYear());
    setFromTo(today);

}


function getMonday(d) {
    d = new Date(d);
    var day = d.getDay(),
        diff = d.getDate() - day + (day == 0 ? -6:1); // adjust when day is sunday
    return new Date(d.setDate(diff));
}

function getDateOfWeek(w, y) {
    var d = (1 + (w - 1) * 7); // 1st of January + 7 days for each week

    return new Date(y, 0, d);
}

function setFromTo(d) {
    var mon = getMonday(d);
    var sun = mon.addDays(6);

    cur_frm.set_value("desde", mon);
    cur_frm.set_value("hasta", sun);
}










function getEmployee() {

    cur_frm.call({
        method: "frappe.client.get_value",
        args: {
            doctype: "Employee",
            fieldname: "name",
            filters: { user_id: cur_frm.doc.owner },
        },
        callback: function(r2, rt) {
            if(r2.message) {
                console.log("r2.message employee: "+JSON.stringify(r2));
                cur_frm.set_value("employee", r2.message.name);
            }
        }
    });


}



function validarDistanciaManual(frm, cdt, cdn) {
    var item = locals[cdt][cdn];

    var cxkm = CONST_CXKM;
    var distancia = item.km_final - item.km_inicial;

    if(distancia<=0 && item.km_final!=0) {
        frappe.msgprint(__("Km final debe ser mayor que el inicial."));
    }

    if(distancia>500) {
        frappe.msgprint(__("La distancia es muy grande, no permitida."));
        distancia = 0;
    }

    var total = distancia * cxkm;


    if(isNaN(total)) total = 0;
    if(total<0) total = 0;

    if(isNaN(distancia)) distancia = 0;
    if(distancia<0) distancia = 0;

    item.total = total;
    item.distancia = distancia;


    cur_frm.refresh_field("viajes");
    calcularTotalGasolinaUber();

}






function filterProject() {

    cur_frm.set_query("project", "viajes", function (frm) {
        return {
            filters: [["Project","workflow_state","=","Ejecución"],["Project","estado_de_avance","=","EN TIEMPO"]]
        }
    });

    cur_frm.set_query("project", "parqueos", function (frm) {
        return {
            filters: [["Project","workflow_state","=","Ejecución"],["Project","estado_de_avance","=","EN TIEMPO"]]
        }
    });


    cur_frm.set_query("project", "ubers", function (frm) {
        return {
            filters: [["Project","workflow_state","=","Ejecución"],["Project","estado_de_avance","=","EN TIEMPO"]]
        }
    });

}









frappe.ui.form.on("Solicitud Liquidacion Viaticos Uber", "project", function(frm, cdt, cdn) {
    calcularTotalUberItem(frm, cdt, cdn);
});

frappe.ui.form.on("Solicitud Liquidacion Viaticos Uber", "km_viaje", function(frm, cdt, cdn) {
    calcularTotalUberItem(frm, cdt, cdn);
});

frappe.ui.form.on("Solicitud Liquidacion Viaticos Uber", "hora_llegada", function(frm, cdt, cdn) {
    var item = locals[cdt][cdn];
    validarHoraEnSemana(frm, cdt, cdn, item.hora_llegada, "ubers");
});

function calcularTotalUberItem(frm, cdt, cdn) {
    var item = locals[cdt][cdn];

    var cxkm = CONST_CXKM_UBER;

    var total = item.km_viaje * cxkm;

    if(isNaN(total))
        total = 0;

    item.total = total;

    if(total < 0) {
        frappe.msgprint("La distancia debe ser positiva.");
        item.km_viaje = 0;
    }

    if (item.estado_de_avance != "EN TIEMPO") {
        frappe.msgprint('Debe estar EN TIEMPO para permitir solicitud. Proyecto: <a href= "#Form/Project/'+item.project+'">'+item.project+'</a>');
        item.project = "";
        item.estado_de_avance = "";
        item.distancia =0;
        item.project_workflow_state = "";
    }

    if(item.project_workflow_state!="Ejecución") {
        frappe.msgprint('Debe estar En Ejecución para permitir solicitud. Proyecto: <a href= "#Form/Project/'+item.project+'">'+item.project+'</a>');
        item.project = "";
        item.estado_de_avance = "";
        item.distancia =0;
        item.project_workflow_state = "";
    }

    cur_frm.refresh_field("ubers");


    calcularTotalUber();
}


function calcularTotalUber() {
    var total = 0;

    $.each(cur_frm.doc.ubers, function(i, d) {

        if(!isNaN(d.total))
            total += d.total;

        if (!isEmpty(d.estado_de_avance) && d.estado_de_avance != "EN TIEMPO") {
            frappe.msgprint('Debe estar EN TIEMPO para permitir solicitud. Proyecto: <a href= "#Form/Project/'+d.project+'">'+d.project+'</a>');
            d.project = "";
            d.estado_de_avance = "";
        }

        if(!isEmpty(d.project_workflow_state) && d.project_workflow_state!="Ejecución") {
            frappe.msgprint('Debe estar En Ejecución para permitir solicitud. Proyecto: <a href= "#Form/Project/'+d.project+'">'+d.project+'</a>');
            d.project = "";
            d.estado_de_avance = "";
            d.distancia =0;
            d.project_workflow_state = "";
        }


    });

    cur_frm.refresh_field("ubers");

    if(isNaN(total))
        total = 0;

    cur_frm.set_value("total_ubers", total);

    calcularGrandTotal();
}
