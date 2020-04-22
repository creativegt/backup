cur_frm.add_fetch('supplier', 'nit', 'nit');

cur_frm.add_fetch('supplier', 'supplier_type', 'supplier_type');

function isEmpty(val){
    var test =  (val === undefined || val == null || val.length <= 0) ? true : false;
    return test;
}

cur_frm.cscript.custom_onload = function(doc) {

    if(cur_frm.doc.status == "Draft") {
        //msgprint("status: "+cur_frm.doc.status);
        cur_frm.set_value("tc_name", "Creative TyC");

    }

    cur_frm.set_query("project", function() {
        return {
            "filters": [["Project","workflow_state","in",["Adjudicación de compras","Ejecución"]],["Project","percent_completed_creative","<",75]]
        };
    });

    cur_frm.set_query("project", "items", function (frm) {
        return {
            "filters": [["Project","workflow_state","in",["Adjudicación de compras","Ejecución"]],["Project","percent_completed_creative","<",75]]
        }
    });


    changeWidth();

}

frappe.ui.form.on("Purchase Order", {
    before_submit: function(frm) {
        if (
            !(
                (frm.doc.project_workflow_state == "Ejecución" || frm.doc.project_workflow_state == "Adjudicación de compras")
                && frm.doc.percent_completed_creative<=frm.doc.max_percent_to_accept_purchases
            )
        ) {
            frappe.throw(__("El proyecto debe estar en Adjudicar compras y con menos del "+frm.doc.max_percent_to_accept_purchases+"% de ejecución."));
        }

    }
});


cur_frm.cscript.project = function(doc) {
    setProjectToItems();
};


function setProjectToItems() {
    $.each(cur_frm.doc.items, function(i, d) {
        //msgprint("project: "+d.project+" parent: "+cur_frm.doc.project);
        d.project = cur_frm.doc.project;
    });
    cur_frm.refresh_field("items");
}


frappe.ui.form.on("Purchase Order Item", {
    items_remove: function(frm) {

    },
    items_add: function(frm, cdt, cdn) {
        setProjectToItems();
        console.log("Items updated");
    }
});



cur_frm.cscript.supplier = function(doc) {
    //msgprint("supplier "+cur_frm.doc.supplier);

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


};






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
