
frappe.Application = frappe.Application.extend({
    startup: function() {
        this._super()
        if (sys_defaults.email_user_password){
			var email_list =  sys_defaults.email_user_password.split(',');
			for (u in email_list) {
				if (email_list[u]===frappe.user.name){
					setTimeout(this.set_password.bind(null,this,email_list[u]), 250)
				}
			}
		}
    },
    set_password: function (parent,user) {
		frappe.call({
			method: 'inbox.email_inbox.user.get_email_awaiting',
			args: {
				"user": user
			},
			callback: function (email_account) {
				email_account = email_account["message"];
				if (email_account) {
					var i = 0;
					if (i < email_account.length) {
						parent.email_password_prompt(parent, email_account, user, i);
					}
				}
			}
		});
	},

	email_password_prompt: function(parent,email_account,user,i) {
		var d = new frappe.ui.Dialog({
			title: __('Email Account setup please enter your password for: '+email_account[i]["email_id"]),
			fields: [
				{	'fieldname': 'password',
					'fieldtype': 'Password',
					'label': 'Email Account Password',
					'reqd': 1
				},
				{
					"fieldtype": "Button",
					"label": __("Submit")
				}
			]
		});
			d.get_input("submit").on("click", function() {
				//setup spinner
				d.hide();
				var s = new frappe.ui.Dialog({
						title: __("Checking one moment"),
					fields: [{
                    "fieldtype": "HTML",
                    "fieldname": "checking"
                }]
					});
				s.fields_dict.checking.$wrapper.html('<i class="icon-spinner icon-spin icon-4x"></i>')
				s.show();
				frappe.call({
					method: 'inbox.email_inbox.user.set_email_password',
					args: {
						"email_account": email_account[i]["email_account"],
						"user": user,
						"password": d.get_value("password")//values["password"]
					},
					callback: function (passed)
					{
						s.hide();
						d.hide();//hide waiting indication
						if (!passed["message"])
						{
							show_alert("Login Failed please try again", 5);
							parent.email_password_prompt(parent, email_account, user, i)
						}
						else
						{
							if (i + 1 < email_account.length)
							{
								i = i + 1;
								parent.email_password_prompt(parent, email_account, user, i)
							}
						}

					}
				});
			});
			d.show();
	}
})




	
	
/*
var test = Class.extend({
init:function(){
console.log("init")
},
	startup:function(){
		console.log("startup")
	}
})
test = test.extend({startup:function(){

console.log("startup 2")
}})

var run = new test()
run.startup()
    */