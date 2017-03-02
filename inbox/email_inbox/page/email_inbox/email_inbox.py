from __future__ import unicode_literals

import frappe

def get_context(context):
	context.list_settings = frappe.cache().hget('_list_settings', '{0}::{1}'.format(frappe.session.user + "inbox", frappe.session.user)) or {}
