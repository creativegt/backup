function isEmpty(val){
    var test =  (val === undefined || val == null || val.length <= 0) ? true : false;
    return test;
}

const Url = window.location.origin;


function eliminateDuplicates(arr) {
    var uniqs = arr.filter(function(item, index, array) {
        return array.indexOf(item) === index;
    });

    return uniqs;
}


cur_frm.add_fetch('gerente', 'user_id', 'gerente_user_id');


cur_frm.cscript.custom_onload = function(doc) {
    populateDiv();

    filterSalesPerson();


    //loadOpportunities();
    //updateMassiveTask();
}


frappe.ui.form.on("CRM Dashboard", {
        refresh: function(frm) {
            console.log("refresh "+cur_frm.doc.status);
            var me = this
            //frappe.msgprint("estado: "+cur_frm.doc.status);
            if(cur_frm.doc.status == "Draft") {

            }

            changeUser();

            changeWidth();
        }
    }
);

function populateDiv() {
    var template =
        '<style>'+
        '.stbody{ '+
        '  font-family:arial,sans-serif; '+
        '  font-size:100%; '+
        '  margin:3em; '+
        '  background:#f7f7f7; '+
        '  color:#fff; '+
        '  margin:0; '+
        '  padding:0; '+
        '} '+
        '.sth2, .stp{ '+
        '  font-size:100%; '+
        '  font-weight:normal; '+
        '} '+
        '.stul, .stli{ '+
        '  list-style:none; '+
        '} '+
        '.stul { '+
        '  overflow:hidden; '+

        '} '+
        '.stul .stli{ '+
        '  margin:0.5em; '+
        '  float:left; '+
        '  position: relative; '+
        '} '+
        '.stul .stli .sth2{ '+
        '  font-size:80%; '+
        '  font-weight:bold; '+
        '  padding-bottom:0px; '+
        '  margin-top:0px; '+
        '  margin-bottom:0px; '+
        '} '+
        '.stul .stli .stp{ '+

        '  font-size:70%; '+
        '} '+
        '.stul .stli .sta{ '+
        '  text-decoration:none; '+
        '  color:#000; '+
        '  background:#acfdcd; '+
        '  display:block; '+
        '  height:9em; '+
        '  width:10em; '+
        '  padding:0.5em; '+
        '  /* Firefox */ '+
        '  -moz-box-shadow:2px 2px 4px rgba(33,33,33,1); '+
        '  /* Safari+Chrome */ '+
        '  -webkit-box-shadow: 2px 2px 4px rgba(33,33,33,.7); '+
        '  /* Opera */ '+
        '  box-shadow: 2px 2px 4px rgba(33,33,33,.7); '+
        '} '+
        '.button__badge { '+
        '  background-color: #eeeeee; '+
        '  border-radius: 2px; '+
        '  color: black; '+
        '  padding: 1px 3px; '+
        '  font-size: 8px; '+
        '  position: relative; /* Position the badge within the relatively positioned button */ '+
        '  top: -5px; '+
        '  right: 2px; '+
        '} '+
        '.stul .stli .stind{ '+
        '  text-decoration:none; '+
        '  color:#000; '+
        '  background:#fff; '+
        '  display:block; '+
        '  height:8em; '+
        '  width:10em; '+
        '  padding:0em; '+
        '  /* Firefox */ '+
        '  -moz-box-shadow:2px 2px 4px rgba(33,33,33,1); '+
        '  /* Safari+Chrome */ '+
        '  -webkit-box-shadow: 2px 2px 4px rgba(33,33,33,.7); '+
        '  /* Opera */ '+
        '  box-shadow: 2px 2px 4px rgba(33,33,33,.7); '+
        '  border-radius:5px; '+
        '} '+
        '.stindtitle {' +
        '   color:#bbbbbb; '+
        '   font-weight: 100; '+
        '   font-size: small; '+
        '   text-align: center; '+
        '   padding-top: 2em; '+
        '}'+
        '.stindvalue {' +
        '   color:#000; '+
        '   font-weight: bold; '+
        '   font-size: medium; '+
        '   text-align: center; '+
        '}'+


        '.pb-container { '+
        '  width: 100%; '+
        '  height: 8px; '+
        '} '+

        '.progressbar { '+
        '  counter-reset: step; '+
        '  //left: -40%; '+
        '  position: relative; '+
        '  padding: 0px; '+
        '} '+
        '.progressbar .pgli { '+
        '  list-style: none; '+
        '  display: inline-block; '+
        '  width: 8px; '+
        '  height: 5px; '+
        '  position: relative; '+
        '  text-align: center; '+
        '  cursor: pointer; '+
        '  left: 0%; '+
        '  background-color: #ddd;' +
        '  margin-right: 2px;' +
        '} '+

        '.progressbar .pgli:first-child:after { '+
        '  content: none; '+
        '} '+
        '.progressbar .pgli.active { '+
        '  background-color: #5d65ff; '+
        '} '+
        '.progressbar .pgli.active:before { '+
        '  background-color: #5d65ff; '+
        '}  '+
        '.progressbar .pgli.active + li:after { '+
        '  background-color: #5d65ff; '+
        '} '+

        '.avatar-container {' +
        '   position: absolute;'+
        '   bottom: 22px;'+
        '}'+


        '#todo_dashboard{overflow-x: auto; padding:20px 0;}'+
        '.success{background: #00B961; color:#fff}'+
        '.info{background: #2A92BF; color:#fff}'+
        '.warning{background: #F4CE46; color:#fff}'+
        '.error{background: #FB7D44; color:#fff}'+
        '.kanban-item{    '+
        '   font-size: 12px; padding: 5px; '+
        '    background-color: #fff; '+
        '    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3); '+
        '    border-radius: 2px; '+
        '}'+
        '.kanban-board .kanban-drag {    padding: 10px; }'+
        '.kanban-title-button{     background: darkgrey; }'+
        '.kanban-color-indicator { '+
        '    width: 20px; '+
        '    height: 5px; '+
        '    border-radius: 2px; '+
        '    margin-bottom: 4px;' +
        ' }'+

        '</style> '+


        '<table width="100%">'+
        '	<tr>'+
        '		<td>'+
        '			<div id="dashboard_div">'+
        '				<div id="filter_div"></div>'+
        '				<div id="chart_div"></div>'+
        '			</div>'+
        '		</td>'+
        '		<td>'+
        '			<div id="customer_dashboard_div">'+
        '				<div id="customer_filter_div"></div>'+
        '				<div id="customer_chart_div"></div>'+
        '			</div>'+
        '		</td>'+
        '	</tr>'+
        '</table>'+
        '<div id="optydatatable"></div>'
    ;


    cur_frm.set_df_property('funnel', 'options',
        frappe.render(template,
            {

            })
    );

    cur_frm.set_df_property('hist_optys_creadas', 'options',
        frappe.render(' <div id="hist-optys-creadas"></div>',
            {

            })
    );


    cur_frm.set_df_property('hist_qtns_creadas', 'options',
        frappe.render(' <div id="hist-qtns-creadas" ></div>',
            {

            })
    );

    cur_frm.set_df_property('hist_sos_creadas', 'options',
        frappe.render(' <div id="hist-sos-creadas" ></div>',
            {

            })
    );

    cur_frm.set_df_property('conversion_rate_div', 'options',
        frappe.render(' <div id="conversion_rate_div" ></div>',
            {

            })
    );

    cur_frm.set_df_property('margen_avg_div', 'options',
        frappe.render(' <div id="margen_avg_div" ></div>',
            {

            })
    );

    cur_frm.set_df_property('so_dashboard_div', 'options',
        frappe.render(' <div id="so_dashboard_div" ></div>',
            {

            })
    );

    cur_frm.set_df_property('hist_todos_completadas', 'options',
        frappe.render(' <div id="hist_todos_completadas" ></div>',
            {

            })
    );

    cur_frm.set_df_property('todo_dashboard', 'options',
        frappe.render(
            '<div id="todo_dashboard"></div>',
            {

            })
    );



    cur_frm.refresh_field('funnel');
}


function loadGoogleCharts() {



    (function(d, script) {
        script = d.createElement('script');
        script.type = 'text/javascript';
        script.async = false;
        script.onload = function(){
            // remote script has loaded

            // Load the Visualization API and the corechart package.
            google.charts.load('current', {'packages':['corechart', 'controls']});

            // Set a callback to run when the Google Visualization API is loaded.
            google.charts.setOnLoadCallback(drawFunnel);


        };
        script.src = 'https://www.gstatic.com/charts/loader.js';
        d.getElementsByTagName('head')[0].appendChild(script);
    }(document));

}


