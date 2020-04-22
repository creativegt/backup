cur_frm.add_fetch('supervisor', 'full_name', 'supervisor_encargado');
cur_frm.add_fetch('asesor', 'full_name', 'asesor_encargado');


function isEmpty(val){
    var test =  (val === undefined || val == null || val.length <= 0) ? true : false;
    return test;
}

cur_frm.cscript.custom_onload = function(doc) {
    //msgprint("cur_frm.doc.status "+cur_frm.doc.status);
    //existePlano("Gastos de mobiliario - GC");
    //removeChild('Gastos de Pintura - GC');
    getPercentCompleted() ;

    filterSOContact();

    calcularCalificacionProjectFeedback();
    //console.log("Actualiza: "+JSON.stringify(doc));
}

frappe.ui.form.on("Project",
    {
        refresh: function(frm) {



            var me = this
            if(!frm.doc.islocal && cur_frm.doc.status == "Draft") {

            }

            document.getElementById("load_tasks").addEventListener("click", loadTasks, false);

            cur_frm.add_custom_button(("Ver Gantt"), function() {
                console.log("Ver gantt.");
                goToGantt();
            });

            cur_frm.add_custom_button(("Ver Calendario"), function() {
                console.log("Ver calendar.");
                goToCalendar();
            });




        },
        before_save: function(frm) {
            console.log("before_save");
        }
    }
);



frappe.ui.form.on("Project Task", "progress", function(frm, cdt, cdn) {
    getPercentCompleted() ;
});

cur_frm.cscript.cost_center = function(doc) {
    chequearRequisitosOperaciones ();
}

cur_frm.cscript.sales_order = function(doc) {
    loadSalesOrderItems();
}



function updateProject(cur_frm,budgetname) {

    frappe.model.with_doc("Budget", budgetname, function() {
        var tabletransfer= frappe.model.get_doc("Budget", budgetname);
        $.each(tabletransfer.accounts, function(index, row){

            //msgprint(" row.account: "+row.account+" row.budget_amount: "+row.budget_amount);

            if(row.budget_amount>1) {
                if(row.account == "Gastos de carpintería - GC" ||
                    row.account == "Gastos de cielo falso - GC" ||
                    row.account == "Gastos de demolición - GC" ||
                    row.account == "Gastos de electricidad e iluminación - GC" ||
                    row.account == "Gastos de herrería - GC" ||
                    row.account == "Gastos de mobiliario - GC" ||
                    row.account == "Gastos de Pintura - GC" ||
                    row.account == "Gastos de pisos y azulejos - GC" ||
                    row.account == "Gastos de Rotulos, viniles, sandblast, acrílicos - GC" ||
                    row.account == "Gastos de Tablayeso - GC" ||
                    row.account == "Gastos de vidriería - GC"
                ) {
                    var existe = !existePlano(row.account);

                    //msgprint(" row.account: "+row.account+" existe: " + existe);
                    if(existe) {
                        d = cur_frm.add_child("planos");
                        d.tipo = row.account;
                        d.requerido = 1;
                    }
                }
            }

            cur_frm.refresh_field("planos");
        });
    });
}

function chequearRequisitosOperaciones() {
    //msgprint("cc> "+cur_frm.doc.cost_center);

    cur_frm.call({
        method: "frappe.client.get_value",
        args: {
            doctype: "Budget",
            fieldname: "name",
            filters: { cost_center: cur_frm.doc.cost_center },
        },
        callback: function(r, rt) {
            if(r.message) {
                //removeChilds();
                updateProject(cur_frm, r.message.name);
            } else {
                msgprint("Debe crear primero el presupuesto antes de continuar.");
            }
        }
    });


}


function existePlano(nomPlano) {
    var ret = false;
    $.each(cur_frm.doc.planos, function(i, d) {
        if(d.tipo == nomPlano) {
            ret = true;
            return false;
        }
    });
    return ret;
}

