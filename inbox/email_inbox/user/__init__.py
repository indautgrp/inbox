import frappe

def user_validate(self, method=None):
	force_user_email_update(self)
	user_emails_to_permissions(self)
	get_awaiting_password(self)
	
def force_user_email_update(self):
	for user_email in self.user_emails:
		if not user_email.email_id:
			user_email.email_id = frappe.db.get_value("Email Account",{"name":user_email.email_account},"email_id")
			
def user_emails_to_permissions(self, method=None):
	if frappe.session.user == "Administrator" or "System Manager" in frappe.get_roles():
		from frappe.core.page.user_permissions.user_permissions import get_permissions
	
		permissions = set([x.defvalue for x in get_permissions(self.name, "Email Account")])
		user_emails = set([x.email_account for x in self.user_emails])
	
		# compare vs user emails
		add = user_emails - permissions
		remove = permissions - user_emails
	
		# set the difference
		for r in remove:
			frappe.permissions.remove_user_permission("Email Account", r, self.name)
		for a in add:
			frappe.permissions.add_user_permission("Email Account", a, self.name, with_message=True)

def get_awaiting_password(self):
	ask_pass_update()

#email account
def push_email_to_user_emails(self, method=None):
	if self.awaiting_password:
		# push values to user_emails
		frappe.db.sql("""UPDATE `tabUser Emails` SET awaiting_password = 1
					  WHERE email_account = %(account)s""", {"account": self.name})
	else:
		frappe.db.sql("""UPDATE `tabUser Emails` SET awaiting_password = 0
								  WHERE email_account = %(account)s""", {"account": self.name})
	ask_pass_update()

def ask_pass_update():
	# update the sys defaults as to awaiting users
	from frappe.utils import set_default
	users = frappe.db.sql("""select DISTINCT(parent)
    				from `tabUser Emails`
    				where awaiting_password = 1""", as_list=1)

	password_list = []
	for u in users:
		password_list.append(u[0])
	set_default("email_user_password", u','.join(password_list))

#for login
@frappe.whitelist()
def has_email_account(email):
	return frappe.get_list("Email Account", filters={"email_id": email})

@frappe.whitelist(allow_guest=False)
def get_email_awaiting(user):
	waiting = frappe.db.sql("""select email_account,email_id
		from `tabUser Emails`
		where awaiting_password = 1
		and parent = %(user)s""",{"user":user},as_dict=1)
	if waiting:
		return waiting
	else:
		frappe.db.sql("""update `tabUser Emails`
	    		set awaiting_password =0
	    		where parent = %(user)s""",{"user":user})
		return False
	#return frappe.get_all("User Emails",filters={"awaiting_password": 1,"parent":user})

@frappe.whitelist(allow_guest=False)
def set_email_password(email_account,user,password):
	account = frappe.get_doc("Email Account",
				email_account)
	if account.awaiting_password:
		account.set("awaiting_password",0)
		account.set("password",password)
		try:
			validate = account.validate()
			save= account.save(ignore_permissions=True)
			frappe.db.sql("""update `tabUser Emails` set awaiting_password = 0
				where email_account = %(account)s""",{"account": email_account})
			ask_pass_update()
		except Exception, e:
			frappe.db.rollback()
			return False
	return True

