var gbl;
var loadTotal= [];
var totalProyects = 0;
var totalArray = 0;
var totalAmount = 0;

var listAll = [];
frappe.ui.form.on('FinancialDashboard', {
    refresh(frm) {
        cur_frm.page.add_action_icon(__("fa fa-flag"), function() {
            loadTotal= [];
            sumaTotalArray= [];
            listarProyects(frm);
            gbl = frm.doc.fiscal_year
        });

    }
});





function isEmpty(val){
    var test =  (val === undefined || val == null || val.length <= 0) ? true : false;
    return test;
}

function listarProyects(frm) {
    frappe.db.get_list('Project',{
        fields: ['project_name','status','expected_start_date','expected_end_date','company','sales_order','estimated_costing'],
        filters: {
            company:frm.doc.company,
            // project_name:"Top Escritorio Gerencia General 6 Arquitectos."
        },
        limit: 1000
    }).then(records => {
        totalProyects = records.length
        console.log('PROYECTOS', records)
        records = JSON.stringify(records);
        var proyectos = JSON.parse(records);
        var autoSuma = 0;
        for(var proyect in proyectos){
            var nombrePro = proyectos[proyect].project_name
            listSalesOrder(proyectos[proyect].project_name,proyectos[proyect].sales_order);
        }
    })
}

function listSalesOrder(project_name,sales_order) {
    if (isEmpty(sales_order)){
        listarTareas(project_name, 0)
        return;
    }

    var doctype = 'Sales Order';
    var name = sales_order;
    var fieldname = '';
    frappe.db.get_value(doctype, name, ['grand_total','conversion_rate']).then(r => {
        var values = r.message;
        var grandTotal = values.grand_total;
        // console.log(values.grand_total)
        listarTareas(project_name, grandTotal);
    })
}

function listarTareas(nombreProyecto,monto) {
    frappe.db.get_list('Task', {
        fields: ['name', 'project', 'subject', 'exp_start_date', 'exp_end_date', 'act_start_date'],
        filters: {
            project: nombreProyecto
        }
    }).then(records => {
        var consoleprint;
        var resp= 0;
        console.log('Tasks of project', nombreProyecto, records,nombreProyecto);

        consoleprint = recorrerTareas(records,monto,nombreProyecto);
        for(var x in consoleprint){
            resp += consoleprint[x].totalQ;
        }
        // console.log('TOTALQ DESDE listarTareas', consoleprint);
        totalAmount = resp
        console.log('TOTALQ DESDE listarTareas', resp);
    });
}

var newArray = [];
var sumaTotalArray= [];

function round(value, decimals) {
    return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}

function recorrerTareas(records,monto,nombreProyecto) {

    var records = JSON.stringify(records)
    var dato = JSON.parse(records)
    var sumame = 0;
    var sumarTotal=0;
    var division = 0;
    var totalQ= 0;
    var numero = 1;
    for(var x in dato){
        sumame += taskOperatedProgress(dato[x].exp_start_date, dato[x].exp_end_date, gbl, gbl )
        sumarTotal += duracionTotalTarea(dato[x].exp_start_date, dato[x].exp_end_date, gbl, gbl )
    }

    division = sumame/sumarTotal
    // round(division, 2)
    var division = division || 0;

    if (division < 0){
        division = 0
    }

    var divredond =round(division,2)
    var porcentje= divredond*100

    totalQ = Math.round(divredond * monto)
    listAll.push({nombreProyecto,porcentje,totalQ})

    // newArray.push(division)
    sumaTotalArray.push({totalQ});
    loadTotal.push({numero});
    // console.log('DESDE LA FUNCION sumame', sumame)
    // console.log('DESDE LA FUNCION sumarTotal', sumarTotal)
    console.log('DIVISION', divredond)

    // console.log('ARRAY', loadTotal)
    totalArray = loadTotal.length;
    validarTerminacion(totalArray,totalProyects,nombreProyecto,totalAmount)

    console.log(totalArray)

    console.log('LISTA',listAll)

    // console.log('TOTALQ', totalQ)
    // console.log('ARREGLO DESDE recorrerTareas', sumaTotalArray)
    return sumaTotalArray;
}


