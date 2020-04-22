cur_frm.cscript.custom_onload = function(doc) {
    filterContactNotifyPayment();

    migracionTemporal();
}


cur_frm.cscript.payment_terms  = function(doc) {

    if(cur_frm.doc.payment_terms == "Pago de contado") {
        cur_frm.set_df_property("contacto_aviso_de_pago", "reqd", 0);
        cur_frm.set_df_property("monto_autorizado_de_credito", "reqd", 0);
        cur_frm.set_df_property("credito_autorizado_desde", "reqd", 0);

    } else {
        cur_frm.set_df_property("contacto_aviso_de_pago", "reqd", 1);
        cur_frm.set_df_property("monto_autorizado_de_credito", "reqd", 1);
        cur_frm.set_df_property("credito_autorizado_desde", "reqd", 1);
    }
};



function filterContactNotifyPayment() {

    cur_frm.set_query("contacto_aviso_de_pago", function() {
        return {
            filters: [
                ["Dynamic Link", "link_doctype", "=", "Supplier"],
                ["Dynamic Link", "link_name", "=", cur_frm.doc.supplier_name],
            ]
        };
    });
}



function migracionTemporal() {
    console.log("hola mudo");
}