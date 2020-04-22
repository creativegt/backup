function isEmpty(val){
    var test =  (val === undefined || val == null || val.length <= 0) ? true : false;
    return test;
}

frappe.ui.form.on("Delivery Note Item", "item_code", function(frm, cdt, cdn) {

    var d = locals[cdt][cdn];
    setTimeout(
        function(){
            frappe.model.set_value(d.doctype, d.name, "cost_center", "");
        }, 3000
    );
});


frappe.ui.form.on("Delivery Note", {
        refresh: function(frm) {
            console.log("refresh "+cur_frm.doc.status);
            var me = this
            //frappe.msgprint("estado: "+cur_frm.doc.status);
            if(cur_frm.doc.status == "Draft") {
                setMandatoryFields();
            }

            changeWidth();
        }
    }
);

function setMandatoryFields() {
    if(!isEmpty(cur_frm.doc.sales_order_type)){
        if(cur_frm.doc.sales_order_type == "Sales") {
            cur_frm.set_df_property("transporter_name", "reqd", 1);
            cur_frm.set_df_property("lr_no", "reqd", 1);
        } else {
            cur_frm.set_df_property("supervisor", "reqd", 1);
        }
    }
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