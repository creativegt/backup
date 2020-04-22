function isEmpty(val){
    var test =  (val === undefined || val == null || val.length <= 0) ? true : false;
    return test;
}

//cur_frm.add_fetch('customer_classification_name', 'imagen', 'classification_image');


cur_frm.cscript.custom_onload = function(doc) {
    initializeModel();

    filterTerritory();

    checkHasBought();

}

frappe.ui.form.on("Customer",
    {
        refresh: function(frm) {
            var me = this
            //console.log("cur_frm.doc.status: "+cur_frm.doc.status);
            if(!frm.doc.islocal && cur_frm.doc.status == "Draft") {

            }
        },
        before_save: function(frm) {
            console.log("before_save");
            updateOpportunities(cur_frm.doc.customer_classification_rate, cur_frm.doc.customer_classification_name);
        }
    }
);


cur_frm.cscript.customer_name = function(doc) {

    if(isEmpty(cur_frm.doc.nombre_comercial))
        cur_frm.set_value("nombre_comercial", cur_frm.doc.customer_name );
};











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

    classificationModel.addVar("territory", 20, {"Mixco":1,"Zona 12":1, "Amatitlán":1,"Villa Nueva":1,"Zona 5":1,"Zona 2":1,"Zona 9":1,"Zona 13":1,"Zona 10":1,"Honduras":0.5},0, null);

    classificationModel.addVar("famous_brand", 20, {"No":0, "Yes":1},0, null);

    classificationModel.addVar("organization_type", 25, {"PYME local":0.5, "Particular":0.5, "Franquicia":1, "ONG":.75, "Empresa local":1, "Corporativo internacional":1 },0, null);

    classificationModel.addVar("design_needed", 30, {"No":0.5, "Yes":1},0, null);

    classificationModel.addVar("has_maintenance_department", 30, {"No":1, "Yes":0.5},0, null);

    classificationModel.addVar("has_hr_department", 50, {"No":0.5, "Yes":1},0, null);

    classificationModel.addVar("last_renovation_on", 30, {}, 0, 5);

    classificationModel.addVar("employees_qty", 20, {},200, null);

    classificationModel.addVar("m2_facilities", 50, {},500, null);
}


function doCustomerClassification() {

    var values = {
        "territory":cur_frm.doc.territory,
        "famous_brand":cur_frm.doc.famous_brand,
        "organization_type":cur_frm.doc.organization_type,
        "design_needed":cur_frm.doc.design_needed,
        "has_maintenance_department":cur_frm.doc.has_maintenance_department,
        "has_hr_department":cur_frm.doc.has_hr_department,
        "last_renovation_on":cur_frm.doc.last_renovation_on,
        "employees_qty":cur_frm.doc.employees_qty,
        "facilities_qty":cur_frm.doc.facilities_qty,
        "m2_facilities":cur_frm.doc.m2_facilities
    };

    var rate = classificationModel.getRate(values);

    console.log("rate: "+rate+" values: "+JSON.stringify(values));

    cur_frm.set_value("classification_rate_version", "20190220");
    cur_frm.set_value("rated_on", new Date());
    cur_frm.set_value("customer_classification_rate", rate);

    if(cur_frm.doc.es_guatecompras == "Yes")
        cur_frm.set_value("customer_classification_name", "Rechazado");
    else if(rate <= 33)
        cur_frm.set_value("customer_classification_name", "Bronce");
    else if (rate>33 && rate <=66)
        cur_frm.set_value("customer_classification_name", "Plata");
    else if (rate>66)
        cur_frm.set_value("customer_classification_name", "Oro");

    loadClassificationImage();
}

cur_frm.cscript.territory = function(doc) {
    doCustomerClassification();
};

cur_frm.cscript.famous_brand = function(doc) {
    doCustomerClassification();
};

cur_frm.cscript.organization_type = function(doc) {
    doCustomerClassification();
};

cur_frm.cscript.design_needed = function(doc) {
    doCustomerClassification();
};

cur_frm.cscript.has_maintenance_department = function(doc) {
    doCustomerClassification();
};

cur_frm.cscript.has_hr_department = function(doc) {
    doCustomerClassification();
};

cur_frm.cscript.last_renovation_on = function(doc) {
    doCustomerClassification();
};

cur_frm.cscript.employees_qty = function(doc) {
    doCustomerClassification();
};

cur_frm.cscript.m2_facilities = function(doc) {
    doCustomerClassification();
};

cur_frm.cscript.es_guatecompras = function(doc) {
    doCustomerClassification();
};



function filterTerritory() {
    cur_frm.set_query("territory", function() {
        return {
            "filters": {
                "is_group": "0"
            }
        };
    });
}



