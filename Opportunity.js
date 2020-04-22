function isEmpty(val){
    var test =  (val === undefined || val == null || val.length <= 0) ? true : false;
    return test;
}

function eliminateDuplicates(arr) {
    var uniqs = arr.filter(function(item, index, array) {
        return array.indexOf(item) === index;
    });

    return uniqs;
}

cur_frm.cscript.custom_onload = function(doc) {
    filterOpportunityContact();

    initializeModel();

    formatButton();

}


frappe.ui.form.on("Opportunity",
    {
        validate: function(frm) {

            if(cur_frm.doc.presupuesto_declarado_por_el_cliente < 1000)
                frappe.throw(" Debe indicar un presupuesto. Si el cliente no lo indica, estimarlo basándose en la información existente.");


        },
        before_submit: function(frm) {

        }
    }
);


function getCalidadOportunidad() {
    var pct_calidad_oportunidad = 0;
    //***********
    if( !( cur_frm.doc.fecha_estimada_aprobacion === undefined ||
        cur_frm.doc.fecha_estimada_aprobacion === null ||
        cur_frm.doc.fecha_estimada_aprobacion === ""
    )
    ) {
        pct_calidad_oportunidad += 25;
    }

    //***********
    if( !( cur_frm.doc.fecha_de_ejecucion_del_proyecto === undefined ||
        cur_frm.doc.fecha_de_ejecucion_del_proyecto === null ||
        cur_frm.doc.fecha_de_ejecucion_del_proyecto === ""
    )
    ) {
        pct_calidad_oportunidad += 25;
    }

    //***********
    if( !( cur_frm.doc.presupuesto_declarado_por_el_cliente === undefined ||
        cur_frm.doc.presupuesto_declarado_por_el_cliente === null ||
        cur_frm.doc.presupuesto_declarado_por_el_cliente === ""
    )
    ) {
        if(cur_frm.doc.presupuesto_declarado_por_el_cliente>0)
            pct_calidad_oportunidad += 25;
    }

    //***********
    if( !( cur_frm.doc.metros_cuadrados === undefined ||
        cur_frm.doc.metros_cuadrados === null ||
        cur_frm.doc.metros_cuadrados === ""
    )
    ) {
        if(cur_frm.doc.metros_cuadrados>0)
            pct_calidad_oportunidad += 25;
    }


    return pct_calidad_oportunidad ;
}

function calcPricePerM2() {
    var metrosCuadrados = 0;
    var presupuestoDeclaradoPorElCliente = 0;

    if(!isEmpty(cur_frm.doc.metros_cuadrados))
        metrosCuadrados = cur_frm.doc.metros_cuadrados;

    if(!isEmpty(cur_frm.doc.presupuesto_declarado_por_el_cliente))
        presupuestoDeclaradoPorElCliente = cur_frm.doc.presupuesto_declarado_por_el_cliente;

    var pricePerM2 = 0;

    if(metrosCuadrados > 0) {
        pricePerM2  = presupuestoDeclaradoPorElCliente / metrosCuadrados;
        pricePerM2  = Math.round(pricePerM2  * 100) / 100;
    }

    cur_frm.set_value("price_per_m2", pricePerM2);
}











function filterOpportunityContact() {
    cur_frm.set_query("contact", "contactos", function(doc, cdt, cdn) {

        return {
            filters: [
                ["Dynamic Link", "link_doctype", "=", "Customer"],
                ["Dynamic Link", "link_name", "=", cur_frm.doc.party_name],
            ]
        };
    });

}






class ClassificationVariable {
    constructor(name, weight, percentageTable, referenceValue, referenceYearsValue) {
        this.name = name;
        this.weight = weight;
        this.percentageTable = percentageTable;
        this.referenceValue = referenceValue;
        this.referenceYearsValue = referenceYearsValue;
    }

    getWeighingByTable(value) {
        var res = 0;

        console.log("this.percentageTable[value]: "+this.percentageTable[value]);

        if(!isEmpty(this.percentageTable[value]))
            res = this.percentageTable[value] * this.weight;

        return res;
    }

    getWeighingByRatio(value) {
        var res = value/this.referenceValue * this.weight;

        return res;
    }

    getWeighingByDateRatio(value) {
        if(isEmpty(value)) return 0;

        var hoy = new Date();
        var yearsDif = frappe.datetime.get_diff(hoy, value) / 365;

        var res = yearsDif/this.referenceYearsValue * this.weight;

        console.log("yearsDif: "+yearsDif+" res: "+res);

        return res;
    }

    getWeighing(value) {
        if(!isEmpty(this.referenceYearsValue))
            return this.getWeighingByDateRatio(value);
        if (this.referenceValue == 0)
            return this.getWeighingByTable(value);
        else
            return this.getWeighingByRatio(value);
    }

}


class CustomerClassification {

    constructor() {
        this.vars = [];
        this.rate = 0;
    }

