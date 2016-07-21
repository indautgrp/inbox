frappe.require('assets/inbox/js/lib/bootstrap-paginator.min.js')

frappe.pages['Email Inbox'].on_page_load = function(wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Email Inbox',
		icon: 'icon-inbox',
		single_column: false
	});

	frappe.model.with_doctype('Communication', function() {
		wrapper.Inbox = new frappe.Inbox({
			method: 'frappe.desk.reportview.get',
			wrapper: wrapper,
			page: wrapper.page,
			no_loading: true,

		});
	});
}

frappe.breadcrumbs.add("Setup");

frappe.pages['Email Inbox'].refresh = function(wrapper) {
	if (wrapper.inbox) {
		wrapper.Inbox.refresh()
	}
}

frappe.Inbox = frappe.ui.Listing.extend({
    init: function(opts) {
		$.extend(this, opts);
		wrap = this;
		this.wrapper = opts.wrapper;
		this.filters = {};
		this.page_length  = 20;
		this.start = 0;
		this.cur_page = 1;
		this.no_result_message = 'No Emails to Display';

		this.render_sidemenu();
		if (this.account) {
			var me = this
				// setup listing
				me.make({
					doctype: 'Communication',
					page: me.page,
					method: 'frappe.desk.reportview.get',
					get_args: me.get_args,
					parent: me.page.main,
					start: 0,
					show_filters: true,
				});
			this.render_headers();
			this.render_footer();
			this.run()
			this.render_buttons();
			this.init_select_all();
			var me = this;
			frappe.realtime.on("new_email", function(data) {
				for(var i =0;i<me.accounts.length;i++) {
					if (data.account == me.accounts[i]) {
						frappe.utils.notify(data.account, "you have "+data.number+" new emails", {}, function () {
							window.focus();
							me.account = data.account;
							$(me.wrapper.page.sidebar).find(".list-row").removeClass("list-row-head").css("font-weight","normal");
							$('.inbox-item[data-account="' + data.account + '" ]').closest(".list-row").addClass("list-row-head").css("font-weight","bold");
							me.refresh();
						});
						if(data.account == me.account) {
							me.refresh();
						}
					}
				}
			});
		}else{
			alert("No Email Account assigned to you contact your System administrator");
			if (frappe.session.user==="Administrator")
			{
				frappe.set_route("List","User");
			}
			else
			{
				window.history.back();
			}
		}
    },
	refresh:function(){
		this.run();
	},
	render_headers: function(){
        //$(cur_frm.fields_dict['inbox_list'].wrapper)
		$(".layout-main-section-wrapper").css("padding-left","0px").css("padding-right","0px")
		var data = {"start":this.start,"page_length":this.page_length.toString()}
		this.list_header = $(frappe.render_template("inbox_headers", data)).appendTo(this.page.main.find(".list-headers"));
    },
	render_sidemenu: function () {
		var me = this;
        frappe.call({
			method: 'inbox.email_inbox.page.email_inbox.get_accounts',
			args:{user:frappe.user["name"]},
			async:false,
			callback:function(list){
				var buttons = '<div class="layout-main-section">';
				if (list["message"]){
					me.accounts = [];
					var rows = "";

					for (var i = 0;i<list["message"].length;i++)
					{
						rows += '<div class="list-row inbox-select"> <div class="row"><span class="inbox-item text-ellipsis col-md-12" title ="'+list["message"][i]["email_id"]+'" data-account="'+list["message"][i]["email_account"]+'" style="margin-left: 10px;">'+list["message"][i]["email_id"]+'</span> </div></div>';
						me.accounts.push(list["message"][i]["email_account"])
					}
					me.allaccounts = me.accounts.join(", ");
					buttons += '<div class="list-row inbox-select list-row-head" style="font-weight:bold"> <div class="row"><span class="inbox-item text-ellipsis col-md-12 " title ="Combined Inbox" data-account="'+me.allaccounts+'" style="margin-left: 10px;">Combined Inbox</span> </div></div>';
					buttons += rows;
					me.account = me.allaccounts;
					me.default_filters=[["Communication", "communication_type", "=", "Communication"],["Communication", "email_account", "in", me.account],["Communication", "deleted", "=", 0]]
					me.render_footer()
					me.wrapper.page.sidebar.append(buttons).addClass('hidden-sm hidden-xs');
					$(".inbox-select").click(function(btn){
						me.account = $(btn.currentTarget).find(".inbox-item").data("account");
						$(me.wrapper.page.sidebar).find(".list-row").removeClass("list-row-head").css("font-weight","normal");
						$(btn.currentTarget).closest(".list-row").addClass("list-row-head").css("font-weight","bold");
						me.cur_page = 1;
						$(".list-select-all").prop("checked",false);
						me.filter_list.default_filters=[["Communication", "communication_type", "=", "Communication"],["Communication", "email_account", "in", me.account],["Communication", "deleted", "=", 0]]
						me.filter_list.clear_filters()
						me.filter_list.reload_stats();
						me.refresh();
					});
	
					//for mobile sidemenu
					$(".form-sidebar").show();
					$(".sidebar-left").find(".form-sidebar").append(buttons);

					$(".form-sidebar").find(".inbox-select").click(function(btn){
						me.account = $(btn.currentTarget).find(".inbox-item").data("account");
						$(".form-sidebar").find(".list-row").removeClass("list-row-head").css("font-weight","normal");
						$(btn.currentTarget).closest(".list-row").addClass("list-row-head").css("font-weight","bold");
						me.cur_page = 1;
						$(".list-select-all").prop("checked",false);
						me.filter_list.default_filters=[["Communication", "communication_type", "=", "Communication"],["Communication", "email_account", "in", me.account],["Communication", "deleted", "=", 0]]
						me.filter_list.clear_filters()
						me.filter_list.reload_stats();
						me.refresh();
					});
					me.wrapper.page.sidebar.removeClass("col-md-2").addClass("col-md-1").width('0%');
				}
			}
        })
    },
	get_args: function(){
		var args = {
			doctype: this.doctype,
			fields:["name", "sender", "sender_full_name", "actualdate", "recipients", "communication_medium", "subject", "status" ,"reference_doctype","reference_name","timeline_doctype","timeline_name","timeline_label","sent_or_received","uid","message_id", "seen","nomatch","has_attachment"],
			filters: this.filter_list.get_filters(),
			order_by: 'actualdate desc'
		}

		// apply default filters, if specified for a listing
		args.filters.push(["Communication", "communication_type", "=", "Communication"]);
		args.filters.push(["Communication","email_account","in",this.account])
		args.filters.push(["Communication", "deleted", "=", 0])

		return args;
	},
	render_list:function(data){
		var me = this
		for (var i = 0; i < data.length; i++) {
							me.data[data[i].name] = data[i]
		}
		$(me.wrapper).find(".result-list").html("");
			for (var i = 0; i < data.length; i++)
			{
				$(me.wrapper).find(".result-list").append(frappe.render_template("inbox_list", {data: data[i]}));
			}
			//click action
			$(me.wrapper).find(".doclist-row").click(function (btn) {
				if ($(btn.target).hasClass("noclick")) {
					return
				}
				var name = $(btn.target).closest(".doclist-row").data("name");
				if($(btn.target).hasClass("relink-link")){
					me.relink(name);
					return
				}
				if (!$(btn.target).hasClass("force-company") && (me.data[name]["nomatch"] || me.data[name]["timeline_doctype"])) {
					me.email_open(name);
				} else {
					me.company_select(name);
				}
			});
	},
	render_footer:function(){
		var me = this;
		me.footer = $(me.wrapper).append(' <footer class="footer hidden-xs" style="position: fixed;bottom: 0;width: 100%;height: 60px;background-color: #f5f5f5;"><div class="container" > <div class="col-sm-6"><ul class="foot-con"></ul><div class="footer-numbers" style="vertical-align: middle;float:right;margin: 20px 0"></div></div> </footer>').find(".foot-con");
		me.footer.bootstrapPaginator({
			currentPage: 1,
			totalPages: 10,
			bootstrapMajorVersion:3,
			onPageClicked: function(e,originalEvent,type,page){
				me.cur_page = page;
				$('.footer-numbers').html('showing: ' + (me.cur_page - 1) * me.page_length + ' to ' + ((me.data_length > (me.cur_page * me.page_length))?(me.cur_page * me.page_length):me.data_length) + ' of ' + me.data_length);
				me.run(true,true);
			},
		});
		$(me.wrapper).find('.list-paging-area').addClass('hide');
	},
	update_footer:function(){
		var me = this;
		var filters = me.filter_list.default_filters.concat(me.filter_list.get_filters())
		return frappe.call({
			method: me.method || 'frappe.desk.query_builder.runquery',
			type: "GET",
			freeze: (me.freeze != undefined ? me.freeze : true),
			args: {
				doctype: me.doctype,
				fields: ["count(*) as number"],
				filters: filters,
			},
			callback: function (r) {
				r.values = me.get_values_from_response(r.message);
				me.data_length = r.values[0]["number"]
				if (me.data_length != 0) {
					me.footer.show();
					me.last_page = Math.ceil(me.data_length / me.page_length);
					me.footer.bootstrapPaginator({currentPage: 1, totalPages: me.last_page})
				} else {
					me.footer.hide();
				}
				$('.footer-numbers').html('showing: ' + (me.cur_page - 1) * me.page_length + ' to ' + ((me.data_length > (me.cur_page * me.page_length)) ? (me.cur_page * me.page_length) : me.data_length) + ' of ' + me.data_length);
			},
			no_spinner: this.no_loading
		});
	},
	company_select:function(name,nomatch)
	{
		var me = this;
		var fields = [{
				"fieldtype": "Heading",
				"label": __("Create new Contact for a Customer or Supplier to Match"),
				"fieldname": "Option1"
				},
				{
					"fieldtype": "Button",
					"label": __("Create new Contact"),
					"fieldname":"newcontact"
				},
				{
				"fieldtype": "Heading",
				"label": __("Replace Email on Contact"),
				"fieldname": "Option2"
				},
				{
					"fieldtype": "Button",
					"label": __("Update Existing Contact"),
					"fieldname":"updatecontact"
				}
				];
		if (!nomatch) {
			fields.push({
				"fieldtype": "Heading",
				"label": __("Do not Match yet"),
				"fieldname": "Option3"
				})
			fields.push({
					"fieldtype": "Button",
					"label": __("Do not Match"),
					"fieldname":"nomatch"
				})
		}
		var d = new frappe.ui.Dialog ({
			title: __("Match emails to a Company"),
			fields: fields
		});
		d.get_input("newcontact").on("click", function (frm) {
			d.hide();
			frappe.route_titles["create_contact"] = 1;
			var name_split = me.data[name]["sender_full_name"].split(' ');
			var doc = frappe.model.get_new_doc("Contact");
					frappe.route_options = {
						"email_id": me.data[name]["sender"],
						"first_name": name_split[0],
						"last_name":name_split[name_split.length-1],
						"status": "Passive"
					};
					frappe.set_route("Form", "Contact", doc.name);
		});
		d.get_input("updatecontact").on("click", function (frm) {
			d.hide();
			var name_split = me.data[name]["sender_full_name"].split(' ');
			frappe.route_titles["update_contact"] = {
						"email_id": me.data[name]["sender"]
			};
			frappe.route_titles["create_contact"] = 1;
			frappe.set_route("List", "Contact");
		});
		if (!nomatch) {
			d.get_input("nomatch").on("click", function (frm) {
				d.hide();
				frappe.call({
					method: 'inbox.email_inbox.page.email_inbox.setnomatch',
					args: {
						name: name
					}
				});
				me.data[name]["nomatch"] = 1;
				if (!nomatch) {
					me.email_open(name)
				}
			});
		}
		d.show();
	},
	email_open:function(name)
	{
		var me = this;
		var row ="";
		row = me.data[name];
		//mark email as read
		this.mark_read(this,name);
		//start of open email

		var emailitem = new frappe.ui.Dialog ({
                title: __(row["subject"]),
                fields: [{
                    "fieldtype": "HTML",
                    "fieldname": "email"
                }]
            });
		var c = me.prepare_email(row);
		emailitem.fields_dict.email.$wrapper.html( frappe.render_template("inbox_display",  {data:c}));

		me.add_reply_btn_event(emailitem, c);
		$(emailitem.fields_dict.email.$wrapper).find(".relink-link").on("click", function () {
			me.relink(name);
		});
		$(emailitem.fields_dict.email.$wrapper).find(".company-link").on("click", function () {
			me.company_select(name,true);
		});

		$(".modal-dialog").addClass("modal-lg");
		$(".modal-header").find(".modal-title").parent().removeClass("col-xs-7").addClass("col-xs-10");
		$(".modal-header").find(".text-right").parent().removeClass("col-xs-5").addClass("col-xs-2");
		emailitem.show();
	},
	add_reply_btn_event: function (emailitem, c) {
        var me = this;
        $(emailitem.fields_dict.email.$wrapper).find(".reply-link").on("click", function () {
            var name = $(this).attr("data-name");
            var last_email = c;

            // make the composer
            new frappe.views.CommunicationComposer({
                //doc: false,//me.frm.doc,
                txt: "",
                frm: false,//me.frm,
				subject: "Re: "+ c.subject,
				recipients: c.sender,
                last_email: last_email
            });
        });
    },
	relink:function(name){
		var me = this;
		var lib = "frappe.desk.doctype.communication_reconciliation.communication_reconciliation";
		var d = new frappe.ui.Dialog ({
			title: __("Relink Communication"),
			fields: [{
				"fieldtype": "Link",
				"options": "DocType",
				"label": __("Reference Doctype"),
				"fieldname": "reference_doctype",
				"reqd": 1,
				"get_query": function() {
				return {
						"query": lib +".get_communication_doctype"
					}
				}
			},
				{
					"fieldtype": "Dynamic Link",
					"options": "reference_doctype",
					"label": __("Reference Name"),
					"reqd": 1,
					"fieldname": "reference_name"
				},
				{
					"fieldtype": "Button",
					"label": __("Relink")
				}]
		});
		d.set_value("reference_doctype", me.data[name].reference_doctype);
		d.set_value("reference_name", me.data[name].reference_name);
		d.get_input("relink").on("click", function (frm) {
			values = d.get_values();
			if (values) {
				frappe.confirm(
					'Are you sure you want to relink this communication to ' + values["reference_name"] + '?',
					function () {
						frappe.call
						({
							method: lib + ".relink",
							args: {
								"name": name,
								"reference_doctype": values["reference_doctype"],
								"reference_name": values["reference_name"]
							},
							callback: function (frm) {
								$(me.wrapper).find(".row-named[data-name="+name+"]").find(".reference-document")
									.html(values["reference_name"])
								.attr("href",'#Form/'+values["reference_doctype"]+ '/'+values["reference_name"])
								.attr("title","Linked Doctype: "+values["reference_doctype"]);
								d.hide();
								return false;
							}
						})
					},
					function () {
						show_alert('Document not Relinked')
					}
				)
			}
		});
		d.show();
	},
	run:function(more,footer) {
		var me = this;
		me.start = (me.cur_page-1)*me.page_length
		if (!footer) {
			this.update_footer()
		}
		this._super(more)
	},
	prepare_email:function(c){
		var me = this;
		frappe.call({
			method:'inbox.email_inbox.page.email_inbox.get_email_content',
			args:{
				doctype:"Communication",
				name:c.name
			},
			async:false,
			callback:function(r){
				c.attachments =r["message"][0];
				c.content = r["message"][1];
					}
		});
		c.doctype ="Communication";

        c.comment_on = comment_when(c.actualdate);


        if (c.attachments && typeof c.attachments === "string")
            c.attachments = JSON.parse(c.attachments);

        if (!c.comment_type)
            c.comment_type = "Email"

		c.comment = c.content
            if (c.comment_type == "Email") {
                c.comment = c.comment.split("<!-- original-reply -->")[0];
                c.comment = frappe.utils.strip_original_content(c.comment);
                c.comment = frappe.dom.remove_script_and_style(c.comment);

                c.original_comment = c.comment;
                c.comment = frappe.utils.toggle_blockquote(c.comment);
            }


            if (!frappe.utils.is_html(c.comment)) {
                c.comment_html = frappe.markdown(__(c.comment));
            } else {
                c.comment_html = c.comment;
                c.comment_html = frappe.utils.strip_whitespace(c.comment_html);
            }



            // bold @mentions
            if (c.comment_type === "Comment") {
                c.comment_html = c.comment_html.replace(/(^|\W)(@\w+)/g, "$1<b>$2</b>");
            }



		return c

	},
    init_select_all: function () {
        var me = this;

		$(".list-select-all").on("click", function () {
			$(me.wrapper).find('.list-delete').prop("checked", $(this).prop("checked"));
			me.toggle_actions();
		});

		$(me.wrapper).on("click", ".list-delete", function (event) {
			me.toggle_actions();

			// multi-select using shift key
			var $this = $(this);
			if (event.shiftKey && $this.prop("checked")) {
				var $end_row = $this.parents(".list-row");
				var $start_row = $end_row.prevAll(".list-row")
					.find(".list-delete:checked").last().parents(".list-row");
				if ($start_row) {
					$start_row.nextUntil($end_row).find(".list-delete").prop("checked", true);
				}
			}
		});

		// after delete, hide delete button

		$(me.wrapper).on("render-complete", function () {
			me.toggle_actions();
		});

    },
	render_buttons: function(){
		var me = this;

		me.wrapper.page.add_action_item("Delete",function(){me.delete_email(me)});
		me.wrapper.page.add_action_item("Mark as UnRead",function(){me.mark_unread(me)});
		me.wrapper.page.add_action_item("Mark as Read",function(){me.mark_read(me)});

		/*
		me.wrapper.page.add_menu_item("menu item1",function(){console.log("hi")},true)



		me.wrapper.page.add_action_icon("icon-download",function(){console.log("hi")})

		me.wrapper.page.set_primary_action("primary action",function(){console.log("primary action")},"icon-inbox","working label")
		me.wrapper.page.set_secondary_action("secondary action",function(){console.log("secondary action")},"icon-inbox","working label")


		me.download = me.wrapper.page.add_field({
		//me.download = me.add_field({
						parent:$(".page-actions"),
						fieldname: "download",
						label: __("Download"),
						fieldtype: "Button",
						icon: "icon-angle-double-left"
					});
		me.download.$input.on("click", function() {

		});
*/
/*
		 var d = me.wrapper.page.add_field({
						fieldname: "download",
						label: __("Download"),
						fieldtype: "Select",
			 			options: ["Customer","Supplier"]
		})

var link = me.wrapper.page.add_field({
				fieldtype: "Link",
				options: "DocType",
				label: __("Reference Doctype"),
				fieldname: "reference_doctype",
				get_query: function () {
					return
					{
						query: ["Customer","Supplier"]//lib + ".get_communication_doctype"
					}
				}
})
var link = me.wrapper.page.add_field({
					fieldtype: "Dynamic Link",
					options: "reference_doctype",
					label: __("Reference Name"),
					fieldname: "reference_name"
				})

*/
		
	},

    toggle_actions: function () {
        var me = this;
        if (me.wrapper.page.main.find(".list-delete:checked").length) {
            //show buttons
			$(me.wrapper.page.actions_btn_group).show()
        } else {
            //hide button
			$(me.wrapper.page.actions_btn_group).hide()
        }
    },
	delete_email:function(me){
		//could add flag to sync deletes but not going to as keeps history
		var names = me.action_checked_items('.data("name")')
		me.action_checked_items('.parent()[0].remove()')
		me.update_local_flags(names,"deleted","1")
	},
	mark_unread:function(me){
		var names = me.action_checked_items('.data("name")')
		me.create_flag_queue(names,"-FLAGS","(\\SEEN)","seen")
		me.action_checked_items('.css("font-weight", "BOLD")')
		me.update_local_flags(names,"seen","0")
	},
	mark_read:function(me,name){
		if (!name) {
			var names = me.action_checked_items('.data("name")')
			me.action_checked_items('.css("font-weight", "normal")')
		} else{
			var names = [name]
			$(".row-named").filter("[data-name="+name+"]").css("font-weight", "normal")
		}
		me.create_flag_queue(names,"+FLAGS","(\\SEEN)","seen")
		me.update_local_flags(names,"seen","1")

	},
	create_flag_queue:function(names,action,flag,field){
		frappe.call({
			method: 'inbox.email_inbox.page.email_inbox.create_flag_queue',
			args:{
				names:JSON.stringify(names),
				action:action,
				flag:flag,
				field:field
			}
		})
	},
	update_local_flags:function(names,field,val){
		frappe.call({
			method: 'inbox.email_inbox.page.email_inbox.update_local_flags',
			args:{
				names:JSON.stringify(names),
				field:field,
				val:val
			}
		})
		$('.list-delete:checked').prop( "checked", false );
	},
	get_checked_items: function() {
		return $.map(this.wrapper.page.main.find('.list-delete:checked'), function(e) {
			return $(e).parents(".doclist-row").data('name');
		});
	},
	action_checked_items: function(action) {
		return $.map(this.wrapper.page.main.find('.list-delete:checked'), function(e) {
			return eval('$(e).parents(".doclist-row")'+action);
		});
	},
	///unused////////////////////////////
	add_field: function(df) {
		var f = frappe.ui.form.make_control({
			df: df,
			only_input: df.fieldtype!="Check",
		})
		f.refresh();
		$(f.wrapper)
			.addClass('col-md-2')
			.attr("title", __(df.label)).tooltip();
		f.$input.addClass("input-sm").attr("placeholder", __(df.label));

		if(df.fieldtype==="Check") {
			$(f.wrapper).find(":first-child")
				.removeClass("col-md-offset-4 col-md-8");
		}

		if(df.fieldtype=="Button") {
			$(f.wrapper).find(".page-control-label").html("&nbsp;")
			f.$input.addClass("btn-sm").css({"width": "100%", "margin-top": "-1px"});
		}

		if(df["default"])
			f.set_input(df["default"])
		this.fields_dict[df.fieldname || df.label] = f;
		return f;
	},
	///unused////////////////////////////
	notifyUser:function () {
		frappe.utils.notify("subject","body text here",{},function(){console.log("hi")})
	}
});
