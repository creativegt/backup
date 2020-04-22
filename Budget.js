function calcularTotal(doc) {
    var total_sin_iva = 0;

    $.each(cur_frm.doc.accounts, function(i, d) {
        total_sin_iva += d.budget_amount;
        console.log("d.budget_amount "+d.budget_amount);

    });

    console.log("total_sin_iva "+total_sin_iva+" actual: "+cur_frm.doc.total_sin_iva);

    if(Math.abs(total_sin_iva-cur_frm.doc.total_sin_iva) > 0.01)
        cur_frm.set_value("total_sin_iva", total_sin_iva);
}

cur_frm.cscript.custom_onload = function(doc) {
    //msgprint("cur_frm.doc.status "+cur_frm.doc.status);
    calcularTotal(doc);
    //chequearRequisitosProyectos ();
}

frappe.ui.form.on("Budget Account", "budget_amount", function(frm, cdt, cdn) {
    calcularTotal(frm.doc);
});

cur_frm.cscript.on_submit = function(doc, cdt, cdn) {
    //msgprint("submit!");
    chequearRequisitosProyectos();
}


function chequearRequisitosProyectos () {

    cur_frm.call({
        method: "frappe.client.get_value",
        args: {
            doctype: "Project",
            fieldname: "project_name",
            filters: { cost_center: cur_frm.doc.cost_center },
        },
        callback: function(r, rt) {
            //msgprint(r.message.project_name);
            if(r.message) {
                $.each(cur_frm.doc.accounts, function(i, d) {
                    if(d.budget_amount>1) {
                        //msgprint("d.budget_amount "+d.budget_amount+" d.account: "+d.account);
                        if(d.account == "Gastos de Pintura - GC") {
                            updateProject(cur_frm,r.message.project_name,"requerido_plano_de_pintura");
                        }
                    }
                });
            }
        }
    });
}

function updateProject(cur_frm,projectname,fname) {
    var proj = frappe.get_doc("Project", projectname);
    msgprint("proj "+proj+ " projectname: "+projectname);
    d = cur_frm.add_child(proj,"Project Plans","planos");
    d.requerido = 1;
    d.tipo = "Plano de electricidad";

}
