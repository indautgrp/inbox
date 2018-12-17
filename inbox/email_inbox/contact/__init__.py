import frappe


def contact_update_communication_ref(self, method=None):
	origin_communication = frappe.db.sql("select name, sender,recipients,sent_or_received from `tabCommunication`",
	                                     as_dict=1)

	if self.email_id:
		self.email_id = self.email_id.strip().lower()
		if self.email_id == "":
			self.email_id = None
		comm = frappe._dict({"email_id": self.email_id,
		                     "name": self.name,
		                     "supplier": self.supplier,
		                     "supplier_name": self.supplier_name,
		                     "customer": self.customer,
		                     "customer_name": self.customer_name,
		                     "user": self.user,
		                     "organisation": self.organisation
		                     })
		for communication in origin_communication:
			sender = communication.sender
			recipients = communication.recipients
			if comm.email_id:
				if (sender and communication.sent_or_received == "Received" and sender.find(comm.email_id) > -1) or (
						recipients and communication.sent_or_received == "Sent" and recipients.find(
						comm.email_id) > -1):
					if sum(1 for x in [comm.supplier, comm.customer, comm.user, comm.organisation] if x) > 1:
						frappe.db.sql("""update `tabCommunication`
								set timeline_doctype = %(timeline_doctype)s,
								timeline_name = %(timeline_name)s,
								timeline_label = %(timeline_label)s
								where name = %(name)s""", {
							"timeline_doctype": "Contact",
							"timeline_name": comm.name,
							"timeline_label": self.name,
							"name": communication.name
						})

					elif comm.supplier:
						# return {"supplier": comm.supplier, "customer": None}
						frappe.db.sql("""update `tabCommunication`
								set timeline_doctype = %(timeline_doctype)s,
								timeline_name = %(timeline_name)s,
								timeline_label = %(timeline_label)s
								where name = %(name)s""", {
							"timeline_doctype": "Supplier",
							"timeline_name": comm.supplier,
							"timeline_label": comm.supplier_name,
							"name": communication.name
						})

					elif comm.customer:
						# return {"supplier": None, "customer": comm.customer}
						frappe.db.sql("""update `tabCommunication`
								set timeline_doctype = %(timeline_doctype)s,
								timeline_name = %(timeline_name)s,
								timeline_label = %(timeline_label)s
								where name = %(name)s""", {
							"timeline_doctype": "Customer",
							"timeline_name": comm.customer,
							"timeline_label": comm.customer_name,
							"name": communication.name
						})
					elif comm.user:
						# return {"supplier": None, "customer": comm.customer}
						frappe.db.sql("""update `tabCommunication`
								set timeline_doctype = %(timeline_doctype)s,
								timeline_name = %(timeline_name)s,
								timeline_label = %(timeline_label)s
								where name = %(name)s""", {
							"timeline_doctype": "User",
							"timeline_name": comm.user,
							"timeline_label": comm.user,
							"name": communication.name
						})
					elif comm.organisation:
						frappe.db.sql("""update `tabCommunication`
								set timeline_doctype = %(timeline_doctype)s,
								timeline_name = %(timeline_name)s,
								timeline_label = %(timeline_label)s
								where name = %(name)s""", {
							"timeline_doctype": "Organisation",
							"timeline_name": comm.organisation,
							"timeline_label": comm.organisation,
							"name": communication.name
						})


def match_email_to_contact(doc, method=None):
	if doc.communication_type == "Communication":
		origin_contact = frappe.db.sql(
			"select name,trim(email_id) as email_id,supplier,supplier_name, customer,customer_name,user,organisation from `tabContact` where email_id <>''",
			as_dict=1)
		for comm in origin_contact:
			if comm.email_id:
				if (doc.sender and doc.sent_or_received == "Received" and doc.sender.find(comm.email_id) > -1) or (
								doc.recipients and doc.sent_or_received == "Sent" and doc.recipients.find(
							comm.email_id) > -1):
					if sum(1 for x in [comm.supplier, comm.customer, comm.user, comm.organisation] if x) > 1:
						doc.db_set("timeline_doctype", "Contact")
						doc.db_set("timeline_name", comm.name)
						doc.db_set("timeline_label", doc.name)

					elif comm.supplier:
						doc.db_set("timeline_doctype", "Supplier")
						doc.db_set("timeline_name", comm.supplier)
						doc.db_set("timeline_label", comm.supplier_name)

					elif comm.customer:
						doc.db_set("timeline_doctype", "Customer")
						doc.db_set("timeline_name", comm.customer)
						doc.db_set("timeline_label", comm.customer_name)
					elif comm.user:
						doc.db_set("timeline_doctype", "User")
						doc.db_set("timeline_name", comm.user)
						doc.db_set("timeline_label", comm.user)
					elif comm.organisation:
						doc.db_set("timeline_doctype", "Organisation")
						doc.db_set("timeline_name", comm.organisation)
						doc.db_set("timeline_label", comm.organisation)
					else:
						doc.db_set("timeline_doctype", None)
						doc.db_set("timeline_name", None)
						doc.db_set("timeline_label", None)