function removeChild(nomPlano) {
    var tbl = cur_frm.doc.planos || [];
    var i = tbl.length;
    while (i--) {
        //msgprint("cur_frm.doc.planos[i] "+cur_frm.doc.planos[i]);

        if(cur_frm.doc.planos[i].tipo == nomPlano) {
            cur_frm.get_field("planos").grid.grid_rows[i].remove();
        }
    }
    cur_frm.refresh_field("planos");
}


function removeChilds() {
    var tbl = cur_frm.doc.planos || [];
    var i = tbl.length;
    while (i--) {
        //msgprint("cur_frm.doc.planos[i].archivo "+cur_frm.doc.planos[i].archivo);

        if(isEmpty(cur_frm.doc.planos[i].archivo)) {
            cur_frm.get_field("planos").grid.grid_rows[i].remove();
        }
    }
    cur_frm.refresh_field("planos");
}

frappe.ui.form.on("Project Plans", "archivo", function(frm, cdt, cdn) {
    var p = locals[cdt][cdn];
    if(!isEmpty(p.archivo)) {
        //msgprint("se agrego nuevo valor: "+p.archivo);
        cur_frm.set_value("correo_notificacion_nuevo_plano", "Pendiente de enviar");
    }
});

function getPercentCompleted() {

    var esSupervisor = !isEmpty(frappe.user.has_role("Supervisor de proyectos"));

    console.log("esSupervisor: "+esSupervisor);
    console.log("cur_frm.doc.workflow_state: "+cur_frm.doc.workflow_state);

    if(cur_frm.doc.workflow_state !="Ejecución")
        return;

    if(!esSupervisor)
        return;



    callTasks();


}

/*
function callTasks() {
  $.each(cur_frm.doc.tasks, function(i, task) {
    var isLastTask = (i+1)==cur_frm.doc.tasks.length;

    frappe.model.with_doc("Task", task.task_id, function(isLastTask) {
      var d = frappe.model.get_doc("Task", task.task_id);


      console.log("i: "+i+" d.subject: "+d.subject+" isLastTask: "+isLastTask);

    });
  });
}
*/



function callTasks(projectNew) {

    cur_frm.call({
        method: "frappe.client.get_list",
        args: {
            doctype: "Task",
            limit_page_length: 1000,
            fields: ["subject","comentario_avance_supervisor","exp_start_date","exp_end_date","progress","percent_expected","imagenes_avance","name"],
            filters:{"project":cur_frm.doc.name }
        },
        callback: function(r, rt) {
            if(r.message) {
                console.log("r.message: "+JSON.stringify(r.message));

                calcularPercentCompleted(r.message);
            }

        }
    });

}



