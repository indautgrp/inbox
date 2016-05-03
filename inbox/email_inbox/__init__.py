import frappe
from frappe import msgprint

@frappe.whitelist()
def tester(doc,method):
	msgprint("victory")