    addVar(name, weight, percentageTable, referenceValue, referenceYearsValue) {
        var i = new ClassificationVariable(name, weight, percentageTable, referenceValue, referenceYearsValue);
        this.vars.push(i);
    }

    //values=[{name:value, name1:value1}]
    getRate(values) {
        var totalWeight = 0;
        var totalWeighing = 0;

        $.each(this.vars, function(i, item) {

            console.log("i: "+i+" item.name: "+item.name);

            var value = values[item.name];
            var weighing = item.getWeighing(value);

            if( isNaN(weighing) ) weighing =0;

            console.log("value: "+value+" weighing: "+weighing);

            totalWeighing += weighing;
            totalWeight += item.weight;
        });

        var rate = totalWeighing / totalWeight * 100;

        rate = Math.round(rate * 100) / 100;

        return rate;
    }

}

var classificationModel;

function initializeModel() {
    classificationModel = new CustomerClassification();

    classificationModel.addVar("authority_type", 20, {"Yes":1,"No":0},0, null);

    classificationModel.addVar("presupuesto_declarado_por_el_cliente", 200, {}, 2000000, null);

    classificationModel.addVar("funding_source", 20, {"No está definido":0,"Inversión de socios":.75, "Presupuesto Anual":1,"Préstamo Bancario":.75},0, null);

    classificationModel.addVar("need_type", 20, {"Sueño":0,"Compra de oficina propia":1, "Fin de contrato de alquiler":.75,"Hace mucho tiempo que no se remodela":.5,"Crecimiento":.5,"Cambio de imagen":.25,"Empresa cambia de dueño":1},0, null);

    classificationModel.addVar("metros_cuadrados", 30, {}, 500, null);

    classificationModel.addVar("price_per_m2", 50, {}, 4000, null);

    classificationModel.addVar("fecha_estimada_aprobacion", 40, {}, 30, null);

    classificationModel.addVar("fecha_de_ejecucion_del_proyecto", 20, {}, 15, null);

    classificationModel.addVar("fecha_esperada_fin_del_proyecto", 20, {}, 45, null);

    classificationModel.addVar("cantidad_contactos", 50, {}, 3, null);

    classificationModel.addVar("aprobador", 50, {"Yes":1,"No":0}, 0, null);

}


function doOptyClassification() {

    var hoy = new Date();
    var hasAuthorityType = "No";
    var daysToApprove = 0;
    var daysBetweenApproveAndStart = 0;
    var projectDuration = 0;
    var contactsQty = 0;

    if(!isEmpty(cur_frm.doc.authority_type)) hasAuthorityType = "Yes";

    if(!isEmpty(cur_frm.doc.fecha_estimada_aprobacion))
        daysToApprove = frappe.datetime.get_day_diff(cur_frm.doc.fecha_estimada_aprobacion , hoy) + 1;

    if(!isEmpty(cur_frm.doc.fecha_estimada_aprobacion) && !isEmpty(cur_frm.doc.fecha_de_ejecucion_del_proyecto))
        daysBetweenApproveAndStart = frappe.datetime.get_day_diff(cur_frm.doc.fecha_de_ejecucion_del_proyecto , cur_frm.doc.fecha_estimada_aprobacion) + 1;

    if(!isEmpty(cur_frm.doc.fecha_esperada_fin_del_proyecto) && !isEmpty(cur_frm.doc.fecha_de_ejecucion_del_proyecto))
        projectDuration = frappe.datetime.get_day_diff(cur_frm.doc.fecha_esperada_fin_del_proyecto , cur_frm.doc.fecha_de_ejecucion_del_proyecto) + 1;


    if( !isEmpty(cur_frm.doc.contactos) )
        contactsQty = cur_frm.doc.contactos.length;
    else
        contactsQty = 0;

    console.log("contactsQty: "+contactsQty);

    var hasPurchaseAuthorityContact = "No";
    $.each(cur_frm.doc.contactos, function(i, d) {
        console.log("d.contact: "+d.contact+" purchase_authority: "+d.purchase_authority);
        if(d.purchase_authority == "Yes") {
            hasPurchaseAuthorityContact = "Yes";
            return false;
        }

    });


    var values = {
        "authority_type":hasAuthorityType  ,
        "presupuesto_declarado_por_el_cliente":cur_frm.doc.presupuesto_declarado_por_el_cliente,
        "funding_source":cur_frm.doc.funding_source,
        "need_type":cur_frm.doc.need_type,
        "metros_cuadrados":cur_frm.doc.metros_cuadrados,
        "price_per_m2":cur_frm.doc.price_per_m2,
        "fecha_estimada_aprobacion":daysToApprove,
        "fecha_de_ejecucion_del_proyecto":daysBetweenApproveAndStart,
        "fecha_esperada_fin_del_proyecto":projectDuration,
        "cantidad_contactos":contactsQty,
        "aprobador":hasPurchaseAuthorityContact

    };

    var rate = classificationModel.getRate(values);

    console.log("rate: "+rate+" values: "+JSON.stringify(values));


    if((cur_frm.doc.embudo_state_v2=="Conocer" || cur_frm.doc.embudo_state_v2=="Presentar empresa") && contactsQty > 0 && rate>0 )
        cur_frm.set_value("embudo_state_v2", "Tomar requerimiento");

    cur_frm.set_value("classification_rate_version", "20190226");
    cur_frm.set_value("rated_on", cur_frm.doc.transaction_date);
    cur_frm.set_value("pct_calidad_de_oportunidad", rate);
}


