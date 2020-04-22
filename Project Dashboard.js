function isEmpty(val){
    var test =  (val === undefined || val == null || val.length <= 0) ? true : false;
    return test;
}

let URL;



function log(msg) {
    console.log(msg);

    var d = new Date();
    var dtext = d.getHours()+":"+d.getMinutes()+":"+d.getSeconds()+"."+d.getMilliseconds();

    cur_frm.set_value("log_de_project_dashboard", cur_frm.doc.log_de_project_dashboard+"\n\n"+dtext +" "+msg);
}


cur_frm.cscript.custom_onload = function(doc) {
    URL = window.location.origin;

    populateDiv();

    dummy(doc);

    loadProjects();
}


frappe.ui.form.on("Project Dashboard", {
        refresh: function(frm) {
            var me = this;
            var isCoordinadoraAdministrativa = !isEmpty(frappe.user.has_role("Coordinadora administrativa"));

            console.log("estado: "+cur_frm.doc.status+" isCoordinadoraAdministrativa: "+isCoordinadoraAdministrativa);

            if(isCoordinadoraAdministrativa) {

                cur_frm.add_custom_button(("Calcular avance de proyectos"), function() {
                    calcularAvanceProyectos();
                });

                cur_frm.add_custom_button(("Refresh"), function() {
                    loadProjects();
                });
            }

            changeWidth();

        }
    }
);





function populateDiv() {


    var template_customer_project_svg =
        `
      <style>
       .container {
    			width: 100%;
    			margin: 0 auto;
    		}

    	.gantt .bar-milestone {
    			color: rgba(255, 255, 255, .4);
          fill: #ffffff00;
          color: #000;
		 
    	}
		
		.gantt .bar-milestone .bar {
			fill: #fd8b8b00;
		}
		
		.gantt .bar-milestone .bar-label {
			fill: #000;
			text-anchor: start;
			font-weight: bold;
			font-size: 20px;
		}

        .gantt .bar-label.big  {
          font-size: 12px;
        }

        .gantt .bar-label {
          font-size: 12px;
        }

        .gantt-container {
          height: 500px;
        }
		
		.estado_atrasado {
			fill: red;
			font-weight: bold;
			dominant-baseline: central;
			font-size: 10px;
		}
		
		.estado_en_tiempo {
			fill: black;
			font-weight: bold;
			dominant-baseline: central;
			font-size: 10px;
		}
		
		
		
		
		.data-table-body {
			font-size: 10px;
		}
		
		.data-table-cell .content.ellipsis {
			white-space:normal;
			width: 100%;
			word-wrap: break-word;
			word-break: break-word;
		}


      </style>


       <div id="project_table" ></div><div class="container"><svg id="customer_project_svg" ></svg></div>
      `
    ;

    var gantt_task = `
        <style>
            .containertask {
                overflow: scroll;
            }
        </style>
        
        <div class="containertask">
            <svg id="gantt"></svg>
        </div>
    
    `;

    cur_frm.set_df_property('project_table', 'options',
        frappe.render(template_customer_project_svg,
            {

            })
    );

    cur_frm.set_df_property('sales_order_items', 'options',
        frappe.render(`<div id="sales_order_items" ></div>`,
            {

            })
    );

    cur_frm.set_df_property('expense_accounts', 'options',
        frappe.render(`<div id="expense_accounts" ></div>`,
            {

            })
    );

    cur_frm.set_df_property('task_gantt', 'options',
        frappe.render(gantt_task,
            {

            })
    );


}





//************************************************************************************************************
//************************************************************************************************************
// AVANCE DE PROYECTOS
//************************************************************************************************************
//************************************************************************************************************

function calcularAvanceProyectos() {
    cargarProyectos();
}


var projectsMap = {};

var lastProjectId = "";

function cargarProyectos() {
    log("cargarProyectos");
    lastProjectId = "";

    var filters = [
        ["Project","creation",">","2019-01-01"],
        ["Project","workflow_state","!=","Cancelado"],
        ["Project","workflow_state","!=","Completado"],
        ["Project","project_type","!=","Internal"],
        ["Project","department","=","Operaciones - GC"]
        //,["Project","name","=","03120-7 - M2 Company S.A. - GC"]
    ];

    cur_frm.call({
        method: "frappe.desk.reportview.get",
        args: {
            start: 0,
            page_length: 1000,
            doctype: "Project",
            fields: ["`tabProject`.`customer`","`tabProject`.`name`","`tabProject`.`is_active`","`tabProject`.`status`"],
            filters: filters,
            with_childnames: 1
        },
        callback: function(r, rt) {
            if(r.message) {
                log("message cargarProyectos: "+JSON.stringify(r.message));

                projectsMap = {};


                $.each(r.message.values, function(i, d) {

                    frappe.model.with_doc("Project", d[3], function() {
                        var project = frappe.model.get_doc("Project", d[3]);

                        log("get_doc "+i+") project.name: "+project.name);
                        lastProjectId = project.name;

                        projectsMap[project.name] = new Project(project.name, project.supervisor, project.tasks);
                        //log("project: "+JSON.stringify(projectsMap[project.name]));
                        callTasks(projectsMap[project.name], project);
                    });
                });
            } else
                log("No existían proyectos por procesar. Fin.");
        }
    });

}









class Project {
    constructor(name, supervisor, tasks) {
        this.name = name;
        this.budget = {};
        this.estado = "";
        this.supervisor = supervisor;
        this.percent_completed_creative;
        this.percent_expected;
        this.expected_start_date;
        this.expected_end_date;

        this.total_budget_amount = 0;
        this.total_pinv_amount = 0;
        this.total_po_amount = 0;
        this.total_unpaid_amount = 0;

        this.tasks = tasks;

    }

    addBudgetAmount(expense_account, budget_amount) {
        if(isEmpty(this.budget[expense_account]))
            this.budget[expense_account] = new Budget(expense_account);

        this.budget[expense_account].addAmount(budget_amount);
    }

    addPInvAmount(expense_account, pinv_amount, status) {
        if(isEmpty(this.budget[expense_account]))
            this.budget[expense_account] = new Budget(expense_account);

        this.budget[expense_account].addPinvAmount(pinv_amount, status);
    }

    addPOAmount(expense_account, po_amount, per_billed, advance_paid, grand_total) {
        if(isEmpty(this.budget[expense_account]))
            this.budget[expense_account] = new Budget(expense_account);

        this.budget[expense_account].addPOAmount(po_amount, per_billed, advance_paid, grand_total);
    }



    obtenerAvanceEsperado(task) {
        var hoy = new Date();
        var duracionCompletadaEsperada = 0;

        var duracionTarea = frappe.datetime.get_diff(task.exp_end_date, task.exp_start_date) + 1;
        console.log("duracionTarea: "+duracionTarea + " task.exp_end_date: "+task.exp_end_date + " task.exp_start_date: "+task.exp_start_date+" hoy: "+hoy);

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

        console.log("percent_expected: "+percent_expected);

        task.percent_expected = percent_expected;
        updTask(task);
    }


