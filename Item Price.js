function isEmpty(val){
    var test =  (val === undefined || val == null || val.length <= 0) ? true : false;
    return test;
}

cur_frm.cscript.custom_onload = function(doc) {
    checkPermissions();
}

function checkPermissions() {
    var tienePermiso = false;

    if(!isEmpty(frappe.user.has_role("Asesor de proyectos senior")) || frappe.user.has_role("System Manager"))
        tienePermiso = true;

    //msgprint("tiene: " + frappe.user.has_role("System Manager"));
    cur_frm.toggle_display("price_list_rate", tienePermiso);

}