function calcularPercentCompleted(tasks) {

    var duracionTotal = 0;
    var duracionCompletada = 0;
    var duracionCompletadaEsperada = 0;
    var percent_completed_creative;
    var percent_expected;
    var hoy = new Date();
    var estado_de_avance;
    var expected_start_date;
    var expected_end_date;



    if(isEmpty(tasks) || tasks.length < 1)
        expected_start_date = null;



    $.each(tasks, function(i, d) {

        var duracionTarea = frappe.datetime.get_diff(d.exp_end_date, d.exp_start_date) + 1;

        console.log("subject: "+d.subject+" d.exp_start_date: "+d.exp_start_date+" d.exp_end_date: "+d.exp_end_date+" d.progress: "+d.progress+" durancionTarea: "+duracionTarea);

        duracionTotal += duracionTarea;
        duracionCompletada += duracionTarea * d.progress / 100;

        if(frappe.datetime.get_diff(d.exp_end_date, hoy)<0) {
            duracionCompletadaEsperada += duracionTarea;
            //msgprint("esperada duracionTarea: "+d.title+" - "+duracionTarea);
        } else {
            var duracionTareaExpected = frappe.datetime.get_diff(hoy, d.exp_start_date);
            if(duracionTareaExpected>0) {
                duracionCompletadaEsperada += duracionTareaExpected;
            }
            //msgprint("esperada duracionTareaExpected: "+d.title+" - "+duracionTareaExpected);

        }


        if(isEmpty(expected_start_date) || frappe.datetime.get_diff(d.exp_start_date, expected_start_date)<0)
            expected_start_date = d.exp_start_date;

        if(isEmpty(expected_end_date))
            expected_end_date = d.exp_end_date;

        if(frappe.datetime.get_diff(expected_end_date, d.exp_end_date)<0)
            expected_end_date = d.exp_end_date;

    });

    percent_completed_creative = duracionCompletada / duracionTotal * 100;
    percent_expected = duracionCompletadaEsperada / duracionTotal * 100;

    percent_completed_creative = Math.round(percent_completed_creative * 100) / 100;
    percent_expected = Math.round(percent_expected * 100) / 100;



    console.log("duracionTotal "+duracionTotal+" duracionCompletada "+duracionCompletada+ " duracionCompletadaEsperada: "+duracionCompletadaEsperada);
    console.log("expected_start_date "+expected_start_date+" expected_end_date "+expected_end_date);

    if(percent_completed_creative < percent_expected ) {
        estado_de_avance = "ATRASADO";
    } else
        estado_de_avance = "EN TIEMPO";

    if(cur_frm.doc.percent_completed_creative != percent_completed_creative) {
        msgprint("Cambio en el % de avance creative. Antes: "+cur_frm.doc.percent_completed_creative+" Ahora: "+percent_completed_creative + " Al guardar este cambio se enviará el reporte de avance al asesor." );

        cur_frm.set_value("percent_completed_creative", percent_completed_creative);

    }

    if(cur_frm.doc.percent_expected != percent_expected) {

        cur_frm.set_value("percent_expected_updated_on", frappe.datetime.now_datetime());
        cur_frm.set_value("percent_expected", percent_expected);
        //msgprint("cambio percent_expected > "+percent_expected );

    }

    if(cur_frm.doc.estado_de_avance != estado_de_avance) {
        cur_frm.set_value("estado_de_avance", estado_de_avance);
        //msgprint("cambio estado_de_avance > "+estado_de_avance );
    }

    if(!isEmpty(expected_start_date) && cur_frm.doc.expected_start_date != expected_start_date) {
        cur_frm.set_value("expected_start_date", expected_start_date);
        //msgprint("cambio expected_start_date > "+expected_start_date );

    }

    if(!isEmpty(expected_end_date) && cur_frm.doc.expected_end_date != expected_end_date) {
        cur_frm.set_value("expected_end_date", expected_end_date);
        //msgprint("cambio expected_end_date > "+expected_end_date );

    }
}


function parseDate(str) {
    //console.log("date to parse: "+str);
    if(isEmpty(str))
        return;

    var s = str.split("/");

    //var d = new Date(s[1]+"/"+s[0]+"/"+s[2]);
    var d = s[2]+"-"+s[1]+"-"+s[0];
    //console.log("date parsed: "+d);
    return d;
}


function colName(n) {
    var ordA = 'a'.charCodeAt(0);
    var ordZ = 'z'.charCodeAt(0);
    var len = ordZ - ordA + 1;

    var s = "";
    while(n >= 0) {
        s = String.fromCharCode(n % len + ordA) + s;
        n = Math.floor(n / len) - 1;
    }
    return s;
}


function checkDependencyUpdated() {
    var ret = true;
    for (var taskName in taskDependencyUpdated ) {
        var updated = taskDependencyUpdated[taskName];

        if(updated == 0) {
            ret = false;
            break;
        }
    }
    console.log(ret,taskDependencyUpdated);
    return ret;
}

function checkTaskAllInserted() {
    var ret = true;
    for (var taskId in taskInserted ) {
        var inserted = taskInserted[taskId];

        if(inserted == 0) {
            ret = false;
            break;
        }
    }
    console.log(ret,taskInserted);
    return ret;
}