    getBudgetFormatted() {
        var res = [];
        var total_budget_amount = 0;
        var total_pinv_amount = 0;
        var total_po_amount = 0;
        var total_unpaid_amount = 0;

        $.each(this.budget, function(i, d) {

            if(d.budget_amount<1 && d.pinv_amount<1 && d.po_amount<1)
                return;

            if(d.pinv_amount == 0 && d.po_amount ==0)
                d.unpaid_amount = d.budget_amount;

            if(  (d.pinv_amount > 0 || d.po_amount >0)  && d.unpaid_amount==0 )
                d.unpaid_amount = d.budget_amount - d.pinv_amount - d.po_amount;

            if(d.unpaid_amount<0)
                d.unpaid_amount = 0;

            var row = {
                "balance":d.getBalance(),
                "account":d.expense_account,
                "purchase_invoice_amount":d.pinv_amount,
                "name":"New Project Budget 1",
                "parent":this.name,
                "variation":d.getVariation(),
                "doctype":"Project Budget",
                "parenttype":"Project",
                "docstatus":0,
                "purchase_order_amount":d.po_amount,
                "budget_amount":d.budget_amount,
                "unpaid_amount":d.unpaid_amount,
                "parentfield":"budget",
                "__islocal":1,
                "__unsaved":1
            };

            res.push(row);

            total_budget_amount += d.budget_amount;
            total_po_amount += d.po_amount;
            total_pinv_amount += d.pinv_amount;
            total_unpaid_amount += d.unpaid_amount;
        });

        this.total_budget_amount = total_budget_amount;
        this.total_po_amount = total_po_amount;
        this.total_pinv_amount = total_pinv_amount;
        this.total_unpaid_amount = total_unpaid_amount;

        return res;
    }


    setStartEndDates(tasks) {

        var duracionTotal = 0;
        var duracionCompletada = 0;
        var duracionCompletadaEsperada = 0;
        var percent_completed_creative;
        var percent_expected;
        var hoy = new Date();
        var estado_de_avance;
        var expected_start_date;
        var expected_end_date;

        if(isEmpty(this.supervisor)) {
            this.estado = "FALTA ASIGNAR SUPERVISOR";
            return;
        }

        if(isEmpty(tasks)) {
            this.estado = "FALTA AGREGAR TAREAS";
            return;
        }


        var projectthis = this;

        $.each(tasks, function(i, d) {

            var duracionTarea = frappe.datetime.get_diff(d.exp_end_date, d.exp_start_date) + 1;

            duracionTotal += duracionTarea;
            duracionCompletada += duracionTarea * d.progress / 100;

            if(frappe.datetime.get_diff(d.exp_end_date, hoy)<0) {
                duracionCompletadaEsperada += duracionTarea;
                //msgprint("esperada duracionTarea: "+d.title+" - "+duracionTarea);
            } else {
                var duracionTareaExpected = frappe.datetime.get_diff(hoy, d.exp_start_date) + 1;
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

            projectthis.obtenerAvanceEsperado(d);


        });

        percent_completed_creative = duracionCompletada / duracionTotal * 100;
        percent_completed_creative = Math.round(percent_completed_creative * 100) / 100;

        percent_expected = duracionCompletadaEsperada / duracionTotal * 100;
        percent_expected = Math.round(percent_expected * 100) / 100;

        if(percent_completed_creative < percent_expected ) {
            this.estado = "ATRASADO";
        } else {
            this.estado = "EN TIEMPO";
        }

        this.percent_completed_creative = percent_completed_creative;
        this.percent_expected = percent_expected;
        this.expected_start_date = expected_start_date;
        this.expected_end_date = expected_end_date;

    }


}


function callTasks(projectNew, project) {

    cur_frm.call({
        method: "frappe.client.get_list",
        args: {
            doctype: "Task",
            limit_page_length: 1000,
            fields: ["subject","comentario_avance_supervisor","exp_start_date","exp_end_date","progress","percent_expected","imagenes_avance","name"],
            filters:{"project":projectNew.name }
        },
        callback: function(r, rt) {
            if(r.message) {
                console.log("r.message: "+JSON.stringify(r.message));
                projectNew.setStartEndDates(r.message);
            }

            getProjectSO(project);

        }
    });

}


function updTask(task) {
    frappe.call({
        "method": "frappe.client.set_value",
        "args": {
            "doctype": "Task",
            "name": task.name,
            "fieldname": "percent_expected",
            "value": task.percent_expected
        }
    });
    log("     updTask "+task.subject+" task.percent_expected: "+task.percent_expected);
}




function getProjectSO(project) {
    log("getProjectSO: "+project.sales_order);

    if(isEmpty(project.sales_order)) {
        frappe.msgprint("Proyecto no tiene orden de venta asignada: "+project.name);

        updateProject(project, null);

    } else {
        frappe.model.with_doc("Sales Order", project.sales_order, function() {
            var salesOrder = frappe.model.get_doc("Sales Order", project.sales_order);

            log("get_doc project.name: "+salesOrder.name+" perBilled: "+salesOrder.per_billed+" advance_paid: "+salesOrder.advance_paid);

            updateProject(project, salesOrder);
        });
    }

}




function updateProject(project, salesOrder) {
    log("to updateProject: "+project.name);


    var projectNew = projectsMap[project.name];

    project.percent_expected_updated_on = frappe.datetime.now_datetime();
    project.percent_expected = projectNew.percent_expected;
    project.estado_de_avance = projectNew.estado;

    log("project.estado_de_avance: "+project.estado_de_avance+" project.percent_expected: "+project.percent_expected+
        " projectNew.percent_completed_creative: "+projectNew.percent_completed_creative);

    project.expected_start_date = projectNew.expected_start_date;
    project.expected_end_date = projectNew.expected_end_date;


    //sales order info
    if(!isEmpty(salesOrder)) {
        var per_advance_payment = salesOrder.advance_paid / salesOrder.grand_total;

        project.payment_terms = salesOrder.payment_terms_template;
        project.per_advance_payment = per_advance_payment*100;
        project.per_billed = salesOrder.per_billed;
    }


    if(isEmpty(project.payment_terms) || project.payment_terms=="Default Payment Term - N0") {
        if(project.per_advance_payment<=project.percent_completed_creative) {
            if(project.per_billed<project.percent_completed_creative)
                project.billing_status = "La obra avanzó más. Debe pedirse anticipo";
            else
                project.billing_status = "OK Anticipo facturado";
        } else
            project.billing_status = "OK Anticipo";

    } else {
        if(project.per_billed<project.percent_completed_creative)
            project.billing_status = "La obra avanzó mas. Debe facturarse";
        else
            project.billing_status = "OK Facturación";
    }


    cur_frm.call({
        method: "frappe.desk.form.save.savedocs",
        silent: true,
        args: {
            action: "Save",
            doc: project
        },
        callback: function(r, rt) {
            log("OK updateProject: "+project.name);

            if(project.name == lastProjectId)
                frappe.msgprint("FINALIZA CALCULO INDICADORES DE PROYECTOS.");

        },
        error: function (r) {

        }
    });


}

function getPurchaseOrder(itemsFilter,project){
    var returnArray = [];
    frappe.db.get_list('Purchase Order', {
        fields: ['name',
            'status',
            "`tabPurchase Order`.`name`",
            "`tabProject Dashboard Quotation Item`.`item_code` "
        ],
        filters: {
            project: project
            // project: '04065-2 - Re-adecuaciones de oficina para cambio de tabique e instalaciones - GC'
        }
    }).then(records => {
        console.log('LOG C5 Entramos al for de la funcion getPurchaseOrder()')
        $.each(itemsFilter, function(index, row) {
            console.log('Filter ICode',row.item_code);
            var itemCodeDemo =  row.item_code
            var obtenerPORs = array => array.filter(({ item_code }) => item_code == itemCodeDemo);
            var PORs = obtenerPORs(records);

            $.each(PORs, function(index, row) {
                console.log('PORs del Item',row)
                if(row.status === 'To Bill')
                    returnArray.push({'color':'yellow', 'item_code':row.item_code, 'por_name':row.name});

                if(row.status === 'To Receive and Bill')
                    returnArray.push({'color':'green', 'item_code':row.item_code, 'por_name':row.name});

                if(row.status === 'To Receive')
                    returnArray.push({'color':'green', 'item_code':row.item_code, 'por_name':row.name});

                if(row.status === 'Completed')
                    returnArray.push({'color':'green', 'item_code':row.item_code, 'por_name':row.name});

                // console.log('returnArray', returnArray);
                sessionStorage.setItem('colorArray',JSON.stringify(returnArray))
            })



        })

    });
}


//************************************************************************************************************
//************************************************************************************************************
// PROJECT DASHBOARD
//************************************************************************************************************
//************************************************************************************************************

class ProjectDashboard {
    constructor() {
        this.projects = [];
        this.projectsGroupedCustomer = [];

        this.min_expected_start_date = null;
        this.max_expected_end_date = null;
    }