cur_frm.cscript.authority_type = function(doc) {
    doOptyClassification();
};

cur_frm.cscript.presupuesto_declarado_por_el_cliente= function(doc) {
    calcPricePerM2();
    doOptyClassification();
};

cur_frm.cscript.funding_source= function(doc) {
    doOptyClassification();
};

cur_frm.cscript.need_type = function(doc) {
    doOptyClassification();
};

cur_frm.cscript.price_per_m2 = function(doc) {
    doOptyClassification();
};

cur_frm.cscript.metros_cuadrados = function(doc) {
    calcPricePerM2();

    doOptyClassification();
};

cur_frm.cscript.fecha_estimada_aprobacion= function(doc) {
    doOptyClassification();
};

cur_frm.cscript.fecha_de_ejecucion_del_proyecto = function(doc) {
    doOptyClassification();
};

cur_frm.cscript.fecha_esperada_fin_del_proyecto= function(doc) {
    doOptyClassification();
};


frappe.ui.form.on("Opportunity Contact", {
    contactos_remove: function(frm) {
        console.log("contact remove");
        doOptyClassification();
    },
    contactos_add: function(frm) {
        console.log("contact add");
        doOptyClassification();
    }
});



function formatButton() {
    document.querySelectorAll("[data-fieldname='descartar']")[1].style.backgroundColor ="red";
    document.querySelectorAll("[data-fieldname='descartar']")[1].style.color ="white";
    document.querySelectorAll("[data-fieldname='descartar']")[1].style.fontSize = "large";
    document.querySelectorAll("[data-fieldname='descartar']")[1].style.fontWeight = "bold";
}

cur_frm.cscript.descartar = function(doc) {
    console.log("Descartar");

    frappe.call({
        "method": "frappe.client.set_value",
        "args": {
            "doctype": "Opportunity",
            "name": cur_frm.doc.name,
            "fieldname": {
                "embudo_state_v2": "Descartada"
            }
        }
    });

    frappe.msgprint("Descartada");
};






cur_frm.cscript.opportunity_type = function(doc) {
    //setRequeriedFieldsOptyType();
};

function setRequeriedFieldsOptyType() {
    if(cur_frm.doc.opportunity_type == "Sales")
        cur_frm.set_df_property("presupuesto_declarado_por_el_cliente", "reqd", 1);
    else
        cur_frm.set_df_property("presupuesto_declarado_por_el_cliente", "reqd", 0);

}





frappe.ui.form.on("Opportunity Activity", "created_on", function(frm, cdt, cdn) {
    onChangeActivity(cdt, cdn);
});

frappe.ui.form.on("Opportunity Activity", "activity_type", function(frm, cdt, cdn) {
    onChangeActivity(cdt, cdn);
});

frappe.ui.form.on("Opportunity Activity", "comment", function(frm, cdt, cdn) {
    onChangeActivity(cdt, cdn);
});

frappe.ui.form.on("Opportunity Activity", "next_contact_date", function(frm, cdt, cdn) {
    onChangeActivity(cdt, cdn);
});

function onChangeActivity(cdt,cdn) {
    var d = locals[cdt][cdn];

    var dias_para_proximo_seguimiento = 3;

    if(!isEmpty(d.next_contact_date)) {
        var hoy = new Date();
        dias_para_proximo_seguimiento = frappe.datetime.get_diff(d.next_contact_date, hoy) + 1;
    }



    cur_frm.set_value("activity_last_created_on", d.created_on);
    cur_frm.set_value("last_activity_type", d.activity_type);
    cur_frm.set_value("last_activity_comment", d.comment);
    cur_frm.set_value("dias_para_proximo_seguimiento", dias_para_proximo_seguimiento);


    //Asignados a notificar
    var users = [];
    $.each(cur_frm.get_docinfo().assignments, function(i, u) {
        users.push(u.owner);
    });
    users = eliminateDuplicates(users);

    console.log(users);

    if(!isEmpty(users)) {
        if(users.length>0) cur_frm.set_value("notificar_actividad_1", users[0]);
        if(users.length>1) cur_frm.set_value("notificar_actividad_2", users[1]);
        if(users.length>2) cur_frm.set_value("notificar_actividad_3", users[2]);
    }


    //msgprint("progress: "+ d.progress + " avanceEsperado " + avanceEsperado );
}
