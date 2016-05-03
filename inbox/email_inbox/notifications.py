from __future__ import unicode_literals
import frappe

def get_notification_config():
	return {
		"for_doctype": {
			"Email Inbox": "inbox.email_inbox.notifications.get_unread_emails"
		},
		"for_module_doctypes": {
			"Email Inbox": "inbox.email_inbox.notifications.get_unread_emails"
		},
		"for_module": {
			"Email Inbox": "inbox.email_inbox.notifications.get_unread_emails"
		}
	}
@frappe.whitelist()
def get_unread_emails():
	return 5