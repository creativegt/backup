function isEmpty(val){
    var test =  (val === undefined || val == null || val.length <= 0) ? true : false;
    return test;
}

//cur_frm.add_fetch('item_group', 'prefix_series', 'naming_series');

cur_frm.cscript.item_group = function(doc) {
    //frappe.msgprint("cur_frm.doc: "+JSON.stringify(cur_frm.doc));

    if(isEmpty(cur_frm.doc.__last_sync_on)) {
        cur_frm.call({
            method: "frappe.client.get_value",
            args: { doctype: "Item Group",
                fieldname: "prefix_series",
                filters: { item_group_name: cur_frm.doc.item_group },
            }, callback: function(r, rt) {
                console.log('Item Group ', r)
                //frappe.msgprint(r.message.prefix_series);

                if(r.message) {
                    cur_frm.set_value("naming_series", r.message.prefix_series);
                }
            }
        });
    }
};


cur_frm.cscript.custom_onload = function(doc) {

    if(!isEmpty(cur_frm.doc.item_code))  {
        loadItemPriceSelling(cur_frm.doc.item_code);
        loadItemPriceBuying(cur_frm.doc.item_code);
    }


    //ocultarPrecioCompra();
}

cur_frm.cscript.is_sales= function(doc) {
    //msgprint("cur_frm.doc.is_sales: "+cur_frm.doc.is_sales);
    if(cur_frm.doc.is_sales==1)
        cur_frm.set_value("standard_rate", cur_frm.doc.standard_purchasing_rate * 1.6);

    cur_frm.set_value("is_sales_item", cur_frm.doc.is_sales);
};



frappe.ui.form.on("Item", {
    validate: function(frm) {

        if(frm.doc.item_group=="Servicios") {
            msgprint("Seleccione un grupo de productos específico. No debe ser Servicios.");
            validated=false;
            return false;
        }

        if(frm.doc.item_group=="Materia prima") {
            msgprint("Seleccione un grupo de productos específico. No debe ser Materia prima");
            validated=false;
            return false;
        }


    },
    refresh: function(frm) {
        setReadOnlyFields();
        filterPriceLists();
    }
});


function setReadOnlyFields() {
    cur_frm.set_df_property("standard_purchasing_rate", "read_only", cur_frm.doc.precio_de_catalogo ? 1 : 0);
    cur_frm.set_df_property("standard_rate", "read_only", cur_frm.doc.precio_de_catalogo ? 1 : 0);
}

frappe.ui.form.on("Item", "after_save", function(frm) {
    createOrUpdateItemPrice(frm.doc.standard_purchasing_rate, frm.doc.item_code,cur_frm.doc.buying_price_list,true,false);
    createOrUpdateItemPrice(frm.doc.standard_rate, frm.doc.item_code,cur_frm.doc.selling_price_list,false,true);
});

function createOrUpdateItemPrice(rate, item_code, price_list, buy, sell) {

    cur_frm.call({
        method: "frappe.client.get_value",
        args: {
            doctype: "Item Price",
            fieldname: "name",
            filters: {price_list:["in", [cur_frm.doc.buying_price_list,cur_frm.doc.selling_price_list]], item_code: item_code, buying: buy, selling: sell },
        },
        callback: function(r, rt) {
            if(r.message) {
                //si existe r.message.name;
                // console.log("Ya existe: "+r.message.name);
                updateItemPrice(r.message.name,rate);
            } else {
                //no existe
                createItemPrice(rate, item_code, price_list);
            }
        }
    });
}

function createItemPrice(rate, item_code, price_list) {
    frappe.call({
        "method": "frappe.client.insert",
        "args": {
            // "doc": {"doctype":"Item Price","currency":"GTQ","item_code":item_code,"price_list":price_list,"price_list_rate":rate}
            "doc": {"doctype":"Item Price","item_code":item_code,"price_list":price_list,"price_list_rate":rate}
        }
    });
}

function updateItemPrice(name, rate) {
    frappe.call({
        "method": "frappe.client.set_value",
        "args": {
            "doctype": "Item Price",
            "name": name,
            "fieldname": "price_list_rate",
            "value": rate
        }
    });
}


function loadItemPriceSelling(item_code) {
    cur_frm.call({
        method: "frappe.client.get_value",
        args: {
            doctype: "Item Price",
            fieldname: "price_list_rate",
            filters: {price_list:cur_frm.doc.selling_price_list, item_code: item_code, buying: false, selling: true },
        },
        callback: function(r, rt) {
            console.log('Load Item Price Sellign',r)
            if (isEmpty(r.message)){
                console.log('IF IS EMPTY', isEmpty(r.message))
                cur_frm.set_value("standard_rate", r.message);
                return;
            }
            if(r.message) {
                if(r.message.price_list_rate != cur_frm.standard_rate)
                    cur_frm.set_value("standard_rate", r.message.price_list_rate);
            }
        }
    });
}

function loadItemPriceBuying(item_code) {
    cur_frm.call({
        method: "frappe.client.get_value",
        args: {
            doctype: "Item Price",
            fieldname: "price_list_rate",
            filters: {price_list:cur_frm.doc.buying_price_list, item_code: item_code, buying: true, selling: false },
        },
        callback: function(r, rt) {
            if (isEmpty(r.message)){
                console.log('IF IS EMPTY', isEmpty(r.message))
                cur_frm.set_value("standard_purchasing_rate", r.message);
                return;
            }
            if(r.message) {
                if(r.message.price_list_rate != cur_frm.standard_purchasing_rate)
                    cur_frm.set_value("standard_purchasing_rate", r.message.price_list_rate);
            }
        }
    });
}


cur_frm.cscript.auto_generate_item_code = function(doc) {

};


function ocultarPrecioCompra() {
    var isAsesorProyectos = !isEmpty(frappe.user.has_role("Asesor de proyectos"));
    var encargadoShowroom = !isEmpty(frappe.user.has_role("Encargado de showroom"));

    console.log("isAsesorProyectos: "+isAsesorProyectos+" encargadoShowroom: "+encargadoShowroom)

    if(!isEmpty(cur_frm.doc.standard_purchasing_rate) && cur_frm.doc.is_stock_item==1) {
        if(isAsesorProyectos || encargadoShowroom) {
            cur_frm.toggle_display("standard_purchasing_rate", 0);
        }
    }

}

function filterPriceLists (){
    cur_frm.fields_dict['selling_price_list'].get_query = function(doc) {
        return {
            filters: {
                "selling": 1
            }
        }
    };
    cur_frm.fields_dict['buying_price_list'].get_query = function(doc) {
        return {
            filters: {
                "selling": 0
            }
        }
    }

}
cur_frm.cscript.selling_price_list = function(doc) {
    if(!isEmpty(cur_frm.doc.item_code))  {
        loadItemPriceSelling(cur_frm.doc.item_code)
    }
};
cur_frm.cscript.buying_price_list = function(doc) {
    if(!isEmpty(cur_frm.doc.item_code))  {
        loadItemPriceBuying(cur_frm.doc.item_code)
    }
};