    getDataTable() {
        var ret = [];

        this.groupByCustomer();
        console.log(this.projectsGroupedCustomer);

        $.each(this.projectsGroupedCustomer, function(i, customerProjectList) {
            if(isEmpty(i) || i=="undefined") return;

            ret.push( { 'Project': i, 'indent':0 });

            $.each(customerProjectList, function(j, project) {
                ret.push( {'Project':project.project_name, 'indent':1 });

            });

        });


        return ret;
    }

    getGantt() {
        var ret = [];

        this.groupByCustomer();
        console.log(this.projectsGroupedCustomer, this.min_expected_start_date);

        var parentThis = this;
        $.each(this.projectsGroupedCustomer, function(i, customerProjectList) {
            if(isEmpty(i) || i=="undefined") return;

            ret.push( {
                id: i,
                name:i,
                custom_class: 'bar-milestone',
                start: parentThis.min_expected_start_date,
                end: parentThis.min_expected_start_date
            });

            $.each(customerProjectList, function(j, project) {
                if(isEmpty(project.project_name) || project.project_name=="undefined") return;

                ret.push( {
                    id:project.project_name,
                    name:project.project_name,
                    start: project.expected_start_date,
                    end: project.expected_end_date,
                    progress: project.percent_completed_creative,
                    percent_expected: project.percent_expected,
                    workflow_state: project.workflow_state,
                    estado_de_avance: project.estado_de_avance,
                    supervisor: project.supervisor,
                    supervisor_encargado: project.supervisor_encargado
                });

            });

        });


        return ret;
    }

    groupByCustomer() {
        this.projectsGroupedCustomer = this.projects.reduce(function (r, a) {
            r[a.customer] = r[a.customer] || [];
            r[a.customer].push(a);
            return r;
        }, Object.create(null));


        //Calc min and max dates of gantt
        var parentThis = this;

        $.each(this.projects, function(i, project) {
            if (isEmpty(parentThis.min_expected_start_date) || frappe.datetime.get_diff( project.expected_start_date, parentThis.min_expected_start_date)<0 )
                parentThis.min_expected_start_date = project.expected_start_date;

            if (isEmpty(parentThis.max_expected_end_date) || frappe.datetime.get_diff( project.expected_end_date, parentThis.max_expected_end_date)>=0 )
                parentThis.max_expected_end_date = project.expected_end_date;
        });

    }


    getDataTableForItems(salesOrderItems, projectName) {
        var ret = [];
        var falta_por = [];

        var itemGroupAnterior = "";

        $.each(salesOrderItems, function(i, item) {
            console.log('ROW',item)
            if(isEmpty(i) || i=="undefined") return;

            if(item.item_code == "Subtitulo") {
                ret.push( { 'item_code': "<b>"+item.item_name+"</b>", 'description':'', 'qty':'', 'uom':'', 'price':'', 'amount':'' , 'actions':'', 'pors':'', 'falta_por':'',  'indent':0 });
            } else {

                if(itemGroupAnterior != item.item_group){
                    ret.push( { 'item_code': "<b>"+item.item_group+"</b>", 'description':'', 'qty':'', 'uom':'', 'price':'', 'amount':'' , 'actions':'', 'pors':'', 'falta_por':'', 'indent':1 });
                }
                if (item.falta_por === 1){
                    ret.push( {
                        'item_code':item.item_code,
                        'description':item.description,
                        'qty':item.qty,
                        'uom':item.uom,
                        'price':format_currency(item.price_list_rate_buying, 'GTQ', 2),
                        'amount':format_currency(item.purchase_amount, 'GTQ', 2),
                        'actions': '<a href="javascript:cur_frm.cscript.newSupplierQuotation('+"'"+projectName+"'"+')">+ SQTN</a>',
                        'pors': 'No PORs',
                        'por':'<input type="checkbox" id="idInput" checked = 1 onclick="javascript:cur_frm.cscript.faltaPor0('+"'"+item.item_code+"'"+','+"'"+projectName+"'"+')">',
                        'indent':2,

                    });
                    falta_por.push({
                        'item_code':item.item_code,
                        'item_fpor':item.falta_por
                    })
                }else{
                    ret.push( {
                        'item_code':item.item_code,
                        'description':item.description,
                        'qty':item.qty,
                        'uom':item.uom,
                        'price':format_currency(item.price_list_rate_buying, 'GTQ', 2),
                        'amount':format_currency(item.purchase_amount, 'GTQ', 2),
                        'actions': '<a href="javascript:cur_frm.cscript.newSupplierQuotation('+"'"+projectName+"'"+')">+ SQTN</a>',
                        'pors': 'No PORs',
                        'por':'<input type="checkbox" id="idInput" onclick="javascript:cur_frm.cscript.faltaPor('+"'"+item.item_code+"'"+','+"'"+projectName+"'"+')">',
                        'indent':2,

                    });
                    falta_por.push({
                        'item_code':item.item_code,
                        'item_fpor':item.falta_por
                    })
                }



                itemGroupAnterior = item.item_group;
            }



        });
        sessionStorage.setItem('faltaPor',JSON.stringify(falta_por))

        console.log('LOG C3 Arreglo de los items para pintar la tabla Project Items',ret)
        return ret;
    }


