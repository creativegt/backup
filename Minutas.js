function isEmpty(val){
    var test =  (val === undefined || val == null || val.length <= 0) ? true : false;
    return test;
}
var recipients = [];
frappe.ui.form.on("Minutas", {
    refresh: function () {

    },

    after_save: function(frm) {
        console.log("after_save")
    },

    before_submit:function(frm){
        sendEmail();
        console.log("before_submit")
    },

    validate: function(frm){

    }
});

cur_frm.cscript.project = function (){
    if (isEmpty(cur_frm.doc.project)) return;
    frappe.db.get_doc('Project', cur_frm.doc.project)
        .then(doc => {
            console.log(doc)
            var name = doc.name
            var codigoProyecto = name.split(' ')[0];
            var f = new Date();
            var fecha = `${f.getDate()}/${f.getMonth() + 1}/${f.getFullYear()}`;
            var nameMinuta = 'MN-'+codigoProyecto+'-'+fecha
            cur_frm.set_value('meeting_name',nameMinuta);
            console.log('CODIGO', nameMinuta)
        })
};

frappe.ui.form.on("Minute Attendees", "assistant", function(frm, cdt, cdn) {
    var d = locals[cdt][cdn];
    console.log('Value ',d)
    if (isEmpty(d.assistant)) return;
    frappe.model.with_doc("Contact", d.assistant, function() {
        var contacto = frappe.model.get_doc("Contact", d.assistant);
        console.log('imprimiendo',contacto.links);
        frappe.model.set_value(d.doctype, d.name, "mail", contacto.email_id);
        $.each(contacto.links, function(index, row) {
            console.log('FOR', row)
            frappe.model.set_value(d.doctype, d.name, "company", row.link_name);
            frappe.model.set_value(d.doctype, d.name, "contact_type", row.link_doctype);
            return false;
            //         // do something after value is set
            console.log('Correcto')
            //
            //     console.log('QUe', row)
        })
    });
});

function sendEmail() {
    var emails = cur_frm.doc.attendees;
    for (var email in emails){
        console.log(emails[email].mail);
        recipients.push(emails[email].mail)

    }
    frappe.call({
        method: "frappe.core.doctype.communication.email.make",
        args: {
            recipients: recipients.toString(),
            cc: cur_frm.doc.created_by,
            content: cur_frm.doc.content_email,
            subject: cur_frm.doc.meeting_name,
            doctype: "Minutas",
            name: cur_frm.doc.name,
            send_email: 1,
            print_format:"Minuta Creative",
            communication_medium: "Email",
        },
        async: false,
        callback: function(rh){
            frappe.msgprint("Correo Enviado");
            console.log("mail sent")
        }
    });
}