/*Frappe Data Table*/
function loadScriptsFrappe() {



    (function() {

        var link = document.createElement('link');
        link.href = "https://unpkg.com/frappe-datatable@0.0.5/dist/frappe-datatable.min.css";
        link.rel = "stylesheet";
        link.async = false;
        document.head.appendChild(link);


        var scriptNames = [
            "https://unpkg.com/sortablejs@1.7.0/Sortable.min.js",
            "https://unpkg.com/clusterize.js@0.18.0/clusterize.min.js",
            "https://unpkg.com/frappe-datatable@0.0.5/dist/frappe-datatable.min.js"
        ];

        for (var i = 0; i < scriptNames.length; i++) {
            var script = document.createElement('script');
            script.src = scriptNames[i];
            script.async = false; // This is required for synchronous execution

            document.head.appendChild(script);

            if(i== (scriptNames.length-1))
                script.onload = function(){
                    // remote script has loaded
                    drawDataTable();

                    histOptyCreadas();

                    histQtnsCreadas();

                    histSosCreadas();

                    convertRate();

                    histTodosCompletadas();
                };


        }
        // jquery.min.js and example.js will be run in order and synchronously


    })();



}



function loadScriptsKanban() {



    (function() {

        var link = document.createElement('link');
        link.href = Url+"/private/files/jkanban.min.css";
        link.rel = "stylesheet";
        link.async = false;
        document.head.appendChild(link);


        var scriptNames = [
            Url+"/private/files/jkanban.min.js"
        ];

        for (var i = 0; i < scriptNames.length; i++) {
            var script = document.createElement('script');
            script.src = scriptNames[i];
            script.async = false; // This is required for synchronous execution

            document.head.appendChild(script);

            if(i== (scriptNames.length-1))
                script.onload = function(){
                    // remote script has loaded
                    console.log("loadScriptsKanban");

                    drawTodoDashboard();
                };


        }
        // jquery.min.js and example.js will be run in order and synchronously


    })();



}



function drawDashboardFunnel(table) {
    var data = google.visualization.arrayToDataTable(table);

    // Create a dashboard.
    var dashboard = new google.visualization.Dashboard(document.getElementById('dashboard_div'));

    //EMBUDO ************************************
    // Create a range slider, passing some options
    var donutRangeSlider = new google.visualization.ControlWrapper({
        'controlType': 'CategoryFilter',
        'containerId': 'filter_div',
        'options': {
            'filterColumnIndex': 0
        }
    });

    var title = "";
    var hAxisFormat = "";
    if(cur_frm.doc.tipo_de_suma == "Amount") {
        title = 'Monto en negociación x etapa x asesor';
        hAxisFormat = 'Q#,###';
    } else {
        title = 'Cantidad en negociación x etapa x asesor';
        hAxisFormat = null;
    }

    // Instantiate and draw our chart, passing in some options.
    var chart = new google.visualization.ChartWrapper({
        'chartType': 'BarChart',
        'containerId': 'chart_div',
        'options': {
            title: title,
            width: 1000,
            height: 700,
            legend: { position: 'top', maxLines: 4, fontSize: 6 },
            bar: { groupWidth: '50%' },
            isStacked: true,
            animation:{
                duration: 2000,
                easing: 'out'
            },
            hAxis: {
                format:hAxisFormat,
                fontSize: 6
            },
            vAxis: {
                fontSize: 0,
                textPosition: 'out'
            }
        }
    });

    // Establish dependencies, declaring that 'filter' drives 'chart',
    // so that the pie chart will only display entries that are let through
    // given the chosen slider range.
    dashboard.bind(donutRangeSlider, chart);

    dashboard.draw(data);
}


function drawDashboardSo(table) {
    var data = google.visualization.arrayToDataTable(table);

    // Create a dashboard.
    var dashboard = new google.visualization.Dashboard(document.getElementById('so_dashboard_div'));


    //META DE VENTAS ************************************
    var controlSO = new google.visualization.ControlWrapper({
        'controlType': 'CategoryFilter',
        'containerId': 'so_filter_div',
        'options': {
            'filterColumnIndex': 0
        }
    });

    var chartSo = new google.visualization.ChartWrapper({
        'chartType': 'ComboChart',
        'containerId': 'so_chart_div',
        'options': {
            title: 'Monto de venta x asesor',
            width: 1000,
            height: 700,
            legend: { position: 'top', maxLines: 4, fontSize: 6 },
            bar: { groupWidth: '50%' },
            hAxis: {
                fontSize: 6
            },
            vAxis: {
                format:'Q#,###',
                fontSize: 0,
                textPosition: 'out'
            },
            seriesType: 'bars',
            series: {1: {type: 'line', color: '#FF0000'}, 2: {type: 'line', color: '#2EFE2E'}}
        }
    });
    dashboard.bind(controlSO, chartSo);



    dashboard.draw(data);
}


function drawDashboardCustomer(table) {
    var data = google.visualization.arrayToDataTable(table);

    // Create a dashboard.
    var dashboard = new google.visualization.Dashboard(document.getElementById('customer_dashboard_div'));

    //EMBUDO ************************************
    // Create a range slider, passing some options
    var donutRangeSlider = new google.visualization.ControlWrapper({
        'controlType': 'CategoryFilter',
        'containerId': 'customer_filter_div',
        'options': {
            'filterColumnIndex': 0
        }
    });

    var title = "";
    var hAxisFormat = "";
    if(cur_frm.doc.tipo_de_suma == "Amount") {
        title = 'Monto en negociación x etapa x cliente';
        hAxisFormat = 'Q#,###';
    } else {
        title = 'Cantidad en negociación x etapa x cliente';
        hAxisFormat = null;
    }

    // Instantiate and draw our chart, passing in some options.
    var chart = new google.visualization.ChartWrapper({
        'chartType': 'BarChart',
        'containerId': 'customer_chart_div',
        'options': {
            title: title,
            width: 1000,
            height: 700,
            legend: { position: 'top', maxLines: 4, fontSize: 6 },
            bar: { groupWidth: '50%' },
            isStacked: true,
            animation:{
                duration: 2000,
                easing: 'out'
            },
            hAxis: {
                format:hAxisFormat,
                fontSize: 6
            },
            vAxis: {
                fontSize: 0,
                textPosition: 'out'
            }
        }
    });

    // Establish dependencies, declaring that 'filter' drives 'chart',
    // so that the pie chart will only display entries that are let through
    // given the chosen slider range.
    dashboard.bind(donutRangeSlider, chart);

    dashboard.draw(data);
}

function drawConvertRatePie(table) {
    var data = google.visualization.arrayToDataTable(table);

    var options = {
        title: 'Conversiones',
        titleTextStyle: {
            fontSize: 16,
            bold: true
        },
        slices: {  2: {offset: 0.2, textStyle:{fontSize:16, bold:true} }
        }
    };

    var chart = new google.visualization.PieChart(document.getElementById('conversion_rate_div'));

    chart.draw(data, options);
}




class Opportunity {
    constructor(optyId,
                customer_name,
                assignedTo,
                budget,
                embudoStateV2,
                title,
                pctCalidadOportunidad,
                activity_last_created_on,
                last_activity_type,
                last_activity_comment,
                creation,
                owner,
                assignArray,
                assignedOnlyToMe,
                dias_para_proximo_seguimiento
    ) {
        this.optyId = optyId;
        this.customer_name = customer_name;
        this.assignedTo = assignedTo;
        this.budget = budget;
        this.embudoStateV2 = embudoStateV2;
        this.title = title;
        this.pctCalidadOportunidad = pctCalidadOportunidad;
        this.activity_last_created_on = activity_last_created_on;
        this.last_activity_type = last_activity_type;
        this.last_activity_comment = last_activity_comment;
        this.creation = creation;
        this.owner = owner;

        this.assignedOnlyToMe = assignedOnlyToMe;
        this.assignArray = assignArray;
        this.dias_para_proximo_seguimiento = dias_para_proximo_seguimiento;
    }



    getAvatarArray() {
        if(!this.assignArray || this.assignArray.length==0) return "";

        var ret = "<div class='avatar-container'>";

        $.each(this.assignArray, function(i, d) {
            ret += frappe.avatar(d,"avatar-xs");
        });

        ret += "</div>";

        return ret;
    }

}


class Funnel {
    constructor() {
        this.optys = [];
        this.qtns = [];
        this.sos = [];
        this.stateAsesor = [];
        this.stateAsesorQty = [];

        this.customerList = [];
        this.stateCustomer = [];
        this.stateCustomerQty = [];

        this.asesorSO = [];

        this.count = 0;
        this.inFunnel = 0;
        this.rejected = 0;
        this.converted = 0;
        this.lost = 0;

        this.asesores = ['bgalindo@creative.com.gt', 'sgalindo@int.creative.com.gt', 'cpaul@creative.com.gt', 'mgarcia@creative.com.gt', 'asanchez@creative.com.gt', 'jquevedo@creative.com.gt', 'amorales@int.creative.com.gt', 'alopez@creative.com.gt', 'Sin asignar'];
        this.asesoresNames = ['Brenda Galindo','Sofía Galindo','Christa Paúl','Marvin García','Astrid Sánchez','Juan Carlos Quevedo','Andrea Morales', 'Alfonso Lopez','Sin asignar'];
        this.asesoresNamesCorto = ['Brenda','Sofía','Christa','Marvin','Astrid','Juan','Andrea','Alfonso','S/A'];


        this.states = ['Investigar al cliente','Llamar después', 'Clasificar','Presentar empresa','Conocer','Tomar requerimiento','Definir la solución',
            'Presentar solución','Crear el diseño','Presentar diseño','Crear la cotización','Presentar cotización','Dar seguimiento','Negociar'];
    }

