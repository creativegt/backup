frappe.ui.form.on('Chat Message', {
    refresh(frm) {
        if ( frappe.browser.Notification ) {
            Notification.requestPermission(status => {
                if ( status === "granted" ) {
                    frappe.chat.message.on.create(message => {
                        const user = frappe.user.full_name(message.user);

                        if ( user !== "Usted" ) {
                            console.log('USUARIO',user)
                            frappe.chat.room.get(message.room, room => {
                                const name  = room.type === "Direct" ? user : room.room_name;
                                const title = `Nuevo Mensaje de ${name}`;
                                frappe.notify(title, {
                                    // message: __("<b>"+`${user}: ${message.content}`+"</b>"),
                                    // title:title,
                                    indicator: "green",
                                    body: `${user}: ${message.content}`
                                });

                                // frappe.notify(title, {
                                //     body: `${user}: ${message.content}`
                                // });
                            });
                        }
                    });
                }
            });
        }
    }
});