function taskOperatedProgress(dateInitTask, dateFinishTask, beginningYear,dateFinishYear){
    var fechaInicioTarea = new Date(dateInitTask);
    fechaInicioTarea.setDate(fechaInicioTarea.getDate() + 1);
    var fechaFinTarea = new Date(dateFinishTask);
    fechaFinTarea.setDate(fechaFinTarea.getDate() + 1)
    var fechaInicioAno = new Date(beginningYear,0,1);
    var fechaFinAno = new Date(dateFinishYear,11,31);
    // fechaFinAno.setDate(fechaFinAno.getDate() + 1);

    var duraOperadaTotal= 0;
    var duracionTotalTarea = 0;
    var divicion = 0;


    if (fechaInicioTarea >= fechaInicioAno && fechaFinTarea <= fechaFinAno){ //C0
        // var duracionCompletadaEsperada = 0;
        duraOperadaTotal = frappe.datetime.get_diff(fechaFinTarea,fechaInicioTarea) +1;

        // console.log('Trabajo  ',duraOperadaTotal, ' Dias');
        // duracionCompletadaEsperada += c0;
        // console.log('TRUE '+'SE CUMPLIO EL CASO DONDE LA TAREA ES DEL MISMO AÑO')
    }
    else if ( fechaInicioTarea >= fechaInicioAno && fechaFinTarea > fechaFinAno){ //C1
        duraOperadaTotal = frappe.datetime.get_diff(fechaFinAno,fechaInicioTarea)+1;

        // console.log('Trabajo  ',duraOperadaTotal, ' Dias');
        // console.log('TRUE '+'SE CUMPLIO EL PRIMER CASO DONDE LA TAREA EMPIEZA EN EL AÑO QUE SE ESTA CALCULANDO PERO TERMINA AL PROXIMO AÑO')
        // return duraOperadaTotal;
    }
    else if ( fechaInicioTarea < fechaInicioAno && fechaFinTarea <= fechaFinAno){ //C2
        duraOperadaTotal = frappe.datetime.get_diff(fechaFinTarea,fechaInicioAno)+1;
        duracionTotalTarea = frappe.datetime.get_diff(fechaFinTarea,fechaInicioTarea);

        // console.log('Trabajo  ',duraOperadaTotal, ' Dias');
        // console.log('TRUE '+'SE CUMPLIO EL SEGUNDO CASO DONDE LA FECHA INICIO DE LATAREA COMIENZA UN AÑO ANTES AL AÑO QUE SE ESTA CALCULANDO')
    }
    else if ( fechaInicioTarea < fechaInicioAno && fechaFinTarea > fechaFinAno){ //C3
        duraOperadaTotal = frappe.datetime.get_diff(fechaInicioTarea, fechaFinTarea)+1;
        duracionTotalTarea = frappe.datetime.get_diff(fechaFinTarea,fechaInicioTarea);
        // console.log('Trabajo  ',duraOperadaTotal, ' Dias');
        // console.log('VERDAD '+'Anterior Año Nuevo')
    }
    else {
        console.log('IMPRIME')
    }

    return duraOperadaTotal;
}

function duracionTotalTarea(dateInitTask, dateFinishTask, beginningYear,dateFinishYear){
    var fechaInicioTarea = new Date(dateInitTask);
    fechaInicioTarea.setDate(fechaInicioTarea.getDate() + 1);
    var fechaFinTarea = new Date(dateFinishTask);
    fechaFinTarea.setDate(fechaFinTarea.getDate() + 1)
    var fechaInicioAno = new Date(beginningYear);
    var fechaFinAno = new Date(dateFinishYear);
    fechaFinAno.setDate(fechaFinAno.getDate() + 1);

    var duracionTotalTarea = 0;

    if (fechaInicioTarea >= fechaInicioAno && fechaFinTarea <= fechaFinAno){ //C0
        duracionTotalTarea = frappe.datetime.get_diff(fechaFinTarea,fechaInicioTarea)+1;
        // console.log('TRUE '+'SE CUMPLIO EL CASO DONDE LA TAREA ES DEL MISMO AÑO')
    }
    else if ( fechaInicioTarea >= fechaInicioAno && fechaFinTarea > fechaFinAno){ //C1
        duracionTotalTarea = frappe.datetime.get_diff(fechaFinTarea,fechaInicioTarea)+1;

        // console.log('Trabajo  ',duracionTotalTarea, ' Dias');
        // console.log('TRUE '+'SE CUMPLIO EL PRIMER CASO DONDE LA TAREA EMPIEZA EN EL AÑO QUE SE ESTA CALCULANDO PERO TERMINA AL PROXIMO AÑO')
        // return duraOperadaTotal;
    }
    else if ( fechaInicioTarea < fechaInicioAno && fechaFinTarea <= fechaFinAno){ //C2
        duracionTotalTarea = frappe.datetime.get_diff(fechaFinTarea,fechaInicioTarea)+1;

        // console.log('Trabajo  ',duracionTotalTarea, ' Dias');
        // console.log('TRUE '+'SE CUMPLIO EL SEGUNDO CASO DONDE LA FECHA INICIO DE LATAREA COMIENZA UN AÑO ANTES AL AÑO QUE SE ESTA CALCULANDO')
    }
    else if ( fechaInicioTarea < fechaInicioAno && fechaFinTarea > fechaFinAno){ //C3
        duracionTotalTarea = frappe.datetime.get_diff(fechaFinTarea,fechaInicioTarea)+1;
        // console.log('VERDAD '+'Anterior Año Nuevo')
    }
    else {
        console.log('IMPRIME')
    }
    return duracionTotalTarea;

}

function formatQ(numero){
    var formQ = new Intl.NumberFormat('es-GT', {
        style: 'currency',
        currency: 'GTQ',
        minimumFractionDigits: 2
    }).format(numero);
    return formQ
}

function validarTerminacion(loadTotal,totalProyects,nombreProyecto) {
    console.log('v',loadTotal)
    console.log('v',totalProyects)
    var porcCompletado = loadTotal/totalProyects * 100

    if (loadTotal < totalProyects){
        frappe.update_msgprint('   PORCENTAJE ' +porcCompletado +'%'+ '  Cargando  '+nombreProyecto);
    }else {
        frappe.update_msgprint('PORCENTAJE: '+porcCompletado+ '%'+'   Monto Total   '+ formatQ(totalAmount));
    }
}