    addOpportunity(optyId,
                   customer_name,
                   assignedTo,
                   budget,
                   embudoStateV2,
                   title,
                   pctCalidadOportunidad,
                   activity_last_created_on,
                   last_activity_type,
                   last_activity_comment,
                   creation,
                   owner,
                   assignArray,
                   assignedOnlyToMe,
                   dias_para_proximo_seguimiento
    ) {

        var o = new Opportunity(optyId,
            customer_name,
            assignedTo,
            budget,
            embudoStateV2,
            title,
            pctCalidadOportunidad,
            activity_last_created_on,
            last_activity_type,
            last_activity_comment,
            creation,
            owner,
            assignArray,
            assignedOnlyToMe,
            dias_para_proximo_seguimiento
        );
        this.optys.push(o);

        //Asesor
        if(isEmpty(this.stateAsesor[embudoStateV2])) {
            this.stateAsesor.push(embudoStateV2);
            this.stateAsesor[embudoStateV2] = [];

            this.stateAsesorQty.push(embudoStateV2);
            this.stateAsesorQty[embudoStateV2] = [];
        }

        if(isEmpty(this.stateAsesor[embudoStateV2][assignedTo])) {
            this.stateAsesor[embudoStateV2].push(assignedTo);
            this.stateAsesor[embudoStateV2][assignedTo] = 0;

            this.stateAsesorQty[embudoStateV2].push(assignedTo);
            this.stateAsesorQty[embudoStateV2][assignedTo] = 0;
        }

        this.stateAsesor[embudoStateV2][assignedTo]+= budget;
        this.stateAsesorQty[embudoStateV2][assignedTo]+= 1;


        //Customer
        if(isEmpty(this.stateCustomer[embudoStateV2])) {
            this.stateCustomer.push(embudoStateV2);
            this.stateCustomer[embudoStateV2] = [];

            this.stateCustomerQty.push(embudoStateV2);
            this.stateCustomerQty[embudoStateV2] = [];
        }

        if(isEmpty(this.stateCustomer[embudoStateV2][customer_name])) {
            this.stateCustomer[embudoStateV2].push(customer_name);
            this.stateCustomer[embudoStateV2][customer_name] = 0;

            this.stateCustomerQty[embudoStateV2].push(customer_name);
            this.stateCustomerQty[embudoStateV2][customer_name] = 0;
        }

        if (this.customerList.indexOf(customer_name)<0) {
            this.customerList.push(customer_name);

        }

        this.stateCustomer[embudoStateV2][customer_name]+= budget;
        this.stateCustomerQty[embudoStateV2][customer_name]+= 1;



        this.count++;

        if(embudoStateV2 == "Ganada")
            this.converted ++;
        else if(embudoStateV2 == "Perdida")
            this.lost ++;
        else if(embudoStateV2 == "Descartada")
            this.rejected ++;
        else
            this.inFunnel ++;

    }


    getOptyById(optyId) {
        var ret=0;

        $.each(this.optys, function(i, opty) {
            if(opty.optyId == optyId) {
                ret = opty;
                return;
            }
        });

        return ret;
    }

    getAsesorIdx(email) {
        var ret=-1;

        $.each(this.asesores, function(i, a) {
            if(a == email) {
                ret = i;
                return;
            }
        });

        return ret;
    }


    getAmountStateAsesor(embudoStateV2, assignedTo) {

        if(isEmpty(this.stateAsesor))
            return 0;
        else if(isEmpty(this.stateAsesor[embudoStateV2]))
            return 0;
        else if(isEmpty(this.stateAsesor[embudoStateV2][assignedTo]))
            return 0;
        else
            return this.stateAsesor[embudoStateV2][assignedTo];
    }

    getAmountStateAsesorQty(embudoStateV2, assignedTo) {

        if(isEmpty(this.stateAsesor))
            return 0;
        else if(isEmpty(this.stateAsesor[embudoStateV2]))
            return 0;
        else if(isEmpty(this.stateAsesor[embudoStateV2][assignedTo]))
            return 0;
        else
            return this.stateAsesorQty[embudoStateV2][assignedTo];
    }


    getAmountStateCustomer(embudoStateV2, customer) {

        if(isEmpty(this.stateCustomer))
            return 0;
        else if(isEmpty(this.stateCustomer[embudoStateV2]))
            return 0;
        else if(isEmpty(this.stateCustomer[embudoStateV2][customer]))
            return 0;
        else
            return this.stateCustomer[embudoStateV2][customer];
    }

    getAmountStateCustomerQty(embudoStateV2, customer) {

        if(isEmpty(this.stateCustomer))
            return 0;
        else if(isEmpty(this.stateCustomer[embudoStateV2]))
            return 0;
        else if(isEmpty(this.stateCustomer[embudoStateV2][customer]))
            return 0;
        else
            return this.stateCustomerQty[embudoStateV2][customer];
    }



    addSalesOrder(soId, customer_name, grand_total, distribucion, asesor) {

        if(isEmpty(this.asesorSO[asesor])) {
            this.asesorSO.push(asesor);
            this.asesorSO[asesor] = 0;
        }

        this.asesorSO[asesor] += grand_total * distribucion / 100;

        //console.log("asesor: "+asesor+" this.asesorSO[asesor]: "+this.asesorSO[asesor]);
    }

    getAmountSO(asesor) {

        if(isEmpty(this.asesorSO))
            return 0;
        else if(isEmpty(this.asesorSO[asesor]))
            return 0;
        else
            return this.asesorSO[asesor];
    }


    compare( a, b ) {
        if ( a.name < b.name ){
            return -1;
        }
        if ( a.name > b.name ){
            return 1;
        }
        return 0;
    }

    groupOptysByMonth() {
        // Because JS doesn't have a nice way to name months because they may differ per locale
        var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // Use reduce to aggregate your data. Pass around a hash so that we have
        // direct access to groups as well as ensure groups appear just once.
        var dataByMonth= this.optys.reduce(function(dataByMonth, datum){
            var date  = frappe.datetime.str_to_obj(datum.creation);
            //console.log("date: "+date+" typeof date: "+ (typeof date));
            var value = 1;
            var month = monthNames[date.getMonth()];
            var year  = ('' + date.getFullYear());
            var group = datum.owner+'-'+year+'-'+(date.getMonth()+1);

            dataByMonth[group] = (dataByMonth[group] || 0) + value;

            return dataByMonth;
        }, {});

        // Now just turn the hash into an array.
        var finalResult = Object.keys(dataByMonth).map(function(group){
            return { name: group, value: dataByMonth[group] };
        });

        //finalResult.sort(this.compare);

        return dataByMonth;
    }

    groupQtnsByMonth() {
        // Because JS doesn't have a nice way to name months because they may differ per locale
        var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // Use reduce to aggregate your data. Pass around a hash so that we have
        // direct access to groups as well as ensure groups appear just once.
        var dataByMonth= this.qtns.reduce(function(dataByMonth, datum) {
            var date  = frappe.datetime.str_to_obj(datum.transaction_date);
            //console.log("date: "+date+" typeof date: "+ (typeof date));
            var value = datum.grand_total;
            value = Math.trunc(value);

            var month = monthNames[date.getMonth()];
            var year  = ('' + date.getFullYear());

            var group = datum.owner+'-'+year+'-'+(date.getMonth()+1);
            dataByMonth[group] = (dataByMonth[group] || 0) + value;

            if(datum.status == "Ordered") {
                var groupMargenAcumulado = datum.owner+'-MARGENACUMULADO';
                dataByMonth[groupMargenAcumulado] = (dataByMonth[groupMargenAcumulado] || 0) + datum.margen;
                var groupMargenQTY = datum.owner+'-MARGENQTY';
                dataByMonth[groupMargenQTY] = (dataByMonth[groupMargenQTY] || 0) + 1;
            }

            return dataByMonth;
        }, {});

        //finalResult.sort(this.compare);

        return dataByMonth;
    }


    groupSosByMonth() {
        // Because JS doesn't have a nice way to name months because they may differ per locale
        var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // Use reduce to aggregate your data. Pass around a hash so that we have
        // direct access to groups as well as ensure groups appear just once.
        var dataByMonth= this.sos.reduce(function(dataByMonth, datum) {
            var date  = frappe.datetime.str_to_obj(datum.transaction_date);
            //console.log("date: "+date+" typeof date: "+ (typeof date));
            var value = datum.grand_total * datum.distribucion / 100;
            value = Math.trunc(value) ;

            var month = monthNames[date.getMonth()];
            var year  = ('' + date.getFullYear());
            var group = datum.asesor+'-'+year+'-'+(date.getMonth()+1);

            dataByMonth[group] = (dataByMonth[group] || 0) + value;

            return dataByMonth;
        }, {});

        //finalResult.sort(this.compare);

        return dataByMonth;
    }


}