function checkHasBought() {

    var customer = cur_frm.doc.customer_name;
    console.log("checkHasBought: "+customer);

    if(isEmpty(customer)) return;

    cur_frm.call({
        method: "frappe.desk.reportview.get",
        args: {
            start: 0,
            page_length: 500,
            doctype: "Sales Order",
            fields: ["`tabSales Order`.`name`","`tabSales Order`.`transaction_date`","`tabSales Order`.`customer`","`tabSales Order`.`title`","`tabSales Order`.`status`","`tabSales Order`.`grand_total`","`tabSales Order`.`project`","`tabSales Order`.`from_lead`"],
            filters: [["Sales Order","status","!=","Cancelled"],["Sales Order","status","!=","Draft"],["Sales Order","customer","=",customer]],
            with_childnames: 1
        },
        callback: function(r, rt) {
            if(r.message && !isEmpty(r.message) ) {
                console.log("message: "+JSON.stringify(r.message));

                if(cur_frm.doc.has_bought!="Yes")
                    cur_frm.set_value("has_bought", "Yes");
            } else {
                console.log("No ha comprado");
                //no ha comprado
                if(cur_frm.doc.has_bought!="No")
                    cur_frm.set_value("has_bought", "No");
            }

            checkHasBoughtXMonths();

        }
    });

}


function checkHasBoughtXMonths() {

    var d = new Date();
    d.setMonth(d.getMonth() - 6);
    console.log("six months ago: "+d);

    var fecha = d.getFullYear() + "-" + (d.getMonth()+1) + "-" + d.getDate();
    console.log("fecha formatted: "+fecha);

    var customer = cur_frm.doc.customer_name;
    console.log("checkHasBought: "+customer);

    if(isEmpty(customer)) return;

    cur_frm.call({
        method: "frappe.desk.reportview.get",
        args: {
            start: 0,
            page_length: 500,
            doctype: "Sales Order",
            fields: ["`tabSales Order`.`name`","`tabSales Order`.`transaction_date`","`tabSales Order`.`customer`","`tabSales Order`.`title`","`tabSales Order`.`status`","`tabSales Order`.`grand_total`","`tabSales Order`.`project`","`tabSales Order`.`from_lead`"],
            filters: [["Sales Order","status","!=","Cancelled"],["Sales Order","status","!=","Draft"],["Sales Order","customer","=",customer],["Sales Order","transaction_date",">",fecha]],
            with_childnames: 1
        },
        callback: function(r, rt) {
            if(r.message && !isEmpty(r.message)) {
                console.log("message: "+JSON.stringify(r.message));

                if(cur_frm.doc.buying_status!="Last 6 months")
                    cur_frm.set_value("buying_status", "Last 6 months");

            } else {
                console.log("No tiene en los ultimos 6 meses");
                //no ha comprado
                if(cur_frm.doc.has_bought=="Yes") {
                    if(cur_frm.doc.buying_status!="More than 6 months")
                        cur_frm.set_value("buying_status", "More than 6 months");
                } else
                if(cur_frm.doc.buying_status!="")
                    cur_frm.set_value("buying_status", "");
            }
        }
    });

}


function loadClassificationImage () {

    cur_frm.call({
        method: "frappe.client.get_value",
        args: {
            doctype: "Customer Classification",
            fieldname: "imagen",
            filters: { classification_name: cur_frm.doc.customer_classification_name },
        },
        callback: function(r, rt) {
            //msgprint(r.message.project_name);
            if(r.message) {
                cur_frm.set_value("classification_image", r.message.imagen);
            }
        }
    });
}









function updateOpportunities(customer_classification_rate, customer_classification_name) {

    console.log("customer_classification_rate: "+customer_classification_rate+" customer_classification_name: "+customer_classification_name);

    var newState = "";

    if(isEmpty(customer_classification_rate) || customer_classification_rate<=0)
        return;//deja igual las oportunidades

    console.log("isEmpty(customer_classification_name): "+isEmpty(customer_classification_name)+" customer_classification_rate>0: "+(customer_classification_rate>0));

    if(isEmpty(customer_classification_name)) {
        if(customer_classification_rate>0)
            newState = "Clasificar";
    } else if(customer_classification_name == "Rechazado") {
        newState = "Descartada";
    } else
        newState = "Presentar empresa";

    console.log("newState: "+newState);

    cur_frm.call({
        method: "frappe.desk.reportview.get",
        args: {
            start: 0,
            page_length: 100,
            doctype: "Opportunity",
            fields: ["`tabOpportunity`.`name`","`tabOpportunity`.`embudo_state`","`tabOpportunity`.`embudo_state_v2`","`tabOpportunity`.`customer`","`tabOpportunity`.`title`","`tabOpportunity`.`presupuesto_declarado_por_el_cliente`","`tabOpportunity`.`pct_calidad_de_oportunidad`","`tabOpportunity`.`transaction_date`","`tabOpportunity`.`status`","`tabOpportunity`.`owner`"],
            with_childnames: 1,
            filters: [["Opportunity","embudo_state_v2","in",["Investigar al cliente","Clasificar"]],["Opportunity","customer","=",cur_frm.doc.customer_name],["Opportunity","creation",">","2018-11-01"]]
        },
        callback: function(r, rt) {
            if(r.message) {
                console.log("message: "+JSON.stringify(r.message));

                $.each(r.message.values, function(i, d) {
                    var optyId = d[2];
                    console.log(i+") optyId: "+optyId);
                    updOpportunity(optyId, newState);
                });
            } else {
                console.log("Sin oportunidades para actualizar su estado.");
            }
        }
    });
}


function updOpportunity(optyId, newState) {

    frappe.call({
        "method": "frappe.client.set_value",
        "args": {
            "doctype": "Opportunity",
            "name": optyId,
            "fieldname": {
                "embudo_state_v2": newState,
                "status":"Open"
            }
        }
    });
}
