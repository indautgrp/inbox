import frappe

def execute():
	try:
		frappe.get_doc("Page", "Email Inbox").delete()
	except:
		pass
	