function drawFunnel() {



    //EMBUDO DE VENTAS
    var table = [];
    var columns = ['Estado'].concat(funnel.asesoresNames);
    columns = columns.concat([{ role: 'annotation' }]);
    table.push(columns);

    $.each(funnel.states, function(i, state) {
        var c = [];
        c.push(state);
        $.each(funnel.asesores, function(i, asesor) {
            //console.log("state: "+state+" asesor: "+asesor+" amount: "+funnel.getAmountStateAsesor(state, asesor));

            if(cur_frm.doc.tipo_de_suma == "Amount")
                c.push(funnel.getAmountStateAsesor(state, asesor));
            else
                c.push(funnel.getAmountStateAsesorQty(state, asesor));
        });
        c.push('');

        table.push(c);
    });

    //console.log("table: "+JSON.stringify(table));
    //console.log("google: "+JSON.stringify(google));

    //VENTAS
    var tableSO = [];
    tableSO.push(['Asesor', 'Monto de venta', { role: 'annotation' }, 'Viaje México', 'Crucero por el Caribe' ]);

    $.each(funnel.asesorSO, function(i, asesor) {
        var c = [];
        //console.log(" asesor: "+asesor+" amount: "+funnel.getAmountSO(asesor));

        c.push(asesor);
        c.push(funnel.getAmountSO(asesor));
        c.push(funnel.getAmountSO(asesor));

        c.push(2250000);
        c.push(4000000);

        tableSO.push(c);

    });

    //console.log("tableSO: "+JSON.stringify(tableSO));


    //EMBUDO DE VENTAS X CUSTOMER
    //console.log("funnel.customerList: "+JSON.stringify(funnel.customerList));

    var tableCustomer = [];
    var columns = [];
    columns.push('Cliente');

    $.each(funnel.customerList, function(i, customer) {
        columns.push(customer);
    });

    columns = columns.concat([{ role: 'annotation' }]);
    tableCustomer.push(columns);

    $.each(funnel.states, function(i, state) {
        var c = [];
        c.push(state);
        $.each(funnel.customerList, function(i, customer) {
            //console.log("state: "+state+" customer: "+customer+" amount: "+funnel.getAmountStateCustomer(state, customer));

            if(cur_frm.doc.tipo_de_suma == "Amount")
                c.push(funnel.getAmountStateCustomer(state, customer));
            else
                c.push(funnel.getAmountStateCustomerQty(state, customer));
        });
        c.push('');

        tableCustomer.push(c);
    });

    //console.log("tableCustomer: "+JSON.stringify(tableCustomer));

    //CONVERT RATE PIE
    var tableConverRate = [];
    tableConverRate.push(['Estado', 'Cantidad']);

    tableConverRate.push(['En Embudo', funnel.inFunnel]);
    tableConverRate.push(['Descartadas', funnel.rejected]);
    tableConverRate.push(['Ganadas', funnel.converted]);
    tableConverRate.push(['Perdidas', funnel.lost]);

    drawDashboardFunnel( table);
    //drawDashboardSo(tableSO);
    drawDashboardCustomer(tableCustomer);
    //drawConvertRatePie(tableConverRate);
}


var funnel;

//creation: "2019-01-01"
function loadOpportunities() {
    var creation = "2019-01-01";

    var filters = [
        ["Opportunity","company","=",cur_frm.doc.company]
    ];

    if(!isEmpty(cur_frm.doc.from_date))
        filters.push(["Opportunity","creation",">",cur_frm.doc.from_date]);
    else
        filters.push(["Opportunity","creation",">",creation]);

    if(!isEmpty(cur_frm.doc.customer))
        filters.push(["Opportunity","customer_name","=",cur_frm.doc.customer]);

    if(!isEmpty(cur_frm.doc.user_id)) {
        if(cur_frm.doc.tipo_vinculo == "Asignada a")
            filters.push(["Opportunity","_assign","like","%"+cur_frm.doc.user_id+"%"]);
        else
            filters.push(["Opportunity","owner","=",cur_frm.doc.user_id]);
    }

    if(!isEmpty(cur_frm.doc.opportunity_type))
        filters.push(["Opportunity","tipo_de_oportunidad","=",cur_frm.doc.opportunity_type]);

    if(!isEmpty(cur_frm.doc.pct_calidad_de_oportunidad))
        filters.push(["Opportunity","pct_calidad_de_oportunidad",">=",cur_frm.doc.pct_calidad_de_oportunidad]);





    console.log("cur_frm.doc.customer: "+cur_frm.doc.customer+" filters: "+JSON.stringify(filters));

    funnel = new Funnel();

    frappe.db.get_list('Opportunity',{
        fields: [
            'creation','name','embudo_state_v2','customer_name','title','presupuesto_declarado_por_el_cliente',
            'pct_calidad_de_oportunidad','transaction_date','status','owner','_assign','activity_last_created_on',
            'last_activity_type','last_activity_comment','dias_para_proximo_seguimiento'
        ],
        filters: filters,
        limit:1000,
        order_by: "`tabOpportunity`.`presupuesto_declarado_por_el_cliente` desc",
    }).then(records =>{
        console.log('Opportunity',records)
        if (!isEmpty(records)){
            $.each(records, function(i, d) {
                console.log('I',i)
                console.log('D',d)
                var optyId = d.name;
                var customer = d.customer_name;
                var assign = d._assign;
                var embudoStateV2 = d.embudo_state_v2;
                var budget = d.presupuesto_declarado_por_el_cliente;
                var title = d.title;
                var dias_para_proximo_seguimiento = d.dias_para_proximo_seguimiento;
                var pctCalidadOportunidad = d.pct_calidad_de_oportunidad;
                var activity_last_created_on = d.activity_last_created_on;
                var last_activity_type = d.last_activity_type;
                var last_activity_comment = d.last_activity_comment;
                var creation = d.creation;
                var owner = d.owner;

                var assignedTo;
                var assignArray = JSON.parse(assign);
                var assignedOnlyToMe = false;

                if(isEmpty(budget))
                    budget = 0;

                if(isEmpty(assignArray))
                    assignedTo = "Sin asignar";
                else {
                    assignedTo = assignArray[0];
                    assignArray = eliminateDuplicates(assignArray);

                    if(assignArray.length<=1) assignedOnlyToMe=true;
                }

                funnel.addOpportunity(optyId,
                    customer,
                    assignedTo,
                    budget,
                    embudoStateV2,
                    title,
                    pctCalidadOportunidad,
                    activity_last_created_on,
                    last_activity_type,
                    last_activity_comment,
                    creation,
                    owner,
                    assignArray,
                    assignedOnlyToMe,
                    dias_para_proximo_seguimiento
                );
            })

        }else {
            console.log("Sin oportunidades en embudo_state_v2: "+embudo_state_v2+" creation: "+creation);
        }

        loadSalesOrders();

    })

    // cur_frm.call({
    //     method: "frappe.desk.reportview.get",
    //     args: {
    //         start: 0,
    //         page_length: 1000,
    //         doctype: "Opportunity",
    //         fields: [
    //             "`tabOpportunity`.`creation`",
    //             "`tabOpportunity`.`name`",
    //             "`tabOpportunity`.`embudo_state_v2`",
    //             "`tabOpportunity`.`customer_name`",
    //             "`tabOpportunity`.`title`",
    //             "`tabOpportunity`.`presupuesto_declarado_por_el_cliente`",
    //             "`tabOpportunity`.`pct_calidad_de_oportunidad`",
    //             "`tabOpportunity`.`transaction_date`",
    //             "`tabOpportunity`.`status`",
    //             "`tabOpportunity`.`owner`",
    //             "`tabOpportunity`.`_assign`",
    //             "`tabOpportunity`.`activity_last_created_on`",
    //             "`tabOpportunity`.`last_activity_type`",
    //             "`tabOpportunity`.`last_activity_comment`",
    //             "`tabOpportunity`.`dias_para_proximo_seguimiento`"
    //         ],
    //         order_by: "`tabOpportunity`.`presupuesto_declarado_por_el_cliente` desc",
    //         with_childnames: 1,
    //         filters: filters
    //     },
    //     callback: function(r, rt) {
    //         if(r.message) {
    //             console.log("message loadOpportunities: "+JSON.stringify(r.message));
    //
    //             $.each(r.message.values, function(i, d) {
    //                 var optyId = d[3];
    //                 var customer = d[14];
    //                 var assign = d[2];
    //                 var embudoStateV2 = d[8];
    //                 var budget = d[4];
    //                 var title = d[5];
    //                 var dias_para_proximo_seguimiento = d[6];
    //                 var pctCalidadOportunidad = d[13];
    //                 var activity_last_created_on = d[1];
    //                 var last_activity_type = d[9];
    //                 var last_activity_comment = d[12];
    //                 var creation = d[7];
    //                 var owner = d[11];
    //
    //                 var assignedTo;
    //                 var assignArray = JSON.parse(assign);
    //                 var assignedOnlyToMe = false;
    //
    //                 if(isEmpty(budget))
    //                     budget = 0;
    //
    //                 if(isEmpty(assignArray))
    //                     assignedTo = "Sin asignar";
    //                 else {
    //                     assignedTo = assignArray[0];
    //                     assignArray = eliminateDuplicates(assignArray);
    //
    //                     if(assignArray.length<=1) assignedOnlyToMe=true;
    //                 }
    //
    //                 //console.log(i+") optyId: "+optyId+" assign: "+assign+" assignedTo: "+assignedTo+" budget: "+budget+" embudoStateV2: "+embudoStateV2);
    //
    //
    //                 funnel.addOpportunity(optyId,
    //                     customer,
    //                     assignedTo,
    //                     budget,
    //                     embudoStateV2,
    //                     title,
    //                     pctCalidadOportunidad,
    //                     activity_last_created_on,
    //                     last_activity_type,
    //                     last_activity_comment,
    //                     creation,
    //                     owner,
    //                     assignArray,
    //                     assignedOnlyToMe,
    //                     dias_para_proximo_seguimiento
    //                 );
    //
    //             });
    //
    //
    //
    //         } else {
    //             console.log("Sin oportunidades en embudo_state_v2: "+embudo_state_v2+" creation: "+creation);
    //         }
    //
    //         loadSalesOrders();
    //
    //     }
    // });
}




