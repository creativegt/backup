

cur_frm.cscript.custom_onload = function(doc) {
    console.log("cur_frm.doc.docstatus: "+doc.docstatus);
    if(doc.docstatus == 0) {
        $.each(cur_frm.doc.references, function(i, d) {
            //frappe.msgprint("d.reference_doctype: "+d.reference_doctype+" d.reference_name:"+d.reference_name);

            cur_frm.call({
                method: "frappe.client.get_value",
                args: {
                    doctype: d.reference_doctype,
                    fieldname: "project",
                    filters: { name: d.reference_name },
                },
                callback: function(r, rt) {
                    //msgprint(r.message.project);
                    if(r.message) {
                        cur_frm.set_value("project", r.message.project);
                    }
                }
            });

        });

        filters();
    }
}



function filters() {

    cur_frm.set_query("mode_of_payment", function() {
        return {
            filters: [
                ["Mode of Payment Account", "company", "=", cur_frm.doc.company]
            ]
        };
    });



}