from __future__ import unicode_literals
import frappe
from inbox.install import link_communications_contacts

def execute():
	frappe.db.sql("update tabCommunication set timeline_doctype=null,timeline_name=null,timeline_label=null where communication_type = 'Communication' and communication_medium = 'Email'")
	link_communications_contacts.link_communications_contacts()