function isEmpty(val){
    var test =  (val === undefined || val == null || val.length <= 0) ? true : false;
    return test;
}

cur_frm.cscript.custom_onload = function(doc) {
    populateDiv();
    filterItemCode();

}

frappe.ui.form.on("Inventario Proyectado", {
        refresh: function(frm) {
            console.log("refresh "+cur_frm.doc.status);
            var me = this;
            //frappe.msgprint("estado: "+cur_frm.doc.status);
            if(cur_frm.doc.status == "Draft") {

            }

            loadProjectedInventory();
            changeWidth();

            document.getElementById("refresh").addEventListener("click", loadProjectedInventory, false);

        }
    }
);


cur_frm.cscript.item_code = function(doc) {
    loadProjectedInventory();
};

cur_frm.cscript.item_group = function(doc) {
    loadProjectedInventory();
};

cur_frm.cscript.brand = function(doc) {
    loadProjectedInventory();
};

cur_frm.cscript.disponibles = function(doc) {
    loadProjectedInventory();
};

cur_frm.cscript.warehouse = function(doc) {
    loadProjectedInventory();
};



function populateDiv() {
    var template =
        '<div id="datatable"></div>'
    ;


    cur_frm.set_df_property('contenido', 'options',
        frappe.render(template,
            {

            })
    );

    cur_frm.refresh_field('contenido');
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

    getDataTable(filtra_disponibles) {
        var ret = [];

        var total_en_bodega = 0;
        var total_reservado = 0;
        var total_disponible = 0;

        $.each(this.itemsGrouped, function(i, item) {

            if(isEmpty(i) || i=="undefined") return;

            var row = [];
            var actual_qty = 0;
            var reserved_qty = 0;
            var image = "";
            var brand = "";
            var bodegaDetalle = "";
            var standard_rate = 0;

            $.each(item, function(i, d) {
                actual_qty += d.actual_qty;
                reserved_qty += d.reserved_qty;
                standard_rate = d.standard_rate;
                image = d.image;
                brand = d.brand;
                bodegaDetalle += "<small><font color='#cccccc'>"+d.warehouse+": "+d.actual_qty+"</font></small><br/>";
            });


            row.push("<a href='https://creativegt.erpnext.com/desk#Form/Item/"+i+"' target='_blank'>"+i+"</a>");
            if(isEmpty(brand))
                row.push("No disponible");
            else
                row.push(brand);

            if(isEmpty(image))
                row.push("No disponible");
            else
                row.push("<img width='150px' src='https://creativegt.erpnext.com"+image+"' />");

            row.push(format_currency(standard_rate, 'GTQ', 2) );

            row.push(actual_qty+"<br/><br/>"+bodegaDetalle);
            row.push(reserved_qty);

            var disponible = actual_qty-reserved_qty;
            var color ="black";
            if(disponible<=0)
                color="red";

            if(filtra_disponibles == 1 && disponible<=0) return;

            row.push("<h2><b><font color='"+color+"'>"+disponible+"</font></b></h2>");

            ret.push(row);

            total_en_bodega += actual_qty;
            total_reservado += reserved_qty;
            total_disponible += disponible;

        });

        var row = [];
        row.push("");
        row.push("");
        row.push("");
        row.push("<b>TOTAL</b>");
        row.push("<b>"+total_en_bodega+"</b>");
        row.push("<b>"+total_reservado+"</b>");
        row.push("<b>"+total_disponible+"</b>");
        ret.push(row);

        return ret;
    }

}



var report;

function loadProjectedInventory() {

    report = new Report();

    var filters = {"company":"Grupo Creative S.A.","is_stock_item":1, "disabled":0};

    if(!isEmpty(cur_frm.doc.item_code))
        filters.item_code = cur_frm.doc.item_code;

    if(!isEmpty(cur_frm.doc.item_group))
        filters.item_group = cur_frm.doc.item_group;

    if(!isEmpty(cur_frm.doc.brand))
        filters.brand = cur_frm.doc.brand;

    if(!isEmpty(cur_frm.doc.warehouse))
        filters.warehouse = cur_frm.doc.warehouse;

    cur_frm.call({
        method: "frappe.desk.query_report.run",
        args: {
            report_name: "Inventario proyectado",
            filters: filters,
            cmd: "frappe.desk.query_report.run"
        },
        callback: function(r, rt) {
            if(r.message) {
                console.log("message loadProjectedInventory: "+JSON.stringify(r.message));

                $.each(r.message.result, function(i, d) {

                    report.addItem(d);
                    console.log("d.item_code: "+d.item_code+" d.projected_qty: "+d.projected_qty);
                });



            } else {
                frappe.msgprint("No hay productos con estos criterios de búsqueda.");
            }

            cur_frm.set_value("actualizado_el", frappe.datetime.now_datetime());

            loadScripts();

        }
    });

}




function loadScripts() {



    (function() {
        var link = document.createElement('link');
        link.href = "https://unpkg.com/frappe-datatable@0.0.5/dist/frappe-datatable.min.css";
        link.rel = "stylesheet";
        link.async = false;
        document.head.appendChild(link);


        var scriptNames = [
            "https://unpkg.com/sortablejs@1.7.0/Sortable.min.js",
            "https://unpkg.com/clusterize.js@0.18.0/clusterize.min.js",
            "https://unpkg.com/frappe-datatable@0.0.5/dist/frappe-datatable.min.js"
        ];

        for (var i = 0; i < scriptNames.length; i++) {
            var script = document.createElement('script');
            script.src = scriptNames[i];
            script.async = false; // This is required for synchronous execution

            if(i== (scriptNames.length-1))
                script.onload = function(){
                    // remote script has loaded
                    drawDataTable();
                };

            document.head.appendChild(script);
        }
        // jquery.min.js and example.js will be run in order and synchronously
    })();



}


function drawDataTable() {

    report.groupByItemCode();
    var dt = report.getDataTable(cur_frm.doc.disponibles);

    console.log("report.getDataTable: "+JSON.stringify(report.getDataTable()));

    let datatable = new DataTable('#datatable',{
        columns: ['Item Code', 'Marca', 'Imagen', 'Precio Venta R', 'En bodega', 'Reservado', 'DISPONIBLE'],
        data: dt,
        cellHeight: 150,
        layout: "fluid",
        dynamicRowHeight: true
    });





}



function changeWidth() {

    $.each(document.getElementsByClassName("container page-body"), function(i, d) {
        if(!isEmpty(d))
            d.style.width="100%";
    });
}



function filterItemCode() {

    cur_frm.set_query("item_code", function() {
        return {
            "filters": {
                is_stock_item: 1,
                disabled: 0
            }
        };
    });
}