//transaction_date: "2019-01-01"
function loadSalesOrders() {
    var transaction_date = "2020-01-01";

    var filters = [
        ["Sales Order","transaction_date",">",transaction_date],
        ["Sales Order","status","!=","Cancelled"],
        ["Sales Order","status","!=","Draft"],
        ["Sales Order","company","=",cur_frm.doc.company]
    ];

    if(!isEmpty(cur_frm.doc.user_id)) {
        filters.push(["Comisiones Asesores","asesor","=",cur_frm.doc.asesor]);
    }

    frappe.db.get_list('Sales Order', {
        fields: ['name',
            'customer_name',
            'customer',
            'customer_name',
            'order_type',
            'currency',
            'base_grand_total',
            'grand_total',
            'status',
            'per_delivered',
            'per_billed',
            'transaction_date',
            'owner',
            "`tabComisiones Asesores`.`asesor`",
            "`tabComisiones Asesores`.`distribucion` "
        ],
        filters: filters,
        limit: 1000
    }).then(records => {
        console.log(records);

        funnel.sos = records;

        $.each(records, function(i, d) {
            var customer = d.customer;
            var grand_total = d.grand_total;
            var asesor = d.asesor;
            var distribucion = d.distribucion;
            var soId = d.name;

            //console.log(i+") soId: "+soId+" customer: "+customer+" grand_total: "+grand_total+" asesor: "+asesor+" distribucion: "+distribucion);

            funnel.addSalesOrder(soId, customer, grand_total, distribucion, asesor);

        });

        loadQuotations();
    });


}




function loadQuotations() {
    var transaction_date = "2019-01-01";

    var filters = [
        ["Quotation","status","!=","Draft"],
        ["Quotation","status","!=","Cancelled"],
        ["Quotation","company","=",cur_frm.doc.company]
    ];

    if(!isEmpty(cur_frm.doc.from_date))
        filters.push(["Quotation","transaction_date",">",cur_frm.doc.from_date]);
    else
        filters.push(["Quotation","transaction_date",">",transaction_date]);

    if(!isEmpty(cur_frm.doc.customer))
        filters.push(["Quotation","customer_name","=",cur_frm.doc.customer]);

    if(!isEmpty(cur_frm.doc.opportunity_type))
        filters.push(["Quotation","order_type","=",cur_frm.doc.opportunity_type]);

    if(!isEmpty(cur_frm.doc.user_id)) {
        filters.push(["Quotation","owner","=",cur_frm.doc.user_id]);
    }


    frappe.db.get_list('Quotation', {
        fields: ['name',
            'customer_name',
            'desde_oportunidad',
            'transaction_date',
            'order_type',
            'margen',
            'grand_total',
            'owner',
            'status'
        ],
        filters: filters,
        limit: 1000
    }).then(records => {
        console.log(records);

        funnel.qtns = records;

        //loadGoogleCharts();
        loadTodos();
    });



}







/*
this.optyId = optyId;
this.customer_name = customer_name;
this.assignedTo = assignedTo;
this.budget = budget;
this.embudoStateV2 = embudoStateV2;
pctCalidadOportunidad

sticky notes
https://code.tutsplus.com/tutorials/create-a-sticky-note-effect-in-5-easy-steps-with-css3-and-html5--net-13934

*/

function drawDataTable() {

    var totalOptys = 0;
    var totalOptysQty = 0;
    var totalOptysNoBudget = 0;

    //getOptys
    var sData =

        "<div class='stbody' >"+
        "   <ul class='stul'>"+
        "       <li class='stli'>"+
        "         <div class='stind' > " +
        "           <h3 class='stindtitle' >TOTAL OPTYS</h3>"+
        "           <h1 class='stindvalue' id='totalOptys'>Q0.00</h1>"+
        "         </div>"+
        "       </li>"+
        "       <li class='stli'>"+
        "         <div id='cardSinPresupuesto' class='stind' title='Todas las oportunidades deben tener presupuesto. Clic en $ para reportar' > " +
        "           <h3 class='stindtitle' >SIN PRESUPUESTO</h3>"+
        "           <h1 class='stindvalue' id='totalOptysNoBudget'>0</h1>"+
        "         </div>"+
        "       </li>"+
        "       <li class='stli'>"+
        "         <a href="+Url+"'/desk#List/Opportunity/List?filters=%5B%5B%22Opportunity%22%2C%22transaction_date%22%2C%22%3E%22%2C%222019-01-01%22%5D%2C%5B%22Opportunity%22%2C%22_assign%22%2C%22like%22%2CA%5D%2C%5B%22Opportunity%22%2C%22embudo_state_v2%22%2C%22!%3D%22%2C%22Descartada%22%5D%5D' target='_blank' style='text-decoration:none' >"+
        "         <div id='cardOptysNoAsignadas' class='stind' title='Todas las oportunidades deben estar asignadas. Clic aqui para asignar. Seleccionar filtro Sin asignar.' > " +
        "           <h3 class='stindtitle' >SIN ASIGNAR</h3>"+
        "           <h1 class='stindvalue' id='totalOptysSinAsignar'>0</h1>"+
        "         </div>"+
        "         </a>"+
        "       </li>"+
        "   </ul>"+
        " <ul class='stul'>";

    $.each(funnel.optys, function(i, d) {
        if(d.embudoStateV2=="Ganada" || d.embudoStateV2=="Perdida" || d.embudoStateV2=="Descartada") return;

        if(!isEmpty(cur_frm.doc.mis_oportunidades) && cur_frm.doc.mis_oportunidades==1)
            if(!d.assignedOnlyToMe) return;

        var titleText = "";
        var hoy = new Date();
        var last_activity_date = d.activity_last_created_on;
        if (isEmpty(last_activity_date)) last_activity_date = d.creation;


        var diasDesdeUltimaActividad = frappe.datetime.get_diff(hoy, last_activity_date);
        if(isEmpty(diasDesdeUltimaActividad) || isNaN(diasDesdeUltimaActividad)) diasDesdeUltimaActividad=99;

        //console.log("d.activity_last_created_on: "+d.activity_last_created_on+" diasDesdeUltimaActividad: "+diasDesdeUltimaActividad);

        var alertStyle = "";
        if(diasDesdeUltimaActividad>d.dias_para_proximo_seguimiento) {
            alertStyle = "style='background:red;' ";
            titleText += diasDesdeUltimaActividad+" días desde última actividad reportada.";
        }

        if(d.budget<=0) {
            alertStyle = "style='background:red;' ";
            titleText += "Asignar un presupuesto a esta Oportunidad.";
            totalOptysNoBudget++;
        }

        totalOptys += d.budget || 0;
        totalOptysQty ++;

        var rowHtml =

            "<li class='stli'>"+
            " <a href='javascript:cur_frm.cscript.dialogWorkflow( "+'"'+d.optyId+'"'+");' style='text-decoration:none'> "+
            getStatusInProgressBar(d.embudoStateV2) +
            " </a>  " +
            " <a href='"+Url+"/desk#Form/Opportunity/"+d.optyId+"' target='_blank' class='sta' "+alertStyle+" title='"+titleText+"' >"+
            "   <h2 class='sth2'>"+d.optyId+" | "+d.title.substring(0, 45)+"</h2>"+
            "   <p class='stp'>"+
            format_number(d.pctCalidadOportunidad,null,"1") + "% | " + format_currency(d.budget, 'GTQ', 2) +
            "<br/>" +
            d.customer_name +
            "<br/>" +
            d.getAvatarArray()+
            "   </p>"+
            " <a href='javascript:cur_frm.cscript.reportarActividad( "+'"'+d.optyId+'"'+");' style='text-decoration:none'><img src='"+Url+"/files/act-people-ico.png' width='15px' title='Reportar actividad (+)' /> </a>"+
            " <span class='button__badge' >"+diasDesdeUltimaActividad+"</span>"+
            " <a href='javascript:cur_frm.cscript.reportarPresupuesto( "+'"'+d.optyId+'"'+");' style='text-decoration:none'><img src='"+Url+"/files/us-dollar-icon.png' width='10px' title='Reportar presupuesto (+)' /> </a>"+
            " <a href='javascript:cur_frm.cscript.crearTodo( "+'"'+d.optyId+'",null'+");' style='text-decoration:none'><img src='"+Url+"/files/todo-list-icon.png' width='12px' title='Crear ToDo (+)' /> </a>"+
            " </a>"+
            "</li>"
        ;

        sData += rowHtml;

    });
    sData += "</ul>" + "</div>";

    document.getElementById("optydatatable").innerHTML = sData;
    document.getElementById("totalOptys").innerHTML= format_currency(totalOptys, 'GTQ', 2);
    document.getElementById("totalOptysNoBudget").innerHTML= totalOptysNoBudget + " de "+totalOptysQty;

    if(totalOptysNoBudget>0) document.getElementById("cardSinPresupuesto").style.background = "red";


    obtenerOptysSinAsignar();

}

function getStatusInProgressBar(embudoStateV2) {
    var ret = '<div class="pb-container" >' +
        '   <ul class="progressbar">'
    ;


    var active = "active";
    $.each(funnel.states, function(i, state) {
        ret += '<li class="pgli '+active+'" title="'+state+'">&nbsp;</li>';
        if(state == embudoStateV2) active = "";
    });


    ret += '    </ul>' +
        '</div>'
    ;

    return ret;
}


cur_frm.cscript.reportarActividad = function(optyId) {
    // prompt for multiple values
    frappe.prompt([
            {
                label: 'Activity Type',
                fieldname: 'activity_type',
                fieldtype: 'Select',
                options: [
                    "",
                    "Chat",
                    "E-Mail",
                    "Llamada",
                    "Reunión"
                ],
                reqd: 1
            },
            {
                label: 'Comment',
                fieldname: 'comment',
                fieldtype: 'Small Text',
                reqd: 1
            },
            {
                label: 'Next contact date',
                fieldname: 'next_contact_date',
                fieldtype: 'Date'
            },
            {
                label: 'Update All with same customer',
                fieldname: 'update_all_same_customer',
                fieldtype: 'Check'
            }

        ], (values) => {

            console.log(values.activity_type, values.comment, values.update_all_same_customer, optyId);

            if(values.update_all_same_customer==0) {
                reportaActividadPreparaOpty(optyId, values);
            } else {
                var o = funnel.getOptyById(optyId);

                frappe.db.get_list('Opportunity', {
                    fields: ['name'],
                    filters: [["Opportunity","customer_name","like",o.customer_name ],["Opportunity","embudo_state_v2","!=","Ganada"],["Opportunity","embudo_state_v2","!=","Perdida"],["Opportunity","embudo_state_v2","!=","Descartada"]]
                }).then(records => {
                    console.log(records);

                    $.each(records, function(i, d) {
                        reportaActividadPreparaOpty(d.name, values);
                    });
                })
            }



        }
        , 'Reportar nueva actividad en '+optyId , 'Reportar'
    );
};

function reportaActividadPreparaOpty(optyId, values) {
    frappe.model.with_doc("Opportunity", optyId, function() {

        var opty = frappe.model.get_doc("Opportunity", optyId);

        //Agregar actividad
        var d = frappe.model.add_child(opty,"Opportunity Activity","lista_de_actividades");
        d.created_on = frappe.datetime.now_datetime();
        d.activity_type = values.activity_type;
        d.comment = values.comment;
        d.next_contact_date = values.next_contact_date;

        //Actuaizar opty
        opty.activity_last_created_on = d.created_on;
        opty.last_activity_type = values.activity_type;
        opty.last_activity_comment = values.comment;

        if(isEmpty(opty.status)) opty.status = "Open";

        //Agregar interesados a notificar
        var o = funnel.getOptyById(optyId);
        if(!isEmpty(o.assignArray)) {
            if(o.assignArray.length>0) opty.notificar_actividad_1 = o.assignArray[0];
            if(o.assignArray.length>1) opty.notificar_actividad_2 = o.assignArray[1];
            if(o.assignArray.length>2) opty.notificar_actividad_3 = o.assignArray[2];
        }

        //calcular next contact
        if(!isEmpty(values.next_contact_date)) {
            var hoy = new Date();
            opty.dias_para_proximo_seguimiento = frappe.datetime.get_diff(values.next_contact_date, hoy) + 1;
        } else {
            opty.dias_para_proximo_seguimiento = 3;
        }

        console.log("opty: "+JSON.stringify(opty));

        updateOPTY(opty);

    });
}



cur_frm.cscript.reportarPresupuesto = function(optyId) {
    // prompt for multiple values
    frappe.prompt([
            {
                label: 'Presupuesto',
                fieldname: 'presupuesto',
                fieldtype: 'Currency',
                reqd: 1
            },
        ], (values) => {
            console.log(values.activity_type, values.comment, optyId);
            frappe.model.with_doc("Opportunity", optyId, function() {
                var opty = frappe.model.get_doc("Opportunity", optyId);
                opty.presupuesto_declarado_por_el_cliente = values.presupuesto;

                if(isEmpty(opty.status)) opty.status = "Open";

                console.log("opty: "+JSON.stringify(opty));

                updateOPTY(opty);

            });
        }
        , 'Reportar presupuesto en '+optyId , 'Reportar'
    );
};




cur_frm.cscript.crearTodo = function(optyId, status_dyp) {
    console.log("crearTodo", optyId, status_dyp);

    var reference_type = "";
    var reference_name = "";
    var status_dyp_default = "Open";
    var tituloDialogo = "Crear ToDo sin oportunidad";

    if(!isEmpty(optyId)) {
        reference_type = 'Opportunity';
        reference_name = optyId;
        tituloDialogo = 'Crear ToDo en '+optyId;
    }

    if(!isEmpty(status_dyp))
        status_dyp_default = status_dyp;

    // prompt for multiple values
    frappe.prompt([
            {
                label: 'Description',
                fieldname: 'description',
                fieldtype: 'Text Editor',
                reqd: 1
            },
            {
                label: 'Status DyP',
                fieldname: 'status_dyp',
                fieldtype: 'Select',
                options: [
                    'Open',
                    'Monday',
                    'Tuesday',
                    'Wednesday',
                    'Thursday',
                    'Friday',
                    'Completed'
                ],
                reqd: 1,
                default: status_dyp_default
            },
            {
                label: 'Due Date',
                fieldname: 'due_date',
                fieldtype: 'Date',
                reqd: 0
            },
            {
                label: 'Assigned To',
                fieldname: 'owner',
                fieldtype: 'Link',
                options: 'User',
                reqd: 1,
                default: cur_frm.doc.user_id
            },
            {
                label: 'Assigned By',
                fieldname: 'assigned_by',
                fieldtype: 'Link',
                options: 'User',
                reqd: 0,
                default: cur_frm.doc.gerente_user_id || frappe.session.user
            }
        ], (values) => {
            console.log(values.status_dyp);

            frappe.db.insert({
                doctype: 'ToDo',
                description: values.description,
                status_dyp: values.status_dyp,
                owner: values.owner,
                assigned_by: values.assigned_by,
                reference_type: reference_type,
                reference_name: reference_name,
                date: values.due_date
            }).then(doc => {
                console.log(doc);
                frappe.show_alert("HECHO!");

                KanbanTest.addElement(values.status_dyp, {
                    id: doc.name,
                    title: doc.description
                });
            })

        }
        , tituloDialogo , 'Crear'
    );
};





cur_frm.cscript.dialogWorkflow = function(optyId) {
    frappe.model.with_doc("Opportunity", optyId, function() {
        var opty = frappe.model.get_doc("Opportunity", optyId);

        getOptyTransitions(opty);

    });
}

function getOptyTransitions(opty) {
    cur_frm.call({
        method: "frappe.model.workflow.get_transitions",
        args: {
            doc: opty,
        },
        callback: function(r, rt) {
            if(r.message) {
                console.log("getOptyTransitions: "+JSON.stringify(r.message));

                var options = [];
                $.each(r.message, function(i, d) {
                    options.push(d.next_state);
                    console.log("d.next_state: "+d.next_state);
                });

                changeOptyStateDialog(opty, options);
            }
        }
    });
}

function changeOptyStateDialog(opty, next_states) {
    // prompt for multiple values
    frappe.prompt([
            {
                label: 'Cambiar a',
                fieldname: 'state',
                fieldtype: 'Select',
                options: next_states,
                reqd: 1
            }
        ], (values) => {
            opty.embudo_state_v2 = values.state;

            if(isEmpty(opty.status)) opty.status = "Open";
            updateOPTY(opty);
        }
        , 'Cambiar estado de '+opty.name , 'Cambiar estado'
    );
}

function updateOPTY(opty) {

    console.log("updateOPTY: "+opty.name);

    cur_frm.call({
        method: "frappe.desk.form.save.savedocs",
        args: {
            action: "Save",
            doc: opty,
        },
        callback: function(r, rt) {
            if(r.message) {

            }
            frappe.show_alert("HECHO!");
            loadOpportunities();
        }
    });
}




function obtenerOptysSinAsignar() {

    var creation = "2019-01-01";

    var filters = [["Opportunity","_assign","like",null],["Opportunity","embudo_state_v2","!=","Descartada"]];

    if(!isEmpty(cur_frm.doc.from_date))
        filters.push(["Opportunity","creation",">",cur_frm.doc.from_date]);
    else
        filters.push(["Opportunity","creation",">",creation]);



    frappe.db.get_list('Opportunity', {
        fields: ['name'],
        filters: filters
    }).then(records => {
        console.log(records);

        document.getElementById("totalOptysSinAsignar").innerHTML= records.length;
        if(records.length>0) document.getElementById("cardOptysNoAsignadas").style.background = "red";
    });



}














function histOptyCreadas() {

    var months = funnel.groupOptysByMonth();
    console.log("months: "+JSON.stringify(months));

    var datasets=[];
    var l=[];

    $.each(funnel.asesores, function(j, asesor) {
        if(asesor=="Sin asignar") return;

        var iniDate = new Date();
        iniDate.setMonth(iniDate.getMonth() - 4);
        var v=[];

        for(var i=0; i<5; i++) {
            var year  = ('' + iniDate.getFullYear());
            var group = asesor+'-'+year+'-'+(iniDate.getMonth()+1);
            var groupLabel = year+'-'+(iniDate.getMonth()+1);

            if(j==0) l.push(groupLabel);
            v.push(months[group]||0);

            iniDate.setMonth(iniDate.getMonth() + 1);
        }

        datasets.push(
            {
                name: funnel.asesoresNamesCorto[j],
                values: v,
                chartType: 'line'
            }
        );

    });



    let chart = new Chart( "#hist-optys-creadas", { // or DOM element
        data: {
            labels: l,

            datasets: datasets
        },

        title: "Oportunidades Creadas",
        type: 'line', // or 'bar', 'line', 'pie', 'percentage'
        height: 150,
        colors: ['red'],
        lineOptions: {
            regionFill: 1 // default: 0
        }
    });
}




function histQtnsCreadas() {

    var months = funnel.groupQtnsByMonth();
    console.log("months: "+JSON.stringify(months));



    var datasets=[];
    var l=[];

    $.each(funnel.asesores, function(j, asesor) {
        if(asesor=="Sin asignar") return;

        var iniDate = new Date();
        iniDate.setMonth(iniDate.getMonth() - 4);
        var v=[];

        for(var i=0; i<5; i++) {
            var year  = ('' + iniDate.getFullYear());
            var group = asesor+'-'+year+'-'+(iniDate.getMonth()+1);
            var groupLabel = year+'-'+(iniDate.getMonth()+1);

            if(j==0) l.push(groupLabel);
            v.push(months[group]||0);

            iniDate.setMonth(iniDate.getMonth() + 1);
        }

        datasets.push(
            {
                name: funnel.asesoresNamesCorto[j],
                values: v,
                chartType: 'bar'
            }
        );

    });




    let chart = new Chart( "#hist-qtns-creadas", { // or DOM element
        data: {
            labels: l,

            datasets: datasets
        },

        title: "Monto de Cotizaciones Creadas",
        type: 'line', // or 'bar', 'line', 'pie', 'percentage'
        height: 150,
        colors: ['red'],
        lineOptions: {
            regionFill: 1 // default: 0
        },
        barOptions: {
            stacked: 1    // default 0, i.e. adjacent
        },
        tooltipOptions: {
            formatTooltipX: d => (d + '').toUpperCase(),
            formatTooltipY: d => format_currency(d, 'GTQ', 2) ,
        }

    });


    histMargenAcumulado(months);

}




function histSosCreadas() {

    var months = funnel.groupSosByMonth();
    console.log("monthsSos: "+JSON.stringify(months));



    var datasets=[];
    var l=[];

    $.each(funnel.asesoresNames, function(j, asesor) {
        if(asesor=="Sin asignar") return;

        var iniDate = new Date();
        iniDate.setMonth(iniDate.getMonth() - 4);
        var v=[];

        for(var i=0; i<5; i++) {
            var year  = ('' + iniDate.getFullYear());
            var group = asesor+'-'+year+'-'+(iniDate.getMonth()+1);
            var groupLabel = year+'-'+(iniDate.getMonth()+1);

            if(j==0) l.push(groupLabel);
            v.push(months[group]||0);

            iniDate.setMonth(iniDate.getMonth() + 1);
        }

        datasets.push(
            {
                name: funnel.asesoresNamesCorto[j],
                values: v,
                chartType: 'bar'
            }
        );

    });




    let chart = new Chart( "#hist-sos-creadas", { // or DOM element
        data: {
            labels: l,

            datasets: datasets,
            yMarkers: [
                { label: "Meta mensual", value: 333333,
                    options: { labelPos: 'left' }
                }
            ]
        },

        title: "Monto de Venta Mensual",
        type: 'line', // or 'bar', 'line', 'pie', 'percentage'
        height: 150,
        colors: ['red'],
        lineOptions: {
            regionFill: 1 // default: 0
        },
        barOptions: {
            stacked: 0    // default 0, i.e. adjacent
        },
        tooltipOptions: {
            formatTooltipX: d => (d + '').toUpperCase(),
            formatTooltipY: d => format_currency(d, 'GTQ', 2) ,
        }


    });


    soAcumuladoAnual(months);
}



function soAcumuladoAnual(months) {


    var datasets=[];
    var l=[];
    var v=[];

    $.each(funnel.asesoresNames, function(j, asesor) {
        if(asesor=="Sin asignar") return;

        l.push(funnel.asesoresNamesCorto[j]);
        v.push(funnel.getAmountSO(asesor)||0);

    });

    datasets.push(
        {
            name: "Venta acumulada",
            values: v,
            chartType: 'bar'
        }
    );



    let chart = new Chart( "#so_dashboard_div", { // or DOM element
        data: {
            labels: l,

            datasets: datasets,
            yMarkers: [
                { label: "Meta anual", value: 4000000,
                    options: { labelPos: 'left', color: 'Green' }
                }
            ]
        },

        title: "Monto de venta acumulada",
        type: 'bar', // or 'bar', 'line', 'pie', 'percentage'
        height: 150,
        tooltipOptions: {
            formatTooltipX: d => (d + '').toUpperCase(),
            formatTooltipY: d => format_currency(d, 'GTQ', 2) ,
        }

    });



}



function histMargenAcumulado(months) {

    var datasets=[];
    var l=[];
    var v=[];

    $.each(funnel.asesores, function(j, asesor) {
        if(asesor=="Sin asignar") return;

        var groupMargenAcumulado = asesor+'-MARGENACUMULADO';

        var groupMargenQTY = asesor+'-MARGENQTY';

        var margenAvg = Math.trunc(months[groupMargenAcumulado] / months[groupMargenQTY] );

        l.push(funnel.asesoresNamesCorto[j]);
        v.push(margenAvg||0);

    });

    datasets.push(
        {
            name: "Margen promedio",
            values: v,
            chartType: 'bar'
        }
    );



    let chart = new Chart( "#margen_avg_div", { // or DOM element
        data: {
            labels: l,

            datasets: datasets,
            yMarkers: [
                { label: "Estándar", value: 20,
                    options: { labelPos: 'left' }
                }
            ]
        },

        title: "Margen promedio de cotizaciones GANADAS",
        type: 'bar', // or 'bar', 'line', 'pie', 'percentage'
        height: 150,
        tooltipOptions: {
            formatTooltipX: d => (d + '').toUpperCase(),
            formatTooltipY: d => (Math.round(d * 100) / 100) + '%' ,
        },
        valuesOverPoints: 1 // default: 0

    });

}





function convertRate() {

    var datasets=[];
    var l=["En Embudo","Descartadas", "Ganadas", "Perdidas"];
    var v=[funnel.inFunnel, funnel.rejected, funnel.converted, funnel.lost];

    datasets.push(
        {
            name: "Conversiones",
            values: v,
            chartType: 'pie'
        }
    );

    let chart = new Chart( "#conversion_rate_div", { // or DOM element
        data: {
            labels: l,
            datasets: datasets
        },

        title: "Conversiones",
        type: 'pie', // or 'bar', 'line', 'pie', 'percentage'
        height: 150,
        tooltipOptions: {
            formatTooltipX: d => (d + '').toUpperCase(),
            formatTooltipY: d => (Math.round(d * 100) / 100) + '%' ,
        },
        valuesOverPoints: 1 // default: 0

    });

}




cur_frm.cscript.tipo_de_suma = function(doc) {
    loadOpportunities();
};

cur_frm.cscript.customer = function(doc) {
    loadOpportunities();
};

cur_frm.cscript.asesor = function(doc) {

    if(isEmpty(cur_frm.doc.asesor))
        cur_frm.set_value("user_id", null);

    loadOpportunities();
};

cur_frm.cscript.tipo_vinculo = function(doc) {
    loadOpportunities();
};

cur_frm.cscript.from_date = function(doc) {
    loadOpportunities();
};

cur_frm.cscript.opportunity_type = function(doc) {
    loadOpportunities();
};

cur_frm.cscript.pct_calidad_de_oportunidad = function(doc) {
    loadOpportunities();
};

cur_frm.cscript.company = function(doc) {
    loadOpportunities();
};


cur_frm.cscript.mis_oportunidades = function(doc) {
    drawDataTable();
};


function changeWidth() {

    $.each(document.getElementsByClassName("container page-body"), function(i, d) {
        if(!isEmpty(d))
            d.style.width="100%";
    });
}