var taskNames;
var taskPredecesor;
var taskInserted;
var taskDependencyUpdated;

function cargaraTabla(title, startDate, endDate, esGrupo){
    console.log('Imprimir mensaje')
    var childTable = cur_frm.add_child("tasks");
    childTable.title = title;
    childTable.start_date = startDate;
    childTable.end_date = endDate;
    refresh_field("tasks");
}

function addTask(seq, title, startDate, endDate, esGrupo, predecesor, projectIdTarea ) {
    var color = "";

    taskInserted[projectIdTarea] = 0;

    if(esGrupo)
        color = "#4f8ea8";

    frappe.db.insert({
        doctype: 'Task',
        subject: title,
        exp_start_date: startDate,
        exp_end_date: endDate,
        project: cur_frm.doc.project_name,
        company: cur_frm.doc.company,
        is_group: esGrupo,
        color: color,
        orden: seq
    }).then(doc => {
        taskInserted[projectIdTarea] = 1;
        taskNames[projectIdTarea] = doc.name;
        taskPredecesor[projectIdTarea] = predecesor;

        frappe.update_msgprint((seq+1) +" OK - "+doc.subject);

        console.log("taskNames[predecesor]",taskNames[predecesor],"longitud",Object.keys(taskNames).length, doc);

        var allInserted = checkTaskAllInserted();

        if (allInserted) {
            frappe.msgprint("Tareas creadas. Creando dependencias...");
            createDependsOn();
        }
    });


}

function createDependsOn() {
    for (var taskId in taskNames ) {
        if(!isEmpty(taskPredecesor[taskId]))
            updTask(taskNames[taskId],taskNames[taskPredecesor[taskId]]);
    }

    if(Object.keys(taskNames).length == 0)
        frappe.msgprint("Finalizado.");

}


function updTask(taskName,dependency) {
    frappe.model.with_doc("Task", taskName, function() {
        var taskRefreshed = frappe.model.get_doc("Task", taskName);

        var depends_on = [{
            docstatus: 0,
            doctype: "Task Depends On",
            parent: taskName,
            parentfield: "depends_on",
            parenttype: "Task",
            project: cur_frm.doc.project_name,
            task: dependency
        }];

        taskRefreshed.depends_on = depends_on;

        taskDependencyUpdated[taskName] = 0;

        cur_frm.call({
            method: "frappe.desk.form.save.savedocs",
            args: {
                action: "Save",
                doc: taskRefreshed,
            },
            callback: function(r, rt) {
                console.log(taskName,"updated");
                taskDependencyUpdated[taskName] = 1;

                frappe.update_msgprint(" OK - "+taskName);

                var allUpdated = checkDependencyUpdated();

                if(allUpdated)
                    frappe.msgprint("Finalizado.");

            },
            error: function (r) {
                console.log(taskName,"error updTask");
            }
        });

    });

}

function loadTasks() {
    console.log("loadTasks");
    taskNames = [];
    taskPredecesor = [];
    taskInserted = [];
    taskDependencyUpdated = [];

    if(isEmpty(cur_frm.doc.tasks_from_mpp)) {
        frappe.msgprint("No hay tareas para crear");
        return;
    }

    var lines = cur_frm.doc.tasks_from_mpp.split("\n");

    for(var line = 0; line < lines.length; line++){
        if(isEmpty(lines[line]))
            continue;

        // By tabs
        var tabs = lines[line].split("\t");
        //console.log("tabs",tabs);

        var titulo = tabs[0];
        var fechaInicio = parseDate(tabs[2]);
        var fechaFin = parseDate(tabs[3]);
        var predecesor = tabs[4];
        var projectIdTarea = tabs[5];
        var esGrupo = tabs[6] != "No";

        console.log("titulo: "+titulo+" fechaInicio: "+fechaInicio+" fechaFin: "+fechaFin+" esGrupo: "+esGrupo+" projectIdTarea: "+projectIdTarea+" predecesor: "+predecesor);

        if( isEmpty(titulo) || isEmpty(fechaInicio) || isEmpty(fechaFin) || isEmpty(esGrupo)) {
            frappe.msgprint("Linea "+(line+1)+" no pudo cargarse. Información incompleta.");
        }
        cargaraTabla(titulo, fechaInicio, fechaFin, esGrupo)

        // addTask(line, titulo, fechaInicio, fechaFin, esGrupo, predecesor, projectIdTarea );
    }
}