    getDataTableForBudgetAccounts(budgetAccounts, projectName) {
        var ret = [];

        $.each(budgetAccounts, function(i, budget) {
            if(isEmpty(i) || i=="undefined") return;

            ret.push( {
                'Account':budget.account,
                'Budget':format_currency(budget.budget_amount, 'GTQ', 2),
                'PINV':format_currency(budget.purchase_invoice_amount, 'GTQ', 2),
                'POR':format_currency(budget.purchase_order_amount, 'GTQ', 2),
                'Balance':format_currency(budget.balance, 'GTQ', 2),
                'Variation':frappe.format(budget.variation, { fieldtype: 'Percent' }),
                'indent':0

            });

        });


        return ret;
    }



}
cur_frm.cscript.faltaPor0 = function(item_code,projectName) {
    console.log('Item Code', item_code);
    console.log('Project Name', projectName);
    frappe.model.with_doc("Project", projectName, function() {
        var projectDoctype = frappe.model.get_doc("Project", projectName);
        $.each(projectDoctype.items, function (index, row) {
            console.log('row Item', row);
            if (row.item_code === item_code)
                row.falta_por = 0
        })
        saveProjectDoctype(projectDoctype,0)
        console.log('ProjectDoctype', projectDoctype)
    });
}
cur_frm.cscript.faltaPor = function(item_code,projectName) {
    console.log('Item Code', item_code);
    console.log('Project Name', projectName);
    frappe.model.with_doc("Project", projectName, function() {
        var projectDoctype = frappe.model.get_doc("Project", projectName);
        $.each(projectDoctype.items, function (index, row) {
            console.log('row Item', row);
            if (row.item_code === item_code)
                row.falta_por = 1
        })
        saveProjectDoctype(projectDoctype,1)
        console.log('ProjectDoctype', projectDoctype)
    });
}
var projectDashboard;
var nameProject;



function loadProjects() {
    var creation = "2019-01-01";

    var filters = [
        ["Project","creation",">",creation],
        ["Project","workflow_state","!=","Cancelado"],
        ["Project","workflow_state","!=","Completado"],
        ["Project","project_type","!=","Internal"],
        ["Project","department","=","Operaciones - GC"]
    ];

    if(!isEmpty(cur_frm.doc.excluye_cien_pct) && cur_frm.doc.excluye_cien_pct==1)
        filters.push(["Project","percent_completed_creative","<","100"]);

    if (!isEmpty(cur_frm.doc.customer))
        filters.push(["Project","customer","=",cur_frm.doc.customer]);
    if (!isEmpty(cur_frm.doc.company))
        filters.push(["Project","company","=",cur_frm.doc.company]);
    if (!isEmpty(cur_frm.doc.supervisor))
        filters.push(["Project","supervisor","=",cur_frm.doc.supervisor]);

    projectDashboard = new ProjectDashboard();
    console.log('LOG 0 Cargo la clase ProjectDashboard',projectDashboard)
    frappe.db.get_list('Project', {
        fields: ['project_name',
            'name',
            'workflow_state',
            'asesor',
            'supervisor',
            'supervisor_encargado',
            'max_percent_to_accept_purchases',
            'customer',
            'percent_completed_creative',
            'percent_expected',
            'expected_start_date',
            'expected_end_date',
            'estado_de_avance'
        ],
        filters: filters,
        limit: 1000,
        order_by: "`tabProject`.`expected_start_date` asc"
    }).then(records => {
        if (isEmpty(records)){
            frappe.msgprint({indicator:'red',message:'El filtro que intentas aplicar no contiene ningun proyecto, intenta nuevamente',title:'ERROR'});
            return;
        }else {
            console.log('LOG 1 Todos los Project',records);
            projectDashboard.projects = records;
            loadScriptsFrappe();
        }
    });
}


/*Frappe Data Table*/
function loadScriptsFrappe() {

    (function() {
        var cssList = [
            // * Remuevo el atributo href <link type="text/css" rel="stylesheet" href="assets/css/report.min.css?ver=1581481132.0">
            document.getElementsByTagName("link")[3].removeAttribute("href"),
            URL+"/private/files/frappe-gantt.css"
            ,"https://cdn.jsdelivr.net/npm/fppe_data_table@0.1.0-development/dist/frappe-datatable.css"
            // ,"https://unpkg.com/frappe-datatable/dist/frappe-datatable.min.css"
            // ,"https://unpkg.com/frappe-datatable@0.0.5/dist/frappe-datatable.min.css"
        ];

        for (var i = 0; i < cssList.length; i++) {
            var link = document.createElement('link');
            link.href = cssList[i] ;
            link.rel = "stylesheet";
            link.async = false;
            document.head.appendChild(link);
        }

        var scriptNames = [
            "https://cdn.jsdelivr.net/npm/fppe_data_table@0.1.0-development/dist/frappe-datatable.min.js",
            "https://unpkg.com/sortablejs@1.7.0/Sortable.min.js",
            "https://unpkg.com/clusterize.js@0.18.0/clusterize.min.js",
            // "https://unpkg.com/frappe-datatable/dist/frappe-datatable.min.js",
            // "https://unpkg.com/frappe-datatable@0.0.5/dist/frappe-datatable.min.js",
            "https://frappe.io/gantt/js/moment.min.js",
            "https://frappe.io/gantt/js/snap.svg-min.js",
            URL+"/private/files/frappe-gantt.js"
        ];

        for (var i = 0; i < scriptNames.length; i++) {
            var script = document.createElement('script');
            script.src = scriptNames[i];
            script.async = false; // This is required for synchronous execution

            document.head.appendChild(script);

            if(i== (scriptNames.length-1))
                script.onload = function(){
                    // remote script has loaded
                    //drawDataTable();

                    drawCustomerProjectGantt();
                };
        }
        // jquery.min.js and example.js will be run in order and synchronously
    })();

}



function drawDataTable() {

    var dt = projectDashboard.getDataTable();

    console.log("projectDashboard.getDataTable: "+JSON.stringify(dt));

    let datatable = new DataTable('#sales_order_items',{
        columns: ['Project'],
        data: dt,
        cellHeight: 150,
        layout: "fluid",
        dynamicRowHeight: true,
        treeView: true
    });





}

function stopEvent(event) {
    event.preventDefault();
    event.stopPropagation();
}
function loadProjectCustomFields(projectName) {
    console.log('LOG C1 Project Name', projectName)
    frappe.db.get_value('Project', projectName, ['asesor', 'customer','distancia','supervisor'])
        .then(r => {
            let values = r.message;
            cur_frm.set_value('customer_name', values.customer);
            cur_frm.set_value('supervisor_name', values.supervisor);
            cur_frm.set_value('advisor_name', values.asesor);
            cur_frm.set_value('distance', values.distancia + ' KM');
        })
}
function buttonNewTask() {
    cur_frm.set_df_property('cargar', 'options', // * Creo un boton html en el custom field cargar
        frappe.render(`
            <button class="btn btn-primary  btn-block" id="new_task" type="button">
                <i class="fa fa-plus"></i>
                Nueva Tarea
            </button>
            <button class="btn btn-primary  btn-block" id="upload_tasks" type="button">
                <i class="fa fa-chevron-up"></i>
                Subir Tareas
            </button>
        `, {})
    );
    $('#new_task').prop('disabled', true);
    document.getElementById("new_task").addEventListener("click", insertTask, false); // * Acciona la funcion insertTask()
    document.getElementById("upload_tasks").addEventListener("click", uploadTasks, false); // * Acciona la funcion insertTask()
}

function drawCustomerProjectGantt() {

    var tasks = projectDashboard.getGantt();

    //console.log("projectDashboard.getGantt: "+JSON.stringify(tasks));


    var gantt = new Gantt("#customer_project_svg", tasks,
        {
            on_click: function (task) {
                nameProject = task;
                console.log("LOG C0 Click",task);
                cur_frm.set_value('name_p', task.name); // * Seteo el nombre de proyecto a este field, para luego utilizarlo en condiciones
                loadProjectCustomFields(task.name); // * Carga los campos personalizados del projecto
                buttonNewTask(); // * Llamo a la funcion donde creo el boton

                loadProjectInfo(task.name);
                loadProjectExpenseAccounts(task.name);
                loadTaskGantt(task)

            },
            on_date_change: function(task, start, end) {
                console.log(task, start, end);
            },
            on_progress_change: function(task, progress) {
                console.log(task, progress);
            },
            on_view_change: function(mode) {
                var bars = document.querySelectorAll(" .bar-group");
                for (var i = 0; i < bars.length; i++) {
                    bars[i].addEventListener("mousedown", stopEvent, true);
                }
                var handles = document.querySelectorAll(" .handle-group");
                for (var i = 0; i < handles.length; i++) {
                    handles[i].remove();
                }
            },
            bar_height: 15,
            column_width: 30,
            view_mode: 'Month',
            view_modes: ['Week', 'Month'],
            language: 'en',
            popup_trigger: 'click',
            custom_popup_html: function(task) {
                // the task object will contain the updated
                // dates and progress value

                return `
                                      <div class="details-container">
                                        <h5>${task.name}</h5>
                                        <p>Expected to finish by ${task.end}</p>
                                        <p>${task.progress}% completed!</p>
                                      </div>
                                    `;
            }
        }
    );

    //add extra column info
    var initial_x = 0;

    var listBarLabel = document.querySelectorAll(" .bar-wrapper .bar-group .bar-label");
    for (var i = 0; i < listBarLabel.length; i++) {
        var barLabel = listBarLabel[i];

        var labelX = parseInt(barLabel.getAttribute("x")) + barLabel.textContent.length;

        if(initial_x < labelX)
            initial_x = labelX;
    }

    console.log("initial_x",initial_x);

    var projectsGroup = document.querySelectorAll(" .bar-group");

    for (var i = 0; i < projectsGroup.length; i++) {

        var var_label = projectsGroup[i].querySelectorAll(" .bar-label")[0];
        var initial_y = var_label.getAttribute("y");
        console.log('LOG 3 Proyectos para pintar', gantt.get_task(var_label.textContent ))

        var project = gantt.get_task(var_label.textContent );

        if (isEmpty(project.workflow_state) ) continue;

        var class_estado_avance = "";
        if(project.estado_de_avance != "EN TIEMPO")
            class_estado_avance = "estado_atrasado";
        else
            class_estado_avance = "estado_en_tiempo";

        var project_info =
            '<text x="'+(initial_x+550)+'" y="'+initial_y+'" class="'+class_estado_avance+'" >'+
            ("0" + Math.round(project.progress)).slice(-2)+'% / '+
            ("0" + Math.round(project.percent_expected)).slice(-2)+'%</text>'+
            '<text x="'+(initial_x+550+125)+'" y="'+initial_y+'" class="bar-label big" >'+project.workflow_state+'</text>'+
            '<text x="'+(initial_x+550+125+125)+'" y="'+initial_y+'" class="'+class_estado_avance+'" >'+project.estado_de_avance+'</text>'+
            '<text x="'+(initial_x+550+125+125+150)+'" y="'+initial_y+'" class="bar-label big" >'+project.supervisor_encargado+'</text>'
        ;

        projectsGroup[i].innerHTML += project_info;

    }


    //ADD TODAY BAR
    var hoy = new Date();

    const x =
        frappe.datetime.get_diff(hoy, gantt.gantt_start) * 24 /
        gantt.options.step *
        gantt.options.column_width;

    const y = 0;
    const width = 10;//gantt.options.column_width;
    const height =
        (gantt.options.bar_height + gantt.options.padding) *
        gantt.tasks.length +
        gantt.options.header_height +
        gantt.options.padding / 2;

    createSVG('rect', {
        x,
        y,
        width,
        height,
        class: 'today-highlight',
        append_to: gantt.layers.grid
    });



    frappe.show_alert("Dashboard actualizado.");


}

function loadTaskGantt(project) {
    console.log('LOG C2 Comenzando a Cargar Gantt de Tareas del Proyecto', project.id);
    frappe.db.get_list('Task', {
        fields: ['name', 'exp_start_date', 'exp_end_date', 'progress','subject'],
        filters: {
            project: project.id
        }
    }).then(records => {
        var newRecords = [];
        // console.log('TAREAS DEL PROYECTO',records);
        for (var index in records){
            newRecords.push({"id":records[index].name, "name":records[index].subject, "start":records[index].exp_start_date, "end":records[index].exp_end_date, "progress":records[index].progress, "dependencies":records[index].dependencies})
        }
        // console.log('newRecords',newRecords)

        loadScriptsTaskGantt(newRecords);
    })
}

function loadScriptsTaskGantt(tasks) {
    (function() {

        var scriptLinks = [
            URL+"/private/files/frappe-gantt.min.js",
            URL+"/private/files/moment.min.js",
            URL+"/private/files/snap.svg-min.js"
        ];

        for (var i = 0; i < scriptLinks.length; i++) {
            var script = document.createElement('script');
            script.src = scriptLinks[i];
            script.async = false; // This is required for synchronous execution

            document.head.appendChild(script);

            if(i== (scriptLinks.length-1))
                script.onload = function(){

                    // drawCustomerProjectGantt();
                    drawGanttTask(tasks);
                };
        }
    })();
}


function drawGanttTask(task) {

    let gantt_chart = Gantt('#gantt', task,{
        on_click: function (task) {
            console.log('Dar Click',task);
        },
        on_date_change: function(task, start, end) {
            console.log('Cambia la tareaTAREA', task.id)
            console.log('Inicio Tarea', formatDate(start._d));
            console.log('Fin Tarea', formatDate(end._d))
            frappe.db.set_value('Task', task.id, {
                exp_start_date: formatDate(start._d),
                exp_end_date: formatDate(end._d)
            }).then(r => {
                let doc = r.message;
                console.log('Se Guardo',doc);
            });
        },
        on_progress_change: function(task, progress) {
            console.log(task, progress);
        },
        on_view_change: function(mode) {
        },

        custom_popup_html: function(task) {
            // the task object will contain the updated
            // dates and progress value
            const end_date = task._end.format('D MMM YY');
            return `
                <div class="details-container">
                  <h5>${task.name}</h5>
                  <h5>${task.id}</h5>
                  <p>Se espera que termine el ${end_date}</p>
                  <p>${task.progress}% terminada!</p>
                  <button class="btn btn-danger" id="${task.id}" type="button">
                    <i class="fa fa-trash"></i>
                    Eliminar
                  </button>
                  <button class="btn btn-primary" id="${task.id}A" type="button">
                    <i class="fa fa-pencil-square-o"></i>
                    Reportar Avance
                  </button>
                </div>
            `;
        },
    });
    // console.log('QUE ESO',task);
    cur_frm.set_df_property('task_gantt_view', 'options', // * Creo tres botones html en el custom field task_gantt_view, que servira para cambiar de vista el gantt de tareas
        frappe.render(`
            <div class="btn-group" role="group">
              <button type="button" class="btn btn-primary" id="day_view">Día</button>
              <button type="button" class="btn btn-primary" id="week_view">Semana</button>
              <button type="button" class="btn btn-primary" id="month_view">Mes</button>
            </div>
        `, {})
    );

    document.getElementById("day_view").addEventListener("click", day_v, false); // * Acciona la funcion insertTask()
    document.getElementById("week_view").addEventListener("click", week_v, false); // * Acciona la funcion insertTask()
    document.getElementById("month_view").addEventListener("click", month_v, false); // * Acciona la funcion insertTask()
    function day_v() {
        gantt_chart.change_view_mode('Day')
    }
    function week_v() {
        gantt_chart.change_view_mode('Week')
    }
    function month_v() {
        gantt_chart.change_view_mode('Month')
    }
    for (let index in task){
        let idTask = task[index].id;

        let getElementById = document.getElementById(idTask);
        var getattributesById = getElementById.attributes.id
        getElementById.addEventListener("click", deleteTask, false);
        getElementById.myParam = getattributesById.value;

        let getElementByIdA = document.getElementById(idTask+'A');
        var getattributesByIdA = getElementByIdA.attributes.id
        getElementByIdA.addEventListener("click", progressReport, false);
        getElementByIdA.myParam = getattributesByIdA.value;

        function deleteTask(evt) {
            console.log('Eliminar Tarea',evt.currentTarget.myParam)

            frappe.model.with_doc("Project", nameProject.name, function() {
                var projectDoctype = frappe.model.get_doc("Project", nameProject.name);
                let index = projectDoctype.tasks.findIndex(el=> el.task_id === evt.currentTarget.myParam);
                console.log(index);
                projectDoctype.tasks.splice(index,1)
                console.log('projectDoctype.tasks',projectDoctype.tasks)
                saveProjectDoctype(projectDoctype,'eliminar')
                // console.log('ProjectDoctype', projectDoctype)
            });
            // frappe.model.delete_doc('Task', evt.currentTarget.myParam, function(r) {
            //    console.log('Respuesta al eliminar',r);
            //    frappe.show_alert({message: 'Tarea Eliminada', indicator: 'green'}, 5);
            //    loadTaskGantt(nameProject);
            // });

        }
        function progressReport(event) {
            var today = new Date();
            var weekNumber = today.getWeek();

            console.log('Reporte de Avance de esta tarea',event.currentTarget.myParam)
            var d = new frappe.ui.Dialog({
                'fields': [
                    {'fieldname': 'date', 'fieldtype': 'Date', 'label':'Fecha '},
                    {'fieldname': 'week', 'fieldtype': 'Read Only', 'label':'Week', 'default':weekNumber},
                    {'fieldname': 'user', 'fieldtype': 'Link', 'label':'User', 'options': 'User'},
                    {'fieldname': 'percentage_of_completion', 'fieldtype': 'Percent', 'label':'Percentage of completion'},
                    {'fieldname': 'mail_body', 'fieldtype': 'Text Editor', 'label':'Mail body'},
                ],
                'title': 'Reportar Avance de '+ event.currentTarget.myParam,
                primary_action: function(){
                    d.hide();
                    var arrayFields = d.get_values();
                    console.log('NO INPRINE',arrayFields)
                    console.log('Values POPUP',d)
                }
            });
            console.log('D',d);
            d.show();
        }
    }


}
Date.prototype.getWeek = function() {
    var onejan = new Date(this.getFullYear(),0,1);
    return Math.ceil((((this - onejan) / 86400000) + onejan.getDay()+1)/7);
}

function getWeekOfYear() {
    var today = new Date();
    var weekNumber = today.getWeek();
    console.log(weekNumber);

}

function formatDate(date) {
    var day = date.getDate();
    if (day < 10) {
        day = "0" + day;
    }
    var month = date.getMonth() + 1;
    if (month < 10) {
        month = "0" + month;
    }
    var year = date.getFullYear();
    return year + "-" + month + "-" + day;
}
function insertTask() {
    // ! Metodo para llamar a un doctype externo y guardarlo en cache, para luego utilizar sus parametros
    frappe.model.with_doc("Project", nameProject.name, function() {
        var projectDoctype = frappe.model.get_doc("Project", nameProject.name);
        var childTable = frappe.model.add_child(projectDoctype,"Project Task","tasks"); // ! Preparo el arreglo para ser modificado ('Nombre Doctype','Tabla Hija','id_field')
        childTable.title = cur_frm.doc.task_name; // ! Formo el nuevo objeto para actualizar el arreglo.
        childTable.start_date = cur_frm.doc.start_date;
        childTable.end_date = cur_frm.doc.end_date;
        console.log("proj ",projectDoctype,"projectname: ",nameProject.name,"d",childTable);
        saveProjectDoctype(projectDoctype)
    });
}
function uploadTasks() {
    var d = new frappe.ui.Dialog({
        'fields': [
            {'fieldname': 'ht', 'fieldtype': 'HTML'},
            {'fieldname': 'tasks_from_mpp', 'fieldtype': 'Text', 'label':'Tareas de Mpp '},
        ],
        primary_action: function(){
            d.hide();
            var tasks_from_mpp = d.get_values()
            console.log('ok',tasks_from_mpp['tasks_from_mpp'])
            if(isEmpty(tasks_from_mpp['tasks_from_mpp'])) {
                frappe.msgprint("No hay tareas para crear");
                return;
            }

            var lines = tasks_from_mpp['tasks_from_mpp'].split("\n");
            frappe.model.with_doc("Project", nameProject.name, function() {
                var projectDoctype = frappe.model.get_doc("Project", nameProject.name);
                for(var line = 0; line < lines.length; line++){
                    if(isEmpty(lines[line]))
                        continue;

                    // By tabs
                    var tabs = lines[line].split("\t");
                    //console.log("tabs",tabs);

                    var titulo = tabs[0];
                    var fechaInicio = parseDate(tabs[1]);
                    var fechaFin = parseDate(tabs[2]);
                    var predecesor = tabs[3];
                    var projectIdTarea = tabs[4];
                    var esGrupo = tabs[5] != "No";

                    console.log("titulo: "+titulo+" fechaInicio: "+fechaInicio+" fechaFin: "+fechaFin+" esGrupo: "+esGrupo+" projectIdTarea: "+projectIdTarea+" predecesor: "+predecesor);

                    if( isEmpty(titulo) || isEmpty(fechaInicio) || isEmpty(fechaFin) || isEmpty(esGrupo)) {
                        frappe.msgprint("Linea "+(line+1)+" no pudo cargarse. Información incompleta.");
                    }
                    console.log(titulo, fechaInicio, fechaFin, esGrupo)
                    var childTable = frappe.model.add_child(projectDoctype, "Project Task", "tasks");
                    childTable.title = titulo;
                    childTable.start_date = fechaInicio;
                    childTable.end_date = fechaFin;


                    // console.log("proj ",projectDoctype,"projectname: ",nameProject.name,"d",childTable);
                    // insertTask(titulo, fechaInicio, fechaFin)

                    // addTask(line, titulo, fechaInicio, fechaFin, esGrupo, predecesor, projectIdTarea );
                }
                saveProjectDoctype(projectDoctype)
            })
        }
    });
    console.log('D',d)
    d.fields_dict.ht.$wrapper.html('\t\n' +
        'Tasks from mpp\t\n' +
        '\n' +
        'Titulo [tab] Duracion [tab] FechaInicio [tab] FechaFin [tab] Predecesora [tab] ID de tarea [tab] Resumida\n' +
        'Para obtener [tab] utilizar Alt+09\n' +
        'Formato de fecha: dd/MM/yyyy\n');
    d.show();
}
function saveProjectDoctype(project,estado) {
    cur_frm.call({
        method: "frappe.desk.form.save.savedocs",
        args: {
            action: "Save",
            doc: project,
        },
        callback: function(r, rt) {
            console.log('FaltaPor',estado)
            if(r.message) {
                console.log('R',r.message, r)
            }
            if (estado === 0){
                frappe.show_alert({message: 'Sin PORs Faltantes', indicator: 'green'}, 5);
            }
            if (estado > 0){
                frappe.show_alert({message: 'Me faltan PORs', indicator: 'blue'}, 5);
            }
            if (estado === undefined){
                frappe.show_alert({message: 'Tarea Creada', indicator: 'green'}, 5);
                loadTaskGantt(nameProject);
                // * Limpio el contenido de las etiquetas despues de que se haya guardado el doctype Project
                cur_frm.set_value("task_name",'');
                cur_frm.set_value("start_date",'');
                cur_frm.set_value("end_date",'');
            }
            if (estado === 'eliminar'){
                frappe.show_alert({message: 'Tarea Eliminada', indicator: 'green'}, 5)
                loadTaskGantt(nameProject);
            }

        }
    });
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
function createSVG(tag, attrs) {
    const elem = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (let attr in attrs) {
        if (attr === 'append_to') {
            const parent = attrs.append_to;
            parent.appendChild(elem);
        } else if (attr === 'innerHTML') {
            elem.innerHTML = attrs.innerHTML;
        } else {
            elem.setAttribute(attr, attrs[attr]);
        }
    }
    return elem;
}


cur_frm.cscript.excluye_cien_pct = function(doc) {
    loadProjects();
};

cur_frm.cscript.customer = function(doc) {
    clearHTML()
    loadProjects()
};
cur_frm.cscript.company = function(doc) {
    clearHTML()
    loadProjects();

};
cur_frm.cscript.supervisor = function(doc) {
    clearHTML()
    loadProjects();

};

cur_frm.cscript.task_name = function(doc) {
    if (isEmpty(cur_frm.doc.task_name)){
        $('#new_task').prop('disabled', true);
    }else {
        $('#new_task').prop('disabled', false);
    }

};

function clearHTML() {
    cur_frm.set_value("name_p",undefined);
    cur_frm.set_value('sales_order_items','')
    refresh_field('sales_order_items');

    cur_frm.set_value('expense_accounts','')
    refresh_field('expense_accounts');

    cur_frm.set_value('task_gantt','')
    refresh_field('task_gantt');

    cur_frm.set_df_property('task_gantt_view','options',frappe.render(`<div></div>`,{}))
    refresh_field('task_gantt_view');

    cur_frm.set_df_property('cargar','options',frappe.render(`<div></div>`,{}))
    refresh_field('cargar');

}


var selectedItems;

function loadProjectInfo(project) {

    selectedItems = [];

    frappe.model.with_doc("Project", project, function() {
        var projectObject= frappe.model.get_doc("Project", project);

        // console.log("projectObject",projectObject); // TODO: COM3 Descomentar este log projectObject

        var dt = projectDashboard.getDataTableForItems(projectObject.items, projectObject.project_name);

        console.log("loadProjectInfo: "+JSON.stringify(dt)); // TODO: COM4 Descomentar este log loadProjectInfo

        let datatable = new DataTable('#sales_order_items', {
            columns: [
                'item_code', 'description', 'qty', 'uom', 'price',
                'amount', 'actions','pors', 'por'
            ],
            data: dt,
            layout: "fluid",
            dynamicRowHeight: true,
            treeView: true,
            checkboxColumn: true,
            inlineFilters:true,
            events: {
                onCheckRow(row) {
                    console.log(row);
                    $.each(row, function(i, d) {
                        if(d.column.content=="item_code" && d.indent == 2) {

                            if(isEmpty(selectedItems[d.rowIndex]))
                                selectedItems[d.rowIndex] = d;
                            else
                                delete selectedItems[d.rowIndex];

                            console.log("d.content",d.content,"d.indent",d.indent,d.column.content, selectedItems[d.rowIndex], selectedItems);
                        }
                    });

                }
            }
        });

        var filasTabla = datatable.getRows();
        // console.log('Filas en la tabla', filasTabla);
        var filterTheseItems = [];
        for(var posicion in filasTabla){
            var numeroFila = filasTabla[posicion];
            // console.log('For1 FILA', posicion, filasTabla[posicion]);
            for (var posicionFor2 in numeroFila){
                // console.log('Contenido de la columna numero ',numeroFila[posicionFor2].colIndex, 'y fila',posicion , numeroFila[posicionFor2].content)
                if (numeroFila[posicionFor2].colIndex === 2 && numeroFila[posicionFor2].indent === 2){
                    // console.log('Solo el contenido de la columa 2 y la fila ',posicion,numeroFila[posicionFor2].content);
                    filterTheseItems.push({'item_code':numeroFila[posicionFor2].content,'row':posicion})
                }
            }

        }
        console.log('LOG C4 Arreglo: Contiene la posicion de fila de cada item en la tabla datatable(#sales_order_items)',filterTheseItems);

        getPurchaseOrder(filterTheseItems,project);
        // console.log('returnR',returnArrayColor);

        function ejecutra() {
            $.each(filterTheseItems, function (index,row) {
                // console.log('Filtrar filterTheseItems',row.item_code)
                var filterByItemCode = row.item_code;
                var filterArrayColor = array => array.filter(({item_code}) => item_code === filterByItemCode);
                var colores = sessionStorage.getItem('colorArray');
                colores = JSON.parse(colores);
                var getFilterData = filterArrayColor(colores);

                var filterFaltaPOR = array => array.filter(({item_code}) => item_code === filterByItemCode);
                var faltaPor = sessionStorage.getItem('faltaPor');
                faltaPor = JSON.parse(faltaPor);
                var getFilterPor = filterFaltaPOR(faltaPor);
                console.log('getFilterData',getFilterData)
                console.log('getFilterPor',getFilterPor)


                $.each(getFilterData, function (index, row) {
                    $.each(getFilterPor, function (index, rowFpor) {
                        if (row.color === 'green' && rowFpor.item_fpor === 0){
                            var filtrarPorCode = row.item_code;
                            var filterPositionRow = array => array.filter(({item_code}) => item_code === filtrarPorCode);
                            var datosFiltrados =  filterPositionRow(filterTheseItems)
                            // console.log('datosFiltrados',datosFiltrados)
                            datatable.style.setStyle(`.dt-cell--row-`+datosFiltrados[0].row, {backgroundColor: '#c0ffc2'});
                            var xyz = getFilterData.length
                            console.log('length',--xyz)
                            if(xyz < 0)
                                console.log('no hay nada')
                            if (xyz >= 1)
                                datatable.cellmanager.updateCell('9',datosFiltrados[0].row,'<a href="/desk#Form/Purchase Order/'+getFilterData[0].por_name+'" target="_blank">Ps</a> <a href="'+URL+'/desk#Form/Purchase Order/'+getFilterData[1].por_name+'" target="_blank">Ps</a>');
                            // console.log('mAS DE UNO',getFilterData[0].por_name,getFilterData[1].por_name)

                            if (xyz === 0)
                                datatable.cellmanager.updateCell('9',datosFiltrados[0].row,'<a href="'+URL+'/desk#Form/Purchase Order/'+getFilterData[0].por_name+'" target="_blank">Ps</a>');
                            // console.log('SOLO UNO',getFilterData[0].por_name)

                        }else {
                            var filtrarPorCode = row.item_code;
                            var filterPositionRow = array => array.filter(({item_code}) => item_code === filtrarPorCode);
                            var datosFiltrados =  filterPositionRow(filterTheseItems)
                            // console.log('datosFiltrados',datosFiltrados)
                            datatable.style.setStyle(`.dt-cell--row-`+datosFiltrados[0].row, {backgroundColor: '#fff800'});
                            var xyz = getFilterData.length
                            console.log('length',--xyz)
                            if(xyz < 0)
                                console.log('no hay nada')
                            if (xyz >= 1)
                                datatable.cellmanager.updateCell('9',datosFiltrados[0].row,'<a href="'+URL+'/desk#Form/Purchase Order/'+getFilterData[0].por_name+'" target="_blank">Ps</a> <a href="'+URL+'/desk#Form/Purchase Order/'+getFilterData[1].por_name+'" target="_blank">Ps</a>');
                            // console.log('mAS DE UNO',getFilterData[0].por_name,getFilterData[1].por_name)

                            if (xyz === 0)
                                datatable.cellmanager.updateCell('9',datosFiltrados[0].row,'<a href="'+URL+'/desk#Form/Purchase Order/'+getFilterData[0].por_name+'" target="_blank">Ps</a>');
                            // console.log('SOLO UNO',getFilterData[0].por_name)

                        }

                        if (row.color === 'orange'){
                            var filtrarPorCode = row.item_code;
                            var filterPositionRow = array => array.filter(({item_code}) => item_code === filtrarPorCode);
                            var datosFiltrados =  filterPositionRow(filterTheseItems)
                            datatable.style.setStyle(`.dt-cell--row-`+datosFiltrados[0].row, {backgroundColor: '#f7be7f'});
                        }
                        if (row.color === 'yellow'){
                            var filtrarPorCode = row.item_code;
                            var filterPositionRow = array => array.filter(({item_code}) => item_code === filtrarPorCode);
                            var datosFiltrados =  filterPositionRow(filterTheseItems)
                            datatable.style.setStyle(`.dt-cell--row-`+datosFiltrados[0].row, {backgroundColor: '#fdffba'});
                            datatable.cellmanager.updateCell('9',datosFiltrados[0].row,'<a href="javascript:cur_frm.cscript.setRoutePOR('+"'"+row.por_name+"'"+')">PORs</a>');

                        }

                    })
                    // console.log(row)

                })
            });








        }
        setTimeout(ejecutra, 3000)




    });
}



function loadProjectExpenseAccounts(project) {

    frappe.model.with_doc("Project Financial Analysis", project, function() {
        var projectObject= frappe.model.get_doc("Project Financial Analysis", project);

        // console.log("projectFinancialAnalysisObject",projectObject); // TODO: COM1 Descomentar este log projectFinancialAnalysisObject

        var dt = projectDashboard.getDataTableForBudgetAccounts(projectObject.budget, projectObject.project_name);

        // console.log("loadProjectExpenseAccounts: "+JSON.stringify(dt)); // TODO: COM2 Descomentar este log loadProjectExpenseAccounts

        let datatable = new DataTable('#expense_accounts', {
            columns: [
                'Account', 'Budget', 'PINV', 'POR', 'Balance',
                'Variation'
            ],
            data: dt,
            layout: "fluid",
            dynamicRowHeight: true,
            treeView: true,
            checkboxColumn: true,
            inlineFilters:true,
            events: {
                onCheckRow(row) {
                    console.log(row);


                }
            }
        });


    });
}


cur_frm.cscript.newSupplierQuotation = function(projectName, item_code) {
    var tn = frappe.model.make_new_doc_and_get_name("Supplier Quotation");

    locals["Supplier Quotation"][tn].project = projectName;

    //Set selected items
    var selItems = [];
    var c = 0;
    for (var item in selectedItems ) {
        console.log("item",item);
        c++;

        var row = {
            "docstatus":0,
            "doctype":"Project Dashboard Quotation Item",
            "name":"New Project Dashboard Quotation Item "+c,
            "__islocal":1,
            "__unsaved":1,
            "parent":tn,
            "parentfield":"id_rubros_vendidos",
            "parenttype":"Supplier Quotation",
            "idx":c,
            "item_code":selectedItems[item].content
        };

        selItems.push(row);
    }

    locals["Supplier Quotation"][tn].id_rubros_vendidos = selItems;



    frappe.set_route("Form", "Supplier Quotation", tn);

}

cur_frm.cscript.setRoutePOR = function (namePOR) {
    console.log('namePOR',namePOR)
    frappe.set_route('Form', 'Purchase Order', namePOR)
};

function dummy(doc) {
    //selProjectToUpd();
}


function selProjectToUpd() {
    cur_frm.call({
        method: "frappe.client.get_list",
        args: {
            doctype: "Project",
            limit_page_length: 1000,
            fields: ["name"],
            filters:[["Project","workflow_state","=","Planificación"],["Project","percent_completed_creative",">",10]]
        },
        callback: function(r, rt) {
            if(r.message) {
                //console.log("r.message: "+JSON.stringify(r.message));
                $.each(r.message, function(i, d) {
                    //console.log("project.name: "+d.name);
                    uProject(d.name);
                });
            }


        }
    });
}

function uProject(project_name) {
    frappe.call(
        {
            "method": "frappe.client.set_value",
            "args": {
                "doctype": "Project",
                "name": project_name,
                "fieldname": {
                    workflow_state:"Adjudicación de compras"
                }
            }
        });
    console.log("actualizado project.name: "+project_name);
}









function changeWidth() {

    $.each(document.getElementsByClassName("container page-body"), function(i, d) {
        if(!isEmpty(d))
            d.style.width="100%";
    });
}