function filterSalesPerson() {

    cur_frm.set_query("asesor", function() {
        return {
            "filters": {
                es_asesor: 1
            }
        };
    });
}




function changeUser() {

    console.log("changeUser: "+frappe.session.user);

    var funnel = new Funnel();

    var i = funnel.getAsesorIdx(frappe.session.user);

    if(i<0) {
        loadOpportunities();
        return;
    }

    var asesorName = funnel.asesoresNames[i];

    cur_frm.set_value("asesor", asesorName);
    cur_frm.set_value("user_id", frappe.session.user);
    cur_frm.set_value("gerente", "");
    cur_frm.set_value("gerente_user_id", "");

    getGerente(frappe.session.user);

}


function getGerente(user_id) {

    frappe.db.get_doc('Sales Person', null, { user_id: user_id })
        .then(doc => {
            console.log(doc);

            cur_frm.set_value("gerente", doc.gerente);
            cur_frm.set_value("gerente_user_id", doc.gerente_user_id);


        });

}



//************************************************************************************************************
//************************************************************************************************************
// TODOS - TAREAS
//************************************************************************************************************
//************************************************************************************************************

class TodoDashboard {
    constructor() {
        this.todos = [];
        this.estados = ["Open","Monday","Tuesday","Wednesday","Thursday","Friday","Completed"];
        this.estadosClass = ["error","warning","warning","warning","warning","warning","success"];

    }


    groupTodosByMonth() {
        // Because JS doesn't have a nice way to name months because they may differ per locale
        var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        // Use reduce to aggregate your data. Pass around a hash so that we have
        // direct access to groups as well as ensure groups appear just once.
        var dataByMonth= this.todos.reduce(function(dataByMonth, datum){
            var date  = frappe.datetime.str_to_obj(datum.creation);
            //console.log("date: "+date+" typeof date: "+ (typeof date));
            var value = 0;
            var month = monthNames[date.getMonth()];
            var year  = ('' + date.getFullYear());
            var group = datum.owner+'-'+year+'-'+(date.getMonth()+1);

            if(datum.status_dyp=="Completed") value = 1;

            dataByMonth[group] = (dataByMonth[group] || 0) + value;

            return dataByMonth;
        }, {});

        // Now just turn the hash into an array.
        var finalResult = Object.keys(dataByMonth).map(function(group){
            return { name: group, value: dataByMonth[group] };
        });

        //finalResult.sort(this.compare);

        return dataByMonth;
    }

}



cur_frm.cscript.loadTodos = function() {
    loadTodos();
};

var todoDashboard;

//creation: "2019-01-01"
function loadTodos() {
    var creation = "2019-01-01";

    var filters = [];

    if(!isEmpty(cur_frm.doc.from_date))
        filters.push(["ToDo","creation",">",cur_frm.doc.from_date]);
    else
        filters.push(["ToDo","creation",">",creation]);


    if(!isEmpty(cur_frm.doc.user_id)) {
        filters.push(["ToDo","owner","=",cur_frm.doc.user_id]);
    }

    todoDashboard = new TodoDashboard();

    frappe.db.get_list('ToDo', {
        fields: ['name',
            'owner',
            'status_dyp',
            'priority',
            'date',
            'reference_type',
            'reference_name',
            'creation',
            'description',
            'color',
            'assigned_by'
        ],
        filters: filters,
        limit: 2000
    }).then(records => {
        console.log(records);

        todoDashboard.todos = records;

        loadScriptsFrappe();
        loadScriptsKanban();
    });


}





function histTodosCompletadas() {

    var months = todoDashboard.groupTodosByMonth();
    console.log("months: "+JSON.stringify(months));

    var datasets=[];
    var l=[];

    $.each(funnel.asesores, function(j, asesor) {
        if(asesor=="Sin asignar") return;

        var iniDate = new Date();
        iniDate.setMonth(iniDate.getMonth() - 4);
        var v=[];

        for(var i=0; i<5; i++) {
            var year  = ('' + iniDate.getFullYear());
            var group = asesor+'-'+year+'-'+(iniDate.getMonth()+1);
            var groupLabel = year+'-'+(iniDate.getMonth()+1);

            if(j==0) l.push(groupLabel);
            v.push(months[group]||0);

            iniDate.setMonth(iniDate.getMonth() + 1);
        }

        datasets.push(
            {
                name: funnel.asesoresNamesCorto[j],
                values: v,
                chartType: 'line'
            }
        );

    });



    let chart = new Chart( "#hist_todos_completadas", { // or DOM element
        data: {
            labels: l,

            datasets: datasets
        },

        title: "ToDo's Completados",
        type: 'line', // or 'bar', 'line', 'pie', 'percentage'
        height: 150,
        colors: ['red'],
        lineOptions: {
            regionFill: 1 // default: 0
        }
    });
}





var KanbanTest ;

function drawTodoDashboard() {

    var boards = [];

    $.each(todoDashboard.estados, function(i, estado) {
        var items = [];

        $.each(todoDashboard.todos, function(j, item) {


            if (estado=="Completed") return;

            if(item.status_dyp==estado) {

                items.push({
                    'id':item.name,
                    'title':item.description,
                    'due_date': item.date,
                    'owner': item.owner,
                    'assigned_by': item.assigned_by,
                    'color': item.color
                });
            }
        });

        boards.push(
            {
                'id' : estado,
                'title'  : estado,
                'class' : todoDashboard.estadosClass[i],
                'item'  : items
            }
        );

    });

    console.log(boards);

    document.getElementById("todo_dashboard").innerHTML=
        "<a href='javascript:cur_frm.cscript.loadTodos();' >"+
        ' <img src="'+Url+'/private/files/refresh-icon.png" style="width: 50px;" />'+
        '</a><br/><br/>';

    KanbanTest = new jKanban({
        element : '#todo_dashboard',
        responsivePercentage: true,
        dragBoards      : false,
        addItemButton   : true,
        buttonContent   : '+',
        click : function(el) {
            //alert(el.innerHTML);
            console.log(el.dataset.eid);
            window.open(Url+'/desk#Form/ToDo/'+el.dataset.eid,'_blank');
        },
        buttonClick     : function(el, boardId) {
            console.log(el, boardId);
            cur_frm.cscript.crearTodo(null, boardId);


        },
        dragendEl       : function (el) {
            //console.log("ragenEl",el);
        },
        dropEl          : function (el, target, source, sibling) {
            console.log("dropEl",el, target.parentNode.getAttribute('data-id'), source, sibling);
            udpateToDo({status_dyp: target.parentNode.getAttribute('data-id'), name:el.getAttribute('data-eid') });
        },
        boards  : boards
    });

    updateTodosClass();

}

function updateTodosClass() {
    var hoy = new Date();

    $.each(document.getElementsByClassName("kanban-item"), function(i, d) {
        if(!isEmpty(d)) {
            var due_date = d.getAttribute('data-due_date');
            var owner = d.getAttribute('data-owner');
            var assigned_by = d.getAttribute('data-assigned_by');
            var color = d.getAttribute('data-color');
            var days_to_due_date = 9999;



            //AVATAR
            d.innerHTML += getTodosAvatarArray(assigned_by);

            //DUE DATE
            if(!isEmpty(due_date)) {
                let resta = frappe.datetime.str_to_obj(due_date).getTime() - hoy.getTime();
                days_to_due_date = Math.round(resta/ (1000*60*60*24));
            }

            if(!isEmpty(due_date) && due_date !="null")
                d.innerHTML += "<br/><span class='octicon octicon-calendar' style='font-size: 12px; font-weight:600; '> "+due_date+"<span>";

            if(days_to_due_date<1) {
                var selectOcticon = d.querySelector(".octicon");
                if(!isEmpty(selectOcticon))
                    d.querySelector(".octicon").style.color="red";
            }

            //COLOR
            if(!isEmpty(color) && color !="null") {
                console.log(color);
                d.innerHTML = "<div class='kanban-color-indicator' style='background-color:"+color+"; ' ></div>" + d.innerHTML;
            }


        }
    });
}

function getTodosAvatarArray(assigned_by) {

    var ret = "<div class='' >";

    if(!isEmpty(assigned_by) && assigned_by!="null")
        ret += frappe.avatar(assigned_by,"avatar-xs");

    ret += "</div>";

    return ret;
}




function udpateToDo(todo) {
    console.log("updateToDo", todo);

    frappe.db.set_value('ToDo', todo.name, {
        status_dyp: todo.status_dyp
    }).then(r => {
        let doc = r.message;
        console.log(doc);
        frappe.show_alert("HECHO!");
    })
}


//************************************************************************************************************
//************************************************************************************************************
//************************************************************************************************************
//************************************************************************************************************


function updateMassiveTask() {
    frappe.db.get_list('ToDo', {
        fields: ['name', 'description'],
        filters: {
            owner: 'pmendizabal@creative.com.gt',
            status: 'Open'
        },
        start: 0,
        page_length: 1000
    }).then(records => {
        console.log(records);

        $.each(records, function(i, t) {
            // update multiple fields
            frappe.db.set_value('ToDo', t.name, {
                status: 'Closed'
            }).then(r => {
                let doc = r.message;
                console.log(doc);
            })
        });


    });


}