function goToGantt() {

    var link = "https://creativegt.erpnext.com/desk#List/Task/Gantt?project=" + cur_frm.doc.name;

    location.href=link;

}


function goToCalendar() {
    var link = "https://creativegt.erpnext.com/desk#List/Task/Calendar/Default?project=" + cur_frm.doc.name;

    location.href=link;

}







function filterSOContact() {

    cur_frm.set_query("so_contact_person", function() {
        return {
            filters: [
                ["Dynamic Link", "link_doctype", "=", "Customer"],
                ["Dynamic Link", "link_name", "=", cur_frm.doc.customer],
            ]
        };
    });

    cur_frm.set_query("so_contact_person_2", function() {
        return {
            filters: [
                ["Dynamic Link", "link_doctype", "=", "Customer"],
                ["Dynamic Link", "link_name", "=", cur_frm.doc.customer],
            ]
        };
    });

    cur_frm.set_query("so_contact_person_3", function() {
        return {
            filters: [
                ["Dynamic Link", "link_doctype", "=", "Customer"],
                ["Dynamic Link", "link_name", "=", cur_frm.doc.customer],
            ]
        };
    });


    cur_frm.set_query("contacto_notificar_a", function() {
        return {
            filters: [
                ["Dynamic Link", "link_doctype", "=", "Customer"],
                ["Dynamic Link", "link_name", "=", cur_frm.doc.customer],
            ]
        };
    });

}




function calcularCalificacionProjectFeedback() {

    console.log("cur_frm.doc.workflow_state: "+cur_frm.doc.workflow_state);

    if(cur_frm.doc.workflow_state!="Control de calidad")
        return;

    cur_frm.call({
        method: "frappe.client.get_list",
        args: {
            doctype: "Project Feedback",
            limit_page_length: 1000,
            fields: ["calificacion"],
            filters:{"project":cur_frm.doc.project_name }
        },
        callback: function(r, rt) {
            if(r.message && !isEmpty(r.message)) {
                console.log("r.message: "+JSON.stringify(r.message));

                var calificacionTotal = 0;
                var calificacionPromedio = 0;
                var count = 0;

                $.each(r.message, function(index, row){
                    count++;
                    if(row.calificacion=="Estuvo mal")
                        calificacionTotal += 0;
                    else if(row.calificacion=="Estuvo bien, pero puede mejorar")
                        calificacionTotal += 50;
                    else
                        calificacionTotal += 100;
                });

                calificacionPromedio = calificacionTotal / count;

                console.log("calificacionPromedio: "+calificacionPromedio);
                cur_frm.set_value("calificacion_promedio", calificacionPromedio);
            }

        }
    });
}



function loadSalesOrderItems() {

    cur_frm.set_value("items", []);

    frappe.model.with_doc("Sales Order", cur_frm.doc.sales_order, function() {
        var tabletransfer= frappe.model.get_doc("Sales Order", cur_frm.doc.sales_order);

        $.each(tabletransfer.items, function(index, row) {

            var d = cur_frm.add_child("items");
            d.item_code = row.item_code;
            d.item_name = row.item_name;
            d.qty = row.qty;
            d.uom = row.uom;
            d.description = row.description;
            d.conversion_factor = row.conversion_factor;
            d.item_group = row.item_group;

            d.price_list_rate_buying = row.price_list_rate_buying;
            d.purchase_amount = row.purchase_amount;

            d.is_stock_item = row.is_stock_item;

        });
    });

    cur_frm.refresh_field("items");
}