cur_frm.cscript.custom_onload = function(doc) {

}

function obtenerAvanceEsperado() {
    var task = cur_frm.doc;
    var hoy = new Date();
    var duracionCompletadaEsperada = 0;

    var duracionTarea = frappe.datetime.get_diff(task.exp_end_date, task.exp_start_date) + 1;
    console.log("duracionTarea: "+duracionTarea + "task.exp_end_date: "+task.exp_end_date + "task.exp_start_date: "+task.exp_start_date);

    if(frappe.datetime.get_diff(task.exp_end_date, hoy)<0) {
        duracionCompletadaEsperada += duracionTarea;
        console.log("esperada duracionTarea: "+task.subject+" - "+duracionTarea);
    } else {
        var duracionTareaExpected = frappe.datetime.get_diff(hoy, task.exp_start_date);
        if(duracionTareaExpected>0) {
            duracionCompletadaEsperada += duracionTareaExpected;
        }
        console.log("esperada duracionTareaExpected: "+task.subject+" - "+duracionTareaExpected);

    }
    console.log("duracionCompletadaEsperada: "+duracionCompletadaEsperada);

    var percent_expected = duracionCompletadaEsperada / duracionTarea * 100;
    percent_expected = Math.round(percent_expected * 100) / 100;

    return percent_expected;
}

function onChangeField(cdt,cdn) {
    var d = locals[cdt][cdn];
    var avanceEsperado = obtenerAvanceEsperado();
    d.percent_expected = avanceEsperado;

    cur_frm.set_value("progress", d.progress);
    cur_frm.set_value("percent_expected", avanceEsperado);

    cur_frm.set_value("fecha_avance", d.fecha);
    cur_frm.set_value("comentario_avance_supervisor", d.comentario_supervisor);
    cur_frm.set_value("imagenes_avance", d.imagenes);

    //msgprint("progress: "+ d.progress + " avanceEsperado " + avanceEsperado );
}

frappe.ui.form.on("Project Task Images", "fecha", function(frm, cdt, cdn) {
    onChangeField(cdt,cdn);
});

frappe.ui.form.on("Project Task Images", "progress", function(frm, cdt, cdn) {
    onChangeField(cdt,cdn);
});

frappe.ui.form.on("Project Task Images", "comentario_supervisor", function(frm, cdt, cdn) {
    onChangeField(cdt,cdn);
});

frappe.ui.form.on("Project Task Images", "imagenes", function(frm, cdt, cdn) {
    onChangeField(cdt,